import { verifyFirebaseToken } from "../auth/auth.middleware.js";
import { ApiError } from "../errors/ApiError.js";

export const ensureAdmin = (req, res, next) => {
  const checkAdminPrivilege = () => {
    const adminEmail = process.env.ADMIN_EMAIL || "sampatakumarsv@gmail.com";
    const isRoleAdmin = req.user?.role === "admin" || req.auth?.email === adminEmail;

    if (!isRoleAdmin) {
      return next(new ApiError(403, "Access Denied: Administrator privilege required."));
    }

    next();
  };

  if (req.user || req.auth) {
    return checkAdminPrivilege();
  }

  verifyFirebaseToken(req, res, (error) => {
    if (error) return next(error);
    checkAdminPrivilege();
  });
};
