import assert from "node:assert/strict";
import test from "node:test";

import { mapCatGenderToSex } from "../src/features/app/lib/cat-profile.ts";
import { resolveAuthCallbackOrigin, toSafeNextPath } from "../src/lib/auth-redirects.ts";

test("cat gender enum values map to biological sex without substring matches", () => {
  assert.equal(mapCatGenderToSex("male"), "male");
  assert.equal(mapCatGenderToSex("neutered_male"), "male");
  assert.equal(mapCatGenderToSex("female"), "female");
  assert.equal(mapCatGenderToSex("neutered_female"), "female");
});

test("post-auth next paths stay relative to the application origin", () => {
  assert.equal(toSafeNextPath("/dashboard?tab=summary"), "/dashboard?tab=summary");
  assert.equal(toSafeNextPath(" /onboarding "), "/onboarding");
  assert.equal(toSafeNextPath("https://evil.example/dashboard"), "/dashboard");
  assert.equal(toSafeNextPath("//evil.example/dashboard"), "/dashboard");

  const encodedBackslashPath = new URL("https://app.example/auth?next=/%5C%5Cevil.example").searchParams.get(
    "next",
  );
  assert.equal(toSafeNextPath(encodedBackslashPath), "/dashboard");
});

test("auth callback origin ignores hostile forwarded hosts when an app URL is configured", () => {
  assert.equal(
    resolveAuthCallbackOrigin({
      appUrl: "https://catable.example",
      forwardedHost: "evil.example",
      forwardedProtocol: "https",
      requestUrl: new URL("https://catable.example/auth/callback/server"),
    }),
    "https://catable.example",
  );
});

test("auth callback origin still preserves local preview aliases", () => {
  assert.equal(
    resolveAuthCallbackOrigin({
      appUrl: "http://localhost:3001",
      forwardedHost: "127.0.0.1:3001",
      forwardedProtocol: "http",
      requestUrl: new URL("http://localhost:3001/auth/callback/server"),
    }),
    "http://127.0.0.1:3001",
  );
});
