import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authProviders: {
      type: [String],
      default: [],
    },
    displayName: {
      type: String,
      trim: true,
    },
    headline: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    photoURL: {
      type: String,
      trim: true,
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    customDomain: {
      type: String,
      trim: true,
      default: "",
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    linkedInUrl: {
      type: String,
      trim: true,
      default: "",
    },
    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },
    leetCodeId: {
      type: String,
      trim: true,
      default: "",
    },
    geeksForGeeksId: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    targetRole: {
      type: String,
      trim: true,
      default: "Full Stack Developer",
    },
    targetRoles: {
      type: [String],
      default: ["Full Stack Developer"],
    },
    careerInterests: {
      type: [String],
      default: [],
    },
    academic: {
      degreeSlug: { type: String, trim: true, default: "" },
      degreeName: { type: String, trim: true, default: "" },
      branchSlug: { type: String, trim: true, default: "" },
      branchName: { type: String, trim: true, default: "" },
      specializationSlug: { type: String, trim: true, default: "" },
      specializationName: { type: String, trim: true, default: "" },
      stream: { type: String, trim: true, default: "" },
      currentYear: { type: Number, min: 1, max: 6, default: null },
      currentSemester: { type: Number, min: 1, max: 12, default: null },
      institution: { type: String, trim: true, default: "" },
      graduationYear: { type: Number, default: null },
      academicScheme: { type: String, trim: true, default: "" },
      isConfigured: { type: Boolean, default: false },
    },
    education: {
      type: [String],
      default: [],
    },
    educationEntries: {
      type: [
        {
          degree: { type: String, trim: true, default: "" },
          specialization: { type: String, trim: true, default: "" },
          college: { type: String, trim: true, default: "" },
          location: { type: String, trim: true, default: "" },
          endDate: { type: String, trim: true, default: "" },
          grade: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    skillLanguages: {
      type: [String],
      default: [],
    },
    skillFrameworks: {
      type: [String],
      default: [],
    },
    skillTools: {
      type: [String],
      default: [],
    },
    skillLibraries: {
      type: [String],
      default: [],
    },
    skillSections: {
      type: [
        {
          title: { type: String, trim: true, default: "" },
          skills: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    experience: {
      type: [
        {
          role: { type: String, trim: true, default: "" },
          company: { type: String, trim: true, default: "" },
          location: { type: String, trim: true, default: "" },
          date: { type: String, trim: true, default: "" },
          bullets: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    achievements: {
      type: [
        {
          title: { type: String, trim: true, default: "" },
          date: { type: String, trim: true, default: "" },
          bullets: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
