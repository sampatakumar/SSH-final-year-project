/**
 * Notification Destination Sanitizer & Validator
 *
 * Ensures notification destinations can NEVER be used for open redirects,
 * XSS payload delivery, or arbitrary external navigation.
 * Only approved internal application routes are permitted.
 */

const APPROVED_INTERNAL_PREFIXES = [
  "/dashboard",
  "/dashboard/gaps",
  "/dashboard/edutube",
  "/dashboard/roadmap",
  "/dashboard/coding",
  "/dashboard/skills",
  "/dashboard/profile",
  "/dashboard/settings",
  "/dashboard/projects",
  "/dashboard/portfolios",
  "/dashboard/resumes",
  "/dashboard/github",
  "/dashboard/mentor",
  "/dashboard/analytics",
  "/dashboard/admin",
];

const DEFAULT_DESTINATION = "/dashboard";

/**
 * Validates and sanitizes a notification destination string.
 *
 * @param {string} destination - Input destination URL/path
 * @returns {string} Safe internal path, or fallback to "/dashboard"
 */
export function sanitizeNotificationDestination(destination) {
  if (!destination || typeof destination !== "string") {
    return DEFAULT_DESTINATION;
  }

  const trimmed = destination.trim();

  // Reject anything containing dangerous protocols, schemes, or character sequences
  if (
    /^(?:[a-z+]+:|\/\/)/i.test(trimmed) || // http:, https:, javascript:, data:, //
    trimmed.includes("<") ||
    trimmed.includes(">") ||
    trimmed.includes('"') ||
    trimmed.includes("'") ||
    trimmed.toLowerCase().includes("javascript:") ||
    trimmed.toLowerCase().includes("data:") ||
    trimmed.toLowerCase().includes("vbscript:")
  ) {
    return DEFAULT_DESTINATION;
  }

  // Must start with "/" and have no double slashes
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_DESTINATION;
  }

  // Strip query/fragment to inspect base route prefix
  const [basePath] = trimmed.split(/[?#]/);

  const isApproved = APPROVED_INTERNAL_PREFIXES.some(
    (prefix) => basePath === prefix || basePath.startsWith(`${prefix}/`)
  );

  return isApproved ? trimmed : DEFAULT_DESTINATION;
}

/**
 * Strips HTML tags and excessive whitespace from plain-text notification content.
 *
 * @param {string} text - Raw input string
 * @param {number} maxLength - Maximum allowable length
 * @returns {string} Sanitized plain-text
 */
export function sanitizeNotificationText(text, maxLength = 500) {
  if (!text || typeof text !== "string") return "";
  const cleaned = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLength);
}
