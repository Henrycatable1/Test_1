/**
 * ### map medication quick-log status onto stored medication_taken values
 * Delayed means the dose was still given, so it must not count as missed for alert escalation.
 */
export function mapMedicationStatusToTaken(
  status: string | boolean | undefined,
): "taken" | "missed" | null {
  switch (status) {
    case "given":
    case "delayed":
      return "taken";
    case "missed":
      return "missed";
    default:
      return null;
  }
}
