-- MediVeR XR — Authentication Foundation Migration
-- 001_auth_tables.sql
--
-- Creates the institution and user tables that back the MediVeR identity model.
-- Supabase Auth manages password hashing and JWT issuance; this schema maps
-- Supabase Auth identities to the application-level role/institution model.
--
-- Run with: psql <SUPABASE_DB_URL> -f 001_auth_tables.sql
-- Or via the backend provisioning script which applies it automatically.

-- ---------- institutions ----------

CREATE TABLE IF NOT EXISTS institutions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions (name);

-- ---------- users ----------
-- id matches auth.users.id from Supabase Auth so that JWT sub claim
-- maps directly to the application user without a secondary lookup.

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY,   -- = Supabase auth.users.id
    institution_id      UUID REFERENCES institutions (id) ON DELETE RESTRICT,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    email               TEXT UNIQUE,        -- NULL for learner accounts (use learner_id)
    learner_id          TEXT UNIQUE,        -- Generated, e.g. MVR-A3K7PQ. NULL for instructors.
    role                TEXT NOT NULL CHECK (role IN ('instructor', 'student', 'intern', 'resident', 'surgeon', 'admin')),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    default_difficulty  TEXT NOT NULL DEFAULT 'intermediate' CHECK (default_difficulty IN ('beginner', 'intermediate', 'expert')),
    level               TEXT,               -- Free text e.g. "Resident level", "Consultant"
    cohort_id           UUID,               -- Set when learner is added to a cohort (FK added later)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_institution ON users (institution_id);
CREATE INDEX IF NOT EXISTS idx_users_learner_id ON users (learner_id) WHERE learner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE email IS NOT NULL;

-- ---------- updated_at trigger ----------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Row Level Security ----------
-- Backend always uses the service_role key which bypasses RLS.
-- Enabling RLS here is defense-in-depth if any client-level Supabase
-- access is added later.

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically. No additional policies are
-- needed for backend-only access. Add client-facing policies here when
-- frontend direct-Supabase access is confirmed and scoped.
