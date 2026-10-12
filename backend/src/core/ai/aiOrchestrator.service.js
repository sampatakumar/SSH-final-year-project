/**
 * ============================================================================
 * SMART SKILL HUB — SHARED AI INTELLIGENCE ORCHESTRATION LAYER (v2.1.0)
 * ============================================================================
 *
 * Enterprise-grade, resilient AI orchestration engine:
 * 1. Multi-provider adapter pattern (Groq LLM primary, Deterministic Heuristics fallback).
 * 2. Task-specific system instructions, context assembly, and sanitization.
 * 3. Strict structured output validation and automatic schema repair via Zod.
 * 4. Bounded retries with exponential backoff, circuit breaking, and strict timeouts.
 * 5. Prompt versioning, execution telemetry, error classification, and token accounting.
 * 6. Non-negotiable separation between language-model reasoning and deterministic math.
 * ============================================================================
 */

import crypto from "crypto";
import { env } from "../../config/env.js";
import {
  getGroqClient,
  getGroqModel,
  classifyGroqError,
  TASK_TIERS,
  AI_ERROR_CATEGORIES,
} from "../../config/groq.config.js";
import { incrementDailyCounter } from "../database/models/analytics.models.js";
import { validateAndNormalizeAIOutput } from "./aiContracts.js";

export const AI_ORCHESTRATOR_VERSION = "2.1.0";

/**
 * Standardized AI Task Registry with versioning, schemas, and resource budgets
 */
export const TASK_REGISTRY = {
  PROFESSIONAL_SUMMARY: {
    taskName: "PROFESSIONAL_SUMMARY",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.25,
    maxTokens: 600,
    timeoutMs: 15000,
    maxRetries: 2,
  },
  RESUME_BULLET_ENHANCEMENT: {
    taskName: "RESUME_BULLET_ENHANCEMENT",
    version: "2.1.0",
    taskTier: TASK_TIERS.LIGHTWEIGHT,
    temperature: 0.2,
    maxTokens: 400,
    timeoutMs: 12000,
    maxRetries: 2,
  },
  ATS_ANALYSIS: {
    taskName: "ATS_ANALYSIS",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 1200,
    timeoutMs: 20000,
    maxRetries: 2,
  },
  GITHUB_PROFESSIONAL_REVIEW: {
    taskName: "GITHUB_PROFESSIONAL_REVIEW",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.25,
    maxTokens: 2000,
    timeoutMs: 25000,
    maxRetries: 2,
  },
  CAREER_MENTOR_QNA: {
    taskName: "CAREER_MENTOR_QNA",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.3,
    maxTokens: 1500,
    timeoutMs: 20000,
    maxRetries: 2,
  },
  CODING_EXPLANATION: {
    taskName: "CODING_EXPLANATION",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 1200,
    timeoutMs: 18000,
    maxRetries: 2,
  },
  ACADEMIC_SYLLABUS_EXPLANATION: {
    taskName: "ACADEMIC_SYLLABUS_EXPLANATION",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.25,
    maxTokens: 1400,
    timeoutMs: 20000,
    maxRetries: 2,
  },
  ADAPTIVE_QUIZ_GENERATION: {
    taskName: "ADAPTIVE_QUIZ_GENERATION",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.3,
    maxTokens: 1800,
    timeoutMs: 22000,
    maxRetries: 2,
  },
  LEARNING_ROADMAP: {
    taskName: "LEARNING_ROADMAP",
    version: "2.1.0",
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 2000,
    timeoutMs: 25000,
    maxRetries: 2,
  },
};

/**
 * Clean & sanitize untrusted context to prevent prompt injection and system override.
 */
export function sanitizeContextString(input = "", maxLength = 10000) {
  if (typeof input !== "string") {
    input = JSON.stringify(input || "");
  }
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/(?:ignore all previous instructions|system:\s*you are now)/gi, "[REDACTED_INSTRUCTION]")
    .trim();
}

/**
 * Robust JSON Extractor & Sanitizer from LLM raw output.
 */
export function extractAndParseJSON(rawText = "") {
  if (typeof rawText !== "string") return null;

  let text = rawText.trim();

  // Strip markdown code fences if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Attempt direct JSON parse
  try {
    return JSON.parse(text);
  } catch (err1) {
    // Attempt greedy bracket matching
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err2) {
        // Fall through
      }
    }
    return null;
  }
}

/**
 * Execution Telemetry & Diagnostic Logger
 */
function recordTelemetry({
  traceId,
  taskName,
  version,
  provider,
  model,
  durationMs,
  status,
  retriesUsed = 0,
  fallbackUsed = false,
  errorCategory = null,
  promptTokens = 0,
  completionTokens = 0,
}) {
  const telemetryRecord = {
    timestamp: new Date().toISOString(),
    traceId,
    taskName,
    version,
    provider,
    model: model || "none",
    durationMs,
    status,
    retriesUsed,
    fallbackUsed,
    errorCategory,
    promptTokens,
    completionTokens,
  };

  incrementDailyCounter("groqRequests", 1);
  if (fallbackUsed) {
    incrementDailyCounter("aiFallbacksUsed", 1);
  }

  console.log(
    `[ai-orchestrator] trace=${traceId} task=${taskName}@${version} provider=${provider} status=${status} dur=${durationMs}ms fallback=${fallbackUsed}`
  );

  return telemetryRecord;
}

/**
 * Main AI Orchestrator Service
 */
export class AIOrchestratorService {
  /**
   * Execute an AI Task with end-to-end schema validation, bounded retries,
   * timeouts, telemetry, and deterministic fallbacks.
   *
   * @param {object} options
   * @param {string} options.taskName - Registered task key (e.g., "PROFESSIONAL_SUMMARY")
   * @param {string} options.systemInstruction - Specific system prompt
   * @param {string} options.userPrompt - User prompt or sanitized context
   * @param {import("zod").ZodSchema} [options.schema] - Target Zod schema for contract enforcement
   * @param {Function} [options.fallbackGenerator] - Deterministic fallback generator function
   * @param {object} [options.user] - Authenticated user context
   * @param {string} [options.modelOverride] - Optional model override
   * @returns {Promise<object>} { success, data, metadata }
   */
  async executeTask({
    taskName,
    systemInstruction,
    userPrompt,
    schema = null,
    fallbackGenerator = null,
    user = null,
    modelOverride = null,
  }) {
    const traceId = crypto.randomUUID().slice(0, 8);
    const startTime = Date.now();
    const config = TASK_REGISTRY[taskName] || {
      taskName: taskName || "CUSTOM_TASK",
      version: "1.0.0",
      taskTier: TASK_TIERS.HIGH_REASONING,
      temperature: 0.25,
      maxTokens: 1000,
      timeoutMs: 15000,
      maxRetries: 2,
    };

    const sanitizedUserPrompt = sanitizeContextString(userPrompt);
    const promptMessages = [
      ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
      { role: "user", content: sanitizedUserPrompt },
    ];

    const groq = getGroqClient();
    const isApiKeyPresent = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "");

    // 1. If provider not configured, immediately invoke deterministic fallback
    if (!groq || !isApiKeyPresent) {
      const fallbackData = fallbackGenerator ? fallbackGenerator() : null;
      recordTelemetry({
        traceId,
        taskName: config.taskName,
        version: config.version,
        provider: "deterministic_fallback",
        model: "heuristic",
        durationMs: Date.now() - startTime,
        status: "success",
        fallbackUsed: true,
        errorCategory: AI_ERROR_CATEGORIES.AI_NOT_CONFIGURED,
      });

      return {
        success: true,
        data: fallbackData,
        metadata: {
          traceId,
          taskName: config.taskName,
          taskVersion: config.version,
          provider: "deterministic_fallback",
          model: "heuristic",
          source: "deterministic_fallback",
          durationMs: Date.now() - startTime,
          confidence: 0.8,
          provenance: "offline_expert_heuristics",
          limitation: "Generated via rule-based deterministic heuristics because external LLM provider is unconfigured.",
        },
      };
    }

    // 2. Resolve target model
    let targetModel = modelOverride || (await getGroqModel({ taskTier: config.taskTier }));

    let retries = 0;
    let lastError = null;
    let completion = null;

    // 3. Bounded Retry Loop with Strict Timeout
    while (retries <= config.maxRetries) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI execution timed out after ${config.timeoutMs}ms`)), config.timeoutMs)
        );

        const requestPromise = groq.chat.completions.create({
          model: targetModel,
          messages: promptMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          response_format: schema ? { type: "json_object" } : undefined,
        });

        completion = await Promise.race([requestPromise, timeoutPromise]);
        break; // Successfully got completion!
      } catch (err) {
        lastError = err;
        const classified = classifyGroqError(err);

        // Immediate circuit breaker on 401 auth failure
        if (classified.statusCode === 401 || classified.category === AI_ERROR_CATEGORIES.AI_AUTH_ERROR) {
          console.warn(`[ai-orchestrator] Auth error on ${config.taskName}. Terminating retries.`);
          break;
        }

        retries++;
        if (retries <= config.maxRetries) {
          const backoffDelay = 300 * Math.pow(2, retries - 1) + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // 4. Handle Case where all LLM calls failed
    if (!completion || !completion.choices?.length) {
      const classified = classifyGroqError(lastError);
      console.warn(
        `[ai-orchestrator] LLM failed for ${config.taskName} after ${retries} attempts (${classified.category}). Activating deterministic fallback.`
      );

      const fallbackData = fallbackGenerator ? fallbackGenerator() : null;
      recordTelemetry({
        traceId,
        taskName: config.taskName,
        version: config.version,
        provider: "groq",
        model: targetModel,
        durationMs: Date.now() - startTime,
        status: "fallback_activated",
        retriesUsed: retries,
        fallbackUsed: true,
        errorCategory: classified.category,
      });

      return {
        success: Boolean(fallbackData),
        data: fallbackData,
        metadata: {
          traceId,
          taskName: config.taskName,
          taskVersion: config.version,
          provider: "deterministic_fallback",
          model: "heuristic",
          source: "deterministic_fallback",
          durationMs: Date.now() - startTime,
          confidence: 0.75,
          provenance: "offline_expert_heuristics",
          limitation: `LLM service degraded (${classified.message}). Fallback heuristics utilized.`,
        },
      };
    }

    // 5. Extract, Parse, and Validate Schema
    const rawContent = completion.choices[0]?.message?.content || "";
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;

    let parsedResult = rawContent;

    if (schema) {
      const extractedJson = extractAndParseJSON(rawContent);
      if (!extractedJson) {
        console.warn(`[ai-orchestrator] Failed to parse JSON from output for ${config.taskName}. Invoking fallback.`);
        const fallbackData = fallbackGenerator ? fallbackGenerator() : null;
        return {
          success: Boolean(fallbackData),
          data: fallbackData,
          metadata: {
            traceId,
            taskName: config.taskName,
            taskVersion: config.version,
            provider: "deterministic_fallback",
            model: targetModel,
            source: "deterministic_fallback",
            durationMs: Date.now() - startTime,
            provenance: "offline_expert_heuristics",
            limitation: "Model generated invalid JSON format. Rule-based fallback provided.",
          },
        };
      }

      // Validate against domain Zod schema
      const normalized = validateAndNormalizeAIOutput(schema, extractedJson);
      if (!normalized.success) {
        console.warn(`[ai-orchestrator] Zod validation failed for ${config.taskName}. Using fallback.`);
        const fallbackData = fallbackGenerator ? fallbackGenerator() : null;
        return {
          success: Boolean(fallbackData),
          data: fallbackData,
          metadata: {
            traceId,
            taskName: config.taskName,
            taskVersion: config.version,
            provider: "deterministic_fallback",
            model: targetModel,
            source: "deterministic_fallback",
            durationMs: Date.now() - startTime,
            provenance: "offline_expert_heuristics",
            limitation: "Output failed strict schema contract validation.",
          },
        };
      }

      parsedResult = normalized.data;
    }

    // 6. Record Success Telemetry
    recordTelemetry({
      traceId,
      taskName: config.taskName,
      version: config.version,
      provider: "groq",
      model: targetModel,
      durationMs: Date.now() - startTime,
      status: "success",
      retriesUsed: retries,
      fallbackUsed: false,
      promptTokens,
      completionTokens,
    });

    return {
      success: true,
      data: parsedResult,
      metadata: {
        traceId,
        taskName: config.taskName,
        taskVersion: config.version,
        provider: "groq",
        model: targetModel,
        source: "groq_llm",
        durationMs: Date.now() - startTime,
        promptTokens,
        completionTokens,
        confidence: 0.9,
        provenance: "authenticated_ai_reasoning",
        limitation: "Subjective qualitative evaluation based on provided evidence signals.",
      },
    };
  }
}

export const aiOrchestrator = new AIOrchestratorService();
