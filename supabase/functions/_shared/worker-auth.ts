export function requireServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;

  // ### service-role workers mutate alert state, so public anon invocations must stop before side effects
  if (token === serviceRoleKey) {
    return null;
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}
