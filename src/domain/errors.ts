import type { ApiErrorEnvelope } from "../types";

export type ClientErrorCode =
  | ApiErrorEnvelope["error"]["code"]
  | "NETWORK_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "STORAGE_INVALID"
  | "STORAGE_UNSUPPORTED_VERSION"
  | "STORAGE_OVERSIZED"
  | "STORAGE_QUOTA"
  | "AUTH_INVALID_EMAIL"
  | "AUTH_WEAK_PASSWORD"
  | "AUTH_EMAIL_IN_USE"
  | "AUTH_BAD_CREDENTIALS"
  | "AUTH_POPUP_BLOCKED"
  | "AUTH_POPUP_CANCELLED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_NETWORK"
  | "AUTH_CONFIGURATION"
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_DEVICE_UNAVAILABLE"
  | "CAMERA_DEVICE_BUSY"
  | "CAMERA_UNSUPPORTED"
  | "CAMERA_INSECURE_CONTEXT"
  | "CAMERA_MODEL_UNAVAILABLE"
  | "CAMERA_INFERENCE_FAILED";

export class ClientError extends Error {
  readonly code: ClientErrorCode;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly retryAfterMs?: number;
  readonly cause?: unknown;

  constructor(input: {
    code: ClientErrorCode;
    message: string;
    retryable?: boolean;
    requestId?: string;
    retryAfterMs?: number;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "ClientError";
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.requestId = input.requestId;
    this.retryAfterMs = input.retryAfterMs;
    this.cause = input.cause;
  }
}

export function toClientError(error: unknown): ClientError {
  if (error instanceof ClientError) return error;
  return new ClientError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
    retryable: false,
    cause: error,
  });
}

