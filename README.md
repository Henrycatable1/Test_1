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
- Support a single-cat UI in MVP 1.0 with a multi-cat-ready schema
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
4. `docs/product-requirements.md`
5. `docs/game-plan.md`
6. `docs/data-model.md`
7. `docs/log-catalog.md`
8. `docs/rule-catalog.md`
9. `backlog.md`

## What Each Doc Is For
- `README.md`: project overview and document map
- `RULE.md`: short human-facing pointer to the persistent Cursor rules
- `.cursor/rules/*.mdc`: persistent Cursor-native rules for future agents
- `planning.md`: what should be built next
- `backlog.md`: ideas to discuss before implementation
- `docs/product-requirements.md`: canonical MVP product scope and required behavior
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
- For product discussion: `README.md` -> `docs/product-requirements.md` -> `docs/game-plan.md`
- For implementation: `README.md` -> `RULE.md` -> `planning.md` -> `docs/product-requirements.md` -> relevant docs
- For adding a new item or rule: `README.md` -> `RULE.md` -> `docs/log-catalog.md` or `docs/rule-catalog.md` -> `docs/change-playbook.md`

## Current MVP 1.0 Scope
- QR-code entry to the web app
- Email registration and login
- Cat profile creation
- Quick logging for food, activity, medication, weight, abnormal events, and vet visits
- Dashboard current state and outstanding feedback
- Trend views
- 7/14/30 day summaries shown as logged-item tables
- PDF export for vet sharing based on the same summary data

## Local Preview Auth Note
- The production preview currently runs on `http://127.0.0.1:3001`, so the local auth callback URL is `http://127.0.0.1:3001/auth/callback?next=/onboarding`.
- If local sign-in fails before the magic link email is sent, check Supabase Auth email delivery first. A broken custom SMTP setup can return a `500` from `/auth/v1/otp` even when the callback URL itself is accepted.
- To avoid localhost alias mismatches in magic-link redirects, set `NEXT_PUBLIC_APP_URL` (for example `http://127.0.0.1:3001`) in `.env.local`.
- To keep local MVP testing moving while SMTP is broken, configure `LOCAL_PREVIEW_TEST_EMAIL` and `LOCAL_PREVIEW_TEST_PASSWORD` in `.env.local`, then use the password fallback on `/signin`.

## Deferred Until Later
- Multiple users per cat
- Full multi-cat UI
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
