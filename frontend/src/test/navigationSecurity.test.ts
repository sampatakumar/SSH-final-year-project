import { describe, it, expect } from "vitest";
import { sanitizeReturnTo } from "../core/utils/navigationSecurity";

describe("Navigation Security & Open Redirect Prevention (GHSA-wrjc-x8rr-h8h6 / CVE-2025-68470)", () => {
  it("allows safe internal application paths", () => {
    expect(sanitizeReturnTo("/dashboard")).toBe("/dashboard");
    expect(sanitizeReturnTo("/dashboard/skills")).toBe("/dashboard/skills");
    expect(sanitizeReturnTo("/dashboard/coding")).toBe("/dashboard/coding");
    expect(sanitizeReturnTo("/profile?tab=settings")).toBe("/profile?tab=settings");
  });

  it("defaults to /dashboard when returnTo is null, undefined, or empty", () => {
    expect(sanitizeReturnTo(null)).toBe("/dashboard");
    expect(sanitizeReturnTo(undefined)).toBe("/dashboard");
    expect(sanitizeReturnTo("")).toBe("/dashboard");
    expect(sanitizeReturnTo("   ")).toBe("/dashboard");
  });

  it("blocks protocol-relative URLs (//attacker.com)", () => {
    expect(sanitizeReturnTo("//evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("//evil.com/phish")).toBe("/dashboard");
  });

  it("blocks backslash-based open redirect bypasses (/\\evil.com and \\\\evil.com)", () => {
    expect(sanitizeReturnTo("/\\evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("\\\\evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("/dashboard\\evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("/foo/bar\\baz")).toBe("/dashboard");
  });

  it("blocks absolute URLs with schemes (http://, javascript:, data:)", () => {
    expect(sanitizeReturnTo("https://evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("http://evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeReturnTo("/path:with-colon")).toBe("/dashboard");
  });

  it("blocks percent-encoded backslashes (%5c / %5C)", () => {
    expect(sanitizeReturnTo("/%5cevil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("/%5Cevil.com")).toBe("/dashboard");
  });

  it("accepts custom fallback defaultPath", () => {
    expect(sanitizeReturnTo("//evil.com", "/home")).toBe("/home");
    expect(sanitizeReturnTo(null, "/login")).toBe("/login");
  });
});
