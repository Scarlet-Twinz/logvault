import { describe, expect, it } from "vitest";
import { eventSchema } from "../event-schema";

describe("eventSchema", () => {
  it("accepts a valid event", () => {
    const result = eventSchema.safeParse({
      service: "payments",
      level: "INFO",
      message: "Payment processed successfully",
      source: "api",
      metadata: {
        simulated: true,
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts an event with a timestamp", () => {
    const result = eventSchema.safeParse({
      service: "orders",
      level: "ERROR",
      message: "Database timeout",
      timestamp: "2026-09-01T21:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid log level", () => {
    const result = eventSchema.safeParse({
      service: "payments",
      level: "CRITICAL",
      message: "Something went wrong",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty service", () => {
    const result = eventSchema.safeParse({
      service: "",
      level: "INFO",
      message: "Test event",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = eventSchema.safeParse({
      service: "payments",
      level: "INFO",
      message: "",
    });

    expect(result.success).toBe(false);
  });
});