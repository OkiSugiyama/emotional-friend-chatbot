import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Auth } from "firebase/auth";

const firebaseAuthMocks = vi.hoisted(() => ({
  signInWithCustomToken: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return { ...actual, ...firebaseAuthMocks };
});

import { ClerkFirebaseBridge } from "../../src/services/clerk-firebase-bridge";

describe("Clerk-to-Firebase data session bridge", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exchanges a Clerk session token and signs into Firebase with the returned custom token", async () => {
    const auth = { currentUser: null } as unknown as Auth;
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ token: "firebase-custom-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    firebaseAuthMocks.signInWithCustomToken.mockResolvedValue({
      user: { uid: "user_clerk123" },
    });
    const bridge = new ClerkFirebaseBridge(auth, fetchImpl as typeof fetch);

    await bridge.synchronize("user_clerk123", async () => "clerk-session-token");

    expect(fetchImpl).toHaveBeenCalledWith("/api/v1/data-session", {
      method: "POST",
      headers: { Authorization: "Bearer clerk-session-token" },
    });
    expect(firebaseAuthMocks.signInWithCustomToken).toHaveBeenCalledWith(
      auth,
      "firebase-custom-token",
    );
  });

  it("invokes a browser fetch implementation without binding it to the bridge", async () => {
    const auth = { currentUser: null } as unknown as Auth;
    let observedThis: unknown = "not-called";
    const fetchImpl = vi.fn(function (this: unknown) {
      observedThis = this;
      return Promise.resolve(
        new Response(JSON.stringify({ token: "firebase-custom-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch;
    firebaseAuthMocks.signInWithCustomToken.mockResolvedValue({
      user: { uid: "user_clerk123" },
    });
    const bridge = new ClerkFirebaseBridge(auth, fetchImpl);

    await bridge.synchronize("user_clerk123", async () => "clerk-session-token");

    expect(observedThis).toBeUndefined();
  });

  it("does not exchange another token when Firebase already represents the Clerk user", async () => {
    const auth = { currentUser: { uid: "user_same" } } as unknown as Auth;
    const fetchImpl = vi.fn();
    const bridge = new ClerkFirebaseBridge(auth, fetchImpl as typeof fetch);

    await bridge.synchronize("user_same", async () => "unused");

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(firebaseAuthMocks.signInWithCustomToken).not.toHaveBeenCalled();
  });

  it("retries a transient Clerk token failure before preparing the Firebase session", async () => {
    const auth = { currentUser: null } as unknown as Auth;
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ token: "firebase-custom-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const getClerkToken = vi
      .fn<() => Promise<string | null>>()
      .mockRejectedValueOnce(new Error("Clerk token endpoint is still becoming available"))
      .mockResolvedValue("clerk-session-token");
    const wait = vi.fn(async () => undefined);
    firebaseAuthMocks.signInWithCustomToken.mockResolvedValue({
      user: { uid: "user_clerk123" },
    });
    const bridge = new ClerkFirebaseBridge(auth, fetchImpl as typeof fetch, wait);

    await bridge.synchronize("user_clerk123", getClerkToken);

    expect(getClerkToken).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(300);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns an actionable error after Clerk token retries are exhausted", async () => {
    const auth = { currentUser: null } as unknown as Auth;
    const fetchImpl = vi.fn();
    const getClerkToken = vi.fn(async () => null);
    const wait = vi.fn(async () => undefined);
    const bridge = new ClerkFirebaseBridge(auth, fetchImpl as typeof fetch, wait);

    await expect(bridge.synchronize("user_clerk123", getClerkToken)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      retryable: true,
      message: "Your Clerk session token could not be prepared. Refresh and sign in again.",
    });

    expect(getClerkToken).toHaveBeenCalledTimes(3);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
