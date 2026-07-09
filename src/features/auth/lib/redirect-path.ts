const fallbackPath = "/dashboard";
const sameOriginBase = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep post-auth redirects on this app even when next is user-controlled
  if (
    !normalizedInput ||
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.includes("\\")
  ) {
    return fallbackPath;
  }

  try {
    const parsedPath = new URL(normalizedInput, sameOriginBase);

    if (parsedPath.origin !== sameOriginBase) {
      return fallbackPath;
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return fallbackPath;
  }
}
