import { generateJSON, TASK_TIERS } from "../../../services/groq.service.js";
import { buildCareerMentorPlan } from "./githubCareer.service.js";
import { CAREER_PROMPTS } from "../../../core/ai/prompts/career.prompts.js";
import { CareerMentorSchema } from "../../../core/ai/aiContracts.js";

/**
 * Generate a comprehensive, evidence-grounded Personal Developer Mentor plan using GPT-OSS-120B.
 */
export async function generatePersonalizedCareerMentorPlan({
  githubData,
  userSkillProfile = null,
  resumeData = null,
  targetRole = "Full Stack Developer",
}) {
  const deterministicPlan = buildCareerMentorPlan({
    githubData,
    userSkillProfile,
    resumeData,
    targetRole,
  });

  const fallback = {
    careerSummary: `Developer currently focused on ${githubData?.dominantLanguage || "JavaScript"} targeting ${targetRole}. Observed ${githubData?.profile?.publicRepos || 0} public repositories with ${githubData?.aggregateStats?.totalStars || 0} total stars.`,
    currentLevel: deterministicPlan.hero.currentStage || "Developing Software Engineer",
    strengths: [
      `Primary proficiency in ${githubData?.dominantLanguage || "JavaScript"}`,
      deterministicPlan.hero.strongestArea,
    ],
    weaknesses: [
      deterministicPlan.hero.biggestGap,
      "Portfolio could demonstrate more end-to-end production deployment and testing evidence",
    ],
    priorityActions: deterministicPlan.nextActions.slice(0, 3).map((a) => a.action),
    recommendedProjects: deterministicPlan.topProjectsToShowcase.map((p) => `Enhance "${p.repoName}" with automated tests, Docker, and comprehensive documentation`),
    recommendedSkills: [deterministicPlan.hero.biggestGap, "Docker", "CI/CD Pipelines"],
    careerPath: Array.isArray(deterministicPlan.careerPath)
      ? deterministicPlan.careerPath.map((c) => (typeof c === "object" ? `${c.stage || c.title}: ${c.focus || c.description}` : String(c)))
      : [
          `Current Stage: ${deterministicPlan.careerPath?.current || "Software Developer"}`,
          `Next Skill Focus: ${deterministicPlan.careerPath?.nextSkill || "Full Stack & Docker"}`,
          `Next Milestone Project: ${deterministicPlan.careerPath?.nextProject || "Production Full-Stack Application"}`,
          `Target Level: ${deterministicPlan.careerPath?.targetRole || targetRole}`,
        ],
    next30Days: Array.isArray(deterministicPlan.weeklyPlan)
      ? deterministicPlan.weeklyPlan.map((w) => `${w.id || w.week || "Task"}: ${w.task || w.focus}`)
      : ["Week 1-2: Add Dockerfile and README", "Week 3-4: Implement automated unit tests"],
    next90Days: [
      "Month 2: Implement full backend persistence and containerized microservices",
      "Month 3: Complete end-to-end integration tests and publish live deployed showcase portfolio",
    ],
  };

  const systemPrompt = CAREER_PROMPTS.PERSONAL_MENTOR.system;
  const userPrompt = [
    `Candidate Profile: @${githubData.username}`,
    `Target Role: ${targetRole}`,
    `Current Stage: ${deterministicPlan.hero.currentStage}`,
    `Dominant Language: ${githubData.dominantLanguage}`,
    `Strongest Observed Area: ${deterministicPlan.hero.strongestArea}`,
    `Identified Skill Gap: ${deterministicPlan.hero.biggestGap}`,
    `Top Projects: ${deterministicPlan.topProjectsToShowcase.map((p) => p.repoName).join(", ")}`,
    "",
    "Synthesize this evidence into a personalized career mentorship plan adhering to:",
    CAREER_PROMPTS.PERSONAL_MENTOR.userSchema,
  ].join("\n");

  const { data: mentorPlan } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 2000,
    taskTier: TASK_TIERS.HIGH_REASONING,
    fallbackData: fallback,
    schema: CareerMentorSchema,
    feature: "career_mentor_plan",
  });

  return { ...deterministicPlan, aiMentorPlan: mentorPlan || fallback };
}

/**
 * Generate a personalized grounded answer to a developer's career question.
 */
export async function answerMentorQuestion({
  question,
  githubData,
  targetRole = "Full Stack Developer",
  mentorPlan = null,
}) {
  const plan = mentorPlan || buildCareerMentorPlan({ githubData, targetRole });
  const fallback = generateFallbackMentorAnswer(question, plan, githubData, targetRole);

  const systemPrompt = CAREER_PROMPTS.QUESTION_ANSWER.system;
  const userPrompt = `Developer Profile:
Username: ${githubData.username}
Target Role: ${targetRole}
Current Stage: ${plan.hero.currentStage}
Strongest Area: ${plan.hero.strongestArea}
Biggest Gap: ${plan.hero.biggestGap}
Dominant Language: ${githubData.dominantLanguage}
Total Stars: ${githubData.aggregateStats?.totalStars || 0}
Total Repos: ${githubData.profile?.publicRepos || 0}
Top Projects: ${plan.topProjectsToShowcase.map((p) => p.repoName).join(", ")}

Question: "${question}"`;

  const { data: answer } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 1500,
    taskTier: TASK_TIERS.HIGH_REASONING,
    fallbackData: fallback,
    feature: "mentor_question_answer",
  });

  return answer && answer.currentSituation ? { ...fallback, ...answer } : fallback;
}

function generateFallbackMentorAnswer(question, plan, githubData, targetRole) {
  const q = String(question || "").toLowerCase();
  const dominant = githubData?.dominantLanguage || "JavaScript";

  let currentSituation = `You have strong foundations in ${dominant} and active project development, targeting the ${targetRole} track.`;
  let evidence = [
    `Observed ${githubData?.profile?.publicRepos || 0} public repositories with primary language ${dominant}.`,
    `Demonstrated repository originality with ${githubData?.aggregateStats?.totalStars || 0} community stars.`,
  ];
  let gap = plan.hero.biggestGap;
  let recommendation = `Focus on transforming your existing projects into full-stack production-ready applications with testing and Docker.`;
  let action = [
    `Select your top project (${plan.topProjectsToShowcase[0]?.repoName || "main project"}) and add automated unit tests.`,
    `Containerize the backend service with a Dockerfile and Docker Compose.`,
    `Document the architecture in a visual README diagram.`,
  ];
  let expectedOutcome = `This will provide direct proof of full-stack engineering proficiency for ${targetRole} hiring evaluations.`;

  if (q.includes("learn next") || q.includes("what should i learn")) {
    recommendation = `Prioritize learning ${plan.hero.biggestGap} to balance your stack proficiency.`;
    action = [
      `Complete a practical REST API and database integration sandbox task.`,
      `Learn Docker containerization fundamentals and write a clean Dockerfile.`,
    ];
  } else if (q.includes("which project") || q.includes("improve")) {
    const topProj = plan.topProjectsToShowcase[0]?.repoName || "your primary project";
    recommendation = `Focus your effort on improving "${topProj}" as it has the highest portfolio impact.`;
    action = [
      `Add comprehensive setup instructions and environment variable examples.`,
      `Implement GitHub Actions CI workflow to run test suites automatically.`,
    ];
  } else if (q.includes("ready") || q.includes("am i ready")) {
    recommendation = `You are progressing well in ${dominant}; closing the gaps in ${plan.hero.biggestGap} will reach full job readiness.`;
  }

  return {
    question,
    currentSituation,
    evidence,
    gap,
    recommendation,
    action,
    expectedOutcome,
  };
}
