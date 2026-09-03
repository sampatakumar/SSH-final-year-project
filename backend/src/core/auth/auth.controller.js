import { upsertUserFromFirebase } from "./auth.service.js";
import { ApiError } from "../errors/ApiError.js";
import { ApiResponse } from "../errors/ApiResponse.js";
import { asyncHandler } from "../errors/asyncHandler.js";
import { z } from "zod";
import { getFirebaseAuth } from "../../config/firebaseAdmin.js";
import { env } from "../../config/env.js";
import { emailService } from "../../services/email/email.service.js";
import {
  AchievementEntry,
  EducationEntry,
  ExperienceEntry,
  normalizeSkillBuckets,
  normalizeTextArray,
  SkillSection,
} from "../../classes/profile.classes.js";

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(200).optional(),
  headline: z.string().max(500).optional(),
  phone: z.string().max(100).optional(),
  about: z.string().max(10000).optional(),
  customDomain: z.string().max(300).optional(),
  notificationsEnabled: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  linkedInUrl: z.string().max(1000).optional(),
  githubUrl: z.string().max(1000).optional(),
  leetCodeId: z.string().max(300).optional(),
  geeksForGeeksId: z.string().max(300).optional(),
  education: z.array(z.string().max(1000)).max(30).optional(),
  educationEntries: z
    .array(
      z.object({
        degree: z.string().max(300).optional().default(""),
        specialization: z.string().max(300).optional().default(""),
        college: z.string().max(500).optional().default(""),
        location: z.string().max(300).optional().default(""),
        endDate: z.string().max(200).optional().default(""),
        grade: z.string().max(200).optional().default(""),
      })
    )
    .max(30)
    .optional(),
  skillLanguages: z.array(z.string().max(300)).max(100).optional(),
  skillFrameworks: z.array(z.string().max(300)).max(100).optional(),
  skillTools: z.array(z.string().max(300)).max(100).optional(),
  skillLibraries: z.array(z.string().max(300)).max(100).optional(),
  skillSections: z
    .array(
      z.object({
        title: z.string().max(300).optional().default(""),
        skills: z.array(z.string().max(300)).max(100).optional().default([]),
      })
    )
    .max(30)
    .optional(),
  experience: z
    .array(
      z.object({
        role: z.string().max(300).optional().default(""),
        company: z.string().max(300).optional().default(""),
        location: z.string().max(300).optional().default(""),
        date: z.string().max(200).optional().default(""),
        bullets: z.array(z.string().max(2000)).max(50).optional().default([]),
      })
    )
    .max(30)
    .optional(),
  achievements: z
    .array(
      z.object({
        title: z.string().max(300).optional().default(""),
        date: z.string().max(200).optional().default(""),
        bullets: z.array(z.string().max(2000)).max(50).optional().default([]),
      })
    )
    .max(30)
    .optional(),
});

export const firebaseSignIn = asyncHandler(async (req, res) => {
  const decodedToken = req.auth.decodedToken || {};
  const signInProvider = decodedToken.firebase?.sign_in_provider || decodedToken.provider_id;
  const isEmailVerified = Boolean(decodedToken.email_verified);

  // Email/Password sign-in requires verified email before MongoDB account activation
  if (signInProvider === "password" && !isEmailVerified) {
    throw new ApiError(403, "Email verification required. Please verify your email before activating your account.");
  }

  const user = await upsertUserFromFirebase(decodedToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        auth: {
          uid: req.auth.uid,
          email: req.auth.email,
        },
      },
      "User authenticated successfully"
    )
  );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user profile"));
});

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid profile payload", parsed.error.issues);
  }

  const user = req.user;

  if (parsed.data.displayName !== undefined) {
    user.displayName = parsed.data.displayName;
  }

  if (parsed.data.headline !== undefined) {
    user.headline = parsed.data.headline;
  }

  if (parsed.data.phone !== undefined) {
    user.phone = parsed.data.phone;
  }

  if (parsed.data.about !== undefined) {
    user.about = parsed.data.about;
  }

  if (parsed.data.customDomain !== undefined) {
    user.customDomain = parsed.data.customDomain;
  }

  if (parsed.data.notificationsEnabled !== undefined) {
    user.notificationsEnabled = parsed.data.notificationsEnabled;
  }

  if (parsed.data.onboardingCompleted !== undefined) {
    user.onboardingCompletedAt = parsed.data.onboardingCompleted ? new Date() : null;
  }

  if (parsed.data.linkedInUrl !== undefined) {
    user.linkedInUrl = parsed.data.linkedInUrl;
  }

  if (parsed.data.githubUrl !== undefined) {
    user.githubUrl = parsed.data.githubUrl;
  }

  if (parsed.data.leetCodeId !== undefined) {
    user.leetCodeId = parsed.data.leetCodeId;
  }

  if (parsed.data.geeksForGeeksId !== undefined) {
    user.geeksForGeeksId = parsed.data.geeksForGeeksId;
  }

  const hasEducationEntriesUpdate = parsed.data.educationEntries !== undefined;
  const hasSkillUpdate =
    parsed.data.skillSections !== undefined ||
    parsed.data.skillLanguages !== undefined ||
    parsed.data.skillFrameworks !== undefined ||
    parsed.data.skillTools !== undefined ||
    parsed.data.skillLibraries !== undefined;

  if (hasEducationEntriesUpdate) {
    const normalizedEducationEntries = EducationEntry.fromList(parsed.data.educationEntries)
      .filter((entry) => !entry.isEmpty());

    user.educationEntries = normalizedEducationEntries.map((entry) => entry.toObject());
    user.education = normalizedEducationEntries.map((entry) => entry.toSummaryLine()).filter(Boolean);
  } else if (parsed.data.education !== undefined) {
    user.education = normalizeTextArray(parsed.data.education);
  }

  if (hasSkillUpdate) {
    const skillSections = parsed.data.skillSections !== undefined
      ? SkillSection.fromList(parsed.data.skillSections).filter((section) => !section.isEmpty()).map((section) => section.toObject())
      : user.skillSections;

    const normalizedBuckets = normalizeSkillBuckets({
      skillSections,
      skillLanguages: parsed.data.skillLanguages !== undefined ? parsed.data.skillLanguages : user.skillLanguages,
      skillFrameworks: parsed.data.skillFrameworks !== undefined ? parsed.data.skillFrameworks : user.skillFrameworks,
      skillTools: parsed.data.skillTools !== undefined ? parsed.data.skillTools : user.skillTools,
      skillLibraries: parsed.data.skillLibraries !== undefined ? parsed.data.skillLibraries : user.skillLibraries,
    });

    user.skillSections = normalizedBuckets.skillSections;
    user.skillLanguages = normalizedBuckets.skillLanguages;
    user.skillFrameworks = normalizedBuckets.skillFrameworks;
    user.skillTools = normalizedBuckets.skillTools;
    user.skillLibraries = normalizedBuckets.skillLibraries;
  }

  if (parsed.data.experience !== undefined) {
    user.experience = ExperienceEntry.fromList(parsed.data.experience)
      .filter((entry) => !entry.isEmpty())
      .map((entry) => entry.toObject());
  }

  if (parsed.data.achievements !== undefined) {
    user.achievements = AchievementEntry.fromList(parsed.data.achievements)
      .filter((entry) => !entry.isEmpty())
      .map((entry) => entry.toObject());
  }

  await user.save();

  return res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

export const sendVerificationEmail = asyncHandler(async (req, res) => {
  const uid = req.auth?.uid;
  const email = req.auth?.email;

  if (!uid || !email) {
    throw new ApiError(400, "Authenticated user must have an email address to send verification.");
  }

  // 1. Fetch user from Firebase Admin to check verification status and metadata
  const auth = getFirebaseAuth();
  const firebaseUserRecord = await auth.getUser(uid);

  if (firebaseUserRecord.emailVerified) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { alreadyVerified: true, email },
        "Email address is already verified."
      )
    );
  }

  // 2. ActionCodeSettings pointing to the Smart Skill Hub frontend action handler
  const actionCodeSettings = {
    url: `${env.FRONTEND_URL}/auth/action`,
    handleCodeInApp: true,
  };

  // 3. Generate secure verification link via Firebase Admin SDK
  const verificationLink = await auth.generateEmailVerificationLink(
    email,
    actionCodeSettings
  );

  // 4. Extract user's first name
  const displayName = req.auth.name || firebaseUserRecord.displayName || "";
  const firstName = displayName.split(" ")[0] || "Developer";

  // 5. Send custom Smart Skill Hub branded email
  await emailService.sendVerificationEmail({
    to: email,
    firstName,
    verificationLink,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { sent: true, email },
      "Verification email sent successfully."
    )
  );
});

export const sendPasswordReset = asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email("Please provide a valid email address"),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Valid email address is required", parsed.error.issues);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const auth = getFirebaseAuth();

  const actionCodeSettings = {
    url: `${env.FRONTEND_URL}/auth/action`,
    handleCodeInApp: true,
  };

  try {
    // 1. Check if user exists in Firebase and get display name
    const firebaseUserRecord = await auth.getUserByEmail(email);
    const firstName = (firebaseUserRecord.displayName || "").split(" ")[0] || "Developer";

    // 2. Generate secure password reset link via Firebase Admin SDK
    const resetLink = await auth.generatePasswordResetLink(
      email,
      actionCodeSettings
    );

    // 3. Send custom password reset email
    await emailService.sendPasswordResetEmail({
      to: email,
      firstName,
      resetLink,
    });
  } catch (error) {
    // If user is not found, do NOT expose user non-existence (prevent account enumeration)
    if (error.code === "auth/user-not-found") {
      console.log(`[PasswordReset] User not found for email: ${email}. Responding with generic success.`);
    } else {
      console.error("[PasswordReset] Error during password reset link generation:", error);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { sent: true },
      "If an account exists with this email address, password reset instructions have been sent."
    )
  );
});

