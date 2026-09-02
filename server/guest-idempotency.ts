import { AppError } from "./errors.js";
import type { BeginSendResult, CompletedSend } from "./ports.js";

interface Operation {
  fingerprint: string;
  state: "processing" | "completed" | "failed";
  userMessageId: string;
  assistantMessageId: string;
  leaseExpiresAt: number;
  expiresAt: number;
  completion?: CompletedSend;
}

export class InMemoryGuestIdempotencyStore {
  private readonly operations = new Map<string, Operation>();

  constructor(private readonly now: () => number = Date.now) {}

  async claim(input: {
    key: string;
    fingerprint: string;
    userMessageId: string;
    assistantMessageId: string;
    leaseMs: number;
    ttlMs: number;
  }): Promise<BeginSendResult> {
    const now = this.now();
    const existing = this.operations.get(input.key);
    if (existing && existing.expiresAt <= now) this.operations.delete(input.key);
    const active = this.operations.get(input.key);

    if (active) {
      if (active.fingerprint !== input.fingerprint) {
        throw new AppError({
          code: "IDEMPOTENCY_CONFLICT",
          status: 409,
          message: "The idempotency key was already used for a different request.",
        });
      }
      if (active.state === "completed" && active.completion) {
        return { kind: "replay", completion: active.completion };
      }
      if (active.state === "processing" && active.leaseExpiresAt > now) {
        throw new AppError({
          code: "REQUEST_IN_PROGRESS",
          status: 409,
          message: "This request is still being processed.",
          retryable: true,
          retryAfterSeconds: Math.max(1, Math.ceil((active.leaseExpiresAt - now) / 1_000)),
        });
      }
      active.state = "processing";
      active.leaseExpiresAt = now + input.leaseMs;
      active.expiresAt = now + input.ttlMs;
      return {
        kind: "execute",
        userMessageId: active.userMessageId,
        assistantMessageId: active.assistantMessageId,
      };
    }

    this.operations.set(input.key, {
      fingerprint: input.fingerprint,
      state: "processing",
      userMessageId: input.userMessageId,
      assistantMessageId: input.assistantMessageId,
      leaseExpiresAt: now + input.leaseMs,
      expiresAt: now + input.ttlMs,
    });
    return { kind: "execute", userMessageId: input.userMessageId, assistantMessageId: input.assistantMessageId };
  }

  async complete(key: string, fingerprint: string, completion: CompletedSend): Promise<void> {
    const operation = this.operations.get(key);
    if (!operation || operation.fingerprint !== fingerprint) return;
    operation.state = "completed";
    operation.completion = completion;
  }

  async fail(key: string, fingerprint: string): Promise<void> {
    const operation = this.operations.get(key);
    if (!operation || operation.fingerprint !== fingerprint || operation.state === "completed") return;
    operation.state = "failed";
  }
}

export interface GuestIdempotencyStore {
  claim(input: {
    key: string;
    fingerprint: string;
    userMessageId: string;
    assistantMessageId: string;
    leaseMs: number;
    ttlMs: number;
  }): Promise<BeginSendResult>;
  complete(key: string, fingerprint: string, completion: CompletedSend): Promise<void>;
  fail(key: string, fingerprint: string): Promise<void>;
}
