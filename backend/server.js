import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { connectDB } from "./src/config/db.js";
import { logger } from "./src/config/logger.js";
import { logTwilioConfig } from "./src/config/twilio.js";
import { validateGroqConfig } from "./src/config/groq.js";
import { initializeAgent } from "./src/services/agentService.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import loanRoutes from "./src/routes/loanRoutes.js";
import debugRoutes from "./src/routes/debugRoutes.js";
import { SERVICE_NAME, SERVICE_VERSION } from "./src/utils/constants.js";

const PORT = process.env.PORT || 3001;

/**
 * Build and configure the Express application.
 * @returns {import('express').Express}
 */
export function createApp() {
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Meesho Pragati Agent API",
        version: SERVICE_VERSION,
        description:
          "AI-powered underwriting orchestration API for Meesho sellers",
      },
      servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ["./src/routes/*.js"],
  });

  const app = express();

  app.use(helmet());
  app.use(compression());

  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX) || 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later" },
    })
  );

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION });
  });

  app.use("/api/debug", debugRoutes);
  app.use("/api/loan", loanRoutes);
  app.use(errorHandler);

  return app;
}

const app = createApp();

/**
 * Bootstrap DB, agent, and HTTP listener.
 */
async function startServer() {
  try {
    // Validate Groq config first — fail fast with a clear message
    validateGroqConfig();

    await connectDB();
    initializeAgent();
    logTwilioConfig();

    app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} running`, {
        port: PORT,
        docs: `http://localhost:${PORT}/api-docs`,
      });
    });
  } catch (error) {
    logger.error("Server startup failed", { error: error.message });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
