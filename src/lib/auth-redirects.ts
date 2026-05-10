const localHostnames = new Set(["localhost", "127.0.0.1"]);

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? null;
}

function toHttpOrigin(value: string | null | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    const url = new URL(normalizedValue);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getForwardedOrigin(host: string | null | undefined, protocol: string | null | undefined) {
  const forwardedHost = firstHeaderValue(host);
  const forwardedProtocol = firstHeaderValue(protocol) ?? "https";

  if (!forwardedHost) {
    return null;
  }

  return toHttpOrigin(`${forwardedProtocol}://${forwardedHost}`);
}

function isLocalOrigin(origin: string) {
  return localHostnames.has(new URL(origin).hostname);
}

function areLocalDevOrigins(leftOrigin: string, rightOrigin: string) {
  return isLocalOrigin(leftOrigin) && isLocalOrigin(rightOrigin);
}

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  // ### keep post-auth redirects on-site by rejecting absolute and protocol-relative paths
  if (
    !normalizedInput
    || !normalizedInput.startsWith("/")
    || normalizedInput.startsWith("//")
    || normalizedInput.startsWith("/\\")
  ) {
    return "/dashboard";
  }

  return normalizedInput;
}

type ResolveAuthCallbackOriginInput = {
  appUrl?: string | null;
  forwardedHost?: string | null;
  forwardedProtocol?: string | null;
  host?: string | null;
  requestUrl: URL;
};

export function resolveAuthCallbackOrigin({
  appUrl,
  forwardedHost,
  forwardedProtocol,
  host,
  requestUrl,
}: ResolveAuthCallbackOriginInput) {
  const configuredOrigin = toHttpOrigin(appUrl);
  const requestOrigin = requestUrl.origin;
  const headerOrigin = getForwardedOrigin(forwardedHost ?? host, forwardedProtocol);

  if (configuredOrigin) {
    // ### preserve active localhost aliases without trusting arbitrary forwarded production hosts
    if (headerOrigin && areLocalDevOrigins(configuredOrigin, headerOrigin)) {
      return headerOrigin;
    }

    if (areLocalDevOrigins(configuredOrigin, requestOrigin)) {
      return requestOrigin;
    }

    return configuredOrigin;
  }

  if (headerOrigin && isLocalOrigin(headerOrigin)) {
    return headerOrigin;
  }

  return requestOrigin;
}
