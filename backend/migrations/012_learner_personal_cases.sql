-- MediVeR XR — Learner Personal Cases Migration
-- 012_learner_personal_cases.sql
--
-- Implements a separate, private content space for learners to create and manage their own cases.
-- These cases are distinct from the institutional Case Library and are not versioned.

CREATE TABLE IF NOT EXISTS learner_personal_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    pathology       TEXT,
    pathology_label TEXT,
    side            TEXT CHECK (side IS NULL OR side IN ('left', 'right')),
    difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    description     TEXT,
    patient         JSONB NOT NULL DEFAULT '{}'::jsonb,
    objectives      JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learner_personal_cases_owner ON learner_personal_cases(owner_user_id);

CREATE TABLE IF NOT EXISTS learner_personal_case_imaging (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_case_id UUID NOT NULL REFERENCES learner_personal_cases(id) ON DELETE CASCADE,
    view_type        TEXT NOT NULL,
    label            TEXT NOT NULL,
    storage_path     TEXT NOT NULL,
    filename         TEXT,
    mimetype         TEXT,
    file_size        BIGINT,
    width            INTEGER,
    height           INTEGER,
    laterality       TEXT CHECK (laterality IS NULL OR laterality IN ('left', 'right')),
    calibration      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learner_personal_case_imaging_case ON learner_personal_case_imaging(personal_case_id);
