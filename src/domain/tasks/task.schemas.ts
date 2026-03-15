import { z } from "zod";

export const createTaskSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.string(), z.unknown())
});

export const taskParamsSchema = z.object({
  id: z.string().min(1)
});

export const taskResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  reportName: z.string().nullable(),
  status: z.string(),
  attempts: z.number().int(),
  createdAt: z.string(),
  lastError: z.string().nullable()
});

export const taskEventResponseSchema = z.object({
  eventType: z.string(),
  createdAt: z.string(),
  payloadJson: z.string()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type TaskEventResponse = z.infer<typeof taskEventResponseSchema>;
