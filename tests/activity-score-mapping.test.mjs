import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mapActivityEnergyLevelToScore } from "../src/features/logging/lib/activity-score-mapping.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("activity energy levels cover the full 1-4 alert score scale", () => {
  assert.equal(mapActivityEnergyLevelToScore("high"), 4);
  assert.equal(mapActivityEnergyLevelToScore("medium"), 3);
  assert.equal(mapActivityEnergyLevelToScore("low"), 2);
  assert.equal(mapActivityEnergyLevelToScore("very_low"), 1);
  assert.equal(mapActivityEnergyLevelToScore("unknown"), null);
  assert.equal(mapActivityEnergyLevelToScore(undefined), null);
});

test("activity quick-log config exposes barely-moving energy for score 1", () => {
  const configSource = readFileSync(
    join(root, "src/features/logging/config/logging-config.ts"),
    "utf8",
  );

  assert.match(configSource, /value:\s*"very_low"/);
  assert.match(configSource, /Barely moving/);
});

test("canonical docs require activity score 1 to stay reachable from quick logs", () => {
  const logCatalog = readFileSync(join(root, "docs/log-catalog.md"), "utf8");
  const ruleCatalog = readFileSync(join(root, "docs/rule-catalog.md"), "utf8");

  assert.match(logCatalog, /very_low` → `activityScore = 1/);
  assert.match(ruleCatalog, /activity score `1` \(barely moving\) must remain reachable/);
});
