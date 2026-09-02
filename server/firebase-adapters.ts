import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  getFirestore,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import type { ServerConfig } from "./config.js";
import { AppError, ConfigurationError } from "./errors.js";
import type {
  BeginSendResult,
  ChatRepository,
  CompleteSendInput,
  CompletedSend,
  DeleteChatResult,
  RegisteredSendInput,
} from "./ports.js";
import type { RecentHistoryMessage } from "./contracts.js";

let cachedApp: App | undefined;
let cachedTopology: "emulator" | "production" | undefined;

function firebaseApp(config: ServerConfig): App {
  assertFirebaseRuntimeTopology(config);
  const topology = config.firebaseUseEmulators ? "emulator" : "production";
  if (cachedApp) {
    if (cachedTopology !== topology) throw new ConfigurationError();
    return cachedApp;
  }

  if (config.firebaseUseEmulators) {
    if (!config.firebaseProjectId) throw new ConfigurationError();
    const existing = getApps().find((app) => app.name === "emotional-friend-server-emulator");
    if (existing) {
      if (existing.options.projectId !== config.firebaseProjectId || existing.options.credential) {
        throw new ConfigurationError();
      }
      cachedApp = existing;
      cachedTopology = topology;
      return cachedApp;
    }
    cachedApp = initializeApp(
      { projectId: config.firebaseProjectId },
      "emotional-friend-server-emulator",
    );
    cachedTopology = topology;
    return cachedApp;
  }

  let serviceAccount: ServiceAccount;
  if (config.firebaseServiceAccountJson) {
    try {
      const value = JSON.parse(config.firebaseServiceAccountJson) as Record<string, unknown>;
      if (
        typeof value.project_id !== "string" ||
        typeof value.client_email !== "string" ||
        typeof value.private_key !== "string"
      ) {
        throw new Error("invalid service account");
      }
      serviceAccount = {
        projectId: value.project_id,
        clientEmail: value.client_email,
        privateKey: value.private_key,
      };
    } catch {
      throw new ConfigurationError();
    }
  } else if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
    serviceAccount = {
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey.replace(/\\n/g, "\n"),
    };
  } else {
    throw new ConfigurationError();
  }

  const existing = getApps().find((app) => app.name === "emotional-friend-server-production");
  if (existing) {
    if (existing.options.projectId !== serviceAccount.projectId || !existing.options.credential) {
      throw new ConfigurationError();
    }
    cachedApp = existing;
    cachedTopology = topology;
    return cachedApp;
  }
  cachedApp = initializeApp(
    { credential: cert(serviceAccount), projectId: serviceAccount.projectId },
    "emotional-friend-server-production",
  );
  cachedTopology = topology;
  return cachedApp;
}

function assertFirebaseRuntimeTopology(config: ServerConfig): void {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (config.firebaseUseEmulators) {
    if (
      firestoreHost !== config.firestoreEmulatorHost ||
      authHost !== config.firebaseAuthEmulatorHost
    ) {
      throw new ConfigurationError();
    }
    return;
  }
  if (firestoreHost || authHost) throw new ConfigurationError();
}

export function getFirebaseAdminFirestore(config: ServerConfig): Firestore {
  return getFirestore(firebaseApp(config));
}

export async function createFirebaseCustomToken(
  config: ServerConfig,
  uid: string,
): Promise<string> {
  try {
    return await getAuth(firebaseApp(config)).createCustomToken(uid);
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof AppError) throw error;
    throw new AppError({
      code: "INTERNAL_ERROR",
      status: 500,
      message: "Your account session could not be prepared.",
      retryable: true,
    });
  }
}

export class FirestoreChatRepository implements ChatRepository {
  constructor(private readonly config: ServerConfig) {}

  private firestore(): Firestore {
    return getFirebaseAdminFirestore(this.config);
  }

  async loadRegisteredEmotionConsent(uid: string): Promise<{
    useEmotionContext: boolean;
    cameraNoticeVersion: string | null;
    cameraNoticeAcceptedAt: Date | null;
  }> {
    const snapshot = await this.firestore().doc(`users/${uid}`).get();
    const data = snapshot.data() ?? {};
    const acceptedAtMs = timestampMillis(data.consent?.cameraNoticeAcceptedAt);
    return {
      useEmotionContext: data.settings?.useEmotionContext === true,
      cameraNoticeVersion:
        typeof data.consent?.cameraNoticeVersion === "string"
          ? data.consent.cameraNoticeVersion
          : null,
      cameraNoticeAcceptedAt: acceptedAtMs > 0 ? new Date(acceptedAtMs) : null,
    };
  }

  async beginSend(input: RegisteredSendInput): Promise<BeginSendResult> {
    const db = this.firestore();
    const chatRef = db.doc(`users/${input.uid}/chats/${input.chatId}`);
    const operationRef = chatRef.collection("messageRequests").doc(input.operationKey);
    const userRef = chatRef.collection("messages").doc(input.userMessageId);
    const assistantRef = chatRef.collection("messages").doc(input.assistantMessageId);
    const now = Date.now();

    const result = await db.runTransaction(async (transaction) => {
      const [chatSnapshot, operationSnapshot] = await Promise.all([
        transaction.get(chatRef),
        transaction.get(operationRef),
      ]);
      if (!chatSnapshot.exists) throw chatNotFound();
      const chat = chatSnapshot.data() ?? {};
      if ((chat.ownerUid && chat.ownerUid !== input.uid) || chat.deletionState === "deleting") throw chatNotFound();

      if (operationSnapshot.exists) {
        const operation = operationSnapshot.data() ?? {};
        if (operation.requestFingerprint !== input.requestFingerprint) throw idempotencyConflict();
        if (operation.state === "completed") {
          return {
            kind: "replay" as const,
            userMessageId: String(operation.userMessageId),
            assistantMessageId: String(operation.assistantMessageId),
          };
        }
        const leaseExpiresAt = timestampMillis(operation.leaseExpiresAt);
        if (operation.state === "processing" && leaseExpiresAt > now) {
          throw new AppError({
            code: "REQUEST_IN_PROGRESS",
            status: 409,
            message: "This request is still being processed.",
            retryable: true,
            retryAfterSeconds: Math.max(1, Math.ceil((leaseExpiresAt - now) / 1_000)),
          });
        }

        transaction.set(
          userRef,
          {
            chatId: input.chatId,
            ownerUid: input.uid,
            role: "user",
            text: input.text,
            status: "complete",
            clientRequestId: input.clientRequestId,
            emotionContext: input.emotionContext ?? null,
          },
          { merge: true },
        );
        transaction.set(
          assistantRef,
          {
            chatId: input.chatId,
            ownerUid: input.uid,
            role: "assistant",
            text: "",
            status: "pending",
            clientRequestId: input.clientRequestId,
            completedAt: null,
            variant: "assistant",
            errorCode: null,
          },
          { merge: true },
        );
        transaction.update(operationRef, {
          state: "processing",
          leaseExpiresAt: Timestamp.fromMillis(now + input.leaseMs),
          attemptCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
          expiresAt: Timestamp.fromMillis(now + input.idempotencyTtlMs),
        });
        return {
          kind: "execute" as const,
          userMessageId: input.userMessageId,
          assistantMessageId: input.assistantMessageId,
        };
      }

      transaction.create(userRef, {
        chatId: input.chatId,
        ownerUid: input.uid,
        role: "user",
        text: input.text,
        status: "complete",
        clientRequestId: input.clientRequestId,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        emotionContext: input.emotionContext ?? null,
        generationMetadata: null,
      });
      transaction.create(assistantRef, {
        chatId: input.chatId,
        ownerUid: input.uid,
        role: "assistant",
        text: "",
        status: "pending",
        clientRequestId: input.clientRequestId,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: null,
        emotionContext: null,
        generationMetadata: null,
        variant: "assistant",
      });
      transaction.create(operationRef, buildRegisteredMessageOperationRecord(input, now));
      transaction.update(chatRef, {
        ownerUid: input.uid,
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      });
      return {
        kind: "execute" as const,
        userMessageId: input.userMessageId,
        assistantMessageId: input.assistantMessageId,
      };
    });

    if (result.kind === "execute") return result;
    const completion = await this.loadCompletion(
      input.uid,
      input.chatId,
      result.userMessageId,
      result.assistantMessageId,
    );
    return { kind: "replay", completion };
  }

  async completeSend(input: CompleteSendInput): Promise<void> {
    const db = this.firestore();
    const chatRef = db.doc(`users/${input.uid}/chats/${input.chatId}`);
    const operationRef = chatRef.collection("messageRequests").doc(input.operationKey);
    await db.runTransaction(async (transaction) => {
      const operationSnapshot = await transaction.get(operationRef);
      if (!operationSnapshot.exists) throw new Error("missing message operation");
      const operation = operationSnapshot.data() ?? {};
      if (operation.requestFingerprint !== input.requestFingerprint) throw idempotencyConflict();
      if (operation.state === "completed") return;
      const assistantMessageId = String(operation.assistantMessageId);
      const assistantRef = chatRef.collection("messages").doc(assistantMessageId);
      transaction.update(assistantRef, {
        text: input.completion.assistantText,
        status: "complete",
        completedAt: FieldValue.serverTimestamp(),
        variant: input.completion.variant,
        safety: input.completion.safety ?? null,
        errorCode: null,
        generationMetadata: input.generation,
      });
      transaction.update(operationRef, {
        state: "completed",
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(chatRef, {
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async failSend(input: {
    uid: string;
    chatId: string;
    operationKey: string;
    requestFingerprint: string;
    errorCode: string;
    retryable: boolean;
  }): Promise<void> {
    const db = this.firestore();
    const chatRef = db.doc(`users/${input.uid}/chats/${input.chatId}`);
    const operationRef = chatRef.collection("messageRequests").doc(input.operationKey);
    await db.runTransaction(async (transaction) => {
      const operationSnapshot = await transaction.get(operationRef);
      if (!operationSnapshot.exists) return;
      const operation = operationSnapshot.data() ?? {};
      if (operation.requestFingerprint !== input.requestFingerprint || operation.state === "completed") return;
      const assistantRef = chatRef.collection("messages").doc(String(operation.assistantMessageId));
      transaction.update(assistantRef, {
        status: "failed",
        errorCode: input.errorCode,
        completedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(operationRef, {
        state: "failed",
        retryable: input.retryable,
        errorCode: input.errorCode,
        leaseExpiresAt: Timestamp.fromMillis(0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async loadRecentHistory(input: {
    uid: string;
    chatId: string;
    limit: number;
    excludeMessageId: string;
  }): Promise<RecentHistoryMessage[]> {
    const collection = this.firestore().collection(
      `users/${input.uid}/chats/${input.chatId}/messages`,
    );
    const snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(Math.max(20, input.limit * 4))
      .get();
    return snapshot.docs
      .filter((document) => document.id !== input.excludeMessageId)
      .map((document) => document.data())
      .filter(
        (message) =>
          message.status === "complete" &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.text === "string" &&
          message.text.trim().length > 0,
      )
      .slice(0, input.limit)
      .reverse()
      .map((message) => ({ role: message.role as "user" | "assistant", text: message.text as string }));
  }

  async deleteChat(input: {
    uid: string;
    chatId: string;
    batchSize: number;
    operationKey: string;
    requestFingerprint: string;
    leaseMs: number;
    idempotencyTtlMs: number;
  }): Promise<DeleteChatResult> {
    const db = this.firestore();
    const chatRef = db.doc(`users/${input.uid}/chats/${input.chatId}`);
    const requestedOperationRef = db.doc(
      `users/${input.uid}/apiOperations/${input.operationKey}`,
    );
    const now = Date.now();
    const begin = await db.runTransaction(async (transaction) => {
      const requestedSnapshot = await transaction.get(requestedOperationRef);
      const requested = requestedSnapshot.data() ?? {};
      const chatSnapshot = await transaction.get(chatRef);
      const chat = chatSnapshot.data() ?? {};
      if (chat.ownerUid && chat.ownerUid !== input.uid) throw chatNotFound();
      if (requestedSnapshot.exists && requested.requestFingerprint !== input.requestFingerprint) {
        throw idempotencyConflict();
      }

      const storedOperationId =
        requested.state === "alias" && isOperationId(requested.canonicalOperationId)
          ? requested.canonicalOperationId
          : chat.deletionState === "deleting" && isOperationId(chat.deletionOperationId)
            ? chat.deletionOperationId
            : input.operationKey;
      const operationId = String(storedOperationId);
      const operationRef = db.doc(`users/${input.uid}/apiOperations/${operationId}`);
      const operationSnapshot =
        operationId === input.operationKey
          ? requestedSnapshot
          : await transaction.get(operationRef);
      const operation = operationSnapshot.data() ?? {};
      if (!chatSnapshot.exists && !requestedSnapshot.exists && !operationSnapshot.exists) {
        throw chatNotFound();
      }
      if (operationSnapshot.exists && operation.requestFingerprint !== input.requestFingerprint) {
        throw idempotencyConflict();
      }

      const attached = operationId !== input.operationKey;
      if (attached && requested.state !== "alias") {
        transaction.set(
          requestedOperationRef,
          buildDeleteOperationAliasRecord(
            operationId,
            input.requestFingerprint,
            now,
            input.idempotencyTtlMs,
          ),
        );
      }
      if (operation.state === "completed") {
        return {
          operationId,
          status: "complete" as const,
          replayed: true,
          phase: "messageRequests" as const,
        };
      }
      const leaseExpiresAt = timestampMillis(operation.leaseExpiresAt);
      if (operation.state === "processing" && leaseExpiresAt > now) {
        throw new AppError({
          code: "REQUEST_IN_PROGRESS",
          status: 409,
          message: "This request is still being processed.",
          retryable: true,
          retryAfterSeconds: Math.max(1, Math.ceil((leaseExpiresAt - now) / 1_000)),
        });
      }

      const phase = operation.phase === "messageRequests" ? "messageRequests" : "messages";
      transaction.set(
        operationRef,
        buildDeleteOperationRecord(input, now, operation.createdAt, {
          phase,
          deletedChildren: numberOrZero(operation.deletedChildren),
          pageCount: numberOrZero(operation.pageCount),
        }),
        { merge: true },
      );
      if (chatSnapshot.exists) {
        transaction.update(chatRef, {
          ownerUid: input.uid,
          deletionState: "deleting",
          deletionOperationId: operationId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return { operationId, status: "pending" as const, replayed: false, phase };
    });
    if (begin.status === "complete") {
      return { operationId: begin.operationId, status: "complete", replayed: true };
    }
    const operationRef = db.doc(`users/${input.uid}/apiOperations/${begin.operationId}`);

    if (begin.phase === "messages") {
      const deletedMessages = await this.deleteCollectionPage(
        chatRef.collection("messages"),
        input.batchSize,
        operationRef,
        "messages",
      );
      if (deletedMessages > 0) {
        return { operationId: begin.operationId, status: "pending", replayed: false };
      }
    }

    const deletedRequests = await this.deleteCollectionPage(
      chatRef.collection("messageRequests"),
      input.batchSize,
      operationRef,
      "messageRequests",
    );
    if (deletedRequests > 0) {
      return { operationId: begin.operationId, status: "pending", replayed: false };
    }

    const terminalReplay = await db.runTransaction(async (transaction) => {
      const [operationSnapshot, chatSnapshot] = await Promise.all([
        transaction.get(operationRef),
        transaction.get(chatRef),
      ]);
      if (!operationSnapshot.exists) throw new Error("missing delete operation");
      const operation = operationSnapshot.data() ?? {};
      if (operation.requestFingerprint !== input.requestFingerprint) throw idempotencyConflict();
      if (operation.state === "completed") return true;
      if (chatSnapshot.exists) transaction.delete(chatRef);
      transaction.update(operationRef, {
        state: "completed",
        phase: "complete",
        leaseExpiresAt: Timestamp.fromMillis(0),
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return false;
    });
    return {
      operationId: begin.operationId,
      status: "complete",
      replayed: terminalReplay,
    };
  }

  private async loadCompletion(
    uid: string,
    chatId: string,
    userMessageId: string,
    assistantMessageId: string,
  ): Promise<CompletedSend> {
    const assistant = await this.firestore()
      .doc(`users/${uid}/chats/${chatId}/messages/${assistantMessageId}`)
      .get();
    if (!assistant.exists) throw new Error("missing completed assistant message");
    const data = assistant.data() ?? {};
    if (data.status !== "complete" || typeof data.text !== "string") {
      throw new Error("invalid completed assistant message");
    }
    return {
      userMessageId,
      assistantMessageId,
      assistantText: data.text,
      variant: data.variant === "safety_support" ? "safety_support" : "assistant",
      safety: data.safety ?? undefined,
    };
  }

  private async deleteCollectionPage(
    collection: CollectionReference,
    batchSize: number,
    operationRef: DocumentReference,
    phase: "messages" | "messageRequests",
  ): Promise<number> {
    const page = await collection.orderBy(FieldPath.documentId()).limit(batchSize).get();
    if (page.empty) return 0;
    const batch = this.firestore().batch();
    for (const document of page.docs) batch.delete(document.ref);
    batch.update(operationRef, {
      state: "pending",
      phase,
      leaseExpiresAt: Timestamp.fromMillis(0),
      deletedChildren: FieldValue.increment(page.docs.length),
      pageCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return page.docs.length;
  }
}

function timestampMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function buildRegisteredMessageOperationRecord(
  input: RegisteredSendInput,
  nowMs: number,
): Record<string, unknown> {
  return {
    state: "processing",
    requestFingerprint: input.requestFingerprint,
    clientRequestId: input.clientRequestId,
    userMessageId: input.userMessageId,
    assistantMessageId: input.assistantMessageId,
    attemptCount: 1,
    leaseExpiresAt: Timestamp.fromMillis(nowMs + input.leaseMs),
    expiresAt: Timestamp.fromMillis(nowMs + input.idempotencyTtlMs),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function buildDeleteOperationRecord(
  input: {
    requestFingerprint: string;
    leaseMs: number;
    idempotencyTtlMs: number;
  },
  nowMs: number,
  existingCreatedAt?: unknown,
  progress: {
    phase: "messages" | "messageRequests";
    deletedChildren: number;
    pageCount: number;
  } = { phase: "messages", deletedChildren: 0, pageCount: 0 },
): Record<string, unknown> {
  return {
    type: "delete-chat-v1",
    state: "processing",
    requestFingerprint: input.requestFingerprint,
    phase: progress.phase,
    deletedChildren: progress.deletedChildren,
    pageCount: progress.pageCount,
    leaseExpiresAt: Timestamp.fromMillis(nowMs + input.leaseMs),
    expiresAt: Timestamp.fromMillis(nowMs + input.idempotencyTtlMs),
    attemptCount: FieldValue.increment(1),
    createdAt: existingCreatedAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function buildDeleteOperationAliasRecord(
  canonicalOperationId: string,
  requestFingerprint: string,
  nowMs: number,
  idempotencyTtlMs: number,
): Record<string, unknown> {
  return {
    type: "delete-chat-alias-v1",
    state: "alias",
    canonicalOperationId,
    requestFingerprint,
    expiresAt: Timestamp.fromMillis(nowMs + idempotencyTtlMs),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function isOperationId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function chatNotFound(): AppError {
  return new AppError({ code: "CHAT_NOT_FOUND", status: 404, message: "The chat was not found." });
}

function idempotencyConflict(): AppError {
  return new AppError({
    code: "IDEMPOTENCY_CONFLICT",
    status: 409,
    message: "The idempotency key was already used for a different request.",
  });
}
