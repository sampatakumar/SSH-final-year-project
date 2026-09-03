/**
 * EduTube Educational Ranking Service
 * Deterministic, evidence-based educational scoring engine.
 * Prioritizes high-signal coding courses, tutorials, and deep-dives without altering original video metadata.
 */

const EDUCATIONAL_KEYWORDS = [
  { term: "course", weight: 15 },
  { term: "full course", weight: 25 },
  { term: "complete course", weight: 25 },
  { term: "tutorial", weight: 20 },
  { term: "crash course", weight: 20 },
  { term: "beginner", weight: 12 },
  { term: "beginners", weight: 12 },
  { term: "advanced", weight: 15 },
  { term: "project", weight: 14 },
  { term: "build", weight: 12 },
  { term: "hands-on", weight: 18 },
  { term: "roadmap", weight: 16 },
  { term: "learn", weight: 10 },
  { term: "masterclass", weight: 15 },
  { term: "guide", weight: 12 },
  { term: "deep dive", weight: 15 },
  { term: "explained", weight: 10 },
  { term: "interview", weight: 14 },
  { term: "practice", weight: 12 },
  { term: "architecture", weight: 14 },
  { term: "fundamentals", weight: 12 },
  { term: "from scratch", weight: 18 },
  { term: "step by step", weight: 15 },
];

const NON_EDUCATIONAL_PENALTIES = [
  { term: "music video", weight: -60 },
  { term: "official audio", weight: -60 },
  { term: "song", weight: -50 },
  { term: "trailer", weight: -40 },
  { term: "teaser", weight: -40 },
  { term: "gameplay", weight: -35 },
  { term: "walkthrough gameplay", weight: -40 },
  { term: "prank", weight: -60 },
  { term: "vlog", weight: -30 },
  { term: "reaction", weight: -30 },
  { term: "funny moments", weight: -40 },
  { term: "tiktok", weight: -40 },
  { term: "shorts", weight: -20 },
];

const PROVEN_EDUCATIONAL_CHANNELS = [
  "freecodecamp",
  "traversy media",
  "programming with mosh",
  "fireship",
  "academind",
  "the net ninja",
  "web dev simplified",
  "kevin powell",
  "clever programmer",
  "dave gray",
  "hitesh choudhary",
  "chaiaurcode",
  "codevolution",
  "edureka",
  "simplilearn",
  "cs50",
  "mit opencourseware",
  "stanford online",
  "freecodecamp.org",
  "corey schafer",
  "amigoscode",
  "pedrotech",
  "jack herrington",
  "hussein nasser",
  "bytebytego",
  "neetcode",
];

/**
 * Calculate educational relevance score for a single video.
 * Returns a normalized score between 0 and 100 with transparent signal breakdown.
 */
export const scoreEducationalVideo = (video, queryContext = {}) => {
  if (!video) return { score: 0, signals: [] };

  let score = 50; // Base baseline score
  const signals = [];

  const title = (video.title || "").toLowerCase();
  const description = (video.description || "").toLowerCase();
  const channelTitle = (video.channelTitle || video.channel || "").toLowerCase();
  const fullText = `${title} ${description}`;

  const queryTerms = (queryContext.q || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  // 1. Exact query match in title
  const exactQuery = (queryContext.q || "").toLowerCase().trim();
  if (exactQuery && title.includes(exactQuery)) {
    score += 20;
    signals.push("Exact query match in title (+20)");
  } else if (queryTerms.length > 0) {
    const matchedTerms = queryTerms.filter((term) => title.includes(term));
    if (matchedTerms.length === queryTerms.length) {
      score += 15;
      signals.push("All query terms in title (+15)");
    } else if (matchedTerms.length > 0) {
      score += 8;
      signals.push("Partial query match in title (+8)");
    }
  }

  // 2. Educational Keywords in Title & Description
  for (const { term, weight } of EDUCATIONAL_KEYWORDS) {
    if (title.includes(term)) {
      score += weight;
      signals.push(`Title educational keyword: "${term}" (+${weight})`);
    } else if (description.includes(term)) {
      score += Math.round(weight * 0.4);
      signals.push(`Description educational keyword: "${term}" (+${Math.round(weight * 0.4)})`);
    }
  }

  // 3. Educational Channel Recognition
  for (const channel of PROVEN_EDUCATIONAL_CHANNELS) {
    if (channelTitle.includes(channel)) {
      score += 15;
      signals.push(`Recognized educational channel: "${channelTitle}" (+15)`);
      break;
    }
  }

  // 4. Non-Educational / Entertainment Penalties
  for (const { term, weight } of NON_EDUCATIONAL_PENALTIES) {
    if (title.includes(term) || description.includes(term)) {
      score += weight;
      signals.push(`Non-educational penalty: "${term}" (${weight})`);
    }
  }

  // 5. Embeddability Requirement Check
  if (video.embeddable === false) {
    score -= 50;
    signals.push("Non-embeddable video penalty (-50)");
  }

  // 6. Level Filtering Signals
  if (queryContext.level) {
    const targetLevel = queryContext.level.toLowerCase();
    if (targetLevel === "beginner" && (fullText.includes("beginner") || fullText.includes("from scratch") || fullText.includes("basics"))) {
      score += 15;
      signals.push("Beginner level relevance boost (+15)");
    } else if (targetLevel === "advanced" && (fullText.includes("advanced") || fullText.includes("deep dive") || fullText.includes("architecture"))) {
      score += 15;
      signals.push("Advanced level relevance boost (+15)");
    }
  }

  // Clamp final score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));

  return {
    score: normalizedScore,
    signals,
  };
};

/**
 * Rank an array of video items according to their educational relevance score.
 * Preserves all original properties, attaching educationalScore and ranking metadata.
 */
export const rankEducationalVideos = (videos, queryContext = {}) => {
  if (!Array.isArray(videos)) return [];

  const scoredVideos = videos.map((video) => {
    const { score, signals } = scoreEducationalVideo(video, queryContext);
    return {
      ...video,
      educationalScore: score,
      educationalSignals: signals,
    };
  });

  // Sort descending by educational score
  return scoredVideos.sort((a, b) => (b.educationalScore || 0) - (a.educationalScore || 0));
};
