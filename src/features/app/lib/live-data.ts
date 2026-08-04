import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ActiveCatBundle,
  AlertReviewState,
  CatProfile,
  DashboardMetric,
  DashboardState,
  FollowUpTask,
  LogItemId,
} from "@/types/domain";
import type { Enums, Tables } from "@/types/supabase";

const alertRank: Record<Enums<"alert_level_type">, number> = {
  emergency: 3,
  vet_recommended: 2,
  caution: 1,
  normal: 0,
};

function getRecordDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate()
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getAgeYears(ageMonths: number) {
  return Number((ageMonths / 12).toFixed(1));
}

// ### keep dashboard/profile copy aligned with the profile language while alerts store en + zh-TW variants
export function resolveProfileLanguageCode(languageCode: string | null | undefined): "en" | "zh-TW" {
  return languageCode === "en" || languageCode === "zh-TW" ? languageCode : "zh-TW";
}

export function mapCatRowToProfile(cat: Tables<"cats">): CatProfile {
  return {
    id: cat.id,
    name: cat.name,
    ageYears: getAgeYears(cat.age_months),
    sex: cat.gender.includes("male") ? "male" : "female",
    breed: cat.breed ?? "Unknown breed",
    weightKg: cat.initial_weight_kg,
    personality: cat.personality ?? "No personality notes yet.",
    underlyingHealthConditions: cat.underlying_health_conditions,
  };
}

export function formatCatSex(sex: CatProfile["sex"]) {
  return sex === "male" ? "Male" : "Female";
}

export function formatCatAge(ageYears: number) {
  return `${ageYears.toFixed(ageYears % 1 === 0 ? 0 : 1)} years old`;
}

export function getPersonalityTags(personality: string) {
  return personality
    .split(/[,.]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function getRelatedLogType(metric: string | null, alertType: string): LogItemId | undefined {
  if (alertType === "vet_visit_reminder") {
    return "vet_visit";
  }

  if (alertType === "weight_reminder") {
    return "weight";
  }

  switch (metric) {
    case "appetite_score":
    case "food_ratio":
      return "food";
    case "activity_score":
      return "activity";
    case "vomit_times":
    case "abnormal_behavior":
      return "abnormal_event";
    case "medication_taken":
      return "medication";
    case "weight_kg":
      return "weight";
    default:
      return undefined;
  }
}

function mapAlertPriority(level: Enums<"alert_level_type">): FollowUpTask["priority"] {
  switch (level) {
    case "emergency":
    case "vet_recommended":
      return "High";
    case "caution":
      return "Medium";
    case "normal":
      return "Low";
  }
}

export function buildFollowUps(
  alerts: Tables<"alerts">[],
  records: Tables<"daily_health_records">[],
): FollowUpTask[] {
  const sortedAlerts = [...alerts].sort((left, right) => {
    const severityDelta = alertRank[right.alert_level] - alertRank[left.alert_level];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return right.alert_date.localeCompare(left.alert_date);
  });

  const followUps: FollowUpTask[] = sortedAlerts.map((alert) => ({
    id: alert.id,
    title:
      alert.alert_level === "emergency"
        ? "Critical alert needs attention"
        : alert.alert_level === "vet_recommended"
          ? "Vet follow-up recommended"
          : alert.alert_level === "caution"
            ? "Health signal to review"
            : "Daily health summary",
    detail: alert.message,
    priority: mapAlertPriority(alert.alert_level),
    relatedLogType: getRelatedLogType(alert.metric, alert.alert_type),
    alertLevel: alert.alert_level,
  }));

  const hasRecordToday = records.some((record) =>
    isSameDay(getRecordDate(record.record_date), new Date())
  );

  if (!hasRecordToday) {
    followUps.push({
      id: "missing-daily-record",
      title: "Daily health record missing",
      detail:
        "No daily health record has been saved today yet. Add food, activity, or symptom updates so alerts stay accurate.",
      priority: "Low",
      relatedLogType: "food",
    });
  }

  return followUps;
}

function countWindowRecords(
  records: Tables<"daily_health_records">[],
  predicate: (record: Tables<"daily_health_records">) => boolean,
) {
  return records.filter(predicate).length;
}

export function buildWeeklyMetrics(records: Tables<"daily_health_records">[]): DashboardMetric[] {
  const weekStart = startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - 6);

  const weeklyRecords = records.filter((record) => getRecordDate(record.record_date) >= weekStart);
  const foodLogs = countWindowRecords(
    weeklyRecords,
    (record) => record.food_amount_grams !== null || record.food_type !== null,
  );
  const activityLogs = countWindowRecords(
    weeklyRecords,
    (record) => record.activity_score !== null,
  );
  const abnormalEvents = weeklyRecords.reduce((total, record) => {
    const symptomCount = record.vomit_times > 0 ? record.vomit_times : 0;
    return total + symptomCount + (record.abnormal_behavior ? 1 : 0);
  }, 0);
  const latestWeight = [...weeklyRecords]
    .reverse()
    .find((record) => record.weight_kg !== null)?.weight_kg;

  return [
    {
      label: "Food records",
      value: String(foodLogs),
      note: foodLogs > 0 ? "Meals or appetite updates logged this week." : "No food updates logged in the last 7 days.",
    },
    {
      label: "Activity records",
      value: String(activityLogs),
      note:
        activityLogs > 0
          ? "Energy and movement signals captured this week."
          : "No activity updates logged in the last 7 days.",
    },
    {
      label: "Abnormal events",
      value: String(abnormalEvents),
      note:
        abnormalEvents > 0
          ? "Symptoms were recorded and may have triggered follow-up alerts."
          : "No vomiting or abnormal-behavior events were recorded this week.",
    },
    {
      label: "Latest weight",
      value: latestWeight ? `${latestWeight} kg` : "n/a",
      note: latestWeight ? "Most recent weight from the last 7 days." : "No weight measurement logged this week.",
    },
  ];
}

export function buildDashboardState(bundle: ActiveCatBundle): DashboardState {
  if (!bundle.cat) {
    return {
      cat: null,
      followUps: [],
      weeklyMetrics: [],
      topAction: null,
      lastUpdatedLabel: null,
      alertReview: null,
    };
  }

  const followUps = buildFollowUps(bundle.alerts, bundle.dailyRecords);
  const lastRecord = bundle.dailyRecords.at(-1);

  return {
    cat: mapCatRowToProfile(bundle.cat),
    followUps,
    weeklyMetrics: buildWeeklyMetrics(bundle.dailyRecords),
    topAction: followUps[0] ?? null,
    lastUpdatedLabel: lastRecord?.record_date ?? null,
    alertReview: bundle.alertReview,
  };
}

export async function fetchActiveCatBundle(): Promise<ActiveCatBundle | null> {
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
    return null;
  }

  const [{ data: profile }, { data: cats, error: catError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("cats")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (catError) {
    throw catError;
  }

  const cat = cats?.[0] ?? null;
  const messageLanguageCode = resolveProfileLanguageCode(profile?.language_code);

  if (!cat) {
    return {
      userId: user.id,
      profile: profile ?? null,
      cat: null,
      dailyRecords: [],
      vetVisits: [],
      alerts: [],
      feedbackMessages: [],
      alertReview: null,
    };
  }

  const [
    { data: dailyRecords, error: recordError },
    { data: vetVisits, error: visitError },
    { data: alerts, error: alertError },
    { data: feedbackMessages, error: feedbackError },
    { data: alertReview, error: alertReviewError },
  ] = await Promise.all([
    supabase
      .from("daily_health_records")
      .select("*")
      .eq("cat_id", cat.id)
      .order("record_date", { ascending: true }),
    supabase
      .from("vet_visits")
      .select("*")
      .eq("cat_id", cat.id)
      .order("visit_date", { ascending: false }),
    supabase
      .from("alerts")
      .select("*")
      .eq("cat_id", cat.id)
      .eq("is_active", true)
      .eq("message_language_code", messageLanguageCode)
      .order("alert_date", { ascending: false }),
    supabase
      .from("feedback_messages")
      .select("*")
      .eq("is_active", true)
      .eq("language_code", messageLanguageCode),
    supabase
      .from("cat_alert_evaluation_queue")
      .select("due_at, last_activity_at, last_error")
      .eq("cat_id", cat.id)
      .maybeSingle(),
  ]);

  if (recordError) {
    throw recordError;
  }

  if (visitError) {
    throw visitError;
  }

  if (alertError) {
    throw alertError;
  }

  if (feedbackError) {
    throw feedbackError;
  }

  if (alertReviewError) {
    throw alertReviewError;
  }

  // ### expose the debounce queue as product-friendly review status for dashboard and profile surfaces
  const nextAlertReview: AlertReviewState | null = alertReview
    ? {
        isPending: true,
        dueAt: alertReview.due_at,
        lastActivityAt: alertReview.last_activity_at,
        lastError: alertReview.last_error,
      }
    : null;

  return {
    userId: user.id,
    profile: profile ?? null,
    cat,
    dailyRecords: dailyRecords ?? [],
    vetVisits: vetVisits ?? [],
    alerts: alerts ?? [],
    feedbackMessages: feedbackMessages ?? [],
    alertReview: nextAlertReview,
  };
}

export async function fetchCurrentUserAndCat() {
  const bundle = await fetchActiveCatBundle();

  if (!bundle) {
    throw new Error("Sign in to continue.");
  }

  if (!bundle.cat) {
    throw new Error("Create a cat profile before logging data.");
  }

  return {
    userId: bundle.userId,
    profile: bundle.profile,
    cat: bundle.cat,
  };
}
