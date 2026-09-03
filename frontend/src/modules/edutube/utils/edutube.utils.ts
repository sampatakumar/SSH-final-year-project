/**
 * EduTube Formatting & Utility Helpers
 */

export const LANGUAGE_OPTIONS: Array<{ code: string; label: string; flag?: string }> = [
  { code: "all", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
];

export const LEVEL_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "all", label: "All Levels" },
  { code: "beginner", label: "Beginner / Basics" },
  { code: "intermediate", label: "Intermediate" },
  { code: "advanced", label: "Advanced / Deep-Dive" },
];

export const DURATION_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "all", label: "Any Duration" },
  { code: "short", label: "Short (< 4 mins)" },
  { code: "medium", label: "Medium (4 - 20 mins)" },
  { code: "long", label: "Long / Full Course (> 20 mins)" },
];

export const SORT_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "relevance", label: "Most Relevant" },
  { code: "viewcount", label: "Most Popular" },
  { code: "rating", label: "Top Rated" },
  { code: "date", label: "Latest" },
];

export const POPULAR_TECHNOLOGIES = [
  { name: "JavaScript", query: "JavaScript full course tutorial", tag: "Frontend & Backend" },
  { name: "TypeScript", query: "TypeScript crash course tutorial", tag: "Type Safety" },
  { name: "React", query: "React.js complete tutorial project", tag: "UI Engineering" },
  { name: "Node.js", query: "Node.js Express backend tutorial", tag: "Backend APIs" },
  { name: "Python", query: "Python full course for beginners", tag: "General & AI" },
  { name: "Java", query: "Java programming full course", tag: "Enterprise" },
  { name: "C++", query: "C++ data structures and algorithms", tag: "Core CS" },
  { name: "Docker", query: "Docker containerization crash course", tag: "DevOps" },
  { name: "Git & GitHub", query: "Git and GitHub complete tutorial", tag: "Version Control" },
  { name: "SQL & Databases", query: "PostgreSQL SQL database tutorial", tag: "Data Storage" },
  { name: "MongoDB", query: "MongoDB tutorial for beginners", tag: "NoSQL" },
  { name: "Next.js", query: "Next.js full stack course", tag: "Full Stack" },
];

export function formatViews(views?: number): string {
  if (!views && views !== 0) return "";
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${views} views`;
}

export function formatPublishedDate(publishedAt?: string): string {
  if (!publishedAt) return "";
  try {
    const published = new Date(publishedAt).getTime();
    if (isNaN(published)) return "";
    const diffSeconds = Math.floor((Date.now() - published) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  } catch {
    return "";
  }
}

export function getBestThumbnailUrl(thumbnails?: {
  default?: string;
  medium?: string;
  high?: string;
  standard?: string;
  maxres?: string;
}): string {
  if (!thumbnails) return "";
  return (
    thumbnails.high ||
    thumbnails.medium ||
    thumbnails.standard ||
    thumbnails.default ||
    thumbnails.maxres ||
    ""
  );
}
