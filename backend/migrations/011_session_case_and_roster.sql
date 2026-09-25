-- MediVeR XR — Session Case & Roster Migration
-- 011_session_case_and_roster.sql
--
-- Extends the existing `sessions` table (007_sessions_and_case_assignments.sql,
-- 008_sessions_update.sql) so a session actually carries the two things a
-- scheduled event needs to be a training assignment: which case it's for and
-- who has to do it. Adds a per-resident roster table (`session_residents`),
-- matching mediver_documentation/06_DATABASE_SCHEMA.md's `session_residents`.
--
-- Deliberately does NOT touch `cohort_case_assignments` or `training_assignments`
-- — those are separate, existing concepts (cohort-wide case visibility, and
-- ad-hoc per-resident "Assign practice" respectively) that this migration
-- reuses rather than duplicates. A session's `case_id` is expected to already
-- be one of the cohort's assigned cases (enforced at the service layer, not
-- the DB, to match how `set_cohort_cases`/`get_cohort_cases` already work).
--
-- Does NOT add an `attempts` table or anything execution/assessment-related —
-- out of scope for this change; no VR/attempt pipeline exists yet to feed it.

-- 1. sessions: which case, who's running it, what mode.
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'training' CHECK (mode IN ('training', 'assessment'));

-- Backfill instructor_id for any pre-existing rows from the owning cohort,
-- so the column can be relied on going forward even though it's nullable
-- (nullable because ON DELETE SET NULL must be able to null it out later).
UPDATE sessions s
SET instructor_id = c.owner_id
FROM cohorts c
WHERE s.cohort_id = c.id
  AND s.instructor_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_case_id ON sessions(case_id);

-- 2. session_residents: the per-resident roster/assignment record for a session.
CREATE TABLE IF NOT EXISTS session_residents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    resident_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    UNIQUE (session_id, resident_id)
);

CREATE INDEX IF NOT EXISTS idx_session_residents_session_id ON session_residents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_residents_resident_id ON session_residents(resident_id);

ALTER TABLE session_residents ENABLE ROW LEVEL SECURITY;

-- Same ownership pattern as `sessions` itself (007_sessions_and_case_assignments.sql):
-- the cohort owner manages the roster; a resident can see only their own row.
CREATE POLICY "Cohort owner can manage session roster" ON session_residents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN cohorts c ON c.id = s.cohort_id
            WHERE s.id = session_residents.session_id
            AND c.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN cohorts c ON c.id = s.cohort_id
            WHERE s.id = session_residents.session_id
            AND c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Residents can view their own roster row" ON session_residents
    FOR SELECT USING (
        resident_id = auth.uid()
    );
