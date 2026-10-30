import mongoose from "mongoose";

const communityMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "moderator", "member"],
      default: "member",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked", "banned"],
      default: "active",
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate group memberships
communityMembershipSchema.index({ group: 1, user: 1 }, { unique: true });
communityMembershipSchema.index({ user: 1, status: 1 });

export const CommunityMembership =
  mongoose.models.CommunityMembership ||
  mongoose.model("CommunityMembership", communityMembershipSchema);
