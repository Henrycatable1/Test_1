const defaultAuthenticatedPath = "/dashboard";

export function toSafeNextPath(input: string | null | undefined) {
  const normalizedInput = input?.trim();

  if (!normalizedInput) {
    return defaultAuthenticatedPath;
  }

  // ### auth redirects must stay path-relative so protocol-relative URLs cannot leave the app
  if (!normalizedInput.startsWith("/") || normalizedInput.startsWith("//") || normalizedInput.startsWith("/\\")) {
    return defaultAuthenticatedPath;
  }

  return normalizedInput;
}
