import type { LogItemId } from "@/types/domain";

export type LogFieldConfig = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "datetime-local";
  helperText: string;
  options?: Array<{ value: string; label: string }>;
};

export type LogFormConfig = {
  title: string;
  description: string;
  fields: LogFieldConfig[];
};

export const logFormConfig: Record<LogItemId, LogFormConfig> = {
  food: {
    title: "Log food",
    description:
      "Capture what your cat ate, how much, and whether appetite looked normal.",
    fields: [
      {
        id: "occurredAt",
        label: "Time",
        type: "datetime-local",
        helperText: "Use the time the meal or snack actually happened.",
      },
      {
        id: "foodType",
        label: "Food type",
        type: "select",
        helperText: "This matches the initial catalog entry for food logs.",
        options: [
          { value: "dry", label: "Dry food" },
          { value: "wet", label: "Wet food" },
          { value: "treat", label: "Treat" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "amount",
        label: "Amount",
        type: "number",
        helperText: "Use the amount that best matches how you serve the meal.",
      },
      {
        id: "unit",
        label: "Unit",
        type: "select",
        helperText: "This will become structured enum data in the schema.",
        options: [
          { value: "g", label: "Grams" },
          { value: "cup", label: "Cup" },
          { value: "portion", label: "Portion" },
        ],
      },
      {
        id: "appetite",
        label: "Appetite",
        type: "select",
        helperText: "Helps the dashboard spot appetite changes later.",
        options: [
          { value: "normal", label: "Normal" },
          { value: "reduced", label: "Reduced" },
          { value: "high", label: "High" },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional note for unusual behavior or serving details.",
      },
    ],
  },
  activity: {
    title: "Log activity",
    description:
      "Capture the cat's energy level, the kind of activity, and how long it lasted.",
    fields: [
      {
        id: "occurredAt",
        label: "Time",
        type: "datetime-local",
        helperText: "Log when the activity or observation happened.",
      },
      {
        id: "energyLevel",
        label: "Energy level",
        type: "select",
        helperText: "This is used for trends and missing-log reminders.",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
      {
        id: "activityType",
        label: "Activity type",
        type: "select",
        helperText: "Choose the best fit for the observation.",
        options: [
          { value: "play", label: "Play" },
          { value: "sleep", label: "Sleep / resting" },
          { value: "zoomies", label: "Zoomies" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "durationMinutes",
        label: "Duration (minutes)",
        type: "number",
        helperText: "Estimate is fine for MVP.",
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional note for context like hiding or extra playfulness.",
      },
    ],
  },
  abnormal_event: {
    title: "Log abnormal event",
    description:
      "Record concerning behavior like vomiting so the dashboard can follow up later.",
    fields: [
      {
        id: "occurredAt",
        label: "Time",
        type: "datetime-local",
        helperText: "Use the event time if you know it, or the nearest estimate.",
      },
      {
        id: "eventType",
        label: "Event type",
        type: "select",
        helperText: "These values match the first MVP rule set.",
        options: [
          { value: "vomiting", label: "Vomiting" },
          { value: "diarrhea", label: "Diarrhea" },
          { value: "appetite_loss", label: "Appetite loss" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "severity",
        label: "Severity",
        type: "select",
        helperText: "Severity helps sort dashboard follow-up priority.",
        options: [
          { value: "mild", label: "Mild" },
          { value: "moderate", label: "Moderate" },
          { value: "high", label: "High" },
        ],
      },
      {
        id: "repeatedToday",
        label: "Repeated today",
        type: "checkbox",
        helperText: "Useful for follow-up logic and vet summaries.",
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional note for context like time, location, or suspected cause.",
      },
    ],
  },
  medication: {
    title: "Log medication",
    description:
      "Medication logs are scaffolded now and will connect to medication plans next.",
    fields: [
      {
        id: "occurredAt",
        label: "Time",
        type: "datetime-local",
        helperText: "Use when the dose should have happened or actually happened.",
      },
      {
        id: "medicationName",
        label: "Medication name",
        type: "text",
        helperText: "Will map to medication plans when Supabase is active.",
      },
      {
        id: "doseAmount",
        label: "Dose amount",
        type: "text",
        helperText: "Examples: 1 tablet, 2 ml, 2 cm strip.",
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        helperText:
          "Given and delayed both count as taken for alerts. Use missed only when the dose was not administered.",
        options: [
          { value: "given", label: "Given" },
          { value: "delayed", label: "Delayed (still given)" },
          { value: "missed", label: "Missed" },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional note for reaction or administration issues.",
      },
    ],
  },
  vet_visit: {
    title: "Log vet visit",
    description:
      "Capture the core visit information now so reports can summarize follow-up needs later.",
    fields: [
      {
        id: "occurredAt",
        label: "Visit time",
        type: "datetime-local",
        helperText: "Use the appointment time or closest estimate.",
      },
      {
        id: "clinicName",
        label: "Clinic name",
        type: "text",
        helperText: "Useful for later exports and history review.",
      },
      {
        id: "reason",
        label: "Visit reason",
        type: "textarea",
        helperText: "Short reason or summary of the visit.",
      },
      {
        id: "followUpNeeded",
        label: "Follow-up needed",
        type: "checkbox",
        helperText: "Will feed future reminder logic.",
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional extra instructions from the vet.",
      },
    ],
  },
  weight: {
    title: "Log weight",
    description:
      "Weight logs stay simple for MVP but are important for trend charts later.",
    fields: [
      {
        id: "occurredAt",
        label: "Time",
        type: "datetime-local",
        helperText: "Use when the weight was measured.",
      },
      {
        id: "weightKg",
        label: "Weight (kg)",
        type: "number",
        helperText: "Use kilograms so reports stay consistent.",
      },
      {
        id: "scaleSource",
        label: "Scale source",
        type: "select",
        helperText: "Source matters for trend interpretation.",
        options: [
          { value: "home", label: "Home scale" },
          { value: "vet", label: "Vet scale" },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        type: "textarea",
        helperText: "Optional context such as after meal or at the clinic.",
      },
    ],
  },
};
