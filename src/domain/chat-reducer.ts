import type { Chat, ChatGenerationResponse, Message } from "../types";
import type { ClientError } from "./errors";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface SendOperation {
  clientRequestId: string;
  chatId: string;
  userMessageId: string;
  assistantPlaceholderId: string;
  phase: "submitting" | "retrying" | "complete" | "failed";
  attempts: number;
  error: ClientError | null;
}

export interface ChatState {
  chatsById: Record<string, Chat>;
  orderedChatIds: string[];
  activeChatId: string | null;
  draftsByChatId: Record<string, string>;
  messageLoadIds: Record<string, string>;
  sendOperations: Record<string, SendOperation>;
  chatListStatus: LoadStatus;
  error: ClientError | null;
}

export const initialChatState: ChatState = {
  chatsById: {},
  orderedChatIds: [],
  activeChatId: null,
  draftsByChatId: {},
  messageLoadIds: {},
  sendOperations: {},
  chatListStatus: "idle",
  error: null,
};

export type ChatAction =
  | { type: "chats/load-started" }
  | { type: "chats/load-succeeded"; chats: Chat[] }
  | { type: "chats/load-failed"; error: ClientError }
  | { type: "chat/created"; chat: Chat }
  | { type: "chat/selected"; chatId: string }
  | { type: "chat/renamed"; chat: Chat }
  | { type: "chat/deleted"; chatId: string }
  | { type: "draft/changed"; chatId: string; text: string }
  | { type: "messages/load-started"; chatId: string; requestId: string }
  | {
      type: "messages/load-succeeded";
      chatId: string;
      requestId: string;
      messages: Message[];
      prepend?: boolean;
    }
  | {
      type: "messages/load-failed";
      chatId: string;
      requestId: string;
      error: ClientError;
    }
  | {
      type: "send/started";
      operation: SendOperation;
      userMessage: Message;
      assistantPlaceholder: Message;
    }
  | { type: "send/retry-started"; clientRequestId: string }
  | {
      type: "send/succeeded";
      clientRequestId: string;
      response: ChatGenerationResponse;
      completedAt: string;
    }
  | { type: "send/failed"; clientRequestId: string; error: ClientError }
  | { type: "message/deleted"; chatId: string; messageId: string }
  | { type: "state/cleared" };

function compareChats(left: Chat, right: Chat): number {
  const timestampOrder = right.updatedAt.localeCompare(left.updatedAt);
  return timestampOrder || right.id.localeCompare(left.id);
}

function compareMessages(left: Message, right: Message): number {
  const timestampOrder = left.createdAt.localeCompare(right.createdAt);
  if (timestampOrder) return timestampOrder;
  if (left.clientRequestId === right.clientRequestId) {
    const roleRank: Record<Message["role"], number> = { user: 0, assistant: 1, system: 2 };
    const roleOrder = roleRank[left.role] - roleRank[right.role];
    if (roleOrder) return roleOrder;
  }
  return left.id.localeCompare(right.id);
}

function orderChatIds(chatsById: Record<string, Chat>): string[] {
  return Object.values(chatsById).sort(compareChats).map((chat) => chat.id);
}

function updateChat(
  state: ChatState,
  chatId: string,
  update: (chat: Chat) => Chat,
): ChatState {
  const current = state.chatsById[chatId];
  if (!current) return state;
  const chatsById = { ...state.chatsById, [chatId]: update(current) };
  return { ...state, chatsById, orderedChatIds: orderChatIds(chatsById) };
}

function replaceMessages(chat: Chat, messages: Message[]): Chat {
  const unique = [...new Map(messages.map((message) => [message.id, message])).values()];
  return { ...chat, messages: unique.sort(compareMessages) };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "chats/load-started":
      return { ...state, chatListStatus: "loading", error: null };
    case "chats/load-succeeded": {
      const chatsById = Object.fromEntries(
        action.chats.map((chat) => [chat.id, replaceMessages(chat, chat.messages)]),
      );
      const orderedChatIds = orderChatIds(chatsById);
      const activeChatId =
        state.activeChatId && chatsById[state.activeChatId]
          ? state.activeChatId
          : (orderedChatIds[0] ?? null);
      return {
        ...state,
        chatsById,
        orderedChatIds,
        activeChatId,
        chatListStatus: "ready",
        error: null,
      };
    }
    case "chats/load-failed":
      return { ...state, chatListStatus: "error", error: action.error };
    case "chat/created": {
      const chatsById = { ...state.chatsById, [action.chat.id]: action.chat };
      return {
        ...state,
        chatsById,
        orderedChatIds: orderChatIds(chatsById),
        activeChatId: action.chat.id,
      };
    }
    case "chat/selected":
      return state.chatsById[action.chatId]
        ? { ...state, activeChatId: action.chatId }
        : state;
    case "chat/renamed": {
      if (!state.chatsById[action.chat.id]) return state;
      const chatsById = { ...state.chatsById, [action.chat.id]: action.chat };
      return { ...state, chatsById, orderedChatIds: orderChatIds(chatsById) };
    }
    case "chat/deleted": {
      const removedIndex = state.orderedChatIds.indexOf(action.chatId);
      if (removedIndex < 0) return state;
      const chatsById = { ...state.chatsById };
      delete chatsById[action.chatId];
      const orderedChatIds = state.orderedChatIds.filter((id) => id !== action.chatId);
      const activeChatId =
        state.activeChatId !== action.chatId
          ? state.activeChatId
          : (orderedChatIds[removedIndex] ?? orderedChatIds[removedIndex - 1] ?? null);
      const draftsByChatId = { ...state.draftsByChatId };
      delete draftsByChatId[action.chatId];
      return { ...state, chatsById, orderedChatIds, activeChatId, draftsByChatId };
    }
    case "draft/changed":
      return {
        ...state,
        draftsByChatId: { ...state.draftsByChatId, [action.chatId]: action.text },
      };
    case "messages/load-started":
      return {
        ...state,
        messageLoadIds: { ...state.messageLoadIds, [action.chatId]: action.requestId },
      };
    case "messages/load-succeeded": {
      if (state.messageLoadIds[action.chatId] !== action.requestId) return state;
      return updateChat(state, action.chatId, (chat) => {
        const messages = action.prepend
          ? [...action.messages, ...chat.messages]
          : action.messages;
        const unique = [...new Map(messages.map((message) => [message.id, message])).values()];
        return replaceMessages(chat, unique);
      });
    }
    case "messages/load-failed":
      return state.messageLoadIds[action.chatId] === action.requestId
        ? { ...state, error: action.error }
        : state;
    case "send/started": {
      const next = updateChat(state, action.operation.chatId, (chat) =>
        replaceMessages(
          {
            ...chat,
            updatedAt: action.userMessage.createdAt,
            lastMessageAt: action.userMessage.createdAt,
          },
          [...chat.messages, action.userMessage, action.assistantPlaceholder],
        ),
      );
      return {
        ...next,
        draftsByChatId: { ...next.draftsByChatId, [action.operation.chatId]: "" },
        sendOperations: {
          ...next.sendOperations,
          [action.operation.clientRequestId]: action.operation,
        },
      };
    }
    case "send/retry-started": {
      const operation = state.sendOperations[action.clientRequestId];
      if (!operation || operation.phase !== "failed") return state;
      const next = updateChat(state, operation.chatId, (chat) =>
        replaceMessages(
          chat,
          chat.messages.map((message) =>
            message.id === operation.assistantPlaceholderId
              ? { ...message, status: "pending" }
              : message,
          ),
        ),
      );
      return {
        ...next,
        sendOperations: {
          ...next.sendOperations,
          [action.clientRequestId]: {
            ...operation,
            phase: "retrying",
            attempts: operation.attempts + 1,
            error: null,
          },
        },
      };
    }
    case "send/succeeded": {
      const operation = state.sendOperations[action.clientRequestId];
      if (!operation) return state;
      const next = updateChat(state, operation.chatId, (chat) =>
        replaceMessages(
          chat,
          chat.messages.map((message) => {
            if (message.id === operation.userMessageId) {
              return {
                ...message,
                id: action.response.userMessage.id,
                status: action.response.userMessage.status,
                completedAt: action.completedAt,
              };
            }
            if (message.id === operation.assistantPlaceholderId) {
              return {
                ...message,
                id: action.response.assistantMessage.id,
                text: action.response.assistantMessage.text,
                status: action.response.assistantMessage.status,
                safetySupport: action.response.assistantMessage.safetySupport,
                completedAt: action.completedAt,
              };
            }
            return message;
          }),
        ),
      );
      return {
        ...next,
        sendOperations: {
          ...next.sendOperations,
          [action.clientRequestId]: {
            ...operation,
            phase: "complete",
            error: null,
          },
        },
      };
    }
    case "send/failed": {
      const operation = state.sendOperations[action.clientRequestId];
      if (!operation) return state;
      const next = updateChat(state, operation.chatId, (chat) =>
        replaceMessages(
          chat,
          chat.messages.map((message) => {
            if (message.id === operation.userMessageId) {
              return { ...message, status: "complete" };
            }
            if (message.id === operation.assistantPlaceholderId) {
              return { ...message, status: "failed" };
            }
            return message;
          }),
        ),
      );
      return {
        ...next,
        sendOperations: {
          ...next.sendOperations,
          [action.clientRequestId]: {
            ...operation,
            phase: "failed",
            error: action.error,
          },
        },
      };
    }
    case "message/deleted":
      return updateChat(state, action.chatId, (chat) =>
        replaceMessages(
          chat,
          chat.messages.map((message) =>
            message.id === action.messageId
              ? { ...message, text: "", status: "deleted" }
              : message,
          ),
        ),
      );
    case "state/cleared":
      return initialChatState;
  }
}
