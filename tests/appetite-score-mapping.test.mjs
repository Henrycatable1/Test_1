import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mapFoodAppetiteToScore } from "../src/features/logging/lib/appetite-score-mapping.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("food appetite choices cover the full 1-4 alert score scale", () => {
  assert.equal(mapFoodAppetiteToScore("high"), 4);
  assert.equal(mapFoodAppetiteToScore("normal"), 3);
  assert.equal(mapFoodAppetiteToScore("reduced"), 2);
  assert.equal(mapFoodAppetiteToScore("none"), 1);
  assert.equal(mapFoodAppetiteToScore("unknown"), null);
  assert.equal(mapFoodAppetiteToScore(undefined), null);
});

test("food quick-log config exposes refuses-food appetite for score 1", () => {
  const configSource = readFileSync(
    join(root, "src/features/logging/config/logging-config.ts"),
    "utf8",
  );

  assert.match(configSource, /value:\s*"none"/);
  assert.match(configSource, /Refuses food \/ treats/);
});

test("canonical docs require appetite score 1 to stay reachable from food quick logs", () => {
  const logCatalog = readFileSync(join(root, "docs/log-catalog.md"), "utf8");
  const ruleCatalog = readFileSync(join(root, "docs/rule-catalog.md"), "utf8");

  assert.match(logCatalog, /none` → `appetiteScore = 1/);
  assert.match(ruleCatalog, /appetite score `1` \(refuses food \/ treats\) must remain reachable/);
});
