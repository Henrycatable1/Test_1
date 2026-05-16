const internalRedirectBase = "https://catable.internal";

export function toSafeNextPath(input: string | null | undefined) {
  const normalizedInput = input?.trim() ?? "";

  if (!normalizedInput.startsWith("/")) {
    return "/dashboard";
  }

  try {
    const resolvedUrl = new URL(normalizedInput, internalRedirectBase);

    // ### only same-origin paths are allowed so auth callbacks cannot become phishing redirects
    if (resolvedUrl.origin !== internalRedirectBase) {
      return "/dashboard";
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return "/dashboard";
  }
}

export function getCanonicalAppOrigin(requestUrl: URL) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredAppUrl) {
    try {
      return new URL(configuredAppUrl).origin;
    } catch {
      // ### fall through to the request URL when local preview configuration is malformed
    }
  }

  return requestUrl.origin;
}
