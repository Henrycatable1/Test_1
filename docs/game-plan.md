# Cat Health App Game Plan

## Product Goal
Build MVP 1.0 of a cat health log web app that helps a cat owner:
- sign up quickly from a QR code landing page
- create a cat profile
- log daily health-related items
- see what to log next
- spot useful trends
- share a recent summary with a vet

## MVP 1.0 Scope
The first version focuses on one user managing one cat.

Supported flows:
1. User scans QR code and lands on the app.
2. User registers with email.
3. User creates a cat profile.
4. User logs events such as food, activity, medication, vet visit, and abnormal events.
5. On login, the app shows health feedback, reminders, and follow-up prompts.
6. User views trends over time.
7. User opens a cat report page with 7/14/30 day summaries.
8. User exports a shareable report for a vet.

## Recommended Stack
- Frontend: `Next.js`
- Language: `TypeScript`
- Styling: `Tailwind CSS`
- Backend: `Supabase`
- Database: `Postgres`
- Auth: `Supabase Auth`

## Why This Stack
- The data is relational and fits `Postgres` well.
- Supabase is suitable for MVP work and has a free tier that is usually enough for early validation.
- Next.js works well for a web-first launch and keeps the backend reusable later for mobile.

## Architecture Direction
### Product layers
- UI layer for pages and reusable components
- Feature layer for auth, cats, logging, dashboard, and reports
- Logic layer for validation, summaries, and rules
- Data layer for schema, queries, and persistence

### Core entities
- user profile
- cat
- log entry
- medication plan
- medication event
- vet visit
- follow-up task
- daily summary

## Single Source Of Truth
These docs must stay aligned with the implementation:
- `docs/log-catalog.md`
- `docs/rule-catalog.md`
- `docs/change-playbook.md`
- `docs/agent-handoff.md`

## How New Log Items Should Be Added
Before implementation, define the item in `docs/log-catalog.md` with:
- stable ID
- display name
- category
- purpose
- captured fields
- allowed values
- validation rules
- follow-up implications
- reporting impact
- example payload

## How New Feedback Or Warning Rules Should Be Added
Before implementation, define the rule in `docs/rule-catalog.md` with:
- stable rule ID
- trigger conditions
- required inputs
- decision logic in plain English
- resulting user-facing behavior
- severity
- edge cases
- example scenarios
- related item IDs

## Agent Workflow For New Items Or Rules
1. Ask the user for missing product details.
2. Update the relevant catalog doc first.
3. Update schema and types.
4. Update UI and logic.
5. Add tests or examples.
6. Refresh `docs/agent-handoff.md` if assumptions changed.

## Figma Plan
Figma is for design refinement, not for replacing product thinking.

When the Figma prototype is ready:
1. Connect the official Figma MCP in Cursor.
2. Pull design context from the relevant frames.
3. Map the design into the existing feature structure.
4. Reuse existing components and naming conventions.
5. Do not let generated design code override data model or rule logic.

## Deferred Until Later
- Multiple users per cat
- Multiple cats per user
- AI-generated health interpretation
- Billing and subscriptions
- Native mobile app
- High-fidelity art and graphics refresh

## Definition Of Success For MVP 1.0
The MVP is successful if a user can:
- sign up quickly
- create a cat profile in minutes
- log key daily items easily
- understand what to log next
- see meaningful trends
- export a useful recent summary for a vet
