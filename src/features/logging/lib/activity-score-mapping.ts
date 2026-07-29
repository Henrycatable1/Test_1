/**
 * ### map activity quick-log energy choices onto the 1-4 alert score scale
 * Score 1 must stay reachable so lethargy vet/emergency rules can evaluate.
 */
export function mapActivityEnergyLevelToScore(
  energyLevel: string | boolean | undefined,
): 1 | 2 | 3 | 4 | null {
  switch (energyLevel) {
    case "high":
      return 4;
    case "medium":
      return 3;
    case "low":
      return 2;
    case "very_low":
      return 1;
    default:
      return null;
  }
}
