export function requireServiceRole(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  // ### privileged alert functions use service-role DB access and must not accept public anon calls
  if (scheme?.toLowerCase() !== "bearer" || token !== serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized alert worker request.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return null;
}
