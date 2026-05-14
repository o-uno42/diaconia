alter table profiles
  add column if not exists text_scale_percent integer not null default 100;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_text_scale_percent_check'
  ) then
    alter table profiles
      add constraint profiles_text_scale_percent_check
      check (text_scale_percent in (100, 102, 105, 110, 115, 120, 125));
  end if;
end $$;
