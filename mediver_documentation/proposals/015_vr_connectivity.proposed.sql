-- 015_vr_connectivity  (PROPOSED. Not applied. Not in backend/migrations/, so no runner will pick it up.)
-- Design: mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md
--
-- What it adds, for the dashboard <-> Quest 3 link:
--   devices         a headset that has paired at least once
--   assignments     "Send to headset": one locked plan for one trainee, with its pairing code
--   device_tokens   the bearer token a headset holds after pairing (hashed, revocable, 30 days)
--   run_reports     every report a headset uploads, stored verbatim, and whether it has been scored
--
-- Purely additive: nothing existing is altered. Depends on 013 (plans, attempts, assessment_results) and
-- on set_updated_at() from 007. No row is inserted by this file.
--
-- Codes and tokens are stored as SHA-256 hashes only; the plain value exists once, in the response that
-- created it.
--
-- ROLLBACK (only while the tables are empty, or after exporting them):
--   DROP TABLE IF EXISTS run_reports;  DROP TABLE IF EXISTS device_tokens;
--   DROP TABLE IF EXISTS assignments;  DROP TABLE IF EXISTS devices;

-- ---------------------------------------------------------------------------
-- 1. devices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id     TEXT NOT NULL UNIQUE,            -- the headset's own id (SystemInfo.deviceUniqueIdentifier or a GUID)
    name          TEXT NOT NULL DEFAULT '',
    app_version   TEXT NOT NULL DEFAULT '',
    last_seen_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. assignments — one locked plan sent to one trainee
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id          UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    resident_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,   -- the learner, or the supervising instructor
    session_id       UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- What the headset is told. Defaults to the plan's own mode (training -> Practice, assessment -> Exam).
    headset_mode     TEXT NOT NULL CHECK (headset_mode IN ('Guided', 'Practice', 'Exam')),

    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paired', 'running', 'reported', 'expired', 'cancelled')),

    -- The pairing code: hash only, 10-minute life, used once.
    code_hash        TEXT,
    code_expires_at  TIMESTAMPTZ,
    code_consumed_at TIMESTAMPTZ,

    device_id        UUID REFERENCES devices(id) ON DELETE SET NULL,  -- the headset that redeemed the code
    paired_at        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT assignments_pending_has_code CHECK (status <> 'pending' OR (code_hash IS NOT NULL AND code_expires_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_assignments_resident ON assignments(resident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_plan ON assignments(plan_id, created_at DESC);
-- Two live codes can never collide: the code alone identifies the assignment when it is typed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_live_code ON assignments(code_hash) WHERE status = 'pending';
-- A plan is out for performance at most once at a time (013: a plan backs one performance).
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_open_per_plan ON assignments(plan_id) WHERE status IN ('pending', 'paired', 'running');

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON assignments;
CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Resident reads own assignments" ON assignments;
CREATE POLICY "Resident reads own assignments" ON assignments
    FOR SELECT USING (resident_id = auth.uid());
DROP POLICY IF EXISTS "Supervisor reads learner assignments" ON assignments;
CREATE POLICY "Supervisor reads learner assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            WHERE cm.user_id = assignments.resident_id AND c.owner_id = auth.uid()
        )
    );
-- No client-role write policy: assignments are created and advanced by the backend only.

-- ---------------------------------------------------------------------------
-- 3. device_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_device ON device_tokens(device_id);
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;          -- backend only: no policy at all
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. run_reports — what the headset uploaded, verbatim
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS run_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
    run_id          TEXT NOT NULL,                  -- the headset's SessionData.SessionID
    attempt_id      UUID REFERENCES attempts(id) ON DELETE SET NULL,
    report_revision INTEGER NOT NULL CHECK (report_revision >= 1),
    outcome         TEXT NOT NULL CHECK (outcome IN ('Completed', 'Abandoned', 'InProgress')),
    schema_version  INTEGER NOT NULL,
    payload         JSONB NOT NULL,                 -- the RunReport exactly as received

    -- Scoring is the backend's, from the facts in the payload. The headset's own totals stay in `payload`.
    scoring_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (scoring_status IN ('pending', 'scored', 'awaiting_inputs', 'not_scored')),
    scoring_note    JSONB NOT NULL DEFAULT '[]'::jsonb,   -- e.g. what an awaiting_inputs report lacks

    received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_run_reports_run UNIQUE (assignment_id, run_id)
);
CREATE INDEX IF NOT EXISTS idx_run_reports_attempt ON run_reports(attempt_id);
CREATE INDEX IF NOT EXISTS idx_run_reports_status ON run_reports(scoring_status) WHERE scoring_status IN ('pending', 'awaiting_inputs');

DROP TRIGGER IF EXISTS trg_run_reports_updated_at ON run_reports;
CREATE TRIGGER trg_run_reports_updated_at
    BEFORE UPDATE ON run_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE run_reports ENABLE ROW LEVEL SECURITY;      -- raw device payloads: backend only, no policy
