# Product Requirements

## Purpose
This is the canonical product requirements document for CATable MVP 1.0.

Use this file to understand:
- the MVP product goal
- the in-scope user journeys
- the required system behavior
- the current product constraints
- what is intentionally deferred

Use the supporting docs for deeper detail:
- `docs/log-catalog.md` for supported log items and fields
- `docs/rule-catalog.md` for rule families and user-facing behavior
- `docs/alert_rules.json` for machine-readable rule logic
- `docs/data-model.md` for product-level data model direction
- `planning.md` for current build and launch work

## Product Goal
Build a web-first cat health log app that helps a cat owner:
- enter quickly from a QR-code landing flow
- sign in with email
- create a cat profile
- log daily health and care information quickly
- see the cat's current state and outstanding feedback on the dashboard
- review 7, 14, and 30 day summaries
- share a PDF summary with a vet

## MVP 1.0 Scope

### Required user journeys
1. A user scans a QR code and lands on the web app.
2. A user signs in with email through Supabase Auth.
3. A user creates a cat profile.
4. A user logs daily cat health and care information through quick-log flows.
5. The app saves the logging data immediately and updates the cat's current state after a 30 second quiet window.
6. The dashboard shows the current cat state as one of:
   - `normal`
   - `caution`
   - `vet_recommended`
   - `emergency`
7. The dashboard also shows any outstanding feedback messages that apply to the current cat state.
8. A user can open a 7, 14, or 30 day summary page that shows a table of logged items.
9. A user can export a PDF vet report based on that same summary data.

### Required product behavior
- MVP 1.0 is rules-based, not AI-diagnostic.
- Dashboard language must stay neutral and non-diagnostic.
- The dashboard state should be continuously updated after logging, using the current 30 second debounce model after the user stops logging.
- The summary page and PDF export must describe the same underlying data.
- The summary page is not a separate source of truth.
- The PDF export is a shareable representation of the same reporting view.

## Logging Model

### Product-facing behavior
The app should feel like it offers quick logging for:
- food
- activity
- medication
- weight
- abnormal events
- vet visits

### Data model behavior
For MVP 1.0, most of those quick-log categories write into one `daily_health_record` for the cat and date.

`vet_visit` remains a separate structured item.

This means:
- the user sees quick categories
- the backend stores one daily health snapshot per day
- the report page and alerts read from that shared daily record model

### Current recommendation
Keep the current model above unless product learning later proves that repeated event-style records need to exist independently.

### Confirmed MVP 1.0 decision
For MVP 1.0:
- the user should see separate quick-log entry points
- most of those quick-log flows should continue writing into one `daily_health_record` table
- this is preferred for now because it keeps the product easier to read, review, and report on during the MVP stage
- repeated same-day submissions must follow explicit daily aggregation rules inside that one daily record
- examples of accumulating daily values include vomiting counts and food totals
- examples of single-daily-value fields include urine frequency for the day
- alerts, summaries, and exports must reflect those daily rollups correctly

## Cat And Access Model

### MVP 1.0 product behavior
- The UI is single-cat for now.
- The main owner experience is optimized around one active cat at a time.

### Required schema direction
- The schema must remain multi-cat-ready.
- The schema must remain scalable to owner and collaborator access later.
- Do not redesign the database around a permanent one-cat-only assumption.

### Collaboration direction
- MVP 1.0 does not need full collaborator UI.
- The backend and schema should continue supporting future owner and collaborator workflows, especially for alerts and notifications.

## Rules And Alerts

### Sources of truth
- `docs/rule-catalog.md` is the canonical human-readable rule catalog.
- `docs/alert_rules.json` is the canonical machine-readable rule config.
- `feedback_messages` is the canonical source of user-facing localized alert copy in the product runtime.

### Required alert behavior
- Alerts are evaluated from logged health data.
- Important alerts and reminders must be able to affect the dashboard state.
- The highest active severity determines the current cat state.
- Outstanding feedback messages must remain visible until the relevant conditions clear or the product explicitly resolves them.
- Privileged alert worker endpoints must reject public/browser invocation and only accept internal service-role authorization.

### Alert timing
- Logging writes should save immediately.
- Alert evaluation should run after the 30 second debounce window once logging activity stops.
- The dashboard should reflect that review lifecycle clearly and then show the updated current state.

## Reporting And Vet Sharing

### Summary requirement
The app must provide a 7, 14, and 30 day summary page that presents logged items in a table.

### PDF requirement
The app must provide a PDF vet export based on the same summary data shown in the app.

### Reporting rule
Do not let the web summary view and the PDF export drift into two different reporting definitions.

If the summary table changes, the PDF export should be updated to match.

## Product Constraints
- Web-first MVP
- Email auth through Supabase
- Rules-based feedback only for MVP 1.0
- No AI diagnosis or medical claims without an explicit product change
- Neutral language such as `check in`, `follow up`, or `consider contacting your vet`
- Keep business logic explicit in docs, schema, and backend logic

## Deferred Until Later
- Full multi-cat UI
- Full collaborator management UI
- LLM-generated health interpretation
- Subscription billing
- Native mobile app
- High-fidelity visual polish beyond MVP needs

## Reliable Alert Rule Update Workflow
When the product iterates, use this workflow:

1. Update the plain-English rule intent first in `docs/rule-catalog.md`.
2. Update the machine-readable logic in `docs/alert_rules.json`.
3. Sync the runtime copy used by Edge Functions in `supabase/functions/_shared/alert-rules.json`.
4. Update any related `feedback_messages` content if the user-facing wording changed.
5. Test the affected scenarios with seeded cats and records.
6. Refresh `planning.md` and `docs/agent-handoff.md` if the change affects roadmap, assumptions, or live behavior.

### Reliability rules
- Treat `docs/alert_rules.json` as the only authored machine-readable rules file.
- Treat the Edge Function copy as a derived runtime artifact.
- Never update only the function copy.
- Use `npm run sync:alert-rules` after editing `docs/alert_rules.json`.
- Prefer one product change per rule update batch so it is easy to review and test.
- Keep example seed data for normal, caution, vet-recommended, and emergency cases so regressions are easy to spot.

## Open Note
If repeated event-style logging becomes important later, revisit whether some categories should become their own event tables. For MVP 1.0, the daily-record model remains the intended source of truth.
