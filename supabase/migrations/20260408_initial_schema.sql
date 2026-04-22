create extension if not exists pgcrypto;
create schema if not exists app_private;

-- ### enum bootstrap
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'cat_gender'
  ) then
    create type public.cat_gender as enum (
      'male',
      'female',
      'neutered_male',
      'neutered_female'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'cat_diet'
  ) then
    create type public.cat_diet as enum ('dry', 'wet', 'both');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'water_intake_level'
  ) then
    create type public.water_intake_level as enum ('low', 'normal', 'high');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'stool_condition_type'
  ) then
    create type public.stool_condition_type as enum (
      'normal',
      'soft',
      'watery',
      'constipated'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'urine_frequency_type'
  ) then
    create type public.urine_frequency_type as enum (
      'less_than_2',
      'two_to_three',
      'more_than_4'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'breath_rate_zone'
  ) then
    create type public.breath_rate_zone as enum (
      'range_15_30',
      'less_than_15',
      'range_31_40',
      'greater_than_40'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'gum_appearance_type'
  ) then
    create type public.gum_appearance_type as enum (
      'normal',
      'red',
      'pale',
      'foul_odor'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'medication_status_type'
  ) then
    create type public.medication_status_type as enum (
      'taken',
      'missed',
      'not_required'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'alert_level_type'
  ) then
    create type public.alert_level_type as enum (
      'normal',
      'caution',
      'vet_recommended',
      'emergency'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'collaborator_role_type'
  ) then
    create type public.collaborator_role_type as enum (
      'caretaker',
      'viewer'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'alert_delivery_status_type'
  ) then
    create type public.alert_delivery_status_type as enum (
      'pending',
      'sent',
      'failed',
      'skipped'
    );
  end if;
end $$;

-- ### core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  language_code text not null default 'zh-TW' check (language_code in ('en', 'zh-TW')),
  age integer check (age is null or age >= 0),
  job_status text,
  last_vet_visit_self date,
  years_owning_cat integer check (years_owning_cat is null or years_owning_cat >= 0),
  household_cat_count integer check (household_cat_count is null or household_cat_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cats (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  age_months integer not null check (age_months >= 0),
  gender public.cat_gender not null,
  breed text,
  initial_weight_kg numeric(5,2) not null check (initial_weight_kg >= 0),
  last_vet_visit_date date,
  is_on_medication boolean not null default false,
  primary_diet public.cat_diet,
  personality text,
  underlying_health_conditions text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_health_records (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  record_date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  food_type public.cat_diet,
  food_amount_grams numeric(6,1) check (food_amount_grams is null or food_amount_grams >= 0),
  feeding_time time,
  appetite_score smallint check (appetite_score is null or appetite_score between 1 and 4),
  food_brand text,
  suggested_food_grams numeric(6,1) check (suggested_food_grams is null or suggested_food_grams >= 0),
  food_ratio numeric(5,2) generated always as (
    case
      when suggested_food_grams is null
        or suggested_food_grams = 0
        or food_amount_grams is null then null
      else round((food_amount_grams / suggested_food_grams)::numeric, 2)
    end
  ) stored,
  water_intake public.water_intake_level,
  stool_condition public.stool_condition_type,
  urine_times public.urine_frequency_type,
  activity_score smallint check (activity_score is null or activity_score between 1 and 4),
  resting_breath_rate public.breath_rate_zone,
  vomit_times smallint not null default 0 check (vomit_times >= 0),
  tear_staining boolean,
  abnormal_behavior boolean,
  abnormal_behavior_note text,
  gum_appearance public.gum_appearance_type,
  medication_taken public.medication_status_type,
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (cat_id, record_date)
);

create table if not exists public.vet_visits (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  visit_date date not null,
  reason text not null,
  has_prescription boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedback_messages (
  id bigint generated by default as identity primary key,
  metric text not null,
  condition_key text not null,
  alert_level public.alert_level_type not null,
  language_code text not null default 'en' check (language_code in ('en', 'zh-TW')),
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (metric, condition_key, alert_level, language_code)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  daily_health_record_id uuid references public.daily_health_records(id) on delete set null,
  alert_date date not null,
  alert_level public.alert_level_type not null,
  alert_type text not null,
  metric text,
  condition_key text not null,
  rule_key text not null,
  message_language_code text not null check (message_language_code in ('en', 'zh-TW')),
  message text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (cat_id, alert_date, rule_key, message_language_code)
);

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email')),
  delivery_status public.alert_delivery_status_type not null default 'pending',
  delivery_group_key text,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (alert_id, user_id, channel)
);

create table if not exists public.cat_collaborators (
  cat_id uuid not null references public.cats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.collaborator_role_type not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (cat_id, user_id)
);

create table if not exists public.cat_notification_preferences (
  cat_id uuid not null references public.cats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  email_important_alerts boolean not null default true,
  email_daily_digest boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (cat_id, user_id)
);

-- ### helper functions
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
  insert into public.profiles (
    id,
    email,
    display_name
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    )
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
  values (
    new.id,
    new.owner_user_id,
    true,
    true
  )
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
  values (
    new.cat_id,
    new.user_id,
    true,
    false
  )
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

-- ### updated_at triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

drop trigger if exists set_cats_updated_at on public.cats;
create trigger set_cats_updated_at
before update on public.cats
for each row execute function app_private.set_updated_at();

drop trigger if exists set_daily_health_records_updated_at on public.daily_health_records;
create trigger set_daily_health_records_updated_at
before update on public.daily_health_records
for each row execute function app_private.set_updated_at();

drop trigger if exists set_vet_visits_updated_at on public.vet_visits;
create trigger set_vet_visits_updated_at
before update on public.vet_visits
for each row execute function app_private.set_updated_at();

drop trigger if exists set_feedback_messages_updated_at on public.feedback_messages;
create trigger set_feedback_messages_updated_at
before update on public.feedback_messages
for each row execute function app_private.set_updated_at();

drop trigger if exists set_cat_collaborators_updated_at on public.cat_collaborators;
create trigger set_cat_collaborators_updated_at
before update on public.cat_collaborators
for each row execute function app_private.set_updated_at();

drop trigger if exists set_cat_notification_preferences_updated_at on public.cat_notification_preferences;
create trigger set_cat_notification_preferences_updated_at
before update on public.cat_notification_preferences
for each row execute function app_private.set_updated_at();

-- ### signup and default preference triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

drop trigger if exists ensure_owner_notification_preferences on public.cats;
create trigger ensure_owner_notification_preferences
after insert on public.cats
for each row execute function app_private.ensure_owner_notification_preferences();

drop trigger if exists ensure_collaborator_notification_preferences on public.cat_collaborators;
create trigger ensure_collaborator_notification_preferences
after insert on public.cat_collaborators
for each row execute function app_private.ensure_collaborator_notification_preferences();

-- ### indexes
create index if not exists idx_cats_owner_user_id
  on public.cats (owner_user_id);

create index if not exists idx_daily_health_records_cat_date
  on public.daily_health_records (cat_id, record_date desc);

create index if not exists idx_daily_health_records_weight
  on public.daily_health_records (cat_id, record_date desc)
  where weight_kg is not null;

create index if not exists idx_vet_visits_cat_date
  on public.vet_visits (cat_id, visit_date desc);

create index if not exists idx_alerts_cat_date
  on public.alerts (cat_id, alert_date desc);

create index if not exists idx_alerts_daily_health_record_id
  on public.alerts (daily_health_record_id);

create index if not exists idx_alerts_active_date
  on public.alerts (is_active, alert_date desc);

create index if not exists idx_feedback_messages_lookup
  on public.feedback_messages (metric, condition_key, alert_level, language_code);

create index if not exists idx_alert_deliveries_user_status
  on public.alert_deliveries (user_id, delivery_status, created_at desc);

create index if not exists idx_daily_health_records_created_by
  on public.daily_health_records (created_by);

create index if not exists idx_vet_visits_created_by
  on public.vet_visits (created_by);

create index if not exists idx_cat_collaborators_user_role
  on public.cat_collaborators (user_id, role);

create index if not exists idx_cat_collaborators_invited_by
  on public.cat_collaborators (invited_by);

create index if not exists idx_cat_notification_preferences_user_flags
  on public.cat_notification_preferences (user_id, email_important_alerts, email_daily_digest);

-- ### row level security
alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.daily_health_records enable row level security;
alter table public.vet_visits enable row level security;
alter table public.feedback_messages enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_deliveries enable row level security;
alter table public.cat_collaborators enable row level security;
alter table public.cat_notification_preferences enable row level security;

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

drop policy if exists cats_select_visible on public.cats;
create policy cats_select_visible
on public.cats
for select
to authenticated
using (app_private.can_view_cat(id));

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

drop policy if exists cats_delete_manage on public.cats;
create policy cats_delete_manage
on public.cats
for delete
to authenticated
using (app_private.can_manage_cat(id));

drop policy if exists daily_health_records_select_visible on public.daily_health_records;
create policy daily_health_records_select_visible
on public.daily_health_records
for select
to authenticated
using (app_private.can_view_cat(cat_id));

drop policy if exists daily_health_records_insert_editable on public.daily_health_records;
create policy daily_health_records_insert_editable
on public.daily_health_records
for insert
to authenticated
with check (app_private.can_edit_cat(cat_id));

drop policy if exists daily_health_records_update_editable on public.daily_health_records;
create policy daily_health_records_update_editable
on public.daily_health_records
for update
to authenticated
using (app_private.can_edit_cat(cat_id))
with check (app_private.can_edit_cat(cat_id));

drop policy if exists daily_health_records_delete_editable on public.daily_health_records;
create policy daily_health_records_delete_editable
on public.daily_health_records
for delete
to authenticated
using (app_private.can_edit_cat(cat_id));

drop policy if exists vet_visits_select_visible on public.vet_visits;
create policy vet_visits_select_visible
on public.vet_visits
for select
to authenticated
using (app_private.can_view_cat(cat_id));

drop policy if exists vet_visits_insert_editable on public.vet_visits;
create policy vet_visits_insert_editable
on public.vet_visits
for insert
to authenticated
with check (app_private.can_edit_cat(cat_id));

drop policy if exists vet_visits_update_editable on public.vet_visits;
create policy vet_visits_update_editable
on public.vet_visits
for update
to authenticated
using (app_private.can_edit_cat(cat_id))
with check (app_private.can_edit_cat(cat_id));

drop policy if exists vet_visits_delete_editable on public.vet_visits;
create policy vet_visits_delete_editable
on public.vet_visits
for delete
to authenticated
using (app_private.can_edit_cat(cat_id));

drop policy if exists feedback_messages_select_active on public.feedback_messages;
create policy feedback_messages_select_active
on public.feedback_messages
for select
to authenticated
using (is_active = true);

drop policy if exists alerts_select_visible on public.alerts;
create policy alerts_select_visible
on public.alerts
for select
to authenticated
using (app_private.can_view_cat(cat_id));

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

drop policy if exists cat_collaborators_insert_manage on public.cat_collaborators;
create policy cat_collaborators_insert_manage
on public.cat_collaborators
for insert
to authenticated
with check (app_private.can_manage_cat(cat_id));

drop policy if exists cat_collaborators_update_manage on public.cat_collaborators;
create policy cat_collaborators_update_manage
on public.cat_collaborators
for update
to authenticated
using (app_private.can_manage_cat(cat_id))
with check (app_private.can_manage_cat(cat_id));

drop policy if exists cat_collaborators_delete_manage on public.cat_collaborators;
create policy cat_collaborators_delete_manage
on public.cat_collaborators
for delete
to authenticated
using (app_private.can_manage_cat(cat_id));

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

-- ### feedback message seed data
with seed(metric, condition_key, alert_level, language_code, message) as (
  values
    ('appetite_score', 'value_2', 'caution', 'en', 'Eating less today. Please keep an eye on it.'),
    ('appetite_score', 'value_2', 'vet_recommended', 'en', 'Has been eating poorly for 2 days. A vet visit would be wise.'),
    ('appetite_score', 'value_1', 'emergency', 'en', 'Not eating at all. Please contact a vet right away.'),
    ('food_ratio', 'ge_1.2', 'caution', 'en', 'Ate more than usual. You might want to adjust the portion.'),
    ('food_ratio', 'range_0.5_0.8', 'caution', 'en', 'Eating less than normal. Let''s monitor.'),
    ('food_ratio', 'range_0.5_0.8', 'vet_recommended', 'en', 'Still eating less after a few days. Better to check with a vet.'),
    ('food_ratio', 'lt_0.5', 'vet_recommended', 'en', 'Eating very little. A vet visit is recommended.'),
    ('water_intake', 'low', 'caution', 'en', 'Not drinking enough today. Try to encourage water.'),
    ('water_intake', 'low', 'vet_recommended', 'en', 'Still drinking too little. Might be time to see a vet.'),
    ('water_intake', 'high', 'caution', 'en', 'Drinking more than usual. Just keep observing.'),
    ('water_intake', 'high', 'vet_recommended', 'en', 'High water intake continues. A vet check is a good idea.'),
    ('stool_condition', 'soft', 'caution', 'en', 'Stool is a bit soft. Let''s watch it.'),
    ('stool_condition', 'soft', 'vet_recommended', 'en', 'Soft stool for several days. Consider a vet appointment.'),
    ('stool_condition', 'watery', 'vet_recommended', 'en', 'Watery stool. Please keep your cat hydrated and check in with a vet.'),
    ('stool_condition', 'watery', 'emergency', 'en', 'Watery stool for 2 days. This needs urgent vet attention.'),
    ('stool_condition', 'constipated', 'caution', 'en', 'Stool seems hard. Offer more water and keep monitoring.'),
    ('stool_condition', 'constipated', 'vet_recommended', 'en', 'Constipation has continued for several days. A vet can help.'),
    ('urine_times', 'less_than_2', 'caution', 'en', 'Peeing less today. Encourage more water.'),
    ('urine_times', 'less_than_2', 'vet_recommended', 'en', 'Still low urine output. Better to see a vet.'),
    ('urine_times', 'more_than_4', 'caution', 'en', 'Peeing more often. Just keep an eye on it.'),
    ('urine_times', 'more_than_4', 'vet_recommended', 'en', 'Frequent urination continues. A vet check is sensible.'),
    ('activity_score', 'value_2', 'caution', 'en', 'A bit less active today. Let''s observe.'),
    ('activity_score', 'value_2', 'vet_recommended', 'en', 'Low energy for 2 days. A vet visit might help.'),
    ('activity_score', 'value_1', 'vet_recommended', 'en', 'Very lethargic. Please consider seeing a vet.'),
    ('activity_score', 'value_1', 'emergency', 'en', 'Barely moving. This is urgent. Contact a vet now.'),
    ('resting_breath_rate', 'less_than_15', 'caution', 'en', 'Breathing seems slow. Recheck when fully relaxed.'),
    ('resting_breath_rate', 'range_31_40', 'caution', 'en', 'Breathing is a bit fast. Monitor when your cat is fully at rest.'),
    ('resting_breath_rate', 'greater_than_40', 'emergency', 'en', 'Very fast breathing. Please contact a vet immediately.'),
    ('vomit_times', '1', 'caution', 'en', 'Vomited once. Please keep monitoring.'),
    ('vomit_times', '1', 'vet_recommended', 'en', 'Vomiting for two days. A vet can check.'),
    ('vomit_times', 'gte2', 'vet_recommended', 'en', 'Vomited multiple times. Better to see a vet.'),
    ('abnormal_behavior', 'true', 'caution', 'en', 'Acting unusual. It may be stress or discomfort. Observe closely.'),
    ('abnormal_behavior', 'true', 'vet_recommended', 'en', 'Unusual behavior continues. A vet visit would be wise.'),
    ('gum_appearance', 'red', 'caution', 'en', 'Gums look a bit red. Keep an eye on oral health.'),
    ('gum_appearance', 'red', 'vet_recommended', 'en', 'Red gums have persisted. A vet should take a look.'),
    ('gum_appearance', 'pale', 'vet_recommended', 'en', 'Gums look pale. Please see a vet.'),
    ('gum_appearance', 'foul_odor', 'vet_recommended', 'en', 'Bad breath is noticeable. A vet check is a good idea.'),
    ('medication_taken', 'missed', 'caution', 'en', 'Missed a dose. Give it as soon as you safely can.'),
    ('medication_taken', 'missed', 'vet_recommended', 'en', 'Missed two days of medicine. Contact your vet.'),
    ('medication_taken', 'missed', 'emergency', 'en', 'Missed three days of critical medicine. Call your vet urgently.'),
    ('weight_change_percent', 'loss_5_10', 'vet_recommended', 'en', 'Weight dropped more than 5%. A vet visit is a good precaution.'),
    ('weight_change_percent', 'loss_ge10', 'emergency', 'en', 'Weight dropped 10%. Please see a vet immediately.'),
    ('weight_change_percent', 'gain_ge10', 'caution', 'en', 'Weight increased a lot. Consider adjusting food and activity.'),
    ('weight_change_percent', 'kitten_stagnant', 'vet_recommended', 'en', 'Kitten weight gain looks stalled. A vet should check.'),
    ('combination', 'combination_appetite_activity', 'vet_recommended', 'en', 'Eating less and moving less. It might be time for a vet visit.'),
    ('combination', 'combination_activity1_appetite2', 'emergency', 'en', 'Very low energy and not eating. Please contact a vet now.'),
    ('combination', 'combination_water_low_urine_low', 'vet_recommended', 'en', 'Drinking and peeing less. A vet check is a good idea.'),
    ('combination', 'combination_water_high_urine_high', 'vet_recommended', 'en', 'Drinking and peeing a lot. Better to see a vet.'),
    ('combination', 'combination_watery_stool_vomit', 'emergency', 'en', 'Watery diarrhea and vomiting. This needs urgent care.'),
    ('combination', 'combination_breath_fast_activity_low', 'emergency', 'en', 'Fast breathing and very low activity. Please see an emergency vet.'),
    ('weight_reminder', 'weigh_every_30_days', 'caution', 'en', 'It may be a good time to log a fresh weight check.'),
    ('vet_visit_reminder', 'overdue_annual_check', 'caution', 'en', 'It has been a while since the last vet visit. Consider scheduling a routine checkup.'),
    ('daily_summary', 'all_normal', 'normal', 'en', 'Great job. Your cat looks stable today based on the information you logged.'),
    ('appetite_score', 'value_2', 'caution', 'zh-TW', '今天吃得比較少，請多留意。'),
    ('appetite_score', 'value_2', 'vet_recommended', 'zh-TW', '連續兩天吃不多，建議帶去給獸醫看看。'),
    ('appetite_score', 'value_1', 'emergency', 'zh-TW', '完全不吃東西，請馬上聯絡獸醫。'),
    ('food_ratio', 'ge_1.2', 'caution', 'zh-TW', '吃得比平常多，可以考慮微調份量。'),
    ('food_ratio', 'range_0.5_0.8', 'caution', 'zh-TW', '吃得比平常少，再觀察看看。'),
    ('food_ratio', 'range_0.5_0.8', 'vet_recommended', 'zh-TW', '已經好幾天吃不到建議量，建議諮詢獸醫。'),
    ('food_ratio', 'lt_0.5', 'vet_recommended', 'zh-TW', '吃得太少了，建議帶去檢查。'),
    ('water_intake', 'low', 'caution', 'zh-TW', '今天喝水比較少，請多鼓勵喝水。'),
    ('water_intake', 'low', 'vet_recommended', 'zh-TW', '連續幾天喝水太少，建議和獸醫討論。'),
    ('water_intake', 'high', 'caution', 'zh-TW', '喝水比平常多，先觀察一下。'),
    ('water_intake', 'high', 'vet_recommended', 'zh-TW', '持續喝很多水，建議安排檢查。'),
    ('stool_condition', 'soft', 'caution', 'zh-TW', '便便有點軟，今天觀察看看。'),
    ('stool_condition', 'soft', 'vet_recommended', 'zh-TW', '軟便已持續幾天，建議帶去給獸醫看看。'),
    ('stool_condition', 'watery', 'vet_recommended', 'zh-TW', '拉水便了，請注意補充水分並儘快與獸醫聯繫。'),
    ('stool_condition', 'watery', 'emergency', 'zh-TW', '連續兩天水樣腹瀉，請緊急就醫。'),
    ('stool_condition', 'constipated', 'caution', 'zh-TW', '便便偏硬，先多補充水分並觀察。'),
    ('stool_condition', 'constipated', 'vet_recommended', 'zh-TW', '便秘已持續幾天，建議請獸醫評估。'),
    ('urine_times', 'less_than_2', 'caution', 'zh-TW', '今天尿尿次數偏少，鼓勵多喝水。'),
    ('urine_times', 'less_than_2', 'vet_recommended', 'zh-TW', '連續兩天尿很少，建議就醫。'),
    ('urine_times', 'more_than_4', 'caution', 'zh-TW', '尿尿次數較多，再觀察一下。'),
    ('urine_times', 'more_than_4', 'vet_recommended', 'zh-TW', '持續多尿，建議安排檢查。'),
    ('activity_score', 'value_2', 'caution', 'zh-TW', '今天比較懶散，再多觀察一天。'),
    ('activity_score', 'value_2', 'vet_recommended', 'zh-TW', '連續兩天活動力下降，建議帶去檢查。'),
    ('activity_score', 'value_1', 'vet_recommended', 'zh-TW', '幾乎不動，請考慮帶去給獸醫看看。'),
    ('activity_score', 'value_1', 'emergency', 'zh-TW', '幾乎不動，緊急情況，請馬上聯絡獸醫。'),
    ('resting_breath_rate', 'less_than_15', 'caution', 'zh-TW', '呼吸比平常慢，請在完全放鬆時再確認一次。'),
    ('resting_breath_rate', 'range_31_40', 'caution', 'zh-TW', '呼吸有點快，可能是緊張或過熱，再觀察一下。'),
    ('resting_breath_rate', 'greater_than_40', 'emergency', 'zh-TW', '呼吸非常急促，請立即聯絡獸醫。'),
    ('vomit_times', '1', 'caution', 'zh-TW', '吐了一次，先觀察。'),
    ('vomit_times', '1', 'vet_recommended', 'zh-TW', '連續兩天嘔吐，建議帶去檢查。'),
    ('vomit_times', 'gte2', 'vet_recommended', 'zh-TW', '一天吐兩次以上，請儘快就醫。'),
    ('abnormal_behavior', 'true', 'caution', 'zh-TW', '行為有點怪怪的，先觀察一下。'),
    ('abnormal_behavior', 'true', 'vet_recommended', 'zh-TW', '異常行為持續中，建議讓獸醫評估。'),
    ('gum_appearance', 'red', 'caution', 'zh-TW', '牙齦有點紅，注意口腔清潔。'),
    ('gum_appearance', 'red', 'vet_recommended', 'zh-TW', '牙齦紅腫持續中，建議讓獸醫檢查。'),
    ('gum_appearance', 'pale', 'vet_recommended', 'zh-TW', '牙齦蒼白，請儘快帶去檢查。'),
    ('gum_appearance', 'foul_odor', 'vet_recommended', 'zh-TW', '口臭明顯，建議讓獸醫檢查。'),
    ('medication_taken', 'missed', 'caution', 'zh-TW', '漏吃藥了，請儘快補上。'),
    ('medication_taken', 'missed', 'vet_recommended', 'zh-TW', '連續兩天漏吃藥，請聯絡獸醫。'),
    ('medication_taken', 'missed', 'emergency', 'zh-TW', '連續三天漏吃重要藥物，請緊急聯絡獸醫。'),
    ('weight_change_percent', 'loss_5_10', 'vet_recommended', 'zh-TW', '體重下降超過 5%，建議帶去給獸醫檢查。'),
    ('weight_change_percent', 'loss_ge10', 'emergency', 'zh-TW', '體重急降 10%，請立即看獸醫。'),
    ('weight_change_percent', 'gain_ge10', 'caution', 'zh-TW', '體重增加較多，可以留意飲食和活動量。'),
    ('weight_change_percent', 'kitten_stagnant', 'vet_recommended', 'zh-TW', '幼貓體重沒有正常增加，建議帶去檢查。'),
    ('combination', 'combination_appetite_activity', 'vet_recommended', 'zh-TW', '吃得少又不太動，建議考慮就醫。'),
    ('combination', 'combination_activity1_appetite2', 'emergency', 'zh-TW', '幾乎不動又吃很少，請馬上聯絡獸醫。'),
    ('combination', 'combination_water_low_urine_low', 'vet_recommended', 'zh-TW', '喝水少且尿尿次數少，建議就醫。'),
    ('combination', 'combination_water_high_urine_high', 'vet_recommended', 'zh-TW', '喝多尿多，建議安排檢查。'),
    ('combination', 'combination_watery_stool_vomit', 'emergency', 'zh-TW', '同時水樣腹瀉和嘔吐，請緊急就醫。'),
    ('combination', 'combination_breath_fast_activity_low', 'emergency', 'zh-TW', '呼吸急促又幾乎不動，請立即送醫。'),
    ('weight_reminder', 'weigh_every_30_days', 'caution', 'zh-TW', '現在很適合補一筆最新體重紀錄。'),
    ('vet_visit_reminder', 'overdue_annual_check', 'caution', 'zh-TW', '距離上次看診已經一段時間了，可以考慮安排例行檢查。'),
    ('daily_summary', 'all_normal', 'normal', 'zh-TW', '今天的紀錄看起來很穩定，辛苦你持續照顧。')
)
insert into public.feedback_messages (
  metric,
  condition_key,
  alert_level,
  language_code,
  message
)
select
  metric,
  condition_key,
  alert_level::public.alert_level_type,
  language_code,
  message
from seed
on conflict (metric, condition_key, alert_level, language_code) do update
set message = excluded.message,
    is_active = true,
    updated_at = timezone('utc', now());
