# Persistent plans, attempts and reports — design note (proposal)

Status: **PROPOSED. Nothing in this note is implemented or applied.** No migration has been run and no database has
been modified. The proposed SQL is in `mediver_documentation/proposals/013_plans_attempts_reports.proposed.sql`, deliberately
outside `backend/migrations/` so that no runner picks it up. Implementation of anything that depends on it waits for approval.

Origin: *Learner Mode Review (20-10-2026)*, "Fix the inconsistency where only two completed Training Mode sessions appear in
the list, while other reports are accessible through cases in Programs. Ensure sessions and reports are correctly linked".

## 1. Why this is proposed at all

The inconsistency itself is already fixed without any new table (see `LEARNER_FLOW_PLAN.md`, "Sessions and reports use one
list"): every learner-facing screen now reads one session list, and sample data is labelled and no longer shown to a real
account. What that fix cannot do is make a *real* learner's sessions have reports, because the database has nowhere to keep them.

What exists today:

| Thing | Where it lives now | Consequence |
|---|---|---|
| Scheduled sessions and rosters | DB: `sessions`, `session_residents` (007, 008, 011) | Real, persistent. Carry no score and no report. |
| Pre-operative plans | Server memory: `PLANS` in `dashboard/src/lib/data/plans.ts` | Lost on restart; not shared across instances; one array for all users. |
| Pairing PINs | Server memory: `PINS` | Same. (The `pairing_pins` table named in some comments does not exist in any migration.) |
| Attempts (a headset performance of a plan) | Sample data only (`lib/seed.ts` `SESSIONS`) | A real learner can never have one. |
| Reports | Sample data only (`REPORTS`); `getReport` also derives the planned-versus-achieved "achieved" values from the score | Not real results; must not be shown as such. |
| Scoring | `backend/core/calculations/assessment.py` exists (criterion evaluation, weighted aggregation) but is not wired to any endpoint or table | Needs a decision on who calls it (see §8). |

`backend/migrations/011` states it "does NOT add an `attempts` table … no VR/attempt pipeline exists yet to feed it", and
`resident_service.py` says no `attempts`, `assessment_results` or `skill_scores` exist. This proposal is the step those notes anticipate.

## 2. What is proposed (minimum)

Three new tables, named as in `06_DATABASE_SCHEMA.md` where it already defines them. Nothing existing is altered.

```text
users ──< plans >── cases / learner_personal_cases (exactly one)      plans ── case_versions (pin, institutional cases)
            │
            └──< attempts >── sessions (optional)                      attempts.plan_version_id = plans.locked_version_id
                    │
                    └── assessment_results (0..1 per attempt, immutable)
```

### 2.1 `plans`
- One row per plan. `owner_id` is the learner (`users.id`, cascade on user delete).
- Case reference: `case_id` (institutional) **or** `personal_case_id` (the learner's own, migration 012); a CHECK enforces exactly one.
  Built-in demo cases (`CASE_001`…) are not rows in either table, so a demo plan cannot be stored. That is the separation of demo and real data, enforced by the schema.
- `case_version_id` pins the case version the plan was made against (reproducible scoring); null for personal cases (not versioned).
- `payload` (JSONB) holds the planner state **exactly as the dashboard's `PlanPayload`** (`v1_assessment`, `v1_tibial`, `v1_femoral`, scan calibrations).
  It is not re-modelled into columns now; `06` ("Confirmed planning data requirements": landmarks, suggested vs confirmed value, override reason) is carried inside it and can be normalised later without changing this table's role.
- Lock: `status` draft → locked sets `locked_version_id`, `locked_at`, `locked_by`, `locked_snapshot` (immutable copy) and `vr_payload` (the V1 payload built at lock). A CHECK requires all or none; a trigger rejects any change to a locked plan's content.
- State shown in the UI stays **derived**, as today: `draft`, `ready` (locked), `paired` (a live PIN exists), `performed` (an attempt exists).

### 2.2 `attempts`
- One performance of one locked plan. `resident_id`, optional `session_id` (the instructor-scheduled session it belongs to), `plan_id`, `plan_version_id` (the exact snapshot consumed).
- `UNIQUE (plan_id)` keeps today's rule: one plan backs exactly one performance; to repeat a case, plan it again.
- `status` uses the lifecycle recommended in `10_VR_INTEGRATION.md`. Created and advanced by the backend/VR path only; there is no client write policy.

### 2.3 `assessment_results` (the report)
- 0..1 per attempt (`attempt_id` UNIQUE). Stores what the scorer produced: totals, pass mark and verdict, critical errors and cap, percentile, and JSONB `categories`, `parameters` (planned/achieved/tolerance/verdict), `scene_results`, `feedback`, plus the full scorer `payload` and a `scoring_version`.
- Immutable by trigger ("Never overwrite history", `11_REPORTING_ANALYTICS.md`). A re-score is a new attempt.
- The dashboard reads and displays these fields. It never computes a figure that is not stored. The current derivation of "achieved" from the total score in `getReport` is sample-data behaviour and is not carried over.

### 2.4 Deliberately not added now
`vr_events`, `clinical_measurements`, `errors`, `skill_scores`, `recommendations`, `audit_logs` and a `pairing_pins` table (all in `06`). They are needed when the headset streams events or when queryable per-skill history is required; the JSONB payloads carry the same facts until then. Adding them later is additive.

## 3. Relationships, constraints, ownership

| Rule | Mechanism |
|---|---|
| A plan belongs to one learner | `plans.owner_id`; owner policy; service check on every endpoint |
| A plan targets exactly one case | `plans_one_case` CHECK |
| A case with plans cannot be deleted from under them | `ON DELETE RESTRICT` on `case_id`, `personal_case_id`, `case_version_id` |
| A locked plan never changes | CHECK `plans_lock_complete` + trigger `plans_lock_guard` |
| A plan is performed at most once | `UNIQUE (plan_id)` on `attempts` |
| A result is written once | `UNIQUE (attempt_id)` + immutability trigger |
| Learners cannot write attempts or results | No client-role write policy; backend/VR path only |
| Who can read | Owner; the supervising instructor (`cohort_members` → `cohorts.owner_id`, the rule `resident_service._is_supervised` already uses); admins by institution at the service layer |

Row-level security follows the existing pattern (enabled, `auth.uid()` policies). As elsewhere, the backend connects directly and enforces the same rules in the service layer; the policies are defence in depth.

## 4. API changes (same style as `/cases`, `/residents`)

Learner/dashboard-facing:

```text
GET    /api/v1/plans                      own plans (state derived)               [learner]
POST   /api/v1/plans                      {case_id | personal_case_id, session_config} -> draft plan, pins case_version_id
GET    /api/v1/plans/{id}                 owner, supervising instructor
PATCH  /api/v1/plans/{id}                 {payload patch, step_timings}; 409 if locked
POST   /api/v1/plans/{id}/lock            validates the four V1 steps are complete and scales verified; writes snapshot + vr_payload; idempotent
GET    /api/v1/residents/{id}/attempts    attempts with result summary (score, passed, has_report)   [self or supervisor]
GET    /api/v1/attempts/{id}              attempt detail
GET    /api/v1/attempts/{id}/result       the stored report                                          [self or supervisor]
```

Unchanged: `GET /residents/{id}/sessions` (scheduled sessions) — the dashboard's single session list then merges scheduled sessions with real attempts instead of with sample data.

Dashboard changes that depend on this: `lib/data/plans.ts`, `startPlan`/`updatePlanPayload`/`sealTkrPlan` in `app/actions/index.ts`, `lib/data/learner-sessions.ts`, `lib/data/sessions.ts` (`getReport`), `lib/data/session-links.ts` (`hasReport`). The page code and routes stay as they are.

PIN issue and redemption are **not** part of this proposal; see §7.

## 5. Compatibility and data

- **Existing data:** nothing is migrated, backfilled or deleted. In-memory plans are not recoverable (they were never persisted). Sample data is never written to these tables.
- **Existing tables:** untouched. `sessions` and `session_residents` keep their meaning; `attempts.session_id` gives a scheduled session its real outcome. (Optionally the backend may set `session_residents.status = 'completed'` when an attempt completes — a service change, not a schema change.)
- **Before the migration is applied:** the dashboard keeps today's behaviour. It treats a 404 from `/plans` as "persistence not available", keeps plans in memory, shows no real reports, and the "Preview data" note says so. A single setting turns the new reads off again without touching the database.
- **Demo vs real:** the sample learners' sessions and reports stay in `lib/seed.ts`, are shown only to those sample ids, and are labelled "Sample". They are never merged into a real account's records.

## 6. Rollback

The migration is additive, so rollback is dropping what it added:

```sql
DROP TABLE IF EXISTS assessment_results;  DROP TABLE IF EXISTS attempts;  DROP TABLE IF EXISTS plans;
DROP FUNCTION IF EXISTS plans_lock_guard();  DROP FUNCTION IF EXISTS assessment_results_immutable();
```

This is safe while the tables are empty. Once they hold real plans or results, rolling back **destroys that data**, so it requires an export first (`pg_dump -t plans -t attempts -t assessment_results`) and explicit approval. The dashboard-side switch (§5) is the non-destructive rollback. I will not run either without being asked.

## 7. VR integration: what exists, what is missing, the smallest interface

Exists: the locked-plan JSON (`V1VrPayload`, built at seal, matches `10_VR_INTEGRATION.md`); a static session page whose live view does not move (no channel from a headset); backend assessment calculations in `core/calculations/assessment.py` (not wired).

Missing (none of it is invented here): headset authentication and PIN redemption (PINs are in server memory; no table), attempt creation, event ingestion, completion, a defined caller for scoring, and a live channel.

Smallest interface a future integration needs (not to be built now; for agreement only), following `07_API_CONTRACTS.md` and `10_VR_INTEGRATION.md`:

```text
POST /api/v1/vr/attempts                create an attempt from a redeemed pairing code -> {attempt_id, plan snapshot (vr_payload)}
POST /api/v1/vr/attempts/{id}/complete  headset submits the run (scene results, measurements, sequence numbers, idempotent)
                                        -> the backend scores it and inserts the one assessment_results row
```

The headset never sends a score, pass/fail or competency ("Client authority boundary", `10`). Everything the dashboard shows comes from `assessment_results`.

## 8. Decisions needed from you before implementation

1. **Approve the three tables** and the lock/immutability rules above, or amend them.
2. **Personal cases and RESTRICT:** a learner can delete a personal case today. With `ON DELETE RESTRICT` that delete would be refused (409) once a plan exists. Alternative: keep their plans by soft-deleting the case. Which?
3. **Who scores, and from what?** `core/calculations/assessment.py` evaluates against `assessment_criteria` and skills. Is that the scorer to wire, and what is the category/pass-mark source (the category maxima sum to 95 while scores are presented out of 100, an open item recorded in the case page code)? Until this is decided no result can be created.
4. **Pairing:** are PINs to move to a table (`pairing_pins`) in the same migration or a later one? The headset interface in §7 depends on it.
5. **Payload as JSONB** now (proposed) versus normalised planning tables from `06` now.
6. **Applying it:** when approved, should I add it to `backend/migrations/` only (you apply it), or also run it? Default: add only.

## 9. Documentation to update on implementation
`06_DATABASE_SCHEMA.md` (tables, relationships), `07_API_CONTRACTS.md` (the endpoints above), `10_VR_INTEGRATION.md` (attempt creation, plan_version link), `11_REPORTING_ANALYTICS.md` (source chain), `05_SYSTEM_ARCHITECTURE.md`, `13_TESTING_STRATEGY.md`, `17_SEED_DATA_AND_DEMO.md` (demo vs real), `LEARNER_FLOW_PLAN.md` §5, root `README.md` (migration/setup steps), and the change log.
