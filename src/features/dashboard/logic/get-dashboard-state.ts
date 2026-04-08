import {
  demoBaseFollowUps,
  demoCatProfile,
  demoLogs,
  demoMedicationPlans,
  demoWeeklyMetrics,
} from "@/lib/demo-data";
import type { FollowUpTask, LogEntry } from "@/types/domain";

function isSameDay(dateString: string, referenceDate: Date) {
  const date = new Date(dateString);

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

function createVomitingFollowUp(logs: LogEntry[]): FollowUpTask | null {
  const latestAbnormalEvent = [...logs]
    .filter(
      (log): log is LogEntry<"abnormal_event"> => log.type === "abnormal_event",
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];

  if (
    latestAbnormalEvent &&
    latestAbnormalEvent.details.eventType === "vomiting"
  ) {
    return {
      id: "followup-vomiting",
      title: "Check for vomiting recurrence",
      detail:
        "The latest abnormal event was vomiting. Confirm whether it happened again today.",
      priority: "High",
      relatedLogType: "abnormal_event",
    };
  }

  return null;
}

function createMissingDailyLogFollowUp(logs: LogEntry[]): FollowUpTask | null {
  const today = new Date();
  const hasActivityToday = logs.some(
    (log) => log.type === "activity" && isSameDay(log.occurredAt, today),
  );

  if (!hasActivityToday) {
    return {
      id: "followup-activity",
      title: "Activity log missing today",
      detail:
        "Prompt the owner to capture energy or play level before the end of the day.",
      priority: "Low",
      relatedLogType: "activity",
    };
  }

  return null;
}

export function getDashboardState() {
  const generatedFollowUps = [
    createVomitingFollowUp(demoLogs),
    createMissingDailyLogFollowUp(demoLogs),
  ].filter(Boolean) as FollowUpTask[];

  const followUps = [...generatedFollowUps, ...demoBaseFollowUps];

  return {
    cat: demoCatProfile,
    logs: demoLogs,
    medicationPlans: demoMedicationPlans,
    weeklyMetrics: demoWeeklyMetrics,
    followUps,
    topAction: followUps[0] ?? null,
  };
}
