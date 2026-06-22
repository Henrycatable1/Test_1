function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function requireServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const bearerToken = getBearerToken(request);

  // ### privileged workers run with service-role data access, so only internal service-role calls may enter
  if (bearerToken !== serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unauthorized worker request.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return null;
}
