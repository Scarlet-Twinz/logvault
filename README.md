# LogVault

**Real-time event intelligence, log analytics, and anomaly detection platform.**

**Repository:** https://github.com/Scarlet-Twinz/logvault

LogVault is an event-driven observability system designed to ingest application events, process them asynchronously, aggregate operational metrics, detect abnormal error-rate behavior, and stream insights to a real-time dashboard.

It demonstrates how modern backend systems can combine **Fastify, Redis, BullMQ, PostgreSQL, Prisma, Socket.IO, and Next.js** into a production-oriented event-processing pipeline.

---

## Architecture

```text
Event Producers
      │
      ▼
 Fastify API
      │
      ▼
Redis + BullMQ
      │
      ▼
Background Worker
   ┌──┴───────────┐
   ▼              ▼
PostgreSQL   Anomaly Detection
   │              │
   └──────┬───────┘
          ▼
      Socket.IO
          │
          ▼
     Next.js UI
```

---

## Features

### Event ingestion

- REST API for application events
- Zod request validation
- `INFO`, `WARN`, `ERROR`, and `DEBUG` levels
- Optional timestamps, sources, and metadata
- Asynchronous processing through BullMQ

### Asynchronous processing

- Redis-backed BullMQ queue
- Dedicated background worker
- Configurable worker concurrency
- Failed-job handling and graceful shutdown

### Event analytics

- Total event volume
- Error and warning counts
- Service-level metrics
- Hourly metric windows
- Error-rate statistics

### Anomaly detection

The worker compares a service's current error rate against a historical baseline and produces severity levels such as `MEDIUM`, `HIGH`, and `CRITICAL` when abnormal behavior is detected.

### Real-time dashboard

The Next.js dashboard provides live event statistics, event streams, detected anomalies, service information, and Socket.IO updates.

### Event simulator

The included simulator generates application traffic and controlled traffic spikes for demonstrating anomaly detection.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React |
| API | Fastify |
| Validation | Zod |
| Queue | BullMQ |
| Message Broker | Redis |
| Database | PostgreSQL |
| ORM | Prisma |
| Realtime | Socket.IO |
| Monorepo | Turborepo |
| Package Manager | pnpm |
| Testing | Vitest |
| Infrastructure | Docker Compose |
| Language | TypeScript |

---

## Project Structure

```text
logvault/
├── apps/
│   ├── api/
│   ├── simulator/
│   ├── web/
│   └── worker/
├── packages/
│   ├── db/
│   └── shared/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

Install:

- Node.js
- pnpm
- Docker Desktop

### 1. Clone the repository

```bash
git clone https://github.com/Scarlet-Twinz/logvault.git
cd logvault
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d
```

Development services use:

```text
PostgreSQL → localhost:5434
Redis      → localhost:6380
```

### 4. Configure the database

Create `packages/db/.env`:

```env
DATABASE_URL="postgresql://logvault:logvault@localhost:5434/logvault?schema=public"
REDIS_URL="redis://localhost:6380"
```

### 5. Generate Prisma Client

```bash
pnpm --filter @logvault/db generate
```

### 6. Run database migrations

```bash
pnpm --filter @logvault/db exec prisma migrate dev
```

### 7. Start the API

```bash
pnpm --filter @logvault/api dev
```

API:

```text
http://localhost:4000
```

### 8. Start the worker

In another terminal:

```bash
pnpm --filter @logvault/worker dev
```

### 9. Start the dashboard

In another terminal:

```bash
pnpm --filter @logvault/web dev
```

Dashboard:

```text
http://localhost:3000
```

### 10. Start the simulator

In another terminal:

```bash
pnpm --filter @logvault/simulator dev
```

---

## API

### Health

```http
GET /health
```

### Submit an event

```http
POST /events
Content-Type: application/json
```

Example:

```json
{
  "service": "payments",
  "level": "ERROR",
  "message": "Payment processing failed",
  "source": "payment-service",
  "metadata": {
    "provider": "stripe",
    "operation": "charge"
  }
}
```

### Query events

```http
GET /events
```

### Query metrics

```http
GET /metrics
```

### Query anomalies

```http
GET /anomalies
```

---

## Testing

API tests:

```bash
pnpm --filter @logvault/api test
```

Worker tests:

```bash
pnpm --filter @logvault/worker test
```

---

## Build

```bash
pnpm build
```

---

## Reliability

LogVault demonstrates several reliability-oriented patterns:

- Asynchronous event processing
- Queue-based workload isolation
- Worker concurrency control
- Request validation
- Database indexes and constraints
- Worker failure handling
- Graceful worker shutdown
- Socket reconnection
- Bounded API queries

---

## Deployment

The project is configured for deployment, but a public hosted URL is not currently provided. Follow the local development instructions to run the complete system.

---

## Why LogVault?

LogVault was built as a practical demonstration of backend and distributed-systems engineering rather than a simple CRUD application.

It focuses on event-driven architecture, asynchronous processing, observability, realtime communication, statistical anomaly detection, database design, automated testing, and monorepo architecture.

---

## License

This project is intended as a portfolio and learning project.

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack developer focused on frontend engineering, backend systems, APIs, automation, and practical software architecture.

**GitHub:** https://github.com/Scarlet-Twinz
