# Daily Aggregation Logging Gap

## Purpose
This document records a known product-to-implementation gap in MVP 1.0 so future agents and human contributors can fix it without guessing.

## Problem Summary
The product expects several quick-log categories to roll up into one same-day `daily_health_record`.

With the current one-row-per-day `daily_health_record` model, this should still work.

However, the current logging implementation does not yet clearly and reliably handle the difference between:
- fields that should accumulate across multiple same-day submissions
- fields that should represent one daily value for the day

## Expected Product Behavior
For MVP 1.0:
- the user can log several categories through separate quick-log entry points
- those quick logs still write into one `daily_health_record` row for the cat and local calendar day
- some categories must accumulate into daily totals when the user logs them multiple times in one day
- some categories should remain one daily value for the day and should not create separate parallel rows
- alert evaluation should then use the accumulated daily value
- after the 30 second quiet window, the dashboard should update the cat's current state and feedback accordingly

### Accumulating examples
If a cat vomits twice on the same day and the user logs each event separately:
- the final `daily_health_record.vomit_times` value for that day should be `2`
- the alert engine should evaluate the `vomit_times >= 2` rule
- the cat state should update accordingly after the debounced review window

If the cat eats multiple times on the same day and the user logs each feeding separately:
- the final `daily_health_record.food_amount_grams` value for that day should reflect the total amount eaten that day
- the daily record should support daily summaries, trend views, and report exports based on that total

### Single-daily-value examples
Some fields should still behave as one daily value for now.

Example:
- urine should remain one daily value such as total frequency for the day, not a parallel set of per-event rows in MVP 1.0
- if the user edits or re-logs it the same day, the product should preserve one final daily value rather than pretending they are separate event records

## Current Implementation Status
Initial MVP behavior is now implemented for the confirmed accumulating fields:
- same-day vomiting logs add to `daily_health_records.vomit_times`
- a repeated-today vomiting submission records at least `2` vomiting events for that day
- non-vomiting abnormal events preserve any existing vomiting count
- same-day gram-based food logs add to `daily_health_records.food_amount_grams`
- single-daily-value fields still resolve to one final daily value rather than parallel event rows

Future quick-log categories may still need classification before they are added to the daily rollup.

## Why This Matters
- It can undercount important abnormal events.
- It can undercount same-day intake totals such as food.
- It can suppress a needed cat-state change.
- It can make dashboard feedback inaccurate.
- It can make the 7/14/30 day summary and PDF export inconsistent with what the user believes they logged.

## Required Rollup Direction
Keep the MVP data model:
- continue using separate quick-log entry points in the UI
- continue using one `daily_health_record` table as the main daily source of truth

For any new same-day rollup field:
- define per-field daily aggregation behavior explicitly
- when the user logs another same-day entry for an accumulating field, the system should read or preserve the existing daily value and add or combine correctly
- when the user logs another same-day entry for a single-daily-value field, the system should preserve one coherent daily value instead of treating it like a new parallel event row

### Initial product guidance confirmed so far
- `vomit_times` should accumulate across same-day submissions
- food intake should accumulate into the daily total for the day
- urine should remain one daily value for the day for MVP 1.0

Future agents should assume this pattern may apply to multiple quick-log categories, not just vomiting.

## Acceptance Criteria
- Two separate same-day vomiting logs result in `daily_health_record.vomit_times = 2`.
- Separate same-day food logs combine into the correct daily food total.
- Single-daily-value fields still resolve to one coherent daily value instead of parallel event rows.
- The `vomit_times >= 2` rule can trigger from those two separate submissions.
- The cat's dashboard state updates after the existing 30 second debounce window.
- The 7/14/30 day summary and PDF export reflect the accumulated daily value.
- The behavior is documented clearly enough that future quick-log categories can be classified as accumulating or single-daily-value fields.

## Scope Notes
- This issue is about same-day daily aggregation behavior inside the existing daily-record model.
- This issue does not require introducing a new event table for MVP 1.0.
- `vet_visit` remains a separate structured record and is not affected by this issue.

## Implementation Hints
- Review `src/features/logging/lib/logging-writes.ts`.
- Review the abnormal-event form behavior in `src/features/logging/config/logging-config.ts`.
- Review other quick-log save paths that can contribute to the same `daily_health_record`.
- Review `docs/alert_rules.json` rules for `vomit_times`.
- Preserve docs-first alignment with `docs/product-requirements.md` and `docs/log-catalog.md`.
