import mongoose from "mongoose";

const studyTopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    status: {
      type: String,
      enum: ["exposed", "practiced", "retained", "mastered"],
      default: "exposed",
    },
    masteryScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 20,
    },
    exposureCount: {
      type: Number,
      default: 1,
    },
    practiceCount: {
      type: Number,
      default: 0,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
    },
    lastQuizScore: {
      type: Number,
      default: 0,
    },
    lastAssessedAt: {
      type: Date,
      default: Date.now,
    },
    nextRevisionDue: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { _id: false }
);

const studyProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    targetAcademicLevel: {
      type: String,
      enum: ["Undergraduate", "Postgraduate", "Self-Taught / Professional"],
      default: "Undergraduate",
    },
    enrolledSubjects: {
      type: [String],
      default: [
        "Data Structures & Algorithms",
        "Computer Systems & Networking",
        "Database Management Systems",
        "Software Engineering & Architecture",
      ],
    },
    topics: [studyTopicSchema],
    totalStudyHours: {
      type: Number,
      default: 0,
    },
    streakDays: {
      type: Number,
      default: 1,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const StudyProfile =
  mongoose.models.StudyProfile || mongoose.model("StudyProfile", studyProfileSchema);
