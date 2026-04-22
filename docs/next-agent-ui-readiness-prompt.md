# Next Agent UI Readiness Prompt

Use this prompt for the next agent:

```md
Please review the CATable MVP UI for production readiness and improve it without changing the confirmed product direction.

## Goal
Make the app feel significantly closer to a production-ready MVP in the browser, while preserving the current product model and not mixing this task with deep backend redesign.

Focus on:
- clearer hierarchy
- better empty states
- more trustworthy and polished UX copy
- stronger visual consistency
- smoother signed-out, first-run, and loading flows

## Important scope boundary
This task is about UI readiness, UX clarity, and frontend polish.

Do not use this task to redesign:
- the data model
- the alert model
- the single-cat UI / multi-cat-ready schema decision
- the one `daily_health_record` model

If auth/save/dashboard are still broken, those should be handled first or in parallel by a separate debugging task. This pass should assume the app is meant to become a shippable MVP, not just a prototype shell.

## Repo context
- Repo path: `/Users/sanlongchan/Work/Cursor Projects/Learning/Test_1`
- Canonical product requirements: `docs/product-requirements.md`
- Current execution plan: `planning.md`
- Product decisions: `docs/product-decisions.md`

## Current product expectations
The product should feel like:
- a warm, trustworthy cat-health logging app
- fast to understand
- easy to act in
- clear about current cat state and next steps

The dashboard should eventually communicate:
- current cat state
- outstanding feedback
- recent logging coverage
- what to do next

The summary/report/export work is still incomplete, but the current app should already feel coherent and intentional.

## User feedback to take seriously
The current UI was described as:
- not production ready
- too scaffold-like
- not convincing enough as a usable product

Treat that as valid product feedback, not just a styling preference.

## What to inspect first
- `src/app/page.tsx`
- `src/app/signin/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/logs/new/page.tsx`
- `src/app/cat-profile/page.tsx`
- `src/app/layout.tsx`
- `src/features/dashboard/components/dashboard-view.tsx`
- `src/features/onboarding/components/onboarding-form.tsx`
- `src/features/logging/components/log-entry-form.tsx`
- any shared visual components used by those screens

## What to improve
1. Landing page should feel like a real product entry, not an internal scaffold.
2. Sign-in should feel trustworthy and clear.
3. Onboarding should feel like a polished first-run experience.
4. Dashboard should feel more like a real cat-state home, not just a debug data surface.
5. Quick-log selection and entry flows should feel intentional, simple, and reassuring.
6. Loading, empty, and signed-out states should feel designed rather than placeholder.
7. Copy should sound product-facing, not implementation-facing.

## What to avoid
- Do not add fake complexity.
- Do not overdesign beyond MVP needs.
- Do not introduce medical claims.
- Do not hide important product constraints behind vague marketing copy.

## Expected deliverables
1. A short diagnosis of the main UI readiness problems.
2. Targeted frontend improvements that make the current app feel more launchable.
3. Updated copy and layout where needed.
4. A concise summary of what still remains before the UI feels MVP-ready.

## Constraints
- Preserve the confirmed product direction in `docs/product-requirements.md`.
- Keep the UI simple enough for MVP.
- Prefer improvements that increase clarity, trust, and usability over flashy styling.
- Reuse existing components and structure where possible instead of creating lots of one-off fragments.
```

## Why this prompt exists
This handoff separates:
- broken functionality debugging
- UI/product-readiness improvement

That lets the next agent work on polish with the right goal instead of treating the current UI as "good enough because it's only MVP."
