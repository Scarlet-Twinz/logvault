import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { eventSchema } from "./event-schema";
import { eventQueue } from "./queue";
import { createSocketServer } from "./socket";
import { prisma } from "@logvault/db";

const app = Fastify({
  logger: true,
});

async function start() {
  await app.register(cors);
  await app.register(helmet);

  app.get("/health", async () => ({
    status: "ok",
    service: "logvault-api",
    timestamp: new Date().toISOString(),
  }));

  app.post("/events", async (request, reply) => {
    const result = eventSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        error: "Invalid event",
        details: result.error.flatten(),
      });
    }

    const event = {
      ...result.data,
      timestamp: (result.data.timestamp ?? new Date()).toISOString(),
    };

    const job = await eventQueue.add("process-event", event);

    return reply.code(202).send({
      accepted: true,
      jobId: job.id,
    });
  });

  app.get("/events", async (request) => {
    const query = request.query as {
      service?: string;
      level?: string;
      limit?: string;
    };

    const limit = Math.min(
      Math.max(Number(query.limit ?? 50), 1),
      200,
    );

    const events = await prisma.event.findMany({
      where: {
        ...(query.service
          ? { service: query.service }
          : {}),
        ...(query.level
          ? { level: query.level }
          : {}),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    return {
      events,
      count: events.length,
    };
  });

  app.get("/metrics", async (request) => {
    const query = request.query as {
      service?: string;
      limit?: string;
    };

    const limit = Math.min(
      Math.max(Number(query.limit ?? 100), 1),
      500,
    );

    const metrics = await prisma.metric.findMany({
      where: query.service
        ? { service: query.service }
        : undefined,
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    return {
      metrics,
      count: metrics.length,
    };
  });

  app.get("/anomalies", async (request) => {
    const query = request.query as {
      service?: string;
      severity?: string;
      limit?: string;
    };

    const limit = Math.min(
      Math.max(Number(query.limit ?? 50), 1),
      200,
    );

    const anomalies = await prisma.anomaly.findMany({
      where: {
        ...(query.service
          ? { service: query.service }
          : {}),
        ...(query.severity
          ? { severity: query.severity }
          : {}),
      },
      orderBy: {
        detectedAt: "desc",
      },
      take: limit,
    });

    return {
      anomalies,
      count: anomalies.length,
    };
  });

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    await app.listen({ port, host });

    createSocketServer(app.server);

    app.log.info(`Socket.IO server ready on port ${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
