# Execution Planning

## Current Goal
Finish MVP 1.0 user value on top of the live Supabase stack, with real cat states, trends, and email alerts already wired end to end.

## Execution Order
1. Scaffold the web app with `Next.js + TypeScript + Tailwind`.
2. Create the base documentation system and project rules.
3. Set up `Supabase` for auth, database, and storage.
4. Implement email authentication.
5. Implement first-time onboarding and one-cat profile creation.
6. Build the first logging flows:
   - food
   - activity
   - abnormal event
7. Build the first dashboard feedback rules:
   - follow-up after vomiting
   - overdue medication prompt
   - missing key daily log prompt
8. Add trend views.
9. Add 7/14/30 day report summaries.
10. Add export for vet sharing.

## Immediate Next Build Sprint
1. Monitor the first real-user runs of the debounced alert workflow in Supabase logs, especially stale-claim recovery and service-role scheduled calls.
2. Improve user-facing cat state summaries and trend presentation.
3. Tighten any remaining alert-worker observability if live debugging needs it.
4. Continue polishing onboarding, logging, dashboard, and profile UX on top of live Supabase data.

## Recently Completed
- Deployed `check-alerts`, `send-alert-digests`, and `process-pending-alert-checks` to Supabase.
- Added the server-side debounce queue via `cat_alert_evaluation_queue`.
- Switched log saves away from direct `check-alerts` invocation and into queued evaluation.
- Added review-pending messaging in the logging flow, dashboard, and profile views.
- Added atomic same-day quick-log merging so food totals and vomiting counts accumulate inside `daily_health_record`.
- Locked privileged alert Edge Functions to service-role calls and kept digest delivery from consuming emergency rows.
- Validated burst logging, delayed evaluation, digest delivery, and emergency delivery end to end against the live project.

## Working Rules For Execution
- Start with `README.md` for document routing.
- Follow the docs-first workflow in `RULE.md`.
- Treat `docs/log-catalog.md` and `docs/rule-catalog.md` as canonical.
- Keep business logic isolated from page rendering code.
- Keep comments focused on intent and assumptions, not obvious code behavior.

## Ready-To-Implement Areas
- Supabase-backed onboarding
- Cat profile CRUD
- Daily health record CRUD
- Vet visit CRUD
- Alert evaluation and delivery wiring
- Dashboard data integration

## Deferred Until After MVP Validation
- Multiple users per cat
- Multiple cats per user
- LLM-generated health feedback
- Subscription billing
- Native mobile app
- High-fidelity graphics overhaul
