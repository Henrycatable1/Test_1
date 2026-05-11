const DEFAULT_AUTH_NEXT_PATH = "/dashboard";
const SAFE_NEXT_BASE_URL = "https://catable.local";

export function toSafeAuthNextPath(input: string | null | undefined) {
  const normalizedInput = input?.trim();

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return DEFAULT_AUTH_NEXT_PATH;
  }

  try {
    const parsedPath = new URL(normalizedInput, SAFE_NEXT_BASE_URL);

    // ### reject protocol-relative URLs that would otherwise leave this app after auth
    if (parsedPath.origin !== SAFE_NEXT_BASE_URL) {
      return DEFAULT_AUTH_NEXT_PATH;
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return DEFAULT_AUTH_NEXT_PATH;
  }
}
