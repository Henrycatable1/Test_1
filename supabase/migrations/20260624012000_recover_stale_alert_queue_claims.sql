-- ### new cat activity should unblock any abandoned alert-worker claim for that cat
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
    processing_started_at,
    processing_version,
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
    null,
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
