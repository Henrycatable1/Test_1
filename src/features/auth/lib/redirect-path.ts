const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep post-auth redirects inside this app even when attackers pass URL-like paths
  if (!normalizedInput.startsWith("/") || normalizedInput.startsWith("//") || normalizedInput.startsWith("/\\")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  try {
    const parsed = new URL(normalizedInput, "https://catable.local");

    if (parsed.origin !== "https://catable.local") {
      return DEFAULT_AUTH_REDIRECT_PATH;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }
}
