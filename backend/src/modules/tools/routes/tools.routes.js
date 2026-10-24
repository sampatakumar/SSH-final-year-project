import { Router } from "express";
import {
  getToolCatalogController,
  getToolByIdController,
  executeToolController,
  getMyToolActivityController,
  togglePortfolioSaveController,
} from "../controllers/tools.controller.js";
import { verifyFirebaseToken, optionalFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Catalog and single tool specification
router.get("/", optionalFirebaseToken, getToolCatalogController);
router.get("/history/my-activity", verifyFirebaseToken, getMyToolActivityController);
router.patch("/history/:recordId/portfolio", verifyFirebaseToken, togglePortfolioSaveController);
router.get("/:toolId", getToolByIdController);
router.post("/:toolId/execute", optionalFirebaseToken, executeToolController);

export default router;
