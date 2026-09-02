import {
  Timestamp,
  collection,
  deleteField,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Chat, EmotionContext, Message } from "../types";
import type { AppUser } from "../types";
import { CHAT_PAGE_SIZE, MESSAGE_PAGE_SIZE } from "../domain/constants";
import { ClientError } from "../domain/errors";
import { validateChatTitle } from "../domain/validation";

export interface ChatPageCursor {
  updatedAt: string;
  id: string;
}

export interface MessagePageCursor {
  createdAt: string;
  id: string;
}

export interface Page<T, Cursor> {
  items: T[];
  nextCursor: Cursor | null;
}

export type TrustedCascadeDelete = (chatId: string, signal?: AbortSignal) => Promise<void>;

export const P0_CAMERA_NOTICE_VERSION = "camera-notice-v1" as const;

export async function ensureFirestoreUserProfile(
  firestore: Firestore,
  user: AppUser,
): Promise<void> {
  const reference = doc(firestore, "users", user.uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists()) return;
  await setDoc(reference, {
    uid: user.uid,
    displayName: user.displayName,
    createdAt: serverTimestamp(),
    settings: {
      useEmotionContext: false,
      quotesVisible: false,
      locale: "en",
    },
    consent: {
      cameraNoticeVersion: null,
      cameraNoticeAcceptedAt: null,
    },
  });
}

function timestampToIso(value: unknown, fallback: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return fallback;
}

function decodeEmotion(value: unknown): EmotionContext | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const label = record.label;
  if (
    typeof label !== "string" ||
    !["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised", "unavailable"].includes(label)
  ) {
    return null;
  }
  const confidenceBand = record.confidenceBand;
  return {
    label: label as EmotionContext["label"],
    confidenceBand:
      confidenceBand === "low" || confidenceBand === "medium" || confidenceBand === "high"
        ? confidenceBand
        : null,
    modelVersion: typeof record.modelVersion === "string" ? record.modelVersion : null,
    observedAt:
      record.observedAt == null ? null : timestampToIso(record.observedAt, new Date(0).toISOString()),
  };
}

export function decodeFirestoreMessage(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Message {
  const data = snapshot.data();
  const fallback = new Date(0).toISOString();
  const role = data.role ?? (data.isChatbot === true ? "assistant" : "user");
  return {
    id: snapshot.id,
    chatId: typeof data.chatId === "string" ? data.chatId : snapshot.ref.parent.parent?.id ?? "",
    role: role === "assistant" || role === "system" ? role : "user",
    text: typeof data.text === "string" ? data.text : "",
    status: ["pending", "complete", "failed", "deleted"].includes(data.status)
      ? data.status
      : "complete",
    clientRequestId:
      typeof data.clientRequestId === "string" ? data.clientRequestId : `legacy:${snapshot.id}`,
    createdAt: timestampToIso(data.createdAt, fallback),
    completedAt: data.completedAt == null ? null : timestampToIso(data.completedAt, fallback),
    emotionContext: decodeEmotion(data.emotionContext),
    safetySupport: data.safetySupport === true || data.variant === "safety_support",
  };
}

function decodeChat(snapshot: QueryDocumentSnapshot<DocumentData>): Chat {
  const data = snapshot.data();
  const fallback = new Date(0).toISOString();
  return {
    id: snapshot.id,
    title:
      typeof data.title === "string"
        ? data.title
        : typeof data.name === "string"
          ? data.name
          : "New chat",
    titleSource:
      data.titleSource === "generated" || data.titleSource === "user"
        ? data.titleSource
        : "default",
    createdAt: timestampToIso(data.createdAt, fallback),
    updatedAt: timestampToIso(data.updatedAt ?? data.createdAt, fallback),
    lastMessageAt:
      data.lastMessageAt == null ? null : timestampToIso(data.lastMessageAt, fallback),
    messages: [],
  };
}

function asQuerySnapshot(data: DocumentData, id: string): QueryDocumentSnapshot<DocumentData> {
  return {
    id,
    data: () => data,
  } as QueryDocumentSnapshot<DocumentData>;
}

export class FirestoreChatRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly uid: string,
    private readonly cascadeDelete: TrustedCascadeDelete,
  ) {}

  private chatsCollection() {
    return collection(this.firestore, "users", this.uid, "chats");
  }

  private userDocument() {
    return doc(this.firestore, "users", this.uid);
  }

  async recordCameraNoticeAcceptance(): Promise<void> {
    await updateDoc(this.userDocument(), {
      "consent.cameraNoticeVersion": P0_CAMERA_NOTICE_VERSION,
      "consent.cameraNoticeAcceptedAt": serverTimestamp(),
    });
  }

  async setUseEmotionContext(enabled: boolean): Promise<void> {
    await updateDoc(this.userDocument(), {
      "settings.useEmotionContext": enabled,
    });
  }

  private chatDocument(chatId: string) {
    return doc(this.firestore, "users", this.uid, "chats", chatId);
  }

  async listChats(cursor?: ChatPageCursor): Promise<Page<Chat, ChatPageCursor>> {
    const constraints: QueryConstraint[] = [orderBy("updatedAt", "desc"), orderBy(documentId(), "desc")];
    if (cursor) constraints.push(startAfter(Timestamp.fromDate(new Date(cursor.updatedAt)), cursor.id));
    constraints.push(limit(CHAT_PAGE_SIZE));
    const snapshot = await getDocs(query(this.chatsCollection(), ...constraints));
    const items = snapshot.docs.map(decodeChat);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        snapshot.size === CHAT_PAGE_SIZE && last ? { updatedAt: last.updatedAt, id: last.id } : null,
    };
  }

  async listMessages(
    chatId: string,
    cursor?: MessagePageCursor,
  ): Promise<Page<Message, MessagePageCursor>> {
    const messages = collection(this.firestore, "users", this.uid, "chats", chatId, "messages");
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), orderBy(documentId(), "desc")];
    if (cursor) constraints.push(startAfter(Timestamp.fromDate(new Date(cursor.createdAt)), cursor.id));
    constraints.push(limit(MESSAGE_PAGE_SIZE));
    const snapshot = await getDocs(query(messages, ...constraints));
    const descending = snapshot.docs.map(decodeFirestoreMessage);
    const oldest = descending.at(-1);
    return {
      items: descending.reverse(),
      nextCursor:
        snapshot.size === MESSAGE_PAGE_SIZE && oldest
          ? { createdAt: oldest.createdAt, id: oldest.id }
          : null,
    };
  }

  async createChat(title = "New chat"): Promise<Chat> {
    const validation = validateChatTitle(title);
    if (!validation.valid) {
      throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
    }
    const id = crypto.randomUUID();
    const reference = this.chatDocument(id);
    await setDoc(reference, {
      schemaVersion: 1,
      ownerUid: this.uid,
      title: validation.value,
      titleSource: "default",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageAt: null,
      quoteId: null,
      quoteSnapshot: null,
    });
    const created = await getDoc(reference);
    if (!created.exists()) {
      throw new ClientError({ code: "INTERNAL_ERROR", message: "The chat could not be created." });
    }
    return decodeChat(asQuerySnapshot(created.data(), created.id));
  }

  async renameChat(chatId: string, title: string): Promise<Chat> {
    const validation = validateChatTitle(title);
    if (!validation.valid) {
      throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
    }
    const reference = this.chatDocument(chatId);
    await updateDoc(reference, {
      title: validation.value,
      titleSource: "user",
      updatedAt: serverTimestamp(),
    });
    const updated = await getDoc(reference);
    if (!updated.exists()) {
      throw new ClientError({ code: "CHAT_NOT_FOUND", message: "That chat is no longer available." });
    }
    return decodeChat(asQuerySnapshot(updated.data(), updated.id));
  }

  async deleteChat(chatId: string, signal?: AbortSignal): Promise<void> {
    await this.cascadeDelete(chatId, signal);
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    const reference = doc(
      this.firestore,
      "users",
      this.uid,
      "chats",
      chatId,
      "messages",
      messageId,
    );
    await updateDoc(reference, {
      text: "",
      status: "deleted",
      completedAt: serverTimestamp(),
      emotionContext: deleteField(),
      generationMetadata: deleteField(),
      safety: deleteField(),
      variant: deleteField(),
      errorCode: deleteField(),
      safetySupport: deleteField(),
    });
  }
}
