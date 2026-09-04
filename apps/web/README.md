# LogVault Web

Next.js dashboard for the LogVault event-intelligence platform.

The web application presents live event statistics, event streams, detected anomalies, service information, and realtime updates received from the LogVault API.

## Development

From the repository root:

```bash
pnpm install
pnpm --filter @logvault/web dev
```

The dashboard runs at:

```text
http://localhost:3000
```

The API, PostgreSQL, Redis, worker, and simulator are separate workspace services. See the root repository README for the complete system setup.

## Build

```bash
pnpm --filter @logvault/web build
```

## Scope

This package owns the browser-facing dashboard. Event ingestion, persistence, asynchronous processing, anomaly detection, and realtime broadcasting are handled by the corresponding LogVault backend services.

## Author

**Anthony Emmanuella Mmasinachi**
