import assert from "node:assert/strict";
import test from "node:test";

import { getWorkerAuthError } from "./worker-auth.mjs";

function requestWithAuthorization(value) {
  return new Request("https://example.test/functions/v1/check-alerts", {
    headers: value ? { authorization: value } : undefined,
  });
}

test("accepts the configured service-role bearer", () => {
  const authError = getWorkerAuthError(requestWithAuthorization("Bearer service-role-secret"), "service-role-secret");

  assert.equal(authError, null);
});

test("rejects public anon or user tokens", () => {
  const authError = getWorkerAuthError(requestWithAuthorization("Bearer public-anon-token"), "service-role-secret");

  assert.equal(authError?.status, 401);
  assert.equal(authError?.body.error, "Unauthorized worker request.");
});

test("rejects missing worker configuration", () => {
  const authError = getWorkerAuthError(requestWithAuthorization("Bearer anything"), "");

  assert.equal(authError?.status, 500);
  assert.equal(authError?.body.error, "Missing worker authorization configuration.");
});
