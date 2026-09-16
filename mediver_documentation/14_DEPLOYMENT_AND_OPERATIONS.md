# Deployment and Operations

## Environments

Use at least:
- local (managed via root `docker-compose.yml`)
- development (Kubernetes configurations located in `k8s/`)
- staging
- production/pilot

## Database / Supabase operations

- Supabase database migrations must be source controlled.
- Database changes must be reproducible across environments.
- Destructive migrations require explicit approval.
- Backups/recovery capabilities and any external backup strategy must be considered before high-risk changes.
- Restoration/recovery procedures must be tested.

## Configuration

Separate application config, DB config, secrets, clinical-content configuration, and environment-specific URLs.

## Observability

Track API errors, assessment failures, event ingestion failures, WebSocket disconnects, slow queries, job failures, and authentication failures.

## Backups

Protect the Supabase/PostgreSQL database and important object-storage artifacts according to the deployed Supabase plan and the project recovery strategy. Test recovery procedures regularly.

## Health checks

```text
GET /health
GET /ready
```

These endpoints should not leak sensitive internals.

## Rollout

```text
Development
-> Staging
-> Internal validation
-> Clinical/pilot validation
-> Small cohort
-> Broader rollout
```

## Rollback

Each release should have a known version, migration plan, rollback/forward-fix strategy, and owner. Never leave production data in an ambiguous schema state.

## Confirmed Current Model Updates (2026-09-15)

## Confirmed operational requirement for planning

The planning workflow must preserve user work across navigation and normal page/session lifecycle. Landmark state, calculated values, resident edits, override reasons and draft plan state must not be lost during ordinary navigation.

The exact locked plan transferred to VR must be recoverable for later post-operative review. Monitoring and logging should include planning-save failures, lock/transfer failures and feedback-save failures.
