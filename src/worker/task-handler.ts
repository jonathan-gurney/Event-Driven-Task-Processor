type GenerateReportMockPayload = {
  reportName?: string;
  shouldFail?: boolean;
};

export async function runTaskHandler(taskType: string, payload: Record<string, unknown>): Promise<void> {
  if (taskType !== "generate_report_mock") {
    throw new Error(`Unsupported task type: ${taskType}`);
  }

  await runGenerateReportMock(payload as GenerateReportMockPayload);
}

async function runGenerateReportMock(payload: GenerateReportMockPayload): Promise<void> {
  if (payload.shouldFail === true) {
    throw new Error("Mock task failed because payload.shouldFail was true");
  }

  // Simulate a small async task without hiding the control flow.
  await Promise.resolve({
    reportName: payload.reportName ?? "unnamed-report"
  });
}
