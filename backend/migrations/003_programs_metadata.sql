-- MediVeR XR — Programs metadata enhancement
-- 003_programs_metadata.sql
--
-- Adds description and status columns to programs table.

ALTER TABLE programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
