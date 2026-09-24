-- MediVeR XR — Instructor Notes & Feedback Migration
-- 006_instructor_notes_and_feedback.sql
--
-- Backs the Resident Detail / Case Review page: an instructor's running notes
-- on a resident, and feedback tied to a specific attempt/session. Columns
-- match mediver_documentation/06_DATABASE_SCHEMA.md (instructor_notes,
-- instructor_feedback) exactly.
--
-- Numbered 006 because 004 and 005 were independently claimed by two other
-- migrations already applied to this database (case library, sessions/case
-- assignments) — see mediver_documentation/CONTENT_SCHEMA_PLAN.md. This file
-- only adds the two tables below; it does not touch any existing table.
--
-- Run with: psql <SUPABASE_DB_URL> -f 006_instructor_notes_and_feedback.sql

CREATE TABLE IF NOT EXISTS instructor_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    instructor_id   UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    note            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructor_notes_resident ON instructor_notes (resident_id);
CREATE INDEX IF NOT EXISTS idx_instructor_notes_instructor ON instructor_notes (instructor_id);

DROP TRIGGER IF EXISTS trg_instructor_notes_updated_at ON instructor_notes;
CREATE TRIGGER trg_instructor_notes_updated_at
    BEFORE UPDATE ON instructor_notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE instructor_notes ENABLE ROW LEVEL SECURITY;

-- attempt_id has no `attempts` table to reference yet (see 06_DATABASE_SCHEMA.md
-- and CONTENT_SCHEMA_PLAN.md — the assessment pipeline is not built). It is a
-- bare, unconstrained UUID for now, matching whatever attempt/session
-- identifier the frontend passes — today that is a seeded session id, so the
-- panel is real and working without inventing an attempts table this
-- migration has no mandate to design. Add the FK once `attempts` exists.
CREATE TABLE IF NOT EXISTS instructor_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    attempt_id      UUID,
    instructor_id   UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    feedback        TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructor_feedback_resident ON instructor_feedback (resident_id);
CREATE INDEX IF NOT EXISTS idx_instructor_feedback_attempt ON instructor_feedback (attempt_id);

ALTER TABLE instructor_feedback ENABLE ROW LEVEL SECURITY;
