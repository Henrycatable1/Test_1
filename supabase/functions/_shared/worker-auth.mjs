export function getWorkerAuthError(request, serviceRoleKey) {
  if (!serviceRoleKey) {
    return {
      status: 500,
      body: {
        ok: false,
        error: "Missing worker authorization configuration.",
      },
    };
  }

  const authorizationHeader = request.headers.get("authorization");

  // ### require the service-role bearer so public anon/user JWTs cannot drive backend-only workers
  if (authorizationHeader !== `Bearer ${serviceRoleKey}`) {
    return {
      status: 401,
      body: {
        ok: false,
        error: "Unauthorized worker request.",
      },
    };
  }

  return null;
}

export function workerAuthErrorResponse(authError) {
  return new Response(JSON.stringify(authError.body), {
    status: authError.status,
    headers: { "Content-Type": "application/json" },
  });
}
