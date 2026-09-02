import { z } from "zod";

export const eventSchema = z.object({
  service: z.string().min(1).max(100),
  level: z.enum(["INFO", "WARN", "ERROR", "DEBUG"]),
  message: z.string().min(1).max(5000),
  timestamp: z.coerce.date().optional(),
  source: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
