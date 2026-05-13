-- ============================================================
-- Add ON DELETE CASCADE to FKs that reference auth.users,
-- so deleting a user from Authentication → Users also removes
-- their rows in profiles / ragazzi / notifications.
-- ============================================================

alter table profiles
  drop constraint profiles_id_fkey,
  add constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade;

alter table ragazzi
  drop constraint ragazzi_user_id_fkey,
  add constraint ragazzi_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table notifications
  drop constraint notifications_user_id_fkey,
  add constraint notifications_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
