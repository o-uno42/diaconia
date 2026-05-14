-- ============================================================
-- Weekly Activities — slot catalog + per-week cell entries
-- ============================================================

-- weekly_activities: catalog of time slots (Pranzo, Studio, …)
-- One global list; admin can rename/delete. Ordering is implicit
-- by created_at (oldest first).
create table weekly_activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- weekly_activity_entries: actual content for (activity, week, day)
-- Cascades on activity deletion: removing a slot wipes its entries.
create table weekly_activity_entries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references weekly_activities(id) on delete cascade,
  week_id text not null,
  day int not null,
  text text not null,
  unique (activity_id, week_id, day)
);

-- ============================================================
-- RLS
-- ============================================================

alter table weekly_activities enable row level security;
alter table weekly_activity_entries enable row level security;

-- weekly_activities: admin full CRUD, others read-only
create policy "weekly_activities_admin_all" on weekly_activities for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "weekly_activities_all_read" on weekly_activities for select using (
  auth.uid() is not null
);

-- weekly_activity_entries: admin full CRUD, others read-only
create policy "weekly_activity_entries_admin_all" on weekly_activity_entries for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
);
create policy "weekly_activity_entries_all_read" on weekly_activity_entries for select using (
  auth.uid() is not null
);

-- ============================================================
-- Default catalog seed
-- ============================================================
insert into weekly_activities (name, created_at) values
  ('Pranzo',                       now()),
  ('Prima attività libera',        now() + interval '1 ms'),
  ('Prima attività programmata',   now() + interval '2 ms'),
  ('Studio',                       now() + interval '3 ms'),
  ('Merenda',                      now() + interval '4 ms'),
  ('Seconda attività programmata', now() + interval '5 ms'),
  ('Seconda attività libera',      now() + interval '6 ms');
