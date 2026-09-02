import { createHmac } from "node:crypto";
import { z } from "zod";
import { AppError } from "./errors.js";

export const canonicalEmotionLabels = [
  "angry",
  "disgusted",
  "fearful",
  "happy",
  "neutral",
  "sad",
  "surprised",
  "unavailable",
] as const;

export type CanonicalEmotionLabel = (typeof canonicalEmotionLabels)[number];

const codePointLength = (value: string): number => Array.from(value).length;
const boundedText = z
  .string()
  .refine((value) => value.trim().length > 0, "must contain non-whitespace text")
  .refine((value) => codePointLength(value) <= 8_000, "must contain at most 8000 Unicode characters");

export const emotionContextSchema = z
  .object({
    label: z.enum(canonicalEmotionLabels),
    confidenceBand: z.enum(["low", "medium", "high"]).nullable(),
    modelVersion: z.literal("face-expression-v1").nullable(),
    observedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export const recentHistoryMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    text: boundedText,
  })
  .strict();

export const messageRequestSchema = z
  .object({
    text: boundedText,
    emotionContext: z.unknown().optional(),
    recentHistory: z.array(recentHistoryMessageSchema).max(12).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const total = (value.recentHistory ?? []).reduce((sum, message) => sum + codePointLength(message.text), 0);
    if (total > 24_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recentHistory"],
        message: "aggregate history is too large",
      });
    }
  });

export type MessageRequestInput = z.infer<typeof messageRequestSchema>;
export interface MessageRequest {
  text: string;
  emotionContext?: EmotionContext;
  recentHistory?: RecentHistoryMessage[];
}
export type EmotionContext = z.infer<typeof emotionContextSchema>;
export type RecentHistoryMessage = z.infer<typeof recentHistoryMessageSchema>;

export const guestSessionRequestSchema = z
  .object({
    guestId: z.string().uuid(),
  })
  .strict();

export type GuestSessionRequest = z.infer<typeof guestSessionRequestSchema>;

export const clientEventCategories = [
  "client_error",
  "unhandled_rejection",
  "storage_failure",
  "network_failure",
  "auth_token_failure",
  "request_validation_failure",
  "api_failure",
] as const;

export const clientEventRequestSchema = z
  .object({
    releaseVersion: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._+-]*$/),
    category: z.enum(clientEventCategories),
  })
  .strict();

export type ClientEventCategory = (typeof clientEventCategories)[number];

export const safetyResponseSchema = z
  .object({
    category: z.string().min(1).max(100),
    policyVersion: z.string().min(1).max(100),
    copyVersion: z.string().min(1).max(100),
    locationNeutral: z.boolean(),
    requiresReview: z.literal(true),
  })
  .strict();

export const chatMessageResponseSchema = z
  .object({
    requestId: z.string().uuid(),
    userMessage: z
      .object({
        id: z.string().min(1).max(128),
        status: z.literal("complete"),
      })
      .strict(),
    assistantMessage: z
      .object({
        id: z.string().min(1).max(128),
        text: z.string().min(1).max(32_000),
        status: z.literal("complete"),
        variant: z.enum(["assistant", "safety_support"]),
        safety: safetyResponseSchema.optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.assistantMessage.variant === "safety_support" && !value.assistantMessage.safety) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assistantMessage", "safety"],
        message: "safety metadata is required for safety-support messages",
      });
    }
    if (value.assistantMessage.variant === "assistant" && value.assistantMessage.safety) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assistantMessage", "safety"],
        message: "safety metadata is allowed only for safety-support messages",
      });
    }
  });

export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;

export const chatIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const idempotencyKeySchema = z.string().uuid();

export function parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  throw new AppError({
    code: "INVALID_REQUEST",
    status: 400,
    message: "The request is invalid.",
    safeDetails: parsed.error.issues.slice(0, 10).map((issue) => ({
      path: issue.path.join("."),
      issue: issue.message,
    })),
  });
}

export function requestFingerprint(secret: string, chatId: string, body: MessageRequest): string {
  const canonical = JSON.stringify({
    chatId,
    text: body.text,
    emotionContext: body.emotionContext ?? null,
    recentHistory: body.recentHistory ?? null,
  });
  return createHmac("sha256", secret)
    .update("message-fingerprint.v1\0", "utf8")
    .update(canonical, "utf8")
    .digest("hex");
}

export function deleteRequestFingerprint(secret: string, chatId: string): string {
  return createHmac("sha256", secret)
    .update("delete-fingerprint.v1\0", "utf8")
    .update(JSON.stringify({ chatId }), "utf8")
    .digest("hex");
}

export function sanitizeMessageRequest(
  input: MessageRequestInput,
  options: { nowMs: number; maxEmotionAgeMs: number; futureSkewMs: number },
): MessageRequest {
  return {
    text: input.text,
    recentHistory: input.recentHistory,
    emotionContext: sanitizeEmotionContext(input.emotionContext, options),
  };
}

export function sanitizeEmotionContext(
  input: unknown,
  options: { nowMs: number; maxEmotionAgeMs: number; futureSkewMs: number },
): EmotionContext | undefined {
  const parsed = emotionContextSchema.safeParse(input);
  if (!parsed.success) return undefined;
  const emotion = parsed.data;

  if (emotion.label === "unavailable") {
    return emotion.confidenceBand === null && emotion.modelVersion === null && emotion.observedAt === null
      ? emotion
      : undefined;
  }
  if (
    emotion.confidenceBand === null ||
    emotion.modelVersion !== "face-expression-v1" ||
    emotion.observedAt === null
  ) {
    return undefined;
  }
  const observedAtMs = Date.parse(emotion.observedAt);
  if (
    !Number.isFinite(observedAtMs) ||
    observedAtMs < options.nowMs - options.maxEmotionAgeMs ||
    observedAtMs > options.nowMs + options.futureSkewMs
  ) {
    return undefined;
  }
  return emotion;
}
