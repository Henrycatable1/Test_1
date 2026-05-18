-- ### include a server-only worker secret so cron-triggered alert jobs are not callable with the public anon key alone
create or replace function app_private.invoke_process_pending_alert_checks()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  anon_key text;
  alert_worker_secret text;
  request_id bigint;
begin
  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret
  into anon_key
  from vault.decrypted_secrets
  where name = 'anon_key'
  limit 1;

  select decrypted_secret
  into alert_worker_secret
  from vault.decrypted_secrets
  where name = 'alert_worker_secret'
  limit 1;

  if project_url is null or anon_key is null or alert_worker_secret is null then
    raise exception 'Missing vault secrets project_url, anon_key, or alert_worker_secret for alert worker scheduling.';
  end if;

  select net.http_post(
    url := project_url || '/functions/v1/process-pending-alert-checks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-alert-worker-secret', alert_worker_secret
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
