import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { GitHubAnalysis } from "../src/models/githubAnalysis.models.js";
import { CodingSubmission } from "../src/models/codingSubmission.models.js";
import { AssessmentSession } from "../src/models/assessmentSession.models.js";
import { SkillProfile } from "../src/models/skillProfile.models.js";
import { User } from "../src/models/user.models.js";

describe("Phase 1 Database Foundation Models", () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  it("instantiates GitHubAnalysis model with proper schema defaults", () => {
    const analysis = new GitHubAnalysis({
      owner: dummyUserId,
      githubUsername: "octocat",
      profile: {
        name: "The Octocat",
        publicRepos: 8
      },
      repositories: [
        { name: "Hello-World", language: "JavaScript", stars: 10 }
      ],
      dominantLanguage: "JavaScript"
    });

    expect(analysis.owner).toEqual(dummyUserId);
    expect(analysis.githubUsername).toBe("octocat");
    expect(analysis.repositories.length).toBe(1);
    expect(analysis.repositories[0].name).toBe("Hello-World");
    expect(analysis.dominantLanguage).toBe("JavaScript");
  });

  it("instantiates CodingSubmission model with validation", () => {
    const submission = new CodingSubmission({
      owner: dummyUserId,
      taskId: "two-sum",
      language: "javascript",
      code: "function twoSum(nums, target) { return [0, 1]; }",
      status: "passed",
      score: 20,
      maxScore: 20,
      passed: 5,
      failed: 0,
      total: 5,
      executionTimeMs: 42,
      skillsCovered: ["Arrays", "Hash Maps"]
    });

    expect(submission.taskId).toBe("two-sum");
    expect(submission.status).toBe("passed");
    expect(submission.score).toBe(20);
    expect(submission.skillsCovered).toContain("Arrays");
  });

  it("instantiates AssessmentSession model", () => {
    const session = new AssessmentSession({
      owner: dummyUserId,
      sessionId: "session_abc123",
      topic: "Algorithms",
      difficulty: "Medium",
      taskIds: ["two-sum", "is-palindrome"],
      totalScore: 30,
      maxScore: 40
    });

    expect(session.sessionId).toBe("session_abc123");
    expect(session.topic).toBe("Algorithms");
    expect(session.taskIds.length).toBe(2);
    expect(session.status).toBe("in_progress");
  });

  it("instantiates SkillProfile model with skills, gaps and recommendations", () => {
    const profile = new SkillProfile({
      owner: dummyUserId,
      targetRole: "Full Stack Developer",
      overallReadinessScore: 82,
      skills: [
        {
          skill: "React",
          canonicalName: "React",
          category: "Frontend",
          score: 85,
          level: "Proficient",
          confidence: 0.88,
          sources: ["resume", "github"]
        }
      ],
      skillGaps: [
        {
          skill: "Docker",
          canonicalName: "Docker",
          priority: "High",
          reason: "Target role requires Docker; limited practical evidence detected."
        }
      ]
    });

    expect(profile.targetRole).toBe("Full Stack Developer");
    expect(profile.overallReadinessScore).toBe(82);
    expect(profile.skills[0].canonicalName).toBe("React");
    expect(profile.skillGaps[0].priority).toBe("High");
  });
});
