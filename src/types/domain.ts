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
  sex: "female" | "male" | "unknown";
  breed: string;
  weightKg: number;
  personality: string;
};

export type FoodLogDetails = {
  foodType: "dry" | "wet" | "treat" | "other";
  amount: number;
  unit: "g" | "cup" | "portion";
  appetite: "normal" | "reduced" | "high";
};

export type ActivityLogDetails = {
  energyLevel: "low" | "medium" | "high";
  durationMinutes: number;
  activityType: "play" | "sleep" | "zoomies" | "other";
};

export type AbnormalEventLogDetails = {
  eventType: "vomiting" | "diarrhea" | "appetite_loss" | "other";
  severity: "mild" | "moderate" | "high";
  repeatedToday: boolean;
};

export type MedicationLogDetails = {
  medicationName: string;
  doseAmount: string;
  status: "given" | "missed" | "delayed";
};

export type VetVisitLogDetails = {
  clinicName: string;
  reason: string;
  followUpNeeded: boolean;
};

export type WeightLogDetails = {
  weightKg: number;
  scaleSource: "home" | "vet";
};

export type LogDetailsByType = {
  food: FoodLogDetails;
  activity: ActivityLogDetails;
  abnormal_event: AbnormalEventLogDetails;
  medication: MedicationLogDetails;
  vet_visit: VetVisitLogDetails;
  weight: WeightLogDetails;
};

export type LogEntry<T extends LogItemId = LogItemId> = {
  id: string;
  catId: string;
  type: T;
  occurredAt: string;
  notes?: string;
  details: LogDetailsByType[T];
};

export type MedicationPlan = {
  id: string;
  catId: string;
  medicationName: string;
  doseAmount: string;
  dueLabel: string;
  isActive: boolean;
};

export type FollowUpTask = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
  relatedLogType?: LogItemId;
};

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};
