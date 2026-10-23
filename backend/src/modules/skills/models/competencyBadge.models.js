import mongoose from "mongoose";

const competencyBadgeSchema = new mongoose.Schema(
  {
    badgeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientIdentifier: {
      type: String,
      default: "SSH Verified Learner",
      trim: true,
    },
    competencyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    competencyName: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    canonicalSkill: {
      type: String,
      required: true,
      trim: true,
    },
    badgeType: {
      type: String,
      enum: ["knowledge_specialist", "applied_practitioner", "retention_master", "capstone_competence"],
      required: true,
      index: true,
    },
    rubricVersion: {
      type: String,
      default: "1.0.0",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    revocationReason: {
      type: String,
      default: "",
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    signature: {
      type: String,
      required: true,
    },
    keyId: {
      type: String,
      default: "ssh-badge-key-2026-v1",
    },
    evidenceSummary: {
      evidenceCategories: {
        type: [String],
        default: [],
      },
      knowledgeScore: {
        type: Number,
        default: 0,
      },
      knowledgeCheckpointsPassed: {
        type: Number,
        default: 0,
      },
      retentionStage: {
        type: Number,
        default: 0,
      },
      consecutiveRetrievals: {
        type: Number,
        default: 0,
      },
      appliedProblemsSolved: {
        type: Number,
        default: 0,
      },
      appliedTestCasesPassed: {
        type: Number,
        default: 0,
      },
      verifiedAt: {
        type: Date,
        default: Date.now,
      },
    },
    issuer: {
      type: String,
      default: "Smart Skill Hub Competency Authority",
    },
    criteriaUrl: {
      type: String,
      default: "/api/v1/skills/competencies/taxonomy",
    },
  },
  {
    timestamps: true,
  }
);

competencyBadgeSchema.index(
  { owner: 1, competencyId: 1, badgeType: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

export const CompetencyBadge =
  mongoose.models.CompetencyBadge || mongoose.model("CompetencyBadge", competencyBadgeSchema);
