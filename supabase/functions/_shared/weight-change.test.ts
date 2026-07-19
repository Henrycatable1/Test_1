import { getWeightChangePercent } from "./weight-change.ts";

function assertEquals(actual: number | null, expected: number | null) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, received ${actual}.`);
  }
}

// ### lock weight alerts to the nearest prior measurement, even when it is an older baseline
Deno.test("calculates change from the nearest prior recorded weight", () => {
  const records = [
    { weight_kg: 5 },
    { weight_kg: null },
    { weight_kg: 4.4 },
  ];

  assertEquals(getWeightChangePercent(records, 2, 6), -12);
});

// ### keep first post-onboarding measurements eligible for emergency weight rules
Deno.test("falls back to the onboarding weight", () => {
  assertEquals(getWeightChangePercent([{ weight_kg: 4.5 }], 0, 5), -10);
});

Deno.test("returns null without a valid current weight or baseline", () => {
  assertEquals(getWeightChangePercent([{ weight_kg: null }], 0, 5), null);
  assertEquals(getWeightChangePercent([{ weight_kg: 4.5 }], 0, null), null);
  assertEquals(getWeightChangePercent([{ weight_kg: 4.5 }], 0, 0), null);
});
