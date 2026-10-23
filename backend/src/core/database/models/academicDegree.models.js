import mongoose from "mongoose";

const academicDegreeSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
    },
    stream: {
      type: String,
      required: true,
      enum: [
        "Engineering & Technology",
        "Computing & Science",
        "Commerce & Management",
        "Arts & Humanities",
        "Healthcare & Life Sciences",
        "Diploma & Polytechnic",
        "Other",
      ],
      default: "Engineering & Technology",
      index: true,
    },
    durationYears: {
      type: Number,
      default: 4,
    },
    totalSemesters: {
      type: Number,
      default: 8,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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

export const AcademicDegree =
  mongoose.models.AcademicDegree ||
  mongoose.model("AcademicDegree", academicDegreeSchema);
