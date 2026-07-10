export function isServiceRoleBearer(authorizationHeader, serviceRoleKey) {
  if (!authorizationHeader || !serviceRoleKey) {
    return false;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  return extraParts.length === 0 && /^Bearer$/i.test(scheme) && token === serviceRoleKey;
}

export function authorizeWorkerRequest(request, serviceRoleKey) {
  if (isServiceRoleBearer(request.headers.get("authorization"), serviceRoleKey)) {
    return null;
  }

  // ### service-role workers must not accept public anon or end-user JWT invocations
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
