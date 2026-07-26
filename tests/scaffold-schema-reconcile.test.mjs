import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const reconcileName = "20260409000000_reconcile_scaffold_schema_rewrite.sql";

function migrationVersion(filename) {
  const match = filename.match(/^(\d+)/);
  assert.ok(match, `migration filename must start with a version: ${filename}`);
  return match[1];
}

// ### lock the upgrade-path contract that keeps rewritten bootstrap DBs migratable
test("reconcile migration is ordered after the no-op and before app_private dependents", () => {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => {
      const leftVersion = migrationVersion(left);
      const rightVersion = migrationVersion(right);
      return leftVersion < rightVersion ? -1 : leftVersion > rightVersion ? 1 : left.localeCompare(right);
    });

  assert.ok(files.includes(reconcileName), "reconcile migration file must exist");
  assert.ok(
    files.includes("20260408235800_add_cat_health_context.sql"),
    "no-op health-context migration must exist",
  );
  assert.ok(
    files.includes("20260421100000_optimize_catable_policies_and_indexes.sql"),
    "first app_private-dependent migration must exist",
  );

  const reconcileIndex = files.indexOf(reconcileName);
  assert.equal(
    files[reconcileIndex - 1],
    "20260408235800_add_cat_health_context.sql",
    "reconcile must run immediately after the superseded no-op migration",
  );
  assert.equal(
    files[reconcileIndex + 1],
    "20260421100000_optimize_catable_policies_and_indexes.sql",
    "reconcile must run before migrations that require app_private",
  );

  assert.ok(
    migrationVersion("20260408_initial_schema.sql") < migrationVersion(reconcileName),
    "reconcile version must be after the rewritten bootstrap version",
  );
  assert.ok(
    migrationVersion(reconcileName) < migrationVersion("20260421100000_optimize_catable_policies_and_indexes.sql"),
    "reconcile version must be before app_private-dependent migrations",
  );
});

test("reconcile migration reshapes scaffold cats and creates the CATable bootstrap surface", () => {
  const sql = readFileSync(join(migrationsDir, reconcileName), "utf8");

  assert.match(sql, /profile_id/, "must detect legacy cats.profile_id");
  assert.match(sql, /owner_user_id/, "must introduce cats.owner_user_id");
  assert.match(sql, /age_years/, "must read scaffold age_years");
  assert.match(sql, /age_months/, "must write CATable age_months");
  assert.match(sql, /create schema if not exists app_private/, "must create app_private");
  assert.match(sql, /create table if not exists public\.daily_health_records/, "must create daily_health_records");
  assert.match(sql, /drop table if exists public\.log_entries/, "must retire prototype log_entries");
  assert.match(
    sql,
    /to_regclass\('public\.log_entries'\) is not null/,
    "must guard scaffold policy drops when prototype tables are absent",
  );
});

test("superseded health-context migration remains a no-op so reconcile stays required", () => {
  const sql = readFileSync(
    join(migrationsDir, "20260408235800_add_cat_health_context.sql"),
    "utf8",
  );

  assert.match(sql, /intentionally left as a no-op/i);
  assert.doesNotMatch(sql, /create table/i);
  assert.doesNotMatch(sql, /create schema/i);
});
