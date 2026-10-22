/**
 * Validate and sanitize returnTo redirect paths to prevent open redirects (GHSA-wrjc-x8rr-h8h6 / CVE-2025-68470).
 * Rejects protocol-relative URLs, backslashes, schemes, and malformed characters.
 */
export function sanitizeReturnTo(rawReturnTo: string | null | undefined, defaultPath: string = "/dashboard"): string {
  if (!rawReturnTo || typeof rawReturnTo !== "string") {
    return defaultPath;
  }

  const trimmed = rawReturnTo.trim();

  // Must begin with a single slash, must not begin with "//" or "/\" or "\"
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\")) {
    return defaultPath;
  }

  // Must not contain backslashes, URL scheme separators (e.g. "http:", "javascript:"), or percent-encoded backslashes
  if (
    trimmed.includes("\\") ||
    trimmed.includes(":") ||
    trimmed.toLowerCase().includes("%5c") ||
    trimmed.toLowerCase().includes("%2f%2f")
  ) {
    return defaultPath;
  }

  return trimmed;
}
