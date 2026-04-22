# Next Agent Debug Prompt

Use this prompt for the next agent:

```md
Please debug the current local MVP preview for CATable and determine what is truly broken versus simply unfinished.

## Goal
Make the local app usable enough for real browser testing:
- user can sign in locally
- user can create a cat profile
- user can save logs
- dashboard no longer stays stuck on "Loading dashboard"

Do not start by redesigning the product or polishing the UI. First fix the broken flow so the existing MVP can actually be exercised in a browser.

## Current known context
- Repo path: `/Users/sanlongchan/Work/Cursor Projects/Learning/Test_1`
- Canonical product requirements: `docs/product-requirements.md`
- Current execution plan: `planning.md`
- Known daily aggregation issue: `docs/repeated-event-logging-gap.md`
- Production preview was verified to serve pages successfully on `http://127.0.0.1:3001`
- `next dev` on `3000` was unreliable and served 404s, so prefer testing with production preview unless you explicitly fix dev mode too

## Current user-reported symptoms
- cannot log in
- cannot save anything
- dashboard only says "Loading dashboard"
- UI feels far from production-ready

## Important distinction
Some things are expected because MVP is unfinished:
- visual polish is still early
- summary/report/export work is incomplete
- some states are still scaffold-like

But the following should still work for MVP testing and currently appear broken:
- local auth/session flow
- onboarding save
- log save
- dashboard data load

## Most likely broken area to verify first
The local auth redirect flow may be failing because the production preview is running on:
- `http://127.0.0.1:3001`

The sign-in form builds its redirect URL from `window.location.origin`, so it currently uses:
- `http://127.0.0.1:3001/auth/callback?next=/onboarding`

Please verify whether Supabase Auth allows this exact redirect URL. If the Supabase project only allows `localhost:3000` or a different origin/port, login may appear wired in code but still fail in practice.

## Files to inspect first
- `src/features/auth/components/email-sign-in-form.tsx`
- `src/app/auth/callback/route.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/env.ts`
- `src/features/app/lib/live-data.ts`
- `src/features/dashboard/components/dashboard-view.tsx`
- `src/features/onboarding/components/onboarding-form.tsx`
- `src/features/logging/lib/logging-writes.ts`

## What to verify
1. Whether local auth completes successfully in the browser.
2. Whether a valid session exists after the auth callback.
3. Whether onboarding can insert or update a cat row.
4. Whether logging can insert or upsert into `daily_health_records` / `vet_visits`.
5. Whether dashboard loading is caused by:
   - missing session
   - rejected Supabase query
   - client-side hydration issue
   - loading state never resolving
6. Whether any RLS or schema mismatch is blocking writes.

## Expected deliverables
1. A short diagnosis separating:
   - truly broken behavior
   - unfinished but expected MVP gaps
2. Fixes for the broken browser flow.
3. A concise explanation of what was wrong.
4. Any doc updates needed if the real issue was configuration rather than code.

## Constraints
- Preserve the current product direction in `docs/product-requirements.md`.
- Do not redesign the data model.
- Do not change the single-cat UI / multi-cat-ready schema decision.
- Prefer minimal fixes that make the current MVP testable.

## Useful product notes
- MVP uses separate quick-log entry points, but most data still rolls into one `daily_health_record`.
- Dashboard state is supposed to update after the 30-second quiet window once logging stops.
- Summary and PDF export are required but do not need to be implemented as part of this debug pass unless directly needed to diagnose the broken flow.
```

## Why this prompt exists
This handoff distinguishes:
- unfinished MVP scope, which is expected
- genuinely broken local testing behavior, which should be fixed next

It should help the next agent focus on local auth, save flows, and dashboard loading before doing visual polish.
