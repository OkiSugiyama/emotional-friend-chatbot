import type { EmotionContext, RecentHistoryMessage } from "./contracts.js";

export type Principal =
  | { type: "registered"; id: string; uid: string }
  | { type: "guest"; id: string; guestId: string };

export interface RegisteredTokenVerifier {
  verify(token: string): Promise<Principal>;
}

export interface CompletedSend {
  userMessageId: string;
  assistantMessageId: string;
  assistantText: string;
  variant: "assistant" | "safety_support";
  safety?: {
    category: string;
    policyVersion: string;
    copyVersion: string;
    /**
     * False once the reviewed copy names a region-specific resource. Widened
     * from the literal `true` on 2026-09-02, under the owner's approval to
     * surface US crisis resources; the field must be able to report the copy it
     * actually shipped.
     */
    locationNeutral: boolean;
    requiresReview: true;
  };
}

export type BeginSendResult =
  | { kind: "execute"; userMessageId: string; assistantMessageId: string }
  | { kind: "replay"; completion: CompletedSend };

export interface RegisteredSendInput {
  uid: string;
  chatId: string;
  operationKey: string;
  requestFingerprint: string;
  clientRequestId: string;
  userMessageId: string;
  assistantMessageId: string;
  text: string;
  emotionContext?: EmotionContext;
  leaseMs: number;
  idempotencyTtlMs: number;
}

export interface CompleteSendInput {
  uid: string;
  chatId: string;
  operationKey: string;
  requestFingerprint: string;
  completion: CompletedSend;
  generation: {
    provider: string;
    model: string | null;
    promptVersion: string;
    providerResponseId?: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface DeleteChatResult {
  operationId: string;
  status: "pending" | "complete";
  replayed: boolean;
}

export interface ChatRepository {
  loadRegisteredEmotionConsent(uid: string): Promise<{
    useEmotionContext: boolean;
    cameraNoticeVersion: string | null;
    cameraNoticeAcceptedAt: Date | null;
  }>;
  beginSend(input: RegisteredSendInput): Promise<BeginSendResult>;
  completeSend(input: CompleteSendInput): Promise<void>;
  failSend(input: {
    uid: string;
    chatId: string;
    operationKey: string;
    requestFingerprint: string;
    errorCode: string;
    retryable: boolean;
  }): Promise<void>;
  loadRecentHistory(input: {
    uid: string;
    chatId: string;
    limit: number;
    excludeMessageId: string;
  }): Promise<RecentHistoryMessage[]>;
  deleteChat(input: {
    uid: string;
    chatId: string;
    batchSize: number;
    operationKey: string;
    requestFingerprint: string;
    leaseMs: number;
    idempotencyTtlMs: number;
  }): Promise<DeleteChatResult>;
}

export interface GenerationInput {
  currentText: string;
  history: RecentHistoryMessage[];
  emotionContext?: EmotionContext;
  safetyIdentifier: string;
  signal: AbortSignal;
}

export interface GenerationResult {
  text: string;
  provider: string;
  model: string;
  promptVersion: string;
  providerResponseId?: string;
  inputTokens?: number;
  outputTokens?: number;
  retryCount?: number;
}

export interface ConversationProvider {
  generateReply(input: GenerationInput): Promise<GenerationResult>;
}
