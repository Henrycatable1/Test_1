import { describe, expect, it } from "vitest";

import { requireServiceRole } from "./worker-auth";

describe("requireServiceRole", () => {
  it("rejects requests that do not carry the service-role bearer token", async () => {
    const response = requireServiceRole(new Request("https://example.test/functions/v1/check-alerts"), "service-secret");

    expect(response).toBeInstanceOf(Response);
    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({
      ok: false,
      error: "Unauthorized.",
    });
  });

  it("allows exact service-role bearer invocations", () => {
    const request = new Request("https://example.test/functions/v1/check-alerts", {
      headers: {
        Authorization: "Bearer service-secret",
      },
    });

    expect(requireServiceRole(request, "service-secret")).toBeNull();
  });
});
