import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6380",
  {
    maxRetriesPerRequest: null,
  },
);

export const eventQueue = new Queue("log-events", {
  connection,
});
