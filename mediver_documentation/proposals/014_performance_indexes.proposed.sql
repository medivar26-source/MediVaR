-- PROPOSED, NOT APPLIED. Needs the owner's approval before it is run on any database.
--
-- Indexes for the queries the dashboard runs most. Each one names the query it serves.
-- Every statement is IF NOT EXISTS, so it is safe to run twice. On a database with real traffic, run the
-- statements one at a time as CREATE INDEX CONCURRENTLY (it cannot run inside a transaction block).
--
-- Check first with EXPLAIN (ANALYZE) on the real data: on a few dozen rows Postgres will keep using a
-- sequential scan whatever is indexed, and these only start to matter as the tables grow.

-- Instructor case list: services/cases_service.py get_institution_cases
--   WHERE c.institution_id = ? ORDER BY c.updated_at DESC
-- cases has indexes on program, procedure, status and difficulty, but none on institution_id.
CREATE INDEX IF NOT EXISTS idx_cases_institution_updated
    ON cases (institution_id, updated_at DESC);

-- A cohort's sessions in time order: services/cohorts_service.py get_cohort_sessions
--   WHERE s.cohort_id = ? ORDER BY s.scheduled_at NULLS LAST, s.created_at
-- idx_sessions_cohort_id finds the rows; this one also hands them back already sorted.
CREATE INDEX IF NOT EXISTS idx_sessions_cohort_scheduled
    ON sessions (cohort_id, scheduled_at);

-- Learner case list: services/cases_service.py get_learner_cases
--   cases JOIN case_programs ON case_id, then cohorts JOIN cohort_members on the program.
-- A composite lets the join walk program -> case without touching the table.
CREATE INDEX IF NOT EXISTS idx_case_programs_program_case
    ON case_programs (program_id, case_id);

-- A learner's sessions: session_residents looked up by resident, then joined to the session.
CREATE INDEX IF NOT EXISTS idx_session_residents_resident_session
    ON session_residents (resident_id, session_id);
