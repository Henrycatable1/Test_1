import type { LogItemId } from "@/types/domain";
import type { Tables, TablesUpdate } from "@/types/supabase";

type DailyRecordCategory = Exclude<LogItemId, "vet_visit">;
type DailyRecordMergeSnapshot = Pick<
  Tables<"daily_health_records">,
  "abnormal_behavior_note" | "food_amount_grams" | "notes" | "vomit_times"
>;

function appendMergedText(current: string | null | undefined, incoming: string | null | undefined) {
  const parts = [current, incoming]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join("\n") : null;
}

export function mergeDailyRecordUpdate(
  category: DailyRecordCategory,
  existingRecord: DailyRecordMergeSnapshot | null,
  incomingUpdate: TablesUpdate<"daily_health_records">,
) {
  const mergedUpdate: TablesUpdate<"daily_health_records"> = { ...incomingUpdate };

  if ("notes" in incomingUpdate) {
    mergedUpdate.notes = appendMergedText(existingRecord?.notes, incomingUpdate.notes);
  }

  if (category === "food" && "food_amount_grams" in incomingUpdate) {
    if (typeof incomingUpdate.food_amount_grams === "number") {
      mergedUpdate.food_amount_grams = (existingRecord?.food_amount_grams ?? 0) + incomingUpdate.food_amount_grams;
    } else {
      delete mergedUpdate.food_amount_grams;
    }
  }

  if (category === "abnormal_event") {
    if ("abnormal_behavior_note" in incomingUpdate) {
      mergedUpdate.abnormal_behavior_note = appendMergedText(
        existingRecord?.abnormal_behavior_note,
        incomingUpdate.abnormal_behavior_note,
      );
    }

    if (typeof incomingUpdate.vomit_times === "number" && incomingUpdate.vomit_times > 0) {
      const existingVomitTimes = existingRecord?.vomit_times ?? 0;
      mergedUpdate.vomit_times =
        incomingUpdate.vomit_times >= 2
          ? Math.max(existingVomitTimes, incomingUpdate.vomit_times)
          : existingVomitTimes + incomingUpdate.vomit_times;
    } else {
      delete mergedUpdate.vomit_times;
    }
  }

  return mergedUpdate;
}
