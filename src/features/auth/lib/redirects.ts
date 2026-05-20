const safeRedirectBase = "https://catable.local";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  if (!normalizedInput.startsWith("/")) {
    return "/dashboard";
  }

  try {
    const parsedUrl = new URL(normalizedInput, safeRedirectBase);

    // ### keep post-auth redirects inside the app even when next is protocol-relative
    if (parsedUrl.origin !== safeRedirectBase) {
      return "/dashboard";
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return "/dashboard";
  }
}
