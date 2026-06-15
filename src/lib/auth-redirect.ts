const fallbackNextPath = "/dashboard";
const localHostnames = new Set(["localhost", "127.0.0.1"]);

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  if (
    !normalizedInput ||
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.includes("\\") ||
    normalizedInput.includes(":")
  ) {
    return fallbackNextPath;
  }

  try {
    const safeBase = "http://safe.local";
    const resolvedPath = new URL(normalizedInput, safeBase);

    // ### keep post-auth navigation inside this app even when next is user-controlled
    if (resolvedPath.origin !== safeBase) {
      return fallbackNextPath;
    }

    return `${resolvedPath.pathname}${resolvedPath.search}${resolvedPath.hash}`;
  } catch {
    return fallbackNextPath;
  }
}

function parseOrigin(origin: string | null | undefined) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function bothLocalOrigins(firstOrigin: string, secondOrigin: string) {
  const first = new URL(firstOrigin);
  const second = new URL(secondOrigin);

  return localHostnames.has(first.hostname) && localHostnames.has(second.hostname);
}

export function resolveTrustedRequestOrigin({
  requestOrigin,
  headerOrigin,
  canonicalAppUrl,
}: {
  requestOrigin: string;
  headerOrigin: string | null;
  canonicalAppUrl: string | null | undefined;
}) {
  const parsedRequestOrigin = parseOrigin(requestOrigin) ?? requestOrigin;
  const parsedHeaderOrigin = parseOrigin(headerOrigin);
  const canonicalOrigin = parseOrigin(canonicalAppUrl);

  if (!parsedHeaderOrigin) {
    return canonicalOrigin ?? parsedRequestOrigin;
  }

  if (parsedHeaderOrigin === parsedRequestOrigin || parsedHeaderOrigin === canonicalOrigin) {
    return parsedHeaderOrigin;
  }

  // ### allow localhost and 127.0.0.1 aliases during local auth previews without trusting arbitrary hosts
  if (bothLocalOrigins(parsedHeaderOrigin, parsedRequestOrigin)) {
    return parsedHeaderOrigin;
  }

  return canonicalOrigin ?? parsedRequestOrigin;
}
