import { describe, expect, it, afterAll } from "vitest";
import IORedis from "ioredis";
import { Queue } from "bullmq";

const redis = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6380",
  {
    maxRetriesPerRequest: null,
  },
);

const queue = new Queue("logvault-test-events", {
  connection: redis,
});

describe("BullMQ event queue", () => {
  it("adds an event job to Redis", async () => {
    const job = await queue.add("process-event", {
      service: "payments",
      level: "INFO",
      message: "Queue integration test",
      source: "vitest",
    });

    expect(job.id).toBeDefined();
    expect(job.name).toBe("process-event");

    const storedJob = await queue.getJob(job.id!);

    expect(storedJob).toBeDefined();
    expect(storedJob?.data).toMatchObject({
      service: "payments",
      level: "INFO",
      message: "Queue integration test",
    });

    await storedJob?.remove();
  });
});

afterAll(async () => {
  await queue.close();
  await redis.quit();
});
