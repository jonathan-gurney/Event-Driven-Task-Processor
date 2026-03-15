# Architecture

## Components

The system is intentionally small, but each piece has a clear responsibility.

- API layer:
  Fastify routes accept requests, validate payloads, and delegate to service functions.
- Task service:
  Creates tasks, reads task state, and exposes event history queries.
- Event bus:
  A lightweight in-process publish/subscribe mechanism used to decouple API actions from background work.
- Worker:
  Subscribes to task-processing events, performs task work, and updates task state.
- Retry scheduler:
  Periodically checks failed tasks that are eligible for another attempt and republishes processing requests.
- Persistence:
  Prisma with SQLite stores tasks and event logs.

## System components by folder

- `src/api/routes`
- `src/domain/tasks`
- `src/domain/events`
- `src/worker`
- `src/retry`
- `src/infrastructure`

## Request flow

The request flow for `POST /tasks` is:

1. Fastify receives a task request.
2. Zod validates the incoming payload.
3. The task service writes a `Task` record to SQLite.
4. The task service writes a `task.created` event log.
5. The internal event bus publishes `task.created`.
6. The API returns immediately with the created task summary.

The important design choice is that the API does not execute task work inline.

## Event flow

The event-driven lifecycle is explicit and observable through `EventLog`.

Normal success path:

1. `task.created`
2. `task.process_requested`
3. `task.processing_started`
4. `task.completed`

Failure path:

1. `task.created`
2. `task.process_requested`
3. `task.processing_started`
4. `task.failed`
5. `task.retry_scheduled`
6. `task.process_requested`

This model keeps task creation separate from task execution, which makes retries easier to reason about.

## Retry flow

Retries are handled locally with a polling scheduler.

1. The worker marks a task as `failed` and increments `attempts`.
2. The retry policy computes when the next attempt should be eligible.
3. The scheduler periodically checks for failed tasks whose `scheduledAt` is due.
4. If `attempts < maxAttempts`, it writes `task.retry_scheduled`.
5. The scheduler republishes `task.process_requested`.
6. Once `attempts >= maxAttempts`, no further retries are scheduled.

Completed tasks are never retried.

## Trade-offs

- In-process event bus:
  Simple, dependency-free, and ideal for a local-first portfolio demo. It is not durable across process restarts.
- SQLite:
  Great for local development and demonstration, but not intended for highly concurrent distributed workloads.
- Polling retry scheduler:
  Easy to understand and test, but less efficient than a true queue with delayed delivery.
- Single-process execution:
  Keeps setup friction low, but does not model horizontal scaling or independent worker deployment.

## Why the in-memory bus was chosen

The in-memory event bus was chosen to demonstrate architectural intent without introducing operational overhead. For a portfolio project, that trade-off is useful: it shows event-driven thinking, background processing, and loose coupling while keeping the repository easy to run on a laptop.

This project is not pretending to be Kafka-backed production infrastructure. It is deliberately showing the shape of the system with the smallest practical implementation.

## How this could scale further

- Replace the event bus with Redis, RabbitMQ, or Kafka
- Run API and worker as separate services
- Move retry scheduling into queue-native delayed jobs
- Add idempotency protections for duplicate events
- Add dead-letter handling for permanently failed tasks
- Add metrics, dashboards, and distributed tracing
- Add authentication and rate limiting for public-facing API usage
