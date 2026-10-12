import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    conceptKey: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    intervalDays: {
      type: Number,
      default: 1,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    repetitionCount: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    nextReviewDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    reviewHistory: [
      {
        reviewedAt: { type: Date, default: Date.now },
        qualityRating: Number, // 0 to 5 (SuperMemo scale)
        previousInterval: Number,
        newInterval: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

flashcardSchema.index({ owner: 1, nextReviewDate: 1 });

export const Flashcard =
  mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);
