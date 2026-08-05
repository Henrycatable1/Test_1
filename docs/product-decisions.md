# Product Decisions

## Purpose
This file records important product and technical decisions so future contributors understand why the project works the way it does.

## Initial Decisions

### Decision: web-first MVP
- Choice: start with a web app first
- Why: fastest way to validate the product with real users and QR-code entry
- Revisit when: the MVP shows traction and mobile usage becomes important

### Decision: single-cat UI with multi-cat-ready schema
- Choice: keep MVP 1.0 focused on a single-cat UI while preserving a schema that supports multiple cats per owner and future collaborators
- Why: this keeps the user experience simple for validation while avoiding a later schema rewrite for owner and collaborator workflows
- Revisit when: the product is ready for full multi-cat navigation and collaborator management in the UI

### Decision: summary page and PDF export share one reporting definition
- Choice: the 7/14/30 day summary page and the vet PDF export must be based on the same underlying reporting data
- Why: this avoids conflicting interpretations of the cat's recent history across product surfaces
- Revisit when: the product intentionally adds multiple report formats with different audiences

### Decision: dashboard state updates after the logging quiet window
- Choice: the dashboard should show the current cat state and outstanding feedback after the existing 30 second debounce window once the user stops logging
- Why: this matches the queued alert-evaluation model and keeps the UI aligned with the actual backend review flow
- Revisit when: the product changes the debounce model or introduces a different real-time evaluation strategy

### Decision: authored alert rules live in docs/alert_rules.json
- Choice: treat `docs/alert_rules.json` as the single authored machine-readable rules file, with the Edge Function copy treated as a derived runtime artifact
- Why: one authored source reduces drift and makes rule reviews safer as the product iterates
- Revisit when: the project adds a formal build or sync pipeline for generated runtime assets

### Decision: quick-log UI with one daily health record table
- Choice: keep separate quick-log entry points in the UI while writing most of that data into one `daily_health_record` table for MVP 1.0
- Why: this keeps logging easy for the user while making the daily state, summaries, alerts, and reports easier to read and reason about during the MVP stage
- Revisit when: the product needs richer repeated-event timelines that are awkward to represent inside one daily record

### Decision: English is the MVP default profile language
- Choice: new `profiles.language_code` values default to `en`, and alert/digest delivery falls back to English when language is missing
- Why: the MVP 1.0 UI and onboarding copy are English-only, with no language picker yet; defaulting to `zh-TW` sent emergency and digest emails in Traditional Chinese that English users could not reliably understand
- Revisit when: the product ships an explicit language setting and intentional bilingual onboarding

### Decision: rules-based feedback first
- Choice: use explicit product rules for reminders, feedback, and warnings
- Why: easier to explain, test, and review than LLM-generated behavior
- Revisit when: the base logging product is stable and there is enough data to justify AI-assisted feedback

### Decision: relational backend with Supabase
- Choice: use `Supabase + Postgres`
- Why: fits relational data well and supports auth, storage, and structured growth
- Revisit when: scale, compliance, or product requirements significantly change

### Decision: docs-first change workflow
- Choice: every new log item or rule is documented before implementation
- Why: keeps product meaning clear for humans and future AI agents
- Revisit when: never remove this without replacing it with an equally strong source-of-truth workflow

### Decision: Figma supports implementation, not product logic
- Choice: use Figma to refine visuals and layout, but not to define business rules or schema
- Why: product logic and health-related behavior must remain explicit and reviewable
- Revisit when: design system maturity changes how UI work is organized

## How To Add New Decisions
Use this format:

### Decision: short_title
- Choice:
- Why:
- Revisit when:
