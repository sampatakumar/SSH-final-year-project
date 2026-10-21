import mongoose from "mongoose";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./core/database/db.js";

let server = null;
let isShuttingDown = false;

/**
 * Graceful application shutdown handler.
 * Closes HTTP server, drains in-flight requests, and disconnects MongoDB.
 */
export const shutdown = async (signal = "SIGTERM", exitProcess = true) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.info(`[Shutdown] Received ${signal}. Commencing graceful resource teardown...`);

  // 1. Close HTTP server and reject new incoming connections
  if (server) {
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn("[Shutdown] HTTP server close timed out (10s), forcing termination.");
        resolve();
      }, 10000);

      server.close((err) => {
        clearTimeout(timer);
        if (err) {
          console.error("[Shutdown] HTTP server closure error:", err.message);
        } else {
          console.info("[Shutdown] HTTP server closed gracefully.");
        }
        resolve();
      });
    });
  }

  // 2. Disconnect MongoDB connection cleanly
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.info("[Shutdown] MongoDB connection closed.");
    } catch (err) {
      console.error("[Shutdown] MongoDB disconnection error:", err.message);
    }
  }

  console.info("[Shutdown] Graceful resource teardown complete.");

  if (exitProcess && process.env.NODE_ENV !== "test") {
    process.exit(0);
  }
};

/**
 * Start the HTTP backend server.
 */
export const startServer = async () => {
  try {
    await connectDB();

    return new Promise((resolve) => {
      server = app.listen(env.PORT, () => {
        console.log(`[Startup] Smart Skill Hub Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        resolve({ server, shutdown });
      });
    });
  } catch (error) {
    console.error("[Startup] Failed to start backend:", error.message || error);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
};

// Signal listeners for container and orchestrator lifecycles
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason?.message || reason);
  shutdown("unhandledRejection", true);
});

process.on("uncaughtException", (error) => {
  console.error("[UncaughtException]", error?.message || error);
  shutdown("uncaughtException", true);
});

const isDirectRun = Boolean(
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/")))
);

if (isDirectRun && process.env.NODE_ENV !== "test") {
  startServer();
}

export { server };
