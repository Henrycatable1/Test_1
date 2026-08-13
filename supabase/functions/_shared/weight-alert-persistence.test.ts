import {
  hasPositiveWeight,
  shouldPreserveWeightChangeAlerts,
} from "./weight-alert-persistence.ts";

function assertEquals(actual: boolean, expected: boolean, detail: string) {
  if (actual !== expected) {
    throw new Error(`${detail}: expected ${expected}, received ${actual}.`);
  }
}

Deno.test("treats numeric and numeric-string weights as evaluable", () => {
  assertEquals(hasPositiveWeight(4.2), true, "number");
  assertEquals(hasPositiveWeight("4.20"), true, "numeric string");
  assertEquals(hasPositiveWeight(0), false, "zero");
  assertEquals(hasPositiveWeight(null), false, "null");
  assertEquals(hasPositiveWeight(""), false, "blank");
});

// ### food-only later days must not wipe an earlier weight-loss emergency
Deno.test("preserves weight-change alerts when the tip record has no weight", () => {
  assertEquals(shouldPreserveWeightChangeAlerts(null), true, "missing weight");
  assertEquals(shouldPreserveWeightChangeAlerts(4.2), false, "new measurement");
  assertEquals(shouldPreserveWeightChangeAlerts("3.8"), false, "string measurement");
});
