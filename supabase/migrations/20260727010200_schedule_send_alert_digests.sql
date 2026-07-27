-- ### schedule daily non-emergency digest delivery so pending caution/vet/reminder emails actually send
create or replace function app_private.invoke_send_alert_digests()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  anon_key text;
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

  if project_url is null or anon_key is null then
    raise exception 'Missing vault secrets project_url or anon_key for digest worker scheduling.';
  end if;

  select net.http_post(
    url := project_url || '/functions/v1/send-alert-digests',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'triggered_at', timezone('utc', now())
    ),
    timeout_milliseconds := 15000
  )
  into request_id;

  return request_id;
end;
$$;

do $$
declare
  existing_job_id bigint;
begin
  if exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    -- ### replace any prior digest schedule so migration re-applies cleanly in restored environments
    select jobid
    into existing_job_id
    from cron.job
    where jobname = 'send-alert-digests'
    limit 1;

    if existing_job_id is not null then
      perform cron.unschedule(existing_job_id);
    end if;

    perform cron.schedule(
      'send-alert-digests',
      '0 0 * * *',
      'select app_private.invoke_send_alert_digests();'
    );
  end if;
end
$$;
