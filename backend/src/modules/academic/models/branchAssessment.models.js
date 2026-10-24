import mongoose from "mongoose";

const questionOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const assessmentQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["single_choice", "multiple_select", "numeric", "case_study_response"],
      default: "single_choice",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [questionOptionSchema],
      default: [],
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    tolerance: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
    points: {
      type: Number,
      required: true,
      default: 10,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    remediationGuidance: {
      type: String,
      default: "",
    },
    rubricCriteria: {
      type: [String],
      default: [],
    },
    caseStudyContext: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const branchAssessmentSchema = new mongoose.Schema(
  {
    assessmentId: {
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
    relevantSkills: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    estimatedDuration: {
      type: String,
      default: "20 mins",
    },
    assessmentType: {
      type: String,
      enum: ["objective_quiz", "case_study", "mixed"],
      default: "objective_quiz",
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    passingCriteria: {
      minScore: {
        type: Number,
        default: 70,
      },
      passingPercentage: {
        type: Number,
        default: 70,
      },
    },
    recommendedProjectIds: {
      type: [String],
      default: [],
    },
    questions: {
      type: [assessmentQuestionSchema],
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
    explanationAndRemediation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const BranchAssessment =
  mongoose.models.BranchAssessment ||
  mongoose.model("BranchAssessment", branchAssessmentSchema);
