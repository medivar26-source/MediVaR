# Cross-device connectivity and production rollout — headset, dashboard, backend on different machines and networks

Written 2026-11-04, the day the loop was proven end to end on one PC (`handoff.md`, `23_VR_CONNECTIVITY_DESIGN.md`).
This document answers three questions the owner asked next: how the connection works when the headset and the dashboard
are on different devices, how it survives an organisation's Wi-Fi and firewall, and how it is taken to production.
It is a plan. Nothing in it has been provisioned; the repo rules stand (no `.env*` edits, no migrations, no Supabase
connection, no commit) until the owner decides.

---

## 1. The one fact everything rests on

**The headset and the dashboard never talk to each other.** Both talk to the backend, and only to the backend
(`23_VR_CONNECTIVITY_DESIGN.md` §1; `10_VR_INTEGRATION.md` "As built"). The dashboard mints a six-digit code through
`POST /assignments`; the headset types it into `POST /devices/pair` and receives a token and the plan; the headset
uploads the run with `PUT /assignments/{id}/runs/{runId}/report`; the dashboard reads the result through `/results`.

So "two different devices" is already solved architecturally. The only question is **where the backend lives, and
whether both devices can reach it.** Today the answer is "on the same PC, over plain http" — the one assumption that
has to change, and it lives in exactly one place on the headset: `_baseUrl` in `Assets/Resources/ConnectSettings.asset`
(`http://localhost:8001/api/v1`). Everything below is about replacing that one line with an address both devices can
reach from any network, and hardening what is around it.

What already fits production and is **not** redesigned here (`core/connect/pairing.py`, `services/connect_service.py`,
Unity `Systems/Connect/`):

| Already built | Where |
|---|---|
| Bearer token per device, stored hashed, 30-day life, revoked by re-pairing; one-time code, 10-minute life, 429 on brute force | `pairing.py` `CODE_TTL` / `TOKEN_TTL`, `devices`/`device_tokens` tables |
| Headset refuses plain http in a release build at two levels: the service's URL judge (`ConnectEndpoints.Judge`) and Unity's own `insecureHttpOption = DevelopmentOnly` (authored by `ConnectSettingsBuilder`) | Unity Connect runtime + `ProjectSettings.asset` |
| Disk-backed outbox with exponential backoff; 401 holds for re-pair; 403/404/409/410/422 poison; the plan is cached on the device, so a run finishes offline and uploads later | `ReportOutbox.cs`, `ConnectService.cs` |
| Idempotent report ingest keyed on run id and revision; one run per plan; `schemaVersion` on every message | `ingest_report`, `RunReportRules` |
| Clock skew carried in the report (`deviceClockOffsetSeconds`) | `RunReportAssembler` |

---

## 2. Why the current LAN pilot breaks inside an organisation

The pilot recipe in `23` §12 — backend on a laptop, `--host 0.0.0.0`, Windows firewall opened, headset given the
laptop's Wi-Fi IP on port 8000/8001 — works at a desk and fails in a hospital or university for five independent
reasons. Each one alone is enough.

| Mechanism on enterprise Wi-Fi | What the headset sees | Why it is common |
|---|---|---|
| **Client (AP) isolation** on guest and often on staff SSIDs: devices on the Wi-Fi cannot reach each other | `No connection` — the laptop's IP never answers | Default on guest networks; standard hardening elsewhere |
| **Egress filtering**: only 80/443 (sometimes only 443) allowed out, often only to allow-listed FQDNs | A port 8000/8001 address is dropped | Default on managed networks |
| **TLS inspection / corporate proxy**: the firewall terminates HTTPS and re-signs with the organisation's CA | Certificate error unless the headset trusts that CA | Common in hospitals and corporates |
| **Captive portal** on guest Wi-Fi | Every request answers 200 with an HTML login page until someone accepts it in a browser | Universal on guest networks |
| **802.1X (WPA2/3-Enterprise)** with per-user credentials | The headset needs an enterprise Wi-Fi profile, normally pushed by MDM | Staff networks |

Two consequences follow. **Nothing may depend on devices seeing each other on the LAN** (no mDNS, no IP typed from a
laptop, no discovery). And **the backend must be reachable on port 443 under a DNS name**, because that is the only
thing every organisation's firewall lets out.

---

## 3. Topology: one recommendation, two exceptions

### 3.1 Recommended — backend on a public HTTPS endpoint

Run the FastAPI backend as a container (the `backend/Dockerfile` already builds it and already runs **without**
`--reload`) on a managed platform that terminates TLS for a custom domain, and the Next.js dashboard likewise. Both
devices then need exactly one thing from any network: **outbound TCP 443 to one FQDN**. That passes every firewall that
allows web browsing, needs no inbound rule, no LAN visibility, no discovery, and works from a phone hotspot when a site's
Wi-Fi is hopeless. It adds no new class of dependency: Supabase (auth, database, storage) is already a cloud service the
backend cannot run without.

```
  Quest (any Wi-Fi) ──443──▶ api.<domain>  ──▶ FastAPI container ──▶ Supabase (Postgres, Auth, Storage)
  Browser (any)     ──443──▶ app.<domain>  ──▶ Next.js             ──▶ api.<domain>
```

Suitable managed hosts (all take the existing Dockerfile and give a managed certificate on a custom domain): Azure
Container Apps, AWS App Runner, Google Cloud Run, Fly.io, Render. The `k8s/` manifests remain the path for a cluster
later; today they are Deployments and Services on port 80 with **no Ingress and no TLS**, so they are not a production
deployment as they stand (§5).

Choose the hosting **region** together with the hospital: trainee display names are personal data even though patient
labels are synthetic (`CasePlanPatient.label`), so residency is a decision, not a default (§9).

### 3.2 Exception A — on-premise server (data residency forbids cloud)

A server or VM in the organisation's data centre. It needs: an internal DNS name; a certificate the Quest trusts
(simplest: a **public** name such as `api-<site>.<domain>` resolving to the internal address, with a public-CA
certificate obtained by DNS-01 — a private CA works only if that CA is pushed to every headset by MDM); a firewall rule
from the headset VLAN to the server on 443; and **self-hosted Supabase**, because the backend's auth, database and
storage are Supabase. The last item is the real cost: it is a product in its own right to operate (Postgres, Auth,
Storage, backups), and `12_SECURITY…` and `14_DEPLOYMENT…` assume the managed service. Offer this only when a site's
policy leaves no choice, and price it honestly.

### 3.3 Exception B — pilots where IT will open nothing

For a demo day on a hostile network: either an **outbound-only tunnel** from the laptop that hosts the backend
(Cloudflare Tunnel or Tailscale give the laptop a public HTTPS name with no inbound port), or a **travel router / phone
hotspot** that the laptop and the headset both join. Both are development-build paths (the tunnel can give HTTPS, the
hotspot gives plain http on a private LAN) and neither is a production route.

---

## 4. Network requirements sheet for a site's IT (hand this over as is)

> MediVeR XR needs **outbound HTTPS only**. No inbound ports, no port forwarding, no proxy configuration, no device
> discovery on the LAN. Headsets and browsers must be able to reach the following hosts on **TCP 443**:
>
> | Host | Who needs it | Purpose |
> |---|---|---|
> | `api.<domain>` | Headsets and browsers | MediVeR API (pairing, plans, reports) |
> | `app.<domain>` | Browsers | MediVeR dashboard |
> | `<project>.supabase.co` | Browsers (password reset, auth) and the backend if hosted on site | Authentication, database |
> | Meta Quest services (`*.oculus.com`, `*.meta.com`, `graph.facebook.com` — per Meta's current published list) | Headsets | Device sign-in, updates, time sync |
> | NTP (UDP 123) or Meta's time service | Headsets | Correct clock — token and code expiry depend on it |
>
> **TLS inspection:** please add `api.<domain>` to the inspection bypass list. The headset app validates the server
> certificate against the system trust store and does **not** accept a re-signed certificate. If bypass is not
> possible, the organisation's root CA must be installed on each headset through your MDM before the app is used.
>
> **Captive portals:** headsets must be on an SSID that does not require a browser sign-in, or be signed in before
> use. (The app's portal detection is a planned change, section 6.2; until it ships the headset's status chip can
> show connected while a portal is intercepting traffic.)
>
> **802.1X:** if the SSID is WPA-Enterprise, provision the headset Wi-Fi profile through MDM.

Why the app does not pin certificates: a pinned certificate turns every certificate renewal and every TLS-inspection
site into an outage with a cryptic error; the system trust store plus a public CA is the standard that Meta's own
services rely on. The cost is that a re-signing proxy breaks the connection — which is why the sheet asks for bypass.

---

## 5. Hardening findings in the repo today, and what production needs

Findings from reading the repo on 2026-11-04 (nothing changed):

| Found | Production requirement |
|---|---|
| `docker-compose.yml` runs the backend with `--reload` and CORS `["http://localhost:3000"]`; the frontend with `npm run dev` | Local only — fine. Production never runs `--reload` (the Dockerfile is already correct). On this PC the reloader **failed silently** on 2026-11-04: it logged "Reloading…" and never restarted the worker, so the old code served requests. |
| `k8s/`: Deployments + Services on port 80, no Ingress, no TLS, images `:latest` | Add an Ingress with a managed certificate, pin image tags to the release version, set resource limits, readiness on `/health` |
| `core/config.py`: `BACKEND_CORS_ORIGINS` is the only network setting | Set it to the dashboard's exact origin per environment; add `TrustedHostMiddleware` with the API FQDN; set uvicorn `--proxy-headers --forwarded-allow-ips` for the platform's load balancer so client addresses are real (`pairing.py` throttles wrong codes per client key: address and device id; behind a load balancer without forwarded headers every headset shares one address) |
| `/health` returns static JSON | Keep it shallow for the headset's 30-second probe; add `/ready` with a database probe for the platform (as `14` already asks) |
| `.env.example` names the Supabase service-role key and JWT secret as values the backend expects (a template with placeholders, nothing committed) | Secrets live in the platform's secret store, never in an image or a committed file; one Supabase project **per environment** (staging, production) with its own redirect URLs (`FRONTEND_URL`) |
| Device pairing uses the device's own id (`SystemInfo.deviceUniqueIdentifier`) | Fine; add an admin view of paired devices (table exists) and a revoke action for a lost headset |
| Logging is uvicorn access lines | Structured request logs with a request id, error reporting (Sentry or the platform's), uptime monitor on `/health`, alert on 5xx rate and on `awaiting_inputs`/poison counts |
| No TLS termination anywhere in the repo | TLS at the platform edge; HSTS; redirect 80→443; the API never listens on plain http in production |

The security model that already exists (`12_SECURITY_AUDIT_AND_COMPLIANCE.md`; hashed device tokens; RLS; service-role
key server-only) is kept as is.

---

## 6. Headset: how it learns the server address, and what to add

### 6.1 Provisioning the address (replace the one hard-coded line)

1. **Per-environment settings assets** — `ConnectSettings.dev.asset` (this PC / LAN pilot, http allowed),
   `ConnectSettings.staging.asset` and `ConnectSettings.prod.asset` (https FQDNs). The build selects one by build
   profile / scripting define, and the production APK ships with the production FQDN baked in: nobody types an address
   in a theatre. `ConnectSettingsBuilder` already authors the asset and the cleartext option; extend it to write the
   three.
2. **One override channel for pilots** — in order of preference: **MDM managed configuration** (Android managed app
   configuration read through `RestrictionsManager`, which every Quest MDM — Meta Quest for Business, ArborXR,
   ManageXR — can push per site), or a **server field behind the gateway's STATUS key** that stores an override in
   `PlayerPrefs` and shows the active address in the status chip. The chip already prints where the pairing stands;
   it should also print the host it is talking to.
3. **Never discovery.** No mDNS, no broadcast, no "find my laptop": §2 says why none of them survive a managed network.

### 6.2 Gaps found in the connectivity code (to build before staging)

- **Captive-portal detection.** `ConnectService.CheckHealth` parses the body inside a `try` and treats any 2xx as
  online, so a portal's HTML login page would turn the chip **green**. Require a parsed `HealthResponse` with
  `status == "ok"` and `service == "mediver-api"`; anything else is "Intercepted — sign in to the Wi-Fi", said in the
  chip's caption.
- **Clock skew.** Token and code expiry are judged by the server, but the headset shows "expires" and the report carries
  `deviceClockOffsetSeconds`. If NTP is blocked the headset clock drifts; use the `serverTimeUtc` already present in
  `/health` to compute and display the offset, and warn above a threshold.
- **Diagnostics screen** (editor-only today as `Connect ▸ E2E ▸ Report State`): a wearer-visible "Connection check"
  that does DNS, TLS, `/health`, round-trip time and the outbox count, and prints one line a site's IT can act on
  ("TLS: certificate not trusted — issuer X" is the TLS-inspection tell).
- **Refuse an unsupported `schemaVersion` at pairing** (backend `pair_device`, same `ACCEPTED_SCHEMA_VERSIONS` as the
  report check) and give the gateway chip a caption for it ("Headset app too old — update"), so a stale build is
  turned away before a run is performed, not after.
- **Proxy behaviour — test, do not assume.** Whether `UnityWebRequest` on Android honours a Wi-Fi-level proxy
  configured on the Quest is not established here. Staging acceptance (§8) includes a proxied SSID; if it fails, the
  sheet's "no proxy required" line becomes "the headset must bypass the proxy for `api.<domain>`".
- **Certificate chain — test, do not assume.** Serve the full chain (leaf + intermediate) from the edge; verify on a
  real Quest that the system trust store accepts it. A missing intermediate works in desktop browsers (they fetch it)
  and fails on devices.

---

## 7. Resilience the design already gives a bad network, and how to use it

Because the plan is cached on the device and the token lives 30 days, **a run never needs the network while the
trainee operates.** Pairing needs it once (10-minute code), and the upload needs it eventually: the outbox retries with
backoff, survives app restarts, and holds (does not poison) on 401 so a re-pair releases the backlog. Interrupted runs
are reported as Abandoned on the next launch. The honest operating guidance for a site is therefore: *pair where there
is signal, operate anywhere, and the report arrives when the headset next sees the server.*

What production adds: a visible outbox count on the manifest or status chip ("1 report waiting"), and an instructor-side
view of assignments whose last report is `awaiting_inputs` or whose device has not reported, so a stuck headset is seen
from the dashboard rather than discovered weeks later.

---

## 8. Rollout plan (production-graded)

| Phase | Where things run | Headset build | Exit criterion |
|---|---|---|---|
| **0 — proven 2026-11-04** | Backend and dashboard on one PC, http on 8001 | Editor, no headset | Code → pair → plan applied → report → `scored` (done; `handoff.md`) |
| **1 — two-device LAN pilot** | Backend on a laptop, `--host 0.0.0.0`, Windows firewall rule; dashboard on the same laptop | **Development** APK with the laptop's IP (or a hotspot / travel router when the Wi-Fi isolates clients) | A real Quest pairs, the P2/P3 gauges show the plan's figures, a hand-performed run uploads and scores; both exam and knob values arrive as measured |
| **2 — staging in the cloud, HTTPS** | Containers on the chosen platform, `staging-api.<domain>` / `staging-app.<domain>`, a **staging Supabase project**, secrets in the platform store, CORS and TrustedHost set | **Release** APK pointed at staging (http refused, so this proves the TLS path) | Acceptance suite (§8.1) passes from an actual organisation Wi-Fi; the IT sheet (§4) is confirmed against that network; proxy and certificate questions in §6.2 answered |
| **3 — production** | `api.<domain>` / `app.<domain>`, production Supabase project, monitoring, backups (point-in-time recovery on the Supabase plan), runbook, versioned releases | Signed release APK distributed through the Quest MDM (or Meta's private release channel), kiosk mode, Wi-Fi and managed configuration pushed by MDM | First cohort completes supervised runs; rollback rehearsed once (`14` "Rollback") |
| **4 — optional on-premise variant** | §3.2 | Release APK with the site FQDN via managed configuration | Same acceptance suite on the site network |

### 8.1 Acceptance suite (re-run at every phase from 2 on)

Positive path: today's proven loop, cross-device — code minted on a browser on one network, typed on a headset on
another, plan applied, run performed, report uploaded, review page "Run finished", Sessions report scored. Then the
negative cases, each with the **wording** the wearer sees checked:

| Case | Expected on the headset |
|---|---|
| Port 8001 / non-443 address | Refused by the firewall → chip "No connection"; no hang beyond `_timeoutSeconds` (10 s) |
| Captive portal SSID | Chip "Intercepted — sign in to the Wi-Fi" (after §6.2), never green |
| TLS-inspected SSID without bypass | Chip names a certificate problem; pairing refused; nothing uploaded in the clear |
| Expired or used code | 410 wording from the chip ("Code already used, ask for a new one"), keypad live again |
| Wi-Fi lost mid-run | Run continues; report queued; uploads on reconnection; outbox count visible |
| Token expired (31 days) | 401 → hold → gateway asks for a new code; backlog uploads after re-pair |
| Second headset uses a spent assignment's code | 410; the first headset's result is untouched |
| Server redeploy during a run | Upload retries with backoff; idempotent on run id; no duplicate attempt |

### 8.2 Release discipline

- Contract changes bump `schemaVersion` on both sides. Today the server checks it only on report upload
  (`contract.py` `ACCEPTED_SCHEMA_VERSIONS`, current and previous; a mismatch is a 422 the headset parks). The pair
  request carries `schemaVersion` too but `pair_device` does not judge it, so an outdated headset learns of the
  mismatch only after a run. Make pairing refuse an unsupported version (section 6.2), so the failure is **loud at
  pairing**. Keep the server backward compatible for one headset version.
- Database changes go out as source-controlled migrations before the API that needs them (`14` "Rollback").
- Every APK carries `Application.version`; it is in every report (`appVersion`) and in the pairing request, so the
  dashboard can show which build produced a result.

---

## 9. Decisions for the owner (not resolved here)

1. **Cloud or on-premise** for the first paying site, and the **hosting region** (trainee names are personal data).
2. **Platform** for the containers (Azure Container Apps / Cloud Run / App Runner / Fly / Render) and who holds the
   domain and DNS.
3. **MDM** for the headset fleet (Meta Quest for Business, ArborXR, ManageXR) — this also decides how the server
   address override and the Wi-Fi profiles are pushed.
4. **Certificate stance**: public CA plus TLS-inspection bypass (recommended), or accept per-site CA installation.
5. Whether a wearer may ever type a server address on the headset (pilot convenience vs. a theatre with no keyboard).

---

## 10. What this changes elsewhere

- `14_DEPLOYMENT_AND_OPERATIONS.md` → points here for environments, TLS and the network sheet.
- `23_VR_CONNECTIVITY_DESIGN.md` §12 → the laptop recipe is now labelled Phase 1 and points here for everything beyond it.
- Unity (`CHANGELOG.md`): no code change in this document; the §6 items are the next engineering tickets.
