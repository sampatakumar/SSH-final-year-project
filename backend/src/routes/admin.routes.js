import { Router } from "express";
import { ensureAdmin } from "../core/middleware/admin.middleware.js";
import { Analytics } from "../models/analytics.models.js";

const router = Router();

router.get("/analytics", ensureAdmin, async (req, res) => {
  try {
    // Fetch the last 14 days of data to construct a robust chart
    const analytics = await Analytics.find()
      .sort({ date: -1 })
      .limit(14)
      .lean();
    
    return res.json({ success: true, data: analytics.reverse() });
  } catch (error) {
    console.error("[Admin API] Failed to fetch analytics", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
