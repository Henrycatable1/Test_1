// ### derived weight alerts stay current until a new measurement can replace them
export function hasPositiveWeight(weightKg: number | string | null | undefined) {
  const numeric = typeof weightKg === "number" ? weightKg : Number(weightKg);
  return Number.isFinite(numeric) && numeric > 0;
}

export function shouldPreserveWeightChangeAlerts(
  latestWeightKg: number | string | null | undefined,
) {
  return !hasPositiveWeight(latestWeightKg);
}
