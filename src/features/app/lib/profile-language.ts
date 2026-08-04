// ### keep dashboard/profile copy aligned with the profile language while alerts store en + zh-TW variants
export function resolveProfileLanguageCode(
  languageCode: string | null | undefined,
): "en" | "zh-TW" {
  return languageCode === "en" || languageCode === "zh-TW" ? languageCode : "zh-TW";
}
