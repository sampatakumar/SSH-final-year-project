import { Router } from "express";
import {
  healthcheck,
  livenessCheck,
  readinessCheck,
} from "../controllers/healthcheck.controller.js";

const router = Router();

router.get("/", healthcheck);
router.get("/health", healthcheck);
router.get("/live", livenessCheck);
router.get("/liveness", livenessCheck);
router.get("/ready", readinessCheck);
router.get("/readiness", readinessCheck);

export default router;
