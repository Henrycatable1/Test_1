import type { Enums, Tables } from "@/types/supabase";

export type LogItemId =
  | "food"
  | "activity"
  | "abnormal_event"
  | "medication"
  | "vet_visit"
  | "weight";

export type CatProfile = {
  id: string;
  name: string;
  ageYears: number;
  sex: "female" | "male";
  breed: string;
  weightKg: number;
  personality: string;
  underlyingHealthConditions: string[];
};

export type FollowUpTask = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
  relatedLogType?: LogItemId;
  alertLevel?: Enums<"alert_level_type">;
};

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

export type AlertReviewState = {
  isPending: boolean;
  dueAt: string | null;
  lastActivityAt: string | null;
  lastError: string | null;
};

export type ActiveCatBundle = {
  userId: string;
  profile: Tables<"profiles"> | null;
  cat: Tables<"cats"> | null;
  dailyRecords: Tables<"daily_health_records">[];
  vetVisits: Tables<"vet_visits">[];
  alerts: Tables<"alerts">[];
  feedbackMessages: Tables<"feedback_messages">[];
  alertReview: AlertReviewState | null;
};

export type DashboardState = {
  cat: CatProfile | null;
  followUps: FollowUpTask[];
  weeklyMetrics: DashboardMetric[];
  topAction: FollowUpTask | null;
  lastUpdatedLabel: string | null;
  alertReview: AlertReviewState | null;
};
