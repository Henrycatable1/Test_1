# Cat Health Log App

## What This Project Is
This repository is for MVP 1.0 of a cat health log product.

The product goal is to help a cat owner:
- sign up quickly from a QR code landing page
- create a cat profile
- log daily care and health items
- see what to log next
- view trends over time
- share a recent summary with a vet

## Current Product Direction
- Start as a web app
- Use email auth
- Support one user and one cat in MVP 1.0
- Use rules-based reminders and feedback first
- Expand later only if the MVP proves traction

## Recommended Stack
- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `Supabase`
- `Postgres`

## Start Here
If you are a human or an AI agent, read these in this order:
1. `README.md`
2. `RULE.md`
3. `planning.md`
4. `docs/game-plan.md`
5. `docs/data-model.md`
6. `docs/log-catalog.md`
7. `docs/rule-catalog.md`
8. `backlog.md`

## What Each Doc Is For
- `README.md`: project overview and document map
- `RULE.md`: short human-facing pointer to the persistent Cursor rules
- `.cursor/rules/*.mdc`: persistent Cursor-native rules for future agents
- `planning.md`: what should be built next
- `backlog.md`: ideas to discuss before implementation
- `docs/game-plan.md`: human-readable product and architecture plan
- `docs/data-model.md`: core entities, relationships, and schema direction
- `docs/product-decisions.md`: why important product and technical decisions were made
- `docs/log-catalog.md`: canonical catalog of supported log items
- `docs/rule-catalog.md`: canonical catalog of supported rules
- `docs/change-playbook.md`: required workflow for changing items or rules
- `docs/agent-handoff.md`: project assumptions and handoff notes for future agents

## Recommended Reading Pattern
Not every task needs every document.

Use this shorter path:
- For product discussion: `README.md` -> `docs/game-plan.md` -> `backlog.md`
- For implementation: `README.md` -> `RULE.md` -> `planning.md` -> relevant docs
- For adding a new item or rule: `README.md` -> `RULE.md` -> `docs/log-catalog.md` or `docs/rule-catalog.md` -> `docs/change-playbook.md`

## Current MVP 1.0 Scope
- QR-code entry to the web app
- Email registration and login
- Cat profile creation
- Logging for food, activity, medication, vet visit, and abnormal events
- Dashboard feedback and next-step prompts
- Trend views
- 7/14/30 day summaries
- Export for vet sharing

## Deferred Until Later
- Multiple users per cat
- Multiple cats per user
- LLM-generated health interpretation
- Subscription billing
- Native mobile app
- High-fidelity visual polish

## Figma Plan
When the Figma prototype is ready:
1. Connect the official Figma MCP in Cursor.
2. Pull design context from the relevant frames.
3. Map the design into the existing feature and component structure.
4. Keep schema, rules, and product logic independent from the visual layer.
