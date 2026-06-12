const fallbackNextPath = "/dashboard";
const safeNextPathBase = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep post-auth navigation inside the app, including when URL parsing normalizes protocol-relative paths
  if (
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.includes("\\")
  ) {
    return fallbackNextPath;
  }

  try {
    const parsedPath = new URL(normalizedInput, safeNextPathBase);

    if (parsedPath.origin !== safeNextPathBase) {
      return fallbackNextPath;
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return fallbackNextPath;
  }
}
