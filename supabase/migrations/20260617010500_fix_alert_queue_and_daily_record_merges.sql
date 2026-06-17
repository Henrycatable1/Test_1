-- ### recover alert checks and merge same-day quick logs without losing daily rollups
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

create or replace function public.save_daily_health_record_log(
  p_cat_id uuid,
  p_record_date date,
  p_feeding_time time default null,
  p_food_type public.cat_diet default null,
  p_food_amount_grams numeric default null,
  p_appetite_score smallint default null,
  p_activity_score smallint default null,
  p_vomit_times_delta integer default null,
  p_abnormal_behavior boolean default null,
  p_abnormal_behavior_note text default null,
  p_medication_taken public.medication_status_type default null,
  p_weight_kg numeric default null,
  p_notes text default null
)
returns public.daily_health_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  suggested_food_grams numeric;
  saved_record public.daily_health_records;
begin
  if actor_id is null then
    raise exception 'Sign in before saving logs.' using errcode = '42501';
  end if;

  if p_record_date is null then
    raise exception 'record_date is required.' using errcode = '22004';
  end if;

  if not app_private.can_edit_cat(p_cat_id) then
    raise exception 'You do not have permission to edit this cat.' using errcode = '42501';
  end if;

  if p_vomit_times_delta is not null and p_vomit_times_delta < 0 then
    raise exception 'vomit_times_delta must be non-negative.' using errcode = '22023';
  end if;

  if p_food_amount_grams is not null and p_food_amount_grams < 0 then
    raise exception 'food_amount_grams must be non-negative.' using errcode = '22023';
  end if;

  if p_weight_kg is not null and p_weight_kg < 0 then
    raise exception 'weight_kg must be non-negative.' using errcode = '22023';
  end if;

  if p_food_amount_grams is not null or p_food_type is not null then
    select app_private.calculate_suggested_food_grams(
      c.initial_weight_kg,
      c.age_months,
      coalesce(p_food_type, c.primary_diet)
    )
    into suggested_food_grams
    from public.cats c
    where c.id = p_cat_id;
  end if;

  insert into public.daily_health_records (
    cat_id,
    created_by,
    record_date,
    feeding_time,
    food_type,
    food_amount_grams,
    appetite_score,
    suggested_food_grams,
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
    actor_id,
    p_record_date,
    p_feeding_time,
    p_food_type,
    p_food_amount_grams,
    p_appetite_score,
    suggested_food_grams,
    p_activity_score,
    coalesce(p_vomit_times_delta, 0),
    p_abnormal_behavior,
    p_abnormal_behavior_note,
    p_medication_taken,
    p_weight_kg,
    nullif(p_notes, '')
  )
  on conflict (cat_id, record_date) do update
    set created_by = actor_id,
        feeding_time = coalesce(excluded.feeding_time, public.daily_health_records.feeding_time),
        food_type = coalesce(excluded.food_type, public.daily_health_records.food_type),
        food_amount_grams = case
          when excluded.food_amount_grams is null then public.daily_health_records.food_amount_grams
          else coalesce(public.daily_health_records.food_amount_grams, 0) + excluded.food_amount_grams
        end,
        appetite_score = coalesce(excluded.appetite_score, public.daily_health_records.appetite_score),
        suggested_food_grams = coalesce(excluded.suggested_food_grams, public.daily_health_records.suggested_food_grams),
        activity_score = coalesce(excluded.activity_score, public.daily_health_records.activity_score),
        vomit_times = public.daily_health_records.vomit_times + coalesce(excluded.vomit_times, 0),
        abnormal_behavior = coalesce(excluded.abnormal_behavior, public.daily_health_records.abnormal_behavior),
        abnormal_behavior_note = case
          when nullif(excluded.abnormal_behavior_note, '') is null then public.daily_health_records.abnormal_behavior_note
          when nullif(public.daily_health_records.abnormal_behavior_note, '') is null then excluded.abnormal_behavior_note
          else public.daily_health_records.abnormal_behavior_note || E'\n' || excluded.abnormal_behavior_note
        end,
        medication_taken = coalesce(excluded.medication_taken, public.daily_health_records.medication_taken),
        weight_kg = coalesce(excluded.weight_kg, public.daily_health_records.weight_kg),
        notes = case
          when nullif(excluded.notes, '') is null then public.daily_health_records.notes
          when nullif(public.daily_health_records.notes, '') is null then excluded.notes
          else public.daily_health_records.notes || E'\n' || excluded.notes
        end
  returning *
  into saved_record;

  return saved_record;
end;
$$;

revoke all on function public.save_daily_health_record_log(
  uuid,
  date,
  time,
  public.cat_diet,
  numeric,
  smallint,
  smallint,
  integer,
  boolean,
  text,
  public.medication_status_type,
  numeric,
  text
) from public;

grant execute on function public.save_daily_health_record_log(
  uuid,
  date,
  time,
  public.cat_diet,
  numeric,
  smallint,
  smallint,
  integer,
  boolean,
  text,
  public.medication_status_type,
  numeric,
  text
) to authenticated;
