# AI Ecommerce

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### Step 1 — Install dependencies

```bash
npm install
```

---

### Step 2 — Start infrastructure

```bash
npm run infra:up
```

Starts PostgreSQL, Redis, and MinIO via Docker. Wait a few seconds for containers to become healthy.

---

### Step 3 — Run database migration

```bash
npm run api:prisma:migrate:dev
```

---

### Step 4 — Create storage bucket

```bash
node scripts/setup-garage.js
```

---

### Step 5 — Start the apps

```bash
npm run dev
```

This starts all three apps together:
- **Web** → http://localhost:3000
- **Admin** → http://localhost:3001
- **API** → http://localhost:3002

---

### Step 6 — Check health

Visit http://localhost:3002/health

Expected response:

```json
{
  "status": "ok",
  "postgres": true,
  "redis": true,
  "garage": true,
  "databaseUrlConfigured": true,
  "redisUrlConfigured": true,
  "garageConfigured": true,
  "database": {
    "tableCount": 1,
    "tables": [
      "_prisma_migrations"
    ]
  },
  "timestamp": "2026-05-10T10:07:00.157Z"
}
```

If all values are `true` and `status` is `ok` — the stack is fully running.

---

## Infrastructure Commands

| Command | Description |
|---|---|
| `npm run infra:up` | Start PostgreSQL, Redis, and MinIO |
| `npm run infra:down` | Stop containers (preserves data) |
| `npm run infra:logs` | Stream container logs |
| `npm run infra:reset` | Stop containers and wipe all data |

## Prisma Commands

| Command | Description |
|---|---|
| `npm run api:prisma:migrate:dev` | Create and apply a new migration |
| `npm run studio` | Open Prisma Studio (database GUI) |
