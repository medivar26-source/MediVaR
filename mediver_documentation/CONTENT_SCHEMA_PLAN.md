# Content / Case Library — schema plan (draft, not yet applied)

Working notes from planning the database tables that back `/content`, ahead
of applying anything to the live Supabase project (`eanuqinjawpkvwfojygx`).
Nothing here has been run against the database yet — this is the agreed
shape, pending sign-off from whoever owns the DB migration work.

## Tables (7, all new — nothing here touches `institutions`/`users`/`programs`/`cohorts`)

1. **`procedures`** — `id`, `name`, `description`, `version`, timestamps
2. **`procedure_steps`** — `id`, `procedure_id` → procedures, `step_number`, `name`, `description`, `required` bool, timestamps. Unique on `(procedure_id, step_number)`.
3. **`cases`** — `id`, `program_id` → programs, `procedure_id` → procedures, `name`, `difficulty`, `description`, `learning_objective`, `status` (active/inactive), `version`, timestamps
4. **`skills`** — `id`, `program_id` → programs, `name`, `description`, `weight`, timestamps
5. **`skill_items`** — `id`, `skill_id` → skills, `name`, `description`, timestamps
6. **`assessment_settings`** — `id`, `program_id` → programs (unique), `version`, `passing_score`, `critical_auto_fail`, `incomplete_auto_fail`, `guidance_enabled`, timestamps
7. **`assessment_criteria`** — `id`, `case_id` → cases, `skill_id` → skills, `name`, `parameter`, `target_value`, `tolerance_min`, `tolerance_max`, `unit`, `severity_rule` jsonb, `version`, timestamps

Column list matches `06_DATABASE_SCHEMA.md` exactly.

## Two decisions made while planning

### `cases.program_id` (and `skills.program_id`) — `NOT NULL`
Revised from an earlier "nullable" recommendation. The concern was that no
UI supplies a program yet — but the backend already handles exactly that:
`cohorts_service._get_or_create_default_program()` resolves the
institution's default program when the client doesn't name one, and the
cases API does the same. Required is also the safer choice: a case with no
program would belong to no institution, which is a tenant-isolation hole.
`cases.program_id` is `ON DELETE RESTRICT` so removing a program cannot
silently take its cases with it.

### Delete — archive-only, no hard-delete endpoint
`04_UI_AND_NAVIGATION.md` says destructive operations should prefer
archival/soft-delete for important configuration; `12_SECURITY_AUDIT_AND_COMPLIANCE.md`
requires finalized results are never silently overwritten. A case isn't
standalone — `sessions`/`assessment_criteria` will reference it, and a hard
delete either cascades away real historical attempt data or gets blocked by
a foreign key. Decision: no `DELETE /cases/{id}` exposed; the existing
active/inactive status flip on `/content/[id]` is the "deletion" path. Any
future table referencing `cases` should use `ON DELETE RESTRICT`, not
`CASCADE`, so history can't be silently taken down even by a direct query.

## Status

- [x] Schema shape agreed
- [x] Supabase MCP connected (`eanuqinjawpkvwfojygx`, authenticated)
- [x] Migration SQL written (`backend/migrations/004_content_tables.sql`) — file only, not run
- [x] Backend `/cases` + `/procedures` built against it (`content_service.py`, verified with a stubbed DB — not against real tables)
- [x] Content page Cases tab reads/writes through the API
- [ ] Applied to the live database — **holds until the DB owner signs off**, per the existing team boundary in the original Content Page task spec. Until it is applied, `/content` shows a "couldn't be loaded" message instead of cases.
- [ ] Seed rows: at least one `procedures` row (and its steps) is needed before a case can be created — the case form has no procedure to pick otherwise.
- [ ] Follow-ups with no table yet: `case_images` (imaging), sessions (usage), a knee `side` column if the team wants it back.
