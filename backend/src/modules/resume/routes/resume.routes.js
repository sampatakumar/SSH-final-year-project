import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { incrementDailyCounter } from "../../../core/database/models/analytics.models.js";
import {
  createResume,
  deleteResume,
  getResumeFile,
  listResumes,
  uploadAndExtractResume,
  extractResumeById,
  applyExtractedProfileToUser
} from "../controllers/resume.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import { resumeUpload } from "../../../core/middleware/multer.middleware.js";

const router = Router();

const uploadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: { success: false, message: "Too many resume uploads from this IP, please try again later." },
    handler: (req, res, next, options) => {
        incrementDailyCounter("rateLimitHits", 1);
        res.status(options.statusCode).json(options.message);
    }
});

router.use(verifyFirebaseToken);
router.get("/", listResumes);
router.get("/:resumeId/file", getResumeFile);

router.post("/upload", uploadLimiter, (req, res, next) => {
	resumeUpload.single("resumeFile")(req, res, (error) => {
		if (error) {
			if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
				const maxMb = process.env.MAX_RESUME_SIZE_MB || 10;
				return res.status(413).json({
					success: false,
					message: `Resume file is too large. Maximum size is ${maxMb} MB.`,
					statusCode: 413
				});
			}
			return res.status(400).json({
				success: false,
				message: error.message || "Unsupported resume format.",
				statusCode: 400
			});
		}

		res.on("finish", () => {
			if (res.statusCode >= 200 && res.statusCode < 300) {
				incrementDailyCounter("resumesUploaded", 1);
			}
		});

		uploadAndExtractResume(req, res, next);
	});
});

router.post("/:resumeId/extract", extractResumeById);
router.post("/apply-profile", applyExtractedProfileToUser);

router.post("/", uploadLimiter, (req, res, next) => {
	resumeUpload.single("resumeFile")(req, res, (error) => {
		if (error) {
			if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
				const maxMb = process.env.MAX_RESUME_SIZE_MB || 10;
				return res.status(413).json({
					success: false,
					message: `Resume file is too large. Maximum size is ${maxMb} MB.`,
					statusCode: 413
				});
			}
			return res.status(400).json({
				success: false,
				message: error.message || "Unsupported resume format.",
				statusCode: 400
			});
		}

		res.on("finish", () => {
			if (res.statusCode >= 200 && res.statusCode < 300) {
				incrementDailyCounter("resumesUploaded", 1);
			}
		});

		// Ensure errors in createResume are caught
		try {
			createResume(req, res, next);
		} catch (err) {
			next(err);
		}
	});
});
router.delete("/:resumeId", deleteResume);

export default router;
