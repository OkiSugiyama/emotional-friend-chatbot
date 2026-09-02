import { z } from "zod";
import type { GuestSession } from "../types";
import {
  CHAT_TITLE_MAX_CODE_POINTS,
  GUEST_CLOCK_SKEW_ALLOWANCE_MS,
  GUEST_INACTIVITY_MS,
  GUEST_SCHEMA_VERSION,
  GUEST_STORAGE_KEY,
  GUEST_STORAGE_MAX_BYTES,
  MESSAGE_MAX_CODE_POINTS,
} from "./constants";
import { ClientError } from "./errors";
import { countCodePoints } from "./validation";

const isoDateSchema = z.string().datetime({ offset: true });
const storageIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

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
    modelVersion: z.string().nullable(),
    observedAt: isoDateSchema.nullable(),
  })
  .strict();

const messageSchema = z
  .object({
    id: storageIdSchema,
    chatId: storageIdSchema,
    role: z.enum(["user", "assistant", "system"]),
    text: z.string().refine((value) => countCodePoints(value) <= MESSAGE_MAX_CODE_POINTS),
    status: z.enum(["pending", "complete", "failed", "deleted"]),
    clientRequestId: z.string().uuid(),
    createdAt: isoDateSchema,
    completedAt: isoDateSchema.nullable(),
    emotionContext: emotionContextSchema.nullable(),
    safetySupport: z.boolean().optional(),
  })
  .strict();

const chatSchema = z
  .object({
    id: storageIdSchema,
    title: z
      .string()
      .refine((value) => value.trim().length > 0)
      .refine((value) => countCodePoints(value) <= CHAT_TITLE_MAX_CODE_POINTS),
    titleSource: z.enum(["default", "generated", "user"]),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
    lastMessageAt: isoDateSchema.nullable(),
    messages: z.array(messageSchema),
  })
  .strict();

export const guestSessionSchema = z
  .object({
    schemaVersion: z.literal(GUEST_SCHEMA_VERSION),
    guestId: z.string().uuid(),
    createdAt: isoDateSchema,
    lastActivityAt: isoDateSchema,
    chats: z.array(chatSchema),
  })
  .strict()
  .superRefine((session, context) => {
    const chatIds = new Set<string>();
    for (const [chatIndex, chat] of session.chats.entries()) {
      if (chatIds.has(chat.id)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate chat id",
          path: ["chats", chatIndex, "id"],
        });
      }
      chatIds.add(chat.id);
      const messageIds = new Set<string>();
      for (const [messageIndex, message] of chat.messages.entries()) {
        if (message.chatId !== chat.id) {
          context.addIssue({
            code: "custom",
            message: "Message belongs to a different chat",
            path: ["chats", chatIndex, "messages", messageIndex, "chatId"],
          });
        }
        if (messageIds.has(message.id)) {
          context.addIssue({
            code: "custom",
            message: "Duplicate message id",
            path: ["chats", chatIndex, "messages", messageIndex, "id"],
          });
        }
        messageIds.add(message.id);
      }
    }
  });

export type GuestActivity =
  | "chat-created"
  | "chat-selected"
  | "chat-renamed"
  | "chat-deleted"
  | "message-sent"
  | "message-deleted"
  | "camera-started"
  | "camera-stopped"
  | "emotion-context-toggled";

export type GuestLoadResult =
  | { kind: "empty" }
  | { kind: "restored"; session: GuestSession }
  | { kind: "expired" }
  | {
      kind: "cleared-invalid";
      reason: "malformed" | "unsupported-version" | "oversized";
    };

export type GuestSaveResult =
  | { kind: "saved" }
  | { kind: "quota-warning"; error: ClientError };

export type GuestTouchResult =
  | { kind: "active"; session: GuestSession }
  | { kind: "expired" }
  | { kind: "invalid"; reason: "malformed" | "future-activity" };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GuestSessionStoreOptions {
  storage?: StorageLike;
  now?: () => number;
  maxBytes?: number;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function normalizeSession(session: GuestSession): GuestSession {
  return {
    ...session,
    chats: [...session.chats]
      .map((chat) => ({
        ...chat,
        messages: [...chat.messages].sort(
          (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
        ),
      }))
      .sort(
        (left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id),
      ),
  };
}

function hasFutureActivity(session: GuestSession, now: number): boolean {
  return Date.parse(session.lastActivityAt) > now + GUEST_CLOCK_SKEW_ALLOWANCE_MS;
}

export class GuestSessionStore {
  private readonly storage: StorageLike;
  private readonly now: () => number;
  private readonly maxBytes: number;

  constructor(options: GuestSessionStoreOptions = {}) {
    this.storage = options.storage ?? window.localStorage;
    this.now = options.now ?? Date.now;
    this.maxBytes = options.maxBytes ?? GUEST_STORAGE_MAX_BYTES;
  }

  create(): GuestSession {
    const timestamp = new Date(this.now()).toISOString();
    return {
      schemaVersion: GUEST_SCHEMA_VERSION,
      guestId: crypto.randomUUID(),
      createdAt: timestamp,
      lastActivityAt: timestamp,
      chats: [],
    };
  }

  load(): GuestLoadResult {
    const raw = this.storage.getItem(GUEST_STORAGE_KEY);
    if (raw === null) return { kind: "empty" };
    if (utf8Bytes(raw) > this.maxBytes) {
      this.clear();
      return { kind: "cleared-invalid", reason: "oversized" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.clear();
      return { kind: "cleared-invalid", reason: "malformed" };
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("schemaVersion" in parsed) ||
      parsed.schemaVersion !== GUEST_SCHEMA_VERSION
    ) {
      this.clear();
      return { kind: "cleared-invalid", reason: "unsupported-version" };
    }

    const result = guestSessionSchema.safeParse(parsed);
    if (!result.success) {
      this.clear();
      return { kind: "cleared-invalid", reason: "malformed" };
    }

    const now = this.now();
    if (hasFutureActivity(result.data, now)) {
      this.clear();
      return { kind: "cleared-invalid", reason: "malformed" };
    }

    if (now - Date.parse(result.data.lastActivityAt) >= GUEST_INACTIVITY_MS) {
      this.clear();
      return { kind: "expired" };
    }

    return { kind: "restored", session: normalizeSession(result.data) };
  }

  save(session: GuestSession): GuestSaveResult {
    const validated = guestSessionSchema.safeParse(session);
    if (!validated.success || hasFutureActivity(validated.data, this.now())) {
      throw new ClientError({
        code: "STORAGE_INVALID",
        message: "The demo session could not be saved safely.",
      });
    }
    const raw = JSON.stringify(normalizeSession(validated.data));
    if (utf8Bytes(raw) > this.maxBytes) {
      throw new ClientError({
        code: "STORAGE_OVERSIZED",
        message: "This demo conversation is too large to save on this device.",
      });
    }
    try {
      this.storage.setItem(GUEST_STORAGE_KEY, raw);
      return { kind: "saved" };
    } catch (error) {
      if (!isQuotaError(error)) throw error;
      return {
        kind: "quota-warning",
        error: new ClientError({
          code: "STORAGE_QUOTA",
          message:
            "Storage on this device is nearly full, so this demo conversation may not be saved between reloads.",
          retryable: false,
          cause: error,
        }),
      };
    }
  }

  touchIfActive(session: GuestSession, _activity: GuestActivity): GuestTouchResult {
    const validated = guestSessionSchema.safeParse(session);
    if (!validated.success) {
      this.clear();
      return { kind: "invalid", reason: "malformed" };
    }
    const now = this.now();
    if (hasFutureActivity(validated.data, now)) {
      this.clear();
      return { kind: "invalid", reason: "future-activity" };
    }
    if (now - Date.parse(validated.data.lastActivityAt) >= GUEST_INACTIVITY_MS) {
      this.clear();
      return { kind: "expired" };
    }
    return {
      kind: "active",
      session: { ...validated.data, lastActivityAt: new Date(now).toISOString() },
    };
  }

  clear(): void {
    this.storage.removeItem(GUEST_STORAGE_KEY);
  }

  observe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const onStorage = (event: StorageEvent) => {
      if (event.key === GUEST_STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }
}
