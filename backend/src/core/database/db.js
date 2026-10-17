import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { DB_NAME } from "../../constants/index.js";

const resolveMongoUri = (mongoUri, dbName) => {
  const normalizedUri = String(mongoUri || "").trim();

  if (!normalizedUri) {
    return normalizedUri;
  }

  try {
    const parsed = new URL(normalizedUri);
    const hasDatabasePath = parsed.pathname && parsed.pathname !== "/";

    if (hasDatabasePath) {
      return normalizedUri;
    }

    parsed.pathname = `/${dbName}`;
    return parsed.toString();
  } catch {
    return /\/[^/?]+(?:\?|$)/.test(normalizedUri)
      ? normalizedUri
      : `${normalizedUri.replace(/\/+$/, "")}/${dbName}`;
  }
};

let isListenersAttached = false;

export const attachDbConnectionListeners = () => {
  if (isListenersAttached) return;

  mongoose.connection.on("error", (err) => {
    console.error(`[CORE Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[CORE Database] MongoDB disconnected. Awaiting reconnection...");
  });

  mongoose.connection.on("reconnected", () => {
    console.info("[CORE Database] MongoDB reconnected successfully.");
  });

  isListenersAttached = true;
};

attachDbConnectionListeners();

export const connectDB = async () => {
  attachDbConnectionListeners();
  const resolvedMongoUri = resolveMongoUri(env.MONGODB_URI, DB_NAME);
  const connection = await mongoose.connect(resolvedMongoUri);
  console.log(`[CORE Database] MongoDB connected to host: ${connection.connection.host}`);
  return connection;
};

export default connectDB;
