-- PROPOSED — NOT APPLIED. DO NOT MOVE INTO backend/migrations/ UNTIL THE DESIGN IS APPROVED.
--
-- 013_plans_attempts_reports (proposal)
-- Design: mediver_documentation/22_PERSISTENT_PLANS_ATTEMPTS_REPORTS_DESIGN.md
--
-- Purely additive: three new tables, two helper functions and their triggers.
-- No existing table, column, constraint or row is altered or read.
-- Names follow mediver_documentation/06_DATABASE_SCHEMA.md (`attempts`, `assessment_results`);
-- `plans` is new there ("Confirmed planning data requirements").
--
-- Nothing in this file inserts data. No sample, seed or historical row is ever written.
--
-- ROLLBACK (only while the tables are empty, or after exporting them — see the design note):
--   DROP TABLE IF EXISTS assessment_results;
--   DROP TABLE IF EXISTS attempts;
--   DROP TABLE IF EXISTS plans;
--   DROP FUNCTION IF EXISTS plans_lock_guard();
--   DROP FUNCTION IF EXISTS assessment_results_immutable();

-- ---------------------------------------------------------------------------
-- 1. plans — a learner's pre-operative plan for one case
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Exactly one case reference: an institutional case, or the learner's own personal case.
    -- Built-in demo cases (ids such as "CASE_001") are not rows in either table, so a demo
    -- plan can never be stored here — demo data stays out of real records by construction.
    case_id          UUID REFERENCES cases(id) ON DELETE RESTRICT,
    personal_case_id UUID REFERENCES learner_personal_cases(id) ON DELETE RESTRICT,
    -- The published case version the plan was made against (NULL for personal cases, which are not versioned).
    case_version_id  UUID REFERENCES case_versions(id) ON DELETE RESTRICT,
    CONSTRAINT plans_one_case CHECK (num_nonnulls(case_id, personal_case_id) = 1),

    workflow         TEXT NOT NULL DEFAULT 'tkr' CHECK (workflow IN ('tkr')),
    session_config   JSONB NOT NULL DEFAULT '{}'::jsonb,   -- mode, difficulty, implant design, fixation
    -- The planner's working state, stored exactly as the dashboard's PlanPayload
    -- (v1_assessment, v1_tibial, v1_femoral, scan calibrations, ...). Not re-modelled here.
    payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
    step_timings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    preset_name      TEXT,

    status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked')),
    -- Set once, at lock: the immutable snapshot and the VR payload built from it.
    locked_version_id UUID,
    locked_at        TIMESTAMPTZ,
    locked_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_snapshot  JSONB,
    vr_payload       JSONB,
    CONSTRAINT plans_lock_complete CHECK (
        (status = 'draft'  AND locked_version_id IS NULL AND locked_at IS NULL AND locked_snapshot IS NULL AND vr_payload IS NULL)
     OR (status = 'locked' AND locked_version_id IS NOT NULL AND locked_at IS NOT NULL AND locked_snapshot IS NOT NULL AND vr_payload IS NOT NULL)
    ),

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plans_owner ON plans(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_case ON plans(case_id);
CREATE INDEX IF NOT EXISTS idx_plans_personal_case ON plans(personal_case_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_plans_locked_version ON plans(locked_version_id) WHERE locked_version_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_plans_updated_at ON plans;
CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();   -- defined in 007

-- A locked plan is the contract a session is scored against: its content may not change.
CREATE OR REPLACE FUNCTION plans_lock_guard() RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'locked' AND (
           NEW.status IS DISTINCT FROM OLD.status
        OR NEW.payload IS DISTINCT FROM OLD.payload
        OR NEW.session_config IS DISTINCT FROM OLD.session_config
        OR NEW.case_id IS DISTINCT FROM OLD.case_id
        OR NEW.personal_case_id IS DISTINCT FROM OLD.personal_case_id
        OR NEW.case_version_id IS DISTINCT FROM OLD.case_version_id
        OR NEW.locked_version_id IS DISTINCT FROM OLD.locked_version_id
        OR NEW.locked_snapshot IS DISTINCT FROM OLD.locked_snapshot
        OR NEW.vr_payload IS DISTINCT FROM OLD.vr_payload
    ) THEN
        RAISE EXCEPTION 'plan % is locked and cannot be changed', OLD.id USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plans_lock_guard ON plans;
CREATE TRIGGER trg_plans_lock_guard
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION plans_lock_guard();

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages own plans" ON plans;
CREATE POLICY "Owner manages own plans" ON plans
    FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
-- Supervising instructors read (never write) their learners' plans, by the same
-- cohort_members -> cohorts.owner_id path the resident endpoints already use.
DROP POLICY IF EXISTS "Supervisor reads learner plans" ON plans;
CREATE POLICY "Supervisor reads learner plans" ON plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            WHERE cm.user_id = plans.owner_id AND c.owner_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- 2. attempts — one performance of a locked plan (headset side creates these)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- The instructor-scheduled session this attempt belongs to, when it came from one.
    session_id       UUID REFERENCES sessions(id) ON DELETE SET NULL,
    plan_id          UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    -- The exact snapshot the headset consumed (plans.locked_version_id).
    plan_version_id  UUID NOT NULL,

    mode             TEXT NOT NULL DEFAULT 'training' CHECK (mode IN ('training', 'assessment')),
    difficulty       TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    implant_design   TEXT NOT NULL CHECK (implant_design IN ('CR', 'PS')),
    fixation         TEXT NOT NULL CHECK (fixation IN ('cemented', 'cementless')),

    -- Lifecycle values are those recommended in 10_VR_INTEGRATION.md.
    status           TEXT NOT NULL DEFAULT 'created'
                     CHECK (status IN ('created', 'in_progress', 'paused', 'completed', 'submitted', 'assessed', 'failed', 'cancelled')),
    current_scene    TEXT,
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Current rule, kept: one plan backs exactly one performance; to repeat a case, plan it again.
    CONSTRAINT uq_attempts_plan UNIQUE (plan_id)
);
CREATE INDEX IF NOT EXISTS idx_attempts_resident ON attempts(resident_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);

DROP TRIGGER IF EXISTS trg_attempts_updated_at ON attempts;
CREATE TRIGGER trg_attempts_updated_at
    BEFORE UPDATE ON attempts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Resident reads own attempts" ON attempts;
CREATE POLICY "Resident reads own attempts" ON attempts
    FOR SELECT USING (resident_id = auth.uid());
DROP POLICY IF EXISTS "Supervisor reads learner attempts" ON attempts;
CREATE POLICY "Supervisor reads learner attempts" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            WHERE cm.user_id = attempts.resident_id AND c.owner_id = auth.uid()
        )
    );
-- No client-role write policy: attempts are created and advanced by the backend/VR path only.

-- ---------------------------------------------------------------------------
-- 3. assessment_results — the stored report of an attempt (what /sessions/[id]/report shows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_results (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id       UUID NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,

    overall_score    NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0),
    max_score        NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
    pass_mark        NUMERIC(5,2) NOT NULL,
    passed           BOOLEAN NOT NULL,
    critical_errors  INTEGER NOT NULL DEFAULT 0 CHECK (critical_errors >= 0),
    capped           BOOLEAN NOT NULL DEFAULT false,
    percentile       INTEGER CHECK (percentile BETWEEN 0 AND 100),

    -- Written by the scorer, read back as-is. The dashboard never derives a figure that is not here.
    categories       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{key,label,score,max}]
    parameters       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- planned vs achieved, tolerance, verdict
    scene_results    JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{scene,outcome,durationS,warnings,notes}]
    feedback         JSONB NOT NULL DEFAULT '[]'::jsonb,
    payload          JSONB NOT NULL DEFAULT '{}'::jsonb,   -- the full scorer output, for forward compatibility

    scoring_version  TEXT NOT NULL,                        -- which scorer / rule set produced it
    assessed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "Never overwrite history": a result is written once. A re-score is a new attempt, not an update.
CREATE OR REPLACE FUNCTION assessment_results_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'assessment result % is immutable', OLD.id USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assessment_results_immutable ON assessment_results;
CREATE TRIGGER trg_assessment_results_immutable
    BEFORE UPDATE ON assessment_results
    FOR EACH ROW EXECUTE FUNCTION assessment_results_immutable();

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Resident reads own results" ON assessment_results;
CREATE POLICY "Resident reads own results" ON assessment_results
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM attempts a WHERE a.id = assessment_results.attempt_id AND a.resident_id = auth.uid())
    );
DROP POLICY IF EXISTS "Supervisor reads learner results" ON assessment_results;
CREATE POLICY "Supervisor reads learner results" ON assessment_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM attempts a
            JOIN cohort_members cm ON cm.user_id = a.resident_id
            JOIN cohorts c ON c.id = cm.cohort_id
            WHERE a.id = assessment_results.attempt_id AND c.owner_id = auth.uid()
        )
    );
-- No client-role write policy: only the backend scoring path inserts a result.
