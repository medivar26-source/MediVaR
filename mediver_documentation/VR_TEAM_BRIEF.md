# Quest 3 ↔ MediVeR dashboard: brief for the VR team

Date: 2026-11-03 · Answers your plan of 2026-10-23 · Full design: `23_VR_CONNECTIVITY_DESIGN.md`

## How we connect

**Wi-Fi, then HTTPS, to the MediVeR backend.** The headset makes outbound calls only. The dashboard talks to the same backend. The two never connect to each other (no USB, Bluetooth, Link or direct LAN).

```text
Dashboard: seal plan → "Send to headset" → one-time 6-digit code (10 min)
Headset:   type code → POST /devices/pair → token + CasePlan → run → PUT report
Backend:   stores the report, scores it, shows it in Reports / Insights / resident progress
```

## The calls (base `/api/v1`, JSON, HTTPS only)

| Call | Notes |
|---|---|
| `GET /health` | no auth; `{status, service, apiVersion, serverTimeUtc}` |
| `POST /devices/pair` | `{code, deviceId, deviceName, appVersion, schemaVersion}` → `{assignmentId, token, tokenExpiresAt, casePlan}`. 404 unknown · 410 expired/used · 429 wait (`Retry-After`) |
| `GET /assignments/{id}/plan` | the CasePlan again, on resume |
| `PUT /assignments/{id}/runs/{runId}/report` | RunReport. Idempotent on `runId`; a higher `reportRevision` replaces. 401 re-pair · 422 never retry · 409 plan already has another run |

Same paths and shapes as your plan. Bearer token after pairing; token is per device, 30 days.

## What you build

1. Internet permission in the manifest; release builds HTTPS only.
2. The `Connect` package: `UnityWebRequest` transport, JSON DTOs (enums as strings, no NaN, `hasX` + `x` for optional numbers), disk-backed upload queue with backoff.
3. Gateway: send the PIN to `/devices/pair`; show "Code not recognised / expired / no connection"; "Continue offline" = practice only.
4. Apply `casePlan.values[]` to the judges by key, and to the manifest and on-screen targets. **Tolerances come from us and already include difficulty; use them as sent.**
5. Record each run: committed value per judged step, seconds per scene, warnings per scene, the three exam meters.
6. Upload a report after every run, including abandoned ones. Save on pause.
7. Keep the token in app-private storage; "Forget pairing" on the wrist menu.

## What we need added to the report

Without these, every report is stored but cannot be scored (the backend lists exactly what is missing):

- `sceneId` on each step (`"4.2"` … `"7.1"`, our scene ids), **or** send us a `stepId → sceneId` table
- `warnings` (int) on each step
- Plan keys, each with a committed value: `P3.femoralSize`, `P3.femoralRotationDeg`, `P5.gapDifferenceMm`, `P5.hkaDeg`, `P4.tibialTraySize`, `P4.trayRotationDeg`

The headset sends **facts, not a score**. We keep your `totalScore` for comparison but never use or show it.

## Questions for you

1. Confirm the six keys above, and their part numbers (P3/P4/P5 are our proposal).
2. `P4.implantSize` (display only): we send the **femoral** size. OK?
3. A plan backs one run. After a finished run, a retake needs a new plan. Acceptable?

## What we owe you

- A reachable HTTPS address. Today the backend runs on `localhost`, so a real-headset test waits on deployment. A public certificate works out of the box; a self-signed on-prem server needs pinning on your side.
- An `openapi.yaml` for `Docs/Connectivity/` once the questions above are settled.
