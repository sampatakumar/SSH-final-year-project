import mongoose from "mongoose";

const mentorActionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["github", "skills", "learning", "resume", "project", "career", "interview", "edutube"],
      default: "career",
    },
    estimatedMinutes: { type: Number, default: 30 },
    route: { type: String, default: "" },
  },
  { _id: false }
);

const mentorReferenceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, default: "link" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const mentorMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["user", "groq", "local_nlp", "deterministic"],
      default: "user",
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0,
    },
    actions: {
      type: [mentorActionSchema],
      default: [],
    },
    references: {
      type: [mentorReferenceSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const smartMentorConversationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [mentorMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const SmartMentorConversation =
  mongoose.models.SmartMentorConversation ||
  mongoose.model("SmartMentorConversation", smartMentorConversationSchema);
