import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type RefCallback,
} from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/react";
import type { FirebaseOptions } from "firebase/app";
import AppView, {
  type AppViewActionProps,
  type AppViewSession,
  type AuthViewState,
  type CameraErrorReason,
  type CameraViewState,
} from "./components/AppView";
import {
  chatReducer,
  initialChatState,
  type SendOperation,
} from "./domain/chat-reducer";
import { ExpressionStabilizer, UNAVAILABLE_EMOTION_CONTEXT } from "./domain/emotion";
import { ClientError } from "./domain/errors";
import {
  GuestSessionStore,
  type GuestActivity,
} from "./domain/guest-storage";
import {
  createGuestChat,
  createOptimisticSend,
  deleteGuestChat,
  deleteGuestMessage,
  renameGuestChat,
} from "./services/chat-crud";
import { LocalCameraExpressionAdapter } from "./services/camera-expression-adapter";
import { ClerkFirebaseBridge } from "./services/clerk-firebase-bridge";
import { createFirebaseClient, type FirebaseClient } from "./services/firebase-client";
import {
  FirestoreChatRepository,
  ensureFirestoreUserProfile,
  type ChatPageCursor,
  type MessagePageCursor,
} from "./services/firestore-repository";
import { HttpChatClient, type ChatPrincipal } from "./services/http-chat-client";
import { reportClientEvent } from "./services/client-telemetry";
import type {
  AppUser,
  Chat,
  ChatGenerationRequest,
  ChatGenerationResponse,
  EmotionContext,
  GuestSession,
  Message,
} from "./types";

interface GuestCredential {
  token: string;
  guestId: string;
  expiresAt: string;
}

interface DeleteChatApiResponse {
  requestId: string;
  operationId: string;
  status: "pending" | "complete";
}

const initialAuth: AuthViewState = { kind: "sign-in" };

function firebaseOptionsFromEnvironment(): FirebaseOptions | null {
  const options: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  return options.apiKey && options.authDomain && options.projectId && options.appId
    ? options
    : null;
}

function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof ClientError && error.message ? error.message : fallback;
}

function chatFailureCategory(error: unknown) {
  if (!(error instanceof ClientError)) return "client_error" as const;
  if (error.code === "UNAUTHENTICATED") return "auth_token_failure" as const;
  if (error.code === "INVALID_REQUEST") return "request_validation_failure" as const;
  if (error.code === "NETWORK_UNAVAILABLE") return "network_failure" as const;
  return "api_failure" as const;
}

function cameraReason(code?: string): CameraErrorReason {
  switch (code) {
    case "CAMERA_PERMISSION_DENIED":
      return "permission-denied";
    case "CAMERA_DEVICE_UNAVAILABLE":
      return "no-device";
    case "CAMERA_DEVICE_BUSY":
      return "in-use";
    case "CAMERA_UNSUPPORTED":
      return "unsupported";
    case "CAMERA_INSECURE_CONTEXT":
      return "insecure-context";
    case "CAMERA_MODEL_UNAVAILABLE":
      return "model-load";
    case "CAMERA_INFERENCE_FAILED":
      return "inference";
    default:
      return "unknown";
  }
}

function waitFor(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function replaceGuestMessages(
  session: GuestSession,
  chatId: string,
  update: (messages: Message[]) => Message[],
): GuestSession {
  const now = new Date().toISOString();
  return {
    ...session,
    chats: session.chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            messages: update(chat.messages),
            updatedAt: now,
            lastMessageAt: now,
          }
        : chat,
    ),
  };
}

function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const privacy = kind === "privacy";
  return (
    <main className="ss-legal-page">
      <article className="ss-legal-card">
        <a className="ss-legal-back" href="/">← Back to Emotional Friend</a>
        <p className="ss-legal-kicker">Pre-launch review draft</p>
        <h1>{privacy ? "Privacy notice" : "Terms of use"}</h1>
        <p className="ss-legal-alert">
          This draft must receive legal and privacy approval, operator details, a contact path,
          launch regions, and an effective date before public launch.
        </p>
        {privacy ? (
          <>
            <h2>Conversation data</h2>
            <p>
              Registered conversations are stored in Firebase under the signed-in account.
              Demo conversations stay in this browser and clear after 30 minutes of inactivity.
              A message and bounded recent context are sent to the configured AI provider to
              produce a reply.
            </p>
            <h2>Optional expression context</h2>
            <p>
              Camera use is optional and off by default. Estimation runs locally. Frames, video,
              landmarks, embeddings, biometric templates, and screenshots are never persisted or
              uploaded. With a separate enabled toggle, only a normalized label, coarse confidence
              band, model version, and observation time may accompany a message.
            </p>
            <h2>Operations and control</h2>
            <p>
              Routine logs exclude message text, AI replies, camera data, email addresses, and raw
              user IDs. You can chat without a camera, stop it at any time, disable use of an
              estimate, and delete messages or chats.
            </p>
          </>
        ) : (
          <>
            <h2>Intended use</h2>
            <p>
              The provisional public MVP is for adults 18 and over. Emotional Friend offers general
              conversational support. It is not a therapist, medical device, diagnostic service,
              emergency service, or substitute for qualified care.
            </p>
            <h2>Safety and acceptable use</h2>
            <p>
              If someone may be in immediate danger, contact local emergency services or a trusted
              nearby person. No human is monitoring conversations. Do not use the service to harm
              others, access another person’s data, bypass limits, or introduce malicious content.
            </p>
            <h2>Service limits</h2>
            <p>
              AI replies and expression estimates can be inaccurate. The service depends on
              third-party authentication, storage, hosting, and AI systems and may be interrupted.
              Demo data does not transfer automatically when an account is created.
            </p>
          </>
        )}
        <p className="ss-legal-note">
          Emotional Friend offers conversational support, not medical or emergency care.
        </p>
      </article>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/u, "") || "/";
  if (path === "/privacy") return <LegalPage kind="privacy" />;
  if (path === "/terms") return <LegalPage kind="terms" />;
  return <ProductApp />;
}

function ClerkAuthPanel({
  error,
  onStartGuest,
}: {
  error?: string | null;
  onStartGuest: () => void;
}) {
  return (
    <div className="ss-auth-form">
      <h1>Welcome back</h1>
      {error && <div className="ss-inline-error" role="alert">{error}</div>}
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="ss-button ss-button--primary ss-button--full" type="button">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="ss-button ss-button--secondary ss-button--full" type="button">
            Create account
          </button>
        </SignUpButton>
        <button
          className="ss-button ss-button--secondary ss-button--full"
          type="button"
          onClick={onStartGuest}
        >
          Try the private demo
        </button>
        <p className="ss-auth-form__help">Demo conversations stay only in this browser.</p>
      </Show>
      <Show when="signed-in">
        <p className="ss-auth-form__intro">
          {error ? "Your sign-in succeeded, but the data session could not be prepared." : "Finishing your account setup…"}
        </p>
        <UserButton />
      </Show>
    </div>
  );
}

function ProductApp() {
  const { isLoaded: clerkLoaded, isSignedIn, userId, getToken: getClerkToken } = useAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const firebaseOptions = useMemo(firebaseOptionsFromEnvironment, []);
  const firebase = useMemo<FirebaseClient | null>(
    () => (firebaseOptions ? createFirebaseClient(firebaseOptions) : null),
    [firebaseOptions],
  );
  const firebaseBridge = useMemo(
    () => (firebase ? new ClerkFirebaseBridge(firebase.auth) : null),
    [firebase],
  );
  const registeredUser = useMemo<AppUser | null>(() => {
    if (!userId || !clerkUser) return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
    return {
      kind: "registered",
      uid: userId,
      displayName: clerkUser.fullName || clerkUser.firstName || email,
      email,
    };
  }, [clerkUser, userId]);
  const guestStore = useMemo(() => new GuestSessionStore(), []);
  const chatClient = useMemo(() => new HttpChatClient(), []);
  const cameraAdapter = useMemo(() => new LocalCameraExpressionAdapter(), []);
  const stabilizer = useMemo(() => new ExpressionStabilizer(), []);

  const [session, setSession] = useState<AppViewSession>("initializing");
  const sessionRef = useRef<AppViewSession>(session);
  const [auth, setAuth] = useState<AuthViewState>(initialAuth);
  const [user, setUser] = useState<AppUser | null>(null);
  const [chatState, dispatch] = useReducer(chatReducer, initialChatState);
  const chatStateRef = useRef(chatState);
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const guestRef = useRef<GuestSession | null>(guest);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [chatListError, setChatListError] = useState<string | null>(null);
  const [messageListError, setMessageListError] = useState<string | null>(null);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [deletingChatIds, setDeletingChatIds] = useState<string[]>([]);
  const [camera, setCamera] = useState<CameraViewState>({
    phase: "off",
    useEstimate: false,
    label: null,
    confidenceBand: null,
  });

  const repositoryRef = useRef<FirestoreChatRepository | null>(null);
  const registeredUidRef = useRef<string | null>(null);
  const authGenerationRef = useRef(0);
  const chatCursorRef = useRef<ChatPageCursor | undefined>(undefined);
  const messageCursorRef = useRef<Record<string, MessagePageCursor | undefined>>({});
  const credentialRef = useRef<GuestCredential | null>(null);
  const deleteRequestKeysRef = useRef<Record<string, string>>({});
  const sendControllersRef = useRef<Map<string, AbortController>>(new Map());
  const detachedVideoRef = useRef<HTMLVideoElement | null>(null);
  const activePreviewRef = useRef<HTMLVideoElement | null>(null);
  const preferWelcomeRef = useRef(false);
  const stableEmotionRef = useRef<EmotionContext>({ ...UNAVAILABLE_EMOTION_CONTEXT });

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);
  useEffect(() => {
    guestRef.current = guest;
  }, [guest]);

  const stopCamera = useCallback(
    async (reason: "user" | "sign-out" | "guest-expiry" | "unmount" = "user") => {
      await cameraAdapter.stop(reason);
      stableEmotionRef.current = stabilizer.reset();
      setCamera({ phase: "off", useEstimate: false, label: null, confidenceBand: null });
    },
    [cameraAdapter, stabilizer],
  );

  const abortPendingSends = useCallback(() => {
    for (const controller of sendControllersRef.current.values()) {
      controller.abort(new DOMException("Session changed", "AbortError"));
    }
    sendControllersRef.current.clear();
  }, []);

  const commitGuest = useCallback(
    (next: GuestSession, activity?: GuestActivity) => {
      const touched = activity ? guestStore.touchIfActive(next, activity) : null;
      if (touched && touched.kind !== "active") {
        credentialRef.current = null;
        abortPendingSends();
        guestRef.current = null;
        setGuest(null);
        setUser(null);
        dispatch({ type: "state/cleared" });
        void stopCamera("guest-expiry");
        setSession("guest-expired");
        return null;
      }
      const value = touched?.kind === "active" ? touched.session : next;
      guestRef.current = value;
      setGuest(value);
      try {
        const saved = guestStore.save(value);
        setStorageWarning(saved.kind === "quota-warning" ? saved.error.message : null);
      } catch (error) {
        reportClientEvent("storage_failure");
        setStorageWarning(errorMessage(error, "This demo conversation may not persist."));
      }
      return value;
    },
    [abortPendingSends, guestStore, stopCamera],
  );

  const cascadeDelete = useCallback(
    async (chatId: string, signal?: AbortSignal) => {
      const token = await getClerkToken();
      if (!token) {
        throw new ClientError({ code: "UNAUTHENTICATED", message: "Sign in again to continue." });
      }
      const operationKey = deleteRequestKeysRef.current[chatId] ?? crypto.randomUUID();
      deleteRequestKeysRef.current[chatId] = operationKey;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const response = await fetch(`/api/v1/chats/${encodeURIComponent(chatId)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": operationKey,
          },
          signal,
        });
        const body = (await response.json().catch(() => null)) as
          | DeleteChatApiResponse
          | { error?: { code?: string; message?: string; retryable?: boolean } }
          | null;
        if (!response.ok) {
          if (
            response.status === 409 &&
            body &&
            "error" in body &&
            body.error?.code === "REQUEST_IN_PROGRESS" &&
            body.error.retryable
          ) {
            const retryAfter = Number(response.headers.get("Retry-After"));
            await waitFor(Number.isFinite(retryAfter) ? Math.max(1_000, retryAfter * 1_000) : 3_000, signal);
            continue;
          }
          throw new ClientError({
            code: "INTERNAL_ERROR",
            message:
              body && "error" in body && body.error?.message
                ? body.error.message
                : "The chat could not be deleted.",
          });
        }
        if (!body || !("status" in body) || !("operationId" in body)) {
          throw new ClientError({
            code: "INVALID_RESPONSE",
            message: "The deletion status could not be verified.",
          });
        }
        if (body.status === "complete") {
          delete deleteRequestKeysRef.current[chatId];
          return;
        }
        if (body.status !== "pending") {
          throw new ClientError({
            code: "INVALID_RESPONSE",
            message: "The deletion status could not be verified.",
          });
        }
        await waitFor(3_000, signal);
      }
      throw new ClientError({
        code: "REQUEST_IN_PROGRESS",
        message: "Deletion is still in progress. Try again to continue safely.",
        retryable: true,
      });
    },
    [getClerkToken],
  );

  const loadRegisteredChats = useCallback(
    async (uid: string, generation = authGenerationRef.current) => {
      if (!firebase) return;
      const repository = new FirestoreChatRepository(firebase.firestore, uid, cascadeDelete);
      if (
        registeredUidRef.current !== uid ||
        authGenerationRef.current !== generation
      ) {
        return;
      }
      repositoryRef.current = repository;
      dispatch({ type: "chats/load-started" });
      setChatListError(null);
      try {
        const page = await repository.listChats();
        if (
          registeredUidRef.current !== uid ||
          authGenerationRef.current !== generation ||
          repositoryRef.current !== repository
        ) {
          return;
        }
        dispatch({ type: "chats/load-succeeded", chats: page.items });
        chatCursorRef.current = page.nextCursor ?? undefined;
        setHasMoreChats(Boolean(page.nextCursor));
      } catch (error) {
        if (
          registeredUidRef.current !== uid ||
          authGenerationRef.current !== generation ||
          repositoryRef.current !== repository
        ) {
          return;
        }
        setChatListError(errorMessage(error, "Couldn’t load your chats."));
        dispatch({
          type: "chats/load-failed",
          error: error instanceof Error ? (error as never) : (new Error("load failed") as never),
        });
      }
    },
    [cascadeDelete, firebase],
  );

  useEffect(() => {
    const restored = guestStore.load();
    const restoredGuest = restored.kind === "restored" ? restored.session : null;
    if (restoredGuest) {
      setGuest(restoredGuest);
      guestRef.current = restoredGuest;
      dispatch({ type: "chats/load-succeeded", chats: restoredGuest.chats });
    }

    if (!clerkLoaded) {
      setSession("initializing");
      return;
    }

    let cancelled = false;
    if (isSignedIn && registeredUser && firebase && firebaseBridge) {
      void (async () => {
        const previousUid = registeredUidRef.current;
        if (previousUid === registeredUser.uid && repositoryRef.current) {
          setUser(registeredUser);
          setSession("registered");
          return;
        }
        const generation = authGenerationRef.current + 1;
        authGenerationRef.current = generation;
        registeredUidRef.current = registeredUser.uid;
        abortPendingSends();
        preferWelcomeRef.current = false;
        repositoryRef.current = null;
        chatCursorRef.current = undefined;
        messageCursorRef.current = {};
        setHasMoreChats(false);
        setHasOlderMessages(false);
        setDeletingChatIds([]);
        setChatListError(null);
        setMessageListError(null);
        dispatch({ type: "state/cleared" });
        if (previousUid && previousUid !== registeredUser.uid) void stopCamera("sign-out");
        if (guestRef.current) {
          guestStore.clear();
          guestRef.current = null;
          credentialRef.current = null;
          setGuest(null);
          void stopCamera("user");
        }
        deleteRequestKeysRef.current = {};
        setUser(registeredUser);
        setSession("initializing");
        setAuth({ kind: "sign-in" });
        try {
          await firebaseBridge.synchronize(registeredUser.uid, getClerkToken);
          if (
            cancelled ||
            registeredUidRef.current !== registeredUser.uid ||
            authGenerationRef.current !== generation
          ) {
            return;
          }
          setSession("registered");
          await ensureFirestoreUserProfile(firebase.firestore, registeredUser);
          await loadRegisteredChats(registeredUser.uid, generation);
        } catch (error) {
          if (cancelled || authGenerationRef.current !== generation) return;
          reportClientEvent(chatFailureCategory(error));
          registeredUidRef.current = null;
          repositoryRef.current = null;
          setSession("anonymous");
          setAuth({ kind: "sign-in", formError: errorMessage(error, "Your account could not be prepared.") });
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const registeredSessionLost = registeredUidRef.current !== null;
    authGenerationRef.current += 1;
    registeredUidRef.current = null;
    abortPendingSends();
    setUser(null);
    repositoryRef.current = null;
    chatCursorRef.current = undefined;
    messageCursorRef.current = {};
    deleteRequestKeysRef.current = {};
    void firebaseBridge?.signOut();
    if (registeredSessionLost) {
      dispatch({ type: "state/cleared" });
      setHasMoreChats(false);
      setHasOlderMessages(false);
      setDeletingChatIds([]);
      setChatListError(null);
      setMessageListError(null);
      void stopCamera("sign-out");
    }
    if (preferWelcomeRef.current) {
      preferWelcomeRef.current = false;
      dispatch({ type: "state/cleared" });
      setSession("anonymous");
    } else if (sessionRef.current === "initializing" && restored.kind === "expired") {
      setSession("guest-expired");
    } else {
      setSession(guestRef.current ? "guest" : "anonymous");
    }
  }, [
    abortPendingSends,
    clerkLoaded,
    firebase,
    firebaseBridge,
    getClerkToken,
    guestStore,
    isSignedIn,
    loadRegisteredChats,
    registeredUser,
    stopCamera,
  ]);

  useEffect(
    () =>
      guestStore.observe(() => {
        if (sessionRef.current === "registered") return;
        const previousSession = sessionRef.current;
        const previousGuestId = guestRef.current?.guestId;
        const observed = guestStore.load();
        if (observed.kind === "restored") {
          if (previousGuestId && previousGuestId !== observed.session.guestId) {
            credentialRef.current = null;
            void stopCamera("user");
          }
          guestRef.current = observed.session;
          setGuest(observed.session);
          setUser({
            kind: "guest",
            uid: observed.session.guestId,
            displayName: "Guest",
            email: null,
          });
          dispatch({ type: "chats/load-succeeded", chats: observed.session.chats });
          if (previousSession === "guest" || !previousGuestId) setSession("guest");
          return;
        }
        if (!previousGuestId) return;
        credentialRef.current = null;
        abortPendingSends();
        guestRef.current = null;
        setGuest(null);
        setUser(null);
        dispatch({ type: "state/cleared" });
        void stopCamera("guest-expiry");
        setSession("guest-expired");
      }),
    [abortPendingSends, guestStore, stopCamera],
  );

  useEffect(() => {
    if (session !== "registered" || !chatState.activeChatId || !repositoryRef.current) return;
    const chatId = chatState.activeChatId;
    const repository = repositoryRef.current;
    const uid = registeredUidRef.current;
    const generation = authGenerationRef.current;
    if (!uid) return;
    const requestId = crypto.randomUUID();
    dispatch({ type: "messages/load-started", chatId, requestId });
    setMessageListError(null);
    void repository
      .listMessages(chatId)
      .then((page) => {
        if (
          registeredUidRef.current !== uid ||
          authGenerationRef.current !== generation ||
          repositoryRef.current !== repository
        ) {
          return;
        }
        dispatch({ type: "messages/load-succeeded", chatId, requestId, messages: page.items });
        messageCursorRef.current[chatId] = page.nextCursor ?? undefined;
        setHasOlderMessages(Boolean(page.nextCursor));
      })
      .catch((error) => {
        if (
          registeredUidRef.current !== uid ||
          authGenerationRef.current !== generation ||
          repositoryRef.current !== repository
        ) {
          return;
        }
        setMessageListError(errorMessage(error, "Couldn’t load this conversation."));
        dispatch({
          type: "messages/load-failed",
          chatId,
          requestId,
          error: error instanceof Error ? (error as never) : (new Error("load failed") as never),
        });
      });
  }, [chatState.activeChatId, session]);

  useEffect(() => {
    if (!guest) return;
    const expireIfInactive = () => {
      const current = guestRef.current;
      if (!current) return;
      if (Date.now() - Date.parse(current.lastActivityAt) < 30 * 60 * 1_000) return;
      guestStore.clear();
      guestRef.current = null;
      credentialRef.current = null;
      abortPendingSends();
      setGuest(null);
      dispatch({ type: "state/cleared" });
      void stopCamera("guest-expiry");
      setSession("guest-expired");
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") expireIfInactive();
    };
    const interval = window.setInterval(expireIfInactive, 10_000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", expireIfInactive);
    expireIfInactive();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", expireIfInactive);
    };
  }, [abortPendingSends, guest, guestStore, stopCamera]);

  useEffect(() => () => void stopCamera("unmount"), [stopCamera]);

  const startGuest = useCallback(() => {
    preferWelcomeRef.current = false;
    abortPendingSends();
    credentialRef.current = null;
    const next = guestStore.create();
    commitGuest(next);
    dispatch({ type: "chats/load-succeeded", chats: [] });
    setSession("guest");
    setUser({ kind: "guest", uid: next.guestId, displayName: "Guest", email: null });
  }, [abortPendingSends, commitGuest, guestStore]);

  const getGuestPrincipal = useCallback(async (
    expectedGuestId: string,
    signal: AbortSignal,
  ): Promise<ChatPrincipal> => {
    const current = credentialRef.current;
    if (
      current?.guestId === expectedGuestId &&
      Date.parse(current.expiresAt) - Date.now() > 60_000
    ) {
      return { kind: "guest", guestId: current.guestId, guestSessionToken: current.token };
    }
    const localGuestId = guestRef.current?.guestId;
    if (
      !localGuestId ||
      localGuestId !== expectedGuestId ||
      sessionRef.current !== "guest" ||
      signal.aborted
    ) {
      throw new ClientError({
        code: "UNAUTHENTICATED",
        message: "Start a new demo session to continue.",
      });
    }
    const response = await fetch("/api/v1/guest-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: localGuestId }),
      signal,
    });
    const body = (await response.json().catch(() => null)) as GuestCredential | null;
    if (
      !response.ok ||
      !body?.token ||
      !body.guestId ||
      !body.expiresAt ||
      body.guestId !== localGuestId ||
      guestRef.current?.guestId !== expectedGuestId ||
      sessionRef.current !== "guest" ||
      signal.aborted
    ) {
      throw new ClientError({
        code: "UNAUTHENTICATED",
        message: "Demo messaging is temporarily unavailable.",
      });
    }
    credentialRef.current = body;
    return { kind: "guest", guestId: body.guestId, guestSessionToken: body.token };
  }, []);

  const persistGuestSendResult = useCallback(
    (
      chatId: string,
      operation: SendOperation,
      response?: ChatGenerationResponse,
      failed = false,
    ) => {
      const current = guestRef.current;
      if (!current) return;
      const completedAt = new Date().toISOString();
      const next = replaceGuestMessages(current, chatId, (messages) =>
        messages.map((message) => {
          if (message.id === operation.userMessageId) {
            return response
              ? { ...message, id: response.userMessage.id, status: response.userMessage.status, completedAt }
              : { ...message, status: "complete" };
          }
          if (message.id === operation.assistantPlaceholderId) {
            if (response) {
              return {
                ...message,
                id: response.assistantMessage.id,
                text: response.assistantMessage.text,
                status: response.assistantMessage.status,
                safetySupport: response.assistantMessage.safetySupport,
                completedAt,
              };
            }
            return failed ? { ...message, status: "failed" } : message;
          }
          return message;
        }),
      );
      commitGuest(next);
    },
    [commitGuest],
  );

  const sendWithOperation = useCallback(
    async (chatId: string, text: string, existingOperation?: SendOperation) => {
      const currentChat = chatStateRef.current.chatsById[chatId];
      if (!currentChat) return;
      const startingSession = sessionRef.current;
      const registeredScope =
        startingSession === "registered"
          ? {
              uid: registeredUidRef.current,
              generation: authGenerationRef.current,
            }
          : null;
      const guestId = startingSession === "guest" ? guestRef.current?.guestId : null;
      const requestStillCurrent = () =>
        registeredScope
          ? sessionRef.current === "registered" &&
            Boolean(registeredScope.uid) &&
            registeredUidRef.current === registeredScope.uid &&
            authGenerationRef.current === registeredScope.generation
          : startingSession === "guest" &&
            sessionRef.current === "guest" &&
            Boolean(guestId) &&
            guestRef.current?.guestId === guestId;
      if (!requestStillCurrent()) return;
      if (sessionRef.current === "guest" && guestRef.current) {
        const activeGuest = commitGuest(guestRef.current, "message-sent");
        if (!activeGuest) return;
      }
      const context = camera.useEstimate ? stableEmotionRef.current : null;
      const optimistic = existingOperation
        ? null
        : createOptimisticSend({ chatId, text, emotionContext: context });
      const operation = existingOperation ?? optimistic!.operation;

      if (optimistic) {
        dispatch({
          type: "send/started",
          operation,
          userMessage: optimistic.userMessage,
          assistantPlaceholder: optimistic.assistantPlaceholder,
        });
        if (sessionRef.current === "guest" && guestRef.current) {
          const next = replaceGuestMessages(guestRef.current, chatId, (messages) => [
            ...messages,
            optimistic.userMessage,
            optimistic.assistantPlaceholder,
          ]);
          commitGuest(next);
        }
      } else {
        dispatch({ type: "send/retry-started", clientRequestId: operation.clientRequestId });
      }

      const history = currentChat.messages
        .filter(
          (message) =>
            message.status === "complete" &&
            (message.role === "user" || message.role === "assistant") &&
            message.text.trim(),
        )
        .slice(-5)
        .map(({ role, text: historyText }) => ({ role: role as "user" | "assistant", text: historyText }));
      const request: ChatGenerationRequest = {
        text,
        history,
        ...(context?.label && context.label !== "unavailable" ? { emotionContext: context } : {}),
      };
      const controller = new AbortController();
      const priorController = sendControllersRef.current.get(operation.clientRequestId);
      priorController?.abort(new DOMException("Superseded", "AbortError"));
      sendControllersRef.current.set(operation.clientRequestId, controller);

      try {
        const principal: ChatPrincipal =
          startingSession === "registered"
            ? {
                kind: "registered",
                getIdToken: async () => {
                  if (!requestStillCurrent() || controller.signal.aborted) return null;
                  const token = await getClerkToken();
                  return requestStillCurrent() && !controller.signal.aborted ? token ?? null : null;
                },
              }
            : await getGuestPrincipal(guestId!, controller.signal);
        if (!requestStillCurrent() || controller.signal.aborted) return;
        const response = await chatClient.send({
          chatId,
          clientRequestId: operation.clientRequestId,
          principal,
          request,
          signal: controller.signal,
        });
        if (!requestStillCurrent()) return;
        const completedAt = new Date().toISOString();
        dispatch({
          type: "send/succeeded",
          clientRequestId: operation.clientRequestId,
          response,
          completedAt,
        });
        if (sessionRef.current === "guest") {
          persistGuestSendResult(chatId, operation, response);
        }
      } catch (error) {
        if (!requestStillCurrent() || controller.signal.aborted) return;
        reportClientEvent(chatFailureCategory(error));
        dispatch({
          type: "send/failed",
          clientRequestId: operation.clientRequestId,
          error: error instanceof Error ? (error as never) : (new Error("send failed") as never),
        });
        if (sessionRef.current === "guest") {
          persistGuestSendResult(chatId, operation, undefined, true);
        }
      } finally {
        if (sendControllersRef.current.get(operation.clientRequestId) === controller) {
          sendControllersRef.current.delete(operation.clientRequestId);
        }
      }
    },
    [camera.useEstimate, chatClient, commitGuest, getClerkToken, getGuestPrincipal, persistGuestSendResult],
  );

  const beginCamera = useCallback(async () => {
    if (sessionRef.current === "registered") {
      const uid = registeredUidRef.current;
      const generation = authGenerationRef.current;
      const repository = repositoryRef.current;
      if (!uid || !repository) {
        setCamera({
          phase: "unavailable",
          useEstimate: false,
          label: null,
          confidenceBand: null,
          errorReason: "unknown",
          errorMessage: null,
        });
        return;
      }
      try {
        await repository.recordCameraNoticeAcceptance();
      } catch {
        stableEmotionRef.current = stabilizer.reset();
        setCamera({
          phase: "unavailable",
          useEstimate: false,
          label: null,
          confidenceBand: null,
          errorReason: "unknown",
          errorMessage: null,
        });
        return;
      }
      if (
        sessionRef.current !== "registered" ||
        registeredUidRef.current !== uid ||
        authGenerationRef.current !== generation ||
        repositoryRef.current !== repository
      ) {
        return;
      }
    }
    if (!detachedVideoRef.current) {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      detachedVideoRef.current = video;
    }
    if (sessionRef.current === "guest" && guestRef.current) {
      const activeGuest = commitGuest(guestRef.current, "camera-started");
      if (!activeGuest) return;
    }
    setCamera((current) => ({ ...current, phase: "model-loading", label: null }));
    await cameraAdapter.start({
      preview: detachedVideoRef.current,
      onEvent: (event) => {
        if (event.type === "model-loading") {
          setCamera((current) => ({ ...current, phase: "model-loading" }));
        } else if (event.type === "permission-pending") {
          setCamera((current) => ({ ...current, phase: "permission-pending" }));
        } else if (event.type === "started") {
          setCamera((current) => ({ ...current, phase: "no-face" }));
        } else if (event.type === "no-face") {
          stableEmotionRef.current = stabilizer.reset();
          setCamera((current) => ({ ...current, phase: "no-face", label: null, confidenceBand: null }));
        } else if (event.type === "estimate") {
          const stable = stabilizer.accept(event.estimate);
          stableEmotionRef.current = stable;
          setCamera((current) =>
            stable.label === "unavailable"
              ? { ...current, phase: "no-face", label: null, confidenceBand: null }
              : {
                  ...current,
                  phase: "on",
                  label: stable.label,
                  confidenceBand: stable.confidenceBand,
                },
          );
        } else if (event.type === "unavailable") {
          const reason = cameraReason(event.error.code);
          stableEmotionRef.current = stabilizer.reset();
          setCamera((current) => ({
            ...current,
            phase: reason === "permission-denied" ? "denied" : "unavailable",
            useEstimate: false,
            errorReason: reason,
            errorMessage: null,
            label: null,
            confidenceBand: null,
          }));
        } else if (event.type === "stopped") {
          stableEmotionRef.current = stabilizer.reset();
          setCamera((current) => ({
            ...current,
            phase: "off",
            useEstimate: false,
            label: null,
            confidenceBand: null,
          }));
        }
      },
    });
  }, [cameraAdapter, commitGuest, stabilizer]);

  const previewRef = useCallback<RefCallback<HTMLVideoElement>>((element) => {
    activePreviewRef.current = element;
    if (!element || !detachedVideoRef.current?.srcObject) return;
    element.srcObject = detachedVideoRef.current.srcObject;
    element.muted = true;
    void element.play().catch(() => undefined);
  }, []);

  const actions = useMemo<AppViewActionProps>(
    () => ({
      onAuthViewChange: (kind) => setAuth({ kind }),
      onSignIn: async () => {
        clerk.openSignIn();
      },
      onSignUp: async () => {
        clerk.openSignUp();
      },
      onContinueWithGoogle: async () => {
        clerk.openSignIn();
      },
      onRequestPasswordReset: async () => {
        clerk.openSignIn();
      },
      onResendPasswordReset: async () => {
        clerk.openSignIn();
      },
      onStartGuest: startGuest,
      onLeaveGuest: async () => {
        abortPendingSends();
        await stopCamera("user");
        guestStore.clear();
        guestRef.current = null;
        credentialRef.current = null;
        setGuest(null);
        setUser(null);
        dispatch({ type: "state/cleared" });
        setAuth({ kind: "sign-in" });
        setSession("anonymous");
      },
      onCreateAccountFromGuest: async () => {
        abortPendingSends();
        await stopCamera("user");
        setSession("anonymous");
        clerk.openSignUp();
      },
      onRestartGuest: startGuest,
      onReturnToSignIn: () => {
        abortPendingSends();
        setAuth({ kind: "sign-in" });
        setSession("anonymous");
        clerk.openSignIn();
      },
      onSignOut: async () => {
        preferWelcomeRef.current = true;
        abortPendingSends();
        await stopCamera("sign-out");
        authGenerationRef.current += 1;
        registeredUidRef.current = null;
        repositoryRef.current = null;
        chatCursorRef.current = undefined;
        messageCursorRef.current = {};
        dispatch({ type: "state/cleared" });
        setDeletingChatIds([]);
        deleteRequestKeysRef.current = {};
        setUser(null);
        await firebaseBridge?.signOut();
        await clerk.signOut();
        setSession("anonymous");
      },
      onCreateChat: async () => {
        setChatListError(null);
        try {
          if (sessionRef.current === "guest") {
            const current = guestRef.current;
            if (!current) return;
            const created = createGuestChat(current);
            if (!commitGuest(created.session, "chat-created")) return;
            dispatch({ type: "chat/created", chat: created.chat });
          } else {
            const repository = repositoryRef.current;
            const uid = registeredUidRef.current;
            const generation = authGenerationRef.current;
            const chat = await repository?.createChat();
            if (
              chat &&
              uid &&
              repositoryRef.current === repository &&
              registeredUidRef.current === uid &&
              authGenerationRef.current === generation
            ) {
              dispatch({ type: "chat/created", chat });
            }
          }
        } catch (error) {
          setChatListError(errorMessage(error, "The chat could not be created."));
        }
      },
      onSelectChat: (chatId) => {
        if (sessionRef.current === "guest" && guestRef.current) {
          if (!commitGuest(guestRef.current, "chat-selected")) return;
        }
        dispatch({ type: "chat/selected", chatId });
      },
      onRenameChat: async (chatId, title) => {
        try {
          if (sessionRef.current === "guest" && guestRef.current) {
            const next = renameGuestChat(guestRef.current, chatId, title);
            const committed = commitGuest(next, "chat-renamed");
            if (!committed) return;
            const chat = committed.chats.find((item) => item.id === chatId);
            if (chat) dispatch({ type: "chat/renamed", chat });
          } else {
            const repository = repositoryRef.current;
            const uid = registeredUidRef.current;
            const generation = authGenerationRef.current;
            const chat = await repository?.renameChat(chatId, title);
            if (
              chat &&
              uid &&
              repositoryRef.current === repository &&
              registeredUidRef.current === uid &&
              authGenerationRef.current === generation
            ) {
              dispatch({ type: "chat/renamed", chat });
            }
          }
        } catch (error) {
          setChatListError(errorMessage(error, "The chat could not be renamed."));
        }
      },
      onDeleteChat: async (chatId) => {
        const startingSession = sessionRef.current;
        const repository = repositoryRef.current;
        const uid = registeredUidRef.current;
        const generation = authGenerationRef.current;
        setDeletingChatIds((current) =>
          current.includes(chatId) ? current : [...current, chatId],
        );
        try {
          if (sessionRef.current === "guest" && guestRef.current) {
            if (!commitGuest(deleteGuestChat(guestRef.current, chatId), "chat-deleted")) return;
          } else {
            await repository?.deleteChat(chatId);
          }
          if (
            (startingSession === "registered" &&
              (!uid ||
                repositoryRef.current !== repository ||
                registeredUidRef.current !== uid ||
                authGenerationRef.current !== generation)) ||
            (startingSession === "guest" && sessionRef.current !== "guest")
          ) {
            return;
          }
          dispatch({ type: "chat/deleted", chatId });
        } catch (error) {
          if (
            startingSession === "registered" &&
            (registeredUidRef.current !== uid || authGenerationRef.current !== generation)
          ) {
            return;
          }
          reportClientEvent("network_failure");
          setChatListError(errorMessage(error, "The chat could not be deleted."));
        } finally {
          setDeletingChatIds((current) => current.filter((id) => id !== chatId));
        }
      },
      onRetryChatList: () => {
        if (user?.uid) void loadRegisteredChats(user.uid, authGenerationRef.current);
      },
      onRetryMessages: (chatId) => {
        dispatch({ type: "chat/selected", chatId });
      },
      onLoadMoreChats: async () => {
        const repository = repositoryRef.current;
        const uid = registeredUidRef.current;
        const generation = authGenerationRef.current;
        const cursor = chatCursorRef.current;
        if (!repository || !cursor || !uid) return;
        setLoadingMoreChats(true);
        try {
          const page = await repository.listChats(cursor);
          if (
            repositoryRef.current !== repository ||
            registeredUidRef.current !== uid ||
            authGenerationRef.current !== generation
          ) {
            return;
          }
          const merged = [...chatStateRef.current.orderedChatIds.map((id) => chatStateRef.current.chatsById[id]), ...page.items];
          dispatch({ type: "chats/load-succeeded", chats: merged });
          chatCursorRef.current = page.nextCursor ?? undefined;
          setHasMoreChats(Boolean(page.nextCursor));
        } finally {
          setLoadingMoreChats(false);
        }
      },
      onLoadOlderMessages: async (chatId) => {
        const repository = repositoryRef.current;
        const uid = registeredUidRef.current;
        const generation = authGenerationRef.current;
        const cursor = messageCursorRef.current[chatId];
        if (!repository || !cursor || !uid) return;
        setLoadingOlderMessages(true);
        const requestId = crypto.randomUUID();
        dispatch({ type: "messages/load-started", chatId, requestId });
        try {
          const page = await repository.listMessages(chatId, cursor);
          if (
            repositoryRef.current !== repository ||
            registeredUidRef.current !== uid ||
            authGenerationRef.current !== generation
          ) {
            return;
          }
          dispatch({ type: "messages/load-succeeded", chatId, requestId, messages: page.items, prepend: true });
          messageCursorRef.current[chatId] = page.nextCursor ?? undefined;
          setHasOlderMessages(Boolean(page.nextCursor));
        } finally {
          setLoadingOlderMessages(false);
        }
      },
      onSendMessage: ({ chatId, text }) => sendWithOperation(chatId, text),
      onRetryMessage: async (message) => {
        const operation = chatStateRef.current.sendOperations[message.clientRequestId];
        const chat = chatStateRef.current.chatsById[message.chatId];
        const original = chat?.messages.find(
          (item) => item.clientRequestId === message.clientRequestId && item.role === "user",
        );
        if (operation && original) await sendWithOperation(message.chatId, original.text, operation);
      },
      onEditAndResendMessage: (message, text) => sendWithOperation(message.chatId, text),
      onDeleteMessage: async (message) => {
        if (sessionRef.current === "guest" && guestRef.current) {
          if (!commitGuest(
            deleteGuestMessage(guestRef.current, message.chatId, message.id),
            "message-deleted",
          )) return;
        } else {
          const repository = repositoryRef.current;
          const uid = registeredUidRef.current;
          const generation = authGenerationRef.current;
          await repository?.deleteMessage(message.chatId, message.id);
          if (
            !uid ||
            repositoryRef.current !== repository ||
            registeredUidRef.current !== uid ||
            authGenerationRef.current !== generation
          ) {
            return;
          }
        }
        dispatch({ type: "message/deleted", chatId: message.chatId, messageId: message.id });
      },
      onRequestCamera: beginCamera,
      onCancelCamera: () => stopCamera("user"),
      onRetryCamera: beginCamera,
      onStopCamera: async () => {
        await stopCamera("user");
        if (sessionRef.current === "guest" && guestRef.current) {
          commitGuest(guestRef.current, "camera-stopped");
        }
      },
      onSetUseEstimate: async (enabled) => {
        if (sessionRef.current === "registered") {
          const repository = repositoryRef.current;
          const uid = registeredUidRef.current;
          const generation = authGenerationRef.current;
          if (!repository || !uid) {
            setCamera((current) => ({ ...current, useEstimate: false }));
            return;
          }
          try {
            await repository.setUseEmotionContext(enabled);
          } catch {
            setCamera((current) => ({ ...current, useEstimate: false }));
            setMessageListError("That privacy preference could not be saved. No estimate will be sent.");
            return;
          }
          if (
            sessionRef.current !== "registered" ||
            repositoryRef.current !== repository ||
            registeredUidRef.current !== uid ||
            authGenerationRef.current !== generation
          ) {
            return;
          }
        }
        setCamera((current) => ({ ...current, useEstimate: enabled }));
        if (sessionRef.current === "guest" && guestRef.current) {
          commitGuest(guestRef.current, "emotion-context-toggled");
        }
      },
      onEmergencyHelp: () => {
        window.alert(
          "If you may act now or are in immediate danger, contact your local emergency services or ask a trusted nearby person to stay with you now.",
        );
      },
      onSelectSafetyRegion: () => {
        window.alert(
          "A reviewed regional support directory is not configured for this preview. If there may be immediate danger, contact local emergency services or ask a trusted nearby person to stay with you now.",
        );
      },
    }),
    [
      abortPendingSends,
      beginCamera,
      clerk,
      commitGuest,
      firebaseBridge,
      guestStore,
      loadRegisteredChats,
      sendWithOperation,
      startGuest,
      stopCamera,
      user?.uid,
    ],
  );

  const chats: Chat[] = chatState.orderedChatIds
    .map((id) => chatState.chatsById[id])
    .filter((chat): chat is Chat => Boolean(chat));

  return (
    <AppView
      view={{
        session,
        auth,
        user,
        chats,
        deletingChatIds,
        activeChatId: chatState.activeChatId,
        chatListStatus: chatState.chatListStatus,
        messageListStatus: "ready",
        chatListError,
        messageListError,
        hasMoreChats,
        isLoadingMoreChats: loadingMoreChats,
        hasOlderMessages,
        isLoadingOlderMessages: loadingOlderMessages,
        camera: { ...camera, previewRef },
        guest: { storageWarning },
        connectionStatus: navigator.onLine ? "online" : "offline",
        safetyRegions: [],
        selectedSafetyRegion: null,
        privacyHref: "/privacy",
        termsHref: "/terms",
        authControls: <ClerkAuthPanel error={auth.formError} onStartGuest={startGuest} />,
        accountControls: (
          <Show when="signed-in">
            <UserButton />
          </Show>
        ),
      }}
      actions={actions}
    />
  );
}
