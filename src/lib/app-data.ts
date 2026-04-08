import type { LogItemId } from "@/types/domain";

export type LogCategory = {
  id: LogItemId;
  label: string;
  hint: string;
  accentClass: string;
};

export const logCategories: LogCategory[] = [
  {
    id: "food",
    label: "Food",
    hint: "Track what your cat ate and how much.",
    accentClass: "bg-rose-200",
  },
  {
    id: "activity",
    label: "Activity",
    hint: "Capture play, sleepiness, and energy shifts.",
    accentClass: "bg-emerald-200",
  },
  {
    id: "medication",
    label: "Medication",
    hint: "Log doses and mark what is due next.",
    accentClass: "bg-amber-200",
  },
  {
    id: "vet_visit",
    label: "Vet Visit",
    hint: "Save visit notes and follow-up details.",
    accentClass: "bg-violet-200",
  },
  {
    id: "abnormal_event",
    label: "Abnormal Event",
    hint: "Record vomiting, appetite loss, or other concerns.",
    accentClass: "bg-orange-200",
  },
  {
    id: "weight",
    label: "Weight",
    hint: "Add a fresh weight entry for trend tracking.",
    accentClass: "bg-sky-200",
  },
];
