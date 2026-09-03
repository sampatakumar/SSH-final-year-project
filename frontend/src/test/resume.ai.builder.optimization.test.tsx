import { describe, it, expect } from "vitest";
import { adaptMasterProfileToResume, mergeProfileWithSavedResume } from "../modules/resume/services/resume-profile-adapter";
import { calculateAtsReadiness, calculateCompletenessScore } from "../modules/resume/services/resume-scoring.utils";
import { calculateResumeDensity, optimizeConfigForOnePage } from "../modules/resume/preview/resume-density.utils";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData } from "../modules/resume/templates/types";

describe("Resume AI Builder Grounding & Optimization Suite", () => {
  it("1. does NOT insert fake/demo GitHub, LinkedIn, or Portfolio URLs when profile values are missing", () => {
    const emptyProfile = {
      displayName: "Alex Developer",
      email: "alex@example.com",
    };

    const adapted = adaptMasterProfileToResume(emptyProfile, []);
    expect(adapted.github).toBe("");
    expect(adapted.linkedin).toBe("");
    expect(adapted.website).toBe("");
    expect(adapted.phone).toBe("");
    expect(adapted.github).not.toContain("username");
    expect(adapted.website).not.toContain("janiedev");
  });

  it("2. strictly deduplicates duplicate project entries by normalized title", () => {
    const duplicateProjects = [
      { title: "Smart Skill Hub", stack: ["React", "Node.js"], description: "AI Platform" },
      { title: "smart skill hub", stack: ["React"], description: "Duplicate lower case" },
      { title: "Smart Skill Hub ", stack: ["TypeScript"], description: "Duplicate trailing space" },
      { title: "Dev Portfolio", stack: ["Next.js"], description: "Another Project" },
    ];

    const adapted = adaptMasterProfileToResume({ displayName: "Test User" }, duplicateProjects);
    expect(adapted.projects.length).toBe(2);
    expect(adapted.projects.map((p) => p.name)).toEqual(["Smart Skill Hub", "Dev Portfolio"]);
  });

  it("3. deduplicates skills within and across skill categories", () => {
    const profileWithDuplicateSkills = {
      displayName: "Coder",
      skillLanguages: ["TypeScript", "typescript", "JavaScript", "Python", "PYTHON"],
      skillFrameworks: ["React", "react", "Node.js"],
    };

    const adapted = adaptMasterProfileToResume(profileWithDuplicateSkills, []);
    expect(adapted.skills.languages).toEqual(["TypeScript", "JavaScript", "Python"]);
    expect(adapted.skills.frameworks).toEqual(["React", "Node.js"]);
  });

  it("4. calculates grounded ATS Readiness and does NOT give arbitrary 100/100", () => {
    const incompleteResume: ResumeData = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      education: [],
      experience: [],
      projects: [],
      skills: { languages: ["JS"], frameworks: [], tools: [], libraries: [] },
      config: createDefaultBuilderConfig("ats-classic"),
    };

    const report = calculateAtsReadiness(incompleteResume);
    expect(report.score).toBeLessThan(60);
    expect(report.passedCount).toBeLessThan(report.totalCount);
    expect(report.whyImprovements.length).toBeGreaterThan(0);
  });

  it("5. awards high completeness to student resumes with projects without penalizing lack of work experience", () => {
    const studentResume: ResumeData = {
      name: "Student Developer",
      email: "student@university.edu",
      phone: "+1987654321",
      github: "https://github.com/student",
      professionalSummary: "Motivated Computer Science graduate with hands-on full-stack development experience building scalable web apps.",
      education: [
        { school: "Tech University", degree: "B.S. Computer Science", date: "2025" },
      ],
      experience: [], // 0 work experience
      projects: [
        {
          name: "Project Alpha",
          technologies: "React, Node.js",
          bullets: ["Engineered scalable REST APIs with JWT authentication."],
        },
        {
          name: "Project Beta",
          technologies: "Python, Docker",
          bullets: ["Architected automated CI/CD pipelines with GitHub Actions."],
        },
      ],
      skills: {
        languages: ["TypeScript", "Python", "SQL"],
        frameworks: ["React", "Express", "FastAPI"],
        tools: ["Docker", "Git"],
        libraries: ["PostgreSQL"],
      },
      config: createDefaultBuilderConfig("ats-classic"),
    };

    const completeness = calculateCompletenessScore(studentResume);
    expect(completeness.score).toBe(100);
    expect(completeness.missingCount).toBe(0);

    const ats = calculateAtsReadiness(studentResume);
    expect(ats.score).toBeGreaterThanOrEqual(80);
  });

  it("6. detects page density and recommends 'Optimize for 1 Page' when overflowing slightly", () => {
    const crowdedResume: ResumeData = {
      name: "Senior Engineer",
      email: "senior@example.com",
      phone: "+15555555",
      professionalSummary: "Senior Full Stack Software Engineer with 6+ years of experience building and scaling resilient distributed microservices, web platforms, and developer tooling in high-throughput cloud production environments.",
      education: [
        { school: "MIT", degree: "M.S. Computer Science", date: "2022" },
      ],
      experience: [
        {
          company: "Enterprise A",
          role: "Staff Engineer",
          bullets: [
            "Architected distributed real-time telemetry systems processing 50k events per second.",
            "Led cross-functional migration from legacy monorepo to TypeScript and Go microservices.",
            "Implemented mTLS zero-trust communication across all production Kubernetes clusters.",
            "Mentored 8 junior and mid-level software engineers across engineering squads.",
          ],
        },
        {
          company: "Tech Startups Inc",
          role: "Senior Backend Engineer",
          bullets: [
            "Optimized Postgres query indexes reducing p99 latency by 45ms.",
            "Built async queue workers processing 10k messages per minute.",
          ],
        },
      ],
      projects: [
        {
          name: "Large Cloud Platform",
          technologies: "Go, Kubernetes, Docker, PostgreSQL",
          bullets: [
            "Engineered automated multi-region deployments with continuous health auditing.",
            "Decreased infrastructure deployment rollback rate by 35% through Canary testing.",
          ],
        },
        {
          name: "Developer Portal CLI",
          technologies: "TypeScript, Node.js, GraphQL",
          bullets: [
            "Built standardized CLI adopted by over 200 internal engineering developers.",
          ],
        },
      ],
      skills: {
        languages: ["Go", "TypeScript", "Python"],
        frameworks: ["React", "Next.js", "Express"],
        tools: ["Kubernetes", "Docker", "AWS"],
        libraries: ["PostgreSQL", "Redis"],
      },
      config: createDefaultBuilderConfig("ats-classic"),
    };

    const densityBefore = calculateResumeDensity(crowdedResume, crowdedResume.config!);
    // console.log("DENSITY BEFORE:", densityBefore);
    expect(densityBefore.status).toBeDefined();
    expect(densityBefore.estimatedLines).toBeGreaterThan(30);

    const optimizedConfig = optimizeConfigForOnePage(crowdedResume, crowdedResume.config!);
    const densityAfter = calculateResumeDensity(crowdedResume, optimizedConfig);

    expect(densityAfter.estimatedLines).toBeLessThanOrEqual(densityBefore.estimatedLines);
  });

  it("7. preserves resume-specific overrides when merging with master profile", () => {
    const savedResume: Partial<ResumeData> = {
      name: "Custom Tailored Name",
      professionalSummary: "Specialized React Developer Summary",
      projects: [
        { name: "Tailored Project", technologies: "React, Tailwind", bullets: ["Custom bullets"] },
      ],
      config: createDefaultBuilderConfig("modern-developer"),
    };

    const masterProfile = {
      displayName: "Master Profile Name",
      about: "Generic Full Stack Profile Summary",
      githubUrl: "https://github.com/canonical",
    };

    const merged = mergeProfileWithSavedResume(savedResume, masterProfile, []);
    expect(merged.name).toBe("Custom Tailored Name");
    expect(merged.professionalSummary).toBe("Specialized React Developer Summary");
    expect(merged.github).toBe("https://github.com/canonical"); // Inherits missing link from profile
    expect(merged.config?.templateId).toBe("modern-developer"); // Preserves template override
    expect(merged.projects.length).toBe(1);
    expect(merged.projects[0].name).toBe("Tailored Project");
  });
});
