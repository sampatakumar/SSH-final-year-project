import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompetencyMatrixWidget } from "../modules/skills/components/CompetencyMatrixWidget";
import { BadgeWalletWidget } from "../modules/skills/components/BadgeWalletWidget";
import { PublicBadgeVerificationPage } from "../pages/PublicBadgeVerificationPage";
import { AchievementsSectionEditor } from "../modules/resume/sections/AchievementsSectionEditor";
import { SmartSkillApi } from "../lib/api";

// Mock Sonner Toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe("Phase 40: Frontend Competency Matrix & Verifiable Badges Suite", () => {
  let queryClient: QueryClient;

  const mockMatrixData = {
    matrix: [
      {
        competencyId: "comp-docker",
        name: "Docker Containerization & Environment Isolation",
        description: "Container virtualization and isolated execution.",
        canonicalSkill: "Docker",
        category: "DevOps & Cloud",
        roles: ["DevOps Engineer", "Cloud Engineer"],
        rubricVersion: "1.0.0",
        status: "capstone_competence" as const,
        evidence: {
          knowledge: {
            satisfied: true,
            distinctCheckpointsPassed: 1,
            totalCheckpointsAttempted: 1,
            averageScore: 100,
            passingThreshold: 70,
            checkpoints: [{ checkpointId: "cp_1", score: 100, isCorrect: true, attemptedAt: "2026-10-23" }],
          },
          retention: {
            satisfied: true,
            maxStage: 2,
            consecutiveSuccesses: 2,
            bestScore: 95,
            schedulesCount: 1,
          },
          applied: {
            satisfied: true,
            problemsSolvedCount: 1,
            solvedTaskIds: ["docker-task-1"],
            totalTestCasesPassed: 4,
            totalTestCases: 4,
            testPassRate: 1.0,
          },
          capstone: {
            satisfied: true,
            allPillarsSatisfied: true,
          },
        },
        missingRequirements: [],
        recommendedNextAction: {
          actionType: "badge",
          title: "Claim Capstone Competency Badge",
          description: "All requirements met.",
          targetModule: "badges",
        },
        eligibleBadgeTypes: ["capstone_competence" as const],
        earnedBadges: [],
      },
      {
        competencyId: "comp-react",
        name: "React Component Architecture & State",
        description: "Component lifecycle and reactive state.",
        canonicalSkill: "React",
        category: "Frontend Frameworks",
        roles: ["Frontend Developer"],
        rubricVersion: "1.0.0",
        status: "insufficient_evidence" as const,
        evidence: {
          knowledge: {
            satisfied: true,
            distinctCheckpointsPassed: 1,
            totalCheckpointsAttempted: 1,
            averageScore: 90,
            passingThreshold: 70,
            checkpoints: [{ checkpointId: "cp_react_1", score: 90, isCorrect: true, attemptedAt: "2026-10-23" }],
          },
          retention: {
            satisfied: false,
            maxStage: 1,
            consecutiveSuccesses: 0,
            bestScore: 0,
            schedulesCount: 1,
          },
          applied: {
            satisfied: false,
            problemsSolvedCount: 0,
            solvedTaskIds: [],
            totalTestCasesPassed: 0,
            totalTestCases: 0,
            testPassRate: 0,
          },
          capstone: {
            satisfied: false,
            allPillarsSatisfied: false,
          },
        },
        missingRequirements: [
          "Pass at least 1 practical coding challenge with ≥ 80% test pass rate",
          "Demonstrate retention with ≥ 2 consecutive successful spaced revisions",
        ],
        recommendedNextAction: {
          actionType: "coding",
          title: "Solve React Practical Challenge",
          description: "Implement interactive component.",
          targetModule: "coding",
        },
        eligibleBadgeTypes: ["knowledge_specialist" as const],
        earnedBadges: [],
      },
    ],
    summary: {
      totalCompetencies: 2,
      capstoneVerified: 1,
      appliedVerified: 1,
      knowledgeVerified: 2,
      retentionVerified: 1,
      totalBadgesEarned: 0,
      rubricVersion: "1.0.0",
      evaluatedAt: "2026-10-23T12:00:00Z",
    },
  };

  const mockBadges = [
    {
      badgeId: "ssh-badge-dock-capstone",
      recipientIdentifier: "Verified Student A",
      competencyId: "comp-docker",
      competencyName: "Docker Containerization & Environment Isolation",
      skill: "Docker",
      canonicalSkill: "Docker",
      badgeType: "capstone_competence" as const,
      rubricVersion: "1.0.0",
      status: "active" as const,
      issuedAt: "2026-10-23T12:00:00Z",
      signature: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      keyId: "ssh-badge-key-2026-v1",
      evidenceSummary: {
        evidenceCategories: ["knowledge", "retention", "applied"],
        knowledgeScore: 100,
        knowledgeCheckpointsPassed: 1,
        retentionStage: 2,
        consecutiveRetrievals: 2,
        appliedProblemsSolved: 1,
        appliedTestCasesPassed: 4,
        verifiedAt: "2026-10-23T12:00:00Z",
      },
      issuer: "Smart Skill Hub Competency Authority",
      criteriaUrl: "/api/v1/skills/competencies/comp-docker",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.spyOn(SmartSkillApi, "getCompetencyMatrix").mockResolvedValue(mockMatrixData);
    vi.spyOn(SmartSkillApi, "getMyBadges").mockResolvedValue(mockBadges);
  });

  describe("Group A: CompetencyMatrixWidget", () => {
    it("1. Renders matrix KPIs and competency items", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CompetencyMatrixWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Competency Assessment Matrix")).toBeInTheDocument();
        expect(screen.getByText("Docker Containerization & Environment Isolation")).toBeInTheDocument();
        expect(screen.getByText("React Component Architecture & State")).toBeInTheDocument();
      });

      // Verify status badges
      expect(screen.getAllByText("Capstone Verified").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Evidence Incomplete")).toBeInTheDocument();
    });

    it("2. Displays missing requirements and recommended next action for incomplete competencies", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CompetencyMatrixWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Requirements for Capstone Verification/i)).toBeInTheDocument();
        expect(screen.getByText(/Pass at least 1 practical coding challenge/i)).toBeInTheDocument();
        expect(screen.getByText(/Solve React Practical Challenge/i)).toBeInTheDocument();
      });
    });

    it("3. Clicking claim badge triggers claim API call", async () => {
      const claimSpy = vi.spyOn(SmartSkillApi, "claimCompetencyBadge").mockResolvedValue({
        badge: mockBadges[0],
        isNewlyIssued: true,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <CompetencyMatrixWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Claim Capstone Badge")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Claim Capstone Badge"));

      await waitFor(() => {
        expect(claimSpy).toHaveBeenCalledWith({
          competencyId: "comp-docker",
          badgeType: "capstone_competence",
        });
      });
    });
  });

  describe("Group B: BadgeWalletWidget", () => {
    it("4. Renders active earned badges with cryptographic information", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <BadgeWalletWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Verified Credential Wallet")).toBeInTheDocument();
        expect(screen.getByText("Docker Containerization & Environment Isolation")).toBeInTheDocument();
        expect(screen.getByText("Active & Verified")).toBeInTheDocument();
        expect(screen.getByText("ssh-badge-key-2026-v1")).toBeInTheDocument();
      });
    });

    it("5. Revoke badge button calls revoke API when confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const revokeSpy = vi.spyOn(SmartSkillApi, "revokeBadge").mockResolvedValue({
        badge: { ...mockBadges[0], status: "revoked" },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <BadgeWalletWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Active & Verified")).toBeInTheDocument();
      });

      const revokeBtn = screen.getByLabelText("Revoke credential");
      fireEvent.click(revokeBtn);

      await waitFor(() => {
        expect(revokeSpy).toHaveBeenCalledWith("ssh-badge-dock-capstone", expect.any(String));
      });
    });
  });

  describe("Group C: PublicBadgeVerificationPage", () => {
    it("6. Displays valid verification state with public-safe details", async () => {
      vi.spyOn(SmartSkillApi, "verifyPublicBadge").mockResolvedValue({
        exists: true,
        isValid: true,
        isRevoked: false,
        badge: {
          badgeId: "ssh-badge-dock-capstone",
          recipientIdentifier: "Verified Student A",
          competencyId: "comp-docker",
          competencyName: "Docker Containerization & Environment Isolation",
          skill: "Docker",
          canonicalSkill: "Docker",
          badgeType: "capstone_competence",
          rubricVersion: "1.0.0",
          issuedAt: "2026-10-23T12:00:00Z",
          issuer: "Smart Skill Hub Competency Authority",
          keyId: "ssh-badge-key-2026-v1",
          evidenceSummary: {
            evidenceCategories: ["knowledge", "retention", "applied"],
            knowledgeScore: 100,
            knowledgeCheckpointsPassed: 1,
            retentionStage: 2,
            appliedProblemsSolved: 1,
            verifiedAt: "2026-10-23T12:00:00Z",
          },
        },
        message: "Cryptographically verified by Smart Skill Hub Authority",
      });

      render(
        <MemoryRouter initialEntries={["/badges/verify/ssh-badge-dock-capstone"]}>
          <Routes>
            <Route path="/badges/verify/:badgeId" element={<PublicBadgeVerificationPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Verified Credential")).toBeInTheDocument();
        expect(screen.getByText("Docker Containerization & Environment Isolation")).toBeInTheDocument();
        expect(screen.getByText("Verified Student A")).toBeInTheDocument();
        expect(screen.getByText("ssh-badge-key-2026-v1")).toBeInTheDocument();
      });
    });

    it("7. Displays revoked warning when credential has been revoked", async () => {
      vi.spyOn(SmartSkillApi, "verifyPublicBadge").mockResolvedValue({
        exists: true,
        isValid: false,
        isRevoked: true,
        revocationReason: "Evidence expired or manually retracted",
        revokedAt: "2026-10-23T15:00:00Z",
        badge: {
          badgeId: "ssh-badge-revoked-01",
          recipientIdentifier: "Verified Student A",
          competencyId: "comp-docker",
          competencyName: "Docker Containerization",
          skill: "Docker",
          canonicalSkill: "Docker",
          badgeType: "capstone_competence",
          rubricVersion: "1.0.0",
          issuedAt: "2026-10-23T10:00:00Z",
          issuer: "Smart Skill Hub",
          keyId: "ssh-badge-key-2026-v1",
          evidenceSummary: {
            evidenceCategories: [],
            knowledgeScore: 0,
            knowledgeCheckpointsPassed: 0,
            retentionStage: 0,
            appliedProblemsSolved: 0,
            verifiedAt: "2026-10-23T10:00:00Z",
          },
        },
        message: "Badge was revoked by issuing authority",
      });

      render(
        <MemoryRouter initialEntries={["/badges/verify/ssh-badge-revoked-01"]}>
          <Routes>
            <Route path="/badges/verify/:badgeId" element={<PublicBadgeVerificationPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Revoked Credential")).toBeInTheDocument();
        expect(screen.getByText(/This badge was officially revoked/i)).toBeInTheDocument();
        expect(screen.getByText(/Evidence expired or manually retracted/i)).toBeInTheDocument();
      });
    });
  });

  describe("Group D: Resume Builder Badge Integration", () => {
    it("8. Allows selecting and importing earned badge into resume achievements", async () => {
      const onChangeMock = vi.fn();

      render(
        <AchievementsSectionEditor
          achievements={[]}
          onChange={onChangeMock}
        />
      );

      expect(screen.getByText("Import Earned Badge")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Import Earned Badge"));

      await waitFor(() => {
        expect(screen.getByText("Select Earned Badge to Import")).toBeInTheDocument();
        expect(screen.getByText("Docker Containerization & Environment Isolation")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Import"));

      expect(onChangeMock).toHaveBeenCalledWith([
        expect.objectContaining({
          title: "Verified Competency: Docker Containerization & Environment Isolation",
          bullets: expect.arrayContaining([
            expect.stringContaining("Smart Skill Hub Verified Credential"),
            expect.stringContaining("Verification ID: ssh-badge-dock-capstone"),
          ]),
        }),
      ]);
    });
  });
});
