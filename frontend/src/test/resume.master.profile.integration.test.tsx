import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  adaptMasterProfileToResume,
  mergeProfileWithSavedResume,
  type MasterProfileData,
  type UserProjectItem,
} from "../modules/resume/services/resume-profile-adapter";
import { normalizeResumeData } from "../modules/resume/services/resume-normalizer";
import { ResumeBuilder } from "../modules/resume/builder/ResumeBuilder";
import ResumeTemplateRenderer from "../modules/resume/templates/ResumeTemplateRenderer";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData } from "../modules/resume/templates/types";

// Mock Auth Context
const mockBackendUser: MasterProfileData = {
  displayName: "Sampatakumar S V",
  email: "sampatakumar@example.com",
  phone: "+91 9876543210",
  about: "Full Stack Engineer specializing in React, Node.js, and Cloud Distributed Systems with a focus on developer tooling.",
  linkedInUrl: "https://linkedin.com/in/sampatakumar",
  githubUrl: "https://github.com/sampatakumar",
  customDomain: "https://sampata.dev",
  targetRole: "Full Stack Developer",
  educationEntries: [
    {
      college: "Indian Institute of Technology",
      degree: "B.Tech",
      specialization: "Computer Science",
      location: "Chennai, India",
      endDate: "2024",
      grade: "9.2 CGPA",
    },
  ],
  experience: [
    {
      company: "Tech Innovations Inc.",
      role: "Lead Full Stack Engineer",
      location: "Bangalore, India",
      date: "2024 – Present",
      bullets: [
        "Architected scalable microservices handling 100k daily requests.",
        "Built responsive UI with React and TailwindCSS.",
      ],
    },
  ],
  skillSections: [
    {
      title: "Languages",
      skills: ["TypeScript", "JavaScript", "Python", "Go", "SQL"],
    },
    {
      title: "Frameworks & Backend",
      skills: ["React", "Next.js", "Node.js", "Express", "TailwindCSS"],
    },
    {
      title: "DevOps & Cloud",
      skills: ["Docker", "Kubernetes", "AWS", "Git", "GitHub Actions"],
    },
  ],
  skillLanguages: ["TypeScript", "JavaScript", "Python", "Go"],
  skillFrameworks: ["React", "Next.js", "Node.js", "Express"],
  skillTools: ["Docker", "Kubernetes", "AWS", "Git"],
  skillLibraries: ["MongoDB", "PostgreSQL", "Redis"],
  achievements: [
    {
      title: "Winner of National Hackathon 2024",
      date: "2024",
      bullets: ["Awarded 1st place among 500+ participating engineering teams."],
    },
  ],
};

const mockUserProjects: UserProjectItem[] = [
  {
    _id: "proj-1",
    title: "Smart Skill Hub",
    description: "An integrated career development and AI-guided code intelligence platform.",
    stack: ["React", "TypeScript", "Node.js", "MongoDB", "Docker"],
    githubUrl: "https://github.com/sampatakumar/smart-skill-hub",
    demoUrl: "https://smartskillhub.app",
  },
];

// Mock API request & Auth hook
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    backendUser: mockBackendUser,
    idToken: "mock-test-id-token",
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn().mockImplementation((path: string) => {
    if (path === "/projects") {
      return Promise.resolve({
        data: { projects: mockUserProjects },
      });
    }
    return Promise.resolve({ data: {} });
  }),
}));

describe("Master Profile → Resume Builder Integration Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Adapter Unit Tests
  describe("1. Master Profile → Resume Adapter Mapping", () => {
    it("maps personal information correctly from Master Profile", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);

      expect(resume.name).toBe("Sampatakumar S V");
      expect(resume.email).toBe("sampatakumar@example.com");
      expect(resume.phone).toBe("+91 9876543210");
      expect(resume.linkedin).toBe("https://linkedin.com/in/sampatakumar");
      expect(resume.github).toBe("https://github.com/sampatakumar");
      expect(resume.website).toBe("https://sampata.dev");
    });

    it("maps professional summary from Master Profile about field", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.professionalSummary).toContain("Full Stack Engineer specializing in React");
    });

    it("maps educationEntries to normalized Education objects", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.education).toHaveLength(1);
      expect(resume.education[0].school).toBe("Indian Institute of Technology");
      expect(resume.education[0].degree).toBe("B.Tech in Computer Science");
      expect(resume.education[0].location).toBe("Chennai, India");
      expect(resume.education[0].date).toBe("2024");
      expect(resume.education[0].grade).toBe("9.2 CGPA");
    });

    it("maps experience entries with company, role, date, and bullets", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.experience).toHaveLength(1);
      expect(resume.experience[0].company).toBe("Tech Innovations Inc.");
      expect(resume.experience[0].role).toBe("Lead Full Stack Engineer");
      expect(resume.experience[0].bullets).toHaveLength(2);
      expect(resume.experience[0].bullets[0]).toContain("Architected scalable microservices");
    });

    it("maps projects from user projects list", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.projects).toHaveLength(1);
      expect(resume.projects[0].name).toBe("Smart Skill Hub");
      expect(resume.projects[0].technologies).toContain("React, TypeScript, Node.js");
      expect(resume.projects[0].githubUrl).toBe("https://github.com/sampatakumar/smart-skill-hub");
      expect(resume.projects[0].demoUrl).toBe("https://smartskillhub.app");
      expect(resume.projects[0].bullets[0]).toContain("integrated career development");
    });

    it("maps categorized skills and skillSections accurately", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.skills?.languages).toContain("TypeScript");
      expect(resume.skills?.languages).toContain("Python");
      expect(resume.skills?.frameworks).toContain("React");
      expect(resume.skills?.tools).toContain("Docker");
      expect(resume.skillSections).toHaveLength(3);
    });

    it("maps achievements and awards", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      expect(resume.achievements).toHaveLength(1);
      expect(resume.achievements[0].title).toBe("Winner of National Hackathon 2024");
      expect(resume.achievements[0].date).toBe("2024");
    });
  });

  // 2. Empty Profile & Resilience
  describe("2. Empty Profile Resilience & Defaults", () => {
    it("handles null / empty profile safely without crashing or throwing", () => {
      const emptyResume = adaptMasterProfileToResume(null, []);
      expect(emptyResume.name).toBe("");
      expect(emptyResume.education).toEqual([]);
      expect(emptyResume.experience).toEqual([]);
      expect(emptyResume.projects).toEqual([]);
      expect(emptyResume.skills?.languages).toEqual([]);
    });

    it("handles undefined fields gracefully in partial profiles", () => {
      const partialProfile: MasterProfileData = {
        displayName: "Alice Dev",
        email: "alice@dev.io",
      };
      const resume = adaptMasterProfileToResume(partialProfile, []);
      expect(resume.name).toBe("Alice Dev");
      expect(resume.email).toBe("alice@dev.io");
      expect(resume.phone).toBe("");
      expect(resume.education).toEqual([]);
    });
  });

  // 3. Saved Resume vs Master Profile Precedence
  describe("3. Saved Resume Overrides & User Customization Preservation", () => {
    it("preserves user-edited summary over Master Profile when editing saved resume", () => {
      const savedResume: Partial<ResumeData> = {
        name: "Sampatakumar S V",
        professionalSummary: "Customized resume summary tailored specifically for Principal Architect role.",
      };

      const merged = mergeProfileWithSavedResume(savedResume, mockBackendUser, mockUserProjects);
      expect(merged.professionalSummary).toBe(
        "Customized resume summary tailored specifically for Principal Architect role."
      );
    });

    it("preserves custom project bullets in saved resume", () => {
      const savedResume: Partial<ResumeData> = {
        projects: [
          {
            name: "Custom Tailored Project",
            technologies: "Rust, WebAssembly",
            bullets: ["Highly optimized low-level audio engine."],
          },
        ],
      };

      const merged = mergeProfileWithSavedResume(savedResume, mockBackendUser, mockUserProjects);
      expect(merged.projects[0].name).toBe("Custom Tailored Project");
      expect(merged.projects[0].technologies).toBe("Rust, WebAssembly");
    });

    it("preserves custom section configuration and typography styling", () => {
      const savedResume: Partial<ResumeData> = {
        config: {
          ...createDefaultBuilderConfig("modern-developer"),
          typography: {
            fontFamily: "Inter",
            bodySize: 9.5,
            headingSize: 13,
            lineHeight: 1.25,
            sectionGap: 18,
          },
        },
      };

      const merged = mergeProfileWithSavedResume(savedResume, mockBackendUser, mockUserProjects);
      expect(merged.config?.templateId).toBe("modern-developer");
      expect(merged.config?.typography.fontFamily).toBe("Inter");
      expect(merged.config?.typography.bodySize).toBe(9.5);
    });
  });

  // 4. Template Rendering & A4 Preview
  describe("4. Template Rendering with Populated Profile Data", () => {
    it("renders populated candidate information inside ATS Classic template without placeholder", () => {
      const resume = adaptMasterProfileToResume(mockBackendUser, mockUserProjects);
      const config = createDefaultBuilderConfig("ats-classic");

      render(<ResumeTemplateRenderer data={resume} config={config} />);

      // Verify actual candidate name appears instead of default CANDIDATE NAME
      expect(screen.getByText("Sampatakumar S V")).toBeInTheDocument();
      expect(screen.queryByText("Candidate Name")).not.toBeInTheDocument();

      // Verify contact info
      expect(screen.getByText("sampatakumar@example.com")).toBeInTheDocument();
      expect(screen.getByText("+91 9876543210")).toBeInTheDocument();

      // Verify sections
      expect(screen.getByText(/Indian Institute of Technology/i)).toBeInTheDocument();
      expect(screen.getByText(/Tech Innovations Inc./i)).toBeInTheDocument();
      expect(screen.getByText(/Smart Skill Hub/i)).toBeInTheDocument();
      expect(screen.getByText(/Winner of National Hackathon 2024/i)).toBeInTheDocument();
    });
  });

  // 5. Interactive ResumeBuilder Hydration & Sync Profile Action
  describe("5. Interactive ResumeBuilder Hydration & Sync Action", () => {
    it("initializes new resume directly from Master Profile and renders in form inputs", async () => {
      render(
        <ResumeBuilder
          onBack={vi.fn()}
          onSaved={vi.fn()}
        />
      );

      // Wait for async hydration
      await waitFor(() => {
        expect(screen.getByDisplayValue("Sampatakumar S V")).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("sampatakumar@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+91 9876543210")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://linkedin.com/in/sampatakumar")).toBeInTheDocument();
    });

    it("opens Sync from Master Profile dialog when clicked and syncs on confirm", async () => {
      render(
        <ResumeBuilder
          onBack={vi.fn()}
          onSaved={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Sampatakumar S V")).toBeInTheDocument();
      });

      // Click "Sync from Master Profile"
      const syncBtn = screen.getAllByText("Sync from Master Profile")[0];
      fireEvent.click(syncBtn);

      // Check confirmation modal appears
      expect(screen.getByText(/Update candidate details/i)).toBeInTheDocument();

      // Confirm sync
      const confirmBtn = screen.getByText("Sync Profile Data");
      fireEvent.click(confirmBtn);

      expect(screen.getByDisplayValue("Sampatakumar S V")).toBeInTheDocument();
    });
  });
});
