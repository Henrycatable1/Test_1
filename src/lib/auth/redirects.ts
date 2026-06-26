const defaultSignedInPath = "/dashboard";

export function toSafeSignedInPath(input: string | null | undefined) {
  const normalizedInput = input?.trim();

  // ### keep auth callbacks on-origin; protocol-relative and backslash paths can escape the app
  if (
    !normalizedInput ||
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.includes("\\")
  ) {
    return defaultSignedInPath;
  }

  try {
    const parsedPath = new URL(normalizedInput, "https://catable.local");

    if (parsedPath.origin !== "https://catable.local") {
      return defaultSignedInPath;
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return defaultSignedInPath;
  }
}
