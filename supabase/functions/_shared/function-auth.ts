export function requireServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  // ### privileged workers use the service-role JWT; the public anon key must never reach admin paths
  if (scheme?.toLowerCase() === "bearer" && token === serviceRoleKey) {
    return null;
  }

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
