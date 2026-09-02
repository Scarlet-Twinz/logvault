import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { eventSchema } from "../event-schema";

describe("POST /events contract", () => {
  it("accepts a valid event payload", async () => {
    const app = Fastify();

    app.post("/events", async (request, reply) => {
      const result = eventSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          error: "Invalid event",
        });
      }

      return reply.code(202).send({
        accepted: true,
      });
    });

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        service: "payments",
        level: "INFO",
        message: "Payment processed successfully",
        source: "api",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      accepted: true,
    });

    await app.close();
  });

  it("rejects an invalid event payload", async () => {
    const app = Fastify();

    app.post("/events", async (request, reply) => {
      const result = eventSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          error: "Invalid event",
        });
      }

      return reply.code(202).send({
        accepted: true,
      });
    });

    const response = await app.inject({
      method: "POST",
      url: "/events",
      payload: {
        service: "",
        level: "INVALID",
        message: "",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Invalid event",
    });

    await app.close();
  });
});
