# Product Decisions

## Purpose
This file records important product and technical decisions so future contributors understand why the project works the way it does.

## Initial Decisions

### Decision: web-first MVP
- Choice: start with a web app first
- Why: fastest way to validate the product with real users and QR-code entry
- Revisit when: the MVP shows traction and mobile usage becomes important

### Decision: one user, one cat for MVP 1.0
- Choice: limit MVP to one user managing one cat
- Why: reduces product, schema, and UI complexity for early validation
- Revisit when: there is evidence users need multiple cats or shared caretakers

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
