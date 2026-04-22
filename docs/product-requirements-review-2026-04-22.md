# Product Requirements Review

## Purpose
This document summarizes the current product requirements implied by the repository on 2026-04-22, highlights conflicts that still need product clarification, reviews how far the codebase supports the intended MVP, and lists the remaining work to reach an MVP 1.0 launch.

This is a review document, not yet the final canonical product requirements doc. The repo still has a few scope conflicts that should be clarified first.

## Current Product Requirements

### Product goal
Build a web-first cat health log app that helps a cat owner:
- enter quickly from a QR-code entry point
- sign in with email
- create a cat profile
- log structured daily health and care information
- see dashboard follow-ups, reminders, and alerts
- view trends over time
- review recent summaries
- share a recent report with a vet

### MVP 1.0 behavior implied by the repo
- The app is web-first.
- Authentication is email-based through Supabase Auth.
- Health feedback must remain rules-based for MVP 1.0.
- The product should avoid AI diagnosis or medical claims.
- The main health logging model is one `daily_health_record` per cat per day.
- `vet_visit` is a separate structured log item.
- Alerts and summaries are generated from documented rules plus localized feedback messages.
- Important alerts can trigger email delivery.
- Lower-priority alerts can be grouped into a digest flow.

### Canonical sources today
- `docs/log-catalog.md` is the source of truth for supported log items.
- `docs/rule-catalog.md` is the source of truth for supported rules.
- `docs/alert_rules.json` is the intended machine-readable rule config.
- `docs/data-model.md` is the best current product-level data model reference.
- `planning.md` is the best current execution-status document.

## Conflicts To Clarify

### 1. One-cat MVP versus multi-cat-ready schema
Current conflict:
- `README.md`, `docs/game-plan.md`, and `docs/product-decisions.md` still describe MVP 1.0 as one user managing one cat.
- `docs/data-model.md` and `docs/agent-handoff.md` say the database should support multiple cats per owner even if the MVP UI stays simple.
- The code currently fetches and edits only the first cat for the signed-in user.

Recommended clarification:
- Decide whether MVP 1.0 means:
  - single-cat product and single-cat schema, or
  - single-cat UI with multi-cat-ready schema.

My recommendation:
- Keep the current direction: single-cat UI for MVP 1.0, multi-cat-ready schema underneath. That keeps the UX simple without painting the database into a corner.

### 2. What exactly counts as a log item now
Current conflict:
- Older planning language and examples still talk about separate food, activity, medication, and abnormal-event logs.
- The canonical log model now treats those as fields inside `daily_health_record`, with `vet_visit` as the separate structured item.
- The frontend quick-log UI still presents categories that map into the shared daily record.

Recommended clarification:
- Confirm that the product vocabulary should be:
  - user-facing: quick-log categories such as Food, Activity, Medication, Weight, Abnormal Event, Vet Visit
  - data model: one `daily_health_record` row per day plus separate `vet_visit`

My recommendation:
- Keep both, but document the distinction explicitly so product docs and implementation docs stop sounding contradictory.

### 3. MVP scope versus current implementation status
Current conflict:
- Docs describe trends, 7/14/30 day summaries, and vet export as MVP 1.0 scope.
- The current codebase does not yet implement a dedicated report page, export flow, or real trend visualizations.

Recommended clarification:
- Decide whether these are still required for MVP 1.0 launch, or whether they have moved to post-MVP polish.

My recommendation:
- Keep trend views and a lightweight vet summary in MVP 1.0.
- Treat polished export and richer report UX as the last shipping step, not as a prerequisite for current product validation.

### 4. Alert rules config source of truth
Current conflict:
- Docs point to `docs/alert_rules.json`.
- Edge Functions also keep a mirrored copy at `supabase/functions/_shared/alert-rules.json`.
- Some older draft text still references `config/alert_rules.json`.

Recommended clarification:
- Decide which path is the true authoring source and how the function copy should stay synced.

My recommendation:
- Author rules in `docs/alert_rules.json` and make the function copy an explicitly synced runtime artifact.

## Codebase Support Versus Product Requirements

### What is already supporting the MVP well
- Supabase email auth is wired, including auth callback handling.
- Cat profile creation writes to the real `cats` table.
- Quick-log flows write into `daily_health_records` and `vet_visits`.
- The dashboard reads live cat, record, and alert data.
- Alert evaluation, queueing, and email delivery infrastructure exist in Supabase.
- The schema, types, and most core app flows are already aligned around the newer daily-record model.

### What is still missing for the product requirements
- Dedicated QR-code landing flow
- Real trend views instead of summary counts
- 7/14/30 day report page
- Vet-share export flow
- Stronger auth gating for protected app routes
- Better visibility of vet visit history in the frontend
- A clearer multi-cat stance in both docs and code

### Important implementation risks
- Edge functions appear to rely heavily on deployment configuration for protection and do not enforce much request authorization in code.
- `cat_alert_evaluation_queue` is surfaced in the UI as pending whenever a row exists, which may overstate review state depending on worker behavior.
- The app still has a few scaffold-era copy fragments that make the product sound less complete than it is.

## Cleanup Findings

### Safe cleanup areas
- Stale draft references to `config/alert_rules.json`
- Old event-log examples that no longer match the daily-record model
- Scaffold-era UI copy such as `demo mode`, `scaffold`, and raw `###` text in onboarding
- Small dead-end files or indirection that no longer help readers

### Cleanup areas that should wait for clarification
- Any repo-wide rewrite of one-cat versus multi-cat wording
- Any attempt to normalize all logging terminology without first agreeing on user-facing versus data-model language
- Any removal of duplicated rule config files without establishing a sync workflow

## Test Users And Test Cat Data

### Recommendation
Yes, the project needs realistic seed data now.

Moving from a UI demo to a working MVP is much easier if the team can repeatedly test:
- first-time onboarding
- normal healthy daily logging
- warning and reminder triggers
- trend displays over time
- report summaries
- email delivery behavior

### Suggested minimum seed set
- 1 owner user with 1 healthy adult cat and 30 days of mostly normal records
- 1 owner user with 1 cat that has a few abnormal events to trigger caution and vet-follow-up alerts
- 1 owner user with 2 cats if you want to test whether the current first-cat-only assumption causes product issues
- A few `vet_visit` rows spread across time
- Notification preferences that cover digest on, digest off, and important-alert-only cases

### Why this matters
Without seed data, the app can look structurally complete while hiding:
- broken trend assumptions
- confusing empty states
- first-record edge cases
- alert timing issues
- report/export gaps

## What It Still Takes To Deploy MVP 1.0

### Product-complete items
- Decide the official MVP stance on single-cat UI versus multi-cat support
- Decide whether trend charts, report pages, and export are launch-blocking MVP items
- Write one canonical product requirements doc after those decisions are confirmed

### Application items
- Add a real trend surface
- Add a report page with 7/14/30 day summaries
- Add a vet-share export path
- Improve protected-route behavior for signed-out users
- Surface more of the saved health and vet history in the UI
- Add realistic seed data for manual QA and demos

### Backend and deployment items
- Verify Edge Function protection and deployment settings
- Verify digest scheduling in production
- Ensure required Supabase Vault secrets and Edge Function secrets are configured
- Confirm live migrations and generated app types are in sync
- Run end-to-end QA with seeded data and real email delivery

## Proposed Next Clarifications
Please confirm these product decisions so I can turn this review into a clean canonical product requirements doc:

1. Should MVP 1.0 be defined as single-cat UI but multi-cat-ready schema?
2. Are 7/14/30 day summaries and vet export still launch-blocking for MVP 1.0?
3. Do you want the quick-log categories to remain user-facing shortcuts into one daily record, or do you want separate event records later?
4. Should `docs/alert_rules.json` be the single authored rules file, with the function copy treated as derived?
