import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "supabase/migrations/20260805010000_default_profile_language_to_en.sql",
);
const checkAlertsPath = join(root, "supabase/functions/check-alerts/index.ts");
const digestPath = join(root, "supabase/functions/send-alert-digests/index.ts");
const dataModelPath = join(root, "docs/data-model.md");
const productDecisionsPath = join(root, "docs/product-decisions.md");

describe("English MVP profile language default", () => {
  const migration = readFileSync(migrationPath, "utf8");
  const checkAlerts = readFileSync(checkAlertsPath, "utf8");
  const digests = readFileSync(digestPath, "utf8");
  const dataModel = readFileSync(dataModelPath, "utf8");
  const productDecisions = readFileSync(productDecisionsPath, "utf8");

  it("sets the profiles.language_code column default to en", () => {
    assert.match(migration, /alter column language_code set default 'en'/i);
  });

  it("backfills accidental zh-TW defaults while no language picker exists", () => {
    assert.match(migration, /set language_code = 'en'/i);
    assert.match(migration, /where language_code = 'zh-TW'/i);
  });

  it("seeds English explicitly in handle_new_user", () => {
    assert.match(migration, /create or replace function app_private\.handle_new_user/i);
    assert.match(migration, /insert into public\.profiles \(id, email, display_name, language_code\)/i);
    assert.match(migration, /'en'\s*\)/);
  });

  it("falls back to English in alert and digest workers", () => {
    assert.match(checkAlerts, /profile\.language_code \?\? "en"/);
    assert.doesNotMatch(checkAlerts, /profile\.language_code \?\? "zh-TW"/);
    assert.match(digests, /profile\.language_code \?\? "en"/);
    assert.doesNotMatch(digests, /profile\.language_code \?\? "zh-TW"/);
  });

  it("documents English as the MVP default profile language", () => {
    assert.match(dataModel, /profiles\.language_code[\s\S]*defaults to `en`/i);
    assert.match(productDecisions, /English is the MVP default profile language/i);
  });
});
