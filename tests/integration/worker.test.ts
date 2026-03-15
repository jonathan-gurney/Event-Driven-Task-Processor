import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/prisma.js";
import { runRetrySchedulerOnce } from "../../src/retry/retry-scheduler.js";
import { disconnectDatabase, resetDatabase } from "../helpers/test-db.js";

describe("task integration flow", () => {
  let app = buildApp();

  beforeEach(async () => {
    await resetDatabase();
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creating a task writes event log entries", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        type: "generate_report_mock",
        payload: {
          reportName: "weekly-sales"
        }
      }
    });
    const taskId = response.json().item.id as string;

    const eventLogs = await prisma.eventLog.findMany({
      where: {
        taskId: taskId
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    expect(eventLogs.map((eventLog) => eventLog.eventType)).toEqual([
      "task.created",
      "task.process_requested",
      "task.processing_started",
      "task.completed"
    ]);
  });

  it("failed tasks are retried until maxAttempts", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        type: "generate_report_mock",
        payload: {
          reportName: "weekly-sales",
          shouldFail: true
        }
      }
    });
    const taskId = response.json().item.id as string;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        scheduledAt: new Date(0)
      }
    });

    await runRetrySchedulerOnce();

    await prisma.task.update({
      where: { id: taskId },
      data: {
        scheduledAt: new Date(0)
      }
    });

    await runRetrySchedulerOnce();

    const reloadedTask = await prisma.task.findUniqueOrThrow({
      where: { id: taskId }
    });

    const eventLogs = await prisma.eventLog.findMany({
      where: {
        taskId: taskId
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    expect(reloadedTask.status).toBe("failed");
    expect(reloadedTask.attempts).toBe(3);
    expect(reloadedTask.maxAttempts).toBe(3);
    expect(reloadedTask.lastError).toContain("shouldFail");
    expect(eventLogs.filter((eventLog) => eventLog.eventType === "task.retry_scheduled")).toHaveLength(2);

    await prisma.task.update({
      where: { id: taskId },
      data: {
        scheduledAt: new Date(0)
      }
    });

    await runRetrySchedulerOnce();

    const finalTask = await prisma.task.findUniqueOrThrow({
      where: { id: taskId }
    });

    expect(finalTask.attempts).toBe(3);
  });
});
