import {
  signInWithCustomToken,
  signOut as signOutFirebase,
  type Auth,
} from "firebase/auth";
import { ClientError } from "../domain/errors";

export type ClerkTokenGetter = () => Promise<string | null>;
export type BridgeWaiter = (milliseconds: number) => Promise<void>;

interface FirebaseTokenResponse {
  token?: string;
  error?: { message?: string };
}

/**
 * Gives a Clerk-authenticated user a Firebase credential scoped to the same uid.
 * Firebase remains a data service; Clerk is the source of identity and sessions.
 */
export class ClerkFirebaseBridge {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly auth: Auth,
    fetchImpl: typeof fetch = fetch,
    private readonly wait: BridgeWaiter = (milliseconds) =>
      new Promise((resolve) => window.setTimeout(resolve, milliseconds)),
  ) {
    // Browser-native fetch implementations can reject when invoked as an object
    // method because that supplies the bridge as their `this` value.
    this.fetchImpl = (...args) => fetchImpl(...args);
  }

  async synchronize(userId: string, getClerkToken: ClerkTokenGetter): Promise<void> {
    if (this.auth.currentUser?.uid === userId) return;
    if (this.auth.currentUser) await signOutFirebase(this.auth);

    const clerkToken = await this.getClerkTokenWithRetry(getClerkToken);
    let response: Response;
    try {
      response = await this.fetchImpl("/api/v1/data-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${clerkToken}` },
      });
    } catch (error) {
      throw new ClientError({
        code: "NETWORK_UNAVAILABLE",
        message: "The secure data session could not reach the server. Please try again.",
        retryable: true,
        cause: error,
      });
    }
    const body = (await response.json().catch(() => null)) as FirebaseTokenResponse | null;
    if (!response.ok || !body?.token) {
      throw new ClientError({
        code: response.status === 401 ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: body?.error?.message || "Your account session could not be prepared.",
        retryable: response.status >= 500,
      });
    }
    let credential: Awaited<ReturnType<typeof signInWithCustomToken>>;
    try {
      credential = await signInWithCustomToken(this.auth, body.token);
    } catch (error) {
      throw new ClientError({
        code: "AUTH_CONFIGURATION",
        message: "The Firebase data session could not be started. Please try again.",
        retryable: true,
        cause: error,
      });
    }
    if (credential.user.uid !== userId) {
      await signOutFirebase(this.auth);
      throw unauthenticated();
    }
  }

  private async getClerkTokenWithRetry(getClerkToken: ClerkTokenGetter): Promise<string> {
    const retryDelays = [0, 300, 900] as const;
    let lastError: unknown;
    for (const delay of retryDelays) {
      if (delay > 0) await this.wait(delay);
      try {
        const token = await getClerkToken();
        if (token) return token;
        lastError = new Error("Clerk returned no active session token.");
      } catch (error) {
        lastError = error;
      }
    }
    throw new ClientError({
      code: "UNAUTHENTICATED",
      message: "Your Clerk session token could not be prepared. Refresh and sign in again.",
      retryable: true,
      cause: lastError,
    });
  }

  async getFirebaseToken(forceRefresh = false): Promise<string | null> {
    return this.auth.currentUser?.getIdToken(forceRefresh) ?? null;
  }

  async signOut(): Promise<void> {
    if (this.auth.currentUser) await signOutFirebase(this.auth);
  }
}

function unauthenticated(): ClientError {
  return new ClientError({
    code: "UNAUTHENTICATED",
    message: "Sign in again to continue.",
    retryable: false,
  });
}
