const defaultPostAuthPath = "/dashboard";

export function toSafePostAuthPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep auth redirects inside this app, including protocol-relative URLs such as //evil.example
  if (
    !normalizedInput.startsWith("/") ||
    normalizedInput.startsWith("//") ||
    normalizedInput.startsWith("/\\")
  ) {
    return defaultPostAuthPath;
  }

  return normalizedInput;
}
