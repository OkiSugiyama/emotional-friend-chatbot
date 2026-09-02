import { describe, expect, it, vi } from "vitest";
import {
  GuestSessionStore,
  type StorageLike,
} from "../../src/domain/guest-storage";
import {
  GUEST_CLOCK_SKEW_ALLOWANCE_MS,
  GUEST_INACTIVITY_MS,
  GUEST_STORAGE_KEY,
} from "../../src/domain/constants";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("guarded guest storage", () => {
  it("round-trips a versioned session before the inactivity deadline", () => {
    const storage = new MemoryStorage();
    let now = Date.parse("2026-08-09T00:00:00.000Z");
    const store = new GuestSessionStore({ storage, now: () => now });
    const session = store.create();
    expect(store.save(session)).toEqual({ kind: "saved" });
    now += GUEST_INACTIVITY_MS - 1;
    expect(store.load()).toEqual({ kind: "restored", session });
  });

  it("expires at 30 minutes and removes the device-local data", () => {
    const storage = new MemoryStorage();
    let now = Date.parse("2026-08-09T00:00:00.000Z");
    const store = new GuestSessionStore({ storage, now: () => now });
    store.save(store.create());
    now += GUEST_INACTIVITY_MS;
    expect(store.load()).toEqual({ kind: "expired" });
    expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
  });

  it("touches at deadline minus one millisecond without reviving at the exact deadline", () => {
    const activeStorage = new MemoryStorage();
    const startedAt = Date.parse("2026-08-09T00:00:00.000Z");
    let activeNow = startedAt;
    const activeStore = new GuestSessionStore({ storage: activeStorage, now: () => activeNow });
    const activeSession = activeStore.create();
    activeStore.save(activeSession);
    activeNow = startedAt + GUEST_INACTIVITY_MS - 1;

    expect(activeStore.touchIfActive(activeSession, "message-sent")).toEqual({
      kind: "active",
      session: {
        ...activeSession,
        lastActivityAt: new Date(activeNow).toISOString(),
      },
    });
    expect(activeStorage.getItem(GUEST_STORAGE_KEY)).not.toBeNull();

    const expiredStorage = new MemoryStorage();
    let expiredNow = startedAt;
    const expiredStore = new GuestSessionStore({
      storage: expiredStorage,
      now: () => expiredNow,
    });
    const expiredSession = expiredStore.create();
    expiredStore.save(expiredSession);
    expiredNow = startedAt + GUEST_INACTIVITY_MS;

    expect(expiredStore.touchIfActive(expiredSession, "message-sent")).toEqual({
      kind: "expired",
    });
    expect(expiredStorage.getItem(GUEST_STORAGE_KEY)).toBeNull();
  });

  it("clears and rejects a touch with implausibly future activity", () => {
    const storage = new MemoryStorage();
    const now = Date.parse("2026-08-09T00:00:00.000Z");
    const store = new GuestSessionStore({ storage, now: () => now });
    const session = store.create();
    store.save(session);
    const forged = {
      ...session,
      lastActivityAt: new Date(now + GUEST_CLOCK_SKEW_ALLOWANCE_MS + 1).toISOString(),
    };

    expect(store.touchIfActive(forged, "chat-selected")).toEqual({
      kind: "invalid",
      reason: "future-activity",
    });
    expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
  });

  it("notifies observers when another tab removes the guest session", () => {
    const store = new GuestSessionStore({ storage: new MemoryStorage() });
    const listener = vi.fn();
    const unsubscribe = store.observe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: GUEST_STORAGE_KEY,
        oldValue: JSON.stringify({ schemaVersion: 1 }),
        newValue: null,
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated", newValue: null }));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: GUEST_STORAGE_KEY, newValue: null }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("allows small clock skew but clears activity timestamps farther in the future", () => {
    const storage = new MemoryStorage();
    const now = Date.parse("2026-08-09T00:00:00.000Z");
    const store = new GuestSessionStore({ storage, now: () => now });
    const session = store.create();

    const withinAllowance = {
      ...session,
      lastActivityAt: new Date(now + GUEST_CLOCK_SKEW_ALLOWANCE_MS).toISOString(),
    };
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(withinAllowance));
    expect(store.load()).toEqual({ kind: "restored", session: withinAllowance });

    const forgedFuture = {
      ...session,
      lastActivityAt: new Date(now + GUEST_CLOCK_SKEW_ALLOWANCE_MS + 1).toISOString(),
    };
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(forgedFuture));
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason: "malformed" });
    expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
  });

  it("rejects saving a session with implausibly future activity", () => {
    const now = Date.parse("2026-08-09T00:00:00.000Z");
    const store = new GuestSessionStore({ storage: new MemoryStorage(), now: () => now });
    const session = {
      ...store.create(),
      lastActivityAt: new Date(now + GUEST_CLOCK_SKEW_ALLOWANCE_MS + 1).toISOString(),
    };

    expect(() => store.save(session)).toThrowError(
      expect.objectContaining({ code: "STORAGE_INVALID" }),
    );
  });

  it.each([
    ["malformed", "{"],
    ["unsupported-version", JSON.stringify({ schemaVersion: 2 })],
  ] as const)("fails closed for %s data", (reason, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(GUEST_STORAGE_KEY, raw);
    const store = new GuestSessionStore({ storage });
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason });
    expect(storage.getItem(GUEST_STORAGE_KEY)).toBeNull();
  });

  it("checks UTF-8 bytes before parsing", () => {
    const storage = new MemoryStorage();
    storage.setItem(GUEST_STORAGE_KEY, "😀😀");
    const store = new GuestSessionStore({ storage, maxBytes: 7 });
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason: "oversized" });
  });

  it("reports quota failure without discarding the in-memory session", () => {
    const storage: StorageLike = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    const store = new GuestSessionStore({ storage });
    const result = store.save(store.create());
    expect(result.kind).toBe("quota-warning");
  });

  it("rejects cross-chat message records and restores deterministic ordering", () => {
    const storage = new MemoryStorage();
    const store = new GuestSessionStore({
      storage,
      now: () => Date.parse("2026-08-09T00:01:00.000Z"),
    });
    const base = store.create();
    const valid = {
      ...base,
      chats: [
        {
          id: "chat-b",
          title: "B",
          titleSource: "default" as const,
          createdAt: "2026-08-09T00:00:00.000Z",
          updatedAt: "2026-08-09T00:00:01.000Z",
          lastMessageAt: null,
          messages: [],
        },
        {
          id: "chat-a",
          title: "A",
          titleSource: "default" as const,
          createdAt: "2026-08-09T00:00:00.000Z",
          updatedAt: "2026-08-09T00:00:02.000Z",
          lastMessageAt: null,
          messages: [],
        },
      ],
    };
    store.save(valid);
    const restored = store.load();
    expect(restored.kind === "restored" && restored.session.chats.map((chat) => chat.id)).toEqual([
      "chat-a",
      "chat-b",
    ]);

    const forged = {
      ...valid,
      chats: [
        {
          ...valid.chats[0],
          messages: [
            {
              id: "message-1",
              chatId: "another-chat",
              role: "user",
              text: "hello",
              status: "complete",
              clientRequestId: "request-1",
              createdAt: "2026-08-09T00:00:00.000Z",
              completedAt: "2026-08-09T00:00:00.000Z",
              emotionContext: null,
            },
          ],
        },
      ],
    };
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(forged));
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason: "malformed" });
  });

  it("fails closed when restored principals or endpoint-facing IDs are malformed", () => {
    const storage = new MemoryStorage();
    const store = new GuestSessionStore({ storage });
    const base = store.create();

    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ ...base, guestId: "not-a-uuid" }));
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason: "malformed" });

    storage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        ...base,
        chats: [
          {
            id: "contains/a/slash",
            title: "Invalid",
            titleSource: "default",
            createdAt: base.createdAt,
            updatedAt: base.createdAt,
            lastMessageAt: null,
            messages: [],
          },
        ],
      }),
    );
    expect(store.load()).toEqual({ kind: "cleared-invalid", reason: "malformed" });
  });
});
