/**
 * ### cap alert tip dates one UTC day ahead of today
 * Allows owners slightly ahead of UTC to keep logging "today", while ignoring farther
 * future tip records that would deactivate current-day alerts during cleanup.
 */
export function getMaxEvaluableRecordDate(utcTodayIso: string) {
  const date = new Date(`${utcTodayIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function filterEvaluableRecords<T extends { record_date: string }>(
  records: T[],
  utcTodayIso: string,
): T[] {
  const maxDate = getMaxEvaluableRecordDate(utcTodayIso);
  return records.filter((record) => record.record_date <= maxDate);
}
