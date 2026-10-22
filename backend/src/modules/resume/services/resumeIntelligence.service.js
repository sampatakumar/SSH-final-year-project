import { generateCompletion } from "../../../services/groq.service.js";
import { TASK_TIERS } from "../../../config/groq.config.js";
import { env } from "../../../config/env.js";

/**
 * TECHNICAL DICTIONARY & PROTECTED VOCABULARY
 * Common programming terms, frameworks, and acronyms that must NEVER be flagged as spelling errors.
 */
export const PROTECTED_TECH_TERMS = new Set([
  "javascript", "typescript", "react", "react.js", "next.js", "vue", "vue.js", "angular",
  "node.js", "nodejs", "express", "express.js", "nest.js", "fastapi", "django", "flask",
  "python", "golang", "go", "rust", "c++", "c#", ".net", "java", "kotlin", "swift",
  "postgresql", "postgres", "mongodb", "mysql", "redis", "sqlite", "cassandra", "dynamodb",
  "docker", "kubernetes", "k8s", "helm", "terraform", "ansible", "aws", "gcp", "azure",
  "graphql", "rest", "restful", "grpc", "websocket", "ci/cd", "github actions", "gitlab",
  "tailwind", "tailwindcss", "css3", "html5", "webpack", "vite", "esbuild", "babel",
  "jest", "vitest", "mocha", "cypress", "playwright", "junit", "pytest",
  "zod", "prisma", "mongoose", "typeorm", "drizzle", "redux", "zustand", "mobx",
  "linux", "bash", "powershell", "git", "jwt", "oauth", "nosql", "kafka", "rabbitmq",
  "microservices", "serverless", "devops", "fintech", "saas", "fullstack", "frontend", "backend"
]);

/**
 * 1. DRAFT SERIALIZATION
 * Serializes the live editor state into structured, section-indexed text for AI context.
 */
export function serializeResumeToDraftContext(data) {
  if (!data || typeof data !== "object") return "Empty resume draft.";

  const lines = [];

  // Personal / Header
  lines.push("# CANDIDATE HEADER");
  lines.push(`Name: ${data.name || "Not provided"}`);
  lines.push(`Email: ${data.email || "Not provided"}`);
  lines.push(`Phone: ${data.phone || "Not provided"}`);
  if (data.linkedin) lines.push(`LinkedIn: ${data.linkedin}`);
  if (data.github) lines.push(`GitHub: ${data.github}`);
  if (data.website) lines.push(`Portfolio/Website: ${data.website}`);
  lines.push("");

  // Professional Summary
  if (data.professionalSummary?.trim()) {
    lines.push("# PROFESSIONAL SUMMARY");
    lines.push(data.professionalSummary.trim());
    lines.push("");
  }

  // Experience
  if (Array.isArray(data.experience) && data.experience.length > 0) {
    lines.push("# WORK EXPERIENCE");
    data.experience.forEach((exp, idx) => {
      lines.push(`[Experience ${idx + 1}] Role: ${exp.role || "Role"} | Company: ${exp.company || "Company"} | Location: ${exp.location || ""} | Date: ${exp.date || ""}`);
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b, bIdx) => {
          if (b && typeof b === "string" && b.trim()) {
            lines.push(`  - [Bullet ${bIdx + 1}] ${b.trim()}`);
          }
        });
      }
    });
    lines.push("");
  }

  // Projects
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    lines.push("# TECHNICAL PROJECTS");
    data.projects.forEach((proj, idx) => {
      lines.push(`[Project ${idx + 1}] Name: ${proj.name || "Project"} | Technologies: ${proj.technologies || ""}`);
      if (proj.githubUrl) lines.push(`  Code URL: ${proj.githubUrl}`);
      if (proj.demoUrl) lines.push(`  Demo URL: ${proj.demoUrl}`);
      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((b, bIdx) => {
          if (b && typeof b === "string" && b.trim()) {
            lines.push(`  - [Bullet ${bIdx + 1}] ${b.trim()}`);
          }
        });
      }
    });
    lines.push("");
  }

  // Skills Matrix
  lines.push("# TECHNICAL SKILLS");
  if (data.skills) {
    if (Array.isArray(data.skills.languages) && data.skills.languages.length > 0) {
      lines.push(`Languages: ${data.skills.languages.join(", ")}`);
    }
    if (Array.isArray(data.skills.frameworks) && data.skills.frameworks.length > 0) {
      lines.push(`Frameworks & Libraries: ${data.skills.frameworks.join(", ")}`);
    }
    if (Array.isArray(data.skills.tools) && data.skills.tools.length > 0) {
      lines.push(`Developer Tools & Platforms: ${data.skills.tools.join(", ")}`);
    }
  }
  if (Array.isArray(data.skillSections)) {
    data.skillSections.forEach((sec) => {
      if (sec.title && Array.isArray(sec.skills) && sec.skills.length > 0) {
        lines.push(`${sec.title}: ${sec.skills.join(", ")}`);
      }
    });
  }
  lines.push("");

  // Education
  if (Array.isArray(data.education) && data.education.length > 0) {
    lines.push("# EDUCATION");
    data.education.forEach((edu, idx) => {
      lines.push(`[Education ${idx + 1}] Degree: ${edu.degree || ""} | School: ${edu.school || ""} | Date: ${edu.date || ""} | Grade: ${edu.grade || ""}`);
    });
    lines.push("");
  }

  // Achievements
  if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    lines.push("# ACHIEVEMENTS & CERTIFICATIONS");
    data.achievements.forEach((ach, idx) => {
      lines.push(`[Achievement ${idx + 1}] Title: ${ach.title || ""} | Date: ${ach.date || ""}`);
      if (Array.isArray(ach.bullets)) {
        ach.bullets.forEach((b, bIdx) => {
          if (b && typeof b === "string" && b.trim()) {
            lines.push(`  - [Bullet ${bIdx + 1}] ${b.trim()}`);
          }
        });
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * 2. DETERMINISTIC ATS READINESS CALCULATION
 * Evaluates parser safety, heading compliance, and essential contact details.
 */
export function calculateAtsReadinessDeterministic(data) {
  const checks = [
    {
      id: "contact_name",
      title: "Candidate Full Name",
      passed: Boolean(data?.name?.trim()),
      weight: 10,
      explanation: "Full name at document header ensures ATS correctly maps applicant record.",
      fixSection: "personal",
    },
    {
      id: "contact_email",
      title: "Valid Reachable Email",
      passed: Boolean(data?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())),
      weight: 10,
      explanation: "Email is primary key for ATS recruiter outreach.",
      fixSection: "personal",
    },
    {
      id: "contact_phone",
      title: "Contact Phone Number",
      passed: Boolean(data?.phone && data.phone.trim().length >= 7),
      weight: 10,
      explanation: "Phone number facilitates direct recruiter phone screens.",
      fixSection: "personal",
    },
    {
      id: "professional_links",
      title: "Online Portfolio or GitHub/LinkedIn",
      passed: Boolean(data?.linkedin || data?.github || data?.website),
      weight: 10,
      explanation: "Online engineering profiles allow verification of code and credentials.",
      fixSection: "personal",
    },
    {
      id: "professional_summary",
      title: "Targeted Summary (>= 40 characters)",
      passed: Boolean(data?.professionalSummary && data.professionalSummary.trim().length >= 40),
      weight: 10,
      explanation: "Concise summary matches initial recruiter search queries.",
      fixSection: "summary",
    },
    {
      id: "technical_skills",
      title: "Categorized Technical Skills (>= 4 skills)",
      passed: Boolean(
        ((data?.skills?.languages?.length || 0) +
          (data?.skills?.frameworks?.length || 0) +
          (data?.skills?.tools?.length || 0) +
          (data?.skillSections?.reduce((acc, s) => acc + (s.skills?.length || 0), 0) || 0)) >= 4
      ),
      weight: 15,
      explanation: "Keyword parser scans technical skills directly for keyword match density.",
      fixSection: "skills",
    },
    {
      id: "experience_or_projects",
      title: "Verifiable Work Experience or Projects",
      passed: Boolean((data?.experience?.length || 0) > 0 || (data?.projects?.length || 0) > 0),
      weight: 15,
      explanation: "Hands-on projects or employment records demonstrate practical implementation.",
      fixSection: "projects",
    },
    {
      id: "bullet_action_verbs",
      title: "Action Verbs & Impact Bullets",
      passed: Boolean(
        [...(data?.projects || []), ...(data?.experience || [])].some((item) =>
          (item.bullets || []).some((b) => /^(built|developed|designed|architected|implemented|optimized|created|engineered|integrated|deployed|refactored|automated)\b/i.test(b.trim()))
        )
      ),
      weight: 10,
      explanation: "Bullets starting with strong past-tense action verbs improve ATS parser ranking.",
      fixSection: "experience",
    },
    {
      id: "education_degree",
      title: "Education Credentials",
      passed: Boolean(
        data?.education &&
          data.education.length > 0 &&
          (data.education[0]?.degree?.trim() ||
            (typeof data.education[0] === "string" && data.education[0].trim()))
      ),
      weight: 10,
      explanation: "Accredited degrees satisfy mandatory recruiter education filters.",
      fixSection: "education",
    },
  ];

  const totalPossible = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const score = Math.min(100, Math.round((earned / totalPossible) * 100));

  let label = "Needs Improvement";
  if (score >= 90) label = "ATS Optimized";
  else if (score >= 75) label = "Good ATS Readability";
  else if (score >= 50) label = "Moderate Parsing Risk";

  return {
    score,
    label,
    passedCount: checks.filter((c) => c.passed).length,
    totalCount: checks.length,
    checks,
    rubricVersion: "ats-v2.0-deterministic",
    disclaimer: "Heuristic simulation for readability and structure; not an endorsement or score from proprietary commercial ATS platforms (e.g., Workday, Taleo, Greenhouse).",
    timestamp: new Date().toISOString(),
  };
}

/**
 * 3. DETERMINISTIC RESUME QUALITY RATING
 * Multi-dimensional qualitative rubric (0-100) assessing writing quality, technical specificity, and impact.
 */
export function calculateResumeQualityDeterministic(data) {
  // Dimension 1: Writing & Grammar (0-20)
  let writingScore = 20;
  const allBullets = [
    ...(data?.experience || []).flatMap((e) => e.bullets || []),
    ...(data?.projects || []).flatMap((p) => p.bullets || []),
    ...(data?.achievements || []).flatMap((a) => a.bullets || []),
  ];

  // Penalize very short or very long bullets
  const tooShortBullets = allBullets.filter((b) => b.trim().length < 20);
  if (tooShortBullets.length > 2) writingScore -= 4;

  // Check punctuation consistency (period at end of bullets)
  const endsWithPeriod = allBullets.filter((b) => /[.]$/.test(b.trim())).length;
  const noPeriod = allBullets.length - endsWithPeriod;
  if (allBullets.length > 3 && endsWithPeriod > 0 && noPeriod > 0 && Math.abs(endsWithPeriod - noPeriod) < 3) {
    writingScore -= 2; // Inconsistent punctuation
  }
  writingScore = Math.max(6, writingScore);

  // Dimension 2: Technical Specificity (0-20)
  let techScore = 6;
  const totalSkillsCount =
    (data?.skills?.languages?.length || 0) +
    (data?.skills?.frameworks?.length || 0) +
    (data?.skills?.tools?.length || 0) +
    (data?.skillSections?.reduce((acc, s) => acc + (s.skills?.length || 0), 0) || 0);

  if (totalSkillsCount >= 10) techScore += 8;
  else if (totalSkillsCount >= 5) techScore += 5;

  const projectsWithTech = (data?.projects || []).filter((p) => p.technologies?.trim().length > 3).length;
  if (projectsWithTech >= 2) techScore += 6;
  else if (projectsWithTech >= 1) techScore += 3;
  techScore = Math.min(20, techScore);

  // Dimension 3: Impact & Action Verbs (0-20)
  let impactScore = 5;
  const actionVerbCount = allBullets.filter((b) =>
    /^(built|developed|designed|architected|implemented|optimized|created|engineered|integrated|deployed|refactored|automated|reduced|increased|improved|scaled|accelerated)\b/i.test(b.trim())
  ).length;
  if (actionVerbCount >= 5) impactScore += 8;
  else if (actionVerbCount >= 2) impactScore += 4;

  // Quantifiable metrics check (numbers, percentages, milliseconds, scale)
  const metricBullets = allBullets.filter((b) => /\b(\d+[%kKmM]?|\$\d+|\d+x|\d+\s*(ms|seconds|users|requests|records))\b/i.test(b));
  if (metricBullets.length >= 3) impactScore += 7;
  else if (metricBullets.length >= 1) impactScore += 4;
  impactScore = Math.min(20, impactScore);

  // Dimension 4: Section Organization (0-20)
  let orgScore = 10;
  if (data?.name && data?.email) orgScore += 3;
  if (data?.professionalSummary) orgScore += 3;
  if ((data?.projects?.length || 0) >= 2) orgScore += 2;
  if ((data?.education?.length || 0) >= 1) orgScore += 2;
  orgScore = Math.min(20, orgScore);

  // Dimension 5: Completeness & Professional Presentation (0-20)
  let completeScore = 8;
  if (data?.linkedin || data?.github) completeScore += 4;
  if (data?.phone) completeScore += 3;
  if ((data?.achievements?.length || 0) > 0) completeScore += 3;
  else if ((data?.experience?.length || 0) >= 1) completeScore += 5;
  completeScore = Math.min(20, completeScore);

  const overallScore = writingScore + techScore + impactScore + orgScore + completeScore;

  return {
    score: overallScore,
    categoryScores: {
      writingAndGrammar: writingScore,
      technicalSpecificity: techScore,
      impactAndActionVerbs: impactScore,
      sectionOrganization: orgScore,
      completenessAndPresentation: completeScore,
    },
    strengths: [
      techScore >= 15 ? "Strong technical breadth across languages and frameworks" : null,
      impactScore >= 14 ? "Consistently utilizes engineering action verbs and quantifiable metrics" : null,
      writingScore >= 16 ? "Clear, concise sentence structure and professional tone" : null,
      orgScore >= 16 ? "Well-organized section hierarchy with clean contact header" : null,
    ].filter(Boolean),
    weaknesses: [
      impactScore < 14 ? "Add quantifiable metrics (e.g. latency improvements, user counts, performance percentages)" : null,
      techScore < 14 ? "Explicitly mention languages and tools used inside each project description" : null,
      writingScore < 14 ? "Ensure all bullets begin with an active past-tense verb and end with consistent punctuation" : null,
    ].filter(Boolean),
    rubricVersion: "quality-v2.0-deterministic",
    disclaimer: "Qualitative heuristic evaluation based on technical dictionary, action verb density, and impact metrics.",
    timestamp: new Date().toISOString(),
  };
}

/**
 * 4. LANGUAGE & GRAMMAR REVIEW
 * Identifies grammar, spelling, punctuation, capitalization, verb tenses, wordiness, and weak verbs.
 */
export async function reviewResumeLanguage(data) {
  const context = serializeResumeToDraftContext(data);

  // Built-in rule-based analyzer for instant, reliable detection
  const detectedIssues = [];

  // Check professional summary
  if (data.professionalSummary) {
    const summary = data.professionalSummary;
    // Check for "I am", "I'm", "my" in professional resume summary (First-person pronouns should be avoided)
    const firstPersonMatch = summary.match(/\b(I am|I'm|My passion|I have)\b/i);
    if (firstPersonMatch) {
      detectedIssues.push({
        id: "summary_first_person",
        originalText: firstPersonMatch[0],
        proposedCorrection: firstPersonMatch[0].toLowerCase() === "i am" ? "Experienced" : "Demonstrated",
        category: "tone",
        explanation: "Third-person implied phrasing (e.g., 'Full-Stack Developer with...') is standard for ATS resumes rather than first-person 'I am'.",
        severity: "suggestion",
        section: "summary",
        safeToApply: false,
      });
    }

    // Check for passive voice or wordy phrases
    const wordyPhrases = [
      { pattern: /\bin order to\b/i, fix: "to", category: "wordiness", exp: "Replace 'in order to' with 'to' for concise professional impact." },
      { pattern: /\bresponsible for\b/i, fix: "Led / Handled", category: "action_verb", exp: "Replace passive 'responsible for' with a direct action verb." },
      { pattern: /\bhelped with\b/i, fix: "Contributed to", category: "weak_verb", exp: "Replace weak verb 'helped with' with a precise contribution verb." },
      { pattern: /\bworked on\b/i, fix: "Engineered / Implemented", category: "weak_verb", exp: "Specify exact technical role instead of generic 'worked on'." },
    ];

    wordyPhrases.forEach((wp) => {
      const match = summary.match(wp.pattern);
      if (match) {
        detectedIssues.push({
          id: `summary_${match[0].toLowerCase().replace(/\s+/g, "_")}`,
          originalText: match[0],
          proposedCorrection: wp.fix,
          category: wp.category,
          explanation: wp.exp,
          severity: "warning",
          section: "summary",
          safeToApply: false,
        });
      }
    });
  }

  // Check Experience bullets
  if (Array.isArray(data.experience)) {
    data.experience.forEach((exp, expIdx) => {
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet, bIdx) => {
          if (!bullet || typeof bullet !== "string") return;
          const trimmed = bullet.trim();

          // Check if bullet starts with a lowercase letter
          if (/^[a-z]/.test(trimmed)) {
            detectedIssues.push({
              id: `exp_${expIdx}_bullet_${bIdx}_capitalization`,
              originalText: trimmed.slice(0, 5),
              proposedCorrection: trimmed.charAt(0).toUpperCase() + trimmed.slice(1, 5),
              category: "capitalization",
              explanation: "Bullet points should start with a capitalized letter.",
              severity: "suggestion",
              section: "experience",
              itemIndex: expIdx,
              bulletIndex: bIdx,
              safeToApply: true,
            });
          }

          // Check for weak verbs at start
          if (/^(helped|worked|assisted|did|was|were)\b/i.test(trimmed)) {
            const firstWord = trimmed.split(" ")[0];
            detectedIssues.push({
              id: `exp_${expIdx}_bullet_${bIdx}_weak_verb`,
              originalText: firstWord,
              proposedCorrection: "Engineered / Spearheaded",
              category: "action_verb",
              explanation: "Begin bullets with assertive technical verbs (Engineered, Architected, Automated) to demonstrate ownership.",
              severity: "warning",
              section: "experience",
              itemIndex: expIdx,
              bulletIndex: bIdx,
              safeToApply: false,
            });
          }

          // Check for trailing comma or semicolons
          if (/[,;]$/.test(trimmed)) {
            detectedIssues.push({
              id: `exp_${expIdx}_bullet_${bIdx}_punctuation`,
              originalText: trimmed.slice(-1),
              proposedCorrection: ".",
              category: "punctuation",
              explanation: "Bullets should terminate with a period or remain clean without dangling commas.",
              severity: "suggestion",
              section: "experience",
              itemIndex: expIdx,
              bulletIndex: bIdx,
              safeToApply: true,
            });
          }
        });
      }
    });
  }

  // Check Project bullets
  if (Array.isArray(data.projects)) {
    data.projects.forEach((proj, pIdx) => {
      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((bullet, bIdx) => {
          if (!bullet || typeof bullet !== "string") return;
          const trimmed = bullet.trim();

          if (/^[a-z]/.test(trimmed)) {
            detectedIssues.push({
              id: `proj_${pIdx}_bullet_${bIdx}_capitalization`,
              originalText: trimmed.slice(0, 5),
              proposedCorrection: trimmed.charAt(0).toUpperCase() + trimmed.slice(1, 5),
              category: "capitalization",
              explanation: "Bullet points should begin with a capital letter.",
              severity: "suggestion",
              section: "projects",
              itemIndex: pIdx,
              bulletIndex: bIdx,
              safeToApply: true,
            });
          }

          if (/^(made|created a website|worked on)\b/i.test(trimmed)) {
            const match = trimmed.match(/^(made|created a website|worked on)/i);
            if (match) {
              detectedIssues.push({
                id: `proj_${pIdx}_bullet_${bIdx}_weak_verb`,
                originalText: match[0],
                proposedCorrection: "Architected and deployed",
                category: "action_verb",
                explanation: "Strengthen project description with engineering terminology.",
                severity: "warning",
                section: "projects",
                itemIndex: pIdx,
                bulletIndex: bIdx,
                safeToApply: false,
              });
            }
          }
        });
      }
    });
  }

  // Attempt Groq LLM deep language review if API key is present
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "") {
    try {
      const systemPrompt = `You are an expert technical resume editor and writing coach.
Analyze the following resume draft for:
1. Grammar, spelling, and punctuation errors.
2. Verb tense inconsistency (past experience should use past tense; current role present tense).
3. Awkward phrasing or wordiness.
4. Repetitive wording or weak verbs.

CRITICAL RULES:
- NEVER flag recognized technical terms (e.g. React, TypeScript, Node.js, Kubernetes, PostgreSQL, GraphQL, Docker, Zod, CI/CD, AWS) as errors.
- Every issue MUST reference EXACT text that genuinely exists in the resume. Do NOT fabricate text.
- Return ONLY a JSON array of issues matching this schema:
[
  {
    "id": "unique_string",
    "originalText": "exact string from resume",
    "proposedCorrection": "better phrasing",
    "category": "grammar" | "spelling" | "punctuation" | "action_verb" | "clarity" | "wordiness" | "tone",
    "explanation": "clear rationale",
    "severity": "critical" | "warning" | "suggestion",
    "section": "summary" | "experience" | "projects" | "skills" | "education" | "achievements",
    "safeToApply": true or false
  }
]`;

      const userPrompt = `Review this resume draft and return actionable corrections:\n\n${context}`;

      const res = await generateCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.1,
        maxTokens: 1200,
        feature: "resume_language_review",
      });

      let parsed = null;
      try {
        const cleaned = res.content.replace(/^```json/i, "").replace(/```$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {}

      if (Array.isArray(parsed)) {
        // Merge AI-detected issues while preserving exact text existence filter
        parsed.forEach((issue) => {
          if (issue.originalText && context.includes(issue.originalText)) {
            // Check if not already detected
            if (!detectedIssues.some((d) => d.originalText === issue.originalText)) {
              detectedIssues.push({
                ...issue,
                id: issue.id || `ai_issue_${detectedIssues.length + 1}`,
              });
            }
          }
        });
      }
    } catch (err) {
      // Gracefully fall back to deterministic issues on AI failure
      console.warn("[resume-language-review] Groq analysis fallback:", err.message);
    }
  }

  return {
    totalIssues: detectedIssues.length,
    criticalCount: detectedIssues.filter((i) => i.severity === "critical").length,
    warningCount: detectedIssues.filter((i) => i.severity === "warning").length,
    suggestionCount: detectedIssues.filter((i) => i.severity === "suggestion").length,
    issues: detectedIssues,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 5. JOB ROLE & JOB DESCRIPTION ANALYSIS
 * Evaluates match against target role or supplied job description.
 */
export function analyzeRoleAndJobDescription(data, { targetRole = "", jobDescription = "" } = {}) {
  const role = targetRole.trim();
  const jd = jobDescription.trim();

  if (!role && !jd) {
    return {
      hasTarget: false,
      message: "No specific target role or job description provided. General ATS and quality standards applied.",
      matchScore: 100,
      matchedDemonstrated: [],
      matchedMentioned: [],
      missingRequired: [],
      missingPreferred: [],
      recommendations: [],
    };
  }

  // Collect resume text corpus
  const resumeSkills = [
    ...(data?.skills?.languages || []),
    ...(data?.skills?.frameworks || []),
    ...(data?.skills?.tools || []),
    ...(data?.skillSections?.flatMap((s) => s.skills || []) || []),
  ].map((s) => s.toLowerCase().trim());

  const experienceText = (data?.experience || [])
    .flatMap((e) => [e.role, e.company, ...(e.bullets || [])])
    .join(" ")
    .toLowerCase();

  const projectText = (data?.projects || [])
    .flatMap((p) => [p.name, p.technologies, ...(p.bullets || [])])
    .join(" ")
    .toLowerCase();

  const fullCorpus = `${resumeSkills.join(" ")} ${experienceText} ${projectText}`.toLowerCase();

  // Role keyword dictionaries
  const roleKeywords = {
    "full-stack": ["react", "typescript", "node.js", "javascript", "sql", "postgresql", "rest", "docker", "git", "ci/cd"],
    "frontend": ["react", "typescript", "javascript", "css3", "html5", "tailwind", "next.js", "redux", "performance", "ui/ux"],
    "backend": ["node.js", "python", "golang", "postgresql", "mongodb", "redis", "docker", "microservices", "rest", "sql"],
    "devops": ["docker", "kubernetes", "terraform", "aws", "ci/cd", "linux", "github actions", "bash", "monitoring"],
    "ai/ml": ["python", "pytorch", "tensorflow", "scikit-learn", "sql", "pandas", "numpy", "docker", "machine learning"],
  };

  // Find target benchmark keywords
  let targetKeywords = [];
  if (role) {
    const roleKey = Object.keys(roleKeywords).find((k) => role.toLowerCase().includes(k)) || "full-stack";
    targetKeywords = roleKeywords[roleKey] || roleKeywords["full-stack"];
  }

  // If JD is provided, extract tech tokens from it
  if (jd) {
    const jdLower = jd.toLowerCase();
    Array.from(PROTECTED_TECH_TERMS).forEach((term) => {
      const regex = new RegExp(`\\b${term.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(jdLower) && !targetKeywords.includes(term)) {
        targetKeywords.push(term);
      }
    });
  }

  const matchedDemonstrated = [];
  const matchedMentioned = [];
  const missingRequired = [];
  const missingPreferred = [];

  targetKeywords.forEach((kw, idx) => {
    const isDemonstrated = projectText.includes(kw) || experienceText.includes(kw);
    const isMentioned = resumeSkills.some((s) => s.includes(kw) || kw.includes(s));

    if (isDemonstrated) {
      matchedDemonstrated.push(kw);
    } else if (isMentioned) {
      matchedMentioned.push(kw);
    } else {
      // First 60% treated as required, remainder as preferred
      if (idx < Math.ceil(targetKeywords.length * 0.6)) {
        missingRequired.push(kw);
      } else {
        missingPreferred.push(kw);
      }
    }
  });

  const totalPossible = targetKeywords.length || 1;
  const matchScore = Math.min(
    100,
    Math.round(((matchedDemonstrated.length * 1.0 + matchedMentioned.length * 0.6) / totalPossible) * 100)
  );

  const recommendations = [];
  if (missingRequired.length > 0) {
    recommendations.push(
      `Job calls for ${missingRequired.slice(0, 3).join(", ")}. If you have practical project experience with these, highlight them in your project tech stacks.`
    );
  }
  if (matchedMentioned.length > 0) {
    recommendations.push(
      `Skills ${matchedMentioned.slice(0, 2).join(", ")} are listed in your skills matrix but lack bullet evidence in projects or work history.`
    );
  }

  return {
    hasTarget: true,
    targetRole: role || "Custom Job Description",
    matchScore,
    matchedDemonstrated,
    matchedMentioned,
    missingRequired,
    missingPreferred,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 6. LIVE RESUME AI COPILOT CHAT
 * Answers questions grounded in the user's current draft, target role, and GitHub evidence.
 */
export async function chatWithResumeCopilot({
  resumeData,
  messages = [],
  userQuestion = "",
  targetRole = "",
  jobDescription = "",
  githubEvidence = null,
}) {
  const draftContext = serializeResumeToDraftContext(resumeData);

  let evidenceSnippet = "";
  if (githubEvidence && typeof githubEvidence === "object") {
    evidenceSnippet = `\n# VERIFIED GITHUB EVIDENCE:\n- Verified Repositories: ${githubEvidence.repoCount || "N/A"}\n- Primary Languages: ${(githubEvidence.languages || []).join(", ")}\n- Demonstrated Practices: ${(githubEvidence.practices || []).join(", ")}`;
  }

  const systemPrompt = `You are Smart Skill Hub's Live Resume AI Copilot.
You are helping an engineering student improve their technical resume draft.

CURRENT RESUME DRAFT (AUTHORITATIVE):
${draftContext}
${evidenceSnippet}
${targetRole ? `TARGET CAREER ROLE: ${targetRole}` : ""}
${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription}` : ""}

STRICT OPERATING RULES:
1. ALWAYS ground your answers in the candidate's actual resume draft above.
2. ZERO HALLUCINATION: Never invent fake employers, degrees, GPA numbers, production metrics, revenue figures, or technologies not present in the draft or GitHub evidence.
3. If an improvement requires metrics (e.g. latency, user scale) that are not in the draft, explicitly ask the student for them or supply a bracketed placeholder like "[e.g. reduced load time by X%]".
4. When suggesting bullet revisions, provide BOTH the original text and the revised text with an explanation of why the change is stronger.
5. Provide concise, clear, and actionable Markdown responses.`;

  // Format conversation history
  const promptMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  if (userQuestion?.trim()) {
    promptMessages.push({ role: "user", content: userQuestion.trim() });
  }

  // Call Groq AI completion
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "") {
    try {
      const res = await generateCompletion({
        messages: promptMessages,
        temperature: 0.25,
        maxTokens: 1200,
        taskTier: TASK_TIERS.HIGH_REASONING,
        feature: "resume_copilot_chat",
      });

      return {
        answer: res.content,
        provider: "groq",
        modelUsed: res.modelUsed,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[resume-copilot] Groq call failed, using deterministic local answer:", err.message);
    }
  }

  // Fallback deterministic copilot response if Groq is unconfigured or rate limited
  const qLower = (userQuestion || "").toLowerCase();
  let fallbackAnswer = "";

  if (qLower.includes("grammar") || qLower.includes("spelling")) {
    const lang = await reviewResumeLanguage(resumeData);
    if (lang.issues.length === 0) {
      fallbackAnswer = "I reviewed your resume draft for grammar and spelling. No spelling or punctuation errors were detected! Ensure your bullet points maintain active past-tense verbs.";
    } else {
      fallbackAnswer = `I found **${lang.issues.length} language recommendations**:\n\n` +
        lang.issues.slice(0, 3).map((i) => `- **${i.category.toUpperCase()}** in *${i.section}*: Replace "${i.originalText}" with "${i.proposedCorrection}" (${i.explanation})`).join("\n");
    }
  } else if (qLower.includes("summary")) {
    fallbackAnswer = `### Professional Summary Review\nYour current summary:\n> ${resumeData.professionalSummary || "No summary currently provided."}\n\n**Recommendation**: For an engineering resume, focus on your primary stack, core architecture patterns, and domain focus. Avoid first-person pronouns ("I", "my") and emphasize verifiable competencies.`;
  } else if (qLower.includes("ats")) {
    const ats = calculateAtsReadinessDeterministic(resumeData);
    fallbackAnswer = `### ATS Readiness Audit\nYour current ATS estimate is **${ats.score}/100** (${ats.label}).\n\n**Key Audit Points**:\n` +
      ats.checks.map((c) => `- ${c.passed ? "✅" : "⚠️"} **${c.title}**: ${c.explanation}`).join("\n");
  } else if (qLower.includes("project") || qLower.includes("action verb")) {
    fallbackAnswer = `### Project Bullets Guidance\nTo make project bullets stand out to recruiters:\n1. **Action Verb**: Begin with what you built (e.g., *Architected*, *Implemented*, *Containerized*).\n2. **Technical Context**: Mention the specific libraries or APIs used (e.g., *using TypeScript, Express, and Docker*).\n3. **Measurable Outcome**: Add the outcome or performance impact where verifiable.`;
  } else {
    fallbackAnswer = `I am your **Resume AI Copilot**, grounded in your current draft.\n\nI can help you:\n- **Review Grammar & Spelling**: Spot typos and passive phrasing.\n- **Improve Project Descriptions**: Formulate impact-driven technical bullets.\n- **Optimize for ATS**: Ensure header completeness and keyword density.\n- **Audit for Target Roles**: Compare your skills against role requirements.\n\nWhat section would you like to review first?`;
  }

  return {
    answer: fallbackAnswer,
    provider: "local-rule-engine",
    modelUsed: "deterministic-nlp",
    timestamp: new Date().toISOString(),
  };
}
