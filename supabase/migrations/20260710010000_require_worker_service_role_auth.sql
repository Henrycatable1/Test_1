-- ### invoke service-role Edge workers with the private key expected by worker authorization
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
