import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Backend Auth Deduplication & Provider Linking Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user on first Google sign-in", async () => {
    const { upsertUserFromFirebase } = await import("../src/core/auth/auth.service.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const mockFindOne = vi.spyOn(User, "findOne").mockResolvedValue(null);
    const mockCreate = vi.spyOn(User, "create").mockResolvedValue({
      _id: "mongo_1",
      firebaseUid: "google_uid_123",
      email: "developer@example.com",
      displayName: "Dev Pro",
      authProviders: ["google.com"],
      save: vi.fn(),
    });

    const decodedToken = {
      uid: "google_uid_123",
      email: "DEVELOPER@example.com ", // unnormalized email
      name: "Dev Pro",
      email_verified: true,
      firebase: { sign_in_provider: "google.com" },
    };

    const user = await upsertUserFromFirebase(decodedToken);

    expect(mockFindOne).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        firebaseUid: "google_uid_123",
        email: "developer@example.com",
        emailVerified: true,
        displayName: "Dev Pro",
        authProviders: ["google.com"],
      })
    );
    expect(user.displayName).toBe("Dev Pro");
  });

  it("links GitHub sign-in to existing user with same email without creating duplicate MongoDB user", async () => {
    const { upsertUserFromFirebase } = await import("../src/core/auth/auth.service.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const existingUser = {
      _id: "mongo_1",
      firebaseUid: "google_uid_123",
      email: "developer@example.com",
      displayName: "Dev Pro",
      headline: "Senior Full Stack Architect", // user custom profile data
      about: "Custom biography that should never be erased",
      authProviders: ["google.com"],
      save: vi.fn().mockResolvedValue(true),
    };

    // First search by firebaseUid returns null, second search by email returns existingUser
    vi.spyOn(User, "findOne")
      .mockResolvedValueOnce(null) // find by firebaseUid ("github_uid_456")
      .mockResolvedValueOnce(existingUser); // find by email ("developer@example.com")

    const mockCreate = vi.spyOn(User, "create");

    const decodedToken = {
      uid: "github_uid_456",
      email: "developer@example.com",
      name: "Dev Pro via GitHub",
      email_verified: true,
      firebase: { sign_in_provider: "github.com" },
    };

    const user = await upsertUserFromFirebase(decodedToken);

    // Assert NO duplicate user created
    expect(mockCreate).not.toHaveBeenCalled();

    // Assert existing profile preserved and updated
    expect(user.headline).toBe("Senior Full Stack Architect");
    expect(user.about).toBe("Custom biography that should never be erased");
    expect(user.firebaseUid).toBe("github_uid_456");
    expect(user.authProviders).toContain("google.com");
    expect(user.authProviders).toContain("github.com");
    expect(existingUser.save).toHaveBeenCalled();
  });

  it("handles Email/Password provider addition to existing Google user", async () => {
    const { upsertUserFromFirebase } = await import("../src/core/auth/auth.service.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const existingUser = {
      _id: "mongo_1",
      firebaseUid: "google_uid_123",
      email: "dev@skillhub.com",
      displayName: "Dev User",
      authProviders: ["google.com"],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, "findOne").mockResolvedValue(existingUser);
    const mockCreate = vi.spyOn(User, "create");

    const decodedToken = {
      uid: "google_uid_123",
      email: "dev@skillhub.com",
      firebase: { sign_in_provider: "password" },
    };

    const user = await upsertUserFromFirebase(decodedToken);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(user.authProviders).toContain("google.com");
    expect(user.authProviders).toContain("password");
    expect(existingUser.save).toHaveBeenCalled();
  });
});
