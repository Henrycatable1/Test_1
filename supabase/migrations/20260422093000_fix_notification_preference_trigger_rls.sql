-- ### allow cat creation flows to seed notification preferences under RLS
create or replace function app_private.ensure_owner_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cat_notification_preferences (
    cat_id,
    user_id,
    email_important_alerts,
    email_daily_digest
  )
  values (new.id, new.owner_user_id, true, true)
  on conflict (cat_id, user_id) do update
  set email_important_alerts = excluded.email_important_alerts,
      email_daily_digest = excluded.email_daily_digest,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

-- ### keep collaborator preference seeding aligned with the same trigger safety model
create or replace function app_private.ensure_collaborator_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cat_notification_preferences (
    cat_id,
    user_id,
    email_important_alerts,
    email_daily_digest
  )
  values (new.cat_id, new.user_id, true, false)
  on conflict (cat_id, user_id) do nothing;

  return new;
end;
$$;
