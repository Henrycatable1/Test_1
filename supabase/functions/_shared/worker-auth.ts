const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const alertWorkerSecret = Deno.env.get("ALERT_WORKER_SECRET");

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
  const requestWorkerSecret = request.headers.get("x-alert-worker-secret");

  // ### service role and worker secret are the only callers allowed to run cross-cat alert jobs
  if (serviceRoleKey && bearerToken === serviceRoleKey) {
    return null;
  }

  if (alertWorkerSecret && requestWorkerSecret === alertWorkerSecret) {
    return null;
  }

  return unauthorizedResponse();
}

export function getAlertWorkerSecret() {
  return alertWorkerSecret;
}
