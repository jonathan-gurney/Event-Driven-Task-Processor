import { prisma } from "../infrastructure/prisma.js";
import { publishTaskEvent } from "../domain/events/publish-event.js";

const RETRY_INTERVAL_MS = 5_000;

let retryTimer: NodeJS.Timeout | null = null;
let isRetryTickRunning = false;

export function startRetryScheduler(): void {
  if (retryTimer) {
    return;
  }

  // A small polling loop is enough for this local demo and keeps retries easy to follow.
  retryTimer = setInterval(() => {
    void runRetrySchedulerOnce();
  }, RETRY_INTERVAL_MS);

  retryTimer.unref();
}

export async function runRetrySchedulerOnce(): Promise<void> {
  if (isRetryTickRunning) {
    return;
  }

  isRetryTickRunning = true;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: "failed",
        scheduledAt: {
          lte: new Date()
        }
      }
    });

    for (const task of tasks.filter((item) => item.attempts < item.maxAttempts)) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "pending"
        }
      });

      await publishTaskEvent("task.retry_scheduled", task.id, {
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
        type: task.type
      });

      await publishTaskEvent("task.process_requested", task.id, {
        source: "task.retry_scheduled",
        type: task.type
      });
    }
  } finally {
    isRetryTickRunning = false;
  }
}
