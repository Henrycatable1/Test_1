const jsonHeaders = { "Content-Type": "application/json" };

export function requireServiceRoleBearer(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  // ### worker endpoints run with service-role privileges, so public anon/user JWTs must stop here
  if (scheme?.toLowerCase() !== "bearer" || token !== serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized worker invocation.",
      }),
      {
        status: 401,
        headers: jsonHeaders,
      },
    );
  }

  return null;
}
