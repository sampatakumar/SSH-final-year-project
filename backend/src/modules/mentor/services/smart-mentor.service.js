import { smartMentorContextService } from "./smart-mentor-context.service.js";
import { smartMentorLocalService } from "./smart-mentor-local.service.js";
import { mentorCourseRecommendationService } from "./mentor-course-recommendation.service.js";
import { SmartMentorConversation } from "../models/smartMentorConversation.models.js";
import { generateJSON, TASK_TIERS, getGroqClient, getGroqModel } from "../../../services/groq.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class SmartMentorService {
  /**
   * Retrieve or initialize user's conversation history.
   */
  async getConversation(ownerId) {
    let conv = await SmartMentorConversation.findOne({ owner: ownerId });
    if (!conv) {
      conv = await SmartMentorConversation.create({
        owner: ownerId,
        messages: [],
      });
    }
    return conv;
  }

  /**
   * Clear conversation history.
   */
  async clearHistory(ownerId) {
    await SmartMentorConversation.findOneAndUpdate(
      { owner: ownerId },
      { $set: { messages: [] } },
      { upsert: true }
    );
    return { cleared: true };
  }

  /**
   * Format compact prompt context from unified user context.
   */
  buildSystemPrompt(context, courseData = null) {
    const academic = context.career?.academic;
    const academicDesc = academic?.isConfigured
      ? `Degree: "${academic.degreeName || "N/A"}", Branch: "${academic.branchName || "N/A"}", Specialization: "${academic.specializationName || "N/A"}", Year: ${academic.currentYear || "N/A"}, Semester: ${academic.currentSemester || "N/A"}`
      : "Not configured / Unknown";

    const courseSection = courseData
      ? `\n\nVERIFIED YOUTUBE COURSE SHORTLIST & CURRICULUM:
${JSON.stringify(courseData.shortlist, null, 2)}

COURSE COMPARISON & STARTING RECOMMENDATION:
${JSON.stringify(courseData.comparison, null, 2)}

STRUCTURED 10-POINT LEARNING PACKAGE:
${JSON.stringify(courseData.learningPackage, null, 2)}

MANDATORY COURSE RECOMMENDATION RULES:
- When recommending courses, strictly cite ONLY the verified courses, URLs, and instructors provided above.
- Do NOT invent fake YouTube links or claim unverified public 5-star ratings.
- Explain trade-offs between courses, highlight the recommended starting course, and guide the student through the structured 10-point package.`
      : "";

    return `You are Smart Mentor, the personal technical career mentor inside Smart Skill Hub.
You have access only to the structured user context provided to you.
Your job is to help the candidate improve their technical career, close skill gaps, optimize their GitHub profile & repositories, guide their EduTube learning, and achieve job-readiness for their target role.

GROUNDED USER CONTEXT:
${JSON.stringify(context, null, 2)}${courseSection}

CRITICAL OPERATIONAL RULES:
1. Never invent user data, repositories, metrics, skills, academic background, or experience not present in the context.
2. Distinguish verified facts (e.g. actual repository counts, completed EduTube videos, passed coding challenges) from inferences (readiness assessments) and suggested actions.
3. If profile evidence is sparse or missing (e.g. 0 repositories, unconfigured academic profile), make uncertainty explicit instead of assuming capabilities.
4. If the user asks about GitHub, inspect the actual repository counts, descriptions, and README presence provided.
5. If the user asks about skill gaps or what to learn, reference their actual identified skill gaps and required levels.
6. If the user asks about their career or readiness, use their actual readiness score (${context.career?.readinessScore ?? 65}/100), target role ("${context.career?.targetRole || "Full Stack Developer"}"), and target roles list (${JSON.stringify(context.career?.targetRoles || [])}).
7. Academic background is: ${academicDesc}. If academic background is "Not configured / Unknown", state that it is unconfigured when asked and NEVER invent, assume, or fabricate an engineering branch, college, degree, or semester. Ground domain advice within their verified branch when available.
8. Do not claim you are personally trained on the candidate's proprietary data; you operate as an evidence-grounded AI mentor analyzing structured platform signals.
9. ADAPTIVE LEARNING LOOP RULES:
   - When asked "What should I learn next?", cite their adaptivePlan.nextAction and respect prerequisite sequence.
   - When asked "Why am I weak in this skill?", explain the specific gap evidence (e.g., missing prerequisites, 0 verified projects, or failed sandbox test cases) and offer targeted remediation.
   - When asked about failing a challenge, teach the underlying concept, break down common edge cases, and guide them to retry the task in the sandbox.
   - When asked "I completed this module, what now?", guide them to solve the practical sandbox coding challenge, emphasizing that video watching builds mental models but passing tests proves competency.
   - When comparing roles (e.g. Frontend vs Backend), contrast required competencies, readiness scores, and specific role gaps without merging or replacing roles.
10. Explain WHY each recommendation is useful and offer concrete next actions with time estimates.
11. Return a valid raw JSON object matching this schema:
{
  "answer": "Comprehensive, structured markdown formatted answer directly addressing the query.",
  "summary": "1-sentence executive takeaway.",
  "actions": [
    {
      "title": "Action title (e.g. Add README to repo-name)",
      "priority": "critical" | "high" | "medium" | "low",
      "category": "github" | "skills" | "learning" | "resume" | "project" | "career" | "edutube",
      "estimatedMinutes": 30,
      "route": "/dashboard/github" | "/dashboard/gaps" | "/dashboard/edutube" | "/dashboard/resumes" | "/dashboard/skills" | "/dashboard/coding"
    }
  ],
  "confidence": 0.95
}
12. Do not include markdown code block fences (like \`\`\`json) in your JSON output. Return pure JSON text.`;
  }

  /**
   * Send a chat message with automatic instantaneous local NLP fallback.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {string} message - User query text
   * @returns {Promise<object>} Standardized mentor response
   */
  async processChatMessage(ownerId, message) {
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError(400, "Message content is required.");
    }

    const cleanMessage = message.trim();
    const conv = await this.getConversation(ownerId);
    const context = await smartMentorContextService.getUnifiedUserContext(ownerId);

    // Save user message to conversation history
    conv.messages.push({
      role: "user",
      content: cleanMessage,
      source: "user",
      createdAt: new Date(),
    });

    // Detect course learning query
    const isLearningQuery =
      /teach me|learn|full course|complete course|best course|course for|recommend.*course|playlist for|roadmap for|tutorial for/i.test(cleanMessage) ||
      (/(python|javascript|react|java|node|machine learning|full stack|devops|docker|golang|rust|data science|dsa)/i.test(cleanMessage) &&
        /(course|learn|tutorial|teach|playlist|start|guide|video|dsa)/i.test(cleanMessage));

    let courseData = null;
    if (isLearningQuery) {
      try {
        courseData = await mentorCourseRecommendationService.getRecommendationsForQuery(cleanMessage, context);
      } catch (cErr) {
        console.warn("[smart-mentor] Error fetching course recommendations:", cErr.message);
        courseData = mentorCourseRecommendationService.getRecommendationsSynchronous(cleanMessage, context);
      }
    }

    let mentorResult;

    // Attempt Groq primary intelligence with fast timeout (5 seconds)
    try {
      const systemPrompt = this.buildSystemPrompt(context, courseData);
      const recentHistory = (conv.messages || []).slice(-6, -1).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const messages = [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: cleanMessage },
      ];

      const groqRes = await Promise.race([
        generateJSON({
          messages,
          temperature: 0.25,
          maxTokens: 1800,
          taskTier: TASK_TIERS.HIGH_REASONING,
          fallbackData: null,
          feature: "smart_mentor_chat",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Groq timeout after 5000ms")), 5000)
        ),
      ]);

      if (groqRes && groqRes.data && groqRes.data.answer) {
        mentorResult = {
          answer: String(groqRes.data.answer).trim(),
          summary: String(groqRes.data.summary || "").trim(),
          actions: Array.isArray(groqRes.data.actions) ? groqRes.data.actions : [],
          references: Array.isArray(groqRes.data.references) ? groqRes.data.references : [],
          confidence: Number(groqRes.data.confidence) || 0.92,
          source: "groq",
          courseRecommendations: courseData,
          learningPackage: courseData?.learningPackage || null,
        };
      } else {
        throw new Error("Invalid Groq JSON format");
      }
    } catch (err) {
      console.warn("[smart-mentor] Groq unavailable or timed out, activating Local NLP engine:", err.message);
      mentorResult = smartMentorLocalService.generateLocalResponse(cleanMessage, context);
      if (courseData && !mentorResult.courseRecommendations) {
        mentorResult.courseRecommendations = courseData;
        mentorResult.learningPackage = courseData.learningPackage;
      }
    }

    // Append mentor message to memory
    conv.messages.push({
      role: "assistant",
      content: mentorResult.answer,
      source: mentorResult.source,
      confidence: mentorResult.confidence,
      actions: mentorResult.actions || [],
      references: mentorResult.references || [],
      courseRecommendations: mentorResult.courseRecommendations || courseData || null,
      learningPackage: mentorResult.learningPackage || courseData?.learningPackage || null,
      createdAt: new Date(),
    });

    // Keep memory bounded to last 30 messages
    if (conv.messages.length > 30) {
      conv.messages = conv.messages.slice(-30);
    }

    await conv.save().catch((err) => console.warn("[smart-mentor] Conversation save warning:", err.message));

    return {
      message: mentorResult.answer,
      summary: mentorResult.summary,
      actions: mentorResult.actions || [],
      references: mentorResult.references || [],
      confidence: mentorResult.confidence,
      source: mentorResult.source,
      courseRecommendations: mentorResult.courseRecommendations || courseData || null,
      learningPackage: mentorResult.learningPackage || courseData?.learningPackage || null,
      contextSnapshot: {
        targetRole: context.career?.targetRole,
        readinessScore: context.career?.readinessScore,
        skillGapsCount: context.skillGaps?.length || 0,
        githubReposCount: context.github?.repositoryCount || 0,
      },
    };
  }

  /**
   * Stream a chat response using Server-Sent Events (SSE) with seamless fallback.
   */
  async streamChatMessage(ownerId, message, res) {
    if (!message || typeof message !== "string" || !message.trim()) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "Message is required" })}\n\n`);
      res.end();
      return;
    }

    const cleanMessage = message.trim();
    const conv = await this.getConversation(ownerId);
    const context = await smartMentorContextService.getUnifiedUserContext(ownerId);

    // Save user message
    conv.messages.push({
      role: "user",
      content: cleanMessage,
      source: "user",
      createdAt: new Date(),
    });

    // Detect course learning query
    const isLearningQuery =
      /teach me|learn|full course|complete course|best course|course for|recommend.*course|playlist for|roadmap for|tutorial for/i.test(cleanMessage) ||
      (/(python|javascript|react|java|node|machine learning|full stack|devops|docker|golang|rust|data science|dsa)/i.test(cleanMessage) &&
        /(course|learn|tutorial|teach|playlist|start|guide|video|dsa)/i.test(cleanMessage));

    let courseData = null;
    if (isLearningQuery) {
      try {
        courseData = await mentorCourseRecommendationService.getRecommendationsForQuery(cleanMessage, context);
      } catch (cErr) {
        console.warn("[smart-mentor] Error fetching course recommendations:", cErr.message);
        courseData = mentorCourseRecommendationService.getRecommendationsSynchronous(cleanMessage, context);
      }
    }

    // Notify client: Thinking phase
    res.write(`event: thinking\ndata: ${JSON.stringify({ status: "thinking" })}\n\n`);

    if (courseData) {
      res.write(
        `event: courses\ndata: ${JSON.stringify({
          courseRecommendations: courseData,
          learningPackage: courseData.learningPackage || null,
        })}\n\n`
      );
    }

    let fullAnswer = "";
    let source = "groq";
    let actions = [];
    let references = [];
    let summary = "";

    try {
      const groq = getGroqClient();
      if (!groq) throw new Error("Groq not configured");

      const targetModel = await getGroqModel({ taskTier: TASK_TIERS.HIGH_REASONING });
      const systemPrompt = this.buildSystemPrompt(context, courseData);

      const recentHistory = (conv.messages || []).slice(-6, -1).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const stream = await Promise.race([
        groq.chat.completions.create({
          model: targetModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: cleanMessage },
          ],
          temperature: 0.3,
          max_tokens: 1500,
          stream: true,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Stream timeout")), 5000)
        ),
      ]);

      res.write(`event: start\ndata: ${JSON.stringify({ source: "groq" })}\n\n`);

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullAnswer += delta;
          res.write(`event: chunk\ndata: ${JSON.stringify({ chunk: delta })}\n\n`);
        }
      }

      // Generate action recommendations using local heuristic fast-path
      const localAnalysis = smartMentorLocalService.generateLocalResponse(cleanMessage, context);
      actions = localAnalysis.actions || [];
      summary = localAnalysis.summary || "";
    } catch (streamErr) {
      console.warn("[smart-mentor] Stream error, streaming local engine fallback:", streamErr.message);
      source = "local_nlp";
      res.write(`event: fallback\ndata: ${JSON.stringify({ source: "local_nlp" })}\n\n`);

      const localRes = smartMentorLocalService.generateLocalResponse(cleanMessage, context);
      fullAnswer = localRes.answer;
      actions = localRes.actions || [];
      summary = localRes.summary || "";

      // Progressive chunk stream for local response
      const chunks = fullAnswer.split(" ");
      for (const word of chunks) {
        res.write(`event: chunk\ndata: ${JSON.stringify({ chunk: word + " " })}\n\n`);
      }
    }

    // Save assistant response
    conv.messages.push({
      role: "assistant",
      content: fullAnswer,
      source,
      confidence: 0.95,
      actions,
      references,
      courseRecommendations: courseData || null,
      learningPackage: courseData?.learningPackage || null,
      createdAt: new Date(),
    });

    if (conv.messages.length > 30) {
      conv.messages = conv.messages.slice(-30);
    }

    await conv.save().catch(() => {});

    // Send final completion payload
    res.write(
      `event: done\ndata: ${JSON.stringify({
        source,
        summary,
        actions,
        references,
        courseRecommendations: courseData || null,
        learningPackage: courseData?.learningPackage || null,
      })}\n\n`
    );
    res.end();
  }
}

export const smartMentorService = new SmartMentorService();
