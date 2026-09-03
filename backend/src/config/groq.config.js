import Groq from "groq-sdk";
import { env } from "./env.js";

// Safe Groq Configuration & Model Discovery Layer
let cachedAvailableModels = null;
let lastDiscoveryTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

export const GROQ_MODEL_PRIMARY = "openai/gpt-oss-120b";
export const GROQ_MODEL_LIGHTWEIGHT = "openai/gpt-oss-20b";

// Prioritized production fallback hierarchy centered around GPT-OSS-120B
export const GROQ_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "groq/compound",
];

export const TASK_TIERS = {
  HIGH_REASONING: "high",
  LIGHTWEIGHT: "lightweight",
};

/**
 * Standardized AI Error Categories
 */
export const AI_ERROR_CATEGORIES = {
  AI_NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  AI_AUTH_ERROR: "AI_AUTH_ERROR",
  AI_MODEL_NOT_FOUND: "AI_MODEL_NOT_FOUND",
  AI_RATE_LIMIT: "AI_RATE_LIMIT",
  AI_INVALID_REQUEST: "AI_INVALID_REQUEST",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_NETWORK_ERROR: "AI_NETWORK_ERROR",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  AI_INVALID_OUTPUT: "AI_INVALID_OUTPUT",
};

/**
 * Classify a Groq error into structured diagnostic information.
 */
export function classifyGroqError(error) {
  const message = error?.message || String(error);
  const status = error?.status || error?.statusCode || 500;
  const code = error?.code || error?.error?.code || "";

  if (status === 401 || /invalid_api_key|unauthorized/i.test(message)) {
    return {
      type: "AUTH_ERROR",
      category: AI_ERROR_CATEGORIES.AI_AUTH_ERROR,
      statusCode: 401,
      message: "Invalid or missing Groq API key.",
      userMessage: "AI service is temporarily unavailable. Please verify API configuration.",
      details: message,
    };
  }

  if (status === 403 || /permission_denied/i.test(message)) {
    return {
      type: "PERMISSION_ERROR",
      category: AI_ERROR_CATEGORIES.AI_PROVIDER_ERROR,
      statusCode: 403,
      message: "Groq model or project permission denied.",
      userMessage: "AI service access permission denied.",
      details: message,
    };
  }

  if (status === 404 || code === "model_not_found" || /model_not_found|does not exist/i.test(message)) {
    return {
      type: "MODEL_NOT_FOUND",
      category: AI_ERROR_CATEGORIES.AI_MODEL_NOT_FOUND,
      statusCode: 404,
      message: "Requested model is unavailable or not accessible with this API key.",
      userMessage: "The configured AI model is unavailable. A compatible fallback model is being used.",
      details: message,
    };
  }

  if (status === 429 || /rate_limit/i.test(message)) {
    return {
      type: "RATE_LIMIT",
      category: AI_ERROR_CATEGORIES.AI_RATE_LIMIT,
      statusCode: 429,
      message: "Groq rate limit exceeded. Please wait a moment and retry.",
      userMessage: "AI service is currently busy. Please wait a moment and try again.",
      details: message,
    };
  }

  if (/timeout|aborted|ETIMEDOUT/i.test(message) || error?.name === "TimeoutError") {
    return {
      type: "TIMEOUT",
      category: AI_ERROR_CATEGORIES.AI_TIMEOUT,
      statusCode: 504,
      message: "Groq AI request timed out.",
      userMessage: "AI request timed out. Please try again.",
      details: message,
    };
  }

  if (status === 400 || /json_validate_failed|invalid_request/i.test(message)) {
    return {
      type: "INVALID_REQUEST",
      category: AI_ERROR_CATEGORIES.AI_INVALID_REQUEST,
      statusCode: 400,
      message: "Invalid AI request payload or token limit reached.",
      userMessage: "AI request could not be processed. Please refine the input.",
      details: message,
    };
  }

  if (status >= 500 || /internal_server_error|bad gateway/i.test(message)) {
    return {
      type: "SERVER_ERROR",
      category: AI_ERROR_CATEGORIES.AI_PROVIDER_ERROR,
      statusCode: 502,
      message: "Groq upstream server error. Falling back to grounded heuristics.",
      userMessage: "AI service is temporarily unavailable. Please try again.",
      details: message,
    };
  }

  return {
    type: "NETWORK_ERROR",
    category: AI_ERROR_CATEGORIES.AI_NETWORK_ERROR,
    statusCode: 503,
    message: "Could not reach Groq AI API.",
    userMessage: "Could not connect to AI service. Please check your network connection.",
    details: message,
  };
}

let testAvailableModels = null;

/**
 * Override available models for tests without network calls.
 */
export function setTestAvailableModels(models) {
  testAvailableModels = models;
}

/**
 * Get discovery cache status for diagnostics.
 */
export function getModelCacheInfo() {
  const now = Date.now();
  return {
    cached: Boolean(cachedAvailableModels),
    modelCount: cachedAvailableModels ? cachedAvailableModels.length : 0,
    cacheAgeMs: lastDiscoveryTimestamp > 0 ? now - lastDiscoveryTimestamp : null,
    ttlMs: CACHE_TTL_MS,
  };
}

/**
 * Fetch available model IDs from Groq /models endpoint using the current API key.
 */
export async function discoverAvailableModels({ forceRefresh = false } = {}) {
  if (testAvailableModels) {
    return testAvailableModels;
  }

  const now = Date.now();
  if (!forceRefresh && cachedAvailableModels && now - lastDiscoveryTimestamp < CACHE_TTL_MS) {
    return cachedAvailableModels;
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.warn("[groq] GROQ_API_KEY is missing or empty.");
    return [];
  }

  try {
    const baseUrl = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.warn(`[groq] Model discovery returned status ${res.status}`);
      return cachedAvailableModels || [];
    }

    const data = await res.json();
    if (Array.isArray(data?.data)) {
      const modelIds = data.data.map((m) => m.id);
      cachedAvailableModels = modelIds;
      lastDiscoveryTimestamp = now;
      console.log(`[groq] Discovered ${modelIds.length} available models.`);
      return modelIds;
    }
  } catch (err) {
    console.warn("[groq] Model discovery request failed:", err.message);
  }

  return cachedAvailableModels || [];
}

/**
 * Clear cached available models to trigger fresh discovery on next request.
 */
export function clearModelCache() {
  cachedAvailableModels = null;
  lastDiscoveryTimestamp = 0;
}

/**
 * Determine the optimal, verified Groq model to use.
 * Implements task-aware model selection:
 * - High-reasoning tasks -> openai/gpt-oss-120b
 * - Lightweight tasks -> openai/gpt-oss-20b (fallback to 120b if unavailable)
 */
export async function getGroqModel({
  taskTier = TASK_TIERS.HIGH_REASONING,
  forceRefresh = false,
  excludeModels = [],
} = {}) {
  const configuredModel = env.GROQ_MODEL || GRO_PRIMARY_DEFAULT;
  const availableModels = await discoverAvailableModels({ forceRefresh });

  // 1. Task-aware lightweight selection if explicitly requested
  if (taskTier === TASK_TIERS.LIGHTWEIGHT) {
    if (
      availableModels.includes(GROQ_MODEL_LIGHTWEIGHT) &&
      !excludeModels.includes(GROQ_MODEL_LIGHTWEIGHT)
    ) {
      return GROQ_MODEL_LIGHTWEIGHT;
    }
  }

  // 2. High-reasoning / Default selection:
  if (availableModels.length > 0) {
    // 2a. If configured model is verified available and not excluded:
    if (availableModels.includes(configuredModel) && !excludeModels.includes(configuredModel)) {
      return configuredModel;
    }

    // 2b. Iterate through verified fallback hierarchy:
    for (const candidate of GROQ_MODEL_FALLBACKS) {
      if (availableModels.includes(candidate) && !excludeModels.includes(candidate)) {
        return candidate;
      }
    }

    // 2c. Pick first non-excluded general chat model available:
    const filtered = availableModels.filter(
      (m) =>
        !excludeModels.includes(m) &&
        !m.includes("whisper") &&
        !m.includes("guard")
    );

    if (filtered.length > 0) {
      return filtered[0];
    }
  }

  // 3. Safe fallback if offline or discovery unavailable
  return GROQ_MODEL_PRIMARY;
}

const GRO_PRIMARY_DEFAULT = "openai/gpt-oss-120b";

let testGroqClient = null;

/**
 * Set custom groq client instance for testing.
 */
export function setGroqClientForTest(client) {
  testGroqClient = client;
}

/**
 * Set cached models for unit testing.
 */
export function setCachedAvailableModelsForTest(models) {
  cachedAvailableModels = models;
  lastDiscoveryTimestamp = Date.now();
}

/**
 * Create or get an initialized Groq client instance.
 */
export function getGroqClient() {
  if (testGroqClient) {
    return testGroqClient;
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  return new Groq({
    apiKey,
    timeout: 15000,
  });
}
