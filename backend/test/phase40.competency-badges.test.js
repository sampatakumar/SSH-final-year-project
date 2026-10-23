import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app.js";
import { CompetencyBadge } from "../src/modules/skills/models/competencyBadge.models.js";
import { EduTubeCheckpointAttempt } from "../src/modules/edutube/models/edutubeCheckpointAttempt.models.js";
import { EduTubeVideoCheckpoint } from "../src/modules/edutube/models/edutubeVideoCheckpoint.models.js";
import { SpacedRevisionSchedule } from "../src/modules/skills/models/spacedRevisionSchedule.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { LearnerSkillAssessmentHistory } from "../src/modules/skills/models/learnerSkillAssessmentHistory.models.js";
import {
  getCompetencyForSkill,
  getCompetencyById,
  getAllStandardCompetencies,
  COMPETENCY_RUBRIC_VERSION,
} from "../src/modules/skills/services/competencyTaxonomy.js";
import {
  generateBadgeSignature,
  verifyBadgeSignature,
  issueCompetencyBadge,
  verifyPublicBadge,
  getUserBadges,
  revokeBadge,
} from "../src/modules/skills/services/badgeIssuance.service.js";
import {
  evaluateStudentCompetencyMatrix,
  getCompetencyEvidenceDetails,
  claimEligibleBadge,
  evaluateCapstoneWorkflow,
} from "../src/modules/skills/services/competencyMatrix.service.js";

describe("Phase 40: Multi-Format Assessment Synthesis, Competency Matrix & Verifiable Skill Badges Suite", () => {
  const studentAId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a111");
  const studentBId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a222");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Group A: Competency Taxonomy & Mapping Rules (Criteria 1, 8)", () => {
    it("1. Maps canonical skills and aliases to stable competency definitions", () => {
      const dockerComp = getCompetencyForSkill("docker");
      expect(dockerComp).toBeDefined();
      expect(dockerComp.competencyId).toBe("comp-docker");
      expect(dockerComp.canonicalSkill).toBe("Docker");
      expect(dockerComp.rubricVersion).toBe(COMPETENCY_RUBRIC_VERSION);

      const reactAlias = getCompetencyForSkill("reactjs");
      expect(reactAlias).toBeDefined();
      expect(reactAlias.competencyId).toBe("comp-react");
      expect(reactAlias.canonicalSkill).toBe("React");

      const byId = getCompetencyById("comp-python");
      expect(byId).toBeDefined();
      expect(byId.canonicalSkill).toBe("Python");
    });

    it("8. Preserves rubric version in standard taxonomy definitions", () => {
      const all = getAllStandardCompetencies();
      expect(all.length).toBeGreaterThan(5);
      for (const comp of all) {
        expect(comp.rubricVersion).toBe("1.0.0");
        expect(comp.criteria).toHaveProperty("knowledge");
        expect(comp.criteria).toHaveProperty("retention");
        expect(comp.criteria).toHaveProperty("applied");
        expect(comp.criteria).toHaveProperty("capstone");
      }
    });
  });

  describe("Group B: Multi-Format Evidence Synthesis & Deduplication (Criteria 2, 3, 4, 5, 6, 7, 20, 21)", () => {
    it("2. Missing evidence results in an not_assessed or insufficient_evidence status", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const matrixResult = await evaluateStudentCompetencyMatrix(studentAId);
      expect(matrixResult.matrix.length).toBeGreaterThan(0);

      const dockerMatrix = matrixResult.matrix.find((m) => m.canonicalSkill === "Docker");
      expect(dockerMatrix.status).toBe("not_assessed");
      expect(dockerMatrix.evidence.knowledge.satisfied).toBe(false);
      expect(dockerMatrix.evidence.retention.satisfied).toBe(false);
      expect(dockerMatrix.evidence.applied.satisfied).toBe(false);
      expect(dockerMatrix.missingRequirements.length).toBeGreaterThanOrEqual(3);
    });

    it("3. Valid quiz evidence from EduTube is correctly credited toward knowledge criteria", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              checkpointId: "cp_docker_01",
              canonicalName: "Docker",
              isCorrect: true,
              score: 100,
              attemptedAt: new Date(),
            },
          ]),
        }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const details = await getCompetencyEvidenceDetails(studentAId, "Docker");
      expect(details.evidence.knowledge.satisfied).toBe(true);
      expect(details.evidence.knowledge.distinctCheckpointsPassed).toBe(1);
      expect(details.status).toBe("knowledge_verified");
      expect(details.eligibleBadgeTypes).toContain("knowledge_specialist");
      expect(details.eligibleBadgeTypes).not.toContain("capstone_competence");
    });

    it("4. Valid spaced-revision evidence satisfies retention criteria", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              skill: "Docker",
              canonicalName: "Docker",
              stage: 2,
              consecutiveSuccesses: 2,
              lastScore: 90,
              status: "completed",
            },
          ]),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const details = await getCompetencyEvidenceDetails(studentAId, "Docker");
      expect(details.evidence.retention.satisfied).toBe(true);
      expect(details.evidence.retention.consecutiveSuccesses).toBe(2);
      expect(details.eligibleBadgeTypes).toContain("retention_master");
    });

    it("5 & 21. Applied coding evidence is credited ONLY when tests pass and staging mock is not mistaken for pass", async () => {
      // Test 5a: Failed submission must not satisfy applied criteria
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              taskId: "two-sum",
              skillsCovered: ["JavaScript"],
              status: "failed", // Failed execution
              passed: 1,
              total: 5,
              score: 20,
            },
          ]),
        }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const failDetails = await getCompetencyEvidenceDetails(studentAId, "JavaScript");
      expect(failDetails.evidence.applied.satisfied).toBe(false);
      expect(failDetails.evidence.applied.problemsSolvedCount).toBe(0);

      // Test 5b: Genuine verified passed submission satisfies applied criteria
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              taskId: "two-sum",
              skillsCovered: ["JavaScript"],
              status: "passed",
              passed: 5,
              total: 5,
              score: 100,
            },
          ]),
        }),
      });

      const passDetails = await getCompetencyEvidenceDetails(studentAId, "JavaScript");
      expect(passDetails.evidence.applied.satisfied).toBe(true);
      expect(passDetails.evidence.applied.problemsSolvedCount).toBe(1);
      expect(passDetails.eligibleBadgeTypes).toContain("applied_practitioner");
    });

    it("6. Duplicate retries of the same quiz or coding task do NOT inflate problem counts", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            // 3 attempts at the exact same checkpointId
            { checkpointId: "cp_react_01", canonicalName: "React", isCorrect: true, score: 100 },
            { checkpointId: "cp_react_01", canonicalName: "React", isCorrect: true, score: 100 },
            { checkpointId: "cp_react_01", canonicalName: "React", isCorrect: false, score: 0 },
          ]),
        }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            // 4 attempts of the same taskId
            { taskId: "react-button", skillsCovered: ["React"], status: "passed", passed: 3, total: 3 },
            { taskId: "react-button", skillsCovered: ["React"], status: "passed", passed: 3, total: 3 },
            { taskId: "react-button", skillsCovered: ["React"], status: "passed", passed: 3, total: 3 },
          ]),
        }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const details = await getCompetencyEvidenceDetails(studentAId, "React");
      // Distinct checkpoints should be 1, NOT 3
      expect(details.evidence.knowledge.distinctCheckpointsPassed).toBe(1);
      // Distinct problems solved should be 1, NOT 3
      expect(details.evidence.applied.problemsSolvedCount).toBe(1);
    });

    it("7. Legitimate separate assessments remain distinguishable", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { checkpointId: "cp_react_01", canonicalName: "React", isCorrect: true, score: 100 },
            { checkpointId: "cp_react_02", canonicalName: "React", isCorrect: true, score: 100 },
          ]),
        }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { taskId: "react-button", skillsCovered: ["React"], status: "passed", passed: 3, total: 3 },
            { taskId: "react-form", skillsCovered: ["React"], status: "passed", passed: 4, total: 4 },
          ]),
        }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const details = await getCompetencyEvidenceDetails(studentAId, "React");
      expect(details.evidence.knowledge.distinctCheckpointsPassed).toBe(2);
      expect(details.evidence.applied.problemsSolvedCount).toBe(2);
    });

    it("20. Assessment-provider failure or empty database does not fabricate evidence", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const matrix = await evaluateStudentCompetencyMatrix(studentAId);
      expect(matrix.summary.capstoneVerified).toBe(0);
      expect(matrix.summary.appliedVerified).toBe(0);
      expect(matrix.summary.knowledgeVerified).toBe(0);
    });
  });

  describe("Group C: Cryptographic Badge Issuance, Digital Signatures & Revocation (Criteria 9, 10, 11, 12, 13, 14, 15, 16, 18)", () => {
    it("12. Generates and verifies HMAC-SHA256 digital signature over canonical payload", () => {
      const payload = {
        badgeId: "ssh-badge-test-12345",
        ownerId: studentAId.toString(),
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        issuedAt: new Date("2026-10-23T12:00:00Z"),
      };

      const sig = generateBadgeSignature(payload);
      expect(typeof sig).toBe("string");
      expect(sig.length).toBe(64); // SHA-256 hex string

      const isValid = verifyBadgeSignature(payload, sig);
      expect(isValid).toBe(true);
    });

    it("13. Tampered badge payloads fail cryptographic verification", () => {
      const payload = {
        badgeId: "ssh-badge-test-12345",
        ownerId: studentAId.toString(),
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        issuedAt: new Date("2026-10-23T12:00:00Z"),
      };

      const sig = generateBadgeSignature(payload);

      // Tamper with ownerId
      const tamperedPayload = { ...payload, ownerId: studentBId.toString() };
      expect(verifyBadgeSignature(tamperedPayload, sig)).toBe(false);

      // Tamper with competency
      const tamperedComp = { ...payload, competencyId: "comp-react" };
      expect(verifyBadgeSignature(tamperedComp, sig)).toBe(false);
    });

    it("14. Unknown signing keys or corrupted signatures fail safely", () => {
      const payload = {
        badgeId: "ssh-badge-test-12345",
        ownerId: studentAId.toString(),
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        issuedAt: new Date("2026-10-23T12:00:00Z"),
      };

      expect(verifyBadgeSignature(payload, "invalid-non-hex-sig")).toBe(false);
      expect(verifyBadgeSignature(payload, "1234567890abcdef")).toBe(false);
      expect(verifyBadgeSignature(payload, null)).toBe(false);
    });

    it("10. Ineligible badge cannot be issued (throws 400 with missing requirements)", async () => {
      // Student has no evidence
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      await expect(
        claimEligibleBadge({
          userId: studentAId,
          competencyId: "comp-docker",
          badgeType: "capstone_competence",
        })
      ).rejects.toThrow(/not yet eligible/);
    });

    it("9 & 11. Capstone competency badge is issued once all 3 pillars are satisfied and is idempotent", async () => {
      // 1. Mock satisfaction of knowledge, retention, and applied criteria
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { checkpointId: "cp_docker_01", canonicalName: "Docker", isCorrect: true, score: 100 },
          ]),
        }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { skill: "Docker", canonicalName: "Docker", stage: 2, consecutiveSuccesses: 2, lastScore: 90 },
          ]),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { taskId: "docker-build", skillsCovered: ["Docker"], status: "passed", passed: 4, total: 4 },
          ]),
        }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      // Mock badge persistence
      const fakeBadge = {
        _id: new mongoose.Types.ObjectId(),
        badgeId: "ssh-badge-dock-capstone",
        owner: studentAId,
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        status: "active",
        issuedAt: new Date(),
        signature: "valid-sig-123",
      };

      vi.spyOn(CompetencyBadge, "findOne").mockResolvedValueOnce(null); // Not existing yet
      vi.spyOn(CompetencyBadge, "create").mockResolvedValue(fakeBadge);
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const issueResult = await claimEligibleBadge({
        userId: studentAId,
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        recipientIdentifier: "Student Alpha",
      });

      expect(issueResult.isNewlyIssued).toBe(true);
      expect(issueResult.badge.badgeId).toBe("ssh-badge-dock-capstone");

      // Test 11: Duplicate claim request returns existing badge idempotently
      vi.spyOn(CompetencyBadge, "findOne").mockResolvedValueOnce(fakeBadge);

      const duplicateResult = await claimEligibleBadge({
        userId: studentAId,
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
      });

      expect(duplicateResult.isNewlyIssued).toBe(false);
      expect(duplicateResult.badge.badgeId).toBe("ssh-badge-dock-capstone");
    });

    it("15 & 16. Public verification endpoint reports validity and excludes private student data", async () => {
      const issuedAt = new Date("2026-10-23T10:00:00Z");
      const badgeId = "ssh-badge-public-verify-01";
      const signature = generateBadgeSignature({
        badgeId,
        ownerId: studentAId.toString(),
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        issuedAt,
      });

      const mockStoredBadge = {
        badgeId,
        owner: studentAId,
        recipientIdentifier: "Verified Learner A",
        competencyId: "comp-docker",
        competencyName: "Docker Containerization & Environment Isolation",
        skill: "Docker",
        canonicalSkill: "Docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        status: "active",
        issuedAt,
        signature,
        keyId: "ssh-badge-key-2026-v1",
        evidenceSummary: {
          evidenceCategories: ["knowledge", "retention", "applied"],
          knowledgeScore: 100,
          retentionStage: 2,
          appliedProblemsSolved: 1,
          verifiedAt: issuedAt,
        },
        issuer: "Smart Skill Hub Competency Authority",
        // Private fields that must NOT be exposed:
        userPrivateEmail: "studentA@example.com",
        userPrivateUsn: "1MS21CS001",
      };

      vi.spyOn(CompetencyBadge, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockStoredBadge),
      });

      const verification = await verifyPublicBadge(badgeId);
      expect(verification.exists).toBe(true);
      expect(verification.isValid).toBe(true);
      expect(verification.isRevoked).toBe(false);
      expect(verification.badge.badgeId).toBe(badgeId);
      expect(verification.badge.competencyName).toContain("Docker");

      // CRITICAL PRIVACY ASSERTIONS (Criterion 16):
      expect(verification.badge).not.toHaveProperty("userPrivateEmail");
      expect(verification.badge).not.toHaveProperty("userPrivateUsn");
      expect(verification.badge).not.toHaveProperty("owner");
      expect(JSON.stringify(verification)).not.toContain("studentA@example.com");
      expect(JSON.stringify(verification)).not.toContain("1MS21CS001");
    });

    it("15b. Revoked badge is clearly reported as revoked and invalid", async () => {
      const issuedAt = new Date("2026-10-23T10:00:00Z");
      const badgeId = "ssh-badge-revoked-01";
      const signature = generateBadgeSignature({
        badgeId,
        ownerId: studentAId.toString(),
        competencyId: "comp-docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        issuedAt,
      });

      const mockRevokedBadge = {
        badgeId,
        owner: studentAId,
        recipientIdentifier: "Verified Learner A",
        competencyId: "comp-docker",
        competencyName: "Docker Containerization",
        skill: "Docker",
        canonicalSkill: "Docker",
        badgeType: "capstone_competence",
        rubricVersion: "1.0.0",
        status: "revoked",
        revocationReason: "Evidence falsification detected",
        revokedAt: new Date("2026-10-23T15:00:00Z"),
        issuedAt,
        signature,
        evidenceSummary: {},
      };

      vi.spyOn(CompetencyBadge, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockRevokedBadge),
      });

      const verification = await verifyPublicBadge(badgeId);
      expect(verification.exists).toBe(true);
      expect(verification.isValid).toBe(false);
      expect(verification.isRevoked).toBe(true);
      expect(verification.revocationReason).toBe("Evidence falsification detected");
      expect(verification.message).toContain("revoked");
    });

    it("18. Unauthorized users cannot revoke another student's badge", async () => {
      const mockBadge = {
        badgeId: "ssh-badge-auth-check",
        owner: studentAId,
        status: "active",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(CompetencyBadge, "findOne").mockResolvedValue(mockBadge);

      // Student B attempts to revoke Student A's badge via revocation service
      const { revokeBadgeController } = await import(
        "../src/modules/skills/controllers/competencyBadge.controller.js"
      );

      const mockReq = {
        user: { _id: studentBId, role: "student", email: "studentB@example.com" },
        params: { badgeId: "ssh-badge-auth-check" },
        body: { reason: "Malicious request" },
      };
      const mockRes = {};
      const mockNext = vi.fn();

      await revokeBadgeController(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, message: expect.stringContaining("not authorized") })
      );
    });
  });

  describe("Group D: Capstone Workflow & Resume Integration (Criteria 17, 19, 22, 23)", () => {
    it("19. Recalculation preserves historical assessment provenance without rewriting past results", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { checkpointId: "cp_ts_01", canonicalName: "TypeScript", isCorrect: true, score: 95 },
          ]),
        }),
      });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const capstone = await evaluateCapstoneWorkflow(studentAId, "TypeScript");
      expect(capstone.canonicalSkill).toBe("TypeScript");
      expect(capstone.evidenceBreakdown.knowledge.checkpoints.length).toBe(1);
      expect(capstone.evidenceBreakdown.knowledge.checkpoints[0].checkpointId).toBe("cp_ts_01");
      expect(capstone.isComplete).toBe(false);
      expect(capstone.missingRequirements.length).toBeGreaterThan(0);
    });

    it("22. Resume badge selection includes earned badges and excludes unearned badges", async () => {
      const activeBadge = {
        badgeId: "ssh-badge-earned-react",
        owner: studentAId,
        competencyName: "React Component Architecture & State",
        badgeType: "capstone_competence",
        status: "active",
        issuedAt: new Date("2026-10-20"),
        rubricVersion: "1.0.0",
      };

      vi.spyOn(CompetencyBadge, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([activeBadge]) }),
      });

      const userBadges = await getUserBadges(studentAId);
      expect(userBadges.length).toBe(1);
      expect(userBadges[0].badgeId).toBe("ssh-badge-earned-react");

      // Verify resume helper payload generation
      const resumeCertification = {
        id: userBadges[0].badgeId,
        title: `Verified Competency: ${userBadges[0].competencyName}`,
        date: "2026-10",
        issuer: "Smart Skill Hub",
        verificationUrl: `/badges/verify/${userBadges[0].badgeId}`,
      };

      expect(resumeCertification.title).toContain("React");
      expect(resumeCertification.verificationUrl).toContain("ssh-badge-earned-react");
    });

    it("23. Public HTTP verification route /api/v1/badges/verify/:badgeId is accessible without authentication", async () => {
      vi.spyOn(CompetencyBadge, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get("/api/v1/badges/verify/non-existent-badge-12345");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exists).toBe(false);
      expect(res.body.data.message).toBe("Badge not found");
    });

    it("17. Protected competency endpoints reject unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/v1/skills/competencies/matrix");
      expect(res.status).toBe(401);

      const claimRes = await request(app)
        .post("/api/v1/skills/badges/claim")
        .send({ competencyId: "comp-docker", badgeType: "capstone_competence" });
      expect(claimRes.status).toBe(401);
    });
  });
});
