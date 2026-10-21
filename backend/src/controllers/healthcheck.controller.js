import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { checkDockerAvailability } from "../modules/coding/sandbox/dockerExecutor.js";
import { env } from "../config/env.js";

export const healthcheck = async (_req, res) => {
  const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
  const dbStatus = isDbConnected ? "connected" : "disconnected";

  let dockerStatus = { available: false, reason: "Unavailable" };
  try {
    dockerStatus = await checkDockerAvailability();
  } catch (err) {
    dockerStatus = { available: false, reason: err.message };
  }

  const healthData = {
    status: "ok",
    application: "healthy",
    ready: isDbConnected,
    environment: env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        connected: isDbConnected,
        readyState: mongoose.connection?.readyState ?? 0,
      },
      dockerSandbox: {
        available: Boolean(dockerStatus.available),
        reason: dockerStatus.reason || null,
      },
      aiProvider: {
        configured: Boolean(env.GROQ_API_KEY),
        model: env.GROQ_MODEL || "openai/gpt-oss-120b",
      },
    },
  };

  res.status(200).json(new ApiResponse(200, healthData, "Service is healthy"));
};

/**
 * Process Liveness Probe (GET /api/v1/healthcheck/live)
 * Confirms the Node.js event loop and process are alive and accepting requests.
 */
export const livenessCheck = (_req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ok",
        liveness: "alive",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      "Application process is alive"
    )
  );
};

/**
 * Application Readiness Probe (GET /api/v1/healthcheck/ready)
 * Verifies core dependencies (MongoDB) are operational before routing traffic.
 */
export const readinessCheck = async (_req, res) => {
  const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

  if (!isDbConnected) {
    return res.status(503).json(
      new ApiResponse(
        503,
        {
          status: "degraded",
          ready: false,
          reason: "Database connection is not ready",
          services: {
            database: {
              status: "disconnected",
              connected: false,
              readyState: mongoose.connection?.readyState ?? 0,
            },
          },
          timestamp: new Date().toISOString(),
        },
        "Service is not ready: Database disconnected"
      )
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "ok",
        ready: true,
        services: {
          database: {
            status: "connected",
            connected: true,
            readyState: 1,
          },
        },
        timestamp: new Date().toISOString(),
      },
      "Service is ready to handle traffic"
    )
  );
};
