import type { Chat, EmotionContext, GuestSession, Message } from "../types";
import { ClientError } from "../domain/errors";
import { UNAVAILABLE_EMOTION_CONTEXT } from "../domain/emotion";
import { validateChatTitle, validateMessage } from "../domain/validation";
import type { SendOperation } from "../domain/chat-reducer";
import type { FirestoreChatRepository } from "./firestore-repository";
import { createClientRequestId } from "./reliability";

export interface OptimisticSend {
  operation: SendOperation;
  userMessage: Message;
  assistantPlaceholder: Message;
}

export function createGuestChat(
  session: GuestSession,
  title = "New chat",
  now = new Date().toISOString(),
): { session: GuestSession; chat: Chat } {
  const validation = validateChatTitle(title);
  if (!validation.valid) {
    throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
  }
  const chat: Chat = {
    id: crypto.randomUUID(),
    title: validation.value,
    titleSource: "default",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null,
    messages: [],
  };
  return { session: { ...session, chats: [chat, ...session.chats] }, chat };
}

export function renameGuestChat(
  session: GuestSession,
  chatId: string,
  title: string,
  now = new Date().toISOString(),
): GuestSession {
  const validation = validateChatTitle(title);
  if (!validation.valid) {
    throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
  }
  return {
    ...session,
    chats: session.chats.map((chat) =>
      chat.id === chatId
        ? { ...chat, title: validation.value, titleSource: "user", updatedAt: now }
        : chat,
    ),
  };
}

export function deleteGuestChat(session: GuestSession, chatId: string): GuestSession {
  return { ...session, chats: session.chats.filter((chat) => chat.id !== chatId) };
}

export function deleteGuestMessage(
  session: GuestSession,
  chatId: string,
  messageId: string,
  now = new Date().toISOString(),
): GuestSession {
  return {
    ...session,
    chats: session.chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            updatedAt: now,
            messages: chat.messages.map((message) =>
              message.id === messageId
                ? { ...message, text: "", status: "deleted", completedAt: now }
                : message,
            ),
          }
        : chat,
    ),
  };
}

export function createOptimisticSend(input: {
  chatId: string;
  text: string;
  emotionContext?: EmotionContext | null;
  now?: string;
}): OptimisticSend {
  const validation = validateMessage(input.text);
  if (!validation.valid) {
    throw new ClientError({ code: "INVALID_REQUEST", message: validation.errors[0].message });
  }
  const now = input.now ?? new Date().toISOString();
  const clientRequestId = createClientRequestId();
  const userMessageId = `local-user:${clientRequestId}`;
  const assistantPlaceholderId = `local-assistant:${clientRequestId}`;
  const emotionContext = input.emotionContext ?? { ...UNAVAILABLE_EMOTION_CONTEXT };
  return {
    operation: {
      clientRequestId,
      chatId: input.chatId,
      userMessageId,
      assistantPlaceholderId,
      phase: "submitting",
      attempts: 1,
      error: null,
    },
    userMessage: {
      id: userMessageId,
      chatId: input.chatId,
      role: "user",
      text: validation.value,
      status: "pending",
      clientRequestId,
      createdAt: now,
      completedAt: null,
      emotionContext,
    },
    assistantPlaceholder: {
      id: assistantPlaceholderId,
      chatId: input.chatId,
      role: "assistant",
      text: "",
      status: "pending",
      clientRequestId,
      createdAt: now,
      completedAt: null,
      emotionContext: null,
    },
  };
}

export class RegisteredChatCrudService {
  constructor(private readonly repository: FirestoreChatRepository) {}

  create(title?: string): Promise<Chat> {
    return this.repository.createChat(title);
  }

  rename(chatId: string, title: string): Promise<Chat> {
    return this.repository.renameChat(chatId, title);
  }

  delete(chatId: string, signal?: AbortSignal): Promise<void> {
    return this.repository.deleteChat(chatId, signal);
  }

  deleteMessage(chatId: string, messageId: string): Promise<void> {
    return this.repository.deleteMessage(chatId, messageId);
  }
}
