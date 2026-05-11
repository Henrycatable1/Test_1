import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import ts from "typescript";

const sourceUrl = new URL("../src/lib/auth/redirects.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`;
const { toSafeAuthNextPath } = await import(moduleUrl);

test("keeps same-app auth next paths", () => {
  assert.equal(toSafeAuthNextPath("/dashboard"), "/dashboard");
  assert.equal(toSafeAuthNextPath("/logs/new/food?source=email#entry"), "/logs/new/food?source=email#entry");
  assert.equal(toSafeAuthNextPath(" /onboarding "), "/onboarding");
});

test("falls back for non-path auth next values", () => {
  assert.equal(toSafeAuthNextPath(null), "/dashboard");
  assert.equal(toSafeAuthNextPath(undefined), "/dashboard");
  assert.equal(toSafeAuthNextPath(""), "/dashboard");
  assert.equal(toSafeAuthNextPath("https://attacker.example/phish"), "/dashboard");
});

test("rejects protocol-relative auth next values", () => {
  assert.equal(toSafeAuthNextPath("//attacker.example/phish"), "/dashboard");
  assert.equal(toSafeAuthNextPath("///attacker.example/phish"), "/dashboard");
  assert.equal(toSafeAuthNextPath("/\\attacker.example/phish"), "/dashboard");
});
