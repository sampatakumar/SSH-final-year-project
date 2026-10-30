import mongoose from "mongoose";

const communityBlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate blocks between the same two users
communityBlockSchema.index({ blocker: 1, blockedUser: 1 }, { unique: true });

export const CommunityBlock =
  mongoose.models.CommunityBlock ||
  mongoose.model("CommunityBlock", communityBlockSchema);
