import mongoose from "mongoose";

export const COMMUNITY_GROUP_CATEGORIES = [
  "Programming",
  "Web Development",
  "AI and Machine Learning",
  "Competitive Programming",
  "Engineering",
  "Academics",
  "Business and Finance",
  "Project Collaboration",
  "Placement Preparation",
  "General Discussion",
];

const communityGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: COMMUNITY_GROUP_CATEGORIES,
      default: "General Discussion",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPasswordProtected: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      select: false, // Never return password hash in default queries
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rules: {
      type: [String],
      default: [
        "Be respectful and supportive to all students.",
        "Share constructive educational insights and collaborate responsibly.",
        "No spam, academic plagiarism, or offensive content.",
      ],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance listing and discovery
communityGroupSchema.index({ visibility: 1, category: 1, lastActivityAt: -1 });
communityGroupSchema.index({ name: "text", description: "text" });

export const CommunityGroup =
  mongoose.models.CommunityGroup ||
  mongoose.model("CommunityGroup", communityGroupSchema);
