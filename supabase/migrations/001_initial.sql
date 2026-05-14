-- ============================================================
-- Diaconia Case Management Platform — Initial Schema
-- ============================================================

-- profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  role text not null check (role in ('admin', 'ragazzo')),
  ragazzo_id uuid
);

-- ragazzi
create table ragazzi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  first_name text not null,
  last_name text not null,
  birth_date date,
  phone text,
  email text,
  tax_code text,
  language text default 'it',
  keywords text[] default '{}',
  created_at timestamptz default now()
);

-- ragazzo_photos (simple array, no typing)
create table ragazzo_photos (
  id uuid primary key default gen_random_uuid(),
  ragazzo_id uuid references ragazzi not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  uploaded_at timestamptz default now()
);

-- tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  week_id text not null,
  name text not null,
  points numeric not null,
  assigned_to uuid references ragazzi,
  created_at timestamptz default now()
);

-- task_completions
create table task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks not null,
  ragazzo_id uuid references ragazzi not null,
  day int not null,
  completed_at timestamptz default now(),
  marked_by_admin boolean default false
);

-- report_entries
create table report_entries (
  id uuid primary key default gen_random_uuid(),
  ragazzo_id uuid references ragazzi not null,
  date date not null,
  daily_area text default '',
  health text default '',
  family_area text default '',
  social_relational text default '',
  psycho_affective text default '',
  individual_session text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(ragazzo_id, date)
);

-- commitments
create table commitments (
  id uuid primary key default gen_random_uuid(),
  ragazzo_id uuid references ragazzi not null,
  week_id text not null,
  day int not null,
  text text not null
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- email_templates
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  subject text not null,
  body text not null
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles enable row level security;
alter table ragazzi enable row level security;
alter table ragazzo_photos enable row level security;
alter table report_entries enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table commitments enable row level security;
alter table notifications enable row level security;
alter table email_templates enable row level security;

-- === profiles ===
create policy "profiles_own_select" on profiles for select using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- === ragazzi ===
create policy "ragazzi_admin_all" on ragazzi for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "ragazzi_own_select" on ragazzi for select using (
  user_id = auth.uid()
);
create policy "ragazzi_own_update" on ragazzi for update using (
  user_id = auth.uid()
);

-- === ragazzo_photos ===
create policy "photos_admin_all" on ragazzo_photos for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "photos_own_select" on ragazzo_photos for select using (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);
create policy "photos_own_insert" on ragazzo_photos for insert with check (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);
create policy "photos_own_delete" on ragazzo_photos for delete using (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);

-- === report_entries (admin only) ===
create policy "reports_admin_all" on report_entries for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- === tasks ===
create policy "tasks_admin_all" on tasks for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "tasks_all_read" on tasks for select using (
  auth.uid() is not null
);
create policy "tasks_ragazzo_book" on tasks for update using (
  (select role from profiles where id = auth.uid()) = 'ragazzo'
);

-- === task_completions ===
create policy "completions_admin_all" on task_completions for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "completions_all_read" on task_completions for select using (
  auth.uid() is not null
);
create policy "completions_own_insert" on task_completions for insert with check (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);
create policy "completions_own_delete" on task_completions for delete using (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);

-- === commitments ===
create policy "commitments_admin_all" on commitments for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "commitments_own_read" on commitments for select using (
  ragazzo_id in (select id from ragazzi where user_id = auth.uid())
);

-- === notifications ===
create policy "notifications_own_select" on notifications for select using (
  user_id = auth.uid()
);
create policy "notifications_own_update" on notifications for update using (
  user_id = auth.uid()
);

-- === email_templates (read for all authenticated) ===
create policy "email_templates_read" on email_templates for select using (
  auth.uid() is not null
);
create policy "email_templates_admin_all" on email_templates for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ============================================================
-- STORAGE
-- ============================================================
-- Bucket 'ragazzo_photos' (private) — created by migration 004
-- Files stored at path: {ragazzoId}/{photoId}-{fileName}
-- Access via signed URLs generated by backend
