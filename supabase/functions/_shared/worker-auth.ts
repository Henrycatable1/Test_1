function getBearerToken(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() ?? null;
}

export function requireServiceRoleAuth(request: Request, serviceRoleKey: string) {
  // ### block public anon-key calls before service-role clients can read or mutate data
  if (getBearerToken(request) === serviceRoleKey) {
    return null;
  }

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
