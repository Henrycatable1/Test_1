# CATable Database And Backend Reference

## Purpose
This document is the working implementation reference for the CATable Supabase backend.

It is intended to be clearer and safer to implement than the earlier draft by resolving a few important issues:

- use Supabase Auth plus a `profiles` table instead of a public `users` table with app-managed auth fields
- use UUIDs consistently for application tables
- keep machine-friendly English enum values in the database and localize only in the UI and message catalog
- treat `daily_health_records` as the primary health log source of truth
- keep one canonical owner on the `cats` table and use a separate collaborator table for shared access later
- keep alert copy in `feedback_messages` and alert logic in `docs/alert_rules.json`
- use Edge Functions for rule evaluation and email delivery rather than pushing that logic into SQL triggers

This document should guide the migration, RLS policies, seed data, and Edge Function architecture.

## Repo Alignment Notes
This document started as a migration target for the repo and some of its earlier alignment notes are now historical.

Current repo state:

- `docs/data-model.md` is already aligned around `daily_health_records`.
- `docs/log-catalog.md` already treats the daily health form plus `vet_visit` as the canonical product logging model.
- `docs/rule-catalog.md` already reflects the config-driven alert engine at the rule-family level.
- `src/types/domain.ts` now uses generated Supabase table types, even though some UI-facing shapes are still simplified for display.

Open alignment work that still remains:

- confirm the official MVP wording for single-cat UI versus multi-cat-ready schema
- keep `docs/alert_rules.json` and the mirrored function copy in sync
- continue removing scaffold-era wording from product and UI docs

## Product Scope
- MVP 1.0
  - one owner per cat
  - multiple cats per user supported by schema
  - daily health records
  - trend charts
  - alerts
  - feedback messages in English and Traditional Chinese
- queue-based alert evaluation triggered by logging activity and processed on a short schedule
  - daily email digests
  - emergency alert emails
  - vet visit logging
- MVP 2.0
  - cat collaboration with role-based access
  - push notifications
  - CSV export
  - more advanced analytics

## Core Design Decisions
### Auth and profiles
- Supabase Auth owns registration, login, logout, and password management.
- Public app data uses `public.profiles`, keyed to `auth.users.id`.
- No `password_hash` column is stored in public tables.

### IDs
- Use UUIDs for all application tables.
- Avoid mixing UUID parents with bigint child tables.

### Localization
- Database enum values stay in English machine form.
- Friendly copy lives in `feedback_messages`.
- UI labels and dashboard badges localize those values for display.

### Ownership and collaboration
- `cats.owner_user_id` is the canonical primary owner.
- `cat_collaborators` is used only for additional access.
- Do not duplicate ownership in two places.

### Alerts and delivery
- `alerts` stores alert history and dashboard-visible active alerts.
- Per-user delivery state belongs in a separate table so collaboration can work later.
- This avoids the `is_emailed` problem where one boolean cannot represent multiple recipients.
- Per-cat notification preferences should be stored separately so owners and collaborators can opt into important-alert email delivery without coupling delivery settings to access-control rows.
- Alert evaluation should be debounced on the server so multiple logs in one burst collapse into one rule-check run.

### Rule engine
- `docs/alert_rules.json` is the source of truth for rule logic.
- `feedback_messages` is the source of truth for user-facing text.
- Edge Functions read both and write results into the database.

## Final Schema
### Enums
Use guarded enum creation in the migration for:

- `cat_gender`: `male`, `female`, `neutered_male`, `neutered_female`
- `cat_diet`: `dry`, `wet`, `both`
- `water_intake_level`: `low`, `normal`, `high`
- `stool_condition_type`: `normal`, `soft`, `watery`, `constipated`
- `urine_frequency_type`: `less_than_2`, `two_to_three`, `more_than_4`
- `breath_rate_zone`: `range_15_30`, `less_than_15`, `range_31_40`, `greater_than_40`
- `gum_appearance_type`: `normal`, `red`, `pale`, `foul_odor`
- `medication_status_type`: `taken`, `missed`, `not_required`
- `alert_level_type`: `normal`, `caution`, `vet_recommended`, `emergency`
- `collaborator_role_type`: `caretaker`, `viewer`
- `alert_delivery_status_type`: `pending`, `sent`, `failed`, `skipped`

### `profiles`
Purpose: extend `auth.users` with onboarding and language settings.

Columns:
- `id uuid primary key references auth.users(id) on delete cascade`
- `email text unique`
- `display_name text`
- `language_code text not null default 'zh-TW'`
- `age integer`
- `job_status text`
- `last_vet_visit_self date`
- `years_owning_cat integer`
- `household_cat_count integer`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:
- `email` is a cached application copy, not the auth source of truth.
- A trigger can create a profile row automatically after signup.

### `cats`
Purpose: cat profile plus primary owner.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `owner_user_id uuid not null references profiles(id) on delete cascade`
- `name text not null`
- `age_months integer not null check (age_months >= 0)`
- `gender cat_gender not null`
- `breed text`
- `initial_weight_kg numeric(5,2) not null check (initial_weight_kg >= 0)`
- `last_vet_visit_date date`
- `is_on_medication boolean not null default false`
- `primary_diet cat_diet`
- `personality text`
- `underlying_health_conditions text[] not null default '{}'::text[]`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:
- `personality` and `underlying_health_conditions` are optional but worth keeping because they already exist in the repo direction.

### `daily_health_records`
Purpose: one record per cat per calendar day.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `cat_id uuid not null references cats(id) on delete cascade`
- `record_date date not null`
- `created_by uuid not null references profiles(id)`
- `food_type cat_diet`
- `food_amount_grams numeric(6,1)`
- `feeding_time time`
- `appetite_score smallint check (appetite_score between 1 and 4)`
- `food_brand text`
- `suggested_food_grams numeric(6,1)`
- `food_ratio numeric(5,2) generated always as (
  case
    when suggested_food_grams is null or suggested_food_grams = 0 or food_amount_grams is null then null
    else round((food_amount_grams / suggested_food_grams)::numeric, 2)
  end
  ) stored`
- `water_intake water_intake_level`
- `stool_condition stool_condition_type`
- `urine_times urine_frequency_type`
- `activity_score smallint check (activity_score between 1 and 4)`
- `resting_breath_rate breath_rate_zone`
- `vomit_times smallint not null default 0 check (vomit_times >= 0)`
- `tear_staining boolean`
- `abnormal_behavior boolean`
- `abnormal_behavior_note text`
- `gum_appearance gum_appearance_type`
- `medication_taken medication_status_type`
- `weight_kg numeric(5,2) check (weight_kg >= 0)`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique (cat_id, record_date)`

Notes:
- All health fields remain optional for MVP.
- Weight-change rules should be derived from record history, not stored as a raw column.

### `vet_visits`
Purpose: manual vet visit history.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `cat_id uuid not null references cats(id) on delete cascade`
- `visit_date date not null`
- `reason text not null`
- `has_prescription boolean not null default false`
- `notes text`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `feedback_messages`
Purpose: localized, friendly, non-diagnostic copy.

Columns:
- `id bigserial primary key`
- `metric text not null`
- `condition_key text not null`
- `alert_level alert_level_type not null`
- `language_code text not null default 'en'`
- `message text not null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique (metric, condition_key, alert_level, language_code)`

Required message families:
- all metric-based alerts
- combination alerts
- `weight_reminder`
- `vet_visit_reminder`
- `daily_summary_all_normal`

Notes:
- The existing bilingual copy from the earlier draft should be reused as seed data, but seeded in migration SQL instead of being maintained as a huge inline reference block here.

### `alerts`
Purpose: immutable alert history and dashboard-visible active alerts.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `cat_id uuid not null references cats(id) on delete cascade`
- `daily_health_record_id uuid references daily_health_records(id) on delete set null`
- `alert_date date not null`
- `alert_level alert_level_type not null`
- `alert_type text not null`
- `metric text`
- `condition_key text not null`
- `rule_key text not null`
- `message_language_code text not null`
- `message text not null`
- `is_active boolean not null default true`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Notes:
- Users can read alerts they are allowed to see, but only backend code should insert them.
- Current cat health status can be derived from the highest active alert level for that cat.

### `alert_deliveries`
Purpose: per-user delivery tracking for digests and emergency emails.

Columns:
- `id uuid primary key default gen_random_uuid()`
- `alert_id uuid not null references alerts(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `channel text not null`
- `delivery_status alert_delivery_status_type not null default 'pending'`
- `delivery_group_key text`
- `delivered_at timestamptz`
- `error_message text`
- `created_at timestamptz not null default now()`
- `unique (alert_id, user_id, channel)`

Why this table matters:
- one cat may later have multiple collaborators
- one alert may need email delivery to more than one user
- one boolean on `alerts` is not enough to model that cleanly

### `cat_alert_evaluation_queue`
Purpose: debounce alert evaluation after the latest logging activity for each cat.

Columns:
- `cat_id uuid primary key references cats(id) on delete cascade`
- `last_activity_at timestamptz not null`
- `due_at timestamptz not null`
- `processing_started_at timestamptz`
- `last_processed_at timestamptz`
- `last_error text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:
- keep one row per cat so multiple logs within one session only extend the same evaluation window
- set `due_at` to `now() + interval '30 seconds'` after each new log or vet visit
- the worker should only process rows whose `due_at <= now()`
- if more logging arrives before processing starts, the worker should respect the pushed-forward `due_at`

### `cat_notification_preferences`
Purpose: per-user per-cat email preferences, including owners and collaborators.

Columns:
- `cat_id uuid not null references cats(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `email_important_alerts boolean not null default true`
- `email_daily_digest boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `primary key (cat_id, user_id)`

Why this table matters:
- the owner is not stored in `cat_collaborators`, but still needs configurable delivery settings
- collaborators may need important-alert emails without necessarily receiving every daily digest
- notification settings should remain independent from access-control roles

### `cat_collaborators`
Purpose: future multi-user cat access for MVP 2.0.

Columns:
- `cat_id uuid not null references cats(id) on delete cascade`
- `user_id uuid not null references profiles(id) on delete cascade`
- `role collaborator_role_type not null`
- `invited_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `primary key (cat_id, user_id)`

Notes:
- The owner is not stored here because the canonical owner is already `cats.owner_user_id`.
- `caretaker` can create or update records.
- `viewer` can only read.

## Indexes
Create these indexes in the migration:

- `cats(owner_user_id)`
- `daily_health_records(cat_id, record_date desc)`
- `daily_health_records(cat_id, record_date desc) where weight_kg is not null`
- `vet_visits(cat_id, visit_date desc)`
- `alerts(cat_id, alert_date desc)`
- `alerts(is_active, alert_date desc)`
- `feedback_messages(metric, condition_key, alert_level, language_code)`
- `alert_deliveries(user_id, delivery_status, created_at desc)`
- `cat_notification_preferences(user_id, email_important_alerts, email_daily_digest)`
- `cat_collaborators(user_id, role)`
- `cat_alert_evaluation_queue(due_at)`
- `cat_alert_evaluation_queue(last_processed_at)`

## Suggested Food Formula
For MVP 1.0, suggested food grams can be a simple helper based on:
- current or initial weight
- age in months
- diet type

Recommendation:
- compute the suggestion in backend code or a helper SQL function
- persist `suggested_food_grams` on each daily record
- let the database compute `food_ratio`

That keeps historical records stable even if the formula changes later.

## Row Level Security
Use helper functions in a private schema such as `app_private`:

- `can_view_cat(cat_uuid uuid)`
- `can_edit_cat(cat_uuid uuid)`
- `can_manage_cat(cat_uuid uuid)`

Policy design:

### `profiles`
- user can `select` and `update` only their own row
- insert is allowed only for their own row or handled by signup trigger

### `cats`
- owner can insert their own cats
- owner can read, update, and delete their own cats
- collaborators can read shared cats
- later, caretakers may get limited update access if product wants that

### `daily_health_records`
- MVP 1.0: owner-only write access
- MVP 2.0: owner and caretaker write access
- owner, caretaker, and viewer can read according to cat access

### `vet_visits`
- same access model as `daily_health_records`

### `cat_collaborators`
- owner manages collaborator rows for their cats
- collaborators can read rows that involve themselves

### `alerts`
- users can select alerts for cats they can view
- authenticated users do not get insert, update, or delete access
- service-role backend code inserts alerts

### `feedback_messages`
- authenticated users can read active rows
- no direct client writes

### `alert_deliveries`
- users generally should not write this table directly
- backend code manages insert and update
- read access can be restricted or omitted depending on whether delivery status needs to be visible in UI

### `cat_notification_preferences`
- users can read and update only their own preference rows for cats they can view
- owners can insert rows for themselves on cat creation and for collaborators when sharing a cat
- backend code may also upsert defaults when a collaborator is added

## Migration Rules
The migration should be truly idempotent.

That means:
- use `create extension if not exists`
- create enums with guarded `do $$ begin ... exception when duplicate_object then null; end $$`
- use `create table if not exists`
- use `alter table ... add column if not exists`
- use `create index if not exists`
- use `create or replace function`
- use `drop policy if exists` before `create policy`
- add trigger creation guards

Do not assume plain `create type` or `create policy` statements are safely repeatable.

## Alert Rules Config
Keep the canonical machine-readable config at `docs/alert_rules.json`.

The config defines:
- single-metric rules
- combination rules
- weight reminder triggers
- annual vet reminder trigger

Important rule:
- config contains rule logic and keys
- config does not contain final user-facing message text
- message text must always come from `feedback_messages`

Example shape:

```json
{
  "version": "1.0",
  "single_metric_rules": [
    {
      "metric": "appetite_score",
      "conditions": [
        { "value": 2, "level": "caution", "consecutive_days": 1, "condition_key": "value_2" },
        { "value": 2, "level": "vet_recommended", "consecutive_days": 2, "condition_key": "value_2" },
        { "value": 1, "level": "emergency", "consecutive_days": 1, "condition_key": "value_1" }
      ]
    }
  ],
  "combination_rules": [
    {
      "rule_key": "combination_appetite_activity",
      "conditions": ["appetite_score_2", "activity_score_2"],
      "level": "vet_recommended",
      "metric": "combination",
      "condition_key": "combination_appetite_activity"
    }
  ],
  "weight_reminder": {
    "interval_days": 30,
    "trigger_events": [
      "appetite_score_2_consecutive2",
      "vomit_times_gte2",
      "activity_score_2_consecutive2",
      "stool_condition_watery_consecutive2",
      "water_intake_high_and_urine_times_more_than_4_consecutive2"
    ]
  },
  "vet_visit_reminder": {
    "interval_days": 365
  }
}
```

## Edge Functions
Implement the alert workflow in Edge Functions, not in client code and not in heavy SQL triggers.

### `check-alerts`
Responsibilities:
- require a service-role bearer token because it uses privileged data access
- evaluate alerts for one cat or all cats when explicitly invoked by trusted backend automation
- fetch recent `daily_health_records` per cat
- load the rules config mirrored from `docs/alert_rules.json`
- evaluate single-metric and combination rules
- compute weight reminders and annual vet reminders
- fetch localized copy from `feedback_messages` using `profiles.language_code`
- fall back to English if the requested language is missing
- insert `alerts`
- insert pending `alert_deliveries` rows for all entitled recipients
- for `vet_recommended` and `emergency` alerts, include the owner and any collaborators whose `cat_notification_preferences.email_important_alerts = true`
- for lower-priority alerts, create digest deliveries only for users whose `cat_notification_preferences.email_daily_digest = true`

### `process-pending-alert-checks`
Responsibilities:
- require a service-role bearer token from `pg_cron`/trusted backend callers
- run on a short schedule, such as every 30 seconds
- fetch due rows from `cat_alert_evaluation_queue`
- reclaim rows whose previous processing claim exceeded the worker lease
- invoke `check-alerts` for each due `cat_id`
- mark the queue row as processed or store the latest worker error
- skip rows whose `due_at` has moved forward because newer logging happened

### Logging debounce flow
When a user saves one or more logs:
- save the `daily_health_records` or `vet_visits` write immediately
- upsert the cat's `cat_alert_evaluation_queue` row
- set `last_activity_at = now()`
- set `due_at = now() + interval '30 seconds'`
- do not invoke `check-alerts` directly from the browser on each save

This gives the app a unified review window while avoiding duplicate alert work during a burst of logging.

### `send-alert-digests`
Responsibilities:
- require a service-role bearer token because it sends queued user email
- run daily
- group non-emergency pending deliveries per user
- send one email per user per day
- mark `alert_deliveries` rows as sent, failed, or skipped

### Emergency alerts
For emergency alerts:
- create alert row immediately
- create delivery rows immediately
- send email immediately rather than waiting for the daily digest

### Recommended defaults
When a cat is created:
- create a `cat_notification_preferences` row for the owner with:
  - `email_important_alerts = true`
  - `email_daily_digest = true`

When a collaborator is added:
- create a `cat_notification_preferences` row for that collaborator with:
  - `email_important_alerts = true`
  - `email_daily_digest = false`

This gives MVP 2.0 the behavior you asked for:
- collaborators can receive emails for `vet_recommended` and `emergency` alerts
- daily digests remain opt-in or owner-first by default

## Type Generation
After the migration is applied, generate TypeScript types and use them as the app-side source of truth.

Example command:

```bash
supabase gen types typescript --local > src/types/supabase.ts
```

If local CLI generation is not available, use the Supabase MCP or project-connected generation flow instead.

## Implementation Order
1. align the repo docs to this model
2. write the idempotent migration
3. seed `feedback_messages`
4. apply migration to Supabase
5. generate TypeScript types
6. add `docs/alert_rules.json` and keep the function runtime copy synced
7. implement `check-alerts`
8. implement `process-pending-alert-checks`
9. implement `send-alert-digests`
10. replace demo app data with Supabase reads and writes

## Final Recommendation
Do not try to support both the old generic `log_entries` model and the new `daily_health_records` model in parallel.

For CATable, the dedicated daily health record model is the better long-term fit because it maps directly to:
- one record per day
- per-day health status
- trend graphs
- configurable multi-day rules
- reminder generation
- daily summary email workflows
