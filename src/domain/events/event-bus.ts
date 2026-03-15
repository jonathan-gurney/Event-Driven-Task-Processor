export type InternalEvent = {
  type: string;
  taskId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type EventHandler = (event: InternalEvent) => Promise<void> | void;

// This in-process event bus keeps the demo lightweight; a larger system could swap it
// for Redis, RabbitMQ, or Kafka without changing the API layer contract.
export class EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    const currentHandlers = this.handlers.get(eventType) ?? [];
    currentHandlers.push(handler);
    this.handlers.set(eventType, currentHandlers);
  }

  async publish(event: InternalEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}
