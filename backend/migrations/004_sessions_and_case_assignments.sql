-- Migration: sessions + cohort_case_assignments
-- Assumes: cohorts(id uuid pk), cases(id uuid pk). Adjust types if yours differ (e.g. bigint/serial).

-- 1. Sessions: scheduled events under a cohort
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  name text not null,
  scheduled_at timestamptz,
  status text not null default 'scheduled', -- e.g. scheduled | in_progress | completed | cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_cohort_id on sessions(cohort_id);

-- 2. Cohort <-> Case assignments (cases act as "assignments" to every learner in the cohort)
create table if not exists cohort_case_assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  case_id uuid not null references cases(id) on delete cascade,
  due_date timestamptz,
  required boolean not null default true,
  "order" int, -- optional display/sequence order
  created_at timestamptz not null default now(),
  unique (cohort_id, case_id) -- prevent assigning the same case twice to one cohort
);

create index if not exists idx_cohort_case_assignments_cohort_id on cohort_case_assignments(cohort_id);
create index if not exists idx_cohort_case_assignments_case_id on cohort_case_assignments(case_id);

-- 3. updated_at trigger for sessions (skip if you already have a shared trigger fn)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sessions_updated_at on sessions;
create trigger trg_sessions_updated_at
  before update on sessions
  for each row execute function set_updated_at();

-- 4. RLS
-- Assumes cohorts.owner_id is the admin/creator of that cohort, and cohort_members
-- (cohort_id, user_id) is how learners are enrolled. Adjust if admin status actually
-- lives elsewhere (e.g. a separate admins/roles table).
alter table sessions enable row level security;
alter table cohort_case_assignments enable row level security;

-- Sessions: cohort owner can read/write; enrolled learners can read only.
create policy "Cohort owner can manage sessions" on sessions
  for all using (
    exists (
      select 1 from cohorts c
      where c.id = sessions.cohort_id
      and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from cohorts c
      where c.id = sessions.cohort_id
      and c.owner_id = auth.uid()
    )
  );

create policy "Cohort members can view sessions" on sessions
  for select using (
    exists (
      select 1 from cohort_members cm
      where cm.cohort_id = sessions.cohort_id
      and cm.user_id = auth.uid()
    )
  );

-- Cohort case assignments: same pattern.
create policy "Cohort owner can manage case assignments" on cohort_case_assignments
  for all using (
    exists (
      select 1 from cohorts c
      where c.id = cohort_case_assignments.cohort_id
      and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from cohorts c
      where c.id = cohort_case_assignments.cohort_id
      and c.owner_id = auth.uid()
    )
  );

create policy "Cohort members can view case assignments" on cohort_case_assignments
  for select using (
    exists (
      select 1 from cohort_members cm
      where cm.cohort_id = cohort_case_assignments.cohort_id
      and cm.user_id = auth.uid()
    )
  );