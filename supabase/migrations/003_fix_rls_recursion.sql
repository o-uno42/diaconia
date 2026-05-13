-- ============================================================
-- Fix infinite recursion in RLS policies that read from profiles
-- inside a policy on profiles (or chained through it).
-- We move the role lookup into a SECURITY DEFINER function,
-- which bypasses RLS and breaks the recursion.
-- ============================================================

create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop policies that contain the recursive subquery
drop policy if exists "profiles_admin_all"      on profiles;
drop policy if exists "ragazzi_admin_all"       on ragazzi;
drop policy if exists "photos_admin_all"        on ragazzo_photos;
drop policy if exists "reports_admin_all"       on report_entries;
drop policy if exists "tasks_admin_all"         on tasks;
drop policy if exists "tasks_ragazzo_book"      on tasks;
drop policy if exists "completions_admin_all"   on task_completions;
drop policy if exists "commitments_admin_all"   on commitments;
drop policy if exists "email_templates_admin_all" on email_templates;

-- Recreate them using is_admin()
create policy "profiles_admin_all"        on profiles         for all using (is_admin());
create policy "ragazzi_admin_all"         on ragazzi          for all using (is_admin());
create policy "photos_admin_all"          on ragazzo_photos   for all using (is_admin());
create policy "reports_admin_all"         on report_entries   for all using (is_admin());
create policy "tasks_admin_all"           on tasks            for all using (is_admin());
create policy "completions_admin_all"     on task_completions for all using (is_admin());
create policy "commitments_admin_all"     on commitments      for all using (is_admin());
create policy "email_templates_admin_all" on email_templates  for all using (is_admin());

-- tasks_ragazzo_book used the same recursive pattern: rewrite using a
-- ragazzo-specific helper so non-admin "ragazzo" users can book tasks.
create or replace function public.is_ragazzo()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'ragazzo'
  );
$$;

create policy "tasks_ragazzo_book" on tasks for update using (is_ragazzo());
