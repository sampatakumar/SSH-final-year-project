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
