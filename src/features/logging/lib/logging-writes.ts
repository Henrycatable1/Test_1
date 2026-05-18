import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LogItemId } from "@/types/domain";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type FormValues = Record<string, string | boolean>;
type DailyRecordMergeSource = Pick<
  Tables<"daily_health_records">,
  "abnormal_behavior_note" | "food_amount_grams" | "notes" | "vomit_times"
>;

function getRecordDateParts(occurredAt: string) {
  const date = new Date(occurredAt);
  const offset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offset);
  const isoDate = localDate.toISOString().slice(0, 10);
  const isoTime = localDate.toISOString().slice(11, 16);

  return {
    recordDate: isoDate,
    time: isoTime,
  };
}

function toNumber(value: string | boolean | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function appendNotes(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n");
}

function appendDistinctNotes(existing: string | null | undefined, incoming: string | null | undefined) {
  const existingText = existing?.trim();
  const incomingText = incoming?.trim();

  if (!incomingText) {
    return null;
  }

  if (!existingText) {
    return incomingText;
  }

  if (existingText === incomingText || existingText.endsWith(`\n${incomingText}`)) {
    return existingText;
  }

  return `${existingText}\n${incomingText}`;
}

function stripNullishDailyRecordValues(update: TablesUpdate<"daily_health_records">) {
  const stripped = {} as TablesUpdate<"daily_health_records">;
  const writable = stripped as Record<string, unknown>;

  for (const [key, value] of Object.entries(update)) {
    if (value !== null && value !== undefined) {
      writable[key] = value;
    }
  }

  return stripped;
}

function mergeDailyRecordValues(
  category: Exclude<LogItemId, "vet_visit">,
  update: TablesUpdate<"daily_health_records">,
  existingRecord: DailyRecordMergeSource | null,
) {
  const merged = stripNullishDailyRecordValues(update);
  const mergedNotes = appendDistinctNotes(
    existingRecord?.notes,
    typeof update.notes === "string" ? update.notes : null,
  );
  const mergedAbnormalNotes = appendDistinctNotes(
    existingRecord?.abnormal_behavior_note,
    typeof update.abnormal_behavior_note === "string" ? update.abnormal_behavior_note : null,
  );

  if (mergedNotes) {
    merged.notes = mergedNotes;
  }

  if (mergedAbnormalNotes) {
    merged.abnormal_behavior_note = mergedAbnormalNotes;
  }

  // ### same-day daily records accumulate confirmed event counts instead of replacing prior logs
  if (category === "abnormal_event") {
    const incomingVomitTimes = typeof update.vomit_times === "number" ? update.vomit_times : 0;

    if (incomingVomitTimes > 0) {
      merged.vomit_times = (existingRecord?.vomit_times ?? 0) + incomingVomitTimes;
    } else {
      delete merged.vomit_times;
    }
  }

  if (category === "food") {
    const incomingFoodAmount = typeof update.food_amount_grams === "number" ? update.food_amount_grams : null;

    if (incomingFoodAmount !== null) {
      merged.food_amount_grams = (existingRecord?.food_amount_grams ?? 0) + incomingFoodAmount;
    }
  }

  return merged;
}

function mapFoodValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  const foodType = typeof values.foodType === "string" && ["dry", "wet", "both"].includes(values.foodType)
    ? (values.foodType as "dry" | "wet" | "both")
    : null;
  const appetite =
    values.appetite === "high" ? 4 : values.appetite === "reduced" ? 2 : values.appetite === "normal" ? 3 : null;
  const amount = toNumber(values.amount);
  const noteSegments = [
    typeof values.notes === "string" ? values.notes : null,
    typeof values.unit === "string" && values.unit !== "g" && amount !== null
      ? `Recorded amount: ${amount} ${values.unit}.`
      : null,
    typeof values.foodType === "string" && !["dry", "wet", "both"].includes(values.foodType)
      ? `Recorded food type: ${values.foodType}.`
      : null,
  ];

  return {
    food_type: foodType,
    food_amount_grams: typeof values.unit === "string" && values.unit === "g" ? amount : null,
    appetite_score: appetite,
    notes: appendNotes(...noteSegments) || null,
  };
}

function mapActivityValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  const activityScore =
    values.energyLevel === "high" ? 4 : values.energyLevel === "medium" ? 3 : values.energyLevel === "low" ? 2 : null;

  return {
    activity_score: activityScore,
    notes:
      appendNotes(
        typeof values.notes === "string" ? values.notes : null,
        typeof values.activityType === "string" ? `Activity type: ${values.activityType}.` : null,
        typeof values.durationMinutes === "string"
          ? `Approximate duration: ${values.durationMinutes} minutes.`
          : null,
      ) || null,
  };
}

function mapAbnormalValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  const eventType = typeof values.eventType === "string" ? values.eventType : "other";
  const repeated = values.repeatedToday === true;

  return {
    vomit_times: eventType === "vomiting" ? (repeated ? 2 : 1) : 0,
    abnormal_behavior: true,
    abnormal_behavior_note:
      appendNotes(
        `Event type: ${eventType}.`,
        typeof values.severity === "string" ? `Severity: ${values.severity}.` : null,
        repeated ? "Marked as repeated today." : null,
        typeof values.notes === "string" ? values.notes : null,
      ) || null,
    notes:
      appendNotes(
        typeof values.notes === "string" ? values.notes : null,
        eventType !== "vomiting" ? `Abnormal event recorded: ${eventType}.` : null,
      ) || null,
  };
}

function mapMedicationValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  const status =
    values.status === "given"
      ? "taken"
      : values.status === "missed" || values.status === "delayed"
        ? "missed"
        : null;

  return {
    medication_taken: status,
    notes:
      appendNotes(
        typeof values.notes === "string" ? values.notes : null,
        typeof values.medicationName === "string" ? `Medication: ${values.medicationName}.` : null,
        typeof values.doseAmount === "string" ? `Dose: ${values.doseAmount}.` : null,
        values.status === "delayed" ? "Dose was delayed." : null,
      ) || null,
  };
}

function mapWeightValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  return {
    weight_kg: toNumber(values.weightKg),
    notes:
      appendNotes(
        typeof values.notes === "string" ? values.notes : null,
        typeof values.scaleSource === "string" ? `Scale source: ${values.scaleSource}.` : null,
      ) || null,
  };
}

function mapDailyRecordValues(
  category: Exclude<LogItemId, "vet_visit">,
  values: FormValues,
): TablesUpdate<"daily_health_records"> {
  switch (category) {
    case "food":
      return mapFoodValues(values);
    case "activity":
      return mapActivityValues(values);
    case "abnormal_event":
      return mapAbnormalValues(values);
    case "medication":
      return mapMedicationValues(values);
    case "weight":
      return mapWeightValues(values);
  }
}

function getReviewMessage(catId: string) {
  void catId;

  return "We're reviewing today's log now. Give us a moment for updated feedback and alerts.";
}

export async function saveLogEntry(category: LogItemId, values: FormValues) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase is not configured in the local app environment.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Sign in before saving logs.");
  }

  const { data: catRows, error: catError } = await supabase
    .from("cats")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (catError) {
    throw catError;
  }

  const catId = catRows?.[0]?.id;

  if (!catId) {
    throw new Error("Create a cat profile before saving logs.");
  }

  const occurredAt = typeof values.occurredAt === "string" ? values.occurredAt : new Date().toISOString();
  const { recordDate, time } = getRecordDateParts(occurredAt);

  if (category === "vet_visit") {
    const vetVisitPayload: TablesInsert<"vet_visits"> = {
      cat_id: catId,
      created_by: user.id,
      visit_date: recordDate,
      reason: typeof values.reason === "string" && values.reason.trim() ? values.reason.trim() : "Vet visit",
      has_prescription: values.followUpNeeded === true,
      notes:
        appendNotes(
          typeof values.notes === "string" ? values.notes : null,
          typeof values.clinicName === "string" ? `Clinic: ${values.clinicName}.` : null,
        ) || null,
    };

    const { error: visitError } = await supabase.from("vet_visits").insert(vetVisitPayload);

    if (visitError) {
      throw visitError;
    }

    await supabase
      .from("cats")
      .update({ last_vet_visit_date: recordDate })
      .eq("id", catId);

    const reviewMessage = getReviewMessage(catId);

    return {
      message: "Vet visit saved.",
      reviewMessage,
    };
  }

  const { data: existingRecord, error: existingRecordError } = await supabase
    .from("daily_health_records")
    .select("abnormal_behavior_note, food_amount_grams, notes, vomit_times")
    .eq("cat_id", catId)
    .eq("record_date", recordDate)
    .maybeSingle();

  if (existingRecordError) {
    throw existingRecordError;
  }

  const baseUpdate = mergeDailyRecordValues(
    category,
    mapDailyRecordValues(category, values as FormValues),
    existingRecord as DailyRecordMergeSource | null,
  );
  const upsertPayload: TablesInsert<"daily_health_records"> = {
    cat_id: catId,
    created_by: user.id,
    record_date: recordDate,
    feeding_time: category === "food" ? time : undefined,
    ...baseUpdate,
  };

  const { error: recordError } = await supabase
    .from("daily_health_records")
    .upsert(upsertPayload, {
      onConflict: "cat_id,record_date",
    });

  if (recordError) {
    throw recordError;
  }

  const reviewMessage = getReviewMessage(catId);

  return {
    message: "Daily health record saved.",
    reviewMessage,
  };
}
