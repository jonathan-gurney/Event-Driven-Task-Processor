import type { CreateTaskInput, Task, TaskEvent } from "../types/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type TasksResponse = {
  items: Task[];
};

type TaskResponse = {
  item: Task;
};

type TaskEventsResponse = {
  items: TaskEvent[];
};

type ApiErrorResponse = {
  error?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function getApiErrorMessage(response: Response): Promise<string> {
  const fallbackMessage = `Request failed with status ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as ApiErrorResponse;
    return data.error || fallbackMessage;
  }

  const text = await response.text();
  return text || fallbackMessage;
}

export async function getTasks(): Promise<Task[]> {
  const response = await request<TasksResponse>("/tasks");
  return response.items;
}

export async function getTask(id: string): Promise<Task> {
  const response = await request<TaskResponse>(`/tasks/${id}`);
  return response.item;
}

export async function getTaskEvents(id: string): Promise<TaskEvent[]> {
  const response = await request<TaskEventsResponse>(`/tasks/${id}/events`);
  return response.items;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const response = await request<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(data)
  });

  return response.item;
}
