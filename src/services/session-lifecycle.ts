import { GuestSessionStore } from "../domain/guest-storage";
import { LocalCameraExpressionAdapter } from "./camera-expression-adapter";

export interface RegisteredSession {
  signOut(): Promise<void>;
}

/** Coordinates privacy-sensitive cleanup that must precede session changes. */
export class SessionLifecycleService {
  constructor(
    private readonly auth: RegisteredSession,
    private readonly guestStorage: GuestSessionStore,
    private readonly camera: LocalCameraExpressionAdapter,
  ) {}

  async signOutRegisteredUser(): Promise<void> {
    await this.camera.stop("sign-out");
    await this.auth.signOut();
  }

  async endGuestSession(): Promise<void> {
    await this.camera.stop("guest-expiry");
    this.guestStorage.clear();
  }

  async dispose(): Promise<void> {
    await this.camera.stop("unmount");
  }
}
