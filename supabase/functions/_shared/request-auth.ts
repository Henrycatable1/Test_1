const jsonHeaders = { "Content-Type": "application/json" };

function extractBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("Authorization") ?? "";
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() ?? null;
}

export function requireServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const bearerToken = extractBearerToken(request);

  // ### alert workers use service-role privileges, so only service-role callers may invoke them
  if (bearerToken !== serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: jsonHeaders,
      },
    );
  }

  return null;
}
