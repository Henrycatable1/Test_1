import type {
  CatProfile,
  DashboardMetric,
  FollowUpTask,
  LogEntry,
  MedicationPlan,
} from "@/types/domain";

const now = new Date();

function hoursAgo(hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

export const demoCatProfile: CatProfile = {
  id: "cat-miso",
  name: "Miso",
  ageYears: 4,
  sex: "female",
  breed: "Domestic shorthair",
  weightKg: 4.3,
  personality: "Curious, food-motivated, and clingy at bedtime.",
};

export const demoLogs: LogEntry[] = [
  {
    id: "log-food-1",
    catId: demoCatProfile.id,
    type: "food",
    occurredAt: hoursAgo(11),
    notes: "Finished almost everything.",
    details: {
      foodType: "wet",
      amount: 85,
      unit: "g",
      appetite: "normal",
    },
  },
  {
    id: "log-food-2",
    catId: demoCatProfile.id,
    type: "food",
    occurredAt: hoursAgo(4),
    notes: "Wanted more after dinner.",
    details: {
      foodType: "dry",
      amount: 0.5,
      unit: "cup",
      appetite: "high",
    },
  },
  {
    id: "log-abnormal-1",
    catId: demoCatProfile.id,
    type: "abnormal_event",
    occurredAt: hoursAgo(18),
    notes: "Single vomiting episode near the litter box.",
    details: {
      eventType: "vomiting",
      severity: "moderate",
      repeatedToday: false,
    },
  },
  {
    id: "log-weight-1",
    catId: demoCatProfile.id,
    type: "weight",
    occurredAt: hoursAgo(72),
    notes: "Home scale after breakfast.",
    details: {
      weightKg: 4.3,
      scaleSource: "home",
    },
  },
];

export const demoMedicationPlans: MedicationPlan[] = [
  {
    id: "med-plan-1",
    catId: demoCatProfile.id,
    medicationName: "Hairball support gel",
    doseAmount: "2 cm strip",
    dueLabel: "8:00 PM",
    isActive: true,
  },
];

export const demoWeeklyMetrics: DashboardMetric[] = [
  {
    label: "Food logs",
    value: "12",
    note: "Stable appetite with one higher-hunger evening.",
  },
  {
    label: "Activity logs",
    value: "8",
    note: "One low-energy day after the vomiting event.",
  },
  {
    label: "Abnormal events",
    value: "1",
    note: "Single vomiting episode tracked this week.",
  },
];

export const demoBaseFollowUps: FollowUpTask[] = [
  {
    id: "followup-medication",
    title: "Medication due by 8:00 PM",
    detail: "Flag the evening dose so it stays above lower-priority tasks.",
    priority: "High",
    relatedLogType: "medication",
  },
];
