#  LOGVAULT

**Real-time event intelligence, log analytics, and anomaly detection platform.**

LOGVAULT is an event-driven observability system built around a simple pipeline: ingest events, move processing off the request path, derive operational metrics, detect abnormal error-rate behavior, and stream the resulting state to a live dashboard.

## System Flow

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
   ┌──┴─────────────┐
   ▼                ▼
PostgreSQL     Anomaly Detection
   │                │
   └───────┬────────┘
           ▼
       Socket.IO
           │
           ▼
       Next.js UI
```

The API accepts events and validates them. BullMQ provides the asynchronous boundary. The worker aggregates operational data and evaluates error-rate behavior. Socket.IO publishes current state to connected dashboard clients.

## What It Demonstrates

### Event ingestion

- REST event ingestion
- Zod validation
- `INFO`, `WARN`, `ERROR`, and `DEBUG` levels
- Source, timestamp, and metadata fields
- Queue-backed asynchronous processing

### Processing and reliability

- Redis-backed BullMQ queues
- Dedicated worker process
- Configurable concurrency
- Failed-job handling
- Graceful worker shutdown
- Bounded API queries
- Database indexes and constraints

### Operational analytics

- Event volume
- Error and warning counts
- Service-level metrics
- Hourly metric windows
- Error-rate statistics

### Anomaly detection

The worker compares a service's current error-rate behavior with a historical baseline and emits severity levels such as `MEDIUM`, `HIGH`, and `CRITICAL` when abnormal behavior is detected.

### Realtime operations

Socket.IO pushes event, metric, and anomaly updates to the dashboard without requiring continuous page refreshes.

### Traffic simulator

The repository includes a simulator for generating application traffic and controlled spikes so the anomaly pipeline can be exercised locally.

## Engineering Model

LOGVAULT deliberately separates the responsibilities of request handling, queueing, processing, persistence, anomaly analysis, and presentation.

That makes the project useful as a study of what happens when an application moves from synchronous CRUD toward an event-processing architecture:

```text
HTTP request
    │
    ├── validate
    └── enqueue
          │
          ▼
       worker
          │
     ┌────┴────┐
     ▼         ▼
 metrics    anomalies
     │         │
     └────┬────┘
          ▼
      persistence
          │
          ▼
       realtime
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React |
| API | Fastify |
| Validation | Zod |
| Queue | BullMQ |
| Broker | Redis |
| Database | PostgreSQL, Prisma |
| Realtime | Socket.IO |
| Monorepo | Turborepo |
| Language | TypeScript |
| Runtime | Node.js 24+ |
| Testing | Vitest |
| Infrastructure | Docker Compose |

## Repository Structure

```text
logvault/
├── apps/
│   ├── api/          # HTTP ingestion/query API
│   ├── simulator/    # controlled event producer
│   ├── web/          # realtime dashboard
│   └── worker/       # asynchronous processing
├── packages/
│   ├── db/           # Prisma schema and persistence
│   └── shared/       # shared types/utilities
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Local Development

### Prerequisites

- Node.js 24+
- pnpm 11+
- Docker Desktop

```bash
git clone https://github.com/Scarlet-Twinz/logvault.git
cd logvault
pnpm install
docker compose up -d
```

Configure `packages/db/.env` with the local PostgreSQL and Redis connection values, then:

```bash
pnpm --filter @logvault/db generate
pnpm --filter @logvault/db exec prisma migrate dev
```

Run the services in separate terminals:

```bash
pnpm --filter @logvault/api dev
pnpm --filter @logvault/worker dev
pnpm --filter @logvault/web dev
pnpm --filter @logvault/simulator dev
```

Default endpoints:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
```

## API Surface

```http
GET  /health
POST /events
GET  /events
GET  /metrics
GET  /anomalies
```

Example event:

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

## Testing & Quality

```bash
pnpm --filter @logvault/api test
pnpm --filter @logvault/worker test
pnpm check-types
pnpm build
```

## Current Status

**Functional local observability platform.**

The repository contains the ingestion API, asynchronous worker, PostgreSQL persistence, anomaly detection, realtime dashboard, simulator, tests, and Docker-based local infrastructure.

A public hosted deployment is not currently provided.

## Engineering Focus

LOGVAULT is primarily an exploration of:

- event-driven architecture;
- asynchronous workload isolation;
- queue and worker design;
- statistical anomaly detection;
- realtime state propagation;
- database constraints and bounded queries;
- failure handling and graceful shutdown;
- monorepo architecture and automated testing.

## License

MIT

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack and systems engineer focused on backend architecture, distributed processing, realtime systems, databases, networking, AI integration, and practical software engineering.

## Project Links

- **Repository:** https://github.com/Scarlet-Twinz/logvault
- **Author:** Anthony Emmanuella Mmasinachi
- **GitHub:** https://github.com/Scarlet-Twinz
