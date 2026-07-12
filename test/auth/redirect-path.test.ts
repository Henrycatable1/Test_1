import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toSafeNextPath } from "../../src/features/auth/lib/redirect-path.ts";

describe("toSafeNextPath", () => {
  it("keeps app-relative paths including query strings", () => {
    assert.equal(toSafeNextPath("/onboarding?from=signin"), "/onboarding?from=signin");
  });

  it("falls back when next is missing or not app-relative", () => {
    assert.equal(toSafeNextPath(null), "/dashboard");
    assert.equal(toSafeNextPath("dashboard"), "/dashboard");
    assert.equal(toSafeNextPath("https://attacker.example/phish"), "/dashboard");
  });

  it("rejects protocol-relative and backslash-prefixed redirects", () => {
    assert.equal(toSafeNextPath("//attacker.example/phish"), "/dashboard");
    assert.equal(toSafeNextPath("/\\attacker.example/phish"), "/dashboard");
  });
});
