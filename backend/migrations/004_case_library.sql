-- MediVeR XR — Case Library & Versioning Foundation Migration
-- 004_case_library.sql
--
-- Implements the multi-table versioned Case Library architecture:
-- 1. cases: Identity, institution scope, draft/published version pointers, lifecycle status.
-- 2. case_versions: Immutable versioned snapshots for published cases, mutable drafts.
-- 3. case_imaging: Radiographs linked to case_version_id with private storage references and calibration.
-- 4. case_version_reference_plan: Instructor-only reference plans & assessment keys.
-- 5. case_programs: Many-to-many junction enabling Case Library cases to be assigned across programs.
-- 6. assessment_criteria: Links criteria to case_version_id.

-- 1. Enhance cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;

-- Backfill institution_id from programs for existing cases
UPDATE cases c
SET institution_id = p.institution_id
FROM programs p
WHERE c.program_id = p.id AND c.institution_id IS NULL;

-- Allow program_id to be nullable so cases can reside in the institution library
ALTER TABLE cases ALTER COLUMN program_id DROP NOT NULL;

-- Update status check constraint to include 'draft'
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE cases ADD CONSTRAINT cases_status_check CHECK (status IN ('draft', 'active', 'inactive'));

-- 2. Create case_programs junction table
CREATE TABLE IF NOT EXISTS case_programs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    program_id  UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT case_programs_unique UNIQUE(case_id, program_id)
);
CREATE INDEX IF NOT EXISTS idx_case_programs_case ON case_programs(case_id);
CREATE INDEX IF NOT EXISTS idx_case_programs_program ON case_programs(program_id);

-- Backfill existing case-program associations
INSERT INTO case_programs (case_id, program_id)
SELECT id, program_id FROM cases
WHERE program_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Create case_versions table
CREATE TABLE IF NOT EXISTS case_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    title           TEXT NOT NULL,
    pathology       TEXT,
    pathology_label TEXT,
    side            TEXT CHECK (side IS NULL OR side IN ('left', 'right')),
    difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    description     TEXT,
    patient         JSONB NOT NULL DEFAULT '{}'::jsonb,
    objectives      JSONB NOT NULL DEFAULT '[]'::jsonb,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_immutable    BOOLEAN NOT NULL DEFAULT false,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at    TIMESTAMPTZ,
    CONSTRAINT case_versions_case_version_unique UNIQUE(case_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_case_versions_case ON case_versions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_versions_status ON case_versions(status);

-- 4. Add draft and published version pointers to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS draft_version_id UUID REFERENCES case_versions(id) ON DELETE SET NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS published_version_id UUID REFERENCES case_versions(id) ON DELETE SET NULL;

-- 5. Create case_imaging table
CREATE TABLE IF NOT EXISTS case_imaging (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_version_id UUID NOT NULL REFERENCES case_versions(id) ON DELETE CASCADE,
    view_type       TEXT NOT NULL,  -- 'FLAP', 'KLAT', etc.
    label           TEXT NOT NULL,
    storage_path    TEXT NOT NULL,  -- Private storage reference
    filename        TEXT,
    mimetype        TEXT,
    file_size       BIGINT,
    width           INTEGER,
    height          INTEGER,
    laterality      TEXT CHECK (laterality IS NULL OR laterality IN ('left', 'right')),
    calibration     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_imaging_version ON case_imaging(case_version_id);

-- 6. Create case_version_reference_plan table (INSTRUCTOR-ONLY)
CREATE TABLE IF NOT EXISTS case_version_reference_plan (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_version_id      UUID NOT NULL UNIQUE REFERENCES case_versions(id) ON DELETE CASCADE,
    assessment           JSONB NOT NULL DEFAULT '{}'::jsonb,
    tibial_component     JSONB NOT NULL DEFAULT '{}'::jsonb,
    femoral_component    JSONB NOT NULL DEFAULT '{}'::jsonb,
    scoring_criteria     JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructor_notes     TEXT,
    calculation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reference_plan_version ON case_version_reference_plan(case_version_id);

-- 7. Add case_version_id to assessment_criteria
ALTER TABLE assessment_criteria ADD COLUMN IF NOT EXISTS case_version_id UUID REFERENCES case_versions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assessment_criteria_case_version ON assessment_criteria(case_version_id);

-- 8. Safe legacy backfill: Migrate existing cases into draft case_versions without inventing clinical defaults
DO $$
DECLARE
    case_rec RECORD;
    new_version_id UUID;
BEGIN
    FOR case_rec IN SELECT * FROM cases WHERE draft_version_id IS NULL AND published_version_id IS NULL LOOP
        INSERT INTO case_versions (
            case_id,
            version_number,
            title,
            pathology,
            pathology_label,
            side,
            difficulty,
            description,
            patient,
            objectives,
            status,
            is_immutable,
            created_at
        ) VALUES (
            case_rec.id,
            1,
            case_rec.name,
            NULL, -- do not invent clinical defaults
            NULL,
            NULL,
            case_rec.difficulty,
            case_rec.description,
            '{}'::jsonb,
            CASE WHEN case_rec.learning_objective IS NOT NULL AND length(trim(case_rec.learning_objective)) > 0 
                 THEN jsonb_build_array(case_rec.learning_objective) 
                 ELSE '[]'::jsonb END,
            'draft',
            false,
            case_rec.created_at
        ) RETURNING id INTO new_version_id;

        UPDATE cases 
        SET draft_version_id = new_version_id,
            status = 'draft'
        WHERE id = case_rec.id;
    END LOOP;
END $$;

-- 9. Seed default TKR skills for programs if none exist
DO $$
DECLARE
    prog RECORD;
BEGIN
    FOR prog IN SELECT id FROM programs LOOP
        IF NOT EXISTS (SELECT 1 FROM skills WHERE program_id = prog.id) THEN
            INSERT INTO skills (program_id, name, description, weight) VALUES
                (prog.id, 'Bone cuts & alignment', 'Accuracy of femoral and tibial cuts, alignment preservation.', 0.30),
                (prog.id, 'Gap assessment', 'Symmetry and balancing of flexion and extension gaps.', 0.25),
                (prog.id, 'Trialling & stability', 'Component sizing, tracking, and joint stability.', 0.25),
                (prog.id, 'Implantation', 'Implant placement, cementation technique, and seating.', 0.20);
        END IF;
    END LOOP;
END $$;
