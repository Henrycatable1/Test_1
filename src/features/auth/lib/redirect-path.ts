const defaultRedirectPath = "/dashboard";
const safeRedirectOrigin = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep post-auth redirects inside this app even when attackers pass protocol-relative URLs
  if (!normalizedInput.startsWith("/") || normalizedInput.startsWith("//") || normalizedInput.includes("\\")) {
    return defaultRedirectPath;
  }

  try {
    const parsedUrl = new URL(normalizedInput, safeRedirectOrigin);
    const nextPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (parsedUrl.origin !== safeRedirectOrigin || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
      return defaultRedirectPath;
    }

    return nextPath;
  } catch {
    return defaultRedirectPath;
  }
}
