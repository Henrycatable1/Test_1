import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapFoodAppetiteToScore } from "@/features/logging/lib/appetite-score-mapping";
import type { LogItemId } from "@/types/domain";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type FormValues = Record<string, string | boolean>;

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

function mapFoodValues(values: FormValues): TablesUpdate<"daily_health_records"> {
  const foodType = typeof values.foodType === "string" && ["dry", "wet", "both"].includes(values.foodType)
    ? (values.foodType as "dry" | "wet" | "both")
    : null;
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
    appetite_score: mapFoodAppetiteToScore(values.appetite),
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

  const baseUpdate = mapDailyRecordValues(category, values as FormValues);
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
