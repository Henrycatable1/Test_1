const SAFE_REDIRECT_BASE = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return "/dashboard";
  }

  try {
    const parsedPath = new URL(normalizedInput, SAFE_REDIRECT_BASE);

    // ### keep post-auth redirects inside the app; protocol-relative inputs change origin here
    if (parsedPath.origin !== SAFE_REDIRECT_BASE) {
      return "/dashboard";
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return "/dashboard";
  }
}
