# Rule Catalog

## Purpose
This is the canonical catalog of dashboard feedback rules, reminder rules, and warning rules.

## How To Use
- Add or update rules here before changing logic.
- Keep rule IDs stable.
- Express the logic in clear plain English first.
- Keep the machine-readable configuration aligned with `docs/alert_rules.json`.

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

## MVP 1.0 Rule Families
### Rule: metric_alert_rules
- Stable rule ID: metric_alert_rules
- Trigger conditions: one or more `daily_health_record` fields match a configured threshold, enum value, or derived condition
- Required inputs:
  - recent `daily_health_records`
  - cat profile fields such as age and weight
  - rule definitions in `docs/alert_rules.json`
  - localized feedback messages in `feedback_messages`
- Decision logic:
  - evaluate each configured metric rule using the configured time window and consecutive-day threshold
  - create an alert using the matching `metric`, `condition_key`, and `alert_level`
  - fetch user-facing message text from `feedback_messages`
- Output action shown to user:
  - show the current health status badge
  - list active alerts
  - include non-diagnostic localized message text
- Severity: varies by rule, from normal reinforcement to emergency
- Edge cases:
  - ignore missing optional fields instead of treating them as abnormal
  - avoid duplicate alerts for the same cat, date, rule, and level
  - derived rules such as weight-change or kitten-stagnation must use historical calculations rather than raw form fields
- Example scenarios:
  - appetite score `2` for two consecutive days creates a `vet_recommended` alert
  - resting breath rate `greater_than_40` creates an emergency alert the same day
- Related log item IDs: daily_health_record

### Rule: combination_alert_rules
- Stable rule ID: combination_alert_rules
- Trigger conditions: two configured abnormal conditions occur in the same day window for the same cat
- Required inputs:
  - the evaluated metric conditions for the current day
  - combination rules from `docs/alert_rules.json`
  - localized feedback messages for combination keys
- Decision logic:
  - if all configured component conditions are true in the configured window, raise the combination alert at the configured level
  - if a combination alert is more severe than single-metric alerts, it should affect the displayed overall status
- Output action shown to user:
  - show a stronger combined alert message on the dashboard and in email
- Severity: usually `vet_recommended` or `emergency`
- Edge cases:
  - do not create duplicate combination alerts if the same combination is already active for that cat and date
  - use a clear window definition such as same local day
- Example scenarios:
  - appetite score `2` plus activity score `2` creates a `vet_recommended` alert
  - watery stool plus vomiting 2 or more times creates an emergency alert
- Related log item IDs: daily_health_record

### Rule: weight_reminder
- Stable rule ID: weight_reminder
- Trigger conditions:
  - no weight has been logged for 30 days
  - or a configured trigger event suggests a weight check is useful
- Required inputs:
  - weight history from `daily_health_records`
  - weight reminder settings in `docs/alert_rules.json`
- Decision logic:
  - if the interval threshold or one of the configured trigger conditions is met, create a friendly `caution` reminder alert
- Output action shown to user:
  - prompt the user to weigh the cat without making a diagnosis
- Severity: low to medium, implemented as `caution`
- Edge cases:
  - suppress duplicates if a recent weight reminder is already active
  - reset the reminder after a new weight entry is saved
- Example scenarios:
  - 30 days pass since the last recorded weight
  - appetite score `2` for two days prompts a follow-up weight check reminder
- Related log item IDs: daily_health_record

### Rule: annual_vet_visit_reminder
- Stable rule ID: annual_vet_visit_reminder
- Trigger conditions: no vet visit has been recorded for more than 365 days
- Required inputs:
  - `vet_visits`
  - cat profile last vet context if available
  - rule config for annual reminder interval
- Decision logic:
  - if the most recent known visit is older than the configured interval, create a `caution` reminder alert
- Output action shown to user:
  - remind the user that it may be time for a routine vet check
- Severity: low to medium, implemented as `caution`
- Edge cases:
  - use the most recent structured `vet_visit` record if one exists
  - if a migrated cat profile includes only `last_vet_visit_date`, the system may use that as fallback until a structured visit is logged
- Example scenarios:
  - a cat has no vet visit logged in the last year, so the dashboard shows a yearly reminder
- Related log item IDs: vet_visit

### Rule: daily_status_summary
- Stable rule ID: daily_status_summary
- Trigger conditions: a daily record has been evaluated and no abnormal rules are active, or one or more abnormal rules are active
- Required inputs:
  - active alerts for the cat and date
  - localized message catalog
- Decision logic:
  - derive the current status from the highest active alert level
  - if no abnormal alerts are active, show positive reinforcement instead of a warning message
- Output action shown to user:
  - render a color-coded health status badge and summary card
- Severity: derived from active alerts
- Edge cases:
  - if multiple alerts exist, avoid noisy repetition in the summary card
  - preserve emergency visibility even if lower-priority alerts are also active
- Example scenarios:
  - all metrics are normal, so the user sees a positive summary message
  - one emergency alert exists, so the card reflects emergency status regardless of lower-severity alerts
- Related log item IDs: daily_health_record, vet_visit

### Rule: important_alert_email_delivery
- Stable rule ID: important_alert_email_delivery
- Trigger conditions: a `vet_recommended` or `emergency` alert is created
- Required inputs:
  - `alerts`
  - `cat_notification_preferences`
  - owner and collaborator access relationships
- Decision logic:
  - create delivery rows for the owner and any collaborators who opted into important alerts
  - send emergency emails immediately
  - include `vet_recommended` alerts in important-alert email delivery for opted-in recipients
- Output action shown to user:
  - email notification to intended recipients
- Severity: medium for `vet_recommended`, high for `emergency`
- Edge cases:
  - collaborators should only receive emails if they can view the cat and have opted in
  - per-user delivery state should be tracked separately from the alert row
- Example scenarios:
  - a shared cat enters emergency status and both the owner and caretaker receive the urgent email
- Related log item IDs: daily_health_record, vet_visit

### Rule: daily_digest_email_delivery
- Stable rule ID: daily_digest_email_delivery
- Trigger conditions: one or more non-emergency alerts remain pending for a user in the digest window
- Required inputs:
  - `alert_deliveries`
  - `cat_notification_preferences`
  - user language preference
- Decision logic:
  - group pending deliveries per user and send one daily digest email summarizing the relevant alerts
- Output action shown to user:
  - a daily summary email rather than many separate messages
- Severity: informational delivery behavior, not a health severity
- Edge cases:
  - skip users who did not opt into daily digests
  - do not send one email per alert
- Example scenarios:
  - a user has two caution alerts and one vet reminder for the same day, so they receive a single digest email
- Related log item IDs: daily_health_record, vet_visit
