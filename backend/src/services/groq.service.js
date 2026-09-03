import crypto from "crypto";
import {
  getGroqClient,
  getGroqModel,
  discoverAvailableModels,
  clearModelCache,
  classifyGroqError,
  getModelCacheInfo,
  GROQ_MODEL_PRIMARY,
  GROQ_MODEL_LIGHTWEIGHT,
  TASK_TIERS,
  AI_ERROR_CATEGORIES,
} from "../config/groq.config.js";
import { env } from "../config/env.js";
import { incrementDailyCounter } from "../core/database/models/analytics.models.js";
import {
  validateAndNormalizeAIOutput,
  ProfessionalSummarySchema,
  ResumeBulletEnhancementSchema,
  AtsAnalysisSchema,
  GitHubProfessionalReviewSchema,
  CareerMentorSchema,
  LearningRoadmapSchema,
  SkillGapReasoningSchema,
} from "../core/ai/aiContracts.js";
import { RESUME_PROMPTS } from "../core/ai/prompts/resume.prompts.js";
import { GITHUB_PROMPTS } from "../core/ai/prompts/github.prompts.js";
import { CAREER_PROMPTS } from "../core/ai/prompts/career.prompts.js";
import { SKILL_PROMPTS } from "../core/ai/prompts/skills.prompts.js";

export {
  getGroqClient,
  getGroqModel,
  classifyGroqError,
  TASK_TIERS,
  AI_ERROR_CATEGORIES,
  GROQ_MODEL_PRIMARY,
  GROQ_MODEL_LIGHTWEIGHT,
};

/**
 * Task specific configuration presets
 */
export const TASK_CONFIGS = {
  PROFESSIONAL_SUMMARY: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.3,
    maxTokens: 500,
  },
  RESUME_BULLET: {
    taskTier: TASK_TIERS.LIGHTWEIGHT,
    temperature: 0.25,
    maxTokens: 300,
  },
  ATS_ANALYSIS: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 1200,
  },
  GITHUB_PROFESSIONAL_REVIEW: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.25,
    maxTokens: 2000,
  },
  CAREER_MENTOR: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.3,
    maxTokens: 2000,
  },
  LEARNING_ROADMAP: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 2000,
  },
  SKILL_GAP: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.2,
    maxTokens: 1500,
  },
  RESUME_TAILOR: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.3,
    maxTokens: 1800,
  },
  RESUME_PARSE: {
    taskTier: TASK_TIERS.HIGH_REASONING,
    temperature: 0.1,
    maxTokens: 2500,
  },
};

/**
 * Safe AI diagnostic logger (no PII, no API keys, no private user data).
 */
function logAiDiagnostic({
  traceId,
  feature = "unknown",
  model,
  durationMs,
  status,
  errorCategory = null,
  fallbackUsed = false,
  inputLength = 0,
  outputLength = 0,
}) {
  const meta = [
    `[ai-debug]`,
    `traceId=${traceId}`,
    `feature=${feature}`,
    `model=${model}`,
    `duration=${durationMs}ms`,
    `status=${status}`,
    `fallback=${fallbackUsed}`,
    `inLen=${inputLength}`,
    `outLen=${outputLength}`,
  ];
  if (errorCategory) {
    meta.push(`errorCategory=${errorCategory}`);
  }
  console.log(meta.join(" "));
}

/**
 * Health check diagnostic for Groq AI integration.
 */
export async function checkGroqHealth() {
  const configuredModel = env.GROQ_MODEL || GROQ_MODEL_PRIMARY;
  const apiKeyPresent = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "");

  if (!apiKeyPresent) {
    return {
      success: false,
      status: "unconfigured",
      provider: "groq",
      configured: false,
      configuredModel,
      selectedModel: null,
      modelAvailable: false,
      apiReachable: false,
      errorCategory: AI_ERROR_CATEGORIES.AI_NOT_CONFIGURED,
      message: "GROQ_API_KEY is missing from environment.",
    };
  }

  const startTime = Date.now();
  try {
    const availableModels = await discoverAvailableModels({ forceRefresh: true });
    const selectedModel = await getGroqModel({ forceRefresh: false });
    const isConfiguredAvailable = availableModels.includes(configuredModel);
    const cacheInfo = getModelCacheInfo();

    // Test a lightweight ping completion
    const groq = getGroqClient();
    let apiReachable = false;
    let fallbackUsed = selectedModel !== configuredModel;

    if (groq && selectedModel) {
      try {
        const ping = await groq.chat.completions.create({
          model: selectedModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 10,
        });
        if (ping.choices?.length) {
          apiReachable = true;
        }
      } catch (err) {
        console.warn("[groq] Health ping request failed:", err.message);
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      success: apiReachable,
      status: apiReachable ? "healthy" : "degraded",
      provider: "groq",
      configured: true,
      configuredModel,
      selectedModel,
      modelAvailable: isConfiguredAvailable,
      availableModelCount: availableModels.length,
      apiReachable,
      latencyMs,
      cacheAge: cacheInfo.cacheAgeMs,
      fallbackUsed,
    };
  } catch (err) {
    const classified = classifyGroqError(err);
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      status: "error",
      provider: "groq",
      configured: true,
      configuredModel,
      selectedModel: null,
      modelAvailable: false,
      apiReachable: false,
      latencyMs,
      errorCategory: classified.category,
      errorType: classified.type,
      message: classified.message,
    };
  }
}

/**
 * Robust completion generator with automatic 1-time 404 model_not_found recovery and task-aware model routing.
 */
export async function generateCompletion({
  systemPrompt = "",
  userPrompt = "",
  messages = null,
  temperature = 0.3,
  maxTokens = 800,
  responseFormat = null,
  modelOverride = null,
  taskTier = TASK_TIERS.HIGH_REASONING,
  feature = "completion",
}) {
  const traceId = crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  const inputLength = (systemPrompt || "").length + (userPrompt || "").length;

  const groq = getGroqClient();
  if (!groq) {
    logAiDiagnostic({
      traceId,
      feature,
      model: "none",
      durationMs: 0,
      status: "failed",
      errorCategory: AI_ERROR_CATEGORIES.AI_NOT_CONFIGURED,
      inputLength,
      outputLength: 0,
    });
    throw new Error("Groq client not initialized (GROQ_API_KEY missing)");
  }

  const promptMessages = messages || [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: userPrompt },
  ];

  let targetModel = modelOverride || (await getGroqModel({ taskTier }));
  let fallbackUsed = Boolean(modelOverride && modelOverride !== targetModel);

  // Attempt 1
  try {
    incrementDailyCounter("groqRequests", 1);
    const params = {
      model: targetModel,
      messages: promptMessages,
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat) {
      params.response_format = responseFormat;
    }

    const completion = await groq.chat.completions.create(params);
    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    const durationMs = Date.now() - startTime;

    logAiDiagnostic({
      traceId,
      feature,
      model: targetModel,
      durationMs,
      status: "success",
      fallbackUsed,
      inputLength,
      outputLength: content.length,
    });

    return { content, modelUsed: targetModel, traceId, durationMs };
  } catch (error) {
    const classified = classifyGroqError(error);

    // Automatic 404 recovery: if model was not found, flush cache and try fallback ONCE
    if (classified.type === "MODEL_NOT_FOUND") {
      console.warn(`[groq] model_not_found detected for "${targetModel}", attempting 1-time fallback recovery...`);
      clearModelCache();

      const fallbackModel = await getGroqModel({
        taskTier: TASK_TIERS.HIGH_REASONING,
        forceRefresh: true,
        excludeModels: [targetModel],
      });

      try {
        const retryParams = {
          model: fallbackModel,
          messages: promptMessages,
          temperature,
          max_tokens: maxTokens,
        };

        if (responseFormat) {
          retryParams.response_format = responseFormat;
        }

        const retryCompletion = await groq.chat.completions.create(retryParams);
        const retryContent = retryCompletion.choices?.[0]?.message?.content?.trim() || "";
        const durationMs = Date.now() - startTime;

        logAiDiagnostic({
          traceId,
          feature,
          model: fallbackModel,
          durationMs,
          status: "success_after_recovery",
          fallbackUsed: true,
          inputLength,
          outputLength: retryContent.length,
        });

        return { content: retryContent, modelUsed: fallbackModel, traceId, durationMs };
      } catch (retryError) {
        const retryClassified = classifyGroqError(retryError);
        const durationMs = Date.now() - startTime;
        logAiDiagnostic({
          traceId,
          feature,
          model: fallbackModel,
          durationMs,
          status: "failed_recovery",
          errorCategory: retryClassified.category,
          fallbackUsed: true,
          inputLength,
          outputLength: 0,
        });
        throw new Error(`Groq request failed [${retryClassified.category}]: ${retryClassified.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    logAiDiagnostic({
      traceId,
      feature,
      model: targetModel,
      durationMs,
      status: "failed",
      errorCategory: classified.category,
      fallbackUsed,
      inputLength,
      outputLength: 0,
    });

    throw new Error(`Groq request failed [${classified.category}]: ${classified.message}`);
  }
}

/**
 * Strict JSON generator with schema validation, markdown fence stripping, and safe repair.
 */
export async function generateJSON({
  systemPrompt = "",
  userPrompt = "",
  messages = null,
  temperature = 0.2,
  maxTokens = 1500,
  fallbackData = {},
  schema = null,
  taskTier = TASK_TIERS.HIGH_REASONING,
  feature = "json_generation",
}) {
  try {
    const res = await generateCompletion({
      systemPrompt: systemPrompt
        ? `${systemPrompt} Respond ONLY with a valid raw JSON object. Do not include markdown code fences or backticks.`
        : "Respond ONLY with a valid raw JSON object.",
      userPrompt,
      messages,
      temperature,
      maxTokens,
      taskTier,
      feature,
    });

    let raw = res.content.trim();

    // Strip markdown code blocks if emitted
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Extract first JSON object if surrounded by preamble
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    if (schema) {
      const normalized = validateAndNormalizeAIOutput(raw, schema, fallbackData);
      return {
        data: normalized.data,
        modelUsed: res.modelUsed,
        repaired: normalized.repaired,
        traceId: res.traceId,
      };
    }

    const parsed = JSON.parse(raw);
    return { data: parsed, modelUsed: res.modelUsed, repaired: false, traceId: res.traceId };
  } catch (err) {
    console.warn("[groq] JSON generation or parse failed, using fallback:", err.message);
    return {
      data: fallbackData,
      modelUsed: "heuristic-fallback",
      repaired: false,
      traceId: null,
      error: err.message,
    };
  }
}

// ---------------------------------------------------------------------------
// DOMAIN RESUME AI METHODS
// ---------------------------------------------------------------------------

/**
 * Generate a Tailored Resume matching a Job Description.
 */
export const generateTailoredResume = async ({
  jobDescription,
  resumeText,
  tone = "professional",
  maxBullets = 6,
}) => {
  const config = TASK_CONFIGS.RESUME_TAILOR;
  const systemPrompt = RESUME_PROMPTS.TAILOR_RESUME.system;

  const userPrompt = [
    `Tone: ${tone}`,
    `Maximum experience bullets: ${maxBullets}`,
    "Job Description:",
    jobDescription,
    "Current Resume:",
    resumeText,
  ].join("\n\n");

  const res = await generateCompletion({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    feature: "resume_tailor",
  });

  return res.content;
};

function extractCleanText(content, candidateKeys = []) {
  if (!content || typeof content !== "string") return "";
  let trimmed = content.trim();

  // Strip outer quotes if wrapped
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Strip code fences if emitted
  trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // If content is valid JSON object with candidate keys (e.g. { "bullet": "..." } or { "summary": "..." }), extract value
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      for (const key of candidateKeys) {
        if (parsed[key] && typeof parsed[key] === "string") {
          return parsed[key].trim();
        }
      }
      const values = Object.values(parsed).filter((v) => typeof v === "string");
      if (values.length > 0) return values[0].trim();
    } catch {
      // Ignore parse error and return trimmed string
    }
  }

  return trimmed;
}

/**
 * Expand and enhance a single project bullet using action verbs & impact without fabricating metrics.
 */
export const expandProjectBullet = async ({
  bullet,
  projectName = "",
  technologies = "",
  atsOptimized = false,
  maxLines = 2,
}) => {
  const config = TASK_CONFIGS.RESUME_BULLET;
  const systemPrompt = [
    RESUME_PROMPTS.BULLET_ENHANCEMENT.system,
    `Keep length within ${maxLines} lines (1-2 sentences).`,
    "Output only the final improved bullet text directly without formatting, markdown, or explanations.",
  ].join(" ");

  const userPrompt = [
    projectName ? `Project: ${projectName}` : "",
    technologies ? `Technologies: ${technologies}` : "",
    atsOptimized ? "Target: High ATS keyword relevance and technical clarity." : "",
    `Current bullet: "${bullet}"`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await generateCompletion({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    feature: "bullet_expansion",
  });

  return extractCleanText(res.content, ["bullet", "improved", "result", "text"]);
};

/**
 * Generate ATS Description Bullets.
 */
export const generateAtsDescriptionBullets = async ({
  prompt,
  context = "",
  tone = "professional",
  count = 3,
}) => {
  const safeCount = Number.isFinite(count) ? Math.min(Math.max(Math.trunc(count), 1), 6) : 3;
  const config = TASK_CONFIGS.RESUME_BULLET;

  const systemPrompt = [
    "You are an expert ATS resume writing assistant for Smart Skill Hub.",
    "Generate concise, impact-focused bullet points that are truthful and technically grounded.",
    `Preferred tone: ${tone}.`,
    "Return plain text only with exactly one bullet per line.",
    `Return exactly ${safeCount} bullet points.`,
    "Do not include numbering, markdown headings, or explanations.",
  ].join(" ");

  const userPrompt = [
    "Primary instruction:",
    prompt,
    "",
    "Context (optional):",
    context || "N/A",
    "",
    "Constraints:",
    "1) Prefer ATS-friendly action verbs and technical clarity.",
    "2) Keep each bullet to 14-30 words.",
    "3) Do not fabricate tools, metrics, or outcomes not implied by context.",
    `4) Output exactly ${safeCount} lines.`,
  ].join("\n");

  const res = await generateCompletion({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: 400,
    taskTier: config.taskTier,
    feature: "ats_description_bullets",
  });

  const bullets = res.content
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, safeCount);

  return bullets;
};

/**
 * Generate an executive profile summary grounded strictly in provided evidence.
 */
export const generateProfileSummary = async ({
  targetRole = "Full Stack Developer",
  skills = "",
  experienceYears = "3+",
  currentSummary = "",
  userPrompt = "",
  profileSource = "",
}) => {
  const config = TASK_CONFIGS.PROFESSIONAL_SUMMARY;
  const systemPrompt = [
    "You are an expert executive resume writer and recruiter strategist for Smart Skill Hub.",
    "Generate a cohesive, impact-focused 2-4 sentence executive professional summary for a software engineer.",
    "Highlight technical core competencies, architecture experience, and business impact strictly grounded in the candidate's provided background.",
    "Do NOT invent fake metrics, companies, or credentials.",
    "Output ONLY the final summary text directly without markdown quotes, labels, or JSON wrapping.",
  ].join(" ");

  const contentPrompt =
    profileSource ||
    userPrompt ||
    [
      `Target Role: ${targetRole}`,
      skills ? `Technical Stack: ${skills}` : "",
      experienceYears ? `Experience Level: ${experienceYears}` : "",
      currentSummary ? `Existing draft: ${currentSummary}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const res = await generateCompletion({
    systemPrompt,
    userPrompt: contentPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    feature: "profile_summary",
  });

  const cleaned = extractCleanText(res.content, ["summary", "profileSummary", "text"]);
  return cleaned || "Results-driven Software Engineer with extensive full-stack experience in modern web architectures.";
};

export const generateProfessionalSummary = generateProfileSummary;

/**
 * Parse raw resume text and link metadata into structured profile object using GPT-OSS-120B.
 */
export const parseResumeWithLLM = async ({ rawText, linkMeta }) => {
  const config = TASK_CONFIGS.RESUME_PARSE;
  const systemPrompt = [
    "You are an expert resume parsing AI for Smart Skill Hub.",
    "Extract structured professional profile information from the raw resume text and provided link metadata.",
    "You must return a JSON object conforming exactly to this structure:",
    "{",
    '  "profile": {',
    '    "displayName": "string (Candidate full name)",',
    '    "headline": "string (e.g. Software Developer)",',
    '    "phone": "string",',
    '    "about": "string (professional summary, 3-5 sentences)"',
    "  },",
    '  "preferences": {',
    '    "linkedInUrl": "string",',
    '    "githubUrl": "string (personal profile URL)"',
    "  },",
    '  "contact": {',
    '    "email": "string"',
    "  },",
    '  "educationEntries": [',
    "    {",
    '      "degree": "string (e.g. B.Tech, Master of Science)",',
    '      "specialization": "string (e.g. Computer Science)",',
    '      "college": "string",',
    '      "location": "string",',
    '      "endDate": "string (date or year)",',
    '      "grade": "string (GPA/CGPA/Percentage)"',
    "    }",
    "  ],",
    '  "skillSections": [',
    "    {",
    '      "title": "string (e.g. Languages, Frameworks, Tools)",',
    '      "skills": ["string"]',
    "    }",
    "  ],",
    '  "experience": [',
    "    {",
    '      "role": "string",',
    '      "company": "string",',
    '      "location": "string",',
    '      "date": "string (date range)",',
    '      "bullets": ["string"]',
    "    }",
    "  ],",
    '  "projects": [',
    "    {",
    '      "title": "string",',
    '      "description": "string",',
    '      "stack": "string (comma-separated tech stack list)",',
    '      "date": "string",',
    '      "githubUrl": "string (GitHub repository link if applicable)",',
    '      "demoUrl": "string (live demo link if applicable)"',
    "    }",
    "  ],",
    '  "achievements": [',
    "    {",
    '      "title": "string",',
    '      "date": "string",',
    '      "bullets": ["string"]',
    "    }",
    "  ]",
    "}",
    "",
    "Ensure all extracted fields are strictly factual and grounded in the resume text. Do not invent details.",
    'If a field is missing, return an empty string "" or an empty array [] for lists.',
  ].join("\n");

  const userPrompt = [
    "Extracted Resume Link Metadata:",
    `LinkedIn URL: ${linkMeta?.linkedInUrl || "N/A"}`,
    `Personal GitHub URL: ${linkMeta?.githubUrl || "N/A"}`,
    `Email from mailto: ${linkMeta?.emailFromMailto || "N/A"}`,
    `Other GitHub repository links: ${(linkMeta?.projectGithubLinks || []).join(", ") || "None"}`,
    `Other live links: ${(linkMeta?.liveLinks || []).join(", ") || "None"}`,
    "",
    "Raw Resume Text:",
    rawText,
  ].join("\n");

  const { data } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    fallbackData: {},
    feature: "resume_parse",
  });

  return typeof data === "string" ? data : JSON.stringify(data);
};

/**
 * Extract structured requirements from a job description.
 */
export const analyzeJobDescription = async (jobDescription) => {
  const config = TASK_CONFIGS.ATS_ANALYSIS;
  const systemPrompt =
    "You are an ATS parser and recruitment analysis engine for Smart Skill Hub. Extract structured requirements from the job description.";

  const userPrompt = `Analyze this job description and extract key skills, responsibilities, and qualifications in JSON:
Job Description:
${jobDescription}`;

  const { data } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    fallbackData: {
      requiredSkills: [],
      preferredSkills: [],
      experienceYears: 2,
      responsibilities: [],
      keywords: [],
    },
    feature: "jd_analysis",
  });

  return data;
};

/**
 * Compare master data to parsed job description.
 */
export const matchMasterDataToJob = async ({ masterData, parsedJd }) => {
  const config = TASK_CONFIGS.ATS_ANALYSIS;
  const systemPrompt =
    "You are an ATS matching engine for Smart Skill Hub. Compare candidate master profile with job requirements and score alignment.";

  const userPrompt = `Compare Candidate Profile with Job Requirements:
Candidate Profile:
${JSON.stringify(masterData)}

Job Requirements:
${JSON.stringify(parsedJd)}

Return a JSON object with:
{
  "matchScore": 85,
  "matchedSkills": ["React", "Node.js"],
  "missingSkills": ["Kubernetes"],
  "recommendations": ["Highlight cloud deployment experience"]
}`;

  const { data } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    fallbackData: {
      matchScore: 80,
      matchedSkills: [],
      missingSkills: [],
      recommendations: [],
    },
    feature: "master_data_match",
  });

  return data;
};

/**
 * Generate two-stage tailored resume.
 */
export const generateTwoStageTailoredResume = async ({
  jobDescription,
  parsedJd,
  masterData,
  matchedData,
  tone = "professional",
}) => {
  const config = TASK_CONFIGS.RESUME_TAILOR;
  const systemPrompt =
    "You are a principal technical resume writer. Generate an optimized tailored resume matching the analyzed job requirements.";

  const userPrompt = `Job Analysis:
${JSON.stringify(parsedJd)}

Candidate Match:
${JSON.stringify(matchedData)}

Candidate Profile:
${JSON.stringify(masterData)}

Generate tailored resume in structured markdown.`;

  const res = await generateCompletion({
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    taskTier: config.taskTier,
    feature: "two_stage_tailored_resume",
  });

  return res.content;
};
