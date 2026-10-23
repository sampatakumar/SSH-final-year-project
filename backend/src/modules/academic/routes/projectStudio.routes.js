import { Router } from "express";
import {
  listTemplates,
  getTemplate,
  startProject,
  listMyProjects,
  getProjectDetails,
  updateMilestone,
  saveDeliverables,
  uploadDeliverableFile,
  submitForReview,
  togglePortfolioVisibility,
  syncToResume,
  getMyPortfolioProjects,
  getPublicPortfolioProjects,
} from "../controllers/projectStudio.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import { projectDeliverableUpload } from "../middleware/deliverableUpload.middleware.js";

const router = Router();

// Public / discovery endpoints
router.get("/templates", listTemplates);
router.get("/templates/:templateId", getTemplate);
router.get("/portfolio/public/:userId", getPublicPortfolioProjects);

// Protected student studio endpoints
router.use(verifyFirebaseToken);

router.post("/start", startProject);
router.get("/my-projects", listMyProjects);
router.get("/portfolio/my", getMyPortfolioProjects);

router.get("/:projectId", getProjectDetails);
router.patch("/:projectId/milestones/:milestoneId", updateMilestone);
router.put("/:projectId/deliverables", saveDeliverables);
router.post(
  "/:projectId/upload-deliverable",
  (req, res, next) => {
    projectDeliverableUpload.single("file")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  uploadDeliverableFile
);
router.post("/:projectId/submit", submitForReview);
router.patch("/:projectId/portfolio-visibility", togglePortfolioVisibility);
router.post("/:projectId/sync-resume", syncToResume);

export default router;
