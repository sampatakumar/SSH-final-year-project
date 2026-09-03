import rateLimit from "express-rate-limit";
import { ApiError } from "../errors/ApiError.js";

/**
 * Rate limiter for sending verification emails
 * Limit to 5 requests per 15 minutes per IP
 */
export const verificationEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next) => {
    throw new ApiError(
      429,
      "Too many verification email requests. Please wait a few minutes before trying again."
    );
  },
});

/**
 * Rate limiter for sending password reset emails
 * Limit to 5 requests per 15 minutes per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next) => {
    throw new ApiError(
      429,
      "Too many password reset requests. Please wait a few minutes before trying again."
    );
  },
});
