# Data Model

## Purpose
This file describes the intended core data model for MVP 1.0 and the direction for future expansion.

## Core Entities
- `profile`: the app user linked to authentication
- `cat`: the cat profile managed by the user
- `log_entry`: a generic recorded event
- `medication_plan`: a medication schedule
- `medication_event`: a logged medication administration
- `vet_visit`: a structured visit record
- `follow_up_task`: a prompt the dashboard can surface next
- `daily_summary`: precomputed or generated summary information

## MVP Relationship Direction
For MVP 1.0:
- one authenticated user has one profile
- one profile owns one cat
- one cat has many log entries
- one cat can have many follow-up tasks
- one cat can have many summaries

This is intentionally simple for early validation.

## Future Expansion Direction
Later, the model should be able to support:
- one user owning multiple cats
- one cat having multiple caretakers

That means IDs and table structure should avoid hard-coding one-to-one assumptions into the database forever, even if the app UI enforces one cat for MVP.

## Log Entry Strategy
Use one main `log_entry` model for flexible event capture in MVP 1.0.

Each log entry should conceptually include:
- ID
- cat ID
- type
- timestamp
- notes
- structured details payload
- source or creation metadata if needed later

This makes it easy to add new log items without rebuilding the entire schema each time.

## Where Dedicated Tables Make Sense
Dedicated tables are useful when an item has complex scheduling, recurrence, or reporting needs.

Likely dedicated tables:
- `medication_plan`
- `medication_event`
- `vet_visit`

## Summary And Rule Inputs
The dashboard and reports will rely on:
- recent log history
- follow-up tasks
- medication schedule state
- computed summary windows such as 7/14/30 days

## Modeling Rule
If a new item can fit the generic `log_entry` shape, prefer that first.
If a new item needs complex recurrence or dedicated reporting behavior, consider a separate table only after documenting why in `docs/product-decisions.md`.
