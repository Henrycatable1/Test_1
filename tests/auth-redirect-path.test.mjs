import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

function loadRedirectPathModule() {
  const source = readFileSync(new URL("../src/features/auth/lib/redirect-path.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const cjsModule = { exports: {} };

  vm.runInNewContext(outputText, { exports: cjsModule.exports, module: cjsModule });

  return cjsModule.exports;
}

const { toSafeAuthRedirectPath } = loadRedirectPathModule();

test("keeps same-origin auth redirect paths", () => {
  assert.equal(toSafeAuthRedirectPath("/onboarding"), "/onboarding");
  assert.equal(toSafeAuthRedirectPath(" /dashboard?range=14 "), "/dashboard?range=14");
});

test("falls back when the auth redirect path is missing or not app-relative", () => {
  assert.equal(toSafeAuthRedirectPath(null), "/dashboard");
  assert.equal(toSafeAuthRedirectPath(""), "/dashboard");
  assert.equal(toSafeAuthRedirectPath("https://evil.example/phish"), "/dashboard");
  assert.equal(toSafeAuthRedirectPath("dashboard"), "/dashboard");
});

test("rejects protocol-relative and backslash auth redirects", () => {
  const encodedProtocolRelative = new URL(
    "https://app.example/auth/callback?next=%2F%2Fevil.example%2Fphish",
  ).searchParams.get("next");
  const encodedBackslash = new URL(
    "https://app.example/auth/callback?next=%2F%5Cevil.example%2Fphish",
  ).searchParams.get("next");

  assert.equal(toSafeAuthRedirectPath("//evil.example/phish"), "/dashboard");
  assert.equal(toSafeAuthRedirectPath("/\\evil.example/phish"), "/dashboard");
  assert.equal(toSafeAuthRedirectPath(encodedProtocolRelative), "/dashboard");
  assert.equal(toSafeAuthRedirectPath(encodedBackslash), "/dashboard");
});
