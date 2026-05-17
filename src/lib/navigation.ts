export function toSafeInternalPath(
  input: string | null | undefined,
  fallbackPath = "/dashboard",
  baseOrigin = "http://localhost",
) {
  const normalizedInput = input?.trim();

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return fallbackPath;
  }

  try {
    const baseUrl = new URL(baseOrigin);
    const targetUrl = new URL(normalizedInput, baseUrl);

    // ### keep auth handoff targets inside this app even when `next` looks path-like
    if (targetUrl.origin !== baseUrl.origin) {
      return fallbackPath;
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return fallbackPath;
  }
}
