create extension if not exists pg_net;
create extension if not exists pg_cron;
create extension if not exists supabase_vault;

-- ### keep one pending alert evaluation row per cat so bursts of logging collapse into one worker run
create table if not exists public.cat_alert_evaluation_queue (
  cat_id uuid primary key references public.cats(id) on delete cascade,
  last_activity_at timestamptz not null,
  due_at timestamptz not null,
  activity_version bigint not null default 0,
  processing_started_at timestamptz,
  processing_version bigint,
  last_processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.cat_alert_evaluation_queue
  add column if not exists cat_id uuid,
  add column if not exists last_activity_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists activity_version bigint not null default 0,
  add column if not exists processing_started_at timestamptz,
  add column if not exists processing_version bigint,
  add column if not exists last_processed_at timestamptz,
  add column if not exists last_error text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists cat_alert_evaluation_queue_due_at_idx
  on public.cat_alert_evaluation_queue(due_at);

create index if not exists cat_alert_evaluation_queue_last_processed_at_idx
  on public.cat_alert_evaluation_queue(last_processed_at desc nulls last);

alter table public.cat_alert_evaluation_queue enable row level security;

drop policy if exists cat_alert_evaluation_queue_select_visible on public.cat_alert_evaluation_queue;
create policy cat_alert_evaluation_queue_select_visible
on public.cat_alert_evaluation_queue
for select
to authenticated
using (app_private.can_view_cat(cat_id));

-- ### enqueue alert work from database writes so review timing survives page closes and refreshes
create or replace function app_private.enqueue_cat_alert_evaluation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_activity_at timestamptz := timezone('utc', now());
begin
  insert into public.cat_alert_evaluation_queue (
    cat_id,
    last_activity_at,
    due_at,
    activity_version,
    last_error,
    created_at,
    updated_at
  )
  values (
    new.cat_id,
    next_activity_at,
    next_activity_at + interval '30 seconds',
    1,
    null,
    next_activity_at,
    next_activity_at
  )
  on conflict (cat_id) do update
    set last_activity_at = excluded.last_activity_at,
        due_at = excluded.due_at,
        activity_version = public.cat_alert_evaluation_queue.activity_version + 1,
        processing_started_at = null,
        processing_version = null,
        last_error = null,
        updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists enqueue_cat_alert_evaluation_on_daily_health_records on public.daily_health_records;
create trigger enqueue_cat_alert_evaluation_on_daily_health_records
after insert or update on public.daily_health_records
for each row execute function app_private.enqueue_cat_alert_evaluation();

drop trigger if exists enqueue_cat_alert_evaluation_on_vet_visits on public.vet_visits;
create trigger enqueue_cat_alert_evaluation_on_vet_visits
after insert or update on public.vet_visits
for each row execute function app_private.enqueue_cat_alert_evaluation();

drop trigger if exists set_cat_alert_evaluation_queue_updated_at on public.cat_alert_evaluation_queue;
create trigger set_cat_alert_evaluation_queue_updated_at
before update on public.cat_alert_evaluation_queue
for each row execute function app_private.set_updated_at();

-- ### centralize the cron HTTP call so the schedule can be updated without repeating request details
create or replace function app_private.invoke_process_pending_alert_checks()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  service_role_key text;
  request_id bigint;
begin
  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret
  into service_role_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if project_url is null or service_role_key is null then
    raise exception 'Missing vault secrets project_url or service_role_key for alert worker scheduling.';
  end if;

  -- ### call the worker with service-role auth because anon/user JWTs must not trigger backend-only side effects
  select net.http_post(
    url := project_url || '/functions/v1/process-pending-alert-checks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'triggered_at', timezone('utc', now())
    ),
    timeout_milliseconds := 5000
  )
  into request_id;

  return request_id;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    perform cron.schedule(
      'process-pending-alert-checks',
      '30 seconds',
      'select app_private.invoke_process_pending_alert_checks();'
    );
  end if;
end
$$;
