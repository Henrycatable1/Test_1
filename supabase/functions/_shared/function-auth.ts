export function requireServiceRoleAuthorization(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("Authorization") ?? "";

  if (authorization === `Bearer ${serviceRoleKey}`) {
    return null;
  }

  // ### privileged workers run with the service role key, so public callers must stop here
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}
