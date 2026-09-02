import { describe, expect, expectTypeOf, it } from "vitest";

import {
  EXPRESSION_LABELS,
  type ApiErrorEnvelope,
  type ChatGenerationRequest,
  type ChatGenerationResponse,
  type ConfidenceBand,
  type EmotionContext,
  type ExpressionLabel,
  type GuestSession,
  type Message,
  type MessageRole,
  type MessageStatus,
  type PrincipalKind
} from "../../src/types";

type ExpectedExpressionLabel =
  | "angry"
  | "disgusted"
  | "fearful"
  | "happy"
  | "neutral"
  | "sad"
  | "surprised"
  | "unavailable";

type ExpectedErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHENTICATED"
  | "UNAUTHORIZED"
  | "CHAT_NOT_FOUND"
  | "IDEMPOTENCY_CONFLICT"
  | "REQUEST_IN_PROGRESS"
  | "IDEMPOTENCY_REPLAY_UNAVAILABLE"
  | "RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "SAFETY_INTERVENTION"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "METHOD_NOT_ALLOWED"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

describe("canonical shared contracts", () => {
  it("exports the exact canonical expression vocabulary", () => {
    expect(EXPRESSION_LABELS).toEqual([
      "angry",
      "disgusted",
      "fearful",
      "happy",
      "neutral",
      "sad",
      "surprised",
      "unavailable"
    ]);
    expect(new Set(EXPRESSION_LABELS).size).toBe(EXPRESSION_LABELS.length);
    expect(EXPRESSION_LABELS).not.toContain("calm");
    expect(EXPRESSION_LABELS).not.toContain("fear");
    expect(EXPRESSION_LABELS).not.toContain("surprise");
    expectTypeOf<ExpressionLabel>().toEqualTypeOf<ExpectedExpressionLabel>();
  });

  it("keeps message, confidence, role, and principal unions exact", () => {
    expectTypeOf<ConfidenceBand>().toEqualTypeOf<
      "low" | "medium" | "high"
    >();
    expectTypeOf<MessageStatus>().toEqualTypeOf<
      "pending" | "complete" | "failed" | "deleted"
    >();
    expectTypeOf<MessageRole>().toEqualTypeOf<
      "user" | "assistant" | "system"
    >();
    expectTypeOf<PrincipalKind>().toEqualTypeOf<"registered" | "guest">();
    expectTypeOf<Message["status"]>().toEqualTypeOf<MessageStatus>();
    expectTypeOf<Message["role"]>().toEqualTypeOf<MessageRole>();
  });

  it("keeps guest storage versioned and timestamps portable", () => {
    expectTypeOf<GuestSession["schemaVersion"]>().toEqualTypeOf<1>();
    expectTypeOf<GuestSession["createdAt"]>().toEqualTypeOf<string>();
    expectTypeOf<GuestSession["lastActivityAt"]>().toEqualTypeOf<string>();
    expectTypeOf<GuestSession["chats"]>().toEqualTypeOf<
      GuestSession["chats"]
    >();
  });

  it("allows only privacy-reviewed expression metadata in EmotionContext", () => {
    type ExpectedEmotionContextKey =
      | "label"
      | "confidenceBand"
      | "modelVersion"
      | "observedAt";

    expectTypeOf<keyof EmotionContext>().toEqualTypeOf<
      ExpectedEmotionContextKey
    >();
    expectTypeOf<EmotionContext["label"]>().toEqualTypeOf<ExpressionLabel>();
    expectTypeOf<EmotionContext["confidenceBand"]>().toEqualTypeOf<
      ConfidenceBand | null
    >();
    expectTypeOf<EmotionContext["observedAt"]>().toEqualTypeOf<string | null>();
  });

  it("keeps the chat-generation request bounded to reviewed top-level fields", () => {
    type ExpectedRequestKey = "text" | "emotionContext" | "history";
    type HistoryEntry = NonNullable<ChatGenerationRequest["history"]>[number];

    expectTypeOf<keyof ChatGenerationRequest>().toEqualTypeOf<
      ExpectedRequestKey
    >();
    expectTypeOf<keyof HistoryEntry>().toEqualTypeOf<"role" | "text">();
    expectTypeOf<ChatGenerationRequest["emotionContext"]>().toEqualTypeOf<
      EmotionContext | undefined
    >();
  });

  it("keeps the success and error envelopes stable", () => {
    expectTypeOf<keyof ChatGenerationResponse>().toEqualTypeOf<
      "requestId" | "userMessage" | "assistantMessage"
    >();
    expectTypeOf<
      ApiErrorEnvelope["error"]["code"]
    >().toEqualTypeOf<ExpectedErrorCode>();
    expectTypeOf<ApiErrorEnvelope["error"]["retryable"]>().toEqualTypeOf<boolean>();
  });
});
