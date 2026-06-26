const jsonHeaders = {
  "Content-Type": "application/json",
};

function bearerTokenFrom(request: Request) {
  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() ?? null;
}

export function requireServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const token = bearerTokenFrom(request);

  // ### these functions use service-role reads and writes, so public anon callers must never reach handlers
  if (!token || token !== serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized.",
      }),
      {
        status: 401,
        headers: jsonHeaders,
      },
    );
  }

  return null;
}
