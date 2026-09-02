import { describe, expect, it, vi } from "vitest";
import type { GuestSessionStore } from "../../src/domain/guest-storage";
import type { LocalCameraExpressionAdapter } from "../../src/services/camera-expression-adapter";
import { SessionLifecycleService, type RegisteredSession } from "../../src/services/session-lifecycle";

describe("session lifecycle cleanup", () => {
  it("stops camera tracks before registered-session sign-out", async () => {
    const calls: string[] = [];
    const camera = {
      stop: vi.fn(async () => {
        calls.push("camera");
      }),
    } as unknown as LocalCameraExpressionAdapter;
    const auth = {
      signOut: vi.fn(async () => {
        calls.push("auth");
      }),
    } as unknown as RegisteredSession;
    const guest = { clear: vi.fn() } as unknown as GuestSessionStore;
    const lifecycle = new SessionLifecycleService(auth, guest, camera);
    await lifecycle.signOutRegisteredUser();
    expect(calls).toEqual(["camera", "auth"]);
    expect(camera.stop).toHaveBeenCalledWith("sign-out");
  });

  it("stops the camera and clears storage on guest expiry", async () => {
    const camera = { stop: vi.fn().mockResolvedValue(undefined) } as unknown as LocalCameraExpressionAdapter;
    const auth = { signOut: vi.fn() } as unknown as RegisteredSession;
    const guest = { clear: vi.fn() } as unknown as GuestSessionStore;
    const lifecycle = new SessionLifecycleService(auth, guest, camera);
    await lifecycle.endGuestSession();
    expect(camera.stop).toHaveBeenCalledWith("guest-expiry");
    expect(guest.clear).toHaveBeenCalledOnce();
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

