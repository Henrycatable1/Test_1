const SAFE_REDIRECT_BASE = "https://safe-redirect.invalid";
const DEFAULT_NEXT_PATH = "/dashboard";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim();

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const parsedPath = new URL(normalizedInput, SAFE_REDIRECT_BASE);

    // ### only preserve same-origin paths so auth callbacks cannot become open redirects
    if (parsedPath.origin !== SAFE_REDIRECT_BASE) {
      return DEFAULT_NEXT_PATH;
    }

    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}
