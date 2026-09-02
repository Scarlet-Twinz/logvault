export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEvent {
  service: string;
  level: LogLevel;
  message: string;
  timestamp?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}
