# Log Catalog

## Purpose
This is the canonical catalog of supported log items for the product.

## How To Use
- Add or update entries here before changing schema or UI.
- Keep IDs stable.
- Do not invent fields in code that are not documented here.

## Entry Template
### Log Item: example_item
- Stable ID:
- Display name:
- Category:
- Purpose:
- Fields captured:
- Allowed values:
- Validation rules:
- Follow-up implications:
- Reporting / trend impact:
- Example payload:

## Initial MVP Candidates
### Log Item: food
- Stable ID: food
- Display name: Food
- Category: daily-care
- Purpose: record what and how much the cat ate
- Fields captured: `occurredAt`, `foodType`, `amount`, `unit`, `appetite`, `notes`
- Allowed values:
  - `foodType`: `dry`, `wet`, `treat`, `other`
  - `unit`: `g`, `cup`, `portion`
  - `appetite`: `normal`, `reduced`, `high`
- Validation rules:
  - `amount` must be greater than 0
  - `occurredAt` is required
  - `foodType`, `unit`, and `appetite` must use allowed enum values
- Follow-up implications: may influence appetite reminders and summaries
- Reporting / trend impact: food frequency and intake pattern trends
- Example payload:
  - `{ "type": "food", "occurredAt": "2026-04-08T19:00", "foodType": "wet", "amount": 85, "unit": "g", "appetite": "normal", "notes": "Finished most of dinner." }`

### Log Item: activity
- Stable ID: activity
- Display name: Activity
- Category: behavior
- Purpose: record the cat's observed activity level
- Fields captured: `occurredAt`, `energyLevel`, `activityType`, `durationMinutes`, `notes`
- Allowed values:
  - `energyLevel`: `low`, `medium`, `high`
  - `activityType`: `play`, `sleep`, `zoomies`, `other`
- Validation rules:
  - `durationMinutes` must be 0 or greater
  - `occurredAt` is required
  - `energyLevel` and `activityType` must use allowed enum values
- Follow-up implications: may influence inactivity reminders
- Reporting / trend impact: activity trend over time
- Example payload:
  - `{ "type": "activity", "occurredAt": "2026-04-08T14:30", "energyLevel": "medium", "activityType": "play", "durationMinutes": 20, "notes": "Played with feather wand after lunch." }`

### Log Item: abnormal_event
- Stable ID: abnormal_event
- Display name: Abnormal Event
- Category: health
- Purpose: record events such as vomiting or other concerning behavior
- Fields captured: `occurredAt`, `eventType`, `severity`, `repeatedToday`, `notes`
- Allowed values:
  - `eventType`: `vomiting`, `diarrhea`, `appetite_loss`, `other`
  - `severity`: `mild`, `moderate`, `high`
- Validation rules:
  - `occurredAt`, `eventType`, and `severity` are required
  - `repeatedToday` is a boolean
  - `eventType` and `severity` must use allowed enum values
- Follow-up implications: may trigger follow-up checks and warnings
- Reporting / trend impact: event frequency and recurrence trends
- Example payload:
  - `{ "type": "abnormal_event", "occurredAt": "2026-04-08T02:15", "eventType": "vomiting", "severity": "moderate", "repeatedToday": false, "notes": "Single episode near litter box." }`
