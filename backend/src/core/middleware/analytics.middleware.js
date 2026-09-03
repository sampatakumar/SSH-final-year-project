import { logApiHit } from "../database/models/analytics.models.js";

export const apiHitTracker = (req, res, next) => {
  const route = req.baseUrl + (req.route ? req.route.path : req.path);
  const cleanRoute = route.endsWith("/") && route.length > 1 ? route.slice(0, -1) : route;

  if (!cleanRoute.startsWith("/health") && !cleanRoute.startsWith("/admin")) {
    logApiHit(cleanRoute || "/");
  }

  next();
};
