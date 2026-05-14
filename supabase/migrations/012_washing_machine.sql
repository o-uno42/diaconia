-- ============================================================
-- Washing-machine calendar
-- ============================================================
--
-- Each row is an "X" mark in the admin's monthly matrix:
--   rows  = days of the month
--   cols  = ragazzo × {V, LA} — two independent toggles per ragazzo
-- A cell is "checked" iff a row exists for (ragazzo_id, date, entry_type).
-- To uncheck a cell the admin simply deletes the row.
--
-- The two entry types are independent: a ragazzo can have both V and LA
-- marked on the same date.
-- ============================================================

create table if not exists washing_machine_entries (
  id              uuid primary key default gen_random_uuid(),
  ragazzo_id      uuid not null references ragazzi on delete cascade,
  date            date not null,
  entry_type      text not null check (entry_type in ('V', 'LA')),
  owner_admin_id  uuid not null references profiles(id) on delete restrict,
  created_at      timestamptz default now(),
  unique (ragazzo_id, date, entry_type)
);

create index if not exists washing_machine_entries_owner_idx
  on washing_machine_entries(owner_admin_id);
create index if not exists washing_machine_entries_ragazzo_date_idx
  on washing_machine_entries(ragazzo_id, date);

-- ============================================================
-- RLS — admin sees/edits only their own rows
-- ============================================================

alter table washing_machine_entries enable row level security;

drop policy if exists "washing_machine_admin_all" on washing_machine_entries;
create policy "washing_machine_admin_all" on washing_machine_entries
  for all using (is_admin() and owner_admin_id = auth.uid());
