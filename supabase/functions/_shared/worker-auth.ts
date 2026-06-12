const jsonHeaders = { "Content-Type": "application/json" };

export function getWorkerAuthorizationFailure(request: Request, serviceRoleKey: string) {
  const authorizationHeader = request.headers.get("authorization");
  const expectedAuthorizationHeader = `Bearer ${serviceRoleKey}`;

  // ### service-role workers mutate/read cross-user alert data, so only internal service calls may execute them
  if (authorizationHeader === expectedAuthorizationHeader) {
    return null;
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized",
    }),
    {
      status: 401,
      headers: jsonHeaders,
    },
  );
}
