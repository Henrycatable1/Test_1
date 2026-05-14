export function authorizeServiceRoleRequest(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("authorization") ?? "";
  const expectedAuthorization = `Bearer ${serviceRoleKey}`;

  if (authorization === expectedAuthorization) {
    return null;
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized alert worker invocation.",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
