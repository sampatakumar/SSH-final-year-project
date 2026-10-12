/**
 * ============================================================================
 * SMART SKILL HUB — ACADEMIC STUDY INTELLIGENCE ENGINE (v2.1.0)
 * ============================================================================
 *
 * Implements rigorous, evidence-driven academic learning:
 * 1. Syllabus-aware structured learning profiles with prerequisites & Bloom levels.
 * 2. Distinguishes exposure vs. successful practice vs. retained knowledge vs. demonstrated mastery.
 * 3. Dynamic mastery decay: penalizes mastery estimate when new assessment evidence contradicts prior scores.
 * 4. Adaptive formative quizzes with Bloom's taxonomy & reproducible explanations.
 * 5. SuperMemo SM-2 spaced repetition for flashcards & memory consolidation.
 * 6. Revision scheduler prioritizing decayed concepts and upcoming deadlines.
 * ============================================================================
 */

import { StudyProfile } from "../models/studyProfile.models.js";
import { Flashcard } from "../models/flashcard.models.js";
import { LearnerSkillAssessmentHistory } from "../../skills/models/learnerSkillAssessmentHistory.models.js";
import { adaptiveSkillLoopService } from "../../skills/services/adaptive-skill-loop.service.js";
import { aiOrchestrator } from "../../../core/ai/aiOrchestrator.service.js";

// Canonical Academic Syllabus & Seed Knowledge Graph
export const ACADEMIC_SYLLABUS_CATALOG = {
  "Data Structures & Algorithms": {
    prerequisites: ["Programming Fundamentals", "Discrete Mathematics"],
    topics: [
      {
        name: "Arrays & Strings",
        difficulty: "Beginner",
        prerequisites: ["Variables & Loops"],
        objectives: ["Contiguous memory allocation", "Two-pointer technique", "Sliding window"],
      },
      {
        name: "Hash Tables",
        difficulty: "Beginner",
        prerequisites: ["Arrays & Strings"],
        objectives: ["Hash functions", "Collision resolution (Chaining & Open Addressing)", "O(1) average lookup"],
      },
      {
        name: "Linked Lists",
        difficulty: "Beginner",
        prerequisites: ["Pointers & References"],
        objectives: ["Singly vs Doubly Linked", "Pointer manipulation", "Fast & Slow pointer cycle detection"],
      },
      {
        name: "Stacks & Queues",
        difficulty: "Beginner",
        prerequisites: ["Arrays & Strings", "Linked Lists"],
        objectives: ["LIFO vs FIFO semantics", "Monotonic stack", "Queue implementation with arrays"],
      },
      {
        name: "Binary Trees & BST",
        difficulty: "Intermediate",
        prerequisites: ["Recursion", "Linked Lists"],
        objectives: ["Inorder/Preorder/Postorder traversals", "BST search/insert/delete", "Height balancing concepts"],
      },
      {
        name: "Graphs & Traversal",
        difficulty: "Intermediate",
        prerequisites: ["Binary Trees & BST", "Stacks & Queues"],
        objectives: ["Adjacency matrix vs list", "BFS (shortest path unweighted)", "DFS (cycle detection, topological sort)"],
      },
      {
        name: "Dynamic Programming",
        difficulty: "Advanced",
        prerequisites: ["Recursion", "Memoization"],
        objectives: ["Optimal substructure", "Overlapping subproblems", "Top-down memoization vs bottom-up tabulation"],
      },
    ],
  },
  "Computer Systems & Networking": {
    prerequisites: ["Digital Logic Basics"],
    topics: [
      {
        name: "TCP/IP & OSI Models",
        difficulty: "Beginner",
        prerequisites: ["Network Basics"],
        objectives: ["Layer responsibilities", "Encapsulation & Decapsulation", "Packet headers"],
      },
      {
        name: "HTTP/HTTPS & Web Protocols",
        difficulty: "Beginner",
        prerequisites: ["TCP/IP & OSI Models"],
        objectives: ["Stateless request-response", "TLS handshake", "HTTP/1.1 vs HTTP/2 vs HTTP/3"],
      },
      {
        name: "Processes & Threads",
        difficulty: "Intermediate",
        prerequisites: ["Operating System Basics"],
        objectives: ["Process memory layout (stack, heap, code)", "Context switching", "Thread synchronization & race conditions"],
      },
      {
        name: "DNS & CDN Architecture",
        difficulty: "Intermediate",
        prerequisites: ["HTTP/HTTPS & Web Protocols"],
        objectives: ["Hierarchical DNS resolution", "A/CNAME records", "Edge caching & latency minimization"],
      },
    ],
  },
  "Database Management Systems": {
    prerequisites: ["Data Modeling Basics"],
    topics: [
      {
        name: "Relational Normalization",
        difficulty: "Beginner",
        prerequisites: ["Relational Algebra"],
        objectives: ["Functional dependencies", "1NF, 2NF, 3NF, BCNF", "Anomaly reduction"],
      },
      {
        name: "ACID Transactions",
        difficulty: "Intermediate",
        prerequisites: ["Relational Normalization"],
        objectives: ["Atomicity, Consistency, Isolation, Durability", "Isolation levels & anomalies (Dirty Read, Phantom Read)", "Write-ahead logging (WAL)"],
      },
      {
        name: "Indexing & B-Trees",
        difficulty: "Intermediate",
        prerequisites: ["Binary Trees & BST"],
        objectives: ["Clustered vs Non-clustered indexes", "B+ Tree disk block balancing", "Covering indexes & query plans"],
      },
      {
        name: "NoSQL Data Modeling",
        difficulty: "Intermediate",
        prerequisites: ["JSON", "ACID Transactions"],
        objectives: ["Document vs Key-Value vs Columnar vs Graph", "Embedding vs Referencing in MongoDB", "BASE vs ACID semantics"],
      },
    ],
  },
};

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 */
export function calculateNextSM2Interval({
  qualityRating, // 0 to 5
  previousInterval = 1,
  previousRepetitions = 0,
  previousEase = 2.5,
}) {
  let repetitions = previousRepetitions;
  let interval = previousInterval;
  let ease = previousEase;

  if (qualityRating >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Calculate new ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease = ease + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return {
    repetitionCount: repetitions,
    intervalDays: interval,
    easeFactor: Number(ease.toFixed(2)),
    nextReviewDate,
  };
}

export class AcademicStudyService {
  /**
   * Get or initialize a student's structured academic study profile.
   */
  async getOrCreateStudyProfile(userId) {
    let profile = await StudyProfile.findOne({ owner: userId });

    if (!profile) {
      // Seed initial topics from standard catalog
      const initialTopics = [];
      for (const [subject, data] of Object.entries(ACADEMIC_SYLLABUS_CATALOG)) {
        for (const topic of data.topics) {
          initialTopics.push({
            name: topic.name,
            subject,
            prerequisites: topic.prerequisites || [],
            difficulty: topic.difficulty || "Beginner",
            status: "exposed",
            masteryScore: 25,
            exposureCount: 1,
            practiceCount: 0,
            quizzesTaken: 0,
            lastQuizScore: 0,
            lastAssessedAt: new Date(),
            nextRevisionDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });
        }
      }

      profile = await StudyProfile.create({
        owner: userId,
        targetAcademicLevel: "Undergraduate",
        topics: initialTopics,
      });

      // Seed starter flashcards
      await this.seedInitialFlashcards(userId);
    }

    return profile;
  }

  /**
   * Seed standard flashcards for core topics
   */
  async seedInitialFlashcards(userId) {
    const count = await Flashcard.countDocuments({ owner: userId });
    if (count > 0) return;

    const seedCards = [
      {
        owner: userId,
        subject: "Data Structures & Algorithms",
        topic: "Hash Tables",
        front: "What is the average time complexity for searching, inserting, and deleting in a Hash Table?",
        back: "O(1) average time complexity. In the worst case (all keys hash to the same bucket causing excessive collisions), it degrades to O(N).",
        conceptKey: "hash-table-complexity",
        difficulty: "Easy",
      },
      {
        owner: userId,
        subject: "Data Structures & Algorithms",
        topic: "Binary Trees & BST",
        front: "What invariant must hold true for every node N in a Binary Search Tree (BST)?",
        back: "All node values in N's left subtree must be strictly less than N.val, and all node values in N's right subtree must be strictly greater than N.val.",
        conceptKey: "bst-invariant",
        difficulty: "Medium",
      },
      {
        owner: userId,
        subject: "Computer Systems & Networking",
        topic: "TCP/IP & OSI Models",
        front: "What is the difference between TCP and UDP in terms of reliability and overhead?",
        back: "TCP is connection-oriented, reliable (guarantees delivery via ACKs, retransmissions, sequence numbers), but has higher latency/overhead. UDP is connectionless, best-effort (no ACKs, low latency, ideal for video streaming and gaming).",
        conceptKey: "tcp-vs-udp",
        difficulty: "Easy",
      },
      {
        owner: userId,
        subject: "Database Management Systems",
        topic: "ACID Transactions",
        front: "Explain the 'I' (Isolation) property in ACID and describe a 'Dirty Read' anomaly.",
        back: "Isolation ensures concurrent transactions execute without interfering with each other. A Dirty Read occurs when Transaction B reads uncommitted data written by Transaction A that is subsequently rolled back.",
        conceptKey: "acid-isolation-dirty-read",
        difficulty: "Medium",
      },
      {
        owner: userId,
        subject: "Database Management Systems",
        topic: "Indexing & B-Trees",
        front: "Why are B+ Trees preferred over regular Binary Search Trees for relational database disk storage?",
        back: "B+ Trees have very high branching factor (fan-out), which drastically reduces tree height and minimizes disk I/O operations per lookup. Furthermore, all leaf nodes are sequentially linked, allowing high-performance range scans.",
        conceptKey: "b-plus-tree-indexing",
        difficulty: "Hard",
      },
    ];

    await Flashcard.insertMany(seedCards);
  }

  /**
   * Get syllabus breakdown and pedagogical guidance for a specific subject & topic.
   */
  async getTopicSyllabus(subject, topicName, academicLevel = "Undergraduate") {
    const catalogSubject = ACADEMIC_SYLLABUS_CATALOG[subject];
    const catalogTopic = catalogSubject?.topics.find(
      (t) => t.name.toLowerCase() === topicName.toLowerCase()
    );

    const fallbackSyllabus = {
      subject,
      topic: topicName,
      academicLevel,
      prerequisites: catalogTopic?.prerequisites || ["Core Foundations"],
      difficulty: catalogTopic?.difficulty || "Intermediate",
      learningObjectives: catalogTopic?.objectives || [
        "Master theoretical foundations and mathematical invariants",
        "Implement practical data structures and algorithms in code",
        "Analyze trade-offs and real-world system applications",
      ],
      cognitiveStages: [
        { stage: "Exposure", focus: "Definitions, syntax, conceptual mental models" },
        { stage: "Practice", focus: "Standard problems, edge-case debugging, tracing" },
        { stage: "Retention", focus: "Spaced retrieval quizzes, cross-topic integration" },
        { stage: "Mastery", focus: "Architectural design, optimization under constraints" },
      ],
    };

    // Enhance with qualitative pedagogical advice via AI Orchestrator
    try {
      const aiResult = await aiOrchestrator.executeTask({
        taskName: "ACADEMIC_SYLLABUS_EXPLANATION",
        systemInstruction:
          "You are a university computer science professor. Provide a rigorous, structured syllabus guide for this topic. Include prerequisites, core concepts, and common student misconceptions.",
        userPrompt: `Subject: ${subject}\nTopic: ${topicName}\nLevel: ${academicLevel}\nExisting Objectives: ${JSON.stringify(fallbackSyllabus.learningObjectives)}`,
        fallbackGenerator: () => fallbackSyllabus,
      });

      if (aiResult.success && aiResult.data) {
        return {
          ...fallbackSyllabus,
          aiGuidance: aiResult.data,
        };
      }
    } catch (err) {
      // Return structured fallback
    }

    return fallbackSyllabus;
  }

  /**
   * Generate an adaptive formative quiz for a topic with Bloom's taxonomy levels.
   */
  async generateAdaptiveQuiz(userId, { subject, topic, difficulty = "Medium", count = 4 }) {
    const fallbackQuestions = [
      {
        id: 1,
        question: `In ${topic}, what is the primary operational trade-off when optimizing for minimal time complexity?`,
        options: [
          "Increased auxiliary space complexity",
          "Loss of functional determinism",
          "Mandatory synchronous blocking",
          "Decreased network throughput",
        ],
        correctOptionIndex: 0,
        explanation: "Time-space trade-offs are fundamental in computing: algorithms frequently utilize hash maps or precomputed tables (extra space) to achieve O(1) lookups.",
        bloomsTaxonomy: "Analyze",
        difficulty: "Medium",
      },
      {
        id: 2,
        question: `Which prerequisite concept is most critical to master prior to advanced optimization of ${topic}?`,
        options: [
          "Understanding boundary conditions and edge cases",
          "Hardware overclocking",
          "CSS layout engine internals",
          "Non-deterministic polynomial time verification",
        ],
        correctOptionIndex: 0,
        explanation: "Handling boundary conditions (empty inputs, single elements, integer overflow) prevents runtime errors and guarantees correctness.",
        bloomsTaxonomy: "Understand",
        difficulty: "Easy",
      },
      {
        id: 3,
        question: `When implementing ${topic} in production, which failure mode indicates a potential memory leak or unbounded resource usage?`,
        options: [
          "Continuously growing heap allocation without proper de-referencing or eviction",
          "Strict typing compiler warnings",
          "Idempotent API responses",
          "Consistent O(1) retrieval times",
        ],
        correctOptionIndex: 0,
        explanation: "Unbounded collections or persistent references that prevent garbage collection lead to memory leaks.",
        bloomsTaxonomy: "Evaluate",
        difficulty: "Hard",
      },
    ];

    try {
      const aiResult = await aiOrchestrator.executeTask({
        taskName: "ADAPTIVE_QUIZ_GENERATION",
        systemInstruction:
          "Generate a multiple-choice academic quiz with 3-4 questions. Each question must include 'question', 'options' (array of 4 strings), 'correctOptionIndex' (0-3), 'explanation', and 'bloomsTaxonomy' ('Recall', 'Understand', 'Apply', 'Analyze', 'Evaluate'). Return JSON object with 'questions' array.",
        userPrompt: `Subject: ${subject}\nTopic: ${topic}\nTarget Difficulty: ${difficulty}\nQuestion Count: ${count}`,
        fallbackGenerator: () => ({ questions: fallbackQuestions }),
      });

      if (aiResult.success && Array.isArray(aiResult.data?.questions) && aiResult.data.questions.length > 0) {
        return {
          subject,
          topic,
          difficulty,
          questions: aiResult.data.questions,
          provenance: aiResult.metadata?.provenance || "deterministic_catalog",
        };
      }
    } catch (e) {
      // Fall through to deterministic questions
    }

    return {
      subject,
      topic,
      difficulty,
      questions: fallbackQuestions,
      provenance: "deterministic_catalog",
    };
  }

  /**
   * Submit quiz answers, update topic mastery, apply decay if evidence contradicts past score,
   * and record empirical history.
   */
  async submitQuizResults(userId, { subject, topic, answers = [], totalQuestions = 3 }) {
    if (!userId || !topic) {
      throw new Error("userId and topic are required to submit quiz.");
    }

    const profile = await this.getOrCreateStudyProfile(userId);

    // Calculate score deterministically
    let correctCount = 0;
    for (const ans of answers) {
      if (ans.selectedOptionIndex === ans.correctOptionIndex) {
        correctCount++;
      }
    }

    const total = Math.max(1, answers.length || totalQuestions);
    const quizScore = Math.round((correctCount / total) * 100);

    // Locate topic record in profile
    let topicRecord = profile.topics.find(
      (t) => t.name.toLowerCase() === topic.toLowerCase()
    );

    if (!topicRecord) {
      topicRecord = {
        name: topic,
        subject: subject || "Computer Science",
        difficulty: "Medium",
        status: "exposed",
        masteryScore: 25,
        exposureCount: 1,
        practiceCount: 0,
        quizzesTaken: 0,
        lastQuizScore: 0,
        lastAssessedAt: new Date(),
        nextRevisionDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      profile.topics.push(topicRecord);
    }

    const previousMastery = topicRecord.masteryScore;
    const previousStatus = topicRecord.status;
    topicRecord.quizzesTaken += 1;
    topicRecord.lastQuizScore = quizScore;
    topicRecord.lastAssessedAt = new Date();

    let masteryDelta = 0;
    let decayApplied = false;

    // EVALUATE MASTERY & DETECT CONTRADICTORY EVIDENCE
    if (quizScore >= 80) {
      // High performance evidence: elevate mastery
      const newScore = Math.min(100, Math.round(previousMastery * 0.4 + quizScore * 0.6));
      masteryDelta = newScore - previousMastery;
      topicRecord.masteryScore = newScore;
      topicRecord.practiceCount += 1;

      if (newScore >= 85) topicRecord.status = "mastered";
      else if (newScore >= 65) topicRecord.status = "retained";
      else topicRecord.status = "practiced";

      // Schedule next spaced review in 7 or 14 days
      topicRecord.nextRevisionDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (quizScore < 50 && (previousStatus === "mastered" || previousStatus === "retained")) {
      // CRITICAL: Contradictory evidence detected! Student previously held high mastery but failed retention!
      decayApplied = true;
      // Severely penalize mastery estimate based on fresh empirical failure
      const penalisedScore = Math.max(25, Math.round(previousMastery * 0.5 + quizScore * 0.5));
      masteryDelta = penalisedScore - previousMastery;
      topicRecord.masteryScore = penalisedScore;
      topicRecord.status = "practiced"; // Demoted from mastered/retained

      // Immediately flag for urgent retrieval practice tomorrow!
      topicRecord.nextRevisionDue = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      // Moderate performance (50 - 79%)
      const newScore = Math.round(previousMastery * 0.6 + quizScore * 0.4);
      masteryDelta = newScore - previousMastery;
      topicRecord.masteryScore = newScore;
      topicRecord.practiceCount += 1;
      topicRecord.status = newScore >= 65 ? "retained" : "practiced";
      topicRecord.nextRevisionDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    await profile.save();

    // Log to assessment history
    await LearnerSkillAssessmentHistory.create({
      owner: userId,
      skill: topic,
      canonicalName: topic,
      assessmentType: "formative_quiz",
      score: quizScore,
      previousScore: previousMastery,
      scoreDelta: masteryDelta,
      testCasesPassed: correctCount,
      testCasesTotal: total,
      evidenceSource: "assessment",
      assessmentDate: new Date(),
    });

    // Mirror to adaptive skill loop service to keep skill profile synchronized
    try {
      await adaptiveSkillLoopService.recordAssessmentOutcome(userId, {
        skill: topic,
        score: quizScore,
        maxScore: 100,
        testCasesPassed: correctCount,
        testCasesTotal: total,
        assessmentType: "formative_quiz",
      });
    } catch (e) {
      console.warn("[study-service] Non-blocking adaptive skill sync:", e.message);
    }

    return {
      topic,
      subject,
      quizScore,
      correctCount,
      totalQuestions: total,
      previousMastery,
      newMastery: topicRecord.masteryScore,
      masteryDelta,
      decayApplied,
      status: topicRecord.status,
      nextRevisionDue: topicRecord.nextRevisionDue.toISOString(),
      guidance: decayApplied
        ? `Contradictory retention detected: Your quiz score (${quizScore}%) was lower than your historical mastery (${previousMastery}%). Mastery estimate adjusted to ${topicRecord.masteryScore}%. Urgent spaced revision scheduled for tomorrow.`
        : `Formative assessment complete. Current mastery updated to ${topicRecord.masteryScore}%.`,
    };
  }

  /**
   * Get flashcards due for review.
   */
  async getDueFlashcards(userId, { subject = null, topic = null, limit = 20 } = {}) {
    const filter = {
      owner: userId,
      nextReviewDate: { $lte: new Date(Date.now() + 2 * 60 * 60 * 1000) }, // Due now or within 2 hours
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;

    let cards = await Flashcard.find(filter).sort({ nextReviewDate: 1 }).limit(limit).lean();

    // If no due cards, return upcoming cards so student can continue practicing
    if (cards.length === 0) {
      const anyFilter = { owner: userId };
      if (subject) anyFilter.subject = subject;
      cards = await Flashcard.find(anyFilter).sort({ lastReviewedAt: 1 }).limit(limit).lean();
    }

    return cards;
  }

  /**
   * Review a flashcard using SuperMemo SM-2.
   */
  async reviewFlashcard(userId, flashcardId, qualityRating = 4) {
    const card = await Flashcard.findOne({ _id: flashcardId, owner: userId });
    if (!card) {
      throw new Error(`Flashcard not found: ${flashcardId}`);
    }

    const sm2 = calculateNextSM2Interval({
      qualityRating: Number(qualityRating),
      previousInterval: card.intervalDays || 1,
      previousRepetitions: card.repetitionCount || 0,
      previousEase: card.easeFactor || 2.5,
    });

    card.intervalDays = sm2.intervalDays;
    card.easeFactor = sm2.easeFactor;
    card.repetitionCount = sm2.repetitionCount;
    card.nextReviewDate = sm2.nextReviewDate;
    card.lastReviewedAt = new Date();

    card.reviewHistory.push({
      reviewedAt: new Date(),
      qualityRating,
      previousInterval: card.intervalDays,
      newInterval: sm2.intervalDays,
    });

    await card.save();

    return {
      flashcardId: card._id,
      qualityRating,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      repetitionCount: card.repetitionCount,
      nextReviewDate: card.nextReviewDate.toISOString(),
    };
  }

  /**
   * Generate an adaptive revision plan aggregating overdue concepts and spaced repetition needs.
   */
  async getAdaptiveRevisionPlan(userId) {
    const [profile, dueFlashcards] = await Promise.all([
      this.getOrCreateStudyProfile(userId),
      this.getDueFlashcards(userId, { limit: 10 }),
    ]);

    const now = new Date();
    const topicsDue = profile.topics.filter(
      (t) => new Date(t.nextRevisionDue) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
    );

    // Prioritize topics that decayed or have lowest mastery
    topicsDue.sort((a, b) => a.masteryScore - b.masteryScore);

    const revisionPlan = {
      overallMastery: Math.round(
        profile.topics.reduce((acc, t) => acc + (t.masteryScore || 0), 0) / Math.max(1, profile.topics.length)
      ),
      topicsDueCount: topicsDue.length,
      flashcardsDueCount: dueFlashcards.length,
      priorityRevisionTopics: topicsDue.slice(0, 5).map((t) => ({
        name: t.name,
        subject: t.subject,
        masteryScore: t.masteryScore,
        status: t.status,
        nextRevisionDue: t.nextRevisionDue,
        urgency: t.masteryScore < 50 ? "High" : "Moderate",
        recommendedAction: t.masteryScore < 50 ? "Review topic syllabus and take formative quiz" : "Quick flashcard retrieval",
      })),
      dueFlashcardsSummary: dueFlashcards.slice(0, 5).map((c) => ({
        id: c._id,
        subject: c.subject,
        topic: c.topic,
        front: c.front,
        intervalDays: c.intervalDays,
      })),
    };

    return revisionPlan;
  }
}

export const academicStudyService = new AcademicStudyService();
