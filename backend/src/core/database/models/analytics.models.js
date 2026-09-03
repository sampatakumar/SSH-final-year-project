import mongoose from "mongoose";

export const getDailyDate = () => new Date().toISOString().split("T")[0];

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      default: getDailyDate,
      unique: true,
      index: true,
    },
    apiHits: {
      type: Map,
      of: Number,
      default: {},
    },
    rateLimitHits: {
      type: Number,
      default: 0,
    },
    groqRequests: {
      type: Number,
      default: 0,
    },
    newUsers: {
      type: Number,
      default: 0,
    },
    portfoliosPublished: {
      type: Number,
      default: 0,
    },
    resumesUploaded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Analytics =
  mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);

export const incrementDailyCounter = async (field, amount = 1) => {
  try {
    const date = getDailyDate();
    await Analytics.updateOne({ date }, { $inc: { [field]: amount } }, { upsert: true });
  } catch (error) {
    console.error("[CORE Analytics] Failed to increment counter", error);
  }
};

export const logApiHit = async (route) => {
  try {
    const date = getDailyDate();
    const sanitizedRoute = route.replace(/\./g, "_");
    await Analytics.updateOne(
      { date },
      { $inc: { [`apiHits.${sanitizedRoute}`]: 1 } },
      { upsert: true }
    );
  } catch (error) {
    console.error("[CORE Analytics] Failed to log API hit", error);
  }
};
