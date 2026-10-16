import mongoose from "mongoose";

const careerRoleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Software & Computing",
        "Electronics & Electrical",
        "Mechanical & Industrial",
        "Civil & Infrastructure",
        "Science & Biotechnology",
        "Commerce & Business",
        "Other",
      ],
      index: true,
    },
    categoryLabel: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    experienceLevel: {
      type: String,
      enum: ["Entry-Level", "Mid-Level", "Senior", "All Levels"],
      default: "Entry-Level",
    },
    coreSkills: {
      type: [String],
      default: [],
    },
    prerequisiteSkills: {
      type: [String],
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

// Text search on title, category, description
careerRoleSchema.index({ title: "text", description: "text" });

export const CareerRole =
  mongoose.models.CareerRole ||
  mongoose.model("CareerRole", careerRoleSchema);
