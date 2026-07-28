import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "supabase/migrations/20260728010200_sync_profile_email_on_auth_email_change.sql",
);
const dataModelPath = join(root, "docs/data-model.md");

describe("profile email sync on auth email change", () => {
  const migration = readFileSync(migrationPath, "utf8");
  const dataModel = readFileSync(dataModelPath, "utf8");

  it("installs an auth.users email update trigger that mirrors into profiles.email", () => {
    assert.match(migration, /create or replace function app_private\.sync_profile_email_from_auth_user/);
    assert.match(migration, /after update of email on auth\.users/);
    assert.match(migration, /on_auth_user_email_updated/);
    assert.match(migration, /set email = new\.email/);
  });

  it("clears conflicting profile email claims before assigning the verified address", () => {
    assert.match(migration, /set email = null/);
    assert.match(migration, /where email = new\.email/);
    assert.match(migration, /and id <> new\.id/);
  });

  it("backfills drifted profile emails from auth.users", () => {
    assert.match(migration, /from auth\.users as auth_user/);
    assert.match(migration, /profile\.email is distinct from auth_user\.email/);
  });

  it("documents that profiles.email must track verified Auth email changes", () => {
    assert.match(
      dataModel,
      /profiles\.email[\s\S]*email change|email change[\s\S]*profiles\.email/i,
    );
  });
});
