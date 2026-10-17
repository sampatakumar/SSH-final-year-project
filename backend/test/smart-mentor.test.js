import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { smartMentorContextService, SmartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService, SmartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { SmartMentorConversation } from "../src/modules/mentor/models/smartMentorConversation.models.js";
import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../src/modules/edutube/models/index.js";
import * as groqModule from "../src/services/groq.service.js";

describe("Smart Mentor Backend Test Suite", () => {
  const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

  let mentorService;
  let contextService;
  let localService;

  beforeEach(() => {
    mentorService = new SmartMentorService();
    contextService = smartMentorContextService;
    localService = smartMentorLocalService;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Aggregates unified user context without fabricating missing fields", async () => {
    vi.spyOn(User, "findById").mockReturnValue({
      lean: async () => ({
        _id: userId,
        displayName: "Sampat",
        targetRole: "Full Stack Developer",
        experience: [{ role: "Frontend Developer", company: "Acme Corp" }],
      }),
    });

    vi.spyOn(UserSettings, "findOne").mockReturnValue({
      lean: async () => ({
        owner: userId,
        githubIntegration: {
          connected: true,
          githubUsername: "sampatakumar",
        },
      }),
    });

    vi.spyOn(SkillProfile, "findOne").mockReturnValue({
      lean: async () => ({
        owner: userId,
        targetRole: "Full Stack Developer",
        overallReadinessScore: 78,
        skills: [{ skill: "React", level: "Proficient", score: 85 }],
        skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 30, targetScore: 75, reason: "Cloud deployment" }],
      }),
    });

    vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
      sort: () => ({
        lean: async () => ({
          githubUsername: "sampatakumar",
          repositories: [
            { name: "SSH-App", description: "Smart Skill Hub", sizeKB: 50 },
            { name: "Empty-Repo", description: "", sizeKB: 2 },
          ],
          languages: { TypeScript: 70, JavaScript: 30 },
          aggregateStats: { totalStars: 5 },
          aiInsights: { githubOptimizationScore: 82, weaknesses: ["Missing readme in empty repo"] },
        }),
      }),
    });

    vi.spyOn(Project, "find").mockReturnValue({
      limit: () => ({
        lean: async () => [{ title: "ResumeAI", stack: ["React", "Node.js"] }],
      }),
    });

    vi.spyOn(Resume, "find").mockReturnValue({
      limit: () => ({
        lean: async () => [{ title: "Primary Resume" }],
      }),
    });

    vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [{ title: "Node.js Masterclass", completed: false }],
        }),
      }),
    });

    vi.spyOn(EduTubeProgress, "find").mockReturnValue({
      lean: async () => [{ videoId: "v1", completed: true }],
    });

    vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({
      limit: () => ({
        lean: async () => [],
      }),
    });

    vi.spyOn(EduTubePlaylist, "find").mockReturnValue({
      limit: () => ({
        lean: async () => [],
      }),
    });

    vi.spyOn(CodingSubmission, "find").mockReturnValue({
      limit: () => ({
        lean: async () => [],
      }),
    });

    const context = await contextService.getUnifiedUserContext(userId, { forceRefresh: true });

    expect(context.career.name).toBe("Sampat");
    expect(context.career.targetRole).toBe("Full Stack Developer");
    expect(context.career.readinessScore).toBe(78);
    expect(context.skillGaps[0].skill).toBe("Docker");
    expect(context.github.repositoryCount).toBe(2);
    expect(context.github.repositoriesWithoutDescription).toBe(1);
    expect(context.learning.completedVideos).toBe(1);
    expect(context.projects[0].name).toBe("ResumeAI");
    expect(context.insights.length).toBeGreaterThan(0);
  });

  it("2. Local NLP engine classifies intent and generates grounded responses", () => {
    const mockContext = {
      career: { targetRole: "Full Stack Developer", readinessScore: 72 },
      skills: [{ name: "React", level: "Proficient", score: 85 }],
      skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 25, targetScore: 75 }],
      github: {
        repositoryCount: 10,
        repositoriesWithoutDescription: 3,
        repositoriesWithoutReadme: 2,
        reposWithoutReadmeList: ["RepoA", "RepoB"],
        topLanguages: ["TypeScript", "JavaScript"],
      },
      learning: { videosWatched: 12, completedVideos: 4 },
      projects: [{ name: "Portfolio", technologies: ["React"] }],
    };

    // Test GitHub Readme intent
    const readmeRes = localService.generateLocalResponse("Which of my repos need a README?", mockContext);
    expect(readmeRes.source).toBe("local_nlp");
    expect(readmeRes.intent).toBe("github_readme");
    expect(readmeRes.answer).toContain("2 repositories");
    expect(readmeRes.actions.length).toBeGreaterThan(0);
    expect(readmeRes.actions[0].category).toBe("github");

    // Test Skill Gaps intent
    const gapRes = localService.generateLocalResponse("What are my biggest skill gaps?", mockContext);
    expect(gapRes.intent).toBe("skill_gaps");
    expect(gapRes.answer).toContain("Docker");
    expect(gapRes.actions[0].title).toContain("Docker");

    // Test Career Readiness intent
    const careerRes = localService.generateLocalResponse("Am I ready for full stack developer?", mockContext);
    expect(careerRes.intent).toBe("career_progress");
    expect(careerRes.answer).toContain("72/100");
  });

  it("3. SmartMentorService processes chat using Groq when available", async () => {
    const mockConv = {
      owner: userId,
      messages: [],
      save: async () => {},
    };

    vi.spyOn(SmartMentorConversation, "findOne").mockResolvedValue(mockConv);
    vi.spyOn(contextService, "getUnifiedUserContext").mockResolvedValue({
      career: { targetRole: "Full Stack Developer", readinessScore: 80 },
      skills: [{ name: "React", score: 90 }],
      skillGaps: [],
      github: { repositoryCount: 5 },
    });

    vi.spyOn(groqModule, "generateJSON").mockResolvedValue({
      data: {
        answer: "Your Full Stack progress is excellent. You are well-positioned for junior to mid roles.",
        summary: "Readiness is high at 80%.",
        actions: [
          {
            title: "Practice system design",
            priority: "medium",
            category: "career",
            estimatedMinutes: 45,
            route: "/dashboard/coding",
          },
        ],
        confidence: 0.94,
      },
      modelUsed: "openai/gpt-oss-120b",
      repaired: false,
    });

    const res = await mentorService.processChatMessage(userId, "How is my progress?");

    expect(res.source).toBe("groq");
    expect(res.message).toContain("Full Stack progress is excellent");
    expect(res.actions).toHaveLength(1);
    expect(res.actions[0].title).toBe("Practice system design");
    expect(mockConv.messages).toHaveLength(2); // user + assistant
  });

  it("4. Automatically activates Local NLP fallback without error when Groq fails or times out", async () => {
    const mockConv = {
      owner: userId,
      messages: [],
      save: async () => {},
    };

    vi.spyOn(SmartMentorConversation, "findOne").mockResolvedValue(mockConv);
    vi.spyOn(contextService, "getUnifiedUserContext").mockResolvedValue({
      career: { targetRole: "Backend Engineer", readinessScore: 68 },
      skills: [{ name: "Node.js", score: 75 }],
      skillGaps: [{ skill: "Kubernetes", priority: "High", currentScore: 20, targetScore: 75 }],
      github: { repositoryCount: 4, repositoriesWithoutDescription: 2 },
    });

    // Simulate Groq HTTP 429 / quota failure
    vi.spyOn(groqModule, "generateJSON").mockRejectedValue(new Error("Groq API rate limit exceeded (429)"));

    const res = await mentorService.processChatMessage(userId, "What should I learn next?");

    expect(res.source).toBe("local_nlp");
    expect(res.message).toContain("Kubernetes");
    expect(res.actions.length).toBeGreaterThan(0);
    expect(mockConv.messages).toHaveLength(2);
    expect(mockConv.messages[1].source).toBe("local_nlp");
  });

  it("5. Clears conversation memory securely", async () => {
    const updateSpy = vi.spyOn(SmartMentorConversation, "findOneAndUpdate").mockResolvedValue({
      owner: userId,
      messages: [],
    });

    const res = await mentorService.clearHistory(userId);
    expect(res.cleared).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      { owner: userId },
      { $set: { messages: [] } },
      { upsert: true }
    );
  });

  it("6. Handles project idea and 30-day plan intents with actionable steps", () => {
    const mockContext = {
      career: { targetRole: "Full Stack Developer", readinessScore: 70 },
      skills: [{ name: "React", level: "Proficient", score: 80 }, { name: "Node.js", level: "Proficient", score: 80 }],
      skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 25, targetScore: 75 }],
      github: { repositoryCount: 5, repositoriesWithoutDescription: 2, repositoriesWithoutReadme: 1, topLanguages: ["JavaScript"] },
      projects: [{ name: "ResumeAI", technologies: ["React", "Node.js"] }],
    };

    const planRes = localService.generateLocalResponse("Give me a 30 day plan for placements", mockContext);
    expect(planRes.intent).toBe("career_plan");
    expect(planRes.answer).toContain("Week 1");
    expect(planRes.answer).toContain("Docker");
    expect(planRes.actions.length).toBeGreaterThan(0);

    const ideaRes = localService.generateLocalResponse("Which project should I build next?", mockContext);
    expect(ideaRes.intent).toBe("project_idea");
    expect(ideaRes.answer).toContain("High-Impact Project Recommendations");
    expect(ideaRes.actions.length).toBeGreaterThan(0);
  });

  it("7. Validates empty message payload and throws ApiError(400)", async () => {
    await expect(mentorService.processChatMessage(userId, "")).rejects.toThrow("Message content is required");
    await expect(mentorService.processChatMessage(userId, "   ")).rejects.toThrow("Message content is required");
  });

  it("8. Aggregates complete academic profile and multi-role targets accurately", async () => {
    vi.spyOn(User, "findById").mockReturnValue({
      lean: async () => ({
        _id: userId,
        displayName: "Sampat",
        targetRole: "Robotics Engineer",
        targetRoles: ["Robotics Engineer", "Embedded Systems Engineer"],
        careerInterests: ["Autonomous Navigation", "ROS2"],
        academic: {
          degreeName: "Bachelor of Technology",
          degreeSlug: "btech",
          branchName: "Robotics and Automation",
          branchSlug: "robotics-and-automation",
          specializationName: "Autonomous Systems",
          specializationSlug: "autonomous-systems",
          currentYear: 4,
          currentSemester: 7,
          institution: "National Institute of Technology",
        },
      }),
    });
    vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: async () => null });
    vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: async () => null });
    vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({ sort: () => ({ lean: async () => null }) });
    vi.spyOn(Project, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(Resume, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
    vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: async () => [] });
    vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });

    const context = await contextService.getUnifiedUserContext(userId, { forceRefresh: true });

    expect(context.career.targetRole).toBe("Robotics Engineer");
    expect(context.career.targetRoles).toEqual(["Robotics Engineer", "Embedded Systems Engineer"]);
    expect(context.career.careerInterests).toEqual(["Autonomous Navigation", "ROS2"]);
    expect(context.career.academic.isConfigured).toBe(true);
    expect(context.career.academic.branchName).toBe("Robotics and Automation");
    expect(context.career.academic.currentYear).toBe(4);
    expect(context.career.academic.currentSemester).toBe(7);
    expect(context.insights.some((i) => i.includes("Robotics and Automation"))).toBe(true);
  });

  it("9. Handles partial and missing academic profiles without fabricating data", async () => {
    // Partial academic profile
    vi.spyOn(User, "findById").mockReturnValue({
      lean: async () => ({
        _id: userId,
        displayName: "Aarav",
        targetRole: "Data Scientist",
        academic: {
          branchName: "Mechanical Engineering",
          currentYear: 2,
        },
      }),
    });
    vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: async () => null });
    vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: async () => null });
    vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({ sort: () => ({ lean: async () => null }) });
    vi.spyOn(Project, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(Resume, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
    vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: async () => [] });
    vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
    vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });

    const partialContext = await contextService.getUnifiedUserContext(userId, { forceRefresh: true });
    expect(partialContext.career.academic.isConfigured).toBe(true);
    expect(partialContext.career.academic.branchName).toBe("Mechanical Engineering");
    expect(partialContext.career.academic.degreeName).toBe("");
    expect(partialContext.career.academic.currentYear).toBe(2);

    // Completely missing academic profile
    vi.spyOn(User, "findById").mockReturnValue({
      lean: async () => ({
        _id: userId,
        displayName: "NoAcademic",
        targetRole: "Full Stack Developer",
        academic: null,
      }),
    });

    const missingContext = await contextService.getUnifiedUserContext(userId, { forceRefresh: true });
    expect(missingContext.career.academic.isConfigured).toBe(false);
    expect(missingContext.career.academic.branchName).toBe("");
    expect(missingContext.career.academic.currentYear).toBeNull();
    expect(missingContext.insights.some((i) => i.includes("Academic Pathway"))).toBe(false);
  });

  it("10. System prompt grounds in verified academic discipline and forbids hallucination", () => {
    const verifiedContext = {
      career: {
        targetRole: "VLSI Design Engineer",
        targetRoles: ["VLSI Design Engineer", "Hardware Engineer"],
        readinessScore: 70,
        academic: {
          isConfigured: true,
          degreeName: "B.Tech",
          branchName: "Electronics and Communication Engineering",
          currentYear: 3,
          currentSemester: 5,
        },
      },
    };

    const verifiedPrompt = mentorService.buildSystemPrompt(verifiedContext);
    expect(verifiedPrompt).toContain("Electronics and Communication Engineering");
    expect(verifiedPrompt).toContain("VLSI Design Engineer");
    expect(verifiedPrompt).toContain("Ground domain advice within their verified branch");

    const unconfiguredContext = {
      career: {
        targetRole: "Full Stack Developer",
        readinessScore: 60,
        academic: { isConfigured: false },
      },
    };

    const unconfiguredPrompt = mentorService.buildSystemPrompt(unconfiguredContext);
    expect(unconfiguredPrompt).toContain("Not configured / Unknown");
    expect(unconfiguredPrompt).toContain("NEVER invent, assume, or fabricate an engineering branch");
  });

  it("11. Local NLP engine surfaces academic background in career progress when present", () => {
    const contextWithAcademic = {
      career: {
        targetRole: "Robotics Engineer",
        readinessScore: 80,
        academic: {
          isConfigured: true,
          branchName: "Robotics Engineering",
          degreeName: "B.Tech",
          currentYear: 4,
        },
      },
      skills: [{ name: "ROS2", level: "Proficient" }],
      skillGaps: [{ skill: "SLAM", priority: "Critical", currentScore: 30, targetScore: 80 }],
    };

    const res = localService.generateLocalResponse("How is my career progress?", contextWithAcademic);
    expect(res.answer).toContain("Academic Pathway");
    expect(res.answer).toContain("Robotics Engineering");
    expect(res.answer).toContain("Year 4");

    const contextWithoutAcademic = {
      career: {
        targetRole: "Full Stack Developer",
        readinessScore: 65,
        academic: { isConfigured: false },
      },
    };

    const resNoAcad = localService.generateLocalResponse("How is my career progress?", contextWithoutAcademic);
    expect(resNoAcad.answer).not.toContain("Academic Pathway");
    expect(resNoAcad.answer).toContain("Full Stack Developer");
  });
});

