/**
 * ### map food quick-log appetite choices onto the 1-4 alert score scale
 * Score 1 must stay reachable so the refuses-food emergency rule can evaluate.
 */
export function mapFoodAppetiteToScore(
  appetite: string | boolean | undefined,
): 1 | 2 | 3 | 4 | null {
  switch (appetite) {
    case "high":
      return 4;
    case "normal":
      return 3;
    case "reduced":
      return 2;
    case "none":
      return 1;
    default:
      return null;
  }
}
