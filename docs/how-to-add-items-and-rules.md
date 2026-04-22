# How To Add Items And Rules

## Purpose
Use this file when you want to give me new product information later.

This project follows a docs-first workflow:
- define the product meaning first
- update the canonical docs
- then update schema, logic, and UI

The two source-of-truth docs are:
- `docs/log-catalog.md` for log items
- `docs/rule-catalog.md` for reminders, follow-ups, warnings, and status rules

The machine-readable rule config used by the backend is:
- `docs/alert_rules.json`

## When To Use Which Template

### Use the log item template when:
- you want to add a new type of thing the user can log
- you want to change the fields for an existing log item
- you want a log item to affect trends, summaries, reminders, or warnings

Examples:
- poop
- water intake
- grooming
- appetite score

### Use the rule template when:
- you want a certain situation to trigger a reminder
- you want a warning to appear on the dashboard
- you want a health status to change based on logged data
- you want follow-up behavior after a specific event

Examples:
- 3 vomiting incidents in one day
- no food logged by evening
- weight dropping for 3 days
- medication overdue

## Important Notes
- The current product model uses one `daily_health_record` per cat per day plus separate `vet_visit` entries.
- Repeated-event behavior such as vomiting should be represented in the daily record fields in the way documented by `docs/log-catalog.md`.
- Do not worry about writing technical schema details. I can translate your product instructions into docs, types, and code later.
- If you are unsure about a field or rule, add your best draft and I will ask follow-up questions before implementation.

## Template For A New Log Item
Copy, paste, and fill this in:

```md
### Log Item Request
- Name:
- Why it matters:
- When users should log it:
- Fields to capture:
- Allowed values:
- Validation rules:
- Does it affect trends?
- Does it affect summaries?
- Does it affect reminders or warnings?
- Example entry:
```

## What Good Answers Look Like For A Log Item

### Field guidance
- `Name`: the display name, such as `Poop` or `Water Intake`
- `Why it matters`: one sentence on why this information is useful
- `When users should log it`: say whether it is logged every time it happens, once daily, after a vet visit, and so on
- `Fields to capture`: list the exact pieces of information you want collected
- `Allowed values`: include enum-like choices if applicable
- `Validation rules`: include anything required, optional, min/max, or format rules
- `Does it affect trends?`: say yes or no, and what trend should be shown
- `Does it affect summaries?`: say yes or no, and what summary should mention it
- `Does it affect reminders or warnings?`: say yes or no, and what kinds
- `Example entry`: give one realistic sample

### Example Log Item Request

```md
### Log Item Request
- Name: Poop
- Why it matters: helps track digestion changes and detect constipation or diarrhea patterns
- When users should log it: each time they notice a bowel movement
- Fields to capture: occurredAt, stoolSize, stoolConsistency, stoolColor, notes
- Allowed values:
  - stoolSize: small, medium, large
  - stoolConsistency: normal, soft, diarrhea, hard
  - stoolColor: brown, dark, light, other
- Validation rules: occurredAt is required; stoolConsistency is required
- Does it affect trends?: yes, stool consistency trend and frequency trend
- Does it affect summaries?: yes, include unusual consistency patterns in summaries
- Does it affect reminders or warnings?: yes, repeated diarrhea or missing bowel movements may trigger warnings
- Example entry: Apr 8 at 7:30 AM, medium, normal, brown, no unusual notes
```

## Template For A New Rule
Copy, paste, and fill this in:

```md
### Rule Request
- Rule name:
- Why this rule matters:
- Trigger condition:
- Time window:
- Required cat or user context:
- User-facing output:
- Severity:
- Exceptions or edge cases:
- Example scenario:
```

## What Good Answers Look Like For A Rule

### Rule guidance
- `Rule name`: a short stable name, such as `vomiting_three_times_same_day`
- `Why this rule matters`: one sentence on the purpose
- `Trigger condition`: exactly what must happen
- `Time window`: same day, rolling 24 hours, last 7 days, and so on
- `Required cat or user context`: logs, medication schedules, age, current date, or anything else the rule depends on
- `User-facing output`: what the app should show the user
- `Severity`: low, medium, or high
- `Exceptions or edge cases`: anything that should suppress or soften the rule
- `Example scenario`: one realistic case

### Example Rule Request

```md
### Rule Request
- Rule name: vomiting_three_times_same_day
- Why this rule matters: repeated vomiting in a short period may need quick follow-up
- Trigger condition: a `daily_health_record` for the cat shows vomiting 3 or more times in the same local calendar day
- Time window: same local calendar day
- Required cat or user context: the cat's daily health record, the cat's local date, and whether the same episode may have been logged twice by mistake
- User-facing output: show a high-priority warning that vomiting happened multiple times today and suggest checking in or contacting a vet if it continues
- Severity: high
- Exceptions or edge cases: ignore obvious duplicate submissions within a very short time if confirmed by product rules
- Example scenario: today's daily health record is updated to show vomiting happened 3 times
```

## Recommended Way To Send Updates To Me
When you want me to update the product later, send one of these:

### For a new item
```md
Please add this new log item:

### Log Item Request
- Name:
- Why it matters:
- When users should log it:
- Fields to capture:
- Allowed values:
- Validation rules:
- Does it affect trends?
- Does it affect summaries?
- Does it affect reminders or warnings?
- Example entry:
```

### For a new rule
```md
Please add this new rule:

### Rule Request
- Rule name:
- Why this rule matters:
- Trigger condition:
- Time window:
- Required cat or user context:
- User-facing output:
- Severity:
- Exceptions or edge cases:
- Example scenario:
```

## What I Will Do After You Send One
1. Review your request for missing details.
2. Ask follow-up questions if needed.
3. Update `docs/log-catalog.md` or `docs/rule-catalog.md` first.
4. Then update schema, types, UI, and logic.
5. Keep the implementation aligned with the documented product behavior.

## Best Practice For Health Rules
If a rule depends on counting events over time, try to describe:
- what counts as one event
- the time window
- whether duplicate logs should be ignored
- whether the app should warn, remind, summarize, or change status
- how urgent the user-facing message should be

That makes it much easier to build reliable trend logic, warnings, and dashboard behavior later.
