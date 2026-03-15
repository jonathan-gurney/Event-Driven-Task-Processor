import type { FastifyPluginAsync } from "fastify";
import { ZodError } from "zod";

import {
  createTaskSchema,
  taskParamsSchema
} from "../../domain/tasks/task.schemas.js";
import {
  createTask,
  getTaskById,
  listTaskEvents,
  listRecentTasks
} from "../../domain/tasks/task.service.js";

// Task routes belong in the API layer so HTTP concerns stay outside domain logic.
export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const items = await listRecentTasks();

    return {
      items
    };
  });

  app.get("/:id", async (request, reply) => {
    try {
      const { id } = taskParamsSchema.parse(request.params);
      const task = await getTaskById(id);

      if (!task) {
        return reply.code(404).send({
          error: "Task not found"
        });
      }

      return {
        item: task
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error: "Invalid task id",
          details: error.flatten()
        });
      }

      throw error;
    }
  });

  app.get("/:id/events", async (request, reply) => {
    try {
      const { id } = taskParamsSchema.parse(request.params);
      const task = await getTaskById(id);

      if (!task) {
        return reply.code(404).send({
          error: "Task not found"
        });
      }

      const items = await listTaskEvents(id);

      return {
        items
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error: "Invalid task id",
          details: error.flatten()
        });
      }

      throw error;
    }
  });

  app.post("/", async (request, reply) => {
    try {
      const body = createTaskSchema.parse(request.body);
      const task = await createTask(body);

      return reply.code(201).send({
        item: task
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error: "Invalid request payload",
          details: error.flatten()
        });
      }

      throw error;
    }
  });
};
