-- ### merge same-day quick logs atomically so accumulated daily values are not lost
create or replace function public.save_daily_health_record_log(
  p_cat_id uuid,
  p_record_date date,
  p_feeding_time time default null,
  p_food_type public.cat_diet default null,
  p_food_amount_grams numeric default null,
  p_appetite_score smallint default null,
  p_activity_score smallint default null,
  p_vomit_times_increment smallint default null,
  p_vomit_times_minimum smallint default null,
  p_abnormal_behavior boolean default null,
  p_abnormal_behavior_note text default null,
  p_medication_taken public.medication_status_type default null,
  p_weight_kg numeric default null,
  p_notes text default null
)
returns public.daily_health_records
language plpgsql
security invoker
set search_path = ''
as $$
declare
  acting_user uuid := auth.uid();
  saved_record public.daily_health_records;
begin
  if acting_user is null then
    raise exception 'save_daily_health_record_log requires an authenticated user.';
  end if;

  insert into public.daily_health_records as existing_record (
    cat_id,
    record_date,
    created_by,
    feeding_time,
    food_type,
    food_amount_grams,
    appetite_score,
    activity_score,
    vomit_times,
    abnormal_behavior,
    abnormal_behavior_note,
    medication_taken,
    weight_kg,
    notes
  )
  values (
    p_cat_id,
    p_record_date,
    acting_user,
    p_feeding_time,
    p_food_type,
    p_food_amount_grams,
    p_appetite_score,
    p_activity_score,
    greatest(0, coalesce(p_vomit_times_increment, 0), coalesce(p_vomit_times_minimum, 0)),
    p_abnormal_behavior,
    nullif(btrim(p_abnormal_behavior_note), ''),
    p_medication_taken,
    p_weight_kg,
    nullif(btrim(p_notes), '')
  )
  on conflict (cat_id, record_date) do update
    set created_by = coalesce(existing_record.created_by, excluded.created_by),
        feeding_time = coalesce(excluded.feeding_time, existing_record.feeding_time),
        food_type = coalesce(excluded.food_type, existing_record.food_type),
        food_amount_grams = case
          when excluded.food_amount_grams is null then existing_record.food_amount_grams
          when existing_record.food_amount_grams is null then excluded.food_amount_grams
          else existing_record.food_amount_grams + excluded.food_amount_grams
        end,
        appetite_score = coalesce(excluded.appetite_score, existing_record.appetite_score),
        activity_score = coalesce(excluded.activity_score, existing_record.activity_score),
        vomit_times = greatest(
          0,
          existing_record.vomit_times + coalesce(p_vomit_times_increment, 0),
          coalesce(p_vomit_times_minimum, 0)
        ),
        abnormal_behavior = coalesce(excluded.abnormal_behavior, existing_record.abnormal_behavior),
        abnormal_behavior_note = nullif(
          concat_ws(
            E'\n\n',
            nullif(btrim(existing_record.abnormal_behavior_note), ''),
            nullif(btrim(excluded.abnormal_behavior_note), '')
          ),
          ''
        ),
        medication_taken = coalesce(excluded.medication_taken, existing_record.medication_taken),
        weight_kg = coalesce(excluded.weight_kg, existing_record.weight_kg),
        notes = nullif(
          concat_ws(
            E'\n\n',
            nullif(btrim(existing_record.notes), ''),
            nullif(btrim(excluded.notes), '')
          ),
          ''
        ),
        updated_at = timezone('utc', now())
  returning * into saved_record;

  return saved_record;
end;
$$;

grant execute on function public.save_daily_health_record_log(
  uuid,
  date,
  time,
  public.cat_diet,
  numeric,
  smallint,
  smallint,
  smallint,
  smallint,
  boolean,
  text,
  public.medication_status_type,
  numeric,
  text
) to authenticated;

-- ### send scheduled alert workers with a privileged token because the functions use service-role data paths
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
