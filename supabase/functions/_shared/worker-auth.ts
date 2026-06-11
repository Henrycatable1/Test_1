export function requireServiceRole(request: Request, serviceRoleKey: string) {
  const authHeader = request.headers.get("authorization")?.trim();

  if (authHeader === `Bearer ${serviceRoleKey}`) {
    return null;
  }

  // ### service-role workers bypass RLS, so reject public anon/authenticated callers before any side effects
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
