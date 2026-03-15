import { prisma } from "../../infrastructure/prisma.js";
import { eventBus } from "./event-bus.instance.js";
import type { InternalEvent } from "./event-bus.js";

export async function publishTaskEvent(
  type: string,
  taskId: string,
  payload: Record<string, unknown>
): Promise<InternalEvent> {
  const eventLog = await prisma.eventLog.create({
    data: {
      taskId,
      eventType: type,
      payloadJson: JSON.stringify(payload)
    }
  });

  const event: InternalEvent = {
    type,
    taskId,
    payload,
    occurredAt: eventLog.createdAt.toISOString()
  };

  await eventBus.publish(event);

  return event;
}
