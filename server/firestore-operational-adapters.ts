import { createHash, randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { ServerConfig } from "./config.js";
import { AppError } from "./errors.js";
import { getFirebaseAdminFirestore } from "./firebase-adapters.js";
import type { GuestIdempotencyStore } from "./guest-idempotency.js";
import type { BeginSendResult, CompletedSend } from "./ports.js";
import type { RateLimitInput, RateLimitResult, RateLimiter } from "./rate-limit.js";
import type {
  ProviderConcurrencyLease,
  ProviderConcurrencyLimiter,
} from "./concurrency.js";

export class FirestoreRateLimiter implements RateLimiter {
  constructor(
    private readonly config: ServerConfig,
    private readonly now: () => number = Date.now,
  ) {}

  async consume(input: RateLimitInput): Promise<RateLimitResult> {
    const now = this.now();
    const windowStart = Math.floor(now / input.windowMs) * input.windowMs;
    const windowEnd = windowStart + input.windowMs;
    const documentId = createHash("sha256")
      .update(`rate-limit-v1\0${input.key}\0${windowStart}`, "utf8")
      .digest("hex");
    const document = getFirebaseAdminFirestore(this.config).collection("apiRateLimits").doc(documentId);

    return getFirebaseAdminFirestore(this.config).runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      const count = snapshot.exists ? Number(snapshot.data()?.count ?? 0) : 0;
      if (!Number.isFinite(count) || count < 0) throw new Error("invalid rate-limit record");
      if (count >= input.limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1_000)),
        };
      }
      transaction.set(
        document,
        {
          count: count + 1,
          windowStartedAt: Timestamp.fromMillis(windowStart),
          expiresAt: Timestamp.fromMillis(windowEnd + input.windowMs),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { allowed: true, remaining: Math.max(0, input.limit - count - 1) };
    });
  }
}

export class FirestoreGuestIdempotencyStore implements GuestIdempotencyStore {
  constructor(
    private readonly config: ServerConfig,
    private readonly now: () => number = Date.now,
    private readonly injectedFirestore?: Firestore,
  ) {}

  async claim(input: {
    key: string;
    fingerprint: string;
    userMessageId: string;
    assistantMessageId: string;
    leaseMs: number;
    ttlMs: number;
  }): Promise<BeginSendResult> {
    const db = this.firestore();
    const document = db.collection("apiGuestMessageOperations").doc(input.key);
    const now = this.now();
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      const data = snapshot.data() ?? {};
      if (snapshot.exists) {
        if (data.requestFingerprint !== input.fingerprint) throw idempotencyConflict();
        if (data.state === "completed") {
          throw new AppError({
            code: "IDEMPOTENCY_REPLAY_UNAVAILABLE",
            status: 409,
            message: "This guest request was already completed and cannot be replayed by the server.",
            retryable: false,
          });
        }
        const leaseExpiresAt = timestampMillis(data.leaseExpiresAt);
        if (data.state === "processing" && leaseExpiresAt > now) {
          throw new AppError({
            code: "REQUEST_IN_PROGRESS",
            status: 409,
            message: "This request is still being processed.",
            retryable: true,
            retryAfterSeconds: Math.max(1, Math.ceil((leaseExpiresAt - now) / 1_000)),
          });
        }
      }

      transaction.set(document, {
        state: "processing",
        requestFingerprint: input.fingerprint,
        userMessageId: input.userMessageId,
        assistantMessageId: input.assistantMessageId,
        leaseExpiresAt: Timestamp.fromMillis(now + input.leaseMs),
        expiresAt: Timestamp.fromMillis(now + input.ttlMs),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
      });
      return {
        kind: "execute" as const,
        userMessageId: input.userMessageId,
        assistantMessageId: input.assistantMessageId,
      };
    });

    return result;
  }

  async complete(key: string, fingerprint: string, completion: CompletedSend): Promise<void> {
    void completion;
    const db = this.firestore();
    const document = db.collection("apiGuestMessageOperations").doc(key);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      if (!snapshot.exists) throw new Error("missing guest operation");
      const data = snapshot.data() ?? {};
      if (data.requestFingerprint !== fingerprint) throw idempotencyConflict();
      if (data.state === "completed") return;
      transaction.update(document, {
        state: "completed",
        leaseExpiresAt: Timestamp.fromMillis(0),
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async fail(key: string, fingerprint: string): Promise<void> {
    const db = this.firestore();
    const document = db.collection("apiGuestMessageOperations").doc(key);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      if (!snapshot.exists) return;
      const data = snapshot.data() ?? {};
      if (data.requestFingerprint !== fingerprint || data.state === "completed") return;
      transaction.update(document, {
        state: "failed",
        leaseExpiresAt: Timestamp.fromMillis(0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  private firestore(): Firestore {
    return this.injectedFirestore ?? getFirebaseAdminFirestore(this.config);
  }
}

export class FirestoreProviderConcurrencyLimiter implements ProviderConcurrencyLimiter {
  constructor(
    private readonly config: ServerConfig,
    private readonly now: () => number = Date.now,
  ) {}

  async acquire(input: { limit: number; leaseMs: number }): Promise<ProviderConcurrencyLease> {
    const db = getFirebaseAdminFirestore(this.config);
    const references = Array.from({ length: input.limit }, (_, slot) =>
      db.collection("apiProviderConcurrency").doc(`slot-${slot}`),
    );
    const now = this.now();
    const token = randomUUID();
    return db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(references.map((reference) => transaction.get(reference)));
      const availableSlot = snapshots.findIndex(
        (snapshot) => !snapshot.exists || timestampMillis(snapshot.data()?.expiresAt) <= now,
      );
      if (availableSlot < 0) {
        const earliestExpiry = Math.min(
          ...snapshots.map((snapshot) => timestampMillis(snapshot.data()?.expiresAt)),
        );
        throw new AppError({
          code: "RATE_LIMITED",
          status: 429,
          message: "The service is handling too many replies right now.",
          retryable: true,
          retryAfterSeconds: Math.max(1, Math.ceil((earliestExpiry - now) / 1_000)),
        });
      }
      transaction.set(references[availableSlot], {
        leaseToken: token,
        expiresAt: Timestamp.fromMillis(now + input.leaseMs),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { slot: availableSlot, token };
    });
  }

  async release(lease: ProviderConcurrencyLease): Promise<void> {
    const db = getFirebaseAdminFirestore(this.config);
    const document = db.collection("apiProviderConcurrency").doc(`slot-${lease.slot}`);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);
      if (snapshot.exists && snapshot.data()?.leaseToken === lease.token) transaction.delete(document);
    });
  }
}

export interface ReadinessProbe {
  check(config: ServerConfig): Promise<void>;
}

export class FirestoreReadinessProbe implements ReadinessProbe {
  async check(config: ServerConfig): Promise<void> {
    await getFirebaseAdminFirestore(config).collection("apiHealth").limit(1).get();
  }
}

function timestampMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

function idempotencyConflict(): AppError {
  return new AppError({
    code: "IDEMPOTENCY_CONFLICT",
    status: 409,
    message: "The idempotency key was already used for a different request.",
  });
}
