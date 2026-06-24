import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { requireServiceRoleBearer } from "../_shared/worker-auth.ts";

type QueueRow = {
  cat_id: string;
  due_at: string;
  activity_version: number;
  processing_started_at: string | null;
  processing_version: number | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const workerBatchSize = 20;
const retryDelayMs = 30_000;
const staleClaimMs = 5 * 60_000;
const checkAlertsUrl = `${supabaseUrl}/functions/v1/check-alerts`;

async function clearStaleClaims(referenceTime: string) {
  const staleBefore = new Date(new Date(referenceTime).getTime() - staleClaimMs).toISOString();
  const { error } = await admin
    .from("cat_alert_evaluation_queue")
    .update({
      processing_started_at: null,
      processing_version: null,
      last_error: "Recovered stale alert evaluation claim.",
    })
    .lte("processing_started_at", staleBefore);

  if (error) {
    throw error;
  }
}

async function loadDueRows(referenceTime: string) {
  const { data, error } = await admin
    .from("cat_alert_evaluation_queue")
    .select("cat_id, due_at, activity_version, processing_started_at, processing_version")
    .lte("due_at", referenceTime)
    .is("processing_started_at", null)
    .order("due_at", { ascending: true })
    .limit(workerBatchSize);

  if (error) {
    throw error;
  }

  return (data ?? []) as QueueRow[];
}

// ### claim each row defensively so overlapping worker runs do not process the same cat twice
async function claimRow(row: QueueRow, referenceTime: string) {
  const claimedAt = new Date().toISOString();
  const { data, error } = await admin
    .from("cat_alert_evaluation_queue")
    .update({
      processing_started_at: claimedAt,
      processing_version: row.activity_version,
      last_error: null,
    })
    .eq("cat_id", row.cat_id)
    .eq("activity_version", row.activity_version)
    .is("processing_started_at", null)
    .lte("due_at", referenceTime)
    .select("cat_id, due_at, activity_version, processing_started_at, processing_version")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as QueueRow;
}

async function runAlertCheck(catId: string) {
  const response = await fetch(checkAlertsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      catId,
    }),
  });

  if (!response.ok) {
    throw new Error(`check-alerts failed with ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

async function clearClaim(catId: string, lastError: string | null) {
  const { error } = await admin
    .from("cat_alert_evaluation_queue")
    .update({
      processing_started_at: null,
      processing_version: null,
      last_error: lastError,
    })
    .eq("cat_id", catId);

  if (error) {
    throw error;
  }
}

async function finalizeClaim(row: QueueRow, errorMessage: string | null) {
  const { data: currentRow, error: currentError } = await admin
    .from("cat_alert_evaluation_queue")
    .select("cat_id, activity_version")
    .eq("cat_id", row.cat_id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!currentRow) {
    return;
  }

  const hasNewerActivity = currentRow.activity_version !== row.processing_version;

  if (hasNewerActivity) {
    await clearClaim(row.cat_id, errorMessage);
    return;
  }

  if (errorMessage) {
    const retryAt = new Date(Date.now() + retryDelayMs).toISOString();
    const { error } = await admin
      .from("cat_alert_evaluation_queue")
      .update({
        due_at: retryAt,
        processing_started_at: null,
        processing_version: null,
        last_error: errorMessage,
      })
      .eq("cat_id", row.cat_id)
      .eq("activity_version", row.processing_version ?? row.activity_version);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await admin
    .from("cat_alert_evaluation_queue")
    .delete()
    .eq("cat_id", row.cat_id)
    .eq("activity_version", row.processing_version ?? row.activity_version);

  if (error) {
    throw error;
  }
}

serve(async (request) => {
  const unauthorized = requireServiceRoleBearer(request, serviceRoleKey);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const referenceTime = new Date().toISOString();
    await clearStaleClaims(referenceTime);

    const dueRows = await loadDueRows(referenceTime);
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of dueRows) {
      const claimedRow = await claimRow(row, referenceTime);

      if (!claimedRow) {
        skipped += 1;
        continue;
      }

      try {
        await runAlertCheck(claimedRow.cat_id);
        await finalizeClaim(claimedRow, null);
        processed += 1;
      } catch (error) {
        await finalizeClaim(
          claimedRow,
          error instanceof Error ? error.message : String(error),
        );
        failed += 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        queued: dueRows.length,
        processed,
        skipped,
        failed,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
