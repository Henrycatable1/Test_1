/**
 * ### resolve local calendar date/time from a datetime-local style value
 * Quick-log rows key off the owner's local calendar day, not the UTC clock date.
 */
export function getLocalDateParts(occurredAt: string) {
  const date = new Date(occurredAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid date and time for this log.");
  }

  const offset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offset);

  return {
    recordDate: localDate.toISOString().slice(0, 10),
    time: localDate.toISOString().slice(11, 16),
  };
}

export function getLocalTodayIsoDate(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * ### block future-dated logs before they become the alert evaluation tip
 * Tip-date cleanup deactivates earlier active alerts, so a future record can hide today's emergencies.
 */
export function assertRecordDateNotInFuture(
  recordDate: string,
  today = getLocalTodayIsoDate(),
) {
  if (recordDate > today) {
    throw new Error("Log dates cannot be in the future. Use today's date or an earlier day.");
  }
}
