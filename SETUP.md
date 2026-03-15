# Setup

## Prerequisites

- Docker
- Docker Compose

Optional for non-Docker workflows:

- Node.js 20+
- npm

## Install

Copy the environment template:

```bash
cp .env.example .env
```

The copied `.env` file is local-only and should not be committed. The local SQLite database file `prisma/dev.db` is also development-only and is intentionally ignored by Git.

Build and start the full stack:

```bash
docker compose up --build
```

This starts two containers:

- `app` for the Fastify backend on `http://localhost:3000`
- `frontend` for the React + Vite UI on `http://localhost:5173`

## Database setup

The project uses SQLite through Prisma.

The default environment value is:

```bash
DATABASE_URL="file:./dev.db"
```

That path resolves to the local development database used by Prisma. It is safe to keep locally, but it should not be published in a public repository.

If you need to regenerate the Prisma client:

```bash
docker compose exec app npx prisma generate
```

If you need to apply migrations:

```bash
docker compose exec app npx prisma migrate dev
```

## How to run locally

Recommended Docker workflow:

```bash
docker compose up --build
```

Check container status:

```bash
docker compose ps
```

Open the apps:

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:3000`

The backend CORS allowlist is currently limited to local Vite origins. If you publish the frontend under another host, update the backend CORS config before deploying.

Stop the stack:

```bash
docker compose down
```

Optional local Node.js workflow:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## How to run tests

Run the test suite in Docker:

```bash
docker compose exec app npm test
```

Or with a local Node.js environment:

```bash
npm test
```

The frontend does not currently include its own test setup.

## Useful demo commands

Create a task:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales"}}'
```

Create a failing task:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"generate_report_mock","payload":{"reportName":"weekly-sales","shouldFail":true}}'
```

Fetch task status:

```bash
curl http://localhost:3000/tasks/<task-id>
```

Fetch event history:

```bash
curl http://localhost:3000/tasks/<task-id>/events
```

Open the frontend UI:

```text
http://localhost:5173
```
