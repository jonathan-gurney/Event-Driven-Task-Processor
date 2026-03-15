export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export type Task = {
  id: string;
  type: string;
  reportName: string | null;
  status: TaskStatus;
  attempts: number;
  createdAt: string;
  lastError: string | null;
};

export type TaskEvent = {
  eventType: string;
  createdAt: string;
  payloadJson: string;
};

export type CreateTaskInput = {
  type: "generate_report_mock";
  payload: {
    reportName: string;
    shouldFail: boolean;
  };
};
