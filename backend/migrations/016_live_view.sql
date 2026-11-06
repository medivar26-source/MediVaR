-- STAGED 2026-11-05 on the owner's request to build the live view ("cast the VR feed to the dashboard").
-- Same SQL as mediver_documentation/proposals/016_live_view.proposed.sql, unchanged.
-- Requires 013 and 015. Apply it yourself, from the backend folder (the same .env the running backend reads):
--     ./.venv/Scripts/python.exe migrations/apply_migration.py 016_live_view.sql
-- then restart the backend (do not rely on --reload on Windows). Until then every live endpoint answers 404 and
-- both the headset and the dashboard carry on without live view.
--
--
-- What it adds, for watching a run on the dashboard while the resident performs it on the headset:
--   live_runs    one row per assignment: the latest state of the run, when it was last heard from, when it was last watched
--   run_events   the trail of events the headset sent (step started / completed, warnings, ...). Heartbeats are not stored here.
--   live_frames  the newest eye-view snapshot of a run (one row per assignment, overwritten; deleted when the run ends)
--
-- The report (run_reports, 015) stays the only thing that is scored. These tables are advisory: if they are empty or stale,
-- no score changes.
--
-- ROLLBACK (only while empty, or after exporting):
--   DROP TABLE IF EXISTS live_frames;  DROP TABLE IF EXISTS run_events;  DROP TABLE IF EXISTS live_runs;

-- ---------------------------------------------------------------------------
-- 1. live_runs: latest state of the run on an assignment
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS live_runs (
    assignment_id  UUID PRIMARY KEY REFERENCES assignments(id) ON DELETE CASCADE,
    run_id         TEXT NOT NULL,                       -- the headset's run id; a new run id on the same assignment replaces the row
    device_id      UUID REFERENCES devices(id) ON DELETE SET NULL,
    last_seq       INTEGER NOT NULL DEFAULT 0 CHECK (last_seq >= 0),
    state          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- partId, stepId, sceneId, stepsDone, stepsTotal, paused, elapsedS
    started_at     TIMESTAMPTZ,
    last_event_at  TIMESTAMPTZ,                         -- when the backend last heard from the headset about this run
    ended_at       TIMESTAMPTZ,
    outcome        TEXT CHECK (outcome IN ('Completed', 'Abandoned')),
    last_viewed_at TIMESTAMPTZ,                         -- when a dashboard last asked; the headset sends snapshots only while this is recent
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_live_runs_updated_at ON live_runs;
CREATE TRIGGER trg_live_runs_updated_at
    BEFORE UPDATE ON live_runs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE live_runs ENABLE ROW LEVEL SECURITY;        -- backend only: no policy

-- ---------------------------------------------------------------------------
-- 2. run_events: what the headset reported as it happened (idempotent on assignment + run + seq)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS run_events (
    assignment_id UUID    NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    run_id        TEXT    NOT NULL,
    seq           INTEGER NOT NULL CHECK (seq >= 1),
    type          TEXT    NOT NULL CHECK (type IN (
                      'run_started', 'part_started', 'step_started', 'step_completed',
                      'warning', 'value', 'run_paused', 'run_resumed', 'run_ended')),
    t_utc         TIMESTAMPTZ,                          -- the headset's clock (may drift; see deviceClockOffsetSeconds)
    elapsed_s     NUMERIC CHECK (elapsed_s IS NULL OR elapsed_s >= 0),
    data          JSONB   NOT NULL DEFAULT '{}'::jsonb, -- only the fields that belong to this event type
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (assignment_id, run_id, seq)
);

ALTER TABLE run_events ENABLE ROW LEVEL SECURITY;       -- backend only: no policy

-- ---------------------------------------------------------------------------
-- 3. live_frames: the newest eye-view snapshot (JPEG), overwritten in place
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS live_frames (
    assignment_id UUID PRIMARY KEY REFERENCES assignments(id) ON DELETE CASCADE,
    run_id        TEXT    NOT NULL,
    seq           INTEGER NOT NULL CHECK (seq >= 0),
    content_type  TEXT    NOT NULL DEFAULT 'image/jpeg' CHECK (content_type = 'image/jpeg'),
    width         INTEGER NOT NULL CHECK (width BETWEEN 1 AND 1920),
    height        INTEGER NOT NULL CHECK (height BETWEEN 1 AND 1080),
    jpeg          BYTEA   NOT NULL CHECK (octet_length(jpeg) BETWEEN 1 AND 262144),   -- 256 KB hard ceiling; the API refuses above 150 KB
    captured_at   TIMESTAMPTZ,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE live_frames ENABLE ROW LEVEL SECURITY;      -- backend only: no policy
