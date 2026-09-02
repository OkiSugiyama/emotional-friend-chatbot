export const EXPRESSION_LABELS = [
  "angry",
  "disgusted",
  "fearful",
  "happy",
  "neutral",
  "sad",
  "surprised",
  "unavailable"
] as const;

export type ExpressionLabel = (typeof EXPRESSION_LABELS)[number];
export type ConfidenceBand = "low" | "medium" | "high";
export type MessageStatus = "pending" | "complete" | "failed" | "deleted";
export type MessageRole = "user" | "assistant" | "system";
export type PrincipalKind = "registered" | "guest";

export interface EmotionContext {
  label: ExpressionLabel;
  confidenceBand: ConfidenceBand | null;
  modelVersion: string | null;
  observedAt: string | null;
}

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  clientRequestId: string;
  createdAt: string;
  completedAt: string | null;
  emotionContext: EmotionContext | null;
  safetySupport?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  titleSource: "default" | "generated" | "user";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messages: Message[];
}

export interface GuestSession {
  schemaVersion: 1;
  guestId: string;
  createdAt: string;
  lastActivityAt: string;
  chats: Chat[];
}

export interface AppUser {
  kind: PrincipalKind;
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface ChatGenerationRequest {
  text: string;
  emotionContext?: EmotionContext;
  history?: Array<Pick<Message, "role" | "text">>;
}

export interface ChatGenerationResponse {
  requestId: string;
  userMessage: Pick<Message, "id" | "status">;
  assistantMessage: Pick<Message, "id" | "text" | "status"> & {
    safetySupport?: boolean;
  };
}

export interface ApiErrorEnvelope {
  requestId: string;
  error: {
    code:
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
    message: string;
    retryable: boolean;
    details?: ReadonlyArray<{ path: string; issue: string }>;
  };
}
