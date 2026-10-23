import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    required: {
      type: Boolean,
      default: true,
    },
    suggestedDeliverables: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const deliverableRequirementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "report", "image", "design_doc", "data_table", "link", "archive"],
      default: "text",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    acceptedFileTypes: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const rubricDimensionSchema = new mongoose.Schema(
  {
    dimensionKey: {
      type: String,
      required: true,
      trim: true,
    },
    dimensionName: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 20,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 20,
    },
    description: {
      type: String,
      default: "",
    },
    criteria: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const projectTemplateSchema = new mongoose.Schema(
  {
    templateId: {
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
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    branchSlugs: {
      type: [String],
      required: true,
      index: true,
      default: [],
    },
    disciplineCategory: {
      type: String,
      required: true,
      trim: true,
      default: "Engineering & Technology",
    },
    compatibleDegrees: {
      type: [String],
      default: [],
    },
    relevantRoleSlugs: {
      type: [String],
      index: true,
      default: [],
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    estimatedEffort: {
      type: String,
      default: "15-20 hours",
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    deliverables: {
      type: [deliverableRequirementSchema],
      default: [],
    },
    evidenceRequirements: {
      type: String,
      default: "",
    },
    rubric: {
      type: [rubricDimensionSchema],
      default: [],
    },
    relevantSkills: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProjectTemplate =
  mongoose.models.ProjectTemplate ||
  mongoose.model("ProjectTemplate", projectTemplateSchema);
