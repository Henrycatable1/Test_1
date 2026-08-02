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

## MVP 1.0 Log Items
### Log Item: daily_health_record
- Stable ID: daily_health_record
- Display name: Daily Health Record
- Category: daily-health
- Purpose: capture one structured health snapshot for a cat per local calendar day
- Fields captured:
  - `recordDate`
  - `foodType`
  - `foodAmountGrams`
  - `feedingTime`
  - `appetiteScore`
  - `foodBrand`
  - `suggestedFoodGrams`
  - `foodRatio`
  - `waterIntake`
  - `stoolCondition`
  - `urineTimes`
  - `activityScore`
  - `restingBreathRate`
  - `vomitTimes`
  - `tearStaining`
  - `abnormalBehavior`
  - `abnormalBehaviorNote`
  - `gumAppearance`
  - `medicationTaken`
  - `weightKg`
  - `notes`
- Allowed values:
  - `foodType`: `dry`, `wet`, `both`
  - `appetiteScore`: `1`, `2`, `3`, `4`
  - `waterIntake`: `low`, `normal`, `high`
  - `stoolCondition`: `normal`, `soft`, `watery`, `constipated`
  - `urineTimes`: `less_than_2`, `two_to_three`, `more_than_4`
  - `activityScore`: `1`, `2`, `3`, `4`
  - `restingBreathRate`: `range_15_30`, `less_than_15`, `range_31_40`, `greater_than_40`
  - `vomitTimes`: non-negative integer, with `2` meaning 2 or more times in the UI if product keeps the simplified selector
  - `tearStaining`: boolean
  - `abnormalBehavior`: boolean
  - `gumAppearance`: `normal`, `red`, `pale`, `foul_odor`
  - `medicationTaken`: `taken`, `missed`, `not_required`
- Validation rules:
  - `recordDate` is required
  - `recordDate` must be today or earlier on the owner's local calendar; future-dated quick logs are rejected
  - there can be only one record per cat per local calendar day
  - health fields are optional for MVP, but values must match documented enums or numeric ranges when present
  - `foodAmountGrams`, `suggestedFoodGrams`, and `weightKg` must be 0 or greater when present
  - `appetiteScore` and `activityScore` must be between `1` and `4` when present
  - repeated same-day quick-log submissions must follow explicit daily aggregation behavior inside the same daily record
  - accumulating examples include event-derived counts such as `vomitTimes` and same-day food totals such as `foodAmountGrams`
  - single-daily-value examples include day-level summary fields such as `urineTimes`
  - a future `recordDate` must never become the latest tip for alert evaluation, because tip-date cleanup deactivates earlier active alerts
- Follow-up implications:
  - powers the overall health status
  - may trigger metric alerts, combination alerts, weight reminders, and annual vet reminders
  - may trigger positive reinforcement when no abnormal conditions are found
- Reporting / trend impact:
  - weight trend
  - appetite trend
  - activity trend
  - food ratio trend
  - water intake trend
  - stool trend
  - urine frequency trend
  - breath rate trend
  - vomiting frequency trend
- Example payload:
  - `{ "recordDate": "2026-04-20", "foodType": "wet", "foodAmountGrams": 85, "appetiteScore": 3, "waterIntake": "normal", "activityScore": 3, "vomitTimes": 0, "medicationTaken": "not_required", "notes": "Ate dinner normally and played before bed." }`

### Log Item: vet_visit
- Stable ID: vet_visit
- Display name: Vet Visit
- Category: care-history
- Purpose: record manual veterinary visit history and follow-up context
- Fields captured:
  - `visitDate`
  - `reason`
  - `hasPrescription`
  - `notes`
- Allowed values:
  - `hasPrescription`: boolean
- Validation rules:
  - `visitDate` is required
  - `visitDate` must be today or earlier on the owner's local calendar; future visit dates are rejected so annual reminders are not suppressed
  - `reason` is required
  - `notes` is optional
- Follow-up implications:
  - affects annual vet reminder logic
  - may influence dashboard history and export views later
- Reporting / trend impact:
  - visit history timeline
  - last vet visit date
- Example payload:
  - `{ "visitDate": "2026-04-12", "reason": "Annual checkup and vaccine review", "hasPrescription": false, "notes": "No urgent concerns. Recommended regular weight tracking." }`
