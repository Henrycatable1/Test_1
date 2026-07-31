import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { mapMedicationStatusToTaken } from "../src/features/logging/lib/medication-status-mapping.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("medication status mapping treats delayed doses as taken, not missed", () => {
  assert.equal(mapMedicationStatusToTaken("given"), "taken");
  assert.equal(mapMedicationStatusToTaken("delayed"), "taken");
  assert.equal(mapMedicationStatusToTaken("missed"), "missed");
  assert.equal(mapMedicationStatusToTaken("unknown"), null);
  assert.equal(mapMedicationStatusToTaken(undefined), null);
});

test("medication quick-log config keeps delayed distinct from missed", () => {
  const configSource = readFileSync(
    join(root, "src/features/logging/config/logging-config.ts"),
    "utf8",
  );

  assert.match(configSource, /value:\s*"delayed"/);
  assert.match(configSource, /Delayed \(still given\)/);
  assert.match(configSource, /Use missed only when the dose was not administered/);
});

test("canonical docs require delayed medication logs to store taken", () => {
  const logCatalog = readFileSync(join(root, "docs/log-catalog.md"), "utf8");
  const ruleCatalog = readFileSync(join(root, "docs/rule-catalog.md"), "utf8");

  assert.match(logCatalog, /delayed` → `medicationTaken = taken/);
  assert.match(
    ruleCatalog,
    /delayed-but-administered dose must store `taken` so `medication_taken_missed_day3`/,
  );
});
