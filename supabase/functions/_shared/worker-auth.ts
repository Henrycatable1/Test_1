export function requireServiceRoleBearer(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const expectedAuthorization = `Bearer ${serviceRoleKey}`;

  // ### keep service-role workers from accepting public anon-key invocations
  if (authorization !== expectedAuthorization) {
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
