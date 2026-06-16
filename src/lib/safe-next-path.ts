const fallbackNextPath = "/dashboard";
const safePathBase = "https://catable.local";

export function toSafeNextPath(input: string | null | undefined) {
  const normalizedInput = input?.trim();

  if (!normalizedInput || !normalizedInput.startsWith("/") || normalizedInput.startsWith("//")) {
    return fallbackNextPath;
  }

  try {
    const parsedUrl = new URL(normalizedInput, safePathBase);

    // ### keep auth callbacks on-site even when next contains protocol-relative or backslash URL tricks
    if (parsedUrl.origin !== safePathBase) {
      return fallbackNextPath;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallbackNextPath;
  }
}
