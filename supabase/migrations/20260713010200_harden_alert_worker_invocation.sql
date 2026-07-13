-- ### clear old worker claims on new activity so alerts cannot get stuck behind a crashed run
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

-- ### invoke privileged alert workers with the service-role key now enforced in Edge Function code
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
