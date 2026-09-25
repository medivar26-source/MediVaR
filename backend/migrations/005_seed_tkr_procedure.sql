-- MediVeR XR — reference data for the Content / Case Library
-- 005_seed_tkr_procedure.sql
--
-- Run AFTER 004_content_tables.sql. A case must belong to a procedure, so
-- without at least one row here the "Create case" form has nothing to pick.
-- Adds the Total Knee Replacement procedure and its twelve steps (P0-P11),
-- matching the parts the planning workflow already uses. Safe to re-run.

INSERT INTO procedures (name, description)
SELECT 'Total Knee Replacement',
       'Complete TKR episode: pre-operative planning, eleven operative parts, then a report scored against the plan.'
WHERE NOT EXISTS (SELECT 1 FROM procedures WHERE name = 'Total Knee Replacement');

INSERT INTO procedure_steps (procedure_id, step_number, name, description, required)
SELECT p.id, s.step_number, s.name, s.description, s.required
FROM procedures p
CROSS JOIN (VALUES
    (1,  'Pre-surgery check (Time Out)', 'P0',  true),
    (2,  'Positioning & preparation',    'P1',  true),
    (3,  'Surgical approach',            'P2',  true),
    (4,  'Joint preparation',            'P3',  true),
    (5,  'Tibial resection',             'P4',  true),
    (6,  'Femoral preparation',          'P5',  true),
    (7,  'Balancing & trialling',        'P6',  true),
    (8,  'Tibial final preparation',     'P7',  true),
    (9,  'PS box cut',                   'P8 — PS design only',       false),
    (10, 'Patellar management',          'P9',  true),
    (11, 'Cementation',                  'P10 — cemented fixation only', false),
    (12, 'Closure & debrief',            'P11', true)
) AS s(step_number, name, description, required)
WHERE p.name = 'Total Knee Replacement'
ON CONFLICT (procedure_id, step_number) DO NOTHING;
