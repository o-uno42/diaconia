-- ============================================================
-- Task Templates — catalog of general tasks
-- ============================================================
--
-- A "Compito generale" lives independently from any week. Admins
-- maintain a catalog; weekly `tasks` rows are spawned from a
-- template via drag-and-drop in the UI (the template's name and
-- points are copied into a new tasks row). Editing or deleting a
-- template does NOT touch existing weekly instances.

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points numeric not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table task_templates enable row level security;

create policy "task_templates_admin_all" on task_templates for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "task_templates_all_read" on task_templates for select using (
  auth.uid() is not null
);
