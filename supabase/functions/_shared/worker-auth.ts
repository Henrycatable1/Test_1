export function requireServiceRoleBearer(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  // ### protect service-role workers from public anon JWT invocation
  if (scheme?.toLowerCase() !== "bearer" || token !== serviceRoleKey) {
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

  return null;
}
