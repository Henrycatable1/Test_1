# Change Playbook

## Purpose
This file defines the required process for adding or changing log items, feedback rules, reminders, and warnings.

## For A New Log Item
1. Ask the user for:
   - item name
   - why it matters
   - fields to capture
   - allowed values
   - when it should be logged
   - whether it affects trends, summaries, reminders, or warnings
   - one realistic example entry
2. Add or update the item in `docs/log-catalog.md`.
3. Update the schema and typed definitions.
4. Update the relevant forms and views.
5. Update summaries, trends, and related rule inputs if needed.
6. Add or update tests or example fixtures.
7. Update `docs/agent-handoff.md` if assumptions changed.

## For A New Rule
1. Ask the user for:
   - rule name
   - trigger condition
   - time window
   - required context
   - user-facing output
   - severity
   - exceptions or edge cases
2. Add or update the rule in `docs/rule-catalog.md`.
3. Implement or update the logic in the rules layer.
4. Update the dashboard or reminder surfaces.
5. Add or update tests or example scenarios.
6. Update `docs/agent-handoff.md` if assumptions changed.

## Do Not Skip
- Do not add undocumented fields directly to code.
- Do not add undocumented rules directly to code.
- Do not infer medical product behavior without confirming with the user.

## Review Checklist
- Docs updated first
- Schema aligned with docs
- UI aligned with docs
- Logic aligned with docs
- Tests/examples aligned with docs
- Agent handoff updated if needed
