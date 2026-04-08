# Execution Planning

## Current Goal
Build MVP 1.0 of the cat health log web app in a way that is fast to validate, easy to review, and easy for future agents to extend safely.

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
1. Scaffold the app and shared project structure.
2. Add docs under `docs/`.
3. Set up Supabase auth and base schema.
4. Build onboarding for a single user and a single cat.
5. Build the generic log model and first 3 log types.
6. Build a simple rules-based dashboard prompt system.

## Working Rules For Execution
- Start with `README.md` for document routing.
- Follow the docs-first workflow in `RULE.md`.
- Treat `docs/log-catalog.md` and `docs/rule-catalog.md` as canonical.
- Keep business logic isolated from page rendering code.
- Keep comments focused on intent and assumptions, not obvious code behavior.

## Ready-To-Implement Areas
- App scaffold
- Auth
- Cat profile onboarding
- Base data model
- Initial log flows
- Initial rules engine

## Deferred Until After MVP Validation
- Multiple users per cat
- Multiple cats per user
- LLM-generated health feedback
- Subscription billing
- Native mobile app
- High-fidelity graphics overhaul
