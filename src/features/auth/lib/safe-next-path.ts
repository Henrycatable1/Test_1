const fallbackNextPath = "/dashboard";

export function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? "";

  // ### auth redirects must stay on same-origin app paths
  if (!normalizedInput.startsWith("/") || normalizedInput.startsWith("//")) {
    return fallbackNextPath;
  }

  return normalizedInput;
}
