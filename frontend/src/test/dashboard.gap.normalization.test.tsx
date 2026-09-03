import { describe, it, expect } from "vitest";
import { normalizeSkillGap, normalizeSkillGaps, type SkillGapViewModel } from "../lib/api";

describe("Dashboard Skill Gap Normalization & Runtime Contract Suite", () => {
  it("1. correctly normalizes a fully populated gap record", () => {
    const raw = {
      skill: "Docker",
      canonicalName: "Docker",
      category: "DevOps",
      status: "Weak / Action Required",
      priority: "High",
      isCore: true,
      currentScore: 30,
      currentLevel: "Limited Evidence",
      requiredLevel: "Proficient",
      reason: "Requires containerization experience",
    };

    const normalized = normalizeSkillGap(raw);
    expect(normalized.canonicalName).toBe("Docker");
    expect(normalized.status).toBe("Weak / Action Required");
    expect(normalized.priority).toBe("High");
    expect(normalized.currentScore).toBe(30);
    expect(normalized.isCore).toBe(true);
  });

  it("2. safely handles missing status (status === undefined) without crashing", () => {
    const rawWithoutStatus = {
      skill: "Kubernetes",
      canonicalName: "Kubernetes",
      category: "DevOps",
      status: undefined,
      priority: "Critical",
      currentScore: 0,
      targetScore: 75,
      reason: "Missing from resume and code",
      missingFrom: ["resume", "github", "coding"],
    };

    const normalized = normalizeSkillGap(rawWithoutStatus);
    expect(normalized.status).toBe("Missing");
    expect(normalized.canonicalName).toBe("Kubernetes");
    expect(typeof normalized.status).toBe("string");

    // Verify .includes() does not throw
    expect(() => {
      const isWeakOrMissing = normalized.status === "Missing" || normalized.status.includes("Weak");
      expect(isWeakOrMissing).toBe(true);
    }).not.toThrow();
  });

  it("3. safely handles null / non-object gap entries", () => {
    const nullResult = normalizeSkillGap(null);
    expect(nullResult.canonicalName).toBe("Unknown");
    expect(nullResult.status).toBe("Missing");
    expect(nullResult.priority).toBe("Medium");

    const undefinedResult = normalizeSkillGap(undefined);
    expect(undefinedResult.canonicalName).toBe("Unknown");
    expect(undefinedResult.status).toBe("Missing");
  });

  it("4. handles empty gaps array gracefully", () => {
    const result = normalizeSkillGaps([]);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("5. handles missing optional fields with deterministic defaults", () => {
    const rawSparse = {
      canonicalName: "TypeScript",
    };

    const normalized = normalizeSkillGap(rawSparse);
    expect(normalized.canonicalName).toBe("TypeScript");
    expect(normalized.skill).toBe("TypeScript");
    expect(normalized.category).toBe("General");
    expect(normalized.status).toBe("Missing");
    expect(normalized.currentScore).toBe(0);
    expect(normalized.currentLevel).toBe("None");
    expect(normalized.requiredLevel).toBe("Competent");
  });

  it("6. processes multiple gaps and verifies dashboard action item counter", () => {
    const rawGaps = [
      { canonicalName: "TypeScript", status: "Missing", priority: "High" },
      { canonicalName: "Docker", status: "Weak / Action Required", priority: "Critical" },
      { canonicalName: "GraphQL", status: "Developing / Limited Evidence", priority: "Low" },
      { canonicalName: "React", status: "Met Requirement", priority: "None" },
    ];

    const normalized = normalizeSkillGaps(rawGaps);
    expect(normalized.length).toBe(4);

    const actionItemsCount = normalized.filter(
      (g) => g.status === "Missing" || g.status.includes("Weak")
    ).length;

    expect(actionItemsCount).toBe(2);
  });

  it("7. handles mixed valid and invalid records safely", () => {
    const mixed = [
      null,
      { canonicalName: "Node.js", status: undefined, currentScore: 40 },
      undefined,
      { canonicalName: "PostgreSQL", status: "Weak / Action Required", priority: "High" },
      {},
    ];

    const normalized = normalizeSkillGaps(mixed);
    expect(normalized.length).toBe(3); // null and undefined filtered out

    expect(() => {
      const actionItems = normalized.filter((g) => g.status === "Missing" || g.status.includes("Weak"));
      expect(actionItems.length).toBeGreaterThan(0);
    }).not.toThrow();
  });
});
