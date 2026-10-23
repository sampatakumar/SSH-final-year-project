import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  INITIAL_ACADEMIC_DEGREES,
  INITIAL_ACADEMIC_BRANCHES,
  INITIAL_CAREER_ROLES,
  INITIAL_BRANCH_ROLE_MAPPINGS,
} from "../src/modules/academic/constants/academicCatalog.js";
import { academicCatalogService } from "../src/modules/academic/services/academicCatalog.service.js";
import {
  getBranchCapabilities,
  CAPABILITY_KEYS,
  CAPABILITY_STATUS,
  CAPABILITY_DEFINITIONS,
} from "../src/modules/academic/services/branchCapabilityRegistry.service.js";
import {
  resolveCanonicalBranchSlug,
  resolveCanonicalDegreeSlug,
  normalizeAcademicProfile,
} from "../src/modules/academic/services/academicNormalization.service.js";
import { careerCompetencyAlignmentService } from "../src/modules/mentor/services/career-competency-alignment.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";

describe("Phase 42: Multi-Branch Foundation & Branch-Aware Student Profiles", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // STEP TWO: CANONICAL ACADEMIC BRANCH CATALOG
  // =========================================================================
  describe("1. Canonical Academic Branch Catalog Coverage", () => {
    it("accommodates minimum required disciplines across Engineering, Business, Arts, and Healthcare", () => {
      const branchSlugs = INITIAL_ACADEMIC_BRANCHES.map((b) => b.slug);

      // Engineering & Tech
      expect(branchSlugs).toContain("cse");
      expect(branchSlugs).toContain("it");
      expect(branchSlugs).toContain("aiml");
      expect(branchSlugs).toContain("ds");
      expect(branchSlugs).toContain("mech");
      expect(branchSlugs).toContain("eee");
      expect(branchSlugs).toContain("ece");
      expect(branchSlugs).toContain("civil");
      expect(branchSlugs).toContain("chem");
      expect(branchSlugs).toContain("biotech");
      expect(branchSlugs).toContain("ipe");

      // Business & Commerce
      expect(branchSlugs).toContain("bba-gen");
      expect(branchSlugs).toContain("mba-gen");
      expect(branchSlugs).toContain("bcom-gen");
      expect(branchSlugs).toContain("mcom-gen");

      // Arts & Humanities
      expect(branchSlugs).toContain("ba-gen");
      expect(branchSlugs).toContain("ma-gen");

      // Healthcare
      expect(branchSlugs).toContain("nursing-gen");
      expect(branchSlugs).toContain("allied-health-gen");
    });

    it("accommodates degree catalog entries for undergraduate and postgraduate levels", () => {
      const degreeSlugs = INITIAL_ACADEMIC_DEGREES.map((d) => d.slug);

      expect(degreeSlugs).toContain("btech");
      expect(degreeSlugs).toContain("be");
      expect(degreeSlugs).toContain("mtech");
      expect(degreeSlugs).toContain("bca");
      expect(degreeSlugs).toContain("mca");
      expect(degreeSlugs).toContain("bba");
      expect(degreeSlugs).toContain("mba");
      expect(degreeSlugs).toContain("bcom");
      expect(degreeSlugs).toContain("mcom");
      expect(degreeSlugs).toContain("ba");
      expect(degreeSlugs).toContain("ma");
      expect(degreeSlugs).toContain("bsc-nursing");
      expect(degreeSlugs).toContain("allied-health-degree");
    });

    it("resolves branch aliases safely to canonical identifiers", async () => {
      expect(resolveCanonicalBranchSlug("comp sci")).toBe("cse");
      expect(resolveCanonicalBranchSlug("computer science")).toBe("cse");
      expect(resolveCanonicalBranchSlug("cs")).toBe("cse");
      expect(resolveCanonicalBranchSlug("mechanical engineering")).toBe("mech");
      expect(resolveCanonicalBranchSlug("me")).toBe("mech");
      expect(resolveCanonicalBranchSlug("electronics")).toBe("ece");
      expect(resolveCanonicalBranchSlug("ec")).toBe("ece");
      expect(resolveCanonicalBranchSlug("electrical")).toBe("eee");
      expect(resolveCanonicalBranchSlug("bba")).toBe("bba-gen");
      expect(resolveCanonicalBranchSlug("mba")).toBe("mba-gen");
      expect(resolveCanonicalBranchSlug("bcom")).toBe("bcom-gen");
      expect(resolveCanonicalBranchSlug("nursing")).toBe("nursing-gen");
      expect(resolveCanonicalBranchSlug("allied health")).toBe("allied-health-gen");
    });

    it("handles unknown or invalid branch identifiers without crashing", () => {
      expect(resolveCanonicalBranchSlug("Quantum Astrobiology")).toBeNull();
      expect(resolveCanonicalBranchSlug("")).toBeNull();
      expect(resolveCanonicalBranchSlug(null)).toBeNull();
    });
  });

  // =========================================================================
  // STEP THREE & FOUR: STANDARDIZED PROFILE & BACKWARD COMPATIBILITY
  // =========================================================================
  describe("2. Academic Profile Normalization & Backward Compatibility", () => {
    it("safely normalizes legacy CSE profile with alternate branch string", () => {
      const legacyProfile = {
        degreeSlug: "b.tech",
        branchName: "Computer Science and Engineering",
        currentYear: 3,
        currentSemester: 6,
        institution: "Tech University",
      };

      const normalized = normalizeAcademicProfile(legacyProfile);

      expect(normalized.degreeSlug).toBe("btech");
      expect(normalized.branchSlug).toBe("cse");
      expect(normalized.branchName).toBe("Computer Science and Engineering");
      expect(normalized.currentYear).toBe(3);
      expect(normalized.currentSemester).toBe(6);
      expect(normalized.isConfigured).toBe(true);
    });

    it("preserves unconfigured profiles without forcing them into CSE", () => {
      const emptyProfile = null;
      const normalized = normalizeAcademicProfile(emptyProfile);

      expect(normalized.degreeSlug).toBe("");
      expect(normalized.branchSlug).toBe("");
      expect(normalized.isConfigured).toBe(false);
      expect(normalized.branchSlug).not.toBe("cse");
    });

    it("handles legacy profiles with unknown branch values without crashing", () => {
      const customProfile = {
        degreeSlug: "btech",
        branchName: "Robotics and Mechatronics",
        branchSlug: "robotics",
        institution: "Engineering College",
      };

      const normalized = normalizeAcademicProfile(customProfile);

      expect(normalized.branchSlug).toBe("robotics");
      expect(normalized.isConfigured).toBe(true);
    });

    it("is completely idempotent across repeated normalizations", () => {
      const profile = {
        degreeName: "Bachelor of Technology",
        degreeSlug: "btech",
        branchName: "Mechanical Engineering",
        branchSlug: "mech",
        currentYear: 2,
        currentSemester: 4,
        graduationYear: 2027,
      };

      const firstPass = normalizeAcademicProfile(profile);
      const secondPass = normalizeAcademicProfile(firstPass);

      expect(firstPass).toEqual(secondPass);
    });
  });

  // =========================================================================
  // STEP FIVE: BRANCH-AWARE SKILL & CAREER MAPPINGS
  // =========================================================================
  describe("3. Branch-Aware Career & Skill Mapping Layer", () => {
    it("resolves domain-specific requirements for Mechanical Design Engineer", async () => {
      const reqs = await careerCompetencyAlignmentService.resolveRoleRequirements("Mechanical Design Engineer");

      expect(reqs.title).toBe("Mechanical Design Engineer");
      expect(reqs.category).toBe("Mechanical & Industrial");
      // Must contain mechanical design skills rather than generic web development
      expect(reqs.coreSkills).toContain("SolidWorks");
      expect(reqs.coreSkills).toContain("AutoCAD");
    });

    it("resolves embedded domain skills for ECE Embedded Systems Engineer", async () => {
      const reqs = await careerCompetencyAlignmentService.resolveRoleRequirements("Embedded Systems Engineer");

      expect(reqs.title).toBe("Embedded Systems Engineer");
      expect(reqs.category).toBe("Electronics & Electrical");
      expect(reqs.coreSkills).toContain("Embedded C");
      expect(reqs.coreSkills).toContain("Microcontrollers");
      expect(reqs.coreSkills).toContain("RTOS");
    });

    it("resolves business analytics competencies for Business Intelligence Analyst", async () => {
      const reqs = await careerCompetencyAlignmentService.resolveRoleRequirements("Business Intelligence Analyst");

      expect(reqs.title).toBe("Business Intelligence Analyst");
      expect(reqs.category).toBe("Commerce & Business");
      expect(reqs.coreSkills).toContain("Power BI");
      expect(reqs.coreSkills).toContain("Tableau");
      expect(reqs.coreSkills).toContain("SQL");
    });

    it("supports cross-disciplinary mobility without artificial penalties", async () => {
      // Mock user as Mechanical Engineering targeting Full Stack Developer
      const mockOwnerId = "507f191e810c19729d959601";
      const alignment = await careerCompetencyAlignmentService.getCareerCompetencyAlignment(mockOwnerId);

      expect(alignment).toBeDefined();
      expect(alignment.rolesEvaluated).toBeDefined();
      expect(alignment.academicContext).toBeDefined();
      // Alignment evaluates fair requirements without throwing error
      expect(alignment.rolesEvaluated[0].skills.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // STEP EIGHT: BRANCH CAPABILITY REGISTRY
  // =========================================================================
  describe("4. Branch Capability Registry", () => {
    it("returns AVAILABLE for coding sandbox and github on Computing disciplines", () => {
      const cseCaps = getBranchCapabilities("cse");

      expect(cseCaps.disciplineFamily).toBe("Computing & Software");
      expect(cseCaps.capabilities[CAPABILITY_KEYS.CODING_PRACTICE]).toBe(CAPABILITY_STATUS.AVAILABLE);
      expect(cseCaps.capabilities[CAPABILITY_KEYS.GITHUB_ANALYSIS]).toBe(CAPABILITY_STATUS.AVAILABLE);
      expect(cseCaps.capabilities[CAPABILITY_KEYS.CAD_PORTFOLIO]).toBe(CAPABILITY_STATUS.UNSUPPORTED);
    });

    it("marks specialized CAD portfolio as PLANNED and coding as AVAILABLE for Mechanical disciplines", () => {
      const mechCaps = getBranchCapabilities("mech");

      expect(mechCaps.disciplineFamily).toBe("Mechanical, Civil & Industrial");
      expect(mechCaps.capabilities[CAPABILITY_KEYS.CAD_PORTFOLIO]).toBe(CAPABILITY_STATUS.PLANNED);
      expect(mechCaps.capabilities[CAPABILITY_KEYS.ENGINEERING_SIMULATION]).toBe(CAPABILITY_STATUS.PLANNED);
      expect(mechCaps.capabilities[CAPABILITY_KEYS.CODING_PRACTICE]).toBe(CAPABILITY_STATUS.AVAILABLE);
    });

    it("marks clinical assessments as PLANNED and coding as UNSUPPORTED for Healthcare disciplines", () => {
      const nursingCaps = getBranchCapabilities("nursing-gen");

      expect(nursingCaps.disciplineFamily).toBe("Healthcare & Life Sciences");
      expect(nursingCaps.capabilities[CAPABILITY_KEYS.HEALTHCARE_LEARNING_ASSESSMENT]).toBe(CAPABILITY_STATUS.PLANNED);
      expect(nursingCaps.capabilities[CAPABILITY_KEYS.CODING_PRACTICE]).toBe(CAPABILITY_STATUS.UNSUPPORTED);
      expect(nursingCaps.capabilities[CAPABILITY_KEYS.GITHUB_ANALYSIS]).toBe(CAPABILITY_STATUS.UNSUPPORTED);
    });

    it("provides capability definitions bundle via academicCatalogService", async () => {
      const options = await academicCatalogService.getAcademicOptions();

      expect(options.capabilityDefinitions).toBeDefined();
      expect(options.capabilityDefinitions[CAPABILITY_KEYS.CODING_PRACTICE].isImplemented).toBe(true);
      expect(options.capabilityDefinitions[CAPABILITY_KEYS.CAD_PORTFOLIO].isImplemented).toBe(false);
    });
  });

  // =========================================================================
  // STEP SIX: AI MENTOR INTEGRATION & MULTI-BRANCH CONTEXT
  // =========================================================================
  describe("5. Branch-Aware AI Mentor Context & Local NLP", () => {
    it("classifies academic branch guidance queries into academic_branch_guidance intent", () => {
      const intent1 = smartMentorLocalService.classifyIntent("What should I focus on as a Mechanical student?");
      const intent2 = smartMentorLocalService.classifyIntent("How does my academic branch connect with my career goals?");
      const intent3 = smartMentorLocalService.classifyIntent("Can I switch branch from Civil to Data Science?");

      expect(intent1).toBe("academic_branch_guidance");
      expect(intent2).toBe("academic_branch_guidance");
      expect(intent3).toBe("academic_branch_guidance");
    });

    it("classifies branch capability queries into branch_capabilities intent", () => {
      const intent = smartMentorLocalService.classifyIntent("What branch capabilities and simulation tools are available?");

      expect(intent).toBe("branch_capabilities");
    });

    it("responds to branch guidance queries with grounded discipline advice", () => {
      const mockContext = {
        career: {
          targetRole: "Mechanical Design Engineer",
          readinessScore: 68,
          academic: {
            isConfigured: true,
            branchName: "Mechanical Engineering",
            branchSlug: "mech",
            degreeName: "Bachelor of Technology",
            disciplineFamily: "Mechanical, Civil & Industrial",
            currentYear: 3,
            currentSemester: 5,
          },
        },
      };

      const res = smartMentorLocalService.generateLocalResponse(
        "What should I focus on as a Mechanical student?",
        mockContext
      );

      expect(res.intent).toBe("academic_branch_guidance");
      expect(res.answer).toContain("Mechanical Engineering");
      expect(res.answer).toContain("Discipline Relevance");
      expect(res.answer).toContain("GitHub repositories and web dev tools are not required");
    });

    it("responds to branch capabilities queries distinguishing available vs planned tools", () => {
      const mockContext = {
        career: {
          targetRole: "CAD Engineer",
          academic: {
            isConfigured: true,
            branchName: "Mechanical Engineering",
            branchSlug: "mech",
          },
        },
      };

      const res = smartMentorLocalService.generateLocalResponse(
        "What tools and capabilities are supported for my branch?",
        mockContext
      );

      expect(res.intent).toBe("branch_capabilities");
      expect(res.answer).toContain("Currently Implemented & Available (AVAILABLE)");
      expect(res.answer).toContain("Planned for Future Specialized Phases (PLANNED)");
      expect(res.answer).toContain("CAD & 3D Engineering Portfolio");
    });

    it("embeds multi-branch operational rules in system prompt", () => {
      const mockContext = {
        career: {
          targetRole: "Embedded Systems Engineer",
          readinessScore: 72,
          targetRoles: ["Embedded Systems Engineer"],
          academic: {
            isConfigured: true,
            branchName: "Electronics and Communication Engineering",
            degreeName: "Bachelor of Engineering",
            disciplineFamily: "Electronics & Electrical",
            currentYear: 4,
            currentSemester: 7,
          },
        },
      };

      const prompt = smartMentorService.buildSystemPrompt(mockContext);

      expect(prompt).toContain("ACADEMIC BRANCH & MULTI-DISCIPLINARY CONTEXT");
      expect(prompt).toContain("Mechanical students");
      expect(prompt).toContain("ECE/EEE students");
      expect(prompt).toContain("Commerce/Management");
      expect(prompt).toContain("Healthcare/Nursing");
      expect(prompt).toContain("CAPABILITY INTEGRITY");
    });
  });
});
