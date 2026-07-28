# Data Model

## Purpose
This file describes the intended core data model for CATable MVP 1.0 and the direction for future expansion.

## Core Entities
- `profile`: the app user linked to `auth.users`, including onboarding and language preference
- `cat`: the cat profile owned by one primary user
- `daily_health_record`: one structured health snapshot per cat per local calendar day
- `vet_visit`: a manual vet visit record
- `feedback_message`: localized, non-diagnostic copy used by alerts and summaries
- `alert`: a backend-generated warning, reminder, or status signal for a cat
- `alert_delivery`: per-user delivery tracking for emails or future channels
- `cat_collaborator`: future shared access for non-owner users
- `cat_notification_preference`: per-user per-cat notification settings

## MVP Relationship Direction
For MVP 1.0:
- one authenticated user has one `profile`
- one `profile` can own multiple cats
- one `cat` has many `daily_health_records`
- one `cat` has many `vet_visits`
- one `cat` has many `alerts`
- one `alert` can have many `alert_deliveries`

The app UI may stay simple in MVP, but the database should not hard-code one-cat-per-user assumptions.

## Auth And Ownership
- Supabase Auth is the source of truth for registration, login, and passwords.
- Public user data lives in `profiles`, keyed by `auth.users.id`.
- `profiles.email` is a cached copy of `auth.users.email` for alert delivery and app reads. It must stay in sync on signup and whenever Auth verifies an email change (`email_change`); alert workers must not keep mailing a stale profile address after the user changes email.
- `cats.owner_user_id` is the single source of truth for cat ownership.
- Future collaborators are stored separately in `cat_collaborators`.

## Daily Health Record Strategy
MVP 1.0 uses one main `daily_health_record` row per cat per day rather than a generic event-log model.

This row is the source of truth for:
- appetite score
- food amount and ratio
- water intake
- stool condition
- urine frequency
- activity score
- resting breath rate
- vomiting count
- abnormal behavior
- gums
- medication taken
- optional weight
- notes

The table should enforce `unique (cat_id, record_date)` so users can edit the same day’s record instead of creating duplicates.

## Derived Data
Some values should be computed from stored history instead of persisted as primary source-of-truth fields:
- `food_ratio` can be generated from `food_amount_grams / suggested_food_grams`
- `weight_change_percent` should be derived from historical weight data
- current cat health status should be derived from the highest active alert level

## Cat Profile Fields
For MVP 1.0, the cat profile should support:
- core identity fields such as name, age in months, gender, breed, and initial weight
- optional reusable profile context such as `personality`
- optional `underlying_health_conditions` as a lightweight string list
- medication status and primary diet
- last vet visit date

Keep `underlying_health_conditions` lightweight for MVP 1.0. If conditions later need diagnosis dates, status history, or vet-linked notes, move them into a dedicated table.

## Alert And Messaging Model
The alert system is split into two layers:

- `alert_rules.json` defines backend rule logic and machine-readable keys
- `feedback_messages` stores the user-facing copy in English and Traditional Chinese

The backend rule engine should:
- evaluate daily records against the config
- look up localized feedback text by `(metric, condition_key, alert_level, language_code)`
- insert `alerts`
- create `alert_deliveries` for all intended recipients

## Collaboration And Delivery
Later, the model should support:
- one user owning multiple cats
- one cat having multiple caretakers or viewers
- important alert emails going to the owner and opted-in collaborators

That means:
- keep ownership on `cats`
- use `cat_collaborators` for access roles
- use `cat_notification_preferences` for who receives `vet_recommended`, `emergency`, and digest emails

## Modeling Rule
Do not add a second parallel logging model unless there is a strong documented reason.

For CATable, prefer extending the dedicated `daily_health_records` model and related alert tables over reintroducing a generic `log_entry` source of truth.
