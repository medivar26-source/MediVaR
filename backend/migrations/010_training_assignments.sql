-- MediVeR XR — Training Assignments Migration
-- 007_training_assignments.sql
--
-- Backs the "Assign practice" action on the Resident Detail page. Columns
-- match mediver_documentation/06_DATABASE_SCHEMA.md (training_assignments)
-- with one deliberate deviation, explained below.

CREATE TABLE IF NOT EXISTS training_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- Documented as `case_id UUID FK -> cases.id`, but not made one here:
    -- the recommendation this button acts on comes from the seed case
    -- catalogue (ids like "CASE_001"), which has no row in the real `cases`
    -- table this database now has (see backend/services/content_service.py).
    -- Constraining this to that FK today would make every assignment fail.
    -- Store the id and a label; add the real FK once the seed catalogue and
    -- `cases` are the same table.
    case_id         TEXT NOT NULL,
    case_title      TEXT NOT NULL,
    cohort_id       UUID REFERENCES cohorts (id) ON DELETE SET NULL,
    mode            TEXT NOT NULL DEFAULT 'training' CHECK (mode IN ('training', 'assessment')),
    due_at          TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_by     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_training_assignments_resident ON training_assignments (resident_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_status ON training_assignments (status);

ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
