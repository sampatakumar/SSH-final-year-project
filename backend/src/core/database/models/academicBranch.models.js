import mongoose from "mongoose";

const specializationSubSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const academicBranchSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    degreeSlugs: {
      type: [String],
      default: [],
      index: true,
    },
    stream: {
      type: String,
      required: true,
      index: true,
    },
    discipline: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    specializations: {
      type: [specializationSubSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text search on name, code, and aliases
academicBranchSchema.index({ name: "text", code: "text", aliases: "text" });

export const AcademicBranch =
  mongoose.models.AcademicBranch ||
  mongoose.model("AcademicBranch", academicBranchSchema);
