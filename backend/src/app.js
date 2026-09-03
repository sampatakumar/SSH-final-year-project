import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { globalErrorHandler, notFoundHandler } from "./core/errors/errorHandler.js";

import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./core/auth/auth.routes.js";
import aiRouter from "./modules/resume/routes/ai.routes.js";
import resumeRouter from "./modules/resume/routes/resume.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import projectRouter from "./modules/resume/routes/project.routes.js";
import portfolioRouter from "./modules/resume/routes/portfolio.routes.js";
import adminRouter from "./routes/admin.routes.js";
import codingRouter from "./modules/coding/routes/coding.routes.js";
import githubRouter from "./modules/github/routes/github.routes.js";
import skillsRouter from "./modules/skills/routes/skills.routes.js";
import gapsRouter from "./modules/gaps/routes/gaps.routes.js";
import recommendationsRouter from "./modules/recommendations/routes/recommendations.routes.js";
import edutubeRouter from "./modules/edutube/routes/edutube.routes.js";
import mentorRouter from "./modules/mentor/routes/smartMentor.routes.js";
import settingsRouter from "./modules/settings/routes/settings.routes.js";
import integrationsRouter from "./modules/settings/routes/integrations.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import { handleGitHubCallback } from "./modules/settings/controllers/integrations.controller.js";
import { apiHitTracker } from "./core/middleware/analytics.middleware.js";
import { incrementDailyCounter } from "./core/database/models/analytics.models.js";

const app = express();
const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const allowedOrigins = Array.from(
  new Set(
    String(env.CORS_ORIGIN || "")
      .split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean)
  )
);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);

  if (allowedOrigins.includes("*") || allowedOrigins.includes(normalized)) {
    return true;
  }

  // Automatically allow Vercel frontend deployments and local dev servers
  if (
    /\.vercel\.app$/i.test(normalized) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)
  ) {
    return true;
  }

  return false;
};

const defaultCspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();

app.use(
  helmet({
    // Allow the frontend app origin to embed PDF files served by this backend.
    contentSecurityPolicy: {
      directives: {
        ...defaultCspDirectives,
        "frame-ancestors": ["'self'", "*"]
      }
    },
    xFrameOptions: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(apiHitTracker);

// Root & API base keep-alive — no auth, no rate-limit (placed before apiLimiter)
app.get(["/", env.API_PREFIX], (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ResumeAI API Backend is running",
    healthCheck: `${env.API_PREFIX}/healthcheck`,
    timestamp: new Date().toISOString()
  });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    incrementDailyCounter("rateLimitHits", 1);
    res.status(options.statusCode).send(options.message);
  }
});

app.use(env.API_PREFIX, apiLimiter);

app.use(`${env.API_PREFIX}/healthcheck`, healthcheckRouter);
app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/ai`, aiRouter);
app.use(`${env.API_PREFIX}/resumes`, resumeRouter);
app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);
app.use(`${env.API_PREFIX}/projects`, projectRouter);
app.use(`${env.API_PREFIX}/coding`, codingRouter);
app.use(`${env.API_PREFIX}/github`, githubRouter);
app.use(`${env.API_PREFIX}/skills`, skillsRouter);
app.use(`${env.API_PREFIX}/gaps`, gapsRouter);
app.use(`${env.API_PREFIX}/recommendations`, recommendationsRouter);
app.use(`${env.API_PREFIX}/edutube`, edutubeRouter);
app.use(`${env.API_PREFIX}/mentor`, mentorRouter);
app.use(`${env.API_PREFIX}/settings`, settingsRouter);
app.use(`${env.API_PREFIX}/integrations`, integrationsRouter);
app.use(`${env.API_PREFIX}/analytics`, analyticsRouter);
app.use(`${env.API_PREFIX}/admin`, adminRouter);
app.use(`${env.API_PREFIX}/portfolio`, portfolioRouter);
app.use("/portfolio", portfolioRouter);

// Root callback alias for Render deployment: https://smart-skill-backend-3mlz.onrender.com/github/callback
app.get("/github/callback", handleGitHubCallback);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export { app };
