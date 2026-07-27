import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migrationPath =
  new URL("../supabase/migrations/20260727010200_schedule_send_alert_digests.sql", import.meta.url);
const queueMigrationPath =
  new URL("../supabase/migrations/20260422150059_add_alert_evaluation_queue_and_worker.sql", import.meta.url);

describe("daily digest schedule migration", () => {
  it("adds an invoker and daily cron job for send-alert-digests", () => {
    const sql = readFileSync(migrationPath, "utf8");

    // ### lock the missing schedule that left non-emergency deliveries pending forever
    assert.match(sql, /create or replace function app_private\.invoke_send_alert_digests\(\)/);
    assert.match(sql, /\/functions\/v1\/send-alert-digests/);
    assert.match(sql, /cron\.schedule\(\s*'send-alert-digests',\s*'0 0 \* \* \*'/);
    assert.match(sql, /select app_private\.invoke_send_alert_digests\(\);/);
  });

  it("keeps digest scheduling as a forward migration after the evaluation worker", () => {
    const queueSql = readFileSync(queueMigrationPath, "utf8");

    assert.match(queueSql, /cron\.schedule\(\s*'process-pending-alert-checks'/);
    assert.doesNotMatch(queueSql, /send-alert-digests/);
  });
});
