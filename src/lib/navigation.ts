const safeNextBaseUrl = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return "/dashboard";
  }

  try {
    const parsedUrl = new URL(normalizedInput, safeNextBaseUrl);

    // ### keep auth redirects on-site even when next is protocol-relative or backslash-prefixed
    if (parsedUrl.origin !== safeNextBaseUrl) {
      return "/dashboard";
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return "/dashboard";
  }
}
