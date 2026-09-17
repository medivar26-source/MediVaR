-- MediVeR XR — Cohort Management Migration
-- 002_cohort_tables.sql
--
-- Drops the old 1-to-1 cohort_id from users and creates the programs, cohorts, 
-- and cohort_members tables for the approved many-to-many model.

-- 1. Drop the legacy cohort_id column from users
ALTER TABLE users DROP COLUMN IF EXISTS cohort_id;

-- 2. Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id  UUID NOT NULL REFERENCES institutions (id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_programs_institution ON programs (institution_id);

CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 3. Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id      UUID NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    owner_id        UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cohorts_program ON cohorts (program_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_owner ON cohorts (owner_id);

CREATE TRIGGER trg_cohorts_updated_at
    BEFORE UPDATE ON cohorts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- 4. Create cohort_members junction table
CREATE TABLE IF NOT EXISTS cohort_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id       UUID NOT NULL REFERENCES cohorts (id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Enforce uniqueness: a learner cannot join the same cohort twice
    CONSTRAINT cohort_members_cohort_user_unique UNIQUE (cohort_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON cohort_members (cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user ON cohort_members (user_id);

ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

-- Note: The rule "A learner cannot belong to multiple active cohorts within the same program"
-- will be enforced at the application layer during enrollment, or optionally via a more
-- complex database constraint/trigger in the future.
