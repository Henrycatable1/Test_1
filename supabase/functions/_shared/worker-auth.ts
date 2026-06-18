function buildUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized worker invocation.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function readBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization")?.trim() ?? "";
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() ?? null;
}

export function requireServiceRoleAuthorization(request: Request, serviceRoleKey: string) {
  // ### these worker functions run service-role writes, so public anon callers must stop at the edge
  if (readBearerToken(request) !== serviceRoleKey) {
    return buildUnauthorizedResponse();
  }

  return null;
}
