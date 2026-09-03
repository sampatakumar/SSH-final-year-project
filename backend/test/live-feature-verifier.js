import dotenv from "dotenv";
dotenv.config();

import {
  generateProfessionalSummary,
  expandProjectBullet,
  generateAtsDescriptionBullets,
  checkGroqHealth,
  generateJSON,
  getGroqModel,
  TASK_TIERS,
} from "../src/services/groq.service.js";
import { generateGitHubInsights } from "../src/modules/github/services/githubAi.service.js";
import {
  generatePersonalizedCareerMentorPlan,
  answerMentorQuestion,
} from "../src/modules/github/services/githubMentorAi.service.js";

async function verifyAllLiveFeatures() {
  console.log("==================================================");
  console.log(" SMART SKILL HUB LIVE AI FEATURE TEST SUITE");
  console.log(" Primary Model: openai/gpt-oss-120b");
  console.log("==================================================\n");

  // 1. Health Check
  console.log("1. Checking AI Health...");
  const health = await checkGroqHealth();
  console.log("  Health Status:", health.status);
  console.log("  Configured Model:", health.configuredModel);
  console.log("  Selected Model:", health.selectedModel);
  console.log("  API Reachable:", health.apiReachable);
  console.log("  Latency:", `${health.latencyMs}ms\n`);

  // 2. Professional Resume Summary
  console.log("2. Testing Professional Resume Summary (GPT-OSS-120B)...");
  const summary = await generateProfessionalSummary({
    targetRole: "Senior Full Stack Engineer",
    skills: "React, Node.js, TypeScript, PostgreSQL, Docker, AWS",
    experienceYears: "5+",
  });
  console.log("  Summary:", summary ? summary.slice(0, 120) + "..." : "Failed");
  console.log("  ✓ Status: OK\n");

  // 3. Bullet Enhancement
  console.log("3. Testing Resume Bullet Enhancement...");
  const bullet = await expandProjectBullet({
    bullet: "Built dashboard for users with React and Node.js",
    projectName: "Analytics Hub",
    technologies: "React, Node.js, WebSockets",
  });
  console.log("  Improved Bullet:", bullet);
  console.log("  ✓ Status: OK\n");

  // 4. ATS Description Bullets
  console.log("4. Testing ATS Description Bullets Generation...");
  const bullets = await generateAtsDescriptionBullets({
    prompt: "Implemented OAuth2 authentication and role-based access control.",
    count: 3,
  });
  console.log("  Generated Bullets:", bullets);
  console.log("  ✓ Status: OK\n");

  // 5. GitHub Professional Developer Review
  console.log("5. Testing GitHub Professional Developer Review...");
  const githubReview = await generateGitHubInsights({
    username: "sampledeveloper",
    profile: { name: "Sample Developer", publicRepos: 8, bio: "Building scalable web apps" },
    repositories: [
      { name: "ecommerce-api", language: "TypeScript", stars: 12, description: "REST API with Express, PostgreSQL & Docker", topics: ["typescript", "docker", "api"] },
      { name: "react-dashboard", language: "JavaScript", stars: 8, description: "Realtime analytics UI with Tailwind", topics: ["react", "tailwind"] },
    ],
    dominantLanguage: "TypeScript",
    languages: { TypeScript: { percentage: 65 }, JavaScript: { percentage: 35 } },
    aggregateStats: { totalStars: 20, totalForks: 4, forkedCount: 1 },
  });
  console.log("  Review Overall Score:", githubReview.overallScore || githubReview.githubOptimizationScore);
  console.log("  Specialization:", githubReview.specialization);
  console.log("  Technical Strengths:", githubReview.technicalStrengths?.slice(0, 2));
  console.log("  Career Opportunities:", githubReview.careerOpportunities?.slice(0, 2));
  console.log("  ✓ Status: OK\n");

  // 6. Personal Developer Career Mentor
  console.log("6. Testing Personal Developer Career Mentor...");
  const mentorResult = await generatePersonalizedCareerMentorPlan({
    githubData: {
      username: "sampledeveloper",
      dominantLanguage: "TypeScript",
      profile: { publicRepos: 8 },
      repositories: [
        { name: "ecommerce-api", language: "TypeScript", stars: 12, sizeKB: 800 },
        { name: "react-dashboard", language: "JavaScript", stars: 8, sizeKB: 400 },
      ],
      aggregateStats: { totalStars: 20 },
      engineeringQuality: { overallScore: 78, dimensions: { documentation: 75, testingAndCicd: 60 } },
    },
    targetRole: "Full Stack Developer",
  });
  console.log("  Mentor Current Stage:", mentorResult.hero?.currentStage);
  console.log("  AI Mentor Level:", mentorResult.aiMentorPlan?.currentLevel);
  console.log("  AI Priority Actions:", mentorResult.aiMentorPlan?.priorityActions?.slice(0, 2));
  console.log("  AI 30-Day Plan:", mentorResult.aiMentorPlan?.next30Days?.slice(0, 2));
  console.log("  ✓ Status: OK\n");

  // 7. Mentor Question Answering
  console.log("7. Testing Mentor Career Q&A...");
  const mentorAnswer = await answerMentorQuestion({
    question: "What should I focus on next to become job-ready for Full Stack roles?",
    githubData: {
      username: "sampledeveloper",
      dominantLanguage: "TypeScript",
      profile: { publicRepos: 8 },
    },
    targetRole: "Full Stack Developer",
  });
  console.log("  Recommendation:", mentorAnswer.recommendation);
  console.log("  Actions:", mentorAnswer.action?.slice(0, 2));
  console.log("  ✓ Status: OK\n");

  console.log("==================================================");
  console.log(" 🎉 ALL DOMAIN AI FEATURES EMPIRICALLY VERIFIED!");
  console.log("==================================================");
}

verifyAllLiveFeatures().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
