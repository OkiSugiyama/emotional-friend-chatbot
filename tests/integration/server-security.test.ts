import assert from "node:assert/strict";
import { test } from "vitest";
import { AppError, ConfigurationError } from "../../server/errors";
import { loadServerConfig } from "../../server/config";
import {
  buildDeleteOperationRecord,
  buildDeleteOperationAliasRecord,
  buildRegisteredMessageOperationRecord,
} from "../../server/firebase-adapters";
import { FirestoreGuestIdempotencyStore } from "../../server/firestore-operational-adapters";
import { getClientAddress } from "../../server/http";
import type { ApiRequest } from "../../server/http-types";
import { AllowlistLogger } from "../../server/logger";
import { HmacGuestTokenService, pseudonymousIdentifier } from "../../server/security";

const SECRET = "abcdefghijklmnopqrstuvwxyz-guest-secret-123456";

test("guest token rejects tampering and expiry", () => {
  let now = 1_800_000_000_000;
  const service = new HmacGuestTokenService(SECRET, 60, () => now);
  const issued = service.issue();
  assert.equal(service.verify(issued.token).type, "guest");

  const parts = issued.token.split(".");
  const replacement = parts[2][0] === "A" ? "B" : "A";
  const tampered = `${parts[0]}.${parts[1]}.${replacement}${parts[2].slice(1)}`;
  assert.throws(
    () => service.verify(tampered),
    (error: unknown) => error instanceof AppError && error.code === "UNAUTHENTICATED",
  );

  now += 61_000;
  assert.throws(
    () => service.verify(issued.token),
    (error: unknown) => error instanceof AppError && error.code === "UNAUTHENTICATED",
  );
});

test("pseudonymous IDs are stable and never contain the raw Firebase UID", () => {
  const first = pseudonymousIdentifier(SECRET, "safety", "registered:raw-firebase-uid");
  const second = pseudonymousIdentifier(SECRET, "safety", "registered:raw-firebase-uid");
  assert.equal(first, second);
  assert.doesNotMatch(first, /raw-firebase-uid/);
});

test("logger drops arbitrary sensitive fields at runtime", () => {
  const records: Record<string, unknown>[] = [];
  const logger = new AllowlistLogger((record) => records.push(record));
  logger.log({
    level: "error",
    event: "request.failed",
    requestId: "req-safe",
    route: "/api/test",
    status: 500,
    messageText: "PRIVATE CONVERSATION",
    authorization: "Bearer SECRET",
    stack: "STACK SECRET",
    principalHash: "stable-principal",
    safetyIntervention: true,
    safetyCategory: "specific-sensitive-category",
  } as any);
  const serialized = JSON.stringify(records);
  assert.doesNotMatch(
    serialized,
    /PRIVATE CONVERSATION|Bearer SECRET|STACK SECRET|stable-principal|specific-sensitive-category|safetyCategory/,
  );
  assert.equal(records[0].safetyIntervention, true);
  assert.match(serialized, /req-safe/);
});

test("origin configuration rejects wildcard, malformed, and insecure production values", () => {
  for (const origin of [
    "*",
    "not-an-origin",
    "ftp://app.example",
    "https://app.example/path",
    "http://app.example",
  ]) {
    assert.throws(
      () => loadServerConfig({ NODE_ENV: "production", ALLOWED_ORIGINS: origin }),
      (error: unknown) => error instanceof ConfigurationError,
    );
  }

  const development = loadServerConfig({
    NODE_ENV: "development",
    ALLOWED_ORIGINS: "http://localhost:5173,http://127.0.0.1:4173",
  });
  assert.deepEqual(
    [...development.allowedOrigins],
    ["http://localhost:5173", "http://127.0.0.1:4173"],
  );
  assert.throws(
    () => loadServerConfig({ NODE_ENV: "development", ALLOWED_ORIGINS: "http://dev.example" }),
    (error: unknown) => error instanceof ConfigurationError,
  );
});

test("Firebase emulator topology is explicit, loopback-only, and forbidden in production", () => {
  const valid = loadServerConfig({
    NODE_ENV: "test",
    FIREBASE_USE_EMULATORS: "true",
    FIREBASE_PROJECT_ID: "emotional-friend-test",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099",
    ALLOWED_ORIGINS: "http://localhost:5173",
  });
  assert.equal(valid.firebaseUseEmulators, true);
  assert.equal(valid.firebaseProjectId, "emotional-friend-test");

  for (const invalid of [
    {
      NODE_ENV: "production",
      FIREBASE_USE_EMULATORS: "true",
      FIREBASE_PROJECT_ID: "project",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    },
    {
      NODE_ENV: "development",
      FIREBASE_USE_EMULATORS: "true",
      FIREBASE_PROJECT_ID: "project",
      FIRESTORE_EMULATOR_HOST: "firestore.internal:8080",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    },
    {
      NODE_ENV: "production",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    },
  ]) {
    assert.throws(
      () => loadServerConfig(invalid),
      (error: unknown) => error instanceof ConfigurationError,
    );
  }
});

test("trusted Vercel address header outranks spoofable generic XFF", () => {
  const trusted = getClientAddress({
    headers: {
      "x-vercel-forwarded-for": "198.51.100.7",
      "x-forwarded-for": "192.0.2.99",
    },
    socket: { remoteAddress: "10.0.0.1" },
  } as ApiRequest);
  assert.equal(trusted, "198.51.100.7");

  const fallback = getClientAddress({
    headers: { "x-forwarded-for": "192.0.2.99" },
    socket: { remoteAddress: "10.0.0.1" },
  } as ApiRequest);
  assert.equal(fallback, "10.0.0.1");
});

test("registered/delete idempotency records have expiry metadata and no raw message content", () => {
  const registered = buildRegisteredMessageOperationRecord(
    {
      uid: "uid",
      chatId: "chat",
      operationKey: "op",
      requestFingerprint: "fingerprint",
      clientRequestId: "123e4567-e89b-42d3-a456-426614174000",
      userMessageId: "msg-user",
      assistantMessageId: "msg-assistant",
      text: "RAW USER MESSAGE",
      leaseMs: 10_000,
      idempotencyTtlMs: 86_400_000,
    },
    1_800_000_000_000,
  );
  const deletion = buildDeleteOperationRecord(
    {
      requestFingerprint: "delete-fingerprint",
      leaseMs: 10_000,
      idempotencyTtlMs: 86_400_000,
    },
    1_800_000_000_000,
  );
  const alias = buildDeleteOperationAliasRecord(
    "a".repeat(64),
    "delete-fingerprint",
    1_800_000_000_000,
    86_400_000,
  );
  assert.ok(registered.expiresAt);
  assert.ok(deletion.expiresAt);
  assert.ok(alias.expiresAt);
  assert.doesNotMatch(JSON.stringify({ registered, deletion, alias }), /RAW USER MESSAGE|\"text\"/);
});

test("durable guest idempotency writes metadata only and completed replay never reinvokes work", async () => {
  const fake = createFakeFirestore();
  const config = loadServerConfig({ GUEST_TOKEN_HMAC_SECRET: SECRET });
  const store = new FirestoreGuestIdempotencyStore(
    config,
    () => 1_800_000_000_000,
    fake.firestore as any,
  );
  const claimInput = {
    key: "operation-key",
    fingerprint: "fingerprint",
    userMessageId: "msg-user-stable-id",
    assistantMessageId: "msg-assistant-stable-id",
    leaseMs: 10_000,
    ttlMs: 86_400_000,
  };
  const first = await store.claim(claimInput);
  assert.equal(first.kind, "execute");
  assert.ok(fake.record?.expiresAt);

  await assert.rejects(
    store.claim(claimInput),
    (error: unknown) =>
      error instanceof AppError && error.code === "REQUEST_IN_PROGRESS" && error.retryable === true,
  );

  await store.complete("operation-key", "fingerprint", {
    userMessageId: "msg-user-stable-id",
    assistantMessageId: "msg-assistant-stable-id",
    assistantText: "RAW ASSISTANT REPLY MUST NOT BE STORED",
    variant: "assistant",
  });
  const serializedWrites = JSON.stringify(fake.writes);
  assert.doesNotMatch(
    serializedWrites,
    /RAW ASSISTANT REPLY|assistantText|ciphertext|encryptedCompletion|\"text\"/,
  );
  await assert.rejects(
    store.claim(claimInput),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === "IDEMPOTENCY_REPLAY_UNAVAILABLE" &&
      error.retryable === false,
  );
});

function createFakeFirestore() {
  const state: { record?: Record<string, unknown>; writes: Record<string, unknown>[] } = {
    writes: [],
  };
  const document = {};
  const firestore = {
    collection() {
      return { doc: () => document };
    },
    async runTransaction(callback: (transaction: any) => Promise<unknown>) {
      return callback({
        async get() {
          return {
            exists: Boolean(state.record),
            data: () => state.record,
          };
        },
        set(_document: unknown, value: Record<string, unknown>) {
          state.record = { ...value };
          state.writes.push(value);
        },
        update(_document: unknown, value: Record<string, unknown>) {
          state.record = { ...(state.record ?? {}), ...value };
          state.writes.push(value);
        },
      });
    },
  };
  return {
    firestore,
    writes: state.writes,
    get record() {
      return state.record;
    },
  };
}
