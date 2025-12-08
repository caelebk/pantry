/**
 * Main application setup
 */

import { Hono } from "hono";
import { logger } from "./middleware/logger.ts";
import { cors } from "./middleware/cors.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import api from "./routes/index.ts";

const app = new Hono();

// Apply global middleware
app.use("*", cors);
app.use("*", logger);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    message: "Pantry API",
    version: "1.0.0",
    endpoints: {
      api: "/api",
      health: "/api/health",
    },
  });
});

// Mount API routes
app.route("/api", api);

// Error handling
app.onError(errorHandler);

export default app;
