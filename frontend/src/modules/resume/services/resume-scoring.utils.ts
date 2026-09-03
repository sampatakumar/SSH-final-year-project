import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export interface AtsCheckItem {
  id: string;
  title: string;
  category: "structure" | "readability" | "content";
  passed: boolean;
  scoreWeight: number;
  explanation: string;
  fixSection?: string;
}

export interface AtsReadinessReport {
  score: number; // 0–100
  label: string; // "Needs Attention" | "Developing" | "Competitive" | "Strong" | "ATS Ready"
  checks: AtsCheckItem[];
  passedCount: number;
  totalCount: number;
  whyStrengths: string[];
  whyImprovements: string[];
}

export interface CompletenessItem {
  key: string;
  label: string;
  completed: boolean;
  points: number;
  hint: string;
  sectionId: string;
}

export interface CompletenessReport {
  score: number; // 0–100
  items: CompletenessItem[];
  missingCount: number;
  completedCount: number;
  summaryText: string;
}

const ACTION_VERB_REGEX = /^(built|engineered|architected|developed|designed|implemented|optimized|created|maintained|integrated|refactored|deployed|automated|orchestrated|collaborated|managed|delivered|spearheaded|improved|resolved|reduced|scaled|launched)/i;

/**
 * Calculate genuine, grounded ATS Readiness score (0–100)
 * Evaluates Structure, Readability, Bullet Strength, and Keyword Presence.
 * Does NOT award flat 100/100 and does NOT penalize students who have projects instead of employment.
 */
export const calculateAtsReadiness = (
  data: ResumeData,
  config?: ResumeBuilderConfig
): AtsReadinessReport => {
  const isHidden = (key: string) => config?.hiddenSections?.includes(key);

  const hasName = Boolean(data.name && data.name.trim().length >= 2);
  const hasEmail = Boolean(data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()));
  const hasPhone = Boolean(data.phone && data.phone.trim().length >= 7);
  const hasLinks = Boolean(data.github?.trim() || data.linkedin?.trim() || data.website?.trim());

  const hasSummary = Boolean(
    !isHidden("summary") &&
    data.professionalSummary &&
    data.professionalSummary.trim().length >= 40
  );

  const hasEducation = Boolean(
    !isHidden("education") &&
    Array.isArray(data.education) &&
    data.education.length > 0 &&
    data.education.some((e) => e.school?.trim() || e.degree?.trim())
  );

  const skillLines = getRenderableSkillLines(data) || [];
  const totalSkillCount = skillLines.reduce(
    (sum, s) => sum + (s?.value ? s.value.split(",").filter((x) => x.trim()).length : 0),
    0
  );
  const hasSkills = !isHidden("skills") && totalSkillCount >= 4;

  // Practical Evidence: either commercial experience OR portfolio projects
  const expCount = !isHidden("experience") && Array.isArray(data.experience) ? data.experience.length : 0;
  const projCount = !isHidden("projects") && Array.isArray(data.projects) ? data.projects.length : 0;
  const hasStrongEvidence = expCount >= 1 || projCount >= 2;

  // Bullet Point Quality Analysis
  const allBullets: string[] = [];
  if (Array.isArray(data.experience)) {
    data.experience.forEach((e) => {
      if (Array.isArray(e.bullets)) {
        e.bullets.forEach((b) => b && allBullets.push(String(b).trim()));
      }
    });
  }
  if (Array.isArray(data.projects)) {
    data.projects.forEach((p) => {
      if (Array.isArray(p.bullets)) {
        p.bullets.forEach((b) => b && allBullets.push(String(b).trim()));
      }
    });
  }

  const actionVerbBullets = allBullets.filter((b) => ACTION_VERB_REGEX.test(b)).length;
  const actionVerbRatio = allBullets.length > 0 ? actionVerbBullets / allBullets.length : 0;
  const hasActionableBullets = allBullets.length >= 2 && actionVerbRatio >= 0.4;

  const conciseBullets = allBullets.filter((b) => b.length >= 25 && b.length <= 220).length;
  const conciseRatio = allBullets.length > 0 ? conciseBullets / allBullets.length : 0;
  const hasGoodBulletLength = allBullets.length >= 2 && conciseRatio >= 0.7;

  // Formatting & Machine Readability
  const isSafeTypography = Boolean(
    (!config?.typography?.bodySize || config.typography.bodySize >= 9.0) &&
    (!config?.typography?.lineHeight || config.typography.lineHeight >= 1.1)
  );

  const checks: AtsCheckItem[] = [
    {
      id: "contact-info",
      title: "Reachable Contact Info",
      category: "structure",
      passed: hasName && hasEmail && hasPhone,
      scoreWeight: 15,
      explanation: "Full name, valid email address, and phone number in standard header format.",
      fixSection: "personal",
    },
    {
      id: "online-presence",
      title: "Verifiable Profile Links",
      category: "structure",
      passed: hasLinks,
      scoreWeight: 10,
      explanation: "GitHub, LinkedIn, or portfolio link for recruiter/ATS verification.",
      fixSection: "personal",
    },
    {
      id: "summary-clarity",
      title: "Standard Professional Summary",
      category: "content",
      passed: hasSummary,
      scoreWeight: 10,
      explanation: "Concise summary (40+ characters) establishing your engineering target role.",
      fixSection: "summary",
    },
    {
      id: "technical-matrix",
      title: "Categorized Technical Skills",
      category: "content",
      passed: hasSkills,
      scoreWeight: 15,
      explanation: "At least 4 recognized technical skills categorized in clean ATS text format.",
      fixSection: "skills",
    },
    {
      id: "academic-credentials",
      title: "Education & Degree Credentials",
      category: "structure",
      passed: hasEducation,
      scoreWeight: 10,
      explanation: "Degree, college institution, and graduation timeline specified.",
      fixSection: "education",
    },
    {
      id: "project-or-work-evidence",
      title: "Technical Track Record",
      category: "content",
      passed: hasStrongEvidence,
      scoreWeight: 20,
      explanation: expCount >= 1
        ? "Verifiable work experience entries with company and role."
        : projCount >= 2
        ? "Multiple technical projects demonstrating architecture and software delivery."
        : "Add at least 2 technical projects or commercial experience.",
      fixSection: expCount === 0 && projCount < 2 ? "projects" : "experience",
    },
    {
      id: "actionable-bullets",
      title: "Action-Oriented Bullet Points",
      category: "content",
      passed: hasActionableBullets,
      scoreWeight: 10,
      explanation: "Bullets begin with active technical verbs (Engineered, Architected, Built, Optimized).",
      fixSection: projCount > 0 ? "projects" : "experience",
    },
    {
      id: "bullet-length",
      title: "Optimal Bullet Density",
      category: "readability",
      passed: hasGoodBulletLength,
      scoreWeight: 5,
      explanation: "Bullets are concise (25–220 chars) without run-on sentences or sparse fragments.",
      fixSection: projCount > 0 ? "projects" : "experience",
    },
    {
      id: "machine-readable-layout",
      title: "Machine-Readable ATS Formatting",
      category: "readability",
      passed: isSafeTypography,
      scoreWeight: 5,
      explanation: "Clean single/double column hierarchy without text embedded in images.",
      fixSection: "formatting",
    },
  ];

  let rawScore = 0;
  const whyStrengths: string[] = [];
  const whyImprovements: string[] = [];

  for (const chk of checks) {
    if (chk.passed) {
      rawScore += chk.scoreWeight;
      whyStrengths.push(chk.title + ": " + chk.explanation);
    } else {
      whyImprovements.push(chk.title + ": " + chk.explanation);
    }
  }

  const score = Math.max(10, Math.min(100, Math.round(rawScore)));
  const passedCount = checks.filter((c) => c.passed).length;

  let label = "Needs Attention";
  if (score >= 90) label = "ATS Ready";
  else if (score >= 80) label = "Strong";
  else if (score >= 65) label = "Competitive";
  else if (score >= 45) label = "Developing";

  return {
    score,
    label,
    checks,
    passedCount,
    totalCount: checks.length,
    whyStrengths,
    whyImprovements,
  };
};

/**
 * Grounded Student-Aware Completeness Scoring (0–100)
 * Evaluates core identity, summary, skills, education, and practical evidence.
 * Does NOT penalize students for lacking employment history if portfolio projects exist.
 */
export const calculateCompletenessScore = (data: ResumeData): CompletenessReport => {
  const hasName = Boolean(data.name && data.name.trim().length >= 2);
  const hasContact = Boolean(data.email?.trim() && data.phone?.trim());
  const hasSummary = Boolean(data.professionalSummary && data.professionalSummary.trim().length >= 30);

  const skillLines = getRenderableSkillLines(data) || [];
  const totalSkills = skillLines.reduce(
    (sum, s) => sum + (s?.value ? s.value.split(",").filter((x) => x.trim()).length : 0),
    0
  );
  const hasSkills = totalSkills >= 4;

  const hasEducation = Boolean(Array.isArray(data.education) && data.education.length > 0);
  const expCount = Array.isArray(data.experience) ? data.experience.length : 0;
  const projCount = Array.isArray(data.projects) ? data.projects.length : 0;

  // Student-aware evidence check
  const hasPracticalEvidence = expCount >= 1 || projCount >= 2;
  const hasBasicEvidence = expCount >= 1 || projCount >= 1;

  const hasLinks = Boolean(data.github?.trim() || data.linkedin?.trim() || data.website?.trim());

  const items: CompletenessItem[] = [
    {
      key: "name",
      label: "Full Name",
      completed: hasName,
      points: 15,
      hint: "Add your full professional name",
      sectionId: "personal",
    },
    {
      key: "contact",
      label: "Email & Phone",
      completed: hasContact,
      points: 15,
      hint: "Provide valid email and reachable phone number",
      sectionId: "personal",
    },
    {
      key: "summary",
      label: "Professional Summary",
      completed: hasSummary,
      points: 15,
      hint: "Add 2-3 sentences introducing your background and technical focus",
      sectionId: "summary",
    },
    {
      key: "skills",
      label: "Technical Skills Matrix",
      completed: hasSkills,
      points: 15,
      hint: "Include at least 4 languages, frameworks, or tools",
      sectionId: "skills",
    },
    {
      key: "education",
      label: "Education & Degree",
      completed: hasEducation,
      points: 15,
      hint: "List your degree, university/college, and graduation date",
      sectionId: "education",
    },
    {
      key: "evidence",
      label: "Projects / Work Experience",
      completed: hasPracticalEvidence,
      points: 20,
      hint: "Add at least 2 technical projects (or 1 work experience entry)",
      sectionId: expCount === 0 ? "projects" : "experience",
    },
    {
      key: "links",
      label: "Online Presence (GitHub / LinkedIn / Portfolio)",
      completed: hasLinks,
      points: 5,
      hint: "Add GitHub or LinkedIn URL for verifiable evidence",
      sectionId: "personal",
    },
  ];

  let totalPoints = 0;
  for (const item of items) {
    if (item.completed) {
      totalPoints += item.points;
    } else if (item.key === "evidence" && hasBasicEvidence) {
      totalPoints += 10; // Partial credit for 1 project
    }
  }

  const score = Math.max(0, Math.min(100, totalPoints));
  const completedCount = items.filter((i) => i.completed).length;
  const missingCount = items.length - completedCount;

  let summaryText = "Complete and ready to export";
  if (score < 50) {
    summaryText = "Foundational sections missing";
  } else if (score < 80) {
    summaryText = "Core profile established, finish remaining items";
  } else if (score < 100) {
    summaryText = "Almost complete, review optional items";
  }

  return {
    score,
    items,
    missingCount,
    completedCount,
    summaryText,
  };
};
