import IORedis from "ioredis";
import { Worker } from "bullmq";
import { io } from "socket.io-client";
import { prisma } from "@logvault/db";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6380",
  {
    maxRetriesPerRequest: null,
  },
);

const socket = io(
  process.env.API_URL ?? "http://localhost:4000",
  {
    reconnection: true,
  },
);

socket.on("connect", () => {
  console.log(`[socket] Connected to API: ${socket.id}`);
});

socket.on("disconnect", () => {
  console.log("[socket] Disconnected from API");
});

const worker = new Worker(
  "log-events",
  async (job) => {
    const event = job.data;

    console.log(`[worker] Processing event ${job.id}`);

    const timestamp = new Date(event.timestamp);

    const saved = await prisma.event.create({
      data: {
        timestamp,
        service: event.service,
        level: event.level,
        message: event.message,
        source: event.source,
        metadata: event.metadata,
      },
    });

    console.log(`[worker] Saved event ${saved.id}`);

    /*
     * Calculate the current hourly metrics window.
     */
    const windowStart = new Date(timestamp);
    windowStart.setMinutes(0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setHours(windowEnd.getHours() + 1);

    /*
     * Get all events for this service inside the current hour.
     */
    const events = await prisma.event.findMany({
      where: {
        service: event.service,
        timestamp: {
          gte: windowStart,
          lt: windowEnd,
        },
      },
      select: {
        level: true,
      },
    });

    const eventCount = events.length;

    const errorCount = events.filter(
      (item) => item.level === "ERROR",
    ).length;

    const warningCount = events.filter(
      (item) => item.level === "WARN",
    ).length;

    const errorRate =
      eventCount > 0
        ? errorCount / eventCount
        : 0;

    /*
     * Build a short historical baseline from the
     * 15 minutes immediately before the current hour.
     *
     * This makes anomaly detection responsive to
     * real-time spikes while still requiring enough
     * historical traffic to establish a baseline.
     */
    const baselineStart = new Date(windowStart);
    baselineStart.setMinutes(
      baselineStart.getMinutes() - 15,
    );

    const baselineEvents = await prisma.event.findMany({
      where: {
        service: event.service,
        timestamp: {
          gte: baselineStart,
          lt: windowStart,
        },
      },
      select: {
        level: true,
      },
    });

    const baselineEventCount = baselineEvents.length;

    const baselineErrorCount = baselineEvents.filter(
      (item) => item.level === "ERROR",
    ).length;

    const baselineErrorRate =
      baselineEventCount > 0
        ? baselineErrorCount / baselineEventCount
        : 0;

    /*
     * Compare the current error rate against
     * the historical baseline.
     */
    let anomalyScore = 0;

    if (baselineEventCount >= 5) {
      anomalyScore =
        baselineErrorRate === 0
          ? errorRate > 0
            ? 10
            : 0
          : errorRate / baselineErrorRate;
    }

    /*
     * Prevent the same active incident from creating
     * hundreds of duplicate anomaly records.
     *
     * Only one anomaly for a service/metric is created
     * within a five-minute window.
     */
    const recentAnomaly = await prisma.anomaly.findFirst({
      where: {
        service: event.service,
        metric: "error_rate",
        detectedAt: {
          gte: new Date(
            Date.now() - 5 * 60 * 1000,
          ),
        },
      },
      orderBy: {
        detectedAt: "desc",
      },
    });

    const shouldCreateAnomaly =
      anomalyScore >= 2 && !recentAnomaly;

    /*
     * Store/update the current hourly metric.
     */
    await prisma.metric.upsert({
      where: {
        service_timestamp: {
          service: event.service,
          timestamp: windowStart,
        },
      },
      update: {
        eventCount,
        errorCount,
        warningCount,
        anomalyScore,
      },
      create: {
        timestamp: windowStart,
        service: event.service,
        eventCount,
        errorCount,
        warningCount,
        anomalyScore,
      },
    });

    console.log(
      `[worker] Metrics: ${event.service} | events=${eventCount} errors=${errorCount} warnings=${warningCount} errorRate=${errorRate.toFixed(2)} baseline=${baselineErrorRate.toFixed(2)} score=${anomalyScore.toFixed(2)}`,
    );

    /*
     * Notify connected dashboard clients that
     * a new event has been processed.
     */
    socket.emit("event:processed", {
      id: saved.id,
      service: event.service,
      level: event.level,
      message: event.message,
      timestamp: timestamp.toISOString(),
    });

    /*
     * Create an anomaly when the current error rate
     * is at least 2x the historical baseline.
     */
    if (shouldCreateAnomaly) {
      const severity =
        anomalyScore >= 4
          ? "CRITICAL"
          : anomalyScore >= 3
            ? "HIGH"
            : "MEDIUM";

      const description =
        `Error rate is ${anomalyScore.toFixed(2)}x the historical baseline`;

      const anomaly = await prisma.anomaly.create({
        data: {
          service: event.service,
          metric: "error_rate",
          value: errorRate,
          baseline: baselineErrorRate,
          score: anomalyScore,
          severity,
          description,
        },
      });

      console.log(
        `[worker] 🚨 Anomaly detected: ${anomaly.id} | ${severity} | score=${anomalyScore.toFixed(2)}`,
      );

      /*
       * Send the anomaly immediately to the dashboard.
       */
      socket.emit("anomaly:detected", {
        id: anomaly.id,
        service: anomaly.service,
        metric: anomaly.metric,
        value: anomaly.value,
        baseline: anomaly.baseline,
        score: anomaly.score,
        severity: anomaly.severity,
        description: anomaly.description,
        detectedAt: anomaly.detectedAt.toISOString(),
      });
    }

    return {
      eventId: saved.id,
      eventCount,
      errorCount,
      warningCount,
      anomalyScore,
    };
  },
  {
    connection,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(
    `[worker] Job ${job.id} completed`,
  );
});

worker.on("failed", (job, error) => {
  console.error(
    `[worker] Job ${job?.id ?? "unknown"} failed:`,
    error,
  );
});

async function shutdown() {
  console.log("[worker] Shutting down...");

  await worker.close();
  socket.disconnect();
  await prisma.$disconnect();
  await connection.quit();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("LogVault worker started");