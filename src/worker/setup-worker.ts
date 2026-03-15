import { eventBus } from "../domain/events/event-bus.instance.js";
import { publishTaskEvent } from "../domain/events/publish-event.js";
import { processTask } from "./process-task.js";
import { startRetryScheduler } from "../retry/retry-scheduler.js";

let isTaskWorkerRegistered = false;

export function setupTaskWorker(): void {
  if (isTaskWorkerRegistered) {
    return;
  }

  eventBus.subscribe("task.created", async (event) => {
    await publishTaskEvent("task.process_requested", event.taskId, {
      source: "task.created",
      ...event.payload
    });
  });

  eventBus.subscribe("task.process_requested", async (event) => {
    await processTask(event);
  });

  startRetryScheduler();
  isTaskWorkerRegistered = true;
}
