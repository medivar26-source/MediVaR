-- MediVeR XR — Content / Case Library Migration
-- 004_content_tables.sql
--
-- Tables behind the Instructor Content / Case Library UI (/content):
-- procedures, procedure_steps, cases, skills, skill_items,
-- assessment_settings, assessment_criteria — per
-- mediver_documentation/06_DATABASE_SCHEMA.md.
--
-- Additive only: nothing here alters institutions/users/programs/cohorts.
-- Safe to re-run (IF NOT EXISTS / DROP TRIGGER IF EXISTS).
--
-- Design notes (see mediver_documentation/CONTENT_SCHEMA_PLAN.md):
--  * cases.program_id and skills.program_id are NOT NULL. Every piece of
--    authored content belongs to a program, and a program belongs to an
--    institution — that is the only tenant boundary these tables have.
--    The API resolves the institution's default program when a client does
--    not name one (same as cohorts_service._get_or_create_default_program).
--  * No hard-delete path. Cases are retired with status = 'inactive'.
--    cases.program_id is ON DELETE RESTRICT so removing a program cannot
--    silently take its cases (and the history that will reference them) along.
--  * assessment_criteria.case_id is ON DELETE RESTRICT for the same reason.

-- ---------- procedures ----------

CREATE TABLE IF NOT EXISTS procedures (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    version     INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procedures_name ON procedures (name);

DROP TRIGGER IF EXISTS trg_procedures_updated_at ON procedures;
CREATE TRIGGER trg_procedures_updated_at
    BEFORE UPDATE ON procedures
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

-- ---------- procedure_steps ----------

CREATE TABLE IF NOT EXISTS procedure_steps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id UUID NOT NULL REFERENCES procedures (id) ON DELETE CASCADE,
    step_number  INTEGER NOT NULL,
    name         TEXT NOT NULL,
    description  TEXT,
    required     BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT procedure_steps_procedure_step_unique UNIQUE (procedure_id, step_number)
);
-- No separate index on procedure_id: the UNIQUE (procedure_id, step_number)
-- constraint above already indexes it as the leading column.

DROP TRIGGER IF EXISTS trg_procedure_steps_updated_at ON procedure_steps;
CREATE TRIGGER trg_procedure_steps_updated_at
    BEFORE UPDATE ON procedure_steps
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE procedure_steps ENABLE ROW LEVEL SECURITY;

-- ---------- cases ----------

CREATE TABLE IF NOT EXISTS cases (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id         UUID NOT NULL REFERENCES programs (id) ON DELETE RESTRICT,
    procedure_id       UUID NOT NULL REFERENCES procedures (id) ON DELETE RESTRICT,
    name               TEXT NOT NULL,
    difficulty         TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    description        TEXT,
    learning_objective TEXT,
    status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    version            INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cases_program ON cases (program_id);
CREATE INDEX IF NOT EXISTS idx_cases_procedure ON cases (procedure_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_difficulty ON cases (difficulty);

DROP TRIGGER IF EXISTS trg_cases_updated_at ON cases;
CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- ---------- skills ----------

CREATE TABLE IF NOT EXISTS skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id  UUID NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    weight      NUMERIC CHECK (weight IS NULL OR (weight >= 0 AND weight <= 100)),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skills_program ON skills (program_id);

DROP TRIGGER IF EXISTS trg_skills_updated_at ON skills;
CREATE TRIGGER trg_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- ---------- skill_items ----------

CREATE TABLE IF NOT EXISTS skill_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id    UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skill_items_skill ON skill_items (skill_id);

DROP TRIGGER IF EXISTS trg_skill_items_updated_at ON skill_items;
CREATE TRIGGER trg_skill_items_updated_at
    BEFORE UPDATE ON skill_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE skill_items ENABLE ROW LEVEL SECURITY;

-- ---------- assessment_settings ----------

CREATE TABLE IF NOT EXISTS assessment_settings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id           UUID NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    version              INTEGER NOT NULL DEFAULT 1,
    passing_score        NUMERIC NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    critical_auto_fail   BOOLEAN NOT NULL DEFAULT true,
    incomplete_auto_fail BOOLEAN NOT NULL DEFAULT true,
    guidance_enabled     BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT assessment_settings_program_unique UNIQUE (program_id)
);

DROP TRIGGER IF EXISTS trg_assessment_settings_updated_at ON assessment_settings;
CREATE TRIGGER trg_assessment_settings_updated_at
    BEFORE UPDATE ON assessment_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE assessment_settings ENABLE ROW LEVEL SECURITY;

-- ---------- assessment_criteria ----------
-- Configuration only. The assessment engine is the sole consumer that turns
-- these rows into a score; nothing here encodes a clinical threshold.

CREATE TABLE IF NOT EXISTS assessment_criteria (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id       UUID NOT NULL REFERENCES cases (id) ON DELETE RESTRICT,
    skill_id      UUID NOT NULL REFERENCES skills (id) ON DELETE RESTRICT,
    name          TEXT NOT NULL,
    parameter     TEXT,
    target_value  NUMERIC,
    tolerance_min NUMERIC,
    tolerance_max NUMERIC,
    unit          TEXT,
    severity_rule JSONB,
    version       INTEGER NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT assessment_criteria_tolerance_order
        CHECK (tolerance_min IS NULL OR tolerance_max IS NULL OR tolerance_min <= tolerance_max)
);
CREATE INDEX IF NOT EXISTS idx_assessment_criteria_case ON assessment_criteria (case_id);
CREATE INDEX IF NOT EXISTS idx_assessment_criteria_skill ON assessment_criteria (skill_id);

DROP TRIGGER IF EXISTS trg_assessment_criteria_updated_at ON assessment_criteria;
CREATE TRIGGER trg_assessment_criteria_updated_at
    BEFORE UPDATE ON assessment_criteria
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE assessment_criteria ENABLE ROW LEVEL SECURITY;
