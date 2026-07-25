import assert from "node:assert/strict";
import test from "node:test";

import { mapAbnormalEventValues } from "../src/features/logging/lib/abnormal-event-mapping.ts";
import { filterPreferencesForCurrentAccess } from "../supabase/functions/_shared/alert-recipients.ts";

test("diarrhea abnormal events write watery stool for alert evaluation", () => {
  const mapped = mapAbnormalEventValues({
    eventType: "diarrhea",
    severity: "moderate",
    notes: "Loose stool after breakfast",
  });

  assert.equal(mapped.stool_condition, "watery");
  assert.equal(mapped.abnormal_behavior, true);
  assert.equal(mapped.vomit_times, undefined);
});

test("high-severity appetite loss writes emergency appetite score", () => {
  const mapped = mapAbnormalEventValues({
    eventType: "appetite_loss",
    severity: "high",
  });

  assert.equal(mapped.appetite_score, 1);
  assert.equal(mapped.vomit_times, undefined);
});

test("mild appetite loss writes reduced appetite score", () => {
  const mapped = mapAbnormalEventValues({
    eventType: "appetite_loss",
    severity: "mild",
  });

  assert.equal(mapped.appetite_score, 2);
});

test("non-vomiting abnormal events do not reset vomit_times", () => {
  const mapped = mapAbnormalEventValues({
    eventType: "other",
    severity: "mild",
  });

  assert.equal("vomit_times" in mapped, false);
});

test("vomiting still writes structured vomit_times", () => {
  const once = mapAbnormalEventValues({ eventType: "vomiting", repeatedToday: false });
  const repeated = mapAbnormalEventValues({ eventType: "vomiting", repeatedToday: true });

  assert.equal(once.vomit_times, 1);
  assert.equal(repeated.vomit_times, 2);
});

test("removed collaborators are excluded from alert recipient preferences", () => {
  const filtered = filterPreferencesForCurrentAccess(
    "owner-1",
    ["collab-active"],
    [
      {
        user_id: "owner-1",
        email_important_alerts: true,
        email_daily_digest: true,
      },
      {
        user_id: "collab-active",
        email_important_alerts: true,
        email_daily_digest: false,
      },
      {
        user_id: "collab-removed",
        email_important_alerts: true,
        email_daily_digest: true,
      },
    ],
  );

  assert.deepEqual(
    filtered.map((row) => row.user_id).sort(),
    ["collab-active", "owner-1"],
  );
});
