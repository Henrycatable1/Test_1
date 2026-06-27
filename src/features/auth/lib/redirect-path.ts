const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";

export function toSafeAuthRedirectPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  // ### auth callbacks must only redirect to same-origin app paths
  if (
    !normalizedInput ||
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.includes("\\")
  ) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return normalizedInput;
}
