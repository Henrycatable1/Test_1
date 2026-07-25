type FormValues = Record<string, string | boolean>;

type AbnormalEventDailyUpdate = {
  abnormal_behavior: true;
  abnormal_behavior_note: string | null;
  notes: string | null;
  vomit_times?: number;
  stool_condition?: "watery";
  appetite_score?: 1 | 2;
};

function appendNotes(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n");
}

// ### map abnormal quick-log choices onto the structured daily fields alert rules evaluate
export function mapAbnormalEventValues(values: FormValues): AbnormalEventDailyUpdate {
  const eventType = typeof values.eventType === "string" ? values.eventType : "other";
  const repeated = values.repeatedToday === true;
  const severity = typeof values.severity === "string" ? values.severity : null;

  const update: AbnormalEventDailyUpdate = {
    abnormal_behavior: true,
    abnormal_behavior_note:
      appendNotes(
        `Event type: ${eventType}.`,
        severity ? `Severity: ${severity}.` : null,
        repeated ? "Marked as repeated today." : null,
        typeof values.notes === "string" ? values.notes : null,
      ) || null,
    notes:
      appendNotes(
        typeof values.notes === "string" ? values.notes : null,
        eventType !== "vomiting" ? `Abnormal event recorded: ${eventType}.` : null,
      ) || null,
  };

  // ### only vomiting updates vomit_times so later diarrhea/appetite logs cannot wipe prior counts
  if (eventType === "vomiting") {
    update.vomit_times = repeated ? 2 : 1;
  }

  if (eventType === "diarrhea") {
    update.stool_condition = "watery";
  }

  if (eventType === "appetite_loss") {
    update.appetite_score = severity === "high" ? 1 : 2;
  }

  return update;
}
