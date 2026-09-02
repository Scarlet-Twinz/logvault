# LogVault

**Real-time event intelligence, log analytics, and anomaly detection platform.**

LogVault is an event-driven observability system designed to ingest application events, process them asynchronously, aggregate operational metrics, detect abnormal error-rate behavior, and stream insights to a real-time dashboard.

It demonstrates how modern backend systems can combine **Fastify, Redis, BullMQ, PostgreSQL, Prisma, Socket.IO, and Next.js** into a reliable event-processing pipeline.

---

## Architecture

```text
                    ┌─────────────────────┐
                    │   Event Producers    │
                    │  API / Simulator     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Fastify API      │
                    │   Event Ingestion    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Redis + BullMQ    │
                    │    Job Queue        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Background Worker │
                    │ Processing + Metrics │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │    PostgreSQL    │        │ Anomaly Detection│
       │ Events + Metrics │        │ Statistical Score│
       └──────────────────┘        └────────┬─────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │      Socket.IO      │
                                  │   Realtime Events   │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │    Next.js Web UI   │
                                  │  Live Observability  │
                                  │      Dashboard      │
                                  └─────────────────────┘
```

---

## Features

### Event ingestion

* REST API for submitting application events
* Zod-based request validation
* Support for `INFO`, `WARN`, `ERROR`, and `DEBUG` levels
* Optional event timestamps, sources, and metadata
* HTTP `202 Accepted` response for asynchronous processing

### Asynchronous processing

* Redis-backed BullMQ queue
* Background event processing
* Configurable worker concurrency
* Failed-job handling and worker shutdown support

### Event analytics

LogVault stores and aggregates:

* Total event volume
* Error counts
* Warning counts
* Service-level metrics
* Hourly metric windows
* Error-rate statistics

### Anomaly detection

The worker compares the current error rate against a historical baseline.

An anomaly is generated when the error rate reaches a significant multiple of the baseline.

Severity levels include:

* `MEDIUM`
* `HIGH`
* `CRITICAL`

Recent anomaly detection is throttled to prevent repeated alerts for the same service within a short period.

### Real-time dashboard

The Next.js dashboard provides:

* Total event statistics
* Error and warning counts
* Live event stream
* Detected anomalies
* Service information
* Real-time Socket.IO updates

### Event simulator

The project includes a simulator for generating realistic application traffic.

It can also generate controlled traffic spikes for demonstrating anomaly detection.

---

## Tech Stack

| Layer           | Technology     |
| --------------- | -------------- |
| Frontend        | Next.js, React |
| API             | Fastify        |
| Validation      | Zod            |
| Queue           | BullMQ         |
| Message Broker  | Redis          |
| Database        | PostgreSQL     |
| ORM             | Prisma         |
| Realtime        | Socket.IO      |
| Monorepo        | Turborepo      |
| Package Manager | pnpm           |
| Testing         | Vitest         |
| Infrastructure  | Docker Compose |
| Language        | TypeScript     |

---

## Project Structure

```text
logvault/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── __tests__/
│   │       ├── event-schema.ts
│   │       ├── index.ts
│   │       ├── queue.ts
│   │       └── socket.ts
│   │
│   ├── simulator/
│   │   └── src/
│   │       └── index.ts
│   │
│   ├── web/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── ...
│   │
│   └── worker/
│       └── src/
│           ├── __tests__/
│           └── index.ts
│
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   └── src/
│   │
│   └── shared/
│       └── src/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

Make sure you have:

* Node.js
* pnpm
* Docker Desktop

installed on your machine.

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

The development services use:

```text
PostgreSQL → localhost:5434
Redis      → localhost:6380
```

### 4. Configure the database

Create the database environment file:

```text
packages/db/.env
```

with:

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

The API runs on:

```text
http://localhost:4000
```

Health check:

```text
GET /health
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

Open:

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

Returns the API health status.

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

The API immediately places the event onto the BullMQ queue and returns a job identifier.

### Query events

```http
GET /events
```

Optional filters:

```text
/events?service=payments
/events?level=ERROR
/events?limit=100
```

### Query metrics

```http
GET /metrics
```

Optional filters:

```text
/metrics?service=payments
/metrics?limit=100
```

### Query anomalies

```http
GET /anomalies
```

Optional filters:

```text
/anomalies?service=payments
/anomalies?severity=CRITICAL
/anomalies?limit=50
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

The project currently includes tests covering event validation, API behavior, queue behavior, and worker/database processing.

---

## Build

Build the workspace with:

```bash
pnpm build
```

This runs the Turborepo build pipeline across the project packages.

---

## Anomaly Detection

LogVault uses a lightweight statistical approach rather than a heavyweight machine-learning model.

For each service, the worker calculates the current error rate and compares it against a historical baseline.

Conceptually:

```text
anomaly score =
current error rate / baseline error rate
```

Higher scores indicate that the service is experiencing a substantially larger proportion of errors than its recent baseline.

This keeps anomaly detection:

* Fast
* Explainable
* Deterministic
* Easy to demonstrate
* Suitable for real-time processing

---

## Realtime Events

Socket.IO is used to stream processed events and anomaly notifications to connected dashboard clients.

Realtime event types include:

```text
event:processed
anomaly:detected
```

This allows the dashboard to update without repeatedly refreshing the page.

---

## Reliability Considerations

The system includes several reliability-oriented patterns:

* Asynchronous event processing
* Queue-based workload isolation
* Worker concurrency control
* Request validation
* Database indexes
* Metric uniqueness constraints
* Worker failure handling
* Graceful worker shutdown
* Socket reconnection
* Bounded API query limits

---

## Development

Useful commands:

```bash
pnpm install
pnpm build
pnpm --filter @logvault/api test
pnpm --filter @logvault/worker test
docker compose up -d
docker compose down
```

---

## Why LogVault?

LogVault was built as a practical demonstration of backend and distributed-systems concepts rather than as a simple CRUD application.

The project focuses on:

* Event-driven architecture
* Asynchronous job processing
* Queue-based systems
* Observability
* Realtime communication
* Statistical anomaly detection
* Database design
* Type-safe APIs
* Monorepo architecture
* Automated testing

##Deployment

Nexora has been deployed and is available as a live application.

Live URL: Add your deployed URL here.

The application is structured for containerized deployment with separate application, database, and background-worker responsibilities.
---

## License

This project is intended as a portfolio and learning project.

Author
Scarlet-Twinz

GitHub: https://github.com/Scarlet-Twins
