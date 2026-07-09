import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { sendEmail } from "../_shared/email.ts";
import { authorizeWorkerRequest } from "../_shared/worker-auth.ts";

type DeliveryRow = {
  id: string;
  alert_id: string;
  user_id: string;
  delivery_group_key: string | null;
};

type AlertRow = {
  id: string;
  cat_id: string;
  alert_date: string;
  alert_level: "normal" | "caution" | "vet_recommended" | "emergency";
  message: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  language_code: "en" | "zh-TW";
  display_name: string | null;
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

function groupByUser(deliveries: DeliveryRow[]) {
  const grouped = new Map<string, DeliveryRow[]>();

  for (const delivery of deliveries) {
    const current = grouped.get(delivery.user_id) ?? [];
    current.push(delivery);
    grouped.set(delivery.user_id, current);
  }

  return grouped;
}

function buildDigestEmail(languageCode: "en" | "zh-TW", alerts: AlertRow[]) {
  const subject =
    languageCode === "zh-TW"
      ? "CATable 每日提醒摘要"
      : "CATable daily alert summary";

  const intro =
    languageCode === "zh-TW"
      ? "以下是今天需要你留意的提醒："
      : "Here is a summary of alerts worth reviewing today:";

  const html = `
    <p>${intro}</p>
    <ul>
      ${alerts
        .map((alert) => `<li><strong>${alert.alert_level}</strong> (${alert.alert_date}) - ${alert.message}</li>`)
        .join("")}
    </ul>
  `;

  return { subject, html };
}

serve(async (request) => {
  const unauthorizedResponse = authorizeWorkerRequest(request, serviceRoleKey);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const { data: pendingDeliveries, error: deliveryError } = await admin
      .from("alert_deliveries")
      .select("id, alert_id, user_id, delivery_group_key")
      .eq("channel", "email")
      .eq("delivery_status", "pending");

    if (deliveryError) {
      throw deliveryError;
    }

    const deliveries = (pendingDeliveries ?? []) as DeliveryRow[];

    if (deliveries.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const alertIds = Array.from(new Set(deliveries.map((delivery) => delivery.alert_id)));
    const userIds = Array.from(new Set(deliveries.map((delivery) => delivery.user_id)));

    const [{ data: alerts, error: alertError }, { data: profiles, error: profileError }] = await Promise.all([
      admin
        .from("alerts")
        .select("id, cat_id, alert_date, alert_level, message")
        .in("id", alertIds)
        .neq("alert_level", "emergency"),
      admin
        .from("profiles")
        .select("id, email, language_code, display_name")
        .in("id", userIds),
    ]);

    if (alertError) {
      throw alertError;
    }

    if (profileError) {
      throw profileError;
    }

    const alertMap = new Map((alerts ?? []).map((alert) => [alert.id, alert as AlertRow]));
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
    const deliveriesByUser = groupByUser(deliveries);

    let sent = 0;
    let skipped = 0;

    for (const [userId, userDeliveries] of deliveriesByUser.entries()) {
      const profile = profileMap.get(userId);

      if (!profile?.email) {
        const deliveryIds = userDeliveries.map((delivery) => delivery.id);

        await admin
          .from("alert_deliveries")
          .update({
            delivery_status: "skipped",
            error_message: "No email address on profile.",
          })
          .in("id", deliveryIds);

        skipped += deliveryIds.length;
        continue;
      }

      const digestAlerts = userDeliveries
        .map((delivery) => alertMap.get(delivery.alert_id))
        .filter((alert): alert is AlertRow => Boolean(alert));

      if (digestAlerts.length === 0) {
        await admin
          .from("alert_deliveries")
          .update({
            delivery_status: "skipped",
            error_message: "No eligible non-emergency alerts were available for digest delivery.",
          })
          .in("id", userDeliveries.map((delivery) => delivery.id));

        skipped += userDeliveries.length;
        continue;
      }

      try {
        const email = buildDigestEmail(profile.language_code ?? "zh-TW", digestAlerts);

        await sendEmail({
          to: profile.email,
          subject: email.subject,
          html: email.html,
        });

        await admin
          .from("alert_deliveries")
          .update({
            delivery_status: "sent",
            delivered_at: new Date().toISOString(),
          })
          .in("id", userDeliveries.map((delivery) => delivery.id));

        sent += userDeliveries.length;
      } catch (error) {
        await admin
          .from("alert_deliveries")
          .update({
            delivery_status: "failed",
            error_message: error instanceof Error ? error.message : String(error),
          })
          .in("id", userDeliveries.map((delivery) => delivery.id));
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped }),
      { headers: { "Content-Type": "application/json" } },
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
