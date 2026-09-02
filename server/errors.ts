export type ErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "CHAT_NOT_FOUND"
  | "IDEMPOTENCY_CONFLICT"
  | "IDEMPOTENCY_REPLAY_UNAVAILABLE"
  | "REQUEST_IN_PROGRESS"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "SAFETY_INTERVENTION"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "METHOD_NOT_ALLOWED"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly safeDetails?: ReadonlyArray<{ path: string; issue: string }>;

  constructor(options: {
    code: ErrorCode;
    status: number;
    message: string;
    retryable?: boolean;
    retryAfterSeconds?: number;
    safeDetails?: ReadonlyArray<{ path: string; issue: string }>;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.safeDetails = options.safeDetails;
  }
}

export class ConfigurationError extends AppError {
  constructor() {
    super({
      code: "CONFIGURATION_ERROR",
      status: 503,
      message: "The service is not configured to process this request.",
      retryable: false,
    });
    this.name = "ConfigurationError";
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError({
    code: "INTERNAL_ERROR",
    status: 500,
    message: "The request could not be completed.",
    retryable: true,
  });
}
