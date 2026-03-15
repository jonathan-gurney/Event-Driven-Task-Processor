# Event-Driven Task Processor

## Overview

Event-Driven Task Processor is a small backend portfolio project built with Node.js, TypeScript, Fastify, Prisma, and SQLite. It accepts tasks over HTTP, records them in a database, emits internal events, processes work asynchronously, retries failures, and exposes task history through an event log endpoint.

The repository now includes a small React + Vite frontend for visualising tasks and event lifecycles in the browser.

The goal is to demonstrate solid backend engineering fundamentals in a project that is easy to understand, run locally, and talk through in an interview.

## Why it stands out

This is intentionally a "small but serious" system. Instead of only showing CRUD endpoints, it demonstrates asynchronous processing, explicit event history, retry behavior, and a UI that makes the internal lifecycle visible. That makes it easier to discuss system design tradeoffs in a portfolio review or interview.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

`.env`, `prisma/dev.db`, build output, and `node_modules` are local-only files and are intentionally ignored by Git so the repository stays safe to publish.

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## Why this project exists

This project exists to show how a simple service can be structured around event-driven concepts without requiring production-scale infrastructure. It focuses on architecture, separation of concerns, and operational clarity rather than complexity for its own sake.

## Skills demonstrated

- Designing a small event-driven backend with clear boundaries between API, domain events, worker logic, retry logic, and persistence.
- Building HTTP APIs with Fastify and validating requests with Zod.
- Modeling relational persistence with Prisma and SQLite.
- Representing asynchronous workflows with event logs and explicit lifecycle events.
- Writing practical tests for API, worker, and integration behavior with Vitest.
- Packaging a project for local-first development using Docker.

## Features

- `POST /tasks` to create a task
- `GET /tasks` to list recent tasks
- `GET /tasks/:id` to fetch task status
- `GET /tasks/:id/events` to inspect the full event history
- React dashboard for creating tasks and viewing task history
- In-process event bus for task orchestration
- Background worker that processes tasks asynchronously
- Retry scheduler for failed tasks up to `maxAttempts`
- Event log persistence for demo visibility and debugging

## Architecture summary

The API layer accepts requests and stores tasks, but it does not perform the work directly. Instead, it emits `task.created`. The worker subscribes to internal events, converts creation into `task.process_requested`, updates task state as work begins, and records success or failure outcomes. A local retry scheduler periodically looks for failed tasks that still have attempts remaining and republishes `task.process_requested`.

This keeps the control flow easy to explain:

1. Accept request
2. Persist task
3. Emit event
4. Process in worker
5. Record event history
6. Retry if eligible

## Example API usage

Create a task:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}'
```

Create a task that fails and triggers retries:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales","shouldFail":true}}'
```

Fetch task details:

```bash
curl http://localhost:3000/tasks/<task-id>
```

Fetch task event history:

```bash
curl http://localhost:3000/tasks/<task-id>/events
```

## Example event lifecycle

A successful task typically produces this sequence:

```text
task.created
task.process_requested
task.processing_started
task.completed
```

A failing task produces retries until `maxAttempts` is reached:

```text
task.created
task.process_requested
task.processing_started
task.failed
task.retry_scheduled
task.process_requested
task.processing_started
task.failed
```

## Local run instructions

1. Copy the environment file:

```bash
cp .env.example .env
```

The copied `.env` file is for local use only and should not be committed. The same applies to the local SQLite database at `prisma/dev.db`.

2. Start the backend and frontend in Docker:

```bash
docker compose up --build
```

3. Confirm both containers are running:

```bash
docker compose ps
```

4. Open the apps:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

5. Stop the stack when you are finished:

```bash
docker compose down
```

You can also run the bundled demo helper:

```bash
npm run demo
```

## Example terminal output

```text
$ curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}'

{"item":{"id":"cm8x...","type":"generate_report_mock","reportName":"weekly-sales","status":"pending","attempts":0,"createdAt":"2026-03-14T18:00:00.000Z","lastError":null}}
```

```text
$ curl http://localhost:3000/tasks/cm8x.../events

{"items":[
  {"eventType":"task.created","createdAt":"2026-03-14T18:00:00.000Z","payloadJson":"{\"type\":\"generate_report_mock\",\"payload\":{\"reportName\":\"weekly-sales\"}}"},
  {"eventType":"task.process_requested","createdAt":"2026-03-14T18:00:00.001Z","payloadJson":"{\"source\":\"task.created\",\"type\":\"generate_report_mock\",\"payload\":{\"reportName\":\"weekly-sales\"}}"},
  {"eventType":"task.processing_started","createdAt":"2026-03-14T18:00:00.002Z","payloadJson":"{\"type\":\"generate_report_mock\"}"},
  {"eventType":"task.completed","createdAt":"2026-03-14T18:00:00.003Z","payloadJson":"{\"type\":\"generate_report_mock\"}"}
]}
```

## Frontend overview

The frontend is intentionally lightweight, but it is designed to help a reviewer understand the system quickly:

- `/` shows the task dashboard
- `/create` submits a new mock task
- `/tasks/:id` shows task details and the event timeline

The dashboard highlights the stack and request flow at a glance, and the UI polls task details every two seconds until the task reaches `completed` or `failed`, which makes the async flow easy to demo.

For local development, the API currently allows CORS from `http://localhost:5173` and `http://127.0.0.1:5173`. If you deploy the frontend elsewhere, update the backend CORS allowlist first.

## Future improvements

- Replace the in-process event bus with Redis, RabbitMQ, or Kafka
- Move worker and API into separate deployable services
- Add exponential backoff and richer retry policies
- Add task filtering, pagination, and event search
- Add metrics, structured tracing, and better operational visibility
- Support more task types beyond the mock report generator
- Serve the frontend as a static production build behind the API or a reverse proxy
