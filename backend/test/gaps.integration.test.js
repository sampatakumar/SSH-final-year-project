import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  analyzeSkillGaps,
  compareRoles,
  GAP_STATUSES,
  GAP_PRIORITIES,
} from "../src/modules/gaps/services/skillGap.service.js";
import {
  TARGET_ROLES,
  ROLE_REQUIREMENTS,
} from "../src/modules/gaps/benchmarks/roleRequirements.js";
import { evaluateEvidencePackages } from "../src/modules/skills/services/evaluation.engine.js";
import { extractResumeEvidence } from "../src/modules/resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";

describe("Step 6: Gap Analysis Module Verification Suite", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  // 1. Valid Target Role & Gap Detection
  describe("Role Benchmarking & Gap Detection", () => {
    it("1. analyzes skill gaps against valid target role (Full Stack Developer)", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient", category: "Languages" },
        { canonicalName: "React", score: 80, level: "Proficient", category: "Frontend" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.targetRole).toBe("Full Stack Developer");
      expect(result.totalRequiredSkills).toBeGreaterThanOrEqual(10);
      expect(result.metSkillsCount).toBe(2);
      expect(result.gapsCount).toBeGreaterThan(0);
      expect(result.benchmarkPending).toBe(false);
      expect(result.benchmarkStatus).toBe("validated");
    });

    it("2. handles unknown target role without crashing or falsely claiming Full Stack Developer", () => {
      const evaluatedSkills = [{ canonicalName: "JavaScript", score: 80, level: "Proficient" }];
      const result = analyzeSkillGaps(evaluatedSkills, "NonExistentRole123");
      expect(result).toBeDefined();
      expect(result.targetRole).toBe("NonExistentRole123");
      expect(result.benchmarkPending).toBe(true);
      expect(result.benchmarkStatus).toBe("unknown_role");
      expect(result.roleMatchPercentage).toBeNull();
      expect(result.totalRequiredSkills).toBe(0);
      expect(result.gaps).toEqual([]);
    });

    it("2b. accurately evaluates non-computing catalog role (Robotics Engineer) with validated rubric and domain skills", () => {
      const evaluatedSkills = [
        { canonicalName: "Python", score: 85, level: "Proficient", category: "Languages" },
      ];
      const result = analyzeSkillGaps(evaluatedSkills, "Robotics Engineer");
      expect(result).toBeDefined();
      expect(result.targetRole).toBe("Robotics Engineer");
      expect(result.benchmarkPending).toBe(false);
      expect(result.benchmarkStatus).toBe("validated");
      
      // Crucial verification: zero React, Node.js, or HTML gaps
      const hasUnrelatedWebGaps = result.gaps.some((g) =>
        ["React", "Node.js", "HTML", "CSS", "Tailwind CSS"].includes(g.canonicalName)
      );
      expect(hasUnrelatedWebGaps).toBe(false);

      // Core skills from validated rubric are present
      const requiredNames = result.gaps.map((g) => g.canonicalName).concat(result.metSkills.map((s) => s.canonicalName));
      expect(requiredNames).toContain("Robot Kinematics");
      expect(requiredNames).toContain("ROS 2");
      expect(result.metSkills.some((s) => s.canonicalName === "Python")).toBe(true);
    });

    it("2c. accurately evaluates catalog role without detailed rubric (e.g. Laboratory Analyst) with benchmark_pending status", () => {
      const evaluatedSkills = [
        { canonicalName: "Sample Preparation", score: 80, level: "Proficient" },
      ];
      const result = analyzeSkillGaps(evaluatedSkills, "Laboratory Analyst");
      expect(result).toBeDefined();
      expect(result.targetRole).toBe("Laboratory Analyst");
      expect(result.benchmarkPending).toBe(true);
      expect(result.benchmarkStatus).toBe("benchmark_pending");
      expect(result.benchmarkNotice).toContain("Detailed proficiency rubric is currently pending");
      
      // Zero unrelated web development gaps
      const hasUnrelatedWebGaps = result.gaps.some((g) =>
        ["React", "Node.js", "HTML", "CSS", "Tailwind CSS"].includes(g.canonicalName)
      );
      expect(hasUnrelatedWebGaps).toBe(false);
    });
  });

  // 2. Missing vs Weak Skill Classification
  describe("Missing vs Weak Skill Classification", () => {
    it("3. correctly classifies completely undetected skills as Missing", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const missingNode = result.gaps.find((g) => g.canonicalName === "Node.js");

      expect(missingNode).toBeDefined();
      expect(missingNode.status).toBe(GAP_STATUSES.MISSING);
      expect(missingNode.currentScore).toBe(0);
      expect(missingNode.currentLevel).toBe("None");
    });

    it("4. correctly classifies sub-benchmark skills as Weak / Action Required", () => {
      const evaluatedSkills = [
        { canonicalName: "Docker", score: 25, level: "Limited Evidence" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const weakDocker = result.gaps.find((g) => g.canonicalName === "Docker");

      expect(weakDocker).toBeDefined();
      expect(weakDocker.status).toBe(GAP_STATUSES.WEAK);
      expect(weakDocker.currentScore).toBe(25);
      expect(weakDocker.currentLevel).toBe("Limited Evidence");
    });

    it("5 & 6 & 7. correctly classifies skills meeting or exceeding benchmark as Met Requirement", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 95, level: "Strong Evidence" }, // Above
        { canonicalName: "React", score: 75, level: "Proficient" },           // Exactly at
        { canonicalName: "TypeScript", score: 65, level: "Competent" },        // Exactly at
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.metSkills.some((s) => s.canonicalName === "JavaScript")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "React")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "TypeScript")).toBe(true);
      expect(result.gaps.some((g) => g.canonicalName === "JavaScript")).toBe(false);
    });
  });

  // 3. Priority Calculation & Multiple Gaps
  describe("Priority Hierarchy & Multiple Gaps", () => {
    it("8 & 9 & 10. calculates critical, high, medium, and low priorities and sorts them deterministically", () => {
      const evaluatedSkills = [
        { canonicalName: "TypeScript", score: 25, level: "Limited Evidence" },
        { canonicalName: "Docker", score: 25, level: "Limited Evidence" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.gaps.length).toBeGreaterThan(5);

      // Verify sorting: Critical -> High -> Medium -> Low
      const priorities = result.gaps.map((g) => g.priority);
      const priorityOrder = {
        [GAP_PRIORITIES.CRITICAL]: 0,
        [GAP_PRIORITIES.HIGH]: 1,
        [GAP_PRIORITIES.MEDIUM]: 2,
        [GAP_PRIORITIES.LOW]: 3,
      };

      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]]);
      }
    });
  });

  // 4. Canonical Skill Normalization & Aliases
  describe("Taxonomy Normalization in Gap Engine", () => {
    it("11 & 12. normalizes alias inputs ('js', 'react.js') to canonical role requirement matches", () => {
      const evaluatedSkills = [
        { canonicalName: "js", score: 85, level: "Proficient" },
        { canonicalName: "react.js", score: 80, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.metSkills.some((s) => s.canonicalName === "JavaScript")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "React")).toBe(true);
    });
  });

  // 5. Edge Cases & Missing Skill Profile
  describe("Edge Cases & Empty Profile", () => {
    it("13 & 14. handles empty evaluated skills array by marking all role skills as missing", () => {
      const result = analyzeSkillGaps([], TARGET_ROLES.FRONTEND_ENGINEER);
      expect(result.roleMatchPercentage).toBe(0);
      expect(result.metSkillsCount).toBe(0);
      expect(result.gapsCount).toBe(result.totalRequiredSkills);
      expect(result.gaps.every((g) => g.status === GAP_STATUSES.MISSING)).toBe(true);
    });
  });

  // 6. Determinism & Benchmark Regression
  describe("Determinism & Benchmark Regression", () => {
    it("18. produces 100% identical gap analyses across repeated executions", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient" },
        { canonicalName: "React", score: 70, level: "Competent" },
      ];

      const run1 = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const run2 = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);

      expect(run1.roleMatchPercentage).toBe(run2.roleMatchPercentage);
      expect(run1.gapsCount).toBe(run2.gapsCount);
      expect(run1.metSkillsCount).toBe(run2.metSkillsCount);
      expect(run1.gaps).toEqual(run2.gaps);
    });

    it("19. verifies benchmark requirements exist for all supported target roles (24 roles catalogue)", () => {
      const supportedRoles = Object.values(TARGET_ROLES);
      expect(supportedRoles.length).toBeGreaterThanOrEqual(24);

      for (const role of supportedRoles) {
        const config = ROLE_REQUIREMENTS[role];
        expect(config).toBeDefined();
        expect(config.roleName).toBe(role);
        expect(config.coreSkills.length).toBeGreaterThanOrEqual(4);
        expect(Array.isArray(config.recommendedSkills)).toBe(true);
      }
    });

    it("verifies dynamic role switching between diverse career roles (e.g. DevOps vs AI vs Full Stack)", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient" },
        { canonicalName: "Docker", score: 80, level: "Proficient" },
        { canonicalName: "Linux", score: 75, level: "Proficient" },
      ];

      // Switch to DevOps Engineer
      const devopsAnalysis = analyzeSkillGaps(evaluatedSkills, "DevOps Engineer");
      expect(devopsAnalysis.targetRole).toBe("DevOps Engineer");
      expect(devopsAnalysis.metSkills.some((s) => s.canonicalName === "Docker")).toBe(true);

      // Switch to AI Application Developer
      const aiAnalysis = analyzeSkillGaps(evaluatedSkills, "AI Application Developer");
      expect(aiAnalysis.targetRole).toBe("AI Application Developer");
      expect(aiAnalysis.gaps.some((g) => g.canonicalName === "TypeScript")).toBe(true);
    });
  });

  // 7. End-to-End Pipeline: Real Evidence -> Skill Evaluation -> Gap Analysis
  describe("20. End-to-End Cross-Module Integration Pipeline", () => {
    it("consumes real Skill Profile from Skills module and computes accurate gaps", () => {
      // 1. Real Resume adapter output
      const resumePkg = extractResumeEvidence({
        userId: dummyUserId,
        userProfile: {
          skillLanguages: ["JavaScript", "TypeScript"],
          skillFrameworks: ["React"],
        },
      });

      // 2. Real GitHub adapter output
      const ghPkg = extractGitHubEvidence({
        userId: dummyUserId,
        githubData: {
          languages: { JavaScript: { size: 45000, percentage: 80, repoCount: 1 } },
          repositories: [{ name: "my-app", language: "JavaScript", fork: false, stars: 2 }],
        },
      });

      // 3. Real Coding adapter output
      const codingPkg = extractCodingEvidence({
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
            skillsCovered: ["JavaScript", "Arrays"],
          },
        ],
      });

      // 4. Skills Module Evaluation
      const skillEvaluation = evaluateEvidencePackages([resumePkg, ghPkg, codingPkg]);
      expect(skillEvaluation.skillsCount).toBeGreaterThanOrEqual(3);

      // 5. Gaps Module Analysis
      const gapReport = analyzeSkillGaps(skillEvaluation.skills, TARGET_ROLES.FULL_STACK_DEVELOPER);

      expect(gapReport.targetRole).toBe("Full Stack Developer");
      expect(gapReport.metSkillsCount).toBeGreaterThanOrEqual(1); // JavaScript met
      expect(gapReport.gapsCount).toBeGreaterThan(0); // Node.js, MongoDB, REST APIs missing

      const jsMet = gapReport.metSkills.find((s) => s.canonicalName === "JavaScript");
      expect(jsMet).toBeDefined();
      expect(jsMet.currentScore).toBeGreaterThanOrEqual(75);

      const nodeGap = gapReport.gaps.find((g) => g.canonicalName === "Node.js");
      expect(nodeGap).toBeDefined();
      expect(nodeGap.status).toBe(GAP_STATUSES.MISSING);
    });
  });

  // 8. API Routes & Authentication
  describe("15 & 16 & 17. Gap Analysis API Routes & Security", () => {
    it("serves public GET /api/v1/gaps/roles endpoint", async () => {
      const res = await request(app).get("/api/v1/gaps/roles");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.roles)).toBe(true);
      expect(res.body.data.roles.length).toBeGreaterThanOrEqual(24);
    });

    it("15. rejects unauthenticated GET /api/v1/gaps with 401", async () => {
      const res = await request(app).get("/api/v1/gaps");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("15. rejects unauthenticated POST /api/v1/gaps/analyze with 401", async () => {
      const res = await request(app).post("/api/v1/gaps/analyze").send({
        targetRole: "Full Stack Developer",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 9. Phase 9 Multi-Branch Benchmark Rubrics
  describe("Phase 9 Multi-Branch Benchmark Rubrics Verification", () => {
    const phase9Roles = [
      "Embedded Systems Engineer",
      "VLSI Design Engineer",
      "IoT Developer",
      "Power Systems Engineer",
      "Control Systems Engineer",
      "CAD/CAM Engineer",
      "Robotics Engineer",
      "Structural Design Engineer",
      "BIM Specialist",
      "Financial Analyst",
      "Business Intelligence Analyst",
    ];

    it("verifies all 11 multi-branch roles have validated benchmarks defined with observable evidence and scoring", () => {
      for (const roleName of phase9Roles) {
        const config = ROLE_REQUIREMENTS[roleName];
        expect(config, `Missing rubric for ${roleName}`).toBeDefined();
        expect(config.roleName).toBe(roleName);
        expect(config.coreSkills.length).toBeGreaterThanOrEqual(4);
        expect(Array.isArray(config.recommendedSkills)).toBe(true);

        for (const skillReq of config.coreSkills) {
          expect(skillReq.skill).toBeDefined();
          expect(["critical", "high", "medium"]).toContain(skillReq.importance);
          expect(skillReq.observableEvidence).toBeDefined();
          expect(typeof skillReq.observableEvidence).toBe("string");
        }
      }
    });

    it("evaluates Electronics student against Embedded Systems Engineer with domain skills and evidence links", () => {
      const evaluatedSkills = [
        { canonicalName: "Embedded C", score: 85, level: "Proficient" },
        { canonicalName: "RTOS", score: 75, level: "Proficient" },
        { canonicalName: "ARM Cortex", score: 80, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, "Embedded Systems Engineer");
      expect(result.benchmarkPending).toBe(false);
      expect(result.benchmarkStatus).toBe("validated");
      expect(result.metSkillsCount).toBe(3);
      expect(result.roleMatchPercentage).toBe(30);

      // Gaps have valid observable evidence and EduTube learning links
      const missingI2c = result.gaps.find((g) => g.canonicalName === "UART/SPI/I2C" || g.canonicalName === "I2C / SPI / UART");
      expect(missingI2c).toBeDefined();
      expect(missingI2c.observableEvidence).toContain("Logic analyzer traces");
      expect(missingI2c.learningRoute).toContain("/dashboard/edutube?search=");
    });

    it("evaluates Civil student against Structural Design Engineer with domain software benchmarks", () => {
      const evaluatedSkills = [
        { canonicalName: "STAAD.Pro", score: 85, level: "Proficient" },
        { canonicalName: "ETABS", score: 80, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, "Structural Design Engineer");
      expect(result.benchmarkPending).toBe(false);
      expect(result.benchmarkStatus).toBe("validated");
      expect(result.metSkills.some((s) => s.canonicalName === "STAAD.Pro")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "ETABS")).toBe(true);
      
      const rccGap = result.gaps.find((g) => g.canonicalName === "Reinforced Concrete Design" || g.canonicalName === "RCC Design");
      expect(rccGap).toBeDefined();
      expect(rccGap.observableEvidence).toContain("structural drawings");
    });

    it("evaluates Finance student against Financial Analyst with domain valuation benchmarks", () => {
      const evaluatedSkills = [
        { canonicalName: "Financial Modeling", score: 90, level: "Strong Evidence" },
        { canonicalName: "Excel", score: 85, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, "Financial Analyst");
      expect(result.benchmarkPending).toBe(false);
      expect(result.metSkills.some((s) => s.canonicalName === "Financial Modeling")).toBe(true);
      expect(result.gaps.some((g) => g.canonicalName === "DCF Valuation")).toBe(true);
    });
  });

  // 10. Phase 9 Aliases and Technology Separation
  describe("Phase 9 Domain Aliases & Strict Technology Distinction", () => {
    it("correctly resolves multi-branch tool aliases to canonical skill names", () => {
      const evaluatedSkills = [
        { canonicalName: "ros", score: 80, level: "Proficient" },
        { canonicalName: "staad", score: 85, level: "Proficient" },
        { canonicalName: "revit", score: 75, level: "Proficient" },
        { canonicalName: "powerbi", score: 90, level: "Proficient" },
        { canonicalName: "dcf", score: 80, level: "Proficient" },
        { canonicalName: "simulink", score: 85, level: "Proficient" },
      ];

      const roboticsResult = analyzeSkillGaps(evaluatedSkills, "Robotics Engineer");
      expect(roboticsResult.metSkills.some((s) => s.canonicalName === "ROS 2")).toBe(true);

      const civilResult = analyzeSkillGaps(evaluatedSkills, "Structural Design Engineer");
      expect(civilResult.metSkills.some((s) => s.canonicalName === "STAAD.Pro")).toBe(true);

      const bimResult = analyzeSkillGaps(evaluatedSkills, "BIM Specialist");
      expect(bimResult.metSkills.some((s) => s.canonicalName === "Autodesk Revit")).toBe(true);

      const biResult = analyzeSkillGaps(evaluatedSkills, "Business Intelligence Analyst");
      expect(biResult.metSkills.some((s) => s.canonicalName === "Power BI")).toBe(true);

      const financeResult = analyzeSkillGaps(evaluatedSkills, "Financial Analyst");
      expect(financeResult.metSkills.some((s) => s.canonicalName === "DCF Valuation")).toBe(true);

      const controlResult = analyzeSkillGaps(evaluatedSkills, "Control Systems Engineer");
      expect(controlResult.metSkills.some((s) => s.canonicalName === "MATLAB / Simulink")).toBe(true);
    });

    it("does not treat distinct technologies as interchangeable (e.g. C++ != Python, SolidWorks != AutoCAD)", () => {
      const evaluatedSkills = [
        { canonicalName: "Python", score: 90, level: "Strong Evidence" },
      ];

      const roboticsResult = analyzeSkillGaps(evaluatedSkills, "Robotics Engineer");
      // Python is met
      expect(roboticsResult.metSkills.some((s) => s.canonicalName === "Python")).toBe(true);
      // But C++ remains a gap and is NOT falsely satisfied by Python
      expect(roboticsResult.gaps.some((g) => g.canonicalName === "C++")).toBe(true);

      const cadSkills = [
        { canonicalName: "AutoCAD", score: 85, level: "Proficient" },
      ];
      const cadResult = analyzeSkillGaps(cadSkills, "CAD/CAM Engineer");
      expect(cadResult.metSkills.some((s) => s.canonicalName === "AutoCAD")).toBe(true);
      // SolidWorks remains a gap and is NOT satisfied by AutoCAD
      expect(cadResult.gaps.some((g) => g.canonicalName === "SolidWorks")).toBe(true);
    });
  });

  // 11. Multi-Role Comparison Engine
  describe("Phase 9 Multi-Role Comparison Engine", () => {
    it("compares multiple roles and identifies shared skills, role-specific skills, and high-leverage skills", () => {
      const evaluatedSkills = [
        { canonicalName: "Python", score: 85, level: "Proficient" },
        { canonicalName: "C++", score: 80, level: "Proficient" },
        { canonicalName: "Embedded Systems", score: 75, level: "Proficient" },
      ];

      const targetRoles = [
        "Robotics Engineer",
        "Embedded Systems Engineer",
        "IoT Developer",
      ];

      const comparison = compareRoles(evaluatedSkills, targetRoles);

      expect(comparison).toBeDefined();
      expect(comparison.rolesCount).toBe(3);
      expect(comparison.rolesSummary.length).toBe(3);

      // Verify roles summary independent readiness
      const roboticsSummary = comparison.rolesSummary.find((r) => r.roleName === "Robotics Engineer");
      const embeddedSummary = comparison.rolesSummary.find((r) => r.roleName === "Embedded Systems Engineer");
      const iotSummary = comparison.rolesSummary.find((r) => r.roleName === "IoT Developer");

      expect(roboticsSummary).toBeDefined();
      expect(embeddedSummary).toBeDefined();
      expect(iotSummary).toBeDefined();

      expect(roboticsSummary.benchmarkStatus).toBe("validated");
      expect(embeddedSummary.benchmarkStatus).toBe("validated");
      expect(iotSummary.benchmarkStatus).toBe("validated");

      // Verify shared skills
      expect(Array.isArray(comparison.sharedSkills)).toBe(true);

      // Verify high-leverage skills (skills that unlock progress in 2+ roles)
      expect(Array.isArray(comparison.highLeverageSkills)).toBe(true);
      for (const skill of comparison.highLeverageSkills) {
        expect(skill.roleCount).toBeGreaterThanOrEqual(2);
        expect(Array.isArray(skill.roles)).toBe(true);
      }

      // Verify role-specific skills
      expect(comparison.roleSpecificSkills).toBeDefined();
      expect(Array.isArray(comparison.roleSpecificSkills["Robotics Engineer"])).toBe(true);
      const roboticsSpecific = comparison.roleSpecificSkills["Robotics Engineer"];
      expect(roboticsSpecific.some((s) => s.canonicalName === "Robot Kinematics" || s.canonicalName === "ROS 2")).toBe(true);

      // Verify top combined gaps
      expect(Array.isArray(comparison.topCombinedGaps)).toBe(true);
      expect(comparison.topCombinedGaps.length).toBeGreaterThan(0);
    });

    it("gracefully handles single role or empty roles input in compareRoles", () => {
      const evaluatedSkills = [{ canonicalName: "Python", score: 85, level: "Proficient" }];
      
      // Single role
      const singleComp = compareRoles(evaluatedSkills, ["Robotics Engineer"]);
      expect(singleComp.rolesCount).toBe(1);
      expect(singleComp.rolesSummary.length).toBe(1);
      expect(singleComp.highLeverageSkills).toEqual([]);

      // Empty roles
      const emptyComp = compareRoles(evaluatedSkills, []);
      expect(emptyComp.rolesCount).toBe(0);
      expect(emptyComp.rolesSummary).toEqual([]);
      expect(emptyComp.topCombinedGaps).toEqual([]);
    });

    it("rejects unauthenticated GET /api/v1/gaps/compare with 401", async () => {
      const res = await request(app).get("/api/v1/gaps/compare?roles=Robotics%20Engineer,IoT%20Developer");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated POST /api/v1/gaps/compare with 401", async () => {
      const res = await request(app).post("/api/v1/gaps/compare").send({
        roles: ["Robotics Engineer", "IoT Developer"],
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
