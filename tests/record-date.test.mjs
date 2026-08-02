import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertRecordDateNotInFuture,
  getLocalDateParts,
  getLocalTodayIsoDate,
} from "../src/features/logging/lib/record-date.ts";
import {
  filterEvaluableRecords,
  getMaxEvaluableRecordDate,
} from "../supabase/functions/_shared/evaluable-records.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("local date parts keep the owner calendar day from datetime-local values", () => {
  const parts = getLocalDateParts("2026-08-02T09:30");
  assert.equal(parts.recordDate, "2026-08-02");
  assert.equal(parts.time, "09:30");
});

test("future record dates are rejected before quick-log writes", () => {
  assert.doesNotThrow(() => assertRecordDateNotInFuture("2026-08-02", "2026-08-02"));
  assert.doesNotThrow(() => assertRecordDateNotInFuture("2026-08-01", "2026-08-02"));
  assert.throws(
    () => assertRecordDateNotInFuture("2026-08-03", "2026-08-02"),
    /cannot be in the future/i,
  );
});

test("alert evaluation ignores tip records more than one UTC day ahead", () => {
  assert.equal(getMaxEvaluableRecordDate("2026-08-02"), "2026-08-03");

  const filtered = filterEvaluableRecords(
    [
      { record_date: "2026-08-02" },
      { record_date: "2026-08-03" },
      { record_date: "2026-08-05" },
    ],
    "2026-08-02",
  );

  assert.deepEqual(
    filtered.map((record) => record.record_date),
    ["2026-08-02", "2026-08-03"],
  );
});

test("logging write path and alert worker enforce the non-future tip contract", () => {
  const loggingWrites = readFileSync(
    join(root, "src/features/logging/lib/logging-writes.ts"),
    "utf8",
  );
  const checkAlerts = readFileSync(
    join(root, "supabase/functions/check-alerts/index.ts"),
    "utf8",
  );
  const logCatalog = readFileSync(join(root, "docs/log-catalog.md"), "utf8");
  const ruleCatalog = readFileSync(join(root, "docs/rule-catalog.md"), "utf8");

  assert.match(loggingWrites, /assertRecordDateNotInFuture\(recordDate\)/);
  assert.match(checkAlerts, /filterEvaluableRecords/);
  assert.match(logCatalog, /future-dated quick logs are rejected/);
  assert.match(ruleCatalog, /future tip must not deactivate earlier active alerts/);
  assert.equal(typeof getLocalTodayIsoDate(), "string");
});
