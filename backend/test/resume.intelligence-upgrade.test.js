import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  serializeResumeToDraftContext,
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
  reviewResumeLanguage,
  analyzeRoleAndJobDescription,
  chatWithResumeCopilot,
  PROTECTED_TECH_TERMS,
} from "../src/modules/resume/services/resumeIntelligence.service.js";

// Mock Firebase token verification
vi.mock("../src/core/auth/auth.middleware.js", () => ({
  verifyFirebaseToken: (req, res, next) => {
    req.user = {
      _id: "test_user_ai_123",
      firebaseUid: "firebase_ai_uid_123",
      email: "engineer@example.com",
    };
    next();
  },
  optionalFirebaseToken: (req, res, next) => next(),
}));

const sampleResumeData = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  phone: "+1-555-0199",
  linkedin: "https://linkedin.com/in/alexmorgan",
  github: "https://github.com/alexmorgan",
  website: "https://alexmorgan.dev",
  professionalSummary: "Full-Stack Software Engineer with 3+ years of experience building high-concurrency microservices and reactive web applications.",
  education: [
    {
      school: "University of Technology",
      degree: "B.S. in Computer Science",
      location: "San Francisco, CA",
      date: "2020 - 2024",
      grade: "3.8 GPA",
    },
  ],
  experience: [
    {
      company: "CloudScale Systems",
      role: "Backend Software Engineer",
      location: "Remote",
      date: "2023 - Present",
      bullets: [
        "Architected distributed event-driven ingestion pipeline handling 50k requests/second using Node.js, Kafka, and Redis.",
        "Optimized PostgreSQL query latency by 45% through indexing strategies and connection pooling.",
      ],
    },
  ],
  projects: [
    {
      name: "Distributed Task Scheduler",
      technologies: "TypeScript, Express, Redis, Docker",
      githubUrl: "https://github.com/alexmorgan/task-scheduler",
      bullets: [
        "Engineered fault-tolerant task queue with priority scheduling and exponential backoff retry algorithms.",
        "Containerized application using multi-stage Docker builds and automated CI/CD deployment via GitHub Actions.",
      ],
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "SQL"],
    frameworks: ["React", "Express.js", "Next.js", "FastAPI"],
    tools: ["Docker", "Kubernetes", "PostgreSQL", "Redis", "Git"],
  },
  achievements: [
    {
      title: "1st Place - University Hackathon 2023",
      date: "Oct 2023",
      bullets: ["Built real-time collaborative code review tool in 36 hours."],
    },
  ],
};

describe("Resume AI Intelligence Upgrade — Service & Endpoint Tests", () => {
  describe("1. serializeResumeToDraftContext", () => {
    it("serializes full resume draft into structured, section-indexed text", () => {
      const text = serializeResumeToDraftContext(sampleResumeData);
      expect(text).toContain("# CANDIDATE HEADER");
      expect(text).toContain("Name: Alex Morgan");
      expect(text).toContain("Email: alex.morgan@example.com");
      expect(text).toContain("# PROFESSIONAL SUMMARY");
      expect(text).toContain("# WORK EXPERIENCE");
      expect(text).toContain("[Experience 1] Role: Backend Software Engineer");
      expect(text).toContain("# TECHNICAL PROJECTS");
      expect(text).toContain("[Project 1] Name: Distributed Task Scheduler");
      expect(text).toContain("# TECHNICAL SKILLS");
      expect(text).toContain("Languages: TypeScript, JavaScript, Python, SQL");
      expect(text).toContain("# EDUCATION");
    });

    it("handles empty resume gracefully", () => {
      const text = serializeResumeToDraftContext({});
      expect(text).toContain("Name: Not provided");
      expect(text).toContain("Email: Not provided");
    });
  });

  describe("2. calculateAtsReadinessDeterministic", () => {
    it("returns high score (>= 90) and 'ATS Optimized' for complete resume", () => {
      const report = calculateAtsReadinessDeterministic(sampleResumeData);
      expect(report.score).toBeGreaterThanOrEqual(90);
      expect(report.label).toBe("ATS Optimized");
      expect(report.passedCount).toBeGreaterThanOrEqual(8);
      expect(report.rubricVersion).toBe("ats-v2.0-deterministic");
    });

    it("identifies missing contact info and skills on sparse resume", () => {
      const sparseResume = { name: "Incomplete Candidate" };
      const report = calculateAtsReadinessDeterministic(sparseResume);
      expect(report.score).toBeLessThan(50);
      expect(report.label).toBe("Needs Improvement");

      const emailCheck = report.checks.find((c) => c.id === "contact_email");
      expect(emailCheck?.passed).toBe(false);
      expect(emailCheck?.fixSection).toBe("personal");
    });
  });

  describe("3. calculateResumeQualityDeterministic", () => {
    it("evaluates all 5 category dimensions and generates strengths", () => {
      const rating = calculateResumeQualityDeterministic(sampleResumeData);
      expect(rating.score).toBeGreaterThanOrEqual(80);
      expect(rating.categoryScores).toHaveProperty("writingAndGrammar");
      expect(rating.categoryScores).toHaveProperty("technicalSpecificity");
      expect(rating.categoryScores).toHaveProperty("impactAndActionVerbs");
      expect(rating.categoryScores).toHaveProperty("sectionOrganization");
      expect(rating.categoryScores).toHaveProperty("completenessAndPresentation");
      expect(rating.strengths.length).toBeGreaterThan(0);
      expect(rating.rubricVersion).toBe("quality-v2.0-deterministic");
    });

    it("detects lack of quantifiable metrics on unquantified bullets", () => {
      const unquantifiedResume = {
        ...sampleResumeData,
        experience: [{ role: "Developer", company: "Co", bullets: ["Worked on stuff", "Helped team"] }],
        projects: [],
      };
      const rating = calculateResumeQualityDeterministic(unquantifiedResume);
      expect(rating.categoryScores.impactAndActionVerbs).toBeLessThan(14);
      expect(rating.weaknesses.some((w) => w.includes("quantifiable metrics"))).toBe(true);
    });
  });

  describe("4. reviewResumeLanguage", () => {
    it("detects lowercase bullet starts and weak verbs", async () => {
      const draftWithIssues = {
        professionalSummary: "I am a developer responsible for web development in order to build apps.",
        experience: [
          {
            role: "Dev",
            company: "Co",
            bullets: ["helped with the database migration,", "worked on features."],
          },
        ],
      };

      const review = await reviewResumeLanguage(draftWithIssues);
      expect(review.totalIssues).toBeGreaterThan(0);

      // Check first-person / tone issue
      const toneIssue = review.issues.find((i) => i.id === "summary_first_person");
      expect(toneIssue).toBeDefined();
      expect(toneIssue?.originalText).toBe("I am");

      // Check wordiness
      const wordinessIssue = review.issues.find((i) => i.category === "wordiness");
      expect(wordinessIssue).toBeDefined();

      // Check weak verb
      const weakVerbIssue = review.issues.find((i) => i.category === "action_verb" || i.category === "weak_verb");
      expect(weakVerbIssue).toBeDefined();
    });

    it("protects technical terminology from false positive flagging", () => {
      expect(PROTECTED_TECH_TERMS.has("typescript")).toBe(true);
      expect(PROTECTED_TECH_TERMS.has("kubernetes")).toBe(true);
      expect(PROTECTED_TECH_TERMS.has("postgresql")).toBe(true);
    });
  });

  describe("5. analyzeRoleAndJobDescription", () => {
    it("returns 100% general score when neither target role nor JD is specified", () => {
      const match = analyzeRoleAndJobDescription(sampleResumeData, {});
      expect(match.hasTarget).toBe(false);
      expect(match.matchScore).toBe(100);
    });

    it("evaluates required vs preferred skills when target role or JD is supplied", () => {
      const match = analyzeRoleAndJobDescription(sampleResumeData, {
        targetRole: "Full-Stack Developer",
        jobDescription: "Looking for an engineer with React, TypeScript, Node.js, Docker, Kubernetes, and Golang experience.",
      });

      expect(match.hasTarget).toBe(true);
      expect(match.matchedDemonstrated).toContain("typescript");
      expect(match.matchedDemonstrated).toContain("docker");
      expect(match.matchScore).toBeGreaterThan(50);
    });
  });

  describe("6. chatWithResumeCopilot", () => {
    it("answers grounded resume questions using draft context", async () => {
      const copilotResponse = await chatWithResumeCopilot({
        resumeData: sampleResumeData,
        userQuestion: "Review my professional summary",
      });

      expect(copilotResponse).toHaveProperty("answer");
      expect(copilotResponse.answer.length).toBeGreaterThan(20);
      expect(copilotResponse.answer).toContain("Summary");
    });
  });

  describe("7. HTTP Route Endpoints (/api/v1/ai/resume/*)", () => {
    it("POST /api/v1/ai/resume/evaluate-scores returns dual scores", async () => {
      const res = await request(app)
        .post("/api/v1/ai/resume/evaluate-scores")
        .set("Authorization", "Bearer mock-token")
        .send({ resumeData: sampleResumeData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.atsReadiness.score).toBeGreaterThanOrEqual(90);
      expect(res.body.data.qualityRating.score).toBeGreaterThanOrEqual(80);
      expect(res.body.data.roleMatch.hasTarget).toBe(false);
    });

    it("POST /api/v1/ai/resume/review-language returns structured findings", async () => {
      const res = await request(app)
        .post("/api/v1/ai/resume/review-language")
        .set("Authorization", "Bearer mock-token")
        .send({
          resumeData: {
            ...sampleResumeData,
            professionalSummary: "I am a web developer responsible for building apps in order to scale.",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIssues).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.issues)).toBe(true);
    });

    it("POST /api/v1/ai/resume/analyze-role compares resume against role", async () => {
      const res = await request(app)
        .post("/api/v1/ai/resume/analyze-role")
        .set("Authorization", "Bearer mock-token")
        .send({
          resumeData: sampleResumeData,
          targetRole: "Backend Engineer",
          jobDescription: "Requires Node.js, PostgreSQL, Kafka, and Redis.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasTarget).toBe(true);
      expect(res.body.data.matchScore).toBeGreaterThanOrEqual(60);
    });

    it("POST /api/v1/ai/resume/copilot-chat returns grounded assistant reply", async () => {
      const res = await request(app)
        .post("/api/v1/ai/resume/copilot-chat")
        .set("Authorization", "Bearer mock-token")
        .send({
          resumeData: sampleResumeData,
          userQuestion: "How is my ATS readiness?",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("answer");
      expect(res.body.data).toHaveProperty("provider");
    });
  });
});
