import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { taskRoutes } from "./api/routes/tasks.js";
import { setupTaskWorker } from "./worker/setup-worker.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true
  });

  setupTaskWorker();

  app.register(cors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"]
  });

  app.get("/", async () => {
    return {
      message: "Event-Driven Task Processor API",
      endpoints: [
        "GET /health",
        "GET /tasks",
        "POST /tasks",
        "GET /tasks/:id",
        "GET /tasks/:id/events"
      ]
    };
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  // Route registration stays centralized here so the HTTP surface is easy to scan.
  app.register(taskRoutes, { prefix: "/tasks" });

  return app;
}
