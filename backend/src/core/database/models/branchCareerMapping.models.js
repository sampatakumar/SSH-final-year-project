import mongoose from "mongoose";

const branchCareerMappingSchema = new mongoose.Schema(
  {
    branchSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    roleSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: ["primary", "related", "interdisciplinary", "optional"],
      default: "primary",
      index: true,
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    recommendedPrerequisites: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring idempotent relationships
branchCareerMappingSchema.index(
  { branchSlug: 1, roleSlug: 1 },
  { unique: true }
);

export const BranchCareerMapping =
  mongoose.models.BranchCareerMapping ||
  mongoose.model("BranchCareerMapping", branchCareerMappingSchema);
