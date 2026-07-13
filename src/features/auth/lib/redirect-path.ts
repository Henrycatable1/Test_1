const defaultAuthenticatedPath = "/dashboard";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### keep post-auth redirects inside the app even when `next` is URL-encoded
  if (!normalizedInput.startsWith("/")) {
    return defaultAuthenticatedPath;
  }

  try {
    const decodedInput = decodeURIComponent(normalizedInput);

    if (decodedInput.startsWith("//") || decodedInput.includes("\\") || /[\u0000-\u001f\u007f]/.test(decodedInput)) {
      return defaultAuthenticatedPath;
    }
  } catch {
    return defaultAuthenticatedPath;
  }

  if (normalizedInput.startsWith("//") || normalizedInput.includes("\\") || /[\u0000-\u001f\u007f]/.test(normalizedInput)) {
    return defaultAuthenticatedPath;
  }

  return normalizedInput;
}
