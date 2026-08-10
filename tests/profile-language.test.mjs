import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveProfileLanguageCode } from "../src/features/app/lib/profile-language.ts";

describe("resolveProfileLanguageCode", () => {
  it("keeps supported profile language codes", () => {
    assert.equal(resolveProfileLanguageCode("en"), "en");
    assert.equal(resolveProfileLanguageCode("zh-TW"), "zh-TW");
  });

  it("falls back to the schema default when language is missing or unsupported", () => {
    assert.equal(resolveProfileLanguageCode(null), "zh-TW");
    assert.equal(resolveProfileLanguageCode(undefined), "zh-TW");
    assert.equal(resolveProfileLanguageCode("fr"), "zh-TW");
    assert.equal(resolveProfileLanguageCode(""), "zh-TW");
  });
});
