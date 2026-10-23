import { mentorCourseRecommendationService } from "./mentor-course-recommendation.service.js";

/**
 * Smart Mentor Local NLP / Deterministic Fallback Engine
 * Ultra-fast (<10ms) rule-based and intent-classified guidance engine grounded strictly
 * in actual Smart Skill Hub user context.
 */

export class SmartMentorLocalService {
  /**
   * Classify user query intent into standardized categories.
   */
  classifyIntent(message) {
    const text = (message || "").toLowerCase().trim();

    // 1. High-priority specific adaptive learning coaching queries (Phase 16)
    if (/failed.*(challenge|task|code|coding|test)|teach.*missing concept/i.test(text)) {
      return "failed_challenge_remediation";
    }

    if (/completed.*(module|video|lesson)|what (should i|do i|to) practice/i.test(text)) {
      return "post_module_practice";
    }

    if (/compare.*(role|progress)|frontend.*(vs|and).*backend|compare.*frontend.*backend/i.test(text)) {
      return "multi_role_comparison";
    }

    if (/why (am i|is my|are we).*weak|why.*gap|why.*low.*score/i.test(text)) {
      return "why_skill_weak";
    }

    if (/ready for.*milestone|next.*milestone|roadmap milestone|am i ready for the next/i.test(text)) {
      return "milestone_readiness";
    }

    // 2. Cross-Module Competency, Revision, Badges & Unified Action queries (Phase 41)
    if (/add.*badge.*resume|resume.*badge|showcase.*(credential|badge)/i.test(text)) {
      return "resume_badge_guidance";
    }

    if (/competenc(y|ies)|badge|badges|verifiable skill badge|credential/i.test(text)) {
      return "competency_matrix";
    }

    if (/spaced revision|revision|retention|forgetting curve|flashcard|due review/i.test(text)) {
      return "retention_revision";
    }

    if (/how have i improved|progress explanation|my progress|recent improvement|learning progress narrative/i.test(text)) {
      return "personalized_progress";
    }

    if (/next action|what to do next|next priority|across modules|what should i do next/i.test(text)) {
      return "unified_next_action";
    }

    // Multi-Branch Academic Discipline & Capability queries (Phase 42)
    if (/capabilit(y|ies)|what tools|simulation.*branch|cad.*support|circuit.*support/i.test(text)) {
      return "branch_capabilities";
    }

    if (/academic branch|my branch|academic background|degree and branch|discipline|specialization|cross-disciplinary|switch.*branch|mechanical student|civil student|ece student|branch guidance/i.test(text)) {
      return "academic_branch_guidance";
    }

    // 3. GitHub and project queries
    if (/github|repo|repositories|commit|push|pull request/i.test(text)) {
      if (/readme/i.test(text)) return "github_readme";
      if (/description|desc|about/i.test(text)) return "github_repository";
      return "github_review";
    }

    if (/gap|gaps|weakness|lacking|missing skill/i.test(text)) {
      return "skill_gaps";
    }

    if (/what should i learn|learn next|next skill|next topic|should i learn/i.test(text)) {
      return "next_skill";
    }

    if (/ready|readiness|fit for|qualify|full stack|backend|frontend/i.test(text) && /role|job|engineer|developer/i.test(text)) {
      return "career_progress";
    }

    if (/progress|how am i doing|score|overall|stats|evaluation/i.test(text)) {
      return "career_progress";
    }

    if (/30 day|thirty day|plan|week|schedule|roadmap|month/i.test(text)) {
      return "career_plan";
    }

    if (/project|build next|portfolio|idea|app idea/i.test(text)) {
      if (/idea|build next|what project/i.test(text)) return "project_idea";
      return "project_improvement";
    }

    if (/resume|cv|ats|summary|bullet/i.test(text)) {
      return "resume_improvement";
    }

    if (
      /teach me|learn|full course|complete course|best course|course for|recommend.*course|playlist for|roadmap for|tutorial for/i.test(text) ||
      (/(python|javascript|react|java|node|machine learning|full stack|devops|docker|golang|rust|data science|dsa)/i.test(text) &&
        /(course|learn|tutorial|teach|playlist|start|guide|video|dsa)/i.test(text))
    ) {
      return "course_recommendation";
    }

    if (/edutube|video|watch|lesson/i.test(text)) {
      return "learning_progress";
    }

    if (/interview|placement|coding round|dsa|hiring/i.test(text)) {
      return "interview";
    }

    return "general_developer";
  }

  /**
   * Generate grounded, actionable response when Groq is unavailable or times out.
   *
   * @param {string} userMessage - Raw user question
   * @param {object} context - Grounded normalized user context
   * @returns {object} Standardized response object
   */
  generateLocalResponse(userMessage, context) {
    const intent = this.classifyIntent(userMessage);
    const targetRole = context.career?.targetRole || "Full Stack Developer";
    const readiness = context.career?.readinessScore ?? 65;
    const topGaps = context.skillGaps || [];
    const topGapName = topGaps[0]?.skill || "System Design & Cloud";
    const github = context.github || {};
    const learning = context.learning || {};
    const projects = context.projects || [];
    const matrix = context.competencyMatrix?.matrix || [];
    const earnedBadges = context.earnedBadges || [];
    const retentionHealth = context.retentionHealth || { revisionsDueToday: 0, streak: 0, totalCards: 0, masteredCards: 0 };
    const evidenceTiers = context.evidenceTiers || { verified: [], inferred: [], selfReported: [], missing: [] };
    const unifiedNextActions = context.unifiedNextActions || [];

    let answer = "";
    let summary = "";
    const actions = [];
    const references = [];

    switch (intent) {
      case "github_readme": {
        if (github.connectionState === "not_connected") {
          answer = `Your **GitHub account is not connected** yet.

Once you link GitHub in **Settings → Connected Accounts**, I will automatically scan all your repositories, detect missing documentation, and provide step-by-step README templates tailored to your tech stack.`;
          summary = "GitHub is not connected yet.";
          actions.push({
            title: "Connect GitHub in Settings",
            priority: "high",
            category: "github",
            estimatedMinutes: 2,
            route: "/dashboard/settings",
          });
          break;
        }

        if (github.connectionState === "sync_failed") {
          answer = `GitHub is connected (@${github.username}), but the latest synchronization failed (${github.syncError || "API rate limit"}).

Please click **Sync Now** in Settings to refresh your repository data.`;
          summary = "GitHub synchronization failed. Re-sync required.";
          actions.push({
            title: "Sync GitHub in Settings",
            priority: "high",
            category: "github",
            estimatedMinutes: 2,
            route: "/dashboard/settings",
          });
          break;
        }

        const withoutReadme = github.repositoriesWithoutReadme || 0;
        const repoExamples = github.reposWithoutReadmeList?.slice(0, 3).join(", ") || "your top repositories";

        answer = `Based on your synchronized GitHub data, you have **${withoutReadme} repositories** that need README documentation (such as ${repoExamples}).

### Recommended README Structure:
1. **Header & Problem Statement**: What problem does this solve and why did you build it?
2. **Key Technical Features**: Bulleted breakdown of capabilities and technical choices.
3. **Architecture & Tech Stack**: Highlight languages (${github.topLanguages?.join(", ") || "JavaScript"}), libraries, and databases.
4. **Local Setup & Instructions**: \`git clone\`, \`npm install\`, environment variables configuration.
5. **Screenshots & Live Demo**: Include working deployment links or interactive UI previews.`;

        summary = `Identified ${withoutReadme} repositories needing README documentation.`;
        if (github.reposWithoutReadmeList?.length > 0) {
          actions.push({
            title: `Add comprehensive README to ${github.reposWithoutReadmeList[0]}`,
            priority: "high",
            category: "github",
            estimatedMinutes: 30,
            route: "/dashboard/github",
          });
        }
        actions.push({
          title: "Review GitHub Intelligence audit",
          priority: "medium",
          category: "github",
          estimatedMinutes: 15,
          route: "/dashboard/github",
        });
        break;
      }

      case "github_repository":
      case "github_review": {
        if (github.connectionState === "not_connected" || (!github.hasAnalysis && (github.repositoryCount || 0) === 0)) {
          const academicNote = !context.career?.academic?.isConfigured
            ? "\n\nAdditionally, your academic profile is not yet configured. Please configure your degree, branch, and semester in Academic Profile settings."
            : "";

          answer = `Your **GitHub account is not connected** yet (or no public repositories have been synchronized). Connect GitHub in Settings to unlock automated repository auditing and career intelligence.${academicNote}`;
          summary = "GitHub not connected or no repositories synced.";
          actions.push({
            title: "Connect GitHub in Settings",
            priority: "high",
            category: "github",
            estimatedMinutes: 2,
            route: "/dashboard/settings",
          });
          break;
        }

        if (github.connectionState === "sync_failed") {
          answer = `GitHub is connected (@${github.username}), but your latest repository data could not be synchronized (${github.syncError || "API error"}).

Go to **Settings** and click **Sync Now** to refresh your profile.`;
          summary = "GitHub sync failed. Re-sync required.";
          actions.push({
            title: "Sync GitHub in Settings",
            priority: "high",
            category: "github",
            estimatedMinutes: 2,
            route: "/dashboard/settings",
          });
          break;
        }

        const withoutDesc = github.repositoriesWithoutDescription || 0;
        const totalRepos = github.repositoryCount || 0;
        const optScore = github.optimizationScore || 70;

        answer = `### GitHub Profile & Repository Audit (@${github.username || "user"})
- **Repository Count**: ${totalRepos}
- **Repositories Missing Descriptions**: ${withoutDesc}
- **Optimization Score**: ${optScore}/100
- **Primary Languages**: ${github.topLanguages?.join(", ") || "JavaScript"}

### High-Priority Improvements:
1. **Add concise one-line descriptions** to the ${withoutDesc} repositories lacking them so recruiters instantly understand their purpose.
2. **Pin your top 3 projects** relevant to ${targetRole}.
3. **Include live demo URLs and topics/tags** to increase discoverability.
4. **Ensure continuous commit activity** on your main engineering initiatives.`;

        summary = `GitHub profile review: ${totalRepos} repos, ${withoutDesc} missing descriptions.`;
        actions.push({
          title: "Add descriptions to uncataloged repositories",
          priority: "high",
          category: "github",
          estimatedMinutes: 20,
          route: "/dashboard/github",
        });
        actions.push({
          title: "Pin top 3 showcase projects on GitHub",
          priority: "medium",
          category: "github",
          estimatedMinutes: 10,
          route: "/dashboard/github",
        });
        break;
      }

      case "skill_gaps": {
        if (topGaps.length > 0) {
          const gapList = topGaps
            .slice(0, 4)
            .map((g, idx) => `${idx + 1}. **${g.skill}** — Priority: *${g.priority}* (Current score: ${g.currentScore}/100 vs Required: ${g.targetScore}/100)`)
            .join("\n");

          answer = `Here are your primary skill gaps for **${targetRole}**:

${gapList}

### Next Strategic Steps:
- Focus immediately on **${topGapName}** as it carries the highest weight for your target role readiness.
- Review hands-on documentation and complete targeted learning tracks on EduTube to close these gaps with verified project evidence.`;

          summary = `Top skill gap is ${topGapName} (${topGaps[0]?.priority} priority).`;
          actions.push({
            title: `Close ${topGapName} skill gap`,
            priority: "critical",
            category: "skills",
            estimatedMinutes: 60,
            route: "/dashboard/gaps",
          });
          actions.push({
            title: `Explore ${topGapName} courses on EduTube`,
            priority: "high",
            category: "edutube",
            estimatedMinutes: 45,
            route: "/dashboard/edutube",
          });
        } else {
          answer = `Great work! You have no critical skill gaps recorded for **${targetRole}**. Continue building advanced production projects and preparing for technical architecture interviews.`;
          summary = "No critical skill gaps found.";
        }
        break;
      }

      case "next_skill": {
        answer = `To maximize your readiness for **${targetRole}**, your next focus should be **${topGapName}**.

### Why This Priority:
- It directly addresses your highest weighted competency gap.
- It pairs with your existing foundation in ${context.skills?.slice(0, 2).map((s) => s.name).join(", ") || "core web development"}.
- Demonstrating ${topGapName} in your projects will distinguish your technical portfolio.`;

        summary = `Recommended next skill to master: ${topGapName}.`;
        actions.push({
          title: `Start ${topGapName} learning track`,
          priority: "high",
          category: "learning",
          estimatedMinutes: 45,
          route: "/dashboard/edutube",
        });
        actions.push({
          title: "View recommended practice tasks",
          priority: "medium",
          category: "skills",
          estimatedMinutes: 30,
          route: "/dashboard/skills",
        });
        break;
      }

      case "career_progress": {
        const topSkillsStr = context.skills?.slice(0, 3).map((s) => `${s.name} (${s.level})`).join(", ") || "Core Programming";
        const academicLine = context.career?.academic?.isConfigured
          ? `- **Academic Pathway**: ${[context.career.academic.branchName, context.career.academic.degreeName].filter(Boolean).join(", ")}${context.career.academic.currentYear ? ` (Year ${context.career.academic.currentYear})` : ""}\n`
          : "";

        answer = `### Career Progress Report for ${targetRole}
${academicLine}- **Overall Role Readiness Score**: ${readiness}/100
- **Verified Strengths**: ${topSkillsStr}
- **Primary Gaps to Close**: ${topGaps.slice(0, 2).map((g) => g.skill).join(", ") || "None"}
- **GitHub Projects Tracked**: ${github.repositoryCount || 0} repositories
- **EduTube Learning Modules**: ${learning.completedVideos || 0} completed / ${learning.videosWatched || 0} watched

### Assessment:
${
  readiness >= 75
    ? "You are in a strong position for entry to mid-level roles! Focus on interview preparation and system design."
    : "You have a solid foundation. Closing your top skill gaps and polishing your GitHub repository documentation will bridge the gap to full readiness."
}`;

        summary = `Role Readiness: ${readiness}/100 for ${targetRole}.`;
        actions.push({
          title: "Review detailed Skill Matrix",
          priority: "medium",
          category: "career",
          estimatedMinutes: 15,
          route: "/dashboard/skills",
        });
        break;
      }

      case "career_plan": {
        answer = `### 30-Day Technical Career Action Plan (${targetRole})

#### Week 1: Close Highest-Priority Gap
- Focus on **${topGapName}** via interactive coding and EduTube masterclasses.
- Build a minimal standalone proof-of-concept repository.

#### Week 2: GitHub Repository Hygiene
- Add README documentation and live demo links to your top ${Math.min(github.repositoryCount || 3, 3)} projects.
- Add clear architecture diagrams and installation guides.

#### Week 3: Project Integration
- Integrate ${topGapName} into one of your existing applications (${projects[0]?.name || "Full Stack Application"}).
- Write automated tests and setup CI/CD workflow.

#### Week 4: Resume & ATS Optimization
- Update your Master Profile with new verified skills and project achievements.
- Tailor your resume summary and practice technical coding assessments.`;

        summary = `30-Day structured learning and profile optimization plan.`;
        actions.push({
          title: "Review Learning Roadmap milestones",
          priority: "high",
          category: "career",
          estimatedMinutes: 20,
          route: "/dashboard/roadmap",
        });
        break;
      }

      case "project_idea":
      case "project_improvement": {
        const techStack = context.skills?.slice(0, 3).map((s) => s.name).join(" + ") || "React + Node.js";

        answer = `### High-Impact Project Recommendations
To best showcase your skills for **${targetRole}**, consider building:

1. **Production-Ready Multi-Tenant SaaS App** combining \`${techStack}\` with \`${topGapName}\`.
2. **Real-time Collaboration Workspace** (featuring WebSockets, caching, and role-based access control).
3. **Developer Automation Tooling / CLI** with comprehensive test coverage and documentation.

### Key Quality Signals to Include:
- Clean modular directory structure.
- Comprehensive \`README.md\` with architecture diagrams.
- Dockerfile & CI/CD workflow.
- Live deployment link in repository header.`;

        summary = `Recommended project ideas combining ${techStack} and ${topGapName}.`;
        actions.push({
          title: "Generate project syllabus on EduTube",
          priority: "medium",
          category: "edutube",
          estimatedMinutes: 30,
          route: "/dashboard/edutube",
        });
        break;
      }

      case "resume_improvement": {
        answer = `### Key Resume Recommendations for ${targetRole}
1. **Highlight Core Competencies**: Ensure ${context.skills?.slice(0, 4).map((s) => s.name).join(", ") || "your top languages"} are clearly visible in your Skills section.
2. **Action + Metric Bullets**: Frame project bullets using the formula: *Action Verb + Technology Stack + Business Metric / Impact*.
3. **Verify Links**: Ensure GitHub profile, LinkedIn URL, and deployed demo links are clickable and live.
4. **ATS Alignment**: Match job description keywords strictly to real experience without keyword stuffing.`;

        summary = `Resume enhancement tips focused on ATS keywords and measurable impact.`;
        actions.push({
          title: "Enhance resume bullets in Resume AI",
          priority: "high",
          category: "resume",
          estimatedMinutes: 20,
          route: "/dashboard/resumes",
        });
        break;
      }

      case "course_recommendation": {
        const rec = mentorCourseRecommendationService.getRecommendationsSynchronous(userMessage, context);
        const topCourse = rec.shortlist?.[0];
        const comparison = rec.comparison;
        const pkg = rec.learningPackage;

        const courseBullets = (rec.shortlist || [])
          .map(
            (c, i) =>
              `${i + 1}. **[${c.title}](${c.youtubeUrl})** — *${c.channelTitle}*\n   - **Type**: \`${c.courseType}\` | **Level**: \`${c.level}\` ${c.duration?.formatted ? `| **Duration**: ${c.duration.formatted}` : ""}\n   - **Why Recommended**: ${c.whyMatches}\n   - **Key Topics**: ${(c.topicsCovered || []).slice(0, 4).join(", ")}\n   - **Limitations**: ${(c.limitations || [])[0] || "None"}`
          )
          .join("\n\n");

        const comparisonLines = (comparison?.courses || [])
          .map(
            (cp) =>
              `- **${cp.title}** (${cp.instructor}): ${cp.strength}. *Best for:* ${cp.bestFor}. *Trade-off:* ${cp.tradeOff}.`
          )
          .join("\n");

        answer = `### Top Recommended YouTube Courses & Learning Package: ${rec.intent.technologyName}

${comparison?.startingRecommendationReason || ""}

#### Verified Course Shortlist:
${courseBullets}

#### Course Comparison & Trade-Offs:
${comparisonLines}

#### 10-Point Structured Learning Package:
- **Prerequisites**: ${pkg?.prerequisites?.join(", ") || "None"}
- **Core Modules**: ${pkg?.modules?.length || 0} structured phases covering fundamentals through full projects.
- **Capstone Project**: **${pkg?.projects?.capstoneProject?.title || "Full Stack Application"}** — ${pkg?.projects?.capstoneProject?.description || ""}
- **Hands-on Coding**: Practice targeted challenges in the Smart Skill Hub Coding Sandbox.
- **Measurable Milestones**: ${pkg?.milestones?.[0] || "Pass sandbox tests"}

> **Mastery Note**: Watching video courses builds mental models, but true skill mastery requires implementing projects and passing automated test suites in the Coding Sandbox.`;

        summary = `Recommended top YouTube courses and 10-point learning roadmap for ${rec.intent.technologyName}.`;

        actions.push({
          title: `Start ${rec.intent.technologyName} Course on EduTube`,
          priority: "high",
          category: "edutube",
          estimatedMinutes: 60,
          route: topCourse?.edutubeUrl || "/dashboard/edutube",
        });

        actions.push({
          title: `Practice ${rec.intent.technologyName} Coding Challenges`,
          priority: "high",
          category: "skills",
          estimatedMinutes: 30,
          route: "/dashboard/coding",
        });

        for (const c of rec.shortlist || []) {
          references.push({
            title: `${c.title} (${c.channelTitle})`,
            type: "youtube_course",
            url: c.youtubeUrl,
          });
        }

        return {
          answer,
          summary,
          actions,
          references,
          confidence: 0.95,
          source: "local_nlp",
          intent,
          courseRecommendations: rec,
          learningPackage: pkg,
        };
      }

      case "failed_challenge_remediation": {
        const topGaps = context.skillGaps || [];
        const focalSkill = topGaps[0]?.skill || "Coding Challenge";

        answer = `### Targeted Remediation: Overcoming Challenge Difficulty in ${focalSkill}

Failing automated sandbox tests is a **normal and essential part of engineering growth**. It reveals concrete edge cases and hidden boundary conditions that require refinement.

### Diagnostic Strategy:
1. **Isolate the Failing Test Cases**: Review input edge cases (e.g., empty arrays, null inputs, unexpected types, off-by-one indices).
2. **Step Through Missing Concepts**: Often a failed test stems from unhandled asynchronous logic, memory mutations, or inefficient time complexity.
3. **Foundational Concept Review**: Review the core syntax and pattern on EduTube before re-executing.
4. **Iterative Local Testing**: Test boundary values on your local machine or in the sample test runner first before submitting against all hidden unit tests.`;

        summary = `Targeted remediation plan for failed coding challenge in ${focalSkill}.`;
        actions.push({
          title: `Retry ${focalSkill} challenge in Sandbox`,
          priority: "critical",
          category: "skills",
          estimatedMinutes: 30,
          route: "/dashboard/coding",
        });
        actions.push({
          title: `Review ${focalSkill} core concepts on EduTube`,
          priority: "high",
          category: "edutube",
          estimatedMinutes: 45,
          route: "/dashboard/edutube",
        });
        break;
      }

      case "post_module_practice": {
        const focalSkill = topGaps[0]?.skill || "Core Programming";
        const coding = context.coding || {};

        answer = `### Learning Outcome Validation: Next Practice Step

Congratulations on completing your educational lesson!

> **Competency Boundary**: Watching videos builds valuable conceptual understanding and mental models, but **true technical competency requires writing code that passes automated test suites in an isolated environment**.

### Immediate Practical Action:
- Put the concepts into practice right now in the **Smart Skill Hub Coding Sandbox**.
- Your profile records **${coding.passedCount || 0} verified test suite passes** out of ${coding.totalSubmissions || 0} attempts.
- Solving the corresponding challenge will immediately update your empirical mastery and narrow your skill gap for **${targetRole}**.`;

        summary = `Validate completed video lesson by passing practical sandbox challenge in ${focalSkill}.`;
        actions.push({
          title: `Solve ${focalSkill} challenge in Sandbox`,
          priority: "critical",
          category: "skills",
          estimatedMinutes: 30,
          route: "/dashboard/coding",
        });
        actions.push({
          title: "Inspect updated skill profile",
          priority: "medium",
          category: "skills",
          estimatedMinutes: 10,
          route: "/dashboard/skills",
        });
        break;
      }

      case "multi_role_comparison": {
        const targetRoles = context.career?.targetRoles || ["Frontend Developer", "Backend Developer", "Full Stack Developer"];
        const readiness = context.career?.readinessScore ?? 65;

        answer = `### Multi-Role Progress & Benchmark Comparison
- **Current Target Role**: **${targetRole}** (Readiness Score: **${readiness}/100**)
- **Tracked Career Roles**: ${targetRoles.join(", ")}

### Role Competency Profiles:
1. **Frontend Developer**:
   - Focus: Component architecture, responsive UI, DOM APIs, state management (React, TypeScript).
   - Core Gap: ${(context.skillGaps || []).filter((g) => ["React", "CSS", "TypeScript", "HTML"].includes(g.skill)).map((g) => g.skill).join(", ") || "None recorded"}.
2. **Backend Developer**:
   - Focus: RESTful APIs, relational/document databases, Docker containerization, asynchronous Node.js.
   - Core Gap: ${(context.skillGaps || []).filter((g) => ["Docker", "Node.js", "MongoDB", "REST APIs"].includes(g.skill)).map((g) => g.skill).join(", ") || "Docker, Database Scaling"}.
3. **Full Stack Developer**:
   - Synthesis of both frontend state and backend deployment pipelines.

You can switch your active benchmark anytime in **Settings → Career Goals** without losing any recorded progress.`;

        summary = `Multi-role comparison between ${targetRoles.join(" and ")}.`;
        actions.push({
          title: "Compare multi-role benchmarks",
          priority: "medium",
          category: "skills",
          estimatedMinutes: 15,
          route: "/dashboard/gaps",
        });
        break;
      }

      case "why_skill_weak": {
        const firstGap = (context.skillGaps || [])[0];
        const gapName = firstGap?.skill || "Target Skills";
        const gapScore = firstGap?.currentScore ?? 0;
        const targetScore = firstGap?.targetScore ?? 75;

        answer = `### Evidence Breakdown: Why ${gapName} is Identified as a Gap
- **Current Score**: ${gapScore}/100
- **Target Role Expectation**: ${targetScore}/100 for ${targetRole}
- **Evidence State**: *${firstGap?.evidenceState || (gapScore === 0 ? "Missing Evidence" : "Developing")}*

### Why this happens:
1. **Lack of Direct Evidence**: The platform requires verifiable proof (e.g. passing test suites in the Coding Sandbox or synchronized GitHub repositories showcasing production architecture).
2. **Missing Prerequisites**: Complex tools like Docker require foundational networking and command line comfort.
3. **Unassessed Capability**: If you have not submitted code or connected repositories using ${gapName}, the system conservatively scores it as a gap rather than assuming unverified mastery.`;

        summary = `Evidence breakdown for ${gapName} gap (${gapScore}/${targetScore}).`;
        actions.push({
          title: `Demonstrate ${gapName} in Sandbox`,
          priority: "high",
          category: "skills",
          estimatedMinutes: 30,
          route: "/dashboard/coding",
        });
        break;
      }

      case "milestone_readiness": {
        const passedCount = context.coding?.passedCount || 0;
        const watchedCount = context.learning?.completedVideos || 0;
        const isReady = passedCount >= 1 && readiness >= 60;

        answer = `### Roadmap Milestone Readiness Assessment
- **Role Readiness**: ${readiness}/100
- **Verified Sandbox Challenges**: ${passedCount} passed
- **EduTube Modules Completed**: ${watchedCount} modules

${isReady
  ? `✅ **You are ready for your next roadmap milestone!** You have demonstrated empirical foundation in your core stack. Proceed to integrate these skills into an end-to-end full-stack capstone project.`
  : `⏳ **Preparation Needed**: Before advancing to the next milestone, we recommend completing at least one verified coding challenge in the sandbox to solidify your practical evidence.`}
`;

        summary = isReady ? "Ready for next milestone!" : "Prerequisite practice needed before advancing.";
        actions.push({
          title: isReady ? "View next milestone on Roadmap" : "Complete pending challenge",
          priority: "high",
          category: "learning",
          estimatedMinutes: 30,
          route: isReady ? "/dashboard/roadmap" : "/dashboard/coding",
        });
        break;
      }

      case "competency_matrix": {
        const demonstrated = matrix.filter((c) => c.status === "DEMONSTRATED");
        const incomplete = matrix.filter((c) => c.status !== "DEMONSTRATED");

        let demonstratedText = "";
        if (demonstrated.length > 0) {
          demonstratedText = demonstrated.map((c) => `- **${c.name}** (${c.canonicalSkill}): Demonstrated (${c.earnedPoints}/${c.totalPoints} pts) [${c.badgeEligible ? "Badge Eligible" : "Demonstrated"}]`).join("\n");
        } else {
          demonstratedText = "_No competencies currently marked Demonstrated. Pass sandbox challenges and checkpoint quizzes to establish empirical proof._";
        }

        let incompleteText = "";
        if (incomplete.length > 0) {
          incompleteText = incomplete.slice(0, 3).map((c) => {
            const missingCriteria = c.missingRequirements?.join(", ") || "Additional practical evidence needed";
            return `- **${c.name}**: Incomplete (${c.earnedPoints}/${c.totalPoints} pts) — _Missing: ${missingCriteria}_`;
          }).join("\n");
        } else {
          incompleteText = "_All tracked competencies have met demonstrated criteria!_";
        }

        answer = `### Verified Competency Matrix & Badges Overview
**Tracked Competencies**: ${matrix.length} | **Demonstrated**: ${demonstrated.length} | **Badges Earned**: ${earnedBadges.length}

#### Demonstrated Competencies:
${demonstratedText}

#### Competencies Needing Evidence:
${incompleteText}

> **Note on Credentials**: Smart Skill Hub competency badges represent verified internal achievement against platform rubric criteria (sandbox tests, quizzes, spaced retrieval). They are cryptographically verifiable records of your demonstrated skill, not third-party university degrees.`;

        summary = `Competency Matrix: ${demonstrated.length}/${matrix.length} demonstrated, ${earnedBadges.length} verified badges earned.`;
        actions.push({
          title: "Inspect Competency Matrix",
          priority: "high",
          category: "skills",
          estimatedMinutes: 10,
          route: "/dashboard/skills",
        });
        break;
      }

      case "retention_revision": {
        const dueToday = retentionHealth.revisionsDueToday || 0;
        const streak = retentionHealth.streak || 0;
        const mastered = retentionHealth.masteredCards || 0;
        const total = retentionHealth.totalCards || 0;

        answer = `### Spaced Retrieval & Memory Retention Health
- **Cards Due Today**: ${dueToday}
- **Retrieval Streak**: ${streak} consecutive reviews
- **Mastered Cards**: ${mastered} of ${total} cards

${dueToday > 0
  ? `⚠️ **Action Required**: You have ${dueToday} review(s) scheduled for today. Completing these flashcard retrievals now halts the Ebbinghaus forgetting curve and locks concepts into long-term memory.`
  : `✅ **Up to Date**: All spaced revision cards are currently up to date! Great job maintaining your memory retention.`}

Retrieval practice forces active recall, which establishes significantly more durable retention than passive video watching.`;

        summary = dueToday > 0 ? `${dueToday} spaced revision review(s) due today.` : `Retention streak active (${streak} reviews). All cards up to date.`;
        actions.push({
          title: dueToday > 0 ? "Complete Due Revision Cards" : "Review Spaced Schedule",
          priority: dueToday > 0 ? "critical" : "medium",
          category: "skills",
          estimatedMinutes: 10,
          route: "/dashboard/skills",
        });
        break;
      }

      case "unified_next_action": {
        if (unifiedNextActions.length > 0) {
          const primary = unifiedNextActions[0];
          const secondary = unifiedNextActions.slice(1);

          const secondaryText = secondary.length > 0
            ? secondary.map((a, idx) => `${idx + 2}. **${a.title}** (${a.estimatedMinutes}m) — _${a.reason}_`).join("\n")
            : "_No secondary actions queued._";

          answer = `### Unified Next Recommended Action
Your primary recommended next step across Smart Skill Hub is:

🎯 **${primary.title}**
- **Type**: ${primary.type} (${(primary.module || "skills").toUpperCase()})
- **Target Skill**: ${primary.targetSkill}
- **Estimated Time**: ~${primary.estimatedMinutes} minutes
- **Priority**: ${(primary.priority || "high").toUpperCase()}
- **Why this next?**: ${primary.reason}

#### Secondary Follow-ups:
${secondaryText}

This recommendation is deterministically prioritized across your retention schedule, incomplete competency requirements, and target role skill gaps.`;

          summary = `Next action: ${primary.title} (~${primary.estimatedMinutes}m, ${primary.priority} priority).`;
          actions.push({
            title: primary.title,
            priority: primary.priority || "high",
            category: primary.module || "skills",
            estimatedMinutes: primary.estimatedMinutes || 20,
            route: primary.actionUrl || "/dashboard/skills",
          });
        } else {
          answer = `### Next Recommended Action
Based on your current profile, continue with your primary role gap:
- **Target Role**: ${targetRole}
- **Recommended**: Solve a practical sandbox challenge in **${topGapName}** to generate verified empirical evidence.`;
          summary = `Recommended next action: Practice ${topGapName}.`;
          actions.push({
            title: `Practice ${topGapName}`,
            priority: "high",
            category: "skills",
            estimatedMinutes: 25,
            route: "/dashboard/coding",
          });
        }
        break;
      }

      case "resume_badge_guidance": {
        if (earnedBadges.length > 0) {
          const badgeList = earnedBadges.map((b) => `- **${b.competencyName}** (Issued: ${new Date(b.issuedAt).toLocaleDateString()}) — Verification Hash: \`${(b.verificationHash || "").slice(0, 12)}...\``).join("\n");

          answer = `### Integrating Verified Badges into Your Resume
You have earned **${earnedBadges.length} verified competency badge(s)**:
${badgeList}

#### Grounded Resume Presentation Guidelines:
1. **Certifications & Badges Section**: Add an entry titled *"Smart Skill Hub Verified Competency: [Competency Name]"*.
2. **Include Verification Link**: Link directly to \`/verify/badge/${earnedBadges[0].badgeId || earnedBadges[0]._id}\` so recruiters can cryptographically inspect the evaluation criteria.
3. **Evidence Integrity**: Highlight the specific sandbox test cases and checkpoint quizzes that qualified you. Do not claim external university or vendor accreditation.`;

          summary = `Add your ${earnedBadges.length} verified badge(s) to your resume.`;
          actions.push({
            title: "Update Resume with Badges",
            priority: "high",
            category: "resume",
            estimatedMinutes: 10,
            route: "/dashboard/resumes",
          });
        } else {
          answer = `### Resume Credential Guidance
You have not earned any verified Smart Skill Hub competency badges yet.

To earn your first verifiable badge:
1. Complete all criteria for a competency in the **Competency Matrix** (Docker sandbox coding pass + EduTube quiz >= 70% + spaced revision streak >= 2).
2. Once criteria are met, claim your badge in the Skills tab.
3. You can then import the tamper-proof badge record into your resume builder.

⚠️ **Ethical Rule**: Never add unverified claims or unearned badges to your resume. Recruiters value verifiable evidence over ungrounded self-attestations.`;

          summary = "No verified badges earned yet. Complete competency criteria to earn verifiable credentials.";
          actions.push({
            title: "View Competency Requirements",
            priority: "high",
            category: "skills",
            estimatedMinutes: 10,
            route: "/dashboard/skills",
          });
        }
        break;
      }

      case "personalized_progress": {
        const verifiedCount = evidenceTiers.verified?.length || 0;
        const inferredCount = evidenceTiers.inferred?.length || 0;
        const passedChallenges = context.coding?.passedCount || 0;

        answer = `### Personalized Progress Narrative
Here is your evidence-based progress summary:

- **Verified Empirical Skills**: ${verifiedCount} skill(s) proven through Docker sandbox tests, checkpoint quizzes, or spaced retrieval.
- **Inferred Skills**: ${inferredCount} skill(s) detected via GitHub repository code volume and project keywords.
- **Verified Coding Challenges**: ${passedChallenges} sandbox challenge(s) solved.
- **Target Role Readiness**: ${readiness}/100 for **${targetRole}**.
- **Competency Badges**: ${earnedBadges.length} earned.

#### Distinguishing Proven Mastery from Estimates:
Your verified skills represent hard technical proof that code executed and passed automated tests. Your readiness score is an overall trajectory estimate. Focus next on turning inferred skills into verified competencies.`;

        summary = `Progress: ${verifiedCount} verified skills, ${passedChallenges} sandbox passes, ${earnedBadges.length} badges earned.`;
        actions.push({
          title: "View Skill Evidence",
          priority: "medium",
          category: "skills",
          estimatedMinutes: 10,
          route: "/dashboard/skills",
        });
        break;
      }

      case "academic_branch_guidance": {
        const academic = context.career?.academic || {};
        const isConfigured = academic.isConfigured;
        const branchName = academic.branchName || "Engineering / Technical Discipline";
        const degreeName = academic.degreeName || "Academic Program";
        const disciplineFamily = academic.disciplineFamily || "Technical";

        if (!isConfigured) {
          answer = `### Academic Profile Not Yet Configured
Your academic profile is currently **unconfigured**.

Smart Skill Hub personalizes learning recommendations, skill relevance, and competency expectations to your specific discipline (e.g. Mechanical, ECE, CSE, Civil, BBA, Nursing).

To connect your academic discipline to your career goals:
1. Navigate to **Profile Settings** or complete the **Academic Background** onboarding step.
2. Select your Degree (e.g., B.Tech, BBA, B.Sc) and Branch (e.g., Computer Science, Mechanical, Electronics).
3. Specify your current year and specialization if applicable.`;

          summary = "Academic profile is unconfigured. Please complete academic settings.";
          actions.push({
            title: "Configure Academic Profile",
            priority: "high",
            category: "career",
            estimatedMinutes: 3,
            route: "/dashboard/settings",
          });
          break;
        }

        answer = `### Academic Discipline Guidance: ${branchName} (${degreeName})
- **Discipline Family**: ${disciplineFamily}
- **Selected Career Target**: **${targetRole}**
- **Academic Progress**: Year ${academic.currentYear || "N/A"}, Semester ${academic.currentSemester || "N/A"}

### Domain Alignment & Career Mobility:
1. **Discipline Relevance**: Smart Skill Hub assesses you based on skills directly relevant to ${targetRole}. For non-software disciplines (such as Mechanical, Civil, or Healthcare), GitHub repositories and web dev tools are not required.
2. **Cross-Disciplinary Mobility**: If your target role (${targetRole}) is in another stream (e.g. transitioning from ${branchName} to Software or Data Science), Smart Skill Hub fully supports your transition. You will be evaluated against ${targetRole} prerequisites fairly without discipline-based restrictions.
3. **Evidence Grounding**: Focus on demonstrating verified competencies through practical problem-solving and validated checkpoints.`;

        summary = `Academic guidance tailored to ${branchName} pursuing ${targetRole}.`;
        actions.push({
          title: "Review Career Alignment Matrix",
          priority: "high",
          category: "career",
          estimatedMinutes: 10,
          route: "/dashboard/skills",
        });
        break;
      }

      case "branch_capabilities": {
        const academic = context.career?.academic || {};
        const branchName = academic.branchName || "Your Academic Branch";

        answer = `### Supported Capabilities for ${branchName}

Smart Skill Hub provides a clear distinction between currently usable tools and planned specialized modules:

### 1. Currently Implemented & Available (AVAILABLE):
- **Adaptive Learning Roadmaps**: Milestone-based study planning across all disciplines.
- **EduTube Educational Video Checkpoints**: Interactive video learning and conceptual retention checks.
- **Spaced Revision Engine**: Algorithm-driven spaced repetition flashcards for memory retention.
- **Skill Competency Matrix & Cryptographic Badges**: Platform-verified competency records.
- **Algorithmic Coding Sandbox**: Multi-language programming execution (available across software/scripting tracks; staging code execution disabled).
- **GitHub Repository Analysis**: Empirical repository hygiene and documentation audits.

### 2. Planned for Future Specialized Phases (PLANNED):
- **CAD & 3D Engineering Portfolio**: SolidWorks, AutoCAD, and BIM design portfolio integration (Mechanical & Civil).
- **Circuit Simulation & Hardware Labs**: SPICE simulation and PCB verification (ECE & EEE).
- **Engineering Simulations**: FEA, CFD, and smart grid modeling.
- **Clinical Case Assessments**: Interactive patient care and diagnostic scenarios (Nursing & Allied Health).
- **Business & Financial Valuation**: Interactive DCF workbooks and business case studies (Commerce & Management).

> **Integrity Note**: Planned modules are cataloged for upcoming specialized phases. Only implemented tools are accessible in the current release.`;

        summary = `Capability breakdown for ${branchName}: available platform tools vs planned specialized modules.`;
        actions.push({
          title: "Explore Active Learning Tools",
          priority: "medium",
          category: "learning",
          estimatedMinutes: 10,
          route: "/dashboard/edutube",
        });
        break;
      }

      default: {
        answer = `Here is your current career summary inside Smart Skill Hub:
- **Target Role**: ${targetRole} (Readiness: ${readiness}/100)
- **Top Skill Gap**: ${topGapName}
- **GitHub Status**: ${github.repositoryCount || 0} repositories analyzed (${github.repositoriesWithoutDescription || 0} need descriptions)
- **EduTube Learning**: ${learning.videosWatched || 0} watched, ${learning.completedVideos || 0} completed

Ask me about your **GitHub hygiene**, **what to learn next**, **30-day plan**, or **how to improve your resume** for specific tailored guidance!`;

        summary = `Smart Mentor developer summary for ${targetRole}.`;
        actions.push({
          title: "Explore Skill Gaps",
          priority: "medium",
          category: "skills",
          estimatedMinutes: 15,
          route: "/dashboard/gaps",
        });
        break;
      }
    }

    return {
      answer,
      summary,
      actions,
      references,
      confidence: 0.95,
      source: "local_nlp",
      intent,
      courseRecommendations: null,
      learningPackage: null,
    };
  }
}

export const smartMentorLocalService = new SmartMentorLocalService();
