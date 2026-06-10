import { describe, expect, it } from "vitest";

import { mergeDailyRecordValues } from "./logging-writes";

describe("mergeDailyRecordValues", () => {
  const existingRecord = {
    abnormal_behavior_note: "Event type: vomiting.",
    food_amount_grams: 40,
    food_type: "dry" as const,
    notes: "Breakfast.",
    vomit_times: 1,
  };

  it("accumulates same-day vomiting logs instead of overwriting the count", () => {
    expect(mergeDailyRecordValues(existingRecord, { vomit_times: 1 })).toMatchObject({
      vomit_times: 2,
    });
  });

  it("preserves vomiting counts when a later abnormal event is not vomiting", () => {
    expect(
      mergeDailyRecordValues(existingRecord, {
        abnormal_behavior: true,
        abnormal_behavior_note: "Event type: diarrhea.",
        notes: "Abnormal event recorded: diarrhea.",
      }),
    ).toMatchObject({
      abnormal_behavior_note: "Event type: vomiting.\nEvent type: diarrhea.",
      notes: "Breakfast.\nAbnormal event recorded: diarrhea.",
    });
  });

  it("accumulates same-day gram food logs into one daily total", () => {
    expect(
      mergeDailyRecordValues(existingRecord, {
        food_amount_grams: 55,
        food_type: "wet",
        notes: "Dinner.",
      }),
    ).toMatchObject({
      food_amount_grams: 95,
      food_type: "both",
      notes: "Breakfast.\nDinner.",
    });
  });
});
