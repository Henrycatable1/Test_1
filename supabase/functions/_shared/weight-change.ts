export type WeightRecord = {
  weight_kg: number | null;
};

// ### compare the latest measurement with history, falling back to the onboarding baseline
export function getWeightChangePercent(
  records: WeightRecord[],
  recordIndex: number,
  initialWeightKg: number | null,
) {
  const currentWeight = records[recordIndex]?.weight_kg;

  if (currentWeight === null || currentWeight === undefined || currentWeight <= 0) {
    return null;
  }

  for (let index = recordIndex - 1; index >= 0; index -= 1) {
    const previousWeight = records[index]?.weight_kg;

    if (previousWeight === null || previousWeight === undefined || previousWeight <= 0) {
      continue;
    }

    return Number((((currentWeight - previousWeight) / previousWeight) * 100).toFixed(2));
  }

  if (initialWeightKg === null || initialWeightKg <= 0) {
    return null;
  }

  return Number((((currentWeight - initialWeightKg) / initialWeightKg) * 100).toFixed(2));
}
