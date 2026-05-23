-- ### aggregate quick-log writes inside the single daily record without client-side lost updates
create or replace function public.save_daily_health_record_log(
  p_cat_id uuid,
  p_record_date date,
  p_feeding_time time default null,
  p_food_type public.cat_diet default null,
  p_food_amount_grams numeric default null,
  p_appetite_score smallint default null,
  p_food_brand text default null,
  p_suggested_food_grams numeric default null,
  p_water_intake public.water_intake_level default null,
  p_stool_condition public.stool_condition_type default null,
  p_urine_times public.urine_frequency_type default null,
  p_activity_score smallint default null,
  p_resting_breath_rate public.breath_rate_zone default null,
  p_vomit_times smallint default null,
  p_tear_staining boolean default null,
  p_abnormal_behavior boolean default null,
  p_abnormal_behavior_note text default null,
  p_gum_appearance public.gum_appearance_type default null,
  p_medication_taken public.medication_status_type default null,
  p_weight_kg numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_record_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before saving logs.' using errcode = '28000';
  end if;

  if not app_private.can_edit_cat(p_cat_id) then
    raise exception 'You do not have permission to edit this cat.' using errcode = '42501';
  end if;

  insert into public.daily_health_records (
    cat_id,
    created_by,
    record_date,
    food_type,
    food_amount_grams,
    feeding_time,
    appetite_score,
    food_brand,
    suggested_food_grams,
    water_intake,
    stool_condition,
    urine_times,
    activity_score,
    resting_breath_rate,
    vomit_times,
    tear_staining,
    abnormal_behavior,
    abnormal_behavior_note,
    gum_appearance,
    medication_taken,
    weight_kg,
    notes
  )
  values (
    p_cat_id,
    current_user_id,
    p_record_date,
    p_food_type,
    p_food_amount_grams,
    p_feeding_time,
    p_appetite_score,
    nullif(btrim(p_food_brand), ''),
    p_suggested_food_grams,
    p_water_intake,
    p_stool_condition,
    p_urine_times,
    p_activity_score,
    p_resting_breath_rate,
    coalesce(p_vomit_times, 0),
    p_tear_staining,
    p_abnormal_behavior,
    nullif(btrim(p_abnormal_behavior_note), ''),
    p_gum_appearance,
    p_medication_taken,
    p_weight_kg,
    nullif(btrim(p_notes), '')
  )
  on conflict (cat_id, record_date) do update
    set created_by = coalesce(public.daily_health_records.created_by, excluded.created_by),
        food_type = coalesce(excluded.food_type, public.daily_health_records.food_type),
        food_amount_grams =
          case
            when excluded.food_amount_grams is null then public.daily_health_records.food_amount_grams
            else coalesce(public.daily_health_records.food_amount_grams, 0) + excluded.food_amount_grams
          end,
        feeding_time = coalesce(excluded.feeding_time, public.daily_health_records.feeding_time),
        appetite_score = coalesce(excluded.appetite_score, public.daily_health_records.appetite_score),
        food_brand = coalesce(excluded.food_brand, public.daily_health_records.food_brand),
        suggested_food_grams = coalesce(excluded.suggested_food_grams, public.daily_health_records.suggested_food_grams),
        water_intake = coalesce(excluded.water_intake, public.daily_health_records.water_intake),
        stool_condition = coalesce(excluded.stool_condition, public.daily_health_records.stool_condition),
        urine_times = coalesce(excluded.urine_times, public.daily_health_records.urine_times),
        activity_score = coalesce(excluded.activity_score, public.daily_health_records.activity_score),
        resting_breath_rate = coalesce(excluded.resting_breath_rate, public.daily_health_records.resting_breath_rate),
        vomit_times = (
          coalesce(public.daily_health_records.vomit_times, 0) + coalesce(excluded.vomit_times, 0)
        )::smallint,
        tear_staining = coalesce(excluded.tear_staining, public.daily_health_records.tear_staining),
        abnormal_behavior = coalesce(excluded.abnormal_behavior, public.daily_health_records.abnormal_behavior),
        abnormal_behavior_note =
          case
            when excluded.abnormal_behavior_note is null then public.daily_health_records.abnormal_behavior_note
            when nullif(btrim(public.daily_health_records.abnormal_behavior_note), '') is null then excluded.abnormal_behavior_note
            else public.daily_health_records.abnormal_behavior_note || E'\n' || excluded.abnormal_behavior_note
          end,
        gum_appearance = coalesce(excluded.gum_appearance, public.daily_health_records.gum_appearance),
        medication_taken = coalesce(excluded.medication_taken, public.daily_health_records.medication_taken),
        weight_kg = coalesce(excluded.weight_kg, public.daily_health_records.weight_kg),
        notes =
          case
            when excluded.notes is null then public.daily_health_records.notes
            when nullif(btrim(public.daily_health_records.notes), '') is null then excluded.notes
            else public.daily_health_records.notes || E'\n' || excluded.notes
          end
  returning id into saved_record_id;

  return saved_record_id;
end;
$$;

grant execute on function public.save_daily_health_record_log(
  uuid,
  date,
  time,
  public.cat_diet,
  numeric,
  smallint,
  text,
  numeric,
  public.water_intake_level,
  public.stool_condition_type,
  public.urine_frequency_type,
  smallint,
  public.breath_rate_zone,
  smallint,
  boolean,
  boolean,
  text,
  public.gum_appearance_type,
  public.medication_status_type,
  numeric,
  text
) to authenticated;
