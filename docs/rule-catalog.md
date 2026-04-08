# Rule Catalog

## Purpose
This is the canonical catalog of dashboard feedback rules, reminder rules, and warning rules.

## How To Use
- Add or update rules here before changing logic.
- Keep rule IDs stable.
- Express the logic in clear plain English first.

## Entry Template
### Rule: example_rule
- Stable rule ID:
- Trigger conditions:
- Required inputs:
- Decision logic:
- Output action shown to user:
- Severity:
- Edge cases:
- Example scenarios:
- Related log item IDs:

## Initial MVP Candidates
### Rule: vomiting_follow_up
- Stable rule ID: vomiting_follow_up
- Trigger conditions: the most recent abnormal event is vomiting
- Required inputs: event type, event timestamp, any subsequent abnormal events
- Decision logic: if the latest `abnormal_event` log has `eventType = vomiting`, create a high-priority follow-up asking whether vomiting happened again today
- Output action shown to user: ask the user to check in about vomiting recurrence
- Severity: medium
- Edge cases: avoid repeated spam if the user already answered recently
- Example scenarios: user logged vomiting yesterday and returns today, so the dashboard prompts for a follow-up
- Related log item IDs: abnormal_event

### Rule: medication_due
- Stable rule ID: medication_due
- Trigger conditions: an active medication plan has a due time with no corresponding completion log
- Required inputs: medication schedule, current time, completion history
- Decision logic: if a medication dose is due and not yet logged as given, show a reminder
- Output action shown to user: highlight medication as the top next action
- Severity: high
- Edge cases: late logging, timezone handling, plan paused by user
- Example scenarios: morning medication is due at 8 AM and no dose log exists by login time
- Related log item IDs: medication

### Rule: missing_daily_core_log
- Stable rule ID: missing_daily_core_log
- Trigger conditions: no expected food or activity logs in the current logging window
- Required inputs: current date/time, recent food logs, recent activity logs
- Decision logic: if there is no `activity` log on the current day, create a low-priority follow-up prompting the user to record activity before the day ends
- Output action shown to user: prompt user to log the missing item
- Severity: low
- Edge cases: brand-new users, partial-day usage, unusual schedules
- Example scenarios: user logs in at night but has not recorded food yet today
- Related log item IDs: food, activity
