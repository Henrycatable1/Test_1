-- ### English MVP: stop silently creating zh-TW profiles while the UI is English-only

-- ### new profiles without an explicit language land on English
alter table public.profiles
  alter column language_code set default 'en';

-- ### existing rows only ever received the previous schema default; no language picker exists yet
update public.profiles
set language_code = 'en'
where language_code = 'zh-TW';

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ### seed English explicitly so alert email language matches the English MVP UI
  insert into public.profiles (id, email, display_name, language_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    'en'
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;
