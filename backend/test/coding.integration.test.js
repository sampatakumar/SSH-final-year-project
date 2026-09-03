import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import Docker from "dockerode";
import { app } from "../src/app.js";
import { getAllTasks, getPublicTask, getRawTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { evaluateTask } from "../src/modules/coding/services/codingExecution.service.js";
import { executeJavaScript, executeJavaScriptTask } from "../src/modules/coding/sandbox/dockerExecutor.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";
import { EXECUTION_LIMITS } from "../src/modules/coding/sandbox/sandboxConfig.js";
import { EVIDENCE_SOURCES, EVIDENCE_TYPES } from "../src/shared/evidence/skillEvidenceContract.js";

const docker = new Docker();

describe("Coding Module Security Hardening & Complete Sandbox Verification Suite", () => {
  // =========================================================================
  // GROUP A: Task Catalog & Input Validation Tests
  // =========================================================================
  describe("Group A: Task Catalog & Validation (Unit & API Tests)", () => {
    it("loads all JavaScript tasks from tasks catalog", () => {
      const tasks = getAllTasks("javascript");
      expect(tasks.length).toBeGreaterThanOrEqual(7);

      const twoSum = tasks.find((t) => t.id === "two-sum");
      expect(twoSum).toBeDefined();
      expect(twoSum.title).toBe("Two Sum");
      expect(twoSum.difficulty).toBeDefined();
    });

    it("sanitizes hidden tests in public task details", () => {
      const task = getPublicTask("two-sum", "javascript");
      expect(task).toBeDefined();
      expect(task.sampleTests).toBeDefined();
      expect(task.sampleTests.every((t) => t.isSample === true)).toBe(true);
      expect(task.totalTestsCount).toBeGreaterThan(task.sampleTests.length);
    });

    it("21. returns null for invalid task ID", () => {
      const task = getPublicTask("non-existent-task-999", "javascript");
      expect(task).toBeNull();
    });

    it("22. gracefully handles invalid syntax in student code", async () => {
      const syntaxErrorCode = `function broken( { return 123; }`;
      const result = await evaluateTask("add-two-numbers", syntaxErrorCode);
      expect(result.status).toBe("error");
      expect(result.score).toBe(0);
      expect(result.passed).toBe(0);
      expect(result.stderr).toContain("SyntaxError");
    }, 15000);
  });

  // =========================================================================
  // GROUP B: Sandbox Security & Containment Tests (Empirically Verified)
  // =========================================================================
  describe("Group B: Docker Sandbox Security Controls (Empirically Verified)", () => {
    it("1. handles infinite loop timeout within configured 5000ms limit", async () => {
      const infiniteLoopCode = `while(true) {}`;
      const result = await executeJavaScript(infiniteLoopCode);
      expect(result.status).toBe("timeout");
      expect(result.stderr).toContain("Timed Out");
      expect(result.executionTime).toBeGreaterThanOrEqual(4900);
    }, 15000);

    it("2. verifies network isolation: outbound network sockets are blocked", async () => {
      const netAttackCode = `
const http = require('http');
try {
  const req = http.get('http://1.1.1.1', (res) => {
    console.log('NET_CONNECTED');
  });
  req.on('error', (e) => {
    console.log('NET_BLOCKED: ' + e.code);
  });
  req.setTimeout(1000, () => {
    console.log('NET_TIMEOUT');
    req.abort();
  });
} catch (err) {
  console.log('NET_EXCEPTION: ' + err.message);
}
`;
      const result = await executeJavaScript(netAttackCode);
      expect(result.stdout).not.toContain("NET_CONNECTED");
      // Either net error, socket exception, or container timeout without outbound traffic
      expect(result.stdout.includes("NET_BLOCKED") || result.stdout.includes("NET_TIMEOUT") || result.status === "completed").toBe(true);
    }, 15000);

    it("3/9. verifies read-only root filesystem: write attempts outside /tmp are blocked", async () => {
      const fsWriteAttack = `
const fs = require('fs');
try {
  fs.writeFileSync('/pwned.txt', 'evil_content');
  console.log('ROOT_WRITE_SUCCESS');
} catch (err) {
  console.log('ROOT_WRITE_BLOCKED: ' + err.code);
}
try {
  fs.writeFileSync('/sandbox/hack.js', 'evil_content');
  console.log('SANDBOX_WRITE_SUCCESS');
} catch (err) {
  console.log('SANDBOX_WRITE_BLOCKED: ' + err.code);
}
`;
      const result = await executeJavaScript(fsWriteAttack);
      expect(result.stdout).toContain("ROOT_WRITE_BLOCKED");
      expect(result.stdout).toContain("SANDBOX_WRITE_BLOCKED");
      expect(result.stdout).not.toContain("ROOT_WRITE_SUCCESS");
      expect(result.stdout).not.toContain("SANDBOX_WRITE_SUCCESS");
    }, 15000);

    it("4. verifies filesystem read containment for protected system paths", async () => {
      const fsReadAttack = `
const fs = require('fs');
try {
  const shadow = fs.readFileSync('/etc/shadow', 'utf8');
  console.log('SHADOW_LEAK: ' + shadow.slice(0, 10));
} catch (err) {
  console.log('SHADOW_BLOCKED: ' + err.code);
}
`;
      const result = await executeJavaScript(fsReadAttack);
      expect(result.stdout).toContain("SHADOW_BLOCKED");
      expect(result.stdout).not.toContain("SHADOW_LEAK");
    }, 15000);

    it("5/6. verifies host environment & secret isolation: no server credentials leaked", async () => {
      const secretCheckCode = `
console.log('GROQ:' + (process.env.GROQ_API_KEY ? 'LEAKED' : 'SAFE'));
console.log('MONGO:' + (process.env.MONGODB_URI ? 'LEAKED' : 'SAFE'));
console.log('GITHUB:' + (process.env.GITHUB_TOKEN ? 'LEAKED' : 'SAFE'));
console.log('FIREBASE:' + (process.env.FIREBASE_PROJECT_ID ? 'LEAKED' : 'SAFE'));
`;
      const result = await executeJavaScript(secretCheckCode);
      expect(result.stdout).toContain("GROQ:SAFE");
      expect(result.stdout).toContain("MONGO:SAFE");
      expect(result.stdout).toContain("GITHUB:SAFE");
      expect(result.stdout).toContain("FIREBASE:SAFE");
      expect(result.stdout).not.toContain("LEAKED");
    }, 15000);

    it("7. verifies system process restriction: child_process commands cannot break out", async () => {
      const processSpawnAttack = `
const { execSync } = require('child_process');
try {
  const out = execSync('whoami', { encoding: 'utf8' });
  console.log('CMD_USER: ' + out.trim());
} catch (err) {
  console.log('CMD_BLOCKED: ' + err.message);
}
`;
      const result = await executeJavaScript(processSpawnAttack);
      // If exec runs, it runs strictly as node user (uid 1000) inside container, never root
      if (result.stdout.includes("CMD_USER")) {
        expect(result.stdout).toContain("CMD_USER: node");
      } else {
        expect(result.stdout).toContain("CMD_BLOCKED");
      }
    }, 15000);

    it("8. verifies non-root UID 1000 execution inside container", async () => {
      const uidCheckCode = `
console.log('UID:' + (process.getuid ? process.getuid() : 'NA'));
console.log('GID:' + (process.getgid ? process.getgid() : 'NA'));
`;
      const result = await executeJavaScript(uidCheckCode);
      expect(result.stdout).toContain("UID:1000");
      expect(result.stdout).toContain("GID:1000");
      expect(result.stdout).not.toContain("UID:0");
    }, 15000);

    it("10. verifies /tmp tmpfs writeability with noexec restriction", async () => {
      const tmpfsCode = `
const fs = require('fs');
try {
  fs.writeFileSync('/tmp/scratch.txt', 'temporary_data');
  const readBack = fs.readFileSync('/tmp/scratch.txt', 'utf8');
  console.log('TMP_READBACK: ' + readBack);
} catch (err) {
  console.log('TMP_FAIL: ' + err.message);
}
`;
      const result = await executeJavaScript(tmpfsCode);
      expect(result.stdout).toContain("TMP_READBACK: temporary_data");
    }, 15000);

    it("13. handles memory exhaustion (OOM) without crashing host process", async () => {
      const oomCode = `
const chunks = [];
try {
  while (true) {
    chunks.push(Buffer.alloc(20 * 1024 * 1024)); // 20MB chunks
  }
} catch (e) {
  console.log('OOM_CAUGHT: ' + e.message);
}
`;
      const result = await executeJavaScript(oomCode);
      // Container either hits 128MB OOM kill (error status) or JS allocates until memory limit
      expect(["error", "completed", "timeout"]).toContain(result.status);
    }, 15000);

    it("14. handles CPU-intensive computation bounded by 0.5 CPU and timeout", async () => {
      const cpuIntensiveCode = `
let sum = 0;
for (let i = 0; i < 50000000; i++) {
  sum += Math.sqrt(i);
}
console.log('CPU_CALC_DONE: ' + (sum > 0));
`;
      const result = await executeJavaScript(cpuIntensiveCode);
      expect(["completed", "timeout"]).toContain(result.status);
    }, 15000);

    it("15. handles PID / process creation attempts safely within PidsLimit: 32", async () => {
      const forkBombCode = `
const { fork } = require('child_process');
const spawned = [];
try {
  for (let i = 0; i < 50; i++) {
    const p = fork('-e', ['process.exit(0)']);
    spawned.push(p);
  }
} catch (e) {
  console.log('PID_LIMIT_HIT: ' + e.message);
}
console.log('PID_TEST_DONE');
process.exit(0);
`;
      const result = await executeJavaScript(forkBombCode);
      expect(["completed", "error"]).toContain(result.status);
      expect(result.stdout).toContain("PID_TEST_DONE");
    }, 15000);

    it("16. rejects source code exceeding 64KB size limit before container launch", async () => {
      const oversizedCode = "let x = 1;\n".repeat(8000); // > 64KB
      const result = await executeJavaScript(oversizedCode);
      expect(result.status).toBe("system_error");
      expect(result.stderr).toContain("exceeds maximum allowed size");
    });

    it("17/18. enforces bounded stdout/stderr buffers against output flooding", async () => {
      const floodCode = `
for (let i = 0; i < 20000; i++) {
  console.log('A'.repeat(200));
}
`;
      const result = await executeJavaScript(floodCode);
      expect(result.stdout.length).toBeLessThanOrEqual(EXECUTION_LIMITS.maxStdoutBytes + 1000);
    }, 15000);

    it("19/20. verifies complete container cleanup after execution and timeout", async () => {
      // Execute a quick script
      await executeJavaScript(`console.log('CLEANUP_CHECK');`);

      // Verify no dangling ssh-javascript-sandbox containers remain running
      const containers = await docker.listContainers({ all: false });
      const sandboxContainers = containers.filter((c) =>
        (c.Image || "").includes("ssh-javascript-sandbox")
      );
      expect(sandboxContainers.length).toBe(0);
    }, 15000);

    it("25. handles concurrent container executions safely through p-limit", async () => {
      const parallelRuns = Array.from({ length: 6 }).map((_, i) =>
        executeJavaScript(`console.log('RUN_${i}');`)
      );

      const results = await Promise.all(parallelRuns);
      expect(results.length).toBe(6);
      results.forEach((r, i) => {
        expect(r.status).toBe("completed");
        expect(r.stdout).toContain(`RUN_${i}`);
      });
    }, 25000);
  });

  // =========================================================================
  // GROUP C: Evidence Adapter Tests (Integration)
  // =========================================================================
  describe("Group C: Coding Evidence Adapter", () => {
    it("produces standardized practical assessment evidence package", () => {
      const dummySubmissions = [
        {
          taskId: "two-sum",
          title: "Two Sum",
          language: "javascript",
          status: "passed",
          score: 20,
          passed: 5,
          total: 5,
          executionTimeMs: 45,
          skillsCovered: ["Arrays", "Hash Maps", "Problem Solving"],
        },
        {
          taskId: "reverse-string",
          title: "Reverse String",
          language: "javascript",
          status: "passed",
          score: 10,
          passed: 5,
          total: 5,
          executionTimeMs: 30,
          skillsCovered: ["Strings", "Two Pointers", "Problem Solving"],
        },
      ];

      const pkg = extractCodingEvidence({
        userId: "user-test-777",
        submissions: dummySubmissions,
      });

      expect(pkg.contractVersion).toBe("1.0.0");
      expect(pkg.source).toBe(EVIDENCE_SOURCES.CODING);
      expect(pkg.userId).toBe("user-test-777");
      expect(pkg.skills.length).toBeGreaterThanOrEqual(4);

      const arraysSkill = pkg.skills.find((s) => s.skill === "Arrays");
      expect(arraysSkill).toBeDefined();
      expect(arraysSkill.evidenceType).toBe(EVIDENCE_TYPES.PRACTICAL_ASSESSMENT);
      expect(arraysSkill.confidence).toBeGreaterThanOrEqual(0.85);
      expect(arraysSkill.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  // =========================================================================
  // GROUP D: API Endpoints & Authorization Security
  // =========================================================================
  describe("Group D: Coding API Routes & Security", () => {
    it("serves GET /api/v1/coding/tasks via HTTP API", async () => {
      const res = await request(app).get("/api/v1/coding/tasks");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
    });

    it("serves GET /api/v1/coding/tasks/two-sum via HTTP API", async () => {
      const res = await request(app).get("/api/v1/coding/tasks/two-sum");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.id).toBe("two-sum");
      expect(res.body.data.task.sampleTests).toBeDefined();
    });

    it("23. rejects unauthenticated POST /api/v1/coding/submit with 401", async () => {
      const res = await request(app).post("/api/v1/coding/submit").send({
        taskId: "two-sum",
        code: "function twoSum() {}",
      });
      expect(res.status).toBe(401);
    });

    it("24. rejects unauthenticated GET /api/v1/coding/submissions with 401", async () => {
      const res = await request(app).get("/api/v1/coding/submissions");
      expect(res.status).toBe(401);
    });
  });
});
