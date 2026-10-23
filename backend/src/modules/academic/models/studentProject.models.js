import mongoose from "mongoose";

const studentMilestoneProgressSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const studentDeliverableSubmissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["text", "report", "image", "design_doc", "data_table", "link", "archive"],
      default: "text",
    },
    content: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "",
    },
    externalUrl: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const rubricFeedbackItemSchema = new mongoose.Schema(
  {
    dimensionKey: {
      type: String,
      required: true,
    },
    dimensionName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 20,
    },
    feedback: {
      type: String,
      default: "",
    },
    criteriaMet: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const projectAuditHistorySchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
      default: "",
    },
    toStatus: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const studentProjectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    branchSlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    roleSlug: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "changes_requested", "completed", "archived"],
      default: "in_progress",
      index: true,
    },
    currentMilestoneIndex: {
      type: Number,
      default: 0,
    },
    milestoneProgress: {
      type: [studentMilestoneProgressSchema],
      default: [],
    },
    deliverables: {
      type: [studentDeliverableSubmissionSchema],
      default: [],
    },
    writtenExplanations: {
      type: String,
      default: "",
    },
    evaluation: {
      status: {
        type: String,
        enum: ["pending", "evaluated", "reviewed"],
        default: "pending",
      },
      score: {
        type: Number,
        default: 0,
      },
      maxScore: {
        type: Number,
        default: 100,
      },
      percentScore: {
        type: Number,
        default: 0,
      },
      rubricFeedback: {
        type: [rubricFeedbackItemSchema],
        default: [],
      },
      overallFeedback: {
        type: String,
        default: "",
      },
      evaluatedAt: {
        type: Date,
        default: null,
      },
      evaluator: {
        type: String,
        default: "automated_rubric",
      },
    },
    portfolioVisibility: {
      type: Boolean,
      default: false,
    },
    syncedToResume: {
      type: Boolean,
      default: false,
    },
    resumeProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    history: {
      type: [projectAuditHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user project queries
studentProjectSchema.index({ owner: 1, status: 1 });
studentProjectSchema.index({ owner: 1, templateId: 1 });

export const StudentProject =
  mongoose.models.StudentProject ||
  mongoose.model("StudentProject", studentProjectSchema);
