import { prisma } from "../../infrastructure/prisma.js";
import { publishTaskEvent } from "../events/publish-event.js";
import type { TaskEventResponse, TaskResponse } from "./task.schemas.js";

function toTaskResponse(task: {
  id: string;
  type: string;
  payloadJson: string;
  status: string;
  attempts: number;
  createdAt: Date;
  lastError: string | null;
}): TaskResponse {
  const payload = JSON.parse(task.payloadJson) as { reportName?: unknown };

  return {
    id: task.id,
    type: task.type,
    reportName: typeof payload.reportName === "string" ? payload.reportName : null,
    status: task.status,
    attempts: task.attempts,
    createdAt: task.createdAt.toISOString(),
    lastError: task.lastError
  };
}

export async function createTask(input: {
  type: string;
  payload: Record<string, unknown>;
}): Promise<TaskResponse> {
  const payloadJson = JSON.stringify(input.payload);

  const task = await prisma.task.create({
    data: {
      type: input.type,
      payloadJson,
      status: "pending",
      attempts: 0,
      maxAttempts: 3
    }
  });

  await publishTaskEvent("task.created", task.id, {
    type: task.type,
    payload: input.payload
  });

  return toTaskResponse(task);
}

export async function getTaskById(id: string): Promise<TaskResponse | null> {
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      payloadJson: true,
      status: true,
      attempts: true,
      createdAt: true,
      lastError: true
    }
  });

  return task ? toTaskResponse(task) : null;
}

export async function listRecentTasks(limit = 20): Promise<TaskResponse[]> {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: limit,
    select: {
      id: true,
      type: true,
      payloadJson: true,
      status: true,
      attempts: true,
      createdAt: true,
      lastError: true
    }
  });

  return tasks.map(toTaskResponse);
}

export async function listTaskEvents(taskId: string): Promise<TaskEventResponse[]> {
  const eventLogs = await prisma.eventLog.findMany({
    where: {
      taskId
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      eventType: true,
      createdAt: true,
      payloadJson: true
    }
  });

  return eventLogs.map((eventLog) => ({
    eventType: eventLog.eventType,
    createdAt: eventLog.createdAt.toISOString(),
    payloadJson: eventLog.payloadJson
  }));
}
