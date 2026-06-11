import { describe, expect, it } from "vitest";

import { mapDailyRecordValues, mergeDailyRecordValues } from "./logging-writes";

describe("daily health record logging writes", () => {
  it("does not turn blank numeric form values into zero-value health data", () => {
    expect(mapDailyRecordValues("food", {
      amount: "",
      appetite: "normal",
      foodType: "dry",
      unit: "g",
    })).not.toHaveProperty("food_amount_grams");

    expect(mapDailyRecordValues("weight", {
      scaleSource: "home",
      weightKg: "",
    })).not.toHaveProperty("weight_kg");
  });

  it("accumulates same-day food grams while preserving existing notes", () => {
    const merged = mergeDailyRecordValues(
      {
        food_amount_grams: 45,
        notes: "Ate dinner.",
      },
      {
        abnormal_behavior_note: null,
        food_amount_grams: 80,
        notes: "Ate breakfast.",
        vomit_times: 0,
      },
    );

    expect(merged.food_amount_grams).toBe(125);
    expect(merged.notes).toBe("Ate breakfast.\nAte dinner.");
  });

  it("accumulates same-day vomiting logs and does not clear counts for other abnormal events", () => {
    const secondVomit = mergeDailyRecordValues(
      mapDailyRecordValues("abnormal_event", {
        eventType: "vomiting",
        repeatedToday: false,
        severity: "mild",
      }),
      {
        abnormal_behavior_note: "Event type: vomiting.",
        food_amount_grams: null,
        notes: null,
        vomit_times: 1,
      },
    );

    expect(secondVomit.vomit_times).toBe(2);
    expect(secondVomit.abnormal_behavior_note).toContain("Event type: vomiting.");

    const diarrheaUpdate = mergeDailyRecordValues(
      mapDailyRecordValues("abnormal_event", {
        eventType: "diarrhea",
        repeatedToday: false,
        severity: "moderate",
      }),
      {
        abnormal_behavior_note: "Event type: vomiting.",
        food_amount_grams: null,
        notes: null,
        vomit_times: 2,
      },
    );

    expect(diarrheaUpdate).not.toHaveProperty("vomit_times");
    expect(diarrheaUpdate.abnormal_behavior_note).toContain("Event type: diarrhea.");
  });
});
