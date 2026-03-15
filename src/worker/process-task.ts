import { prisma } from "../infrastructure/prisma.js";
import type { InternalEvent } from "../domain/events/event-bus.js";
import { publishTaskEvent } from "../domain/events/publish-event.js";
import { getRetryDecision } from "../retry/retry-policy.js";
import { runTaskHandler } from "./task-handler.js";

export async function processTask(event: InternalEvent): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: event.taskId }
  });

  if (!task) {
    throw new Error(`Task not found for event ${event.taskId}`);
  }

  if (task.status === "completed" || task.status === "processing") {
    return;
  }

  const payload = JSON.parse(task.payloadJson) as Record<string, unknown>;

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status: "processing",
      scheduledAt: new Date()
    }
  });

  await publishTaskEvent("task.processing_started", task.id, {
    type: task.type
  });

  try {
    await runTaskHandler(task.type, payload);

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "completed",
        lastError: null,
        scheduledAt: new Date()
      }
    });

    await publishTaskEvent("task.completed", task.id, {
      type: task.type
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown task processing error";
    const retryDecision = getRetryDecision(task.attempts + 1, task.maxAttempts);
    const nextAttemptAt = new Date(Date.now() + retryDecision.nextAttemptInMs);

    const failedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "failed",
        attempts: {
          increment: 1
        },
        lastError: message,
        scheduledAt: nextAttemptAt
      }
    });

    await publishTaskEvent("task.failed", failedTask.id, {
      type: failedTask.type,
      error: message,
      attempts: failedTask.attempts
    });
  }
}
