export function authorizeWorkerRequest(request: Request, serviceRoleKey: string) {
  const authorizationHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorizationHeader.split(/\s+/, 2);

  if (scheme?.toLowerCase() === "bearer" && token === serviceRoleKey) {
    return null;
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized worker invocation.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}
