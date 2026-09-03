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

    if (/edutube|video|watch|course|lesson|playlist/i.test(text)) {
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
        if (github.connectionState === "not_connected") {
          answer = `Your **GitHub account is not connected** yet.

To receive an in-depth repository review, quality audit, and portfolio optimization suggestions:
1. Go to **Settings → Connected Accounts**.
2. Click **Connect GitHub**.
3. Smart Skill Hub will sync and analyze your repositories.`;
          summary = "GitHub not connected. Connect in Settings.";
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

        answer = `### Career Progress Report for ${targetRole}
- **Overall Role Readiness Score**: ${readiness}/100
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
    };
  }
}

export const smartMentorLocalService = new SmartMentorLocalService();
