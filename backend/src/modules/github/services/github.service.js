import axios from "axios";
import { calculateEngineeringQuality } from "../analyzers/quality.analyzer.js";
import { analyzePortfolioComplexity } from "../analyzers/complexity.analyzer.js";

// In-memory cache for fast repeated queries (10-minute TTL)
const memoryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const getHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    "User-Agent": "SmartSkillHub-GitHub-Analyzer",
    Accept: "application/vnd.github.v3+json",
  };
  if (token && token.trim() !== "") {
    headers.Authorization = `token ${token}`;
  }
  return headers;
};

export async function fetchGitHubProfileData(rawUsername) {
  const username = String(rawUsername || "").trim().replace(/^@/, "");

  if (!username) {
    throw new Error("GitHub username is required.");
  }

  const cacheKey = `gh_profile_${username.toLowerCase()}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const headers = getHeaders();

  try {
    // 1. Fetch User Info
    const userRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      timeout: 10000
    });
    const user = userRes.data;

    // 2. Fetch Repositories (up to 100 top repos sorted by updated)
    const reposRes = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { headers, timeout: 10000 }
    );
    const repos = reposRes.data || [];

    // 3. Fetch Recent Public Events
    let recentEvents = [];
    try {
      const eventsRes = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`,
        { headers, timeout: 10000 }
      );
      recentEvents = eventsRes.data || [];
    } catch {
      recentEvents = [];
    }

    // 4. Calculate Aggregate Stats
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let totalIssues = 0;
    let totalSizeKB = 0;
    let archivedCount = 0;
    let forkedCount = 0;

    const languageMap = {};
    let totalLanguageBytes = 0;

    const normalizedRepos = repos.map((repo) => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      totalWatchers += repo.watchers_count || 0;
      totalIssues += repo.open_issues_count || 0;
      totalSizeKB += repo.size || 0;

      if (repo.archived) archivedCount++;
      if (repo.fork) forkedCount++;

      if (repo.language) {
        if (!languageMap[repo.language]) {
          languageMap[repo.language] = { size: 0, repoCount: 0 };
        }
        const langBytes = repo.size * 1024 || 1000;
        languageMap[repo.language].size += langBytes;
        languageMap[repo.language].repoCount += 1;
        totalLanguageBytes += langBytes;
      }

      return {
        name: repo.name,
        description: repo.description || "",
        htmlUrl: repo.html_url,
        language: repo.language || "",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        watchers: repo.watchers_count || 0,
        openIssues: repo.open_issues_count || 0,
        sizeKB: repo.size || 0,
        archived: Boolean(repo.archived),
        fork: Boolean(repo.fork),
        updatedAt: repo.updated_at || ""
      };
    });

    const languages = {};
    let maxBytes = -1;
    let dominantLanguage = "JavaScript";

    Object.entries(languageMap).forEach(([lang, data]) => {
      const percentage = totalLanguageBytes > 0 ? Number(((data.size / totalLanguageBytes) * 100).toFixed(1)) : 0;
      languages[lang] = {
        size: data.size,
        percentage,
        repoCount: data.repoCount,
      };

      if (data.size > maxBytes) {
        maxBytes = data.size;
        dominantLanguage = lang;
      }
    });

    const aggregateStats = {
      totalStars,
      totalForks,
      totalWatchers,
      totalIssues,
      totalSizeKB,
      archivedCount,
      forkedCount,
    };

    const profile = {
      name: user.name || user.login,
      bio: user.bio || "",
      avatarUrl: user.avatar_url,
      company: user.company || "",
      location: user.location || "",
      blog: user.blog || "",
      publicRepos: user.public_repos || 0,
      followers: user.followers || 0,
      following: user.following || 0,
      createdAt: user.created_at || ""
    };

    const engineeringQuality = calculateEngineeringQuality({
      profile,
      repositories: normalizedRepos,
      aggregateStats
    });

    const projectComplexity = analyzePortfolioComplexity(normalizedRepos);

    const result = {
      username: user.login,
      profile,
      repositories: normalizedRepos,
      languages,
      dominantLanguage,
      aggregateStats,
      engineeringQuality,
      projectComplexity,
      recentEvents,
      analyzedAt: new Date().toISOString()
    };

    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`GitHub user "${username}" was not found.`);
    }
    if (error.response && error.response.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please configure GITHUB_TOKEN in backend environment.");
    }
    throw new Error(error.message || "Failed to fetch GitHub profile data");
  }
}
