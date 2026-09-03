import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import * as groqConfig from "../src/config/groq.config.js";
import * as groqService from "../src/services/groq.service.js";
import {
  validateAndNormalizeAIOutput,
  ProfessionalSummarySchema,
  ResumeBulletEnhancementSchema,
  AtsAnalysisSchema,
  GitHubProfessionalReviewSchema,
  CareerMentorSchema,
} from "../src/core/ai/aiContracts.js";
import { answerMentorQuestion, generatePersonalizedCareerMentorPlan } from "../src/modules/github/services/githubMentorAi.service.js";
import { generateGitHubInsights } from "../src/modules/github/services/githubAi.service.js";

describe("Groq AI Full Diagnostic, Discovery & GPT-OSS-120B Integration Test Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    groqConfig.clearModelCache();
    groqConfig.setGroqClientForTest(null);
    groqConfig.setTestAvailableModels(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    groqConfig.clearModelCache();
    groqConfig.setGroqClientForTest(null);
    groqConfig.setTestAvailableModels(null);
  });

  // 1. Error Classification & Mapping
  describe("1. Error Classification & Standardized Categories", () => {
    it("maps 401 to AUTH_ERROR and AI_AUTH_ERROR", () => {
      const err = new Error("Invalid API Key");
      err.status = 401;
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("AUTH_ERROR");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_AUTH_ERROR);
      expect(res.statusCode).toBe(401);
    });

    it("maps 403 to PERMISSION_ERROR and AI_PROVIDER_ERROR", () => {
      const err = new Error("permission_denied for project");
      err.status = 403;
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("PERMISSION_ERROR");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_PROVIDER_ERROR);
      expect(res.statusCode).toBe(403);
    });

    it("maps 404 and model_not_found to MODEL_NOT_FOUND", () => {
      const err = new Error("The model `deprecated-model` does not exist or you do not have access to it.");
      err.status = 404;
      err.code = "model_not_found";
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("MODEL_NOT_FOUND");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_MODEL_NOT_FOUND);
      expect(res.statusCode).toBe(404);
    });

    it("maps 429 to RATE_LIMIT and AI_RATE_LIMIT", () => {
      const err = new Error("Rate limit reached for requests");
      err.status = 429;
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("RATE_LIMIT");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_RATE_LIMIT);
      expect(res.statusCode).toBe(429);
    });

    it("maps TimeoutError to TIMEOUT and AI_TIMEOUT", () => {
      const err = new Error("Request timed out after 15000ms");
      err.name = "TimeoutError";
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("TIMEOUT");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_TIMEOUT);
      expect(res.statusCode).toBe(504);
    });

    it("maps 500/502 to SERVER_ERROR and AI_PROVIDER_ERROR", () => {
      const err = new Error("Internal server error from upstream");
      err.status = 502;
      const res = groqConfig.classifyGroqError(err);
      expect(res.type).toBe("SERVER_ERROR");
      expect(res.category).toBe(groqConfig.AI_ERROR_CATEGORIES.AI_PROVIDER_ERROR);
      expect(res.statusCode).toBe(502);
    });
  });

  // 2. Primary Model & Task-Aware Model Selection
  describe("2. Dynamic Model Discovery & Task-Aware Fallback (openai/gpt-oss-120b)", () => {
    it("selects openai/gpt-oss-120b as primary high-reasoning model when present", async () => {
      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]);

      const selected = await groqConfig.getGroqModel({
        taskTier: groqConfig.TASK_TIERS.HIGH_REASONING,
      });
      expect(selected).toBe("openai/gpt-oss-120b");
    });

    it("selects openai/gpt-oss-20b for lightweight tasks when available", async () => {
      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]);

      const selected = await groqConfig.getGroqModel({
        taskTier: groqConfig.TASK_TIERS.LIGHTWEIGHT,
      });
      expect(selected).toBe("openai/gpt-oss-20b");
    });

    it("falls back to openai/gpt-oss-120b for lightweight task if gpt-oss-20b is not available", async () => {
      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
      ]);

      const selected = await groqConfig.getGroqModel({
        taskTier: groqConfig.TASK_TIERS.LIGHTWEIGHT,
      });
      expect(selected).toBe("openai/gpt-oss-120b");
    });

    it("skips excluded models during fallback resolution", async () => {
      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]);

      const selected = await groqConfig.getGroqModel({
        excludeModels: ["openai/gpt-oss-120b"],
      });
      expect(selected).toBe("openai/gpt-oss-20b");
    });

    it("returns default safe model if discovery list is empty or offline", async () => {
      groqConfig.setTestAvailableModels([]);
      const selected = await groqConfig.getGroqModel();
      expect(selected).toBe("openai/gpt-oss-120b");
    });
  });

  // 3. Automatic 404 Recovery Mechanism
  describe("3. Automatic 404 Recovery", () => {
    it("recovers from a 404 model_not_found on the first attempt and retries once with fallback model", async () => {
      const mockCreate = vi
        .fn()
        // 1st attempt fails with 404 model_not_found
        .mockRejectedValueOnce(
          Object.assign(new Error("The model `non-existent-model` does not exist"), {
            status: 404,
            code: "model_not_found",
          })
        )
        // 2nd attempt succeeds with fallback
        .mockResolvedValueOnce({
          choices: [{ message: { content: "Recovered summary text" } }],
        });

      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });

      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]);

      const result = await groqService.generateCompletion({
        systemPrompt: "System",
        userPrompt: "User prompt",
        modelOverride: "non-existent-model",
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.content).toBe("Recovered summary text");
      expect(result.modelUsed).toBe("openai/gpt-oss-120b");
    });
  });

  // 4. Structured JSON Response Safety & Schema Repair
  describe("4. JSON Schema Validation & Controlled Repair", () => {
    it("safely strips markdown code blocks and validates valid schema", () => {
      const raw = "```json\n{\n  \"summary\": \"Principal Engineer\",\n  \"strengths\": [\"Node.js\", \"System Design\"],\n  \"keywords\": [\"TypeScript\"]\n}\n```";
      const result = validateAndNormalizeAIOutput(raw, ProfessionalSummarySchema);

      expect(result.success).toBe(true);
      expect(result.data.summary).toBe("Principal Engineer");
      expect(result.data.strengths).toEqual(["Node.js", "System Design"]);
      expect(result.repaired).toBe(false);
    });

    it("performs controlled repair when non-essential fields are missing", () => {
      const raw = "{\n  \"summary\": \"Senior Engineer\"\n}";
      const fallback = { summary: "", strengths: ["Default"], keywords: [] };
      const result = validateAndNormalizeAIOutput(raw, ProfessionalSummarySchema, fallback);

      expect(result.success).toBe(true);
      expect(result.data.summary).toBe("Senior Engineer");
      expect(result.data.strengths).toEqual([]);
    });

    it("returns safe fallbackData without throwing if LLM outputs completely invalid content", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: "I am unable to output JSON today." } }],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const fallback = { summary: "Heuristic Summary", strengths: [], keywords: [] };
      const { data } = await groqService.generateJSON({
        userPrompt: "Generate profile",
        fallbackData: fallback,
        schema: ProfessionalSummarySchema,
      });

      expect(data).toEqual(fallback);
    });
  });

  // 5. Resume AI Domain Methods
  describe("5. Centralized Resume AI Domain Features (openai/gpt-oss-120b)", () => {
    it("generates professional resume summary grounded in evidence", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Results-driven Full Stack Engineer with 5+ years of experience in React and Node.js." } }],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const summary = await groqService.generateProfessionalSummary({
        targetRole: "Full Stack Developer",
        skills: "React, Node.js",
      });

      expect(summary).toContain("Full Stack Engineer");
    });

    it("enhances project bullet with action verbs without inventing ungrounded metrics", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Architected real-time WebSocket dashboard for live user data visualization." } }],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const bullet = await groqService.expandProjectBullet({
        bullet: "worked on dashboard",
        projectName: "Live Analytics",
        technologies: "Node.js, WebSocket",
      });

      expect(bullet).toContain("Architected");
    });
  });

  // 6. GitHub Professional Developer Review & Career Mentor
  describe("6. GitHub Professional Developer Review & Personal Mentor", () => {
    it("generates structured GitHub Professional Developer Review matching schema", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 88,
                specialization: "Full Stack Engineer (TypeScript, React)",
                technicalStrengths: ["Clean modular service architecture", "Strong TypeScript adoption"],
                engineeringQuality: ["Well structured monorepo setup"],
                documentationQuality: ["Detailed README guides"],
                projectQuality: ["High complexity full stack applications"],
                careerOpportunities: ["Senior Frontend Engineer", "Full Stack Developer"],
                recommendations: ["Add automated CI/CD pipeline", "Add live demo links"],
                recommendedTechnologies: ["Docker", "Kubernetes"],
              }),
            },
          },
        ],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const res = await generateGitHubInsights({
        username: "testdev",
        profile: { name: "Test Developer", publicRepos: 10 },
        repositories: [],
      });

      expect(res.overallScore).toBe(88);
      expect(res.specialization).toContain("TypeScript");
      expect(res.technicalStrengths).toHaveLength(2);
      expect(res.careerOpportunities).toContain("Senior Frontend Engineer");
    });

    it("generates Personal Developer Mentor plan with 30/90 day milestones", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                careerSummary: "Demonstrated strong frontend engineering with developing backend capabilities.",
                currentLevel: "Mid-Level Engineer",
                strengths: ["React UI architecture", "TypeScript typing"],
                weaknesses: ["Backend persistence and testing"],
                priorityActions: ["Containerize API service", "Write automated tests"],
                recommendedProjects: ["Full-stack e-commerce API with PostgreSQL and Docker"],
                recommendedSkills: ["Docker", "PostgreSQL"],
                careerPath: ["Senior Full Stack Developer"],
                next30Days: ["Week 1-2: Add Dockerfile", "Week 3-4: Write Jest unit tests"],
                next90Days: ["Month 2: Deploy to cloud staging", "Month 3: Interview preparation"],
              }),
            },
          },
        ],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const res = await generatePersonalizedCareerMentorPlan({
        githubData: {
          username: "testdev",
          dominantLanguage: "TypeScript",
          profile: { publicRepos: 12 },
          repositories: [],
        },
        targetRole: "Full Stack Developer",
      });

      expect(res.aiMentorPlan).toBeDefined();
      expect(res.aiMentorPlan.currentLevel).toBe("Mid-Level Engineer");
      expect(res.aiMentorPlan.next30Days).toHaveLength(2);
    });

    it("answers mentor questions with structured 6-part framework", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                question: "How do I transition to Senior?",
                currentSituation: "You have strong frontend projects in TypeScript.",
                evidence: ["10 TypeScript repositories with clean architecture"],
                gap: "Need demonstrable backend systems with Docker and testing.",
                recommendation: "Build a production-grade backend API service.",
                action: ["Add Docker Compose", "Write integration tests"],
                expectedOutcome: "Demonstrates end-to-end full-stack senior readiness.",
              }),
            },
          },
        ],
      });
      groqConfig.setGroqClientForTest({
        chat: { completions: { create: mockCreate } },
      });
      groqConfig.setTestAvailableModels(["openai/gpt-oss-120b"]);

      const res = await answerMentorQuestion({
        question: "How do I transition to Senior?",
        githubData: {
          username: "testdev",
          dominantLanguage: "TypeScript",
          profile: { publicRepos: 10 },
        },
      });

      expect(res.currentSituation).toContain("frontend projects");
      expect(res.action).toHaveLength(2);
      expect(res.gap).toContain("Docker");
    });
  });

  // 7. AI Health Check Endpoint
  describe("7. AI Health Check Endpoint (/api/v1/ai/health)", () => {
    it("GET /api/v1/ai/health returns 200 with GPT-OSS-120B configuration and reachable status", async () => {
      groqConfig.setTestAvailableModels([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]);

      groqConfig.setGroqClientForTest({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: "pong" } }],
            }),
          },
        },
      });

      const res = await request(app).get("/api/v1/ai/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe("groq");
      expect(res.body.data.configured).toBe(true);
      expect(res.body.data.configuredModel).toBe("openai/gpt-oss-120b");
      expect(res.body.data.selectedModel).toBe("openai/gpt-oss-120b");
      expect(res.body.data.modelAvailable).toBe(true);
      expect(res.body.data.apiReachable).toBe(true);
      expect(res.body.data.status).toBe("healthy");
    });
  });
});
