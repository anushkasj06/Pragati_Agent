import mongoose from "mongoose";
import { logger } from "./logger.js";

/**
 * Connect to MongoDB with graceful error handling.
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/pragati_agent";

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected", { uri: uri.replace(/\/\/.*@/, "//***@") });
    return true;
  } catch (error) {
    logger.warn("MongoDB connection unavailable; continuing without persistence", {
      error: error.message,
      uri: uri.replace(/\/\/.*@/, "//***@"),
    });
    return false;
  }
}

/**
 * Disconnect from MongoDB (used in tests / shutdown).
 */
export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
