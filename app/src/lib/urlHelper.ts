export function resolvePluginUrl(baseUrl: string, urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  if (!baseUrl) return urlOrPath;
  try {
    return new URL(urlOrPath, baseUrl).href;
  } catch (e) {
    // Fallback if URL parsing fails
    return urlOrPath;
  }
}
