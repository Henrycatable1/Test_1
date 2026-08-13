import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { rulesConfig, type AlertLevel, type CombinationClause, type MatchRule, type SingleMetricCondition } from "../_shared/alert-rules.ts";
import { sendEmail } from "../_shared/email.ts";
import { shouldPreserveWeightChangeAlerts } from "../_shared/weight-alert-persistence.ts";

type CatRow = {
  id: string;
  owner_user_id: string;
  age_months: number | null;
  initial_weight_kg: number | null;
  primary_diet: "dry" | "wet" | "both" | null;
  last_vet_visit_date: string | null;
};

type DailyHealthRecordRow = {
  id: string;
  cat_id: string;
  record_date: string;
  appetite_score: number | null;
  food_ratio: number | null;
  water_intake: string | null;
  stool_condition: string | null;
  urine_times: string | null;
  activity_score: number | null;
  resting_breath_rate: string | null;
  vomit_times: number | null;
  abnormal_behavior: boolean | null;
  gum_appearance: string | null;
  medication_taken: string | null;
  weight_kg: number | null;
};

type VetVisitRow = {
  visit_date: string;
};

type FeedbackMessageRow = {
  metric: string;
  condition_key: string;
  alert_level: AlertLevel;
  language_code: "en" | "zh-TW";
  message: string;
};

type Recipient = {
  user_id: string;
  email: string | null;
  language_code: "en" | "zh-TW";
  email_important_alerts: boolean;
  email_daily_digest: boolean;
};

type EvaluatedEvent = {
  ruleKey: string;
  metric: string;
  conditionKey: string;
  level: AlertLevel;
  alertType: "single_metric" | "combination" | "weight_reminder" | "vet_visit_reminder";
  alertDate: string;
  metadata?: Record<string, unknown>;
};

const severityRank: Record<AlertLevel, number> = {
  normal: 0,
  caution: 1,
  vet_recommended: 2,
  emergency: 3,
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

// ### fetch the full active message catalog once per invocation
async function loadFeedbackMessages() {
  const { data, error } = await admin
    .from("feedback_messages")
    .select("metric, condition_key, alert_level, language_code, message")
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const messageMap = new Map<string, string>();

  for (const row of (data ?? []) as FeedbackMessageRow[]) {
    messageMap.set(
      `${row.metric}:${row.condition_key}:${row.alert_level}:${row.language_code}`,
      row.message,
    );
  }

  return messageMap;
}

function daysBetween(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function getDirectMetricValue(record: DailyHealthRecordRow, metric: string) {
  switch (metric) {
    case "appetite_score":
      return record.appetite_score;
    case "food_ratio":
      return record.food_ratio;
    case "water_intake":
      return record.water_intake;
    case "stool_condition":
      return record.stool_condition;
    case "urine_times":
      return record.urine_times;
    case "activity_score":
      return record.activity_score;
    case "resting_breath_rate":
      return record.resting_breath_rate;
    case "vomit_times":
      return record.vomit_times;
    case "abnormal_behavior":
      return record.abnormal_behavior;
    case "gum_appearance":
      return record.gum_appearance;
    case "medication_taken":
      return record.medication_taken;
    default:
      return null;
  }
}

function getWeightChangePercent(records: DailyHealthRecordRow[], recordIndex: number) {
  const current = records[recordIndex];

  if (!current?.weight_kg) {
    return null;
  }

  for (let index = recordIndex - 1; index >= 0; index -= 1) {
    const previousWeight = records[index]?.weight_kg;

    if (!previousWeight || previousWeight <= 0) {
      continue;
    }

    return Number((((current.weight_kg - previousWeight) / previousWeight) * 100).toFixed(2));
  }

  return null;
}

function matchesRuleValue(
  matchRule: MatchRule,
  value: string | number | boolean | null,
  records: DailyHealthRecordRow[],
  recordIndex: number,
  cat: CatRow,
) {
  if (matchRule.type === "derived_kitten_stagnant") {
    if (cat.age_months === null || cat.age_months >= matchRule.age_months_lt) {
      return false;
    }

    const latestRecord = records[recordIndex];
    const latestWeight = latestRecord?.weight_kg;

    if (!latestWeight || !latestRecord) {
      return false;
    }

    const windowStartDate = new Date(`${latestRecord.record_date}T00:00:00Z`);
    windowStartDate.setUTCDate(windowStartDate.getUTCDate() - matchRule.window_days);

    const windowRecords = records.filter((record) => {
      if (!record.weight_kg) {
        return false;
      }

      const recordDate = new Date(`${record.record_date}T00:00:00Z`);
      return recordDate >= windowStartDate && recordDate <= new Date(`${latestRecord.record_date}T00:00:00Z`);
    });

    if (windowRecords.length < 2) {
      return false;
    }

    const firstWeight = windowRecords[0].weight_kg;

    if (!firstWeight || firstWeight <= 0) {
      return false;
    }

    const netChangePercent = Number((((latestWeight - firstWeight) / firstWeight) * 100).toFixed(2));
    return netChangePercent <= matchRule.net_change_percent_lte;
  }

  if (value === null || value === undefined) {
    return false;
  }

  switch (matchRule.type) {
    case "equals":
      return value === matchRule.value;
    case "gte":
      if (typeof value !== "number") {
        return false;
      }
      if (matchRule.direction === "down") {
        return value <= -matchRule.value;
      }
      return value >= matchRule.value;
    case "lt":
      return typeof value === "number" && value < matchRule.value;
    case "range":
      if (typeof value !== "number") {
        return false;
      }
      if (matchRule.direction === "down") {
        const magnitude = Math.abs(value);
        const lowerOk = magnitude >= matchRule.min_inclusive;
        const upperOk =
          matchRule.max_exclusive !== undefined
            ? magnitude < matchRule.max_exclusive
            : matchRule.max_inclusive !== undefined
              ? magnitude <= matchRule.max_inclusive
              : true;
        return value < 0 && lowerOk && upperOk;
      }
      if (matchRule.direction === "up") {
        const lowerOk = value >= matchRule.min_inclusive;
        const upperOk =
          matchRule.max_exclusive !== undefined
            ? value < matchRule.max_exclusive
            : matchRule.max_inclusive !== undefined
              ? value <= matchRule.max_inclusive
              : true;
        return value > 0 && lowerOk && upperOk;
      }

      return value >= matchRule.min_inclusive
        && (matchRule.max_exclusive !== undefined ? value < matchRule.max_exclusive : true)
        && (matchRule.max_inclusive !== undefined ? value <= matchRule.max_inclusive : true);
  }
}

function getMetricValue(
  metric: string,
  records: DailyHealthRecordRow[],
  recordIndex: number,
) {
  if (metric === "weight_change_percent") {
    return getWeightChangePercent(records, recordIndex);
  }

  return getDirectMetricValue(records[recordIndex], metric);
}

function singleDayMetricMatch(
  metric: string,
  condition: SingleMetricCondition,
  records: DailyHealthRecordRow[],
  recordIndex: number,
  cat: CatRow,
) {
  const value = getMetricValue(metric, records, recordIndex);
  return matchesRuleValue(condition.match, value, records, recordIndex, cat);
}

function hasConsecutiveMetricMatches(
  metric: string,
  condition: SingleMetricCondition,
  records: DailyHealthRecordRow[],
  latestIndex: number,
  cat: CatRow,
) {
  for (let offset = 0; offset < condition.consecutive_days; offset += 1) {
    const recordIndex = latestIndex - offset;

    if (recordIndex < 0) {
      return false;
    }

    if (offset > 0) {
      const previousDate = records[recordIndex].record_date;
      const currentDate = records[recordIndex + 1].record_date;

      if (daysBetween(previousDate, currentDate) !== 1) {
        return false;
      }
    }

    if (!singleDayMetricMatch(metric, condition, records, recordIndex, cat)) {
      return false;
    }
  }

  return true;
}

function collectSingleMetricEvents(records: DailyHealthRecordRow[], cat: CatRow) {
  const latestIndex = records.length - 1;
  const latestDate = records[latestIndex]?.record_date;

  if (!latestDate) {
    return [];
  }

  const strongestEvents = new Map<string, EvaluatedEvent>();

  for (const rule of rulesConfig.single_metric_rules) {
    for (const condition of rule.conditions) {
      if (!hasConsecutiveMetricMatches(rule.metric, condition, records, latestIndex, cat)) {
        continue;
      }

      const dedupeKey = `${rule.metric}:${condition.condition_key}`;
      const nextEvent: EvaluatedEvent = {
        ruleKey: condition.rule_key,
        metric: rule.metric,
        conditionKey: condition.condition_key,
        level: condition.level,
        alertType: "single_metric",
        alertDate: latestDate,
        metadata: {
          consecutive_days: condition.consecutive_days,
        },
      };

      const current = strongestEvents.get(dedupeKey);

      if (!current || severityRank[nextEvent.level] > severityRank[current.level]) {
        strongestEvents.set(dedupeKey, nextEvent);
      }
    }
  }

  return Array.from(strongestEvents.values());
}

function activeConditionSet(events: EvaluatedEvent[]) {
  return new Set(events.map((event) => `${event.metric}:${event.conditionKey}`));
}

function collectCombinationEvents(events: EvaluatedEvent[], alertDate: string) {
  const activeConditions = activeConditionSet(events);

  return rulesConfig.combination_rules
    .filter((rule) =>
      rule.all_of.every((clause) => activeConditions.has(`${clause.metric}:${clause.condition_key}`))
    )
    .map<EvaluatedEvent>((rule) => ({
      ruleKey: rule.rule_key,
      metric: rule.metric,
      conditionKey: rule.condition_key,
      level: rule.level,
      alertType: "combination",
      alertDate,
      metadata: {
        window: rule.window,
      },
    }));
}

function singleDayClauseMatch(
  clause: CombinationClause,
  records: DailyHealthRecordRow[],
  recordIndex: number,
  cat: CatRow,
) {
  const rule = rulesConfig.single_metric_rules.find((entry) => entry.metric === clause.metric);
  const condition = rule?.conditions.find((entry) => entry.condition_key === clause.condition_key);

  if (!rule || !condition) {
    return false;
  }

  return singleDayMetricMatch(rule.metric, condition, records, recordIndex, cat);
}

function hasConsecutiveTriggerCondition(
  clauses: CombinationClause[],
  consecutiveDays: number,
  records: DailyHealthRecordRow[],
  cat: CatRow,
) {
  const latestIndex = records.length - 1;

  for (let offset = 0; offset < consecutiveDays; offset += 1) {
    const recordIndex = latestIndex - offset;

    if (recordIndex < 0) {
      return false;
    }

    if (offset > 0) {
      const previousDate = records[recordIndex].record_date;
      const currentDate = records[recordIndex + 1].record_date;

      if (daysBetween(previousDate, currentDate) !== 1) {
        return false;
      }
    }

    if (!clauses.every((clause) => singleDayClauseMatch(clause, records, recordIndex, cat))) {
      return false;
    }
  }

  return true;
}

function shouldCreateWeightReminder(
  records: DailyHealthRecordRow[],
  singleMetricEvents: EvaluatedEvent[],
  cat: CatRow,
) {
  const latestRecord = records[records.length - 1];

  if (!latestRecord) {
    return false;
  }

  const latestWeightRecord = [...records].reverse().find((record) => record.weight_kg !== null);

  if (!latestWeightRecord) {
    return true;
  }

  if (daysBetween(latestWeightRecord.record_date, latestRecord.record_date) >= rulesConfig.weight_reminder.interval_days) {
    return true;
  }

  const activeRuleKeys = new Set(singleMetricEvents.map((event) => event.ruleKey));

  if (rulesConfig.weight_reminder.trigger_rule_keys.some((ruleKey) => activeRuleKeys.has(ruleKey))) {
    return true;
  }

  return rulesConfig.weight_reminder.trigger_conditions.some((condition) =>
    hasConsecutiveTriggerCondition(condition.all_of, condition.consecutive_days, records, cat)
  );
}

function createWeightReminderEvent(records: DailyHealthRecordRow[]): EvaluatedEvent | null {
  const latestRecord = records[records.length - 1];

  if (!latestRecord) {
    return null;
  }

  return {
    ruleKey: rulesConfig.weight_reminder.rule_key,
    metric: rulesConfig.weight_reminder.metric,
    conditionKey: rulesConfig.weight_reminder.condition_key,
    level: rulesConfig.weight_reminder.level,
    alertType: "weight_reminder",
    alertDate: latestRecord.record_date,
    metadata: {
      interval_days: rulesConfig.weight_reminder.interval_days,
    },
  };
}

function createVetVisitReminderEvent(
  records: DailyHealthRecordRow[],
  cat: CatRow,
  latestVetVisit: VetVisitRow | null,
) {
  const latestRecord = records[records.length - 1];

  if (!latestRecord) {
    return null;
  }

  const referenceVisitDate = latestVetVisit?.visit_date ?? cat.last_vet_visit_date;

  if (!referenceVisitDate) {
    return null;
  }

  if (daysBetween(referenceVisitDate, latestRecord.record_date) < rulesConfig.vet_visit_reminder.interval_days) {
    return null;
  }

  return {
    ruleKey: rulesConfig.vet_visit_reminder.rule_key,
    metric: rulesConfig.vet_visit_reminder.metric,
    conditionKey: rulesConfig.vet_visit_reminder.condition_key,
    level: rulesConfig.vet_visit_reminder.level,
    alertType: "vet_visit_reminder",
    alertDate: latestRecord.record_date,
    metadata: {
      interval_days: rulesConfig.vet_visit_reminder.interval_days,
    },
  };
}

function resolveMessage(
  messageMap: Map<string, string>,
  metric: string,
  conditionKey: string,
  level: AlertLevel,
  languageCode: "en" | "zh-TW",
) {
  return messageMap.get(`${metric}:${conditionKey}:${level}:${languageCode}`)
    ?? messageMap.get(`${metric}:${conditionKey}:${level}:en`)
    ?? "Please review your cat's recent health record.";
}

async function fetchRecipients(cat: CatRow) {
  const { data: ownerProfile, error: ownerError } = await admin
    .from("profiles")
    .select("id, email, language_code")
    .eq("id", cat.owner_user_id)
    .maybeSingle();

  if (ownerError) {
    throw ownerError;
  }

  const { data: preferenceRows, error: preferenceError } = await admin
    .from("cat_notification_preferences")
    .select("user_id, email_important_alerts, email_daily_digest")
    .eq("cat_id", cat.id);

  if (preferenceError) {
    throw preferenceError;
  }

  const preferenceMap = new Map<string, { email_important_alerts: boolean; email_daily_digest: boolean }>();

  for (const row of preferenceRows ?? []) {
    preferenceMap.set(row.user_id, {
      email_important_alerts: row.email_important_alerts,
      email_daily_digest: row.email_daily_digest,
    });
  }

  if (ownerProfile && !preferenceMap.has(ownerProfile.id)) {
    preferenceMap.set(ownerProfile.id, {
      email_important_alerts: true,
      email_daily_digest: true,
    });
  }

  const userIds = Array.from(preferenceMap.keys());

  if (userIds.length === 0) {
    return [] as Recipient[];
  }

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, language_code")
    .in("id", userIds);

  if (profilesError) {
    throw profilesError;
  }

  return (profiles ?? []).map((profile) => ({
    user_id: profile.id,
    email: profile.email,
    language_code: (profile.language_code ?? "zh-TW") as "en" | "zh-TW",
    email_important_alerts: preferenceMap.get(profile.id)?.email_important_alerts ?? false,
    email_daily_digest: preferenceMap.get(profile.id)?.email_daily_digest ?? false,
  }));
}

async function deactivatePreviousAlerts(
  catId: string,
  latestDate: string,
  latestWeightKg: number | string | null | undefined,
) {
  // ### keep derived weight alerts until a new measurement can confirm they no longer apply
  let query = admin
    .from("alerts")
    .update({ is_active: false })
    .eq("cat_id", catId)
    .lt("alert_date", latestDate)
    .eq("is_active", true);

  if (shouldPreserveWeightChangeAlerts(latestWeightKg)) {
    query = query.neq("metric", "weight_change_percent");
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}

async function upsertAlertVariants(
  catId: string,
  event: EvaluatedEvent,
  dailyHealthRecordId: string | null,
  messageMap: Map<string, string>,
) {
  const payload = (["en", "zh-TW"] as const).map((languageCode) => ({
    cat_id: catId,
    daily_health_record_id: dailyHealthRecordId,
    alert_date: event.alertDate,
    alert_level: event.level,
    alert_type: event.alertType,
    metric: event.metric,
    condition_key: event.conditionKey,
    rule_key: event.ruleKey,
    message_language_code: languageCode,
    message: resolveMessage(messageMap, event.metric, event.conditionKey, event.level, languageCode),
    is_active: true,
    metadata: event.metadata ?? {},
  }));

  const { data, error } = await admin
    .from("alerts")
    .upsert(payload, {
      onConflict: "cat_id,alert_date,rule_key,message_language_code",
    })
    .select("id, message_language_code, message, alert_level, alert_date");

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [
      row.message_language_code as "en" | "zh-TW",
      {
        id: row.id as string,
        message: row.message as string,
        alert_level: row.alert_level as AlertLevel,
        alert_date: row.alert_date as string,
      },
    ]),
  );
}

function selectRecipientsForEvent(event: EvaluatedEvent, recipients: Recipient[]) {
  if (event.level === "emergency") {
    return recipients.filter((recipient) => recipient.email_important_alerts);
  }

  if (event.level === "vet_recommended") {
    return recipients.filter((recipient) => recipient.email_important_alerts || recipient.email_daily_digest);
  }

  if (event.level === "caution") {
    return recipients.filter((recipient) => recipient.email_daily_digest);
  }

  return [];
}

async function createAlertDeliveries(
  event: EvaluatedEvent,
  alertVariants: Map<"en" | "zh-TW", { id: string; message: string; alert_level: AlertLevel; alert_date: string }>,
  recipients: Recipient[],
) {
  const selectedRecipients = selectRecipientsForEvent(event, recipients).filter((recipient) => Boolean(recipient.email));

  if (selectedRecipients.length === 0) {
    return [];
  }

  const payload = selectedRecipients.map((recipient) => {
    const preferredAlert = alertVariants.get(recipient.language_code) ?? alertVariants.get("en");

    if (!preferredAlert) {
      throw new Error(`No alert variant available for ${recipient.language_code}.`);
    }

    return {
      alert_id: preferredAlert.id,
      user_id: recipient.user_id,
      channel: "email",
      delivery_group_key:
        event.level === "emergency"
          ? `emergency:${preferredAlert.id}`
          : `${recipient.user_id}:${event.alertDate}`,
    };
  });

  const { data, error } = await admin
    .from("alert_deliveries")
    .upsert(payload, {
      onConflict: "alert_id,user_id,channel",
      ignoreDuplicates: true,
    })
    .select("id, alert_id, user_id, delivery_status");

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{ id: string; alert_id: string; user_id: string; delivery_status: string }>;
}

async function sendEmergencyEmails(
  alertVariants: Map<"en" | "zh-TW", { id: string; message: string; alert_level: AlertLevel; alert_date: string }>,
  recipients: Recipient[],
) {
  const emergencyRecipients = recipients.filter((recipient) => recipient.email && recipient.email_important_alerts);

  for (const recipient of emergencyRecipients) {
    const preferredAlert = alertVariants.get(recipient.language_code) ?? alertVariants.get("en");

    if (!preferredAlert || !recipient.email) {
      continue;
    }

    try {
      const subject =
        recipient.language_code === "zh-TW"
          ? "CATable 緊急提醒"
          : "CATable emergency alert";

      const html = `
        <p>${preferredAlert.message}</p>
        <p>${preferredAlert.alert_date}</p>
      `;

      await sendEmail({
        to: recipient.email,
        subject,
        html,
      });

      await admin
        .from("alert_deliveries")
        .update({
          delivery_status: "sent",
          delivered_at: new Date().toISOString(),
        })
        .eq("alert_id", preferredAlert.id)
        .eq("user_id", recipient.user_id)
        .eq("channel", "email");
    } catch (error) {
      await admin
        .from("alert_deliveries")
        .update({
          delivery_status: "failed",
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq("alert_id", preferredAlert.id)
        .eq("user_id", recipient.user_id)
        .eq("channel", "email");
    }
  }
}

async function evaluateCat(cat: CatRow, messageMap: Map<string, string>, dryRun = false) {
  const { data: recordRows, error: recordError } = await admin
    .from("daily_health_records")
    .select(`
      id,
      cat_id,
      record_date,
      appetite_score,
      food_ratio,
      water_intake,
      stool_condition,
      urine_times,
      activity_score,
      resting_breath_rate,
      vomit_times,
      abnormal_behavior,
      gum_appearance,
      medication_taken,
      weight_kg
    `)
    .eq("cat_id", cat.id)
    .order("record_date", { ascending: false })
    .limit(45);

  if (recordError) {
    throw recordError;
  }

  const records = [...((recordRows ?? []) as DailyHealthRecordRow[])].reverse();

  if (records.length === 0) {
    return {
      catId: cat.id,
      evaluated: false,
      reason: "No daily health records found.",
    };
  }

  const { data: visitRows, error: visitError } = await admin
    .from("vet_visits")
    .select("visit_date")
    .eq("cat_id", cat.id)
    .order("visit_date", { ascending: false })
    .limit(1);

  if (visitError) {
    throw visitError;
  }

  const latestVetVisit = ((visitRows ?? [])[0] ?? null) as VetVisitRow | null;
  const recipients = await fetchRecipients(cat);
  const singleMetricEvents = collectSingleMetricEvents(records, cat);
  const latestRecord = records[records.length - 1];
  const combinationEvents = collectCombinationEvents(singleMetricEvents, latestRecord.record_date);
  const weightReminderEvent = shouldCreateWeightReminder(records, singleMetricEvents, cat)
    ? createWeightReminderEvent(records)
    : null;
  const vetVisitReminderEvent = createVetVisitReminderEvent(records, cat, latestVetVisit);

  const events = [
    ...singleMetricEvents,
    ...combinationEvents,
    ...(weightReminderEvent ? [weightReminderEvent] : []),
    ...(vetVisitReminderEvent ? [vetVisitReminderEvent] : []),
  ];

  if (events.length === 0) {
    if (!dryRun) {
      await deactivatePreviousAlerts(cat.id, latestRecord.record_date, latestRecord.weight_kg);
    }

    return {
      catId: cat.id,
      evaluated: true,
      alertCount: 0,
    };
  }

  if (dryRun) {
    return {
      catId: cat.id,
      evaluated: true,
      alertCount: events.length,
      events,
    };
  }

  await deactivatePreviousAlerts(cat.id, latestRecord.record_date, latestRecord.weight_kg);

  for (const event of events) {
    const alertVariants = await upsertAlertVariants(cat.id, event, latestRecord.id, messageMap);
    await createAlertDeliveries(event, alertVariants, recipients);

    if (event.level === "emergency") {
      await sendEmergencyEmails(alertVariants, recipients);
    }
  }

  return {
    catId: cat.id,
    evaluated: true,
    alertCount: events.length,
    events,
  };
}

serve(async (request) => {
  try {
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const dryRun = Boolean(body.dryRun);
    const catId = typeof body.catId === "string" ? body.catId : null;
    const messageMap = await loadFeedbackMessages();

    let query = admin
      .from("cats")
      .select("id, owner_user_id, age_months, initial_weight_kg, primary_diet, last_vet_visit_date");

    if (catId) {
      query = query.eq("id", catId);
    }

    const { data: cats, error } = await query;

    if (error) {
      throw error;
    }

    const results = [];

    for (const cat of (cats ?? []) as CatRow[]) {
      results.push(await evaluateCat(cat, messageMap, dryRun));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        evaluatedCats: results.length,
        results,
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
