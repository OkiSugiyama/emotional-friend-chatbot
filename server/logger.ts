export type LogLevel = "info" | "warn" | "error";

export interface LogEvent {
  timestamp?: string;
  level: LogLevel;
  event: "request.completed" | "request.failed" | "provider.completed" | "provider.failed";
  requestId: string;
  route: string;
  method?: string;
  status?: number;
  durationMs?: number;
  principalType?: "registered" | "guest";
  principalHash?: string;
  outcome?: string;
  errorCode?: string;
  idempotencyState?: "execute" | "replay";
  safetyIntervention?: boolean;
  provider?: string;
  providerStatus?: number;
  providerErrorCode?: string;
  model?: string;
  promptVersion?: string;
  retryCount?: number;
  inputTokens?: number;
  outputTokens?: number;
}

const allowedKeys: ReadonlyArray<keyof LogEvent> = [
  "timestamp",
  "level",
  "event",
  "requestId",
  "route",
  "method",
  "status",
  "durationMs",
  "principalType",
  "principalHash",
  "outcome",
  "errorCode",
  "idempotencyState",
  "safetyIntervention",
  "provider",
  "providerStatus",
  "providerErrorCode",
  "model",
  "promptVersion",
  "retryCount",
  "inputTokens",
  "outputTokens",
];

export type LogSink = (record: Record<string, unknown>) => void;

export class AllowlistLogger {
  constructor(private readonly sink: LogSink = (record) => console.log(record)) {}

  clientEvent(event: {
    requestId: string;
    route: string;
    releaseVersion: string;
    category:
      | "client_error"
      | "unhandled_rejection"
      | "storage_failure"
      | "network_failure"
      | "auth_token_failure"
      | "request_validation_failure"
      | "api_failure";
  }): void {
    this.sink({
      event: "client.event",
      requestId: event.requestId,
      route: event.route,
      releaseVersion: event.releaseVersion,
      category: event.category,
    });
  }

  log(event: LogEvent): void {
    const record: Record<string, unknown> = {};
    const source = event as unknown as Record<string, unknown>;
    for (const key of allowedKeys) {
      if (event.safetyIntervention && key === "principalHash") continue;
      const value = source[key];
      if (value !== undefined) record[key] = value;
    }
    record.timestamp ??= new Date().toISOString();
    this.sink(record);
  }
}
