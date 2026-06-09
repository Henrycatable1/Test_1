export function hasServiceRoleAuthorization(request: Request, serviceRoleKey: string) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1] === serviceRoleKey;
}

export function unauthorizedWorkerResponse() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Unauthorized.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}
