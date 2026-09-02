import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@logvault/db";

describe("Worker database processing", () => {
  it("can persist a processed event", async () => {
    const event = await prisma.event.create({
      data: {
        service: "vitest",
        level: "INFO",
        message: "Worker database integration test",
        source: "vitest",
        metadata: {
          test: true,
        },
      },
    });

    expect(event.id).toBeDefined();
    expect(event.service).toBe("vitest");
    expect(event.level).toBe("INFO");
    expect(event.message).toBe(
      "Worker database integration test",
    );

    await prisma.event.delete({
      where: {
        id: event.id,
      },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});