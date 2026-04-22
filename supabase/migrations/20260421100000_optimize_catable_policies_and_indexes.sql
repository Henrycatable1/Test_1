-- ### align the live bootstrap with advisor guidance

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

create or replace function app_private.ensure_owner_notification_preferences()
returns trigger
language plpgsql
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

create or replace function app_private.ensure_collaborator_notification_preferences()
returns trigger
language plpgsql
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

create or replace function app_private.calculate_suggested_food_grams(
  target_weight_kg numeric,
  target_age_months integer,
  target_diet public.cat_diet
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select round(
    coalesce(
      case
        when target_weight_kg is null then null
        when target_age_months is not null and target_age_months < 12 then
          case target_diet
            when 'dry' then target_weight_kg * 20
            when 'wet' then target_weight_kg * 70
            when 'both' then target_weight_kg * 45
            else target_weight_kg * 45
          end
        else
          case target_diet
            when 'dry' then target_weight_kg * 15
            when 'wet' then target_weight_kg * 50
            when 'both' then target_weight_kg * 32.5
            else target_weight_kg * 32.5
          end
      end,
      0
    )::numeric,
    1
  );
$$;

create or replace function app_private.can_manage_cat(target_cat_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    )
  end;
$$;

create or replace function app_private.can_edit_cat(target_cat_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    ) or exists (
      select 1
      from public.cat_collaborators cc
      where cc.cat_id = target_cat_id
        and cc.user_id = auth.uid()
        and cc.role = 'caretaker'
    )
  end;
$$;

create or replace function app_private.can_view_cat(target_cat_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.cats c
      where c.id = target_cat_id
        and c.owner_user_id = auth.uid()
    ) or exists (
      select 1
      from public.cat_collaborators cc
      where cc.cat_id = target_cat_id
        and cc.user_id = auth.uid()
    )
  end;
$$;

create index if not exists idx_alerts_daily_health_record_id
  on public.alerts (daily_health_record_id);

create index if not exists idx_daily_health_records_created_by
  on public.daily_health_records (created_by);

create index if not exists idx_vet_visits_created_by
  on public.vet_visits (created_by);

create index if not exists idx_cat_collaborators_invited_by
  on public.cat_collaborators (invited_by);

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists cats_insert_owner on public.cats;
create policy cats_insert_owner
on public.cats
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

drop policy if exists cats_update_manage on public.cats;
create policy cats_update_manage
on public.cats
for update
to authenticated
using (app_private.can_manage_cat(id))
with check (owner_user_id = (select auth.uid()));

drop policy if exists alert_deliveries_select_self on public.alert_deliveries;
create policy alert_deliveries_select_self
on public.alert_deliveries
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists cat_collaborators_select_visible on public.cat_collaborators;
create policy cat_collaborators_select_visible
on public.cat_collaborators
for select
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.can_manage_cat(cat_id)
);

drop policy if exists cat_notification_preferences_select_self on public.cat_notification_preferences;
create policy cat_notification_preferences_select_self
on public.cat_notification_preferences
for select
to authenticated
using (
  user_id = (select auth.uid())
  and app_private.can_view_cat(cat_id)
);

drop policy if exists cat_notification_preferences_insert_self on public.cat_notification_preferences;
create policy cat_notification_preferences_insert_self
on public.cat_notification_preferences
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and app_private.can_view_cat(cat_id)
);

drop policy if exists cat_notification_preferences_update_self on public.cat_notification_preferences;
create policy cat_notification_preferences_update_self
on public.cat_notification_preferences
for update
to authenticated
using (
  user_id = (select auth.uid())
  and app_private.can_view_cat(cat_id)
)
with check (
  user_id = (select auth.uid())
  and app_private.can_view_cat(cat_id)
);

drop policy if exists cat_notification_preferences_delete_self on public.cat_notification_preferences;
create policy cat_notification_preferences_delete_self
on public.cat_notification_preferences
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and app_private.can_view_cat(cat_id)
);
