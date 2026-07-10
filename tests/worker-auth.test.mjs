import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorizeWorkerRequest, isServiceRoleBearer } from "../supabase/functions/_shared/worker-auth.mjs";

describe("worker service-role authorization", () => {
  it("accepts only the configured service-role bearer token", () => {
    assert.equal(isServiceRoleBearer("Bearer service-role-secret", "service-role-secret"), true);
    assert.equal(isServiceRoleBearer("bearer service-role-secret", "service-role-secret"), true);
    assert.equal(isServiceRoleBearer("Bearer anon-key", "service-role-secret"), false);
    assert.equal(isServiceRoleBearer("Basic service-role-secret", "service-role-secret"), false);
    assert.equal(isServiceRoleBearer("Bearer service-role-secret extra", "service-role-secret"), false);
    assert.equal(isServiceRoleBearer(null, "service-role-secret"), false);
    assert.equal(isServiceRoleBearer("Bearer service-role-secret", ""), false);
  });

  it("returns a 401 response before worker side effects for unauthorized requests", async () => {
    const request = new Request("https://example.test/functions/v1/check-alerts", {
      headers: {
        Authorization: "Bearer anon-key",
      },
    });

    const response = authorizeWorkerRequest(request, "service-role-secret");

    assert.ok(response);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "Unauthorized worker request.",
    });
  });

  it("allows authorized worker requests to continue", () => {
    const request = new Request("https://example.test/functions/v1/check-alerts", {
      headers: {
        Authorization: "Bearer service-role-secret",
      },
    });

    assert.equal(authorizeWorkerRequest(request, "service-role-secret"), null);
  });
});
