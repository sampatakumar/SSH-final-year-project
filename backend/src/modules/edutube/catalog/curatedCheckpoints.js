/**
 * Curated Video Checkpoint Questions Catalog
 *
 * Provides authoritative, verified retrieval questions mapped to educational video concepts.
 * These checkpoint questions are server-validated; correctOptionIndex is NEVER exposed
 * to the client before answer submission.
 */

export const CURATED_VIDEO_CHECKPOINTS = [
  // --- Docker Architecture & Containers ---
  {
    checkpointId: "cp_docker_arch_01",
    videoId: "gAkwW2tuIqE",
    timestampSeconds: 60,
    question: "What is the primary distinction between a Docker container and a traditional Virtual Machine (VM)?",
    options: [
      "Containers share the host OS kernel and isolate at process level, while VMs run full guest operating systems on a hypervisor.",
      "Containers require dedicated physical hardware, while VMs run inside web browsers.",
      "Containers only execute Python code, whereas VMs execute compiled binary languages.",
      "VMs provide faster boot times than containers because they bypass Linux namespaces.",
    ],
    correctOptionIndex: 0,
    explanation:
      "Docker containers virtualize the operating system by sharing the host kernel and utilizing Linux cgroups/namespaces, achieving near-native performance and sub-second boot times.",
    conceptKey: "docker-container-vs-vm",
    skill: "Docker",
    canonicalName: "Docker",
    difficulty: "Easy",
  },
  {
    checkpointId: "cp_docker_arch_02",
    videoId: "gAkwW2tuIqE",
    timestampSeconds: 180,
    question: "Which Dockerfile instruction creates a new cached read-only layer in the image?",
    options: [
      "RUN, COPY, and ADD",
      "EXPOSE and CMD",
      "VOLUME and WORKDIR only",
      "LABEL and ENV only",
    ],
    correctOptionIndex: 0,
    explanation:
      "In Docker image architecture, only instructions that modify the filesystem (RUN, COPY, ADD) generate new image layers in the union filesystem.",
    conceptKey: "docker-image-layers",
    skill: "Docker",
    canonicalName: "Docker",
    difficulty: "Medium",
  },

  // --- React State & Lifecycle ---
  {
    checkpointId: "cp_react_hooks_01",
    videoId: "bMknfKXIFA8",
    timestampSeconds: 75,
    question: "Why should React state setters (e.g., useState) be treated as asynchronous updates?",
    options: [
      "React batches state updates across event handlers and lifecycle events to optimize DOM reconciliation.",
      "React state mutations are persisted to an external IndexedDB database synchronously.",
      "State setters return Promises that must be awaited using async/await syntax.",
      "JavaScript V8 engine limits variable assignments to one execution per frame.",
    ],
    correctOptionIndex: 0,
    explanation:
      "React batches state updates to prevent unnecessary re-renders. Reading state immediately after calling setState does not reflect the newly scheduled value.",
    conceptKey: "react-state-batching",
    skill: "React",
    canonicalName: "React",
    difficulty: "Medium",
  },
  {
    checkpointId: "cp_react_hooks_02",
    videoId: "bMknfKXIFA8",
    timestampSeconds: 210,
    question: "What happens if you omit the dependency array in a useEffect hook?",
    options: [
      "The effect executes after every single component render.",
      "The effect executes only once when the component mounts.",
      "React throws a runtime compile error and terminates the application.",
      "The effect is completely ignored by the fiber scheduler.",
    ],
    correctOptionIndex: 0,
    explanation:
      "Passing no dependency array causes useEffect to execute after every render. An empty array [] runs once on mount, while [deps] runs when dependencies change.",
    conceptKey: "react-useeffect-lifecycle",
    skill: "React",
    canonicalName: "React",
    difficulty: "Easy",
  },

  // --- TypeScript Generics & Types ---
  {
    checkpointId: "cp_ts_generics_01",
    videoId: "BwuLxPH8IDs",
    timestampSeconds: 90,
    question: "What is the primary benefit of using Generics (<T>) over the 'any' type in TypeScript?",
    options: [
      "Generics preserve exact type relationships and compiler safety between inputs and return values.",
      "Generics compile down to faster machine code in the browser runtime.",
      "Generics bypass the TypeScript type checker at build time.",
      "Generics allow only primitive string values to be passed to functions.",
    ],
    correctOptionIndex: 0,
    explanation:
      "Generics enable reusable components while capturing and guaranteeing exact type contracts. Unlike 'any', generics maintain full compile-time type safety.",
    conceptKey: "ts-generic-contracts",
    skill: "TypeScript",
    canonicalName: "TypeScript",
    difficulty: "Medium",
  },

  // --- REST APIs & HTTP Protocol ---
  {
    checkpointId: "cp_rest_idempotency_01",
    videoId: "lsMQRaeKNDk",
    timestampSeconds: 60,
    question: "Which HTTP method is defined as idempotent according to RFC 7231?",
    options: [
      "PUT and DELETE",
      "POST and PATCH",
      "CONNECT and POST",
      "None; HTTP methods are never idempotent by specification",
    ],
    correctOptionIndex: 0,
    explanation:
      "An HTTP method is idempotent if making multiple identical requests has the same intended effect on the server state. GET, PUT, and DELETE are idempotent; POST is not.",
    conceptKey: "http-idempotency-methods",
    skill: "REST APIs",
    canonicalName: "REST APIs",
    difficulty: "Easy",
  },

  // --- Node.js Event Loop ---
  {
    checkpointId: "cp_nodejs_eventloop_01",
    videoId: "Oe421EPjeBE",
    timestampSeconds: 120,
    question: "In Node.js, which queue has the highest priority and executes immediately after the current operation finishes?",
    options: [
      "process.nextTick() queue (microtask)",
      "setImmediate() check phase queue",
      "setTimeout() timer queue",
      "fs.readFile() I/O callback queue",
    ],
    correctOptionIndex: 0,
    explanation:
      "process.nextTick() microtasks are drained immediately after the currently executing script completes, before the event loop advances to the next phase.",
    conceptKey: "nodejs-eventloop-microtasks",
    skill: "Node.js",
    canonicalName: "Node.js",
    difficulty: "Hard",
  },

  // --- MongoDB & Indexing ---
  {
    checkpointId: "cp_mongodb_indexes_01",
    videoId: "ofme2o29ngU",
    timestampSeconds: 85,
    question: "What is the primary risk of creating excessive indexes on high-write MongoDB collections?",
    options: [
      "Degraded write performance and increased memory/storage overhead.",
      "MongoDB automatically converts the database into read-only mode.",
      "Documents are corrupted when index B-trees rebalance.",
      "All query execution plans revert to full collection scans (COLLSCAN).",
    ],
    correctOptionIndex: 0,
    explanation:
      "Every index requires B-tree maintenance upon insert, update, and delete operations. Too many indexes slow down writes and consume working-set RAM.",
    conceptKey: "mongodb-index-tradeoffs",
    skill: "MongoDB",
    canonicalName: "MongoDB",
    difficulty: "Medium",
  },
];

/**
 * Find curated checkpoints for a videoId or generate fallback checkpoints for a skill/topic.
 */
export function getCuratedCheckpointsForVideo(videoId, skillName = null) {
  // 1. Direct match on videoId
  const directMatches = CURATED_VIDEO_CHECKPOINTS.filter((cp) => cp.videoId === videoId);
  if (directMatches.length > 0) {
    return directMatches;
  }

  // 2. Fallback match by skill
  if (skillName) {
    const skillMatches = CURATED_VIDEO_CHECKPOINTS.filter(
      (cp) => cp.canonicalName.toLowerCase() === skillName.toLowerCase()
    );
    if (skillMatches.length > 0) {
      return skillMatches.map((cp, idx) => ({
        ...cp,
        checkpointId: `${cp.checkpointId}_${videoId.slice(0, 6)}_${idx}`,
        videoId,
      }));
    }
  }

  // 3. Fallback generic checkpoint for any educational programming lesson
  return [
    {
      checkpointId: `cp_general_${videoId}_01`,
      videoId,
      timestampSeconds: 45,
      question: "Which engineering principle is essential when building maintainable, scalable software components?",
      options: [
        "Single Responsibility Principle and clear interface separation",
        "Coupling all database queries directly inside presentation components",
        "Omitting error boundaries and exception logging",
        "Hardcoding configuration credentials into version control",
      ],
      correctOptionIndex: 0,
      explanation:
        "Separation of concerns and the Single Responsibility Principle ensure components remain testable, reusable, and easy to maintain over time.",
      conceptKey: "core-software-architecture",
      skill: skillName || "Full Stack Core Architecture",
      canonicalName: skillName || "Full Stack Core Architecture",
      difficulty: "Easy",
    },
  ];
}
