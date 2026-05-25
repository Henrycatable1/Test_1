const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function unauthorizedResponse() {
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

export function authorizeAlertWorkerRequest(request: Request) {
  const bearerToken = getBearerToken(request);

  // ### only service-role callers may run cross-cat alert jobs with service-role data access
  if (serviceRoleKey && bearerToken === serviceRoleKey) {
    return null;
  }

  return unauthorizedResponse();
}
