import alertRules from "./alert-rules.json" with { type: "json" };

export type AlertLevel = "normal" | "caution" | "vet_recommended" | "emergency";

export type MatchRule =
  | { type: "equals"; value: string | number | boolean }
  | { type: "gte"; value: number; direction?: "up" | "down" }
  | { type: "lt"; value: number }
  | { type: "range"; min_inclusive: number; max_inclusive?: number; max_exclusive?: number; direction?: "up" | "down" }
  | { type: "derived_kitten_stagnant"; age_months_lt: number; window_days: number; net_change_percent_lte: number };

export type SingleMetricCondition = {
  rule_key: string;
  condition_key: string;
  level: AlertLevel;
  consecutive_days: number;
  match: MatchRule;
};

export type SingleMetricRule = {
  metric: string;
  conditions: SingleMetricCondition[];
};

export type CombinationClause = {
  metric: string;
  condition_key: string;
};

export type CombinationRule = {
  rule_key: string;
  metric: "combination";
  condition_key: string;
  level: AlertLevel;
  window: "same_day";
  all_of: CombinationClause[];
};

export type TriggerCondition = {
  rule_key: string;
  window: "same_day";
  consecutive_days: number;
  all_of: CombinationClause[];
};

export type WeightReminderRule = {
  rule_key: string;
  metric: "weight_reminder";
  condition_key: string;
  level: AlertLevel;
  interval_days: number;
  trigger_rule_keys: string[];
  trigger_conditions: TriggerCondition[];
};

export type VetVisitReminderRule = {
  rule_key: string;
  metric: "vet_visit_reminder";
  condition_key: string;
  level: AlertLevel;
  interval_days: number;
};

export type AlertRulesConfig = {
  version: string;
  single_metric_rules: SingleMetricRule[];
  combination_rules: CombinationRule[];
  weight_reminder: WeightReminderRule;
  vet_visit_reminder: VetVisitReminderRule;
};

// ### keep a function-local copy of the rules so edge deploys do not depend on files outside the bundle
export const rulesConfig = alertRules as AlertRulesConfig;
