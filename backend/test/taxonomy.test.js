import { describe, it, expect } from "vitest";
import {
  normalizeSkill,
  getSkillCategory,
  getSkillMetadata,
  normalizeSkillList,
  isKnownSkill,
} from "../src/services/taxonomy/skillTaxonomy.service.js";
import { SKILL_CATEGORIES } from "../src/constants/skillTaxonomy.js";

describe("Skill Taxonomy & Alias Normalization Service", () => {
  describe("1. Skill Alias Normalization", () => {
    it("normalizes React variants to 'React'", () => {
      expect(normalizeSkill("react")).toBe("React");
      expect(normalizeSkill("react.js")).toBe("React");
      expect(normalizeSkill("ReactJS")).toBe("React");
      expect(normalizeSkill("React JS")).toBe("React");
      expect(normalizeSkill("react-js")).toBe("React");
    });

    it("normalizes Node.js variants to 'Node.js'", () => {
      expect(normalizeSkill("node")).toBe("Node.js");
      expect(normalizeSkill("nodejs")).toBe("Node.js");
      expect(normalizeSkill("node.js")).toBe("Node.js");
      expect(normalizeSkill("Node JS")).toBe("Node.js");
    });

    it("normalizes MongoDB variants to 'MongoDB'", () => {
      expect(normalizeSkill("mongo")).toBe("MongoDB");
      expect(normalizeSkill("mongodb")).toBe("MongoDB");
      expect(normalizeSkill("Mongo DB")).toBe("MongoDB");
    });

    it("normalizes C++ and other language variants", () => {
      expect(normalizeSkill("cpp")).toBe("C++");
      expect(normalizeSkill("c++")).toBe("C++");
      expect(normalizeSkill("cplusplus")).toBe("C++");
      expect(normalizeSkill("golang")).toBe("Go");
      expect(normalizeSkill("py")).toBe("Python");
      expect(normalizeSkill("ts")).toBe("TypeScript");
      expect(normalizeSkill("js")).toBe("JavaScript");
    });

    it("normalizes DSA and algorithm terms", () => {
      expect(normalizeSkill("dsa")).toBe("Data Structures");
      expect(normalizeSkill("data structures")).toBe("Data Structures");
      expect(normalizeSkill("algo")).toBe("Algorithms");
      expect(normalizeSkill("hashmap")).toBe("Hash Maps");
      expect(normalizeSkill("hash table")).toBe("Hash Maps");
      expect(normalizeSkill("dp")).toBe("Dynamic Programming");
    });
  });

  describe("2. Case & Punctuation Normalization", () => {
    it("handles uppercase, mixed case, and punctuation edge cases", () => {
      expect(normalizeSkill("  REACT.JS  ")).toBe("React");
      expect(normalizeSkill("JAVASCRIPT")).toBe("JavaScript");
      expect(normalizeSkill("  c#  ")).toBe("C#");
      expect(normalizeSkill("next.js/")).toBe("Next.js");
      expect(normalizeSkill("tailwind-css")).toBe("Tailwind CSS");
    });

    it("handles unknown skills by formatting gracefully with Title Case", () => {
      expect(normalizeSkill("super-fast-db")).toBe("Super Fast Db");
      expect(normalizeSkill("custom-ai-tool")).toBe("Custom Ai Tool");
      expect(normalizeSkill("")).toBe("");
      expect(normalizeSkill(null)).toBe("");
    });
  });

  describe("3. Duplicate Skill Merging", () => {
    it("deduplicates redundant alias strings into unique canonical list", () => {
      const rawList = ["React", "react.js", "ReactJS", "Node", "nodejs", "Node.js", "TypeScript", "ts"];
      const normalized = normalizeSkillList(rawList);

      expect(normalized).toEqual(["React", "Node.js", "TypeScript"]);
      expect(normalized.length).toBe(3);
    });

    it("filters out empty or invalid items in list", () => {
      const rawList = ["", "  ", null, undefined, "Docker", "docker", "k8s", "Kubernetes"];
      const normalized = normalizeSkillList(rawList);

      expect(normalized).toEqual(["Docker", "Kubernetes"]);
    });
  });

  describe("4. Category & Metadata Resolution", () => {
    it("returns correct category for canonical skills", () => {
      expect(getSkillCategory("React")).toBe(SKILL_CATEGORIES.FRONTEND);
      expect(getSkillCategory("Node.js")).toBe(SKILL_CATEGORIES.BACKEND);
      expect(getSkillCategory("MongoDB")).toBe(SKILL_CATEGORIES.DATABASES);
      expect(getSkillCategory("Docker")).toBe(SKILL_CATEGORIES.DEVOPS);
      expect(getSkillCategory("Data Structures")).toBe(SKILL_CATEGORIES.CORE_CS);
    });

    it("checks isKnownSkill correctly", () => {
      expect(isKnownSkill("react")).toBe(true);
      expect(isKnownSkill("PostgreSQL")).toBe(true);
      expect(isKnownSkill("unknown-custom-lib")).toBe(false);
    });
  });
});
