export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Task = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  createdAt: string;
};
