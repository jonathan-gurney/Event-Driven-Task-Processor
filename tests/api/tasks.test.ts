import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/prisma.js";
import { disconnectDatabase, resetDatabase } from "../helpers/test-db.js";

describe("task API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("POST /tasks creates a task", async () => {
    const app = buildApp();

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

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      item: {
        id: expect.any(String),
        type: "generate_report_mock",
        reportName: "weekly-sales",
        status: "pending",
        attempts: 0,
        createdAt: expect.any(String),
        lastError: null
      }
    });

    const tasks = await prisma.task.findMany();
    expect(tasks).toHaveLength(1);

    await app.close();
  });

  it("GET /tasks/:id returns the fields used by the frontend", async () => {
    const app = buildApp();

    const createResponse = await app.inject({
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

    const taskId = createResponse.json().item.id as string;

    const response = await app.inject({
      method: "GET",
      url: `/tasks/${taskId}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      item: {
        id: taskId,
        type: "generate_report_mock",
        reportName: "weekly-sales",
        status: "failed",
        attempts: 1,
        createdAt: expect.any(String),
        lastError: expect.stringContaining("shouldFail")
      }
    });

    await app.close();
  });

  it("POST /tasks rejects an invalid payload", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        payload: {
          reportName: "weekly-sales"
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Invalid request payload"
    });

    await app.close();
  });
});
