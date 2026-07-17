-- ### Keep food-ratio alert inputs complete at the database boundary.
create or replace function app_private.populate_suggested_food_grams()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_age_months integer;
  target_diet public.cat_diet;
  target_weight_kg numeric;
begin
  if new.food_amount_grams is null then
    new.suggested_food_grams := null;
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.suggested_food_grams is not null
    and new.cat_id is not distinct from old.cat_id
    and new.record_date is not distinct from old.record_date
    and new.food_type is not distinct from old.food_type
    and new.weight_kg is not distinct from old.weight_kg then
    new.suggested_food_grams := old.suggested_food_grams;
    return new;
  end if;

  select
    cat.age_months,
    coalesce(new.food_type, cat.primary_diet),
    coalesce(
      new.weight_kg,
      (
        select record.weight_kg
        from public.daily_health_records as record
        where record.cat_id = new.cat_id
          and record.id <> new.id
          and record.record_date <= new.record_date
          and record.weight_kg is not null
        order by record.record_date desc
        limit 1
      ),
      cat.initial_weight_kg
    )
  into target_age_months, target_diet, target_weight_kg
  from public.cats as cat
  where cat.id = new.cat_id;

  new.suggested_food_grams := case
    when target_diet is null then null
    else app_private.calculate_suggested_food_grams(
      target_weight_kg,
      target_age_months,
      target_diet
    )
  end;

  return new;
end;
$$;

revoke all on function app_private.populate_suggested_food_grams() from public;

drop trigger if exists populate_suggested_food_grams_on_daily_health_records
on public.daily_health_records;

create trigger populate_suggested_food_grams_on_daily_health_records
before insert or update of cat_id, record_date, food_amount_grams, food_type, weight_kg, suggested_food_grams
on public.daily_health_records
for each row execute function app_private.populate_suggested_food_grams();

-- ### Repair only the active three-day rule window to avoid stale alert deliveries.
update public.daily_health_records
set suggested_food_grams = suggested_food_grams
where food_amount_grams is not null
  and suggested_food_grams is null
  and record_date >= current_date - 3;
