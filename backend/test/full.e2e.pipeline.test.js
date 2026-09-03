import { describe, it, expect } from "vitest";
import { extractResumeEvidence } from "../src/modules/resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";
import { evaluateEvidencePackages } from "../src/modules/skills/services/evaluation.engine.js";
import { analyzeSkillGaps, GAP_STATUSES, GAP_PRIORITIES } from "../src/modules/gaps/services/skillGap.service.js";
import { generateRecommendations } from "../src/modules/recommendations/services/recommendation.service.js";
import { AUTHORITATIVE_DOCS } from "../src/modules/recommendations/catalog/documentationCatalog.js";
import { VERIFIED_CODING_TASKS } from "../src/modules/recommendations/catalog/taskMappings.js";

describe("Phase K: Complete End-to-End Cross-Module Pipeline Test", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  it("executes the unified intelligence pipeline from raw multi-source evidence to actionable learning roadmap", () => {
    // 1. Ingest Resume Evidence
    const resumeData = {
      userId: dummyUserId,
      userProfile: {
        skillLanguages: ["JavaScript", "TypeScript", "HTML5"],
        skillFrameworks: ["React"],
        skillTools: ["Git"],
      },
    };
    const resumePackage = extractResumeEvidence(resumeData);
    expect(resumePackage.source).toBe("resume");
    expect(resumePackage.skills.length).toBeGreaterThanOrEqual(4);

    // 2. Ingest GitHub Evidence
    const githubData = {
      userId: dummyUserId,
      githubData: {
        languages: {
          JavaScript: { size: 60000, percentage: 70, repoCount: 3 },
          TypeScript: { size: 25000, percentage: 30, repoCount: 1 },
        },
        repositories: [
          { name: "web-app", language: "JavaScript", fork: false, stars: 4, openIssues: 0 },
          { name: "ts-utils", language: "TypeScript", fork: false, stars: 2, openIssues: 0 },
        ],
      },
    };
    const githubPackage = extractGitHubEvidence(githubData);
    expect(githubPackage.source).toBe("github");
    expect(githubPackage.skills.length).toBeGreaterThanOrEqual(2);

    // 3. Ingest Coding Sandbox Evidence
    const codingData = {
      userId: dummyUserId,
      submissions: [
        {
          taskId: "two-sum",
          title: "Two Sum",
          language: "javascript",
          status: "passed",
          score: 20,
          passed: 5,
          total: 5,
          skillsCovered: ["JavaScript", "Arrays", "Hash Maps"],
        },
        {
          taskId: "valid-parentheses",
          title: "Valid Parentheses",
          language: "javascript",
          status: "passed",
          score: 20,
          passed: 4,
          total: 4,
          skillsCovered: ["JavaScript", "Stack", "Problem Solving"],
        },
      ],
    };
    const codingPackage = extractCodingEvidence(codingData);
    expect(codingPackage.source).toBe("coding");
    expect(codingPackage.skills.length).toBeGreaterThanOrEqual(3);

    // 4. Skills Module Evaluation (Weighted Evidence Methodology v1.0.0)
    const evaluation = evaluateEvidencePackages([resumePackage, githubPackage, codingPackage]);
    expect(evaluation.evaluationVersion).toBe("1.0.0");
    expect(evaluation.skillsCount).toBeGreaterThanOrEqual(5);

    // JavaScript has 3-source evidence (Resume + GitHub + Coding)
    const jsSkill = evaluation.skills.find((s) => s.canonicalName === "JavaScript");
    expect(jsSkill).toBeDefined();
    expect(jsSkill.sources).toContain("resume");
    expect(jsSkill.sources).toContain("github");
    expect(jsSkill.sources).toContain("coding");
    expect(jsSkill.score).toBeGreaterThanOrEqual(75);
    expect(jsSkill.level).toBe("Strong Evidence");

    // Arrays has Coding evidence
    const arraysSkill = evaluation.skills.find((s) => s.canonicalName === "Arrays");
    expect(arraysSkill).toBeDefined();
    expect(arraysSkill.sources).toContain("coding");

    // 5. Gap Analysis against Full Stack Developer Benchmark
    const targetRole = "Full Stack Developer";
    const gapAnalysis = analyzeSkillGaps(evaluation.skills, targetRole);

    expect(gapAnalysis.targetRole).toBe(targetRole);
    expect(gapAnalysis.totalRequiredSkills).toBeGreaterThanOrEqual(10);
    expect(gapAnalysis.metSkillsCount).toBeGreaterThanOrEqual(1); // JavaScript met
    expect(gapAnalysis.gapsCount).toBeGreaterThan(0); // Node.js, MongoDB, Docker, REST APIs missing

    // Verify JavaScript is Met Requirement
    const metJs = gapAnalysis.metSkills.find((s) => s.canonicalName === "JavaScript");
    expect(metJs).toBeDefined();
    expect(metJs.currentScore).toBeGreaterThanOrEqual(75);

    // Verify Docker is identified as Missing (Critical/High gap)
    const dockerGap = gapAnalysis.gaps.find((g) => g.canonicalName === "Docker");
    expect(dockerGap).toBeDefined();
    expect(dockerGap.status).toBe(GAP_STATUSES.MISSING);
    expect(dockerGap.currentScore).toBe(0);
    expect([GAP_PRIORITIES.CRITICAL, GAP_PRIORITIES.HIGH]).toContain(dockerGap.priority);

    // 6. Recommendation Engine Migration Integration
    const recommendations = generateRecommendations(gapAnalysis.gaps, targetRole);
    expect(recommendations.length).toBe(gapAnalysis.gapsCount);

    // Verify priority hierarchy sorting: Critical -> High -> Medium -> Low
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    for (let i = 0; i < recommendations.length - 1; i++) {
      expect(priorityOrder[recommendations[i].priority]).toBeLessThanOrEqual(
        priorityOrder[recommendations[i + 1].priority]
      );
    }

    // Verify that Met Requirement skill does NOT receive unnecessary recommendations
    expect(recommendations.some((r) => r.canonicalName === "JavaScript")).toBe(false);

    // Verify Docker recommendation provides official docs and tailored action
    const dockerRec = recommendations.find((r) => r.canonicalName === "Docker");
    expect(dockerRec).toBeDefined();
    expect(dockerRec.documentationUrl).toBe(AUTHORITATIVE_DOCS["Docker"]);
    expect(dockerRec.learningObjective).toContain("containerization");
    expect(dockerRec.practicalAction).toContain("Dockerfile");
    expect(dockerRec.reasoning).toContain("Docker is required for Full Stack Developer");

    // Verify Stack recommendation provides coding practice sandbox mapping
    const stackRec = recommendations.find((r) => r.canonicalName === "Stack");
    if (stackRec) {
      expect(stackRec.platformTaskId).toBe(VERIFIED_CODING_TASKS["Stack"].taskId);
      expect(stackRec.platformTaskTitle).toBe(VERIFIED_CODING_TASKS["Stack"].taskTitle);
    }

    // 7. Determinism Validation: Repeated pipeline execution yields identical scores, gaps and recommendations
    const run2Eval = evaluateEvidencePackages([resumePackage, githubPackage, codingPackage]);
    const run2Gaps = analyzeSkillGaps(run2Eval.skills, targetRole);
    const run2Recs = generateRecommendations(run2Gaps.gaps, targetRole);

    const stripTimestamps = (skills) =>
      skills.map(({ lastAssessedAt, evidence, ...rest }) => rest);

    expect(stripTimestamps(evaluation.skills)).toEqual(stripTimestamps(run2Eval.skills));
    expect(gapAnalysis.gaps).toEqual(run2Gaps.gaps);
    expect(recommendations).toEqual(run2Recs);
  });
});
