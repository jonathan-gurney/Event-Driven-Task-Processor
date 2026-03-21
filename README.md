# Event-Driven Task Processor

## Overview

This is a portfolio project I built to demonstrate some backend engineering concepts I find genuinely interesting — specifically around asynchronous processing and event-driven design. The stack is Node.js, TypeScript, Fastify, Prisma, and SQLite, with a React + Vite frontend to make the internal task lifecycle visible in the browser.

The idea was to build something small enough to actually understand end-to-end, but structured in a way that shows more than just basic CRUD. 

## Why this instead of another CRUD app

Most portfolio projects I've seen are variations on the same REST API — create, read, update, delete, done. This one goes a bit further. Tasks are accepted over HTTP, stored in a database, then processed asynchronously by a worker that subscribes to internal events. Failed tasks get retried automatically up to a configurable limit, and every step gets written to an event log so you can see exactly what happened and when.

The React frontend makes all of this visible without needing to curl anything.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

`.env`, `prisma/dev.db`, build output, and `node_modules` are all gitignored — the repo is safe to publish as-is.

Once it's running:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

## What it demonstrates

- Separating concerns between the API layer, domain events, worker logic, retry logic, and persistence
- Building HTTP APIs with Fastify and validating requests with Zod
- Relational persistence with Prisma and SQLite
- Representing async workflows with an explicit event log
- Writing practical tests for API, worker, and integration behavior with Vitest
- Packaging everything for local-first development with Docker

## Features

- `POST /tasks` — create a task
- `GET /tasks` — list recent tasks
- `GET /tasks/:id` — fetch task status
- `GET /tasks/:id/events` — inspect the full event history
- React dashboard for submitting tasks and viewing results
- In-process event bus for task orchestration
- Background worker that processes tasks asynchronously
- Retry scheduler for failed tasks, up to `maxAttempts`
- Event log persistence for visibility and debugging

## How it works

The API accepts a request and stores the task, but doesn't do the actual work itself. Instead, it emits `task.created`. The worker picks that up, converts it into `task.process_requested`, updates task state, and records either success or failure. A retry scheduler runs in the background and republishes `task.process_requested` for any failed tasks that still have attempts remaining.

The control flow is intentionally easy to trace:

1. Accept request
2. Persist task
3. Emit event
4. Process in worker
5. Record event history
6. Retry if eligible

## Example usage

Create a task:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}'
```

Create a task that deliberately fails (useful for seeing retry behaviour):

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales","shouldFail":true}}'
```

Fetch a task and its event history:

```bash
curl http://localhost:3000/tasks/<task-id>
curl http://localhost:3000/tasks/<task-id>/events
```

## Event lifecycle

A successful task looks like this:

```
task.created
task.process_requested
task.processing_started
task.completed
```

A failing task keeps retrying until it hits `maxAttempts`:

```
task.created
task.process_requested
task.processing_started
task.failed
task.retry_scheduled
task.process_requested
task.processing_started
task.failed
```

## Running it locally

```bash
# 1. Copy the env file
cp .env.example .env

# 2. Start everything
docker compose up --build

# 3. Check containers are running
docker compose ps

# 4. Open the apps
# Frontend: http://localhost:5173
# API:      http://localhost:3000

# 5. Stop when done
docker compose down
```

There's also a demo helper if you want to see it all in action quickly:

```bash
npm run demo
```

## Example output

```bash
$ curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}'

{"item":{"id":"cm8x...","type":"generate_report_mock","status":"pending","attempts":0,...}}
```

```bash
$ curl http://localhost:3000/tasks/cm8x.../events

{"items":[
  {"eventType":"task.created","createdAt":"..."},
  {"eventType":"task.process_requested","createdAt":"..."},
  {"eventType":"task.processing_started","createdAt":"..."},
  {"eventType":"task.completed","createdAt":"..."}
]}
```

## Frontend

The frontend is lightweight on purpose. It's there to make the system easy to demo, not to show off UI skills. The three pages are:

- `/` — task dashboard
- `/create` — submit a new task
- `/tasks/:id` — task details and event timeline

The detail page polls every two seconds until a task reaches `completed` or `failed`, which makes the async behaviour easy to watch in real time.

CORS is currently configured to allow `http://localhost:5173` and `http://127.0.0.1:5173`. If you deploy the frontend somewhere else, update the backend allowlist first.

## What I'd improve with more time

- Swap the in-process event bus for something like Redis, RabbitMQ, or Kafka
- Split the worker and API into separate deployable services
- Add exponential backoff to the retry logic
- Add task filtering, pagination, and event search
- Add metrics and structured tracing
- Support more task types beyond the mock report generator
- Serve the frontend as a static build behind the API or a reverse proxy
