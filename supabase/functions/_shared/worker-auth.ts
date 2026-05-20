export function isAuthorizedWorkerRequest(request: Request, serviceRoleKey: string) {
  const authorizationHeader = request.headers.get("Authorization") ?? "";

  // ### privileged alert workers use service-role access internally and must not accept the public anon key
  return authorizationHeader === `Bearer ${serviceRoleKey}`;
}

export function unauthorizedWorkerResponse() {
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
