import { z } from "zod";
import type {
  ApiErrorEnvelope,
  ChatGenerationRequest,
  ChatGenerationResponse,
} from "../types";
import {
  API_MAX_ATTEMPTS,
  API_TIMEOUT_MS,
  GUEST_HISTORY_MAX_MESSAGES,
  RETRY_JITTER_MAX_MS,
  RETRY_JITTER_MIN_MS,
} from "../domain/constants";
import { ClientError } from "../domain/errors";
import { validateMessage } from "../domain/validation";
import { SingleFlight, retryJitterMs } from "./reliability";

const assistantVariantSchema = z.enum(["assistant", "safety_support"]);

const safetyMetadataSchema = z
  .object({
    category: z.string().min(1),
    policyVersion: z.string().min(1),
    copyVersion: z.string().min(1),
    locationNeutral: z.literal(true),
    requiresReview: z.literal(true),
  })
  .strict();

const responseSchema = z
  .object({
    requestId: z.string().min(1),
    userMessage: z.object({
      id: z.string().min(1),
      status: z.enum(["pending", "complete", "failed", "deleted"]),
    }),
    assistantMessage: z.object({
      id: z.string().min(1),
      text: z.string(),
      status: z.enum(["pending", "complete", "failed", "deleted"]),
      variant: assistantVariantSchema,
      safety: safetyMetadataSchema.optional(),
    }).strict(),
  })
  .strict()
  .transform((response) => ({
    ...response,
    assistantMessage: {
      ...response.assistantMessage,
      ...(response.assistantMessage.variant === "safety_support" ? { safetySupport: true } : {}),
    },
  }));

export type AssistantMessageVariant = z.infer<typeof assistantVariantSchema>;
export type SafetyMetadata = z.infer<typeof safetyMetadataSchema>;
export type HttpChatGenerationResponse = Omit<ChatGenerationResponse, "assistantMessage"> & {
  assistantMessage: ChatGenerationResponse["assistantMessage"] & {
    variant: AssistantMessageVariant;
    safety?: SafetyMetadata;
  };
};

const emotionContextSchema = z
  .object({
    label: z.enum([
      "angry",
      "disgusted",
      "fearful",
      "happy",
      "neutral",
      "sad",
      "surprised",
      "unavailable",
    ]),
    confidenceBand: z.enum(["low", "medium", "high"]).nullable(),
    modelVersion: z.string().max(128).nullable(),
    observedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

const requestSchema = z
  .object({
    text: z.string(),
    emotionContext: emotionContextSchema.optional(),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string(),
          })
          .strict(),
      )
      .max(GUEST_HISTORY_MAX_MESSAGES)
      .optional(),
  })
  .strict();

const errorSchema = z
  .object({
    requestId: z.string(),
    error: z.object({
      code: z.enum([
        "INVALID_REQUEST",
        "UNAUTHENTICATED",
        "UNAUTHORIZED",
        "CHAT_NOT_FOUND",
        "IDEMPOTENCY_CONFLICT",
        "REQUEST_IN_PROGRESS",
        "IDEMPOTENCY_REPLAY_UNAVAILABLE",
        "RATE_LIMITED",
        "PROVIDER_TIMEOUT",
        "AI_TEMPORARILY_UNAVAILABLE",
        "SAFETY_INTERVENTION",
        "REQUEST_TOO_LARGE",
        "UNSUPPORTED_MEDIA_TYPE",
        "METHOD_NOT_ALLOWED",
        "CONFIGURATION_ERROR",
        "INTERNAL_ERROR",
      ]),
      message: z.string(),
      retryable: z.boolean(),
      details: z
        .array(
          z
            .object({
              path: z.string(),
              issue: z.string(),
            })
            .strict(),
        )
        .max(10)
        .optional(),
    }).strict(),
  })
  .strict();

export type ChatPrincipal =
  | { kind: "registered"; getIdToken: () => Promise<string | null> }
  | { kind: "guest"; guestId: string; guestSessionToken?: string };

export interface SendChatInput {
  chatId: string;
  clientRequestId: string;
  principal: ChatPrincipal;
  request: ChatGenerationRequest;
  signal?: AbortSignal;
}

export interface HttpChatClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  random?: () => number;
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
}

function retryDelay(random: () => number, requested?: number): number {
  if (requested !== undefined) {
    return Math.min(RETRY_JITTER_MAX_MS, Math.max(RETRY_JITTER_MIN_MS, requested));
  }
  return retryJitterMs(random);
}

function defaultSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = window.setTimeout(finish, milliseconds);
    const abort = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function parseRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("Retry-After");
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}

function shouldRetry(error: ClientError): boolean {
  return (
    error.retryable &&
    ![
      "INVALID_REQUEST",
      "UNAUTHENTICATED",
      "UNAUTHORIZED",
      "CHAT_NOT_FOUND",
      "IDEMPOTENCY_CONFLICT",
      "IDEMPOTENCY_REPLAY_UNAVAILABLE",
      "SAFETY_INTERVENTION",
    ].includes(error.code)
  );
}

export class HttpChatClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly random: () => number;
  private readonly sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  private readonly inFlight = new SingleFlight<HttpChatGenerationResponse>();

  constructor(options: HttpChatClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/u, "");
    this.fetcher = options.fetch ?? fetch.bind(globalThis);
    this.random = options.random ?? Math.random;
    this.sleep = options.sleep ?? defaultSleep;
  }

  send(input: SendChatInput): Promise<HttpChatGenerationResponse> {
    return this.inFlight.run(input.clientRequestId, () => this.sendWithRetry(input));
  }

  private async sendWithRetry(input: SendChatInput): Promise<HttpChatGenerationResponse> {
    const validation = validateMessage(input.request.text);
    if (!validation.valid) {
      throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
    }
    const requestValidation = requestSchema.safeParse(input.request);
    if (!requestValidation.success) {
      throw new ClientError({
        code: "INVALID_REQUEST",
        message: "The message request contains unsupported data.",
        cause: requestValidation.error,
      });
    }
    let lastError: ClientError | null = null;
    for (let attempt = 1; attempt <= API_MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.attempt(input);
      } catch (error) {
        lastError =
          error instanceof ClientError
            ? error
            : new ClientError({
                code: "NETWORK_UNAVAILABLE",
                message: "Check your connection and try again.",
                retryable: true,
                cause: error,
              });
        if (attempt >= API_MAX_ATTEMPTS || !shouldRetry(lastError) || input.signal?.aborted) {
          throw lastError;
        }
        await this.sleep(retryDelay(this.random, lastError.retryAfterMs), input.signal);
      }
    }
    throw lastError;
  }

  private async attempt(input: SendChatInput): Promise<HttpChatGenerationResponse> {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Idempotency-Key": input.clientRequestId,
    });
    if (input.principal.kind === "registered") {
      const token = await input.principal.getIdToken();
      if (!token) {
        throw new ClientError({
          code: "UNAUTHENTICATED",
          message: "Sign in again to continue.",
        });
      }
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      if (!input.principal.guestSessionToken) {
        throw new ClientError({
          code: "UNAUTHENTICATED",
          message: "Start a new demo session to continue.",
          retryable: false,
        });
      }
      headers.set("Authorization", `Bearer ${input.principal.guestSessionToken}`);
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, API_TIMEOUT_MS);
    const abortFromParent = () => controller.abort(input.signal?.reason);
    input.signal?.addEventListener("abort", abortFromParent, { once: true });

    try {
      const validatedRequest = requestSchema.parse(input.request);
      const request =
        input.principal.kind === "registered"
          ? {
              text: validatedRequest.text,
              ...(validatedRequest.emotionContext
                ? { emotionContext: validatedRequest.emotionContext }
                : {}),
            }
          : {
              text: validatedRequest.text,
              ...(validatedRequest.emotionContext
                ? { emotionContext: validatedRequest.emotionContext }
                : {}),
              ...(validatedRequest.history
                ? { recentHistory: validatedRequest.history }
                : {}),
            };
      const response = await this.fetcher(
        `${this.baseUrl}/api/v1/chats/${encodeURIComponent(input.chatId)}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(request),
          signal: controller.signal,
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const envelope = errorSchema.safeParse(body);
        const fallbackRetryable = response.status === 429 || response.status >= 500;
        if (!envelope.success) {
          throw new ClientError({
            code: response.status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
            message: "The reply could not be generated right now.",
            retryable: fallbackRetryable,
            retryAfterMs: parseRetryAfter(response),
          });
        }
        const apiError: ApiErrorEnvelope = envelope.data;
        throw new ClientError({
          code: apiError.error.code,
          message: apiError.error.message,
          retryable: apiError.error.retryable,
          requestId: apiError.requestId,
          retryAfterMs: parseRetryAfter(response),
        });
      }
      const parsed = responseSchema.safeParse(body);
      if (!parsed.success) {
        throw new ClientError({
          code: "INVALID_RESPONSE",
          message: "The reply arrived in an unexpected format. Please try again.",
          retryable: false,
          cause: parsed.error,
        });
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof ClientError) throw error;
      if (timedOut) {
        throw new ClientError({
          code: "PROVIDER_TIMEOUT",
          message: "The reply took too long. Please try again.",
          retryable: true,
          cause: error,
        });
      }
      if (input.signal?.aborted) throw input.signal.reason ?? error;
      throw new ClientError({
        code: "NETWORK_UNAVAILABLE",
        message: "Check your connection and try again.",
        retryable: true,
        cause: error,
      });
    } finally {
      window.clearTimeout(timeout);
      input.signal?.removeEventListener("abort", abortFromParent);
    }
  }
}
