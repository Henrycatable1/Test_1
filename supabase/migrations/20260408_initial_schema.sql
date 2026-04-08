create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key,
  email text unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists cats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  age_years integer not null check (age_years >= 0),
  sex text not null check (sex in ('female', 'male', 'unknown')),
  breed text not null,
  weight_kg numeric(5,2) not null check (weight_kg >= 0),
  personality text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists log_entries (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references cats(id) on delete cascade,
  type text not null check (
    type in ('food', 'activity', 'abnormal_event', 'medication', 'vet_visit', 'weight')
  ),
  occurred_at timestamptz not null,
  notes text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists medication_plans (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references cats(id) on delete cascade,
  medication_name text not null,
  dose_amount text not null,
  due_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references cats(id) on delete cascade,
  title text not null,
  detail text not null,
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  related_log_type text,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table profiles enable row level security;
alter table cats enable row level security;
alter table log_entries enable row level security;
alter table medication_plans enable row level security;
alter table follow_up_tasks enable row level security;

create policy "profiles_select_own"
on profiles for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on profiles for insert
with check (auth.uid() = id);

create policy "cats_access_by_owner"
on cats for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "log_entries_access_by_owner"
on log_entries for all
using (
  exists (
    select 1
    from cats
    where cats.id = log_entries.cat_id
      and cats.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from cats
    where cats.id = log_entries.cat_id
      and cats.profile_id = auth.uid()
  )
);

create policy "medication_plans_access_by_owner"
on medication_plans for all
using (
  exists (
    select 1
    from cats
    where cats.id = medication_plans.cat_id
      and cats.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from cats
    where cats.id = medication_plans.cat_id
      and cats.profile_id = auth.uid()
  )
);

create policy "follow_up_tasks_access_by_owner"
on follow_up_tasks for all
using (
  exists (
    select 1
    from cats
    where cats.id = follow_up_tasks.cat_id
      and cats.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from cats
    where cats.id = follow_up_tasks.cat_id
      and cats.profile_id = auth.uid()
  )
);
