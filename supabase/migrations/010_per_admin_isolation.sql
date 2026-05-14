-- ============================================================
-- Per-admin data isolation (multi-tenant by admin)
-- ============================================================
--
-- Each admin owns their own ragazzi, tasks, task templates,
-- weekly activities and email templates. Tables that hang off a
-- ragazzo (reports, commitments, completions, photos) and tables
-- that hang off a weekly_activity (weekly_activity_entries) inherit
-- ownership via their parent FK.
--
-- Rules:
--   - A ragazzo belongs to exactly one admin (owner_admin_id).
--   - All admins are equal (no super-admin).
--   - Pre-existing rows are backfilled to the oldest admin
--     (by auth.users.created_at).
--   - A ragazzo (logged-in non-admin) inherits the visibility of
--     their owning admin via the current_admin_id() helper below.

-- ============================================================
-- 1. Schema: owner_admin_id on top-level tables
-- ============================================================

alter table ragazzi          add column owner_admin_id uuid references profiles(id) on delete restrict;
alter table tasks            add column owner_admin_id uuid references profiles(id) on delete restrict;
alter table task_templates   add column owner_admin_id uuid references profiles(id) on delete restrict;
alter table weekly_activities add column owner_admin_id uuid references profiles(id) on delete restrict;
alter table email_templates  add column owner_admin_id uuid references profiles(id) on delete restrict;

create index if not exists ragazzi_owner_idx           on ragazzi(owner_admin_id);
create index if not exists tasks_owner_idx             on tasks(owner_admin_id);
create index if not exists task_templates_owner_idx   on task_templates(owner_admin_id);
create index if not exists weekly_activities_owner_idx on weekly_activities(owner_admin_id);
create index if not exists email_templates_owner_idx  on email_templates(owner_admin_id);

-- ============================================================
-- 2. Backfill: assign every pre-existing row to the oldest admin
-- ============================================================

do $$
declare
  first_admin uuid;
begin
  select p.id into first_admin
  from profiles p
  join auth.users u on u.id = p.id
  where p.role = 'admin'
  order by u.created_at asc
  limit 1;

  if first_admin is null then
    raise notice 'No admin found — skipping backfill. Backfill manually after creating the first admin.';
    return;
  end if;

  update ragazzi           set owner_admin_id = first_admin where owner_admin_id is null;
  update tasks             set owner_admin_id = first_admin where owner_admin_id is null;
  update task_templates    set owner_admin_id = first_admin where owner_admin_id is null;
  update weekly_activities set owner_admin_id = first_admin where owner_admin_id is null;
  update email_templates   set owner_admin_id = first_admin where owner_admin_id is null;
end$$;

-- After backfill, lock the column to NOT NULL so future inserts must specify it.
-- (Done in a separate block so the backfill error message is readable if it runs
-- on a fresh DB with no admin yet.)
do $$
begin
  if exists (select 1 from ragazzi where owner_admin_id is null) then
    raise notice 'Some ragazzi still have null owner_admin_id; leaving column nullable for manual fix.';
  else
    alter table ragazzi           alter column owner_admin_id set not null;
    alter table tasks             alter column owner_admin_id set not null;
    alter table task_templates    alter column owner_admin_id set not null;
    alter table weekly_activities alter column owner_admin_id set not null;
    alter table email_templates   alter column owner_admin_id set not null;
  end if;
end$$;

-- ============================================================
-- 3. Helper: current_admin_id()
--    Returns the admin id that "owns" the current request.
--      - If the caller is an admin → their own id.
--      - If the caller is a ragazzo → the admin owning their ragazzo row.
--    Used in every per-tenant policy below.
-- ============================================================

create or replace function public.current_admin_id()
  returns uuid
  language sql
  security definer
  stable
  set search_path = public
as $$
  select case
    when (select role from profiles where id = auth.uid()) = 'admin'
      then auth.uid()
    else (
      select r.owner_admin_id
      from ragazzi r
      join profiles p on p.ragazzo_id = r.id
      where p.id = auth.uid()
    )
  end;
$$;

-- ============================================================
-- 4. RLS: replace existing per-table admin policies
-- ============================================================

-- --- ragazzi --------------------------------------------------
drop policy if exists "ragazzi_admin_all" on ragazzi;
create policy "ragazzi_admin_all" on ragazzi
  for all using (is_admin() and owner_admin_id = auth.uid());
-- (ragazzi_own_select and ragazzi_own_update from migration 001 remain unchanged:
-- a ragazzo can still see/update their own row.)

-- --- tasks ----------------------------------------------------
drop policy if exists "tasks_admin_all"   on tasks;
drop policy if exists "tasks_all_read"    on tasks;
drop policy if exists "tasks_ragazzo_book" on tasks;

create policy "tasks_admin_all" on tasks
  for all using (is_admin() and owner_admin_id = auth.uid());

create policy "tasks_ragazzo_read" on tasks
  for select using (is_ragazzo() and owner_admin_id = current_admin_id());

create policy "tasks_ragazzo_book" on tasks
  for update using (is_ragazzo() and owner_admin_id = current_admin_id());

-- --- task_templates -------------------------------------------
-- (added in migration 007; replace its policy here)
drop policy if exists "task_templates_admin_all" on task_templates;
drop policy if exists "task_templates_all_read"  on task_templates;

create policy "task_templates_admin_all" on task_templates
  for all using (is_admin() and owner_admin_id = auth.uid());

create policy "task_templates_ragazzo_read" on task_templates
  for select using (is_ragazzo() and owner_admin_id = current_admin_id());

-- --- weekly_activities ----------------------------------------
drop policy if exists "weekly_activities_admin_all" on weekly_activities;
drop policy if exists "weekly_activities_all_read"  on weekly_activities;

create policy "weekly_activities_admin_all" on weekly_activities
  for all using (is_admin() and owner_admin_id = auth.uid());

create policy "weekly_activities_ragazzo_read" on weekly_activities
  for select using (is_ragazzo() and owner_admin_id = current_admin_id());

-- --- weekly_activity_entries (inherits via activity_id) -------
drop policy if exists "weekly_activity_entries_admin_all"  on weekly_activity_entries;
drop policy if exists "weekly_activity_entries_all_read"   on weekly_activity_entries;

create policy "weekly_activity_entries_admin_all" on weekly_activity_entries
  for all using (
    is_admin() and activity_id in (
      select id from weekly_activities where owner_admin_id = auth.uid()
    )
  );

create policy "weekly_activity_entries_ragazzo_read" on weekly_activity_entries
  for select using (
    is_ragazzo() and activity_id in (
      select id from weekly_activities where owner_admin_id = current_admin_id()
    )
  );

-- --- email_templates ------------------------------------------
drop policy if exists "email_templates_admin_all" on email_templates;
drop policy if exists "email_templates_read"      on email_templates;

create policy "email_templates_admin_all" on email_templates
  for all using (is_admin() and owner_admin_id = auth.uid());

-- --- report_entries (inherits via ragazzo_id) -----------------
drop policy if exists "reports_admin_all" on report_entries;
create policy "reports_admin_all" on report_entries
  for all using (
    is_admin() and ragazzo_id in (
      select id from ragazzi where owner_admin_id = auth.uid()
    )
  );

-- --- commitments (inherits via ragazzo_id) --------------------
drop policy if exists "commitments_admin_all" on commitments;
create policy "commitments_admin_all" on commitments
  for all using (
    is_admin() and ragazzo_id in (
      select id from ragazzi where owner_admin_id = auth.uid()
    )
  );
-- (commitments_own_read for ragazzo remains: a ragazzo sees their own.)

-- --- task_completions (inherits via ragazzo_id) ---------------
drop policy if exists "completions_admin_all" on task_completions;
create policy "completions_admin_all" on task_completions
  for all using (
    is_admin() and ragazzo_id in (
      select id from ragazzi where owner_admin_id = auth.uid()
    )
  );
-- (completions_all_read remains permissive for any authenticated user;
-- a ragazzo only ever queries their own data through the backend, which
-- enforces ownership in the application layer.)

-- --- ragazzo_photos (inherits via ragazzo_id) -----------------
drop policy if exists "photos_admin_all" on ragazzo_photos;
create policy "photos_admin_all" on ragazzo_photos
  for all using (
    is_admin() and ragazzo_id in (
      select id from ragazzi where owner_admin_id = auth.uid()
    )
  );
