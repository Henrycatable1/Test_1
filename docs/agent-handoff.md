# Agent Handoff

## Purpose
This file helps future agents understand the product, architecture direction, constraints, and documentation workflow before making changes.

## Current Status
- Supabase schema was redesigned around `daily_health_records` instead of the older generic `log_entries` model.
- Canonical docs were aligned: `docs/data-model.md`, `docs/log-catalog.md`, `docs/rule-catalog.md`, `docs/data_schema_draft.md`, and `docs/how-to-add-items-and-rules.md`.
- Live Supabase migrations were applied successfully.
- Live tables now include:
  - `profiles`
  - `cats`
  - `daily_health_records`
  - `vet_visits`
  - `feedback_messages`
  - `alerts`
  - `alert_deliveries`
  - `cat_collaborators`
  - `cat_notification_preferences`
- `feedback_messages` seed data was loaded in English and Traditional Chinese.
- Supabase advisor follow-up fixes were applied for function `search_path`, FK indexes, and RLS policy performance.
- Edge Functions are deployed in Supabase:
  - `supabase/functions/check-alerts/index.ts`
  - `supabase/functions/send-alert-digests/index.ts`
  - `supabase/functions/process-pending-alert-checks/index.ts`
- Alert evaluation now uses a server-side debounce model:
  - database writes enqueue one pending evaluation row per cat in `cat_alert_evaluation_queue`
  - the backend waits for 30 seconds of inactivity before running `check-alerts`
  - `pg_cron` schedules `process-pending-alert-checks` every 30 seconds
  - scheduled and internal alert worker calls must use the `service_role_key` Vault secret as the bearer token
  - the logging UI, dashboard, and profile surfaces can show that today's logs are being reviewed
- The queue-based debounce flow was validated end to end against the live Supabase project:
  - burst logging collapsed into one queued evaluation window
  - due queue rows triggered alert evaluation correctly
  - caution alerts flowed into digest delivery for the owner only
  - emergency alerts sent immediate emails to both owner and collaborator when preferences allowed
  - disposable validation records were cleaned up after testing, so the project was returned to an empty data state
- Known MVP gap:
  - same-day quick-log submissions do not yet have one explicit and fully implemented daily-aggregation rule across all relevant fields
  - this affects more than abnormal events and can also apply to daily totals such as food intake
  - some fields should accumulate across same-day submissions, while others should remain one daily value for the day
  - current confirmed examples are: `vomit_times` should accumulate, food totals should accumulate, and `urine_times` should remain one daily value for MVP 1.0
  - this can prevent expected cat-state changes or produce inaccurate summaries when the same item is logged multiple times separately in one day
  - see `docs/repeated-event-logging-gap.md` before changing same-day quick-log write behavior
- `.env.example` now includes:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `ALERT_FROM_EMAIL`

## Next Recommended Steps
1. Monitor the first real-user runs of the queue-based alert workflow in Supabase logs.
2. Consider persisting more worker observability, such as `last_processed_at`, if debugging becomes noisy.
3. Continue improving user-facing value around cat state summaries, trends, and alert clarity.

## Product Summary
This project is a cat health log app focused on:
- capturing daily cat health and care logs
- surfacing useful follow-up prompts and warnings
- showing trends over time
- sharing recent summaries with vets

MVP 1.0 is web-first and optimized for quick validation.

## Current Product Constraints
- MVP UI can stay simple, but the database now supports multiple cats per owner
- Use rules-based feedback, not LLM-generated health analysis
- Prioritize speed of logging and clarity of dashboard prompts
- Keep the codebase easy for humans and future AI agents to extend

## Required Docs To Read Before Editing
- `README.md`
- `RULE.md`
- `planning.md`
- `docs/game-plan.md`
- `docs/data-model.md`
- `docs/log-catalog.md`
- `docs/rule-catalog.md`
- `docs/change-playbook.md`
- `docs/product-decisions.md`
- `backlog.md`

## Working Assumptions
- New log items must be cataloged before implementation
- New rules must be cataloged before implementation
- Product logic must not be hidden in UI components
- Future Figma integration should adapt to the existing architecture, not replace it
- `daily_health_records` is now the main health-log source of truth
- Collaborator email delivery for `vet_recommended` and `emergency` alerts is part of the target design

## Figma Implementation Notes
- Use the official Figma MCP when the design prototype is ready
- Pull frame-level design context into the existing feature structure
- Reuse components and naming conventions where possible
- Keep product logic, rules, and schema independent from visual styling

## Deferred Areas
- shared caretakers UI
- subscription billing
- LLM-generated analysis
- native mobile client

## Commenting Expectations
- Use short `###` comments for non-obvious intent and assumptions
- Avoid low-value comments that only restate code

## If You Are Asked To Add Something New
1. Check `backlog.md` to see whether the item was already discussed.
2. Ask for missing product details.
3. Update the relevant catalog doc first.
4. Then update implementation.
