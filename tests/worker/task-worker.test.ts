import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../src/infrastructure/prisma.js";
import { processTask } from "../../src/worker/process-task.js";
import { disconnectDatabase, resetDatabase } from "../helpers/test-db.js";

describe("task worker", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("processes a successful task to completion", async () => {
    const task = await prisma.task.create({
      data: {
        type: "generate_report_mock",
        payloadJson: JSON.stringify({
          reportName: "weekly-sales"
        }),
        status: "pending"
      }
    });

    await processTask({
      type: "task.process_requested",
      taskId: task.id,
      payload: {
        source: "test"
      },
      occurredAt: new Date().toISOString()
    });

    const savedTask = await prisma.task.findUniqueOrThrow({
      where: { id: task.id }
    });

    expect(savedTask.status).toBe("completed");
    expect(savedTask.attempts).toBe(0);
    expect(savedTask.lastError).toBeNull();
  });

  it("marks a failed task correctly", async () => {
    const task = await prisma.task.create({
      data: {
        type: "generate_report_mock",
        payloadJson: JSON.stringify({
          reportName: "weekly-sales",
          shouldFail: true
        }),
        status: "pending",
        attempts: 0,
        maxAttempts: 3
      }
    });

    await processTask({
      type: "task.process_requested",
      taskId: task.id,
      payload: {
        source: "test"
      },
      occurredAt: new Date().toISOString()
    });

    const savedTask = await prisma.task.findUniqueOrThrow({
      where: { id: task.id }
    });

    const failedEvent = await prisma.eventLog.findFirstOrThrow({
      where: {
        taskId: task.id,
        eventType: "task.failed"
      }
    });

    expect(savedTask.status).toBe("failed");
    expect(savedTask.attempts).toBe(1);
    expect(savedTask.lastError).toContain("shouldFail");
    expect(failedEvent.payloadJson).toContain("shouldFail");
  });
});
