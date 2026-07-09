import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTypeScriptModule(path) {
  const source = readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };

  vm.runInNewContext(outputText, {
    exports: module.exports,
    module,
    URL,
  });

  return module.exports;
}

const { toSafeNextPath } = loadTypeScriptModule("src/features/auth/lib/redirect-path.ts");

assert.equal(toSafeNextPath(null), "/dashboard");
assert.equal(toSafeNextPath("dashboard"), "/dashboard");
assert.equal(toSafeNextPath("https://evil.example/phish"), "/dashboard");
assert.equal(toSafeNextPath("//evil.example/phish"), "/dashboard");
assert.equal(toSafeNextPath("  //evil.example/phish  "), "/dashboard");
assert.equal(toSafeNextPath("/\\evil.example/phish"), "/dashboard");
assert.equal(toSafeNextPath("/onboarding"), "/onboarding");
assert.equal(toSafeNextPath("/dashboard?tab=alerts#today"), "/dashboard?tab=alerts#today");

console.log("auth redirect path tests passed");
