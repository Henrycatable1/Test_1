export function toSafeRedirectPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  // ### keep post-auth redirects inside this app even when `next` is user-controlled
  if (
    !normalizedInput
    || !normalizedInput.startsWith("/")
    || normalizedInput.startsWith("//")
    || normalizedInput.includes("\\")
  ) {
    return "/dashboard";
  }

  return normalizedInput;
}
