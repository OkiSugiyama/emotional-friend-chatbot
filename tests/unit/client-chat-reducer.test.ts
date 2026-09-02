import { describe, expect, it } from "vitest";
import type { Chat, Message } from "../../src/types";
import {
  chatReducer,
  initialChatState,
} from "../../src/domain/chat-reducer";
import { ClientError } from "../../src/domain/errors";
import { createOptimisticSend } from "../../src/services/chat-crud";

const chat = (id: string, updatedAt: string): Chat => ({
  id,
  title: id,
  titleSource: "default",
  createdAt: updatedAt,
  updatedAt,
  lastMessageAt: null,
  messages: [],
});

const message = (id: string, chatId: string): Message => ({
  id,
  chatId,
  role: "user",
  text: id,
  status: "complete",
  clientRequestId: id,
  createdAt: "2026-08-09T00:00:00.000Z",
  completedAt: "2026-08-09T00:00:00.000Z",
  emotionContext: null,
});

describe("chat reducer", () => {
  it("orders deterministically and selects no chat after deleting the final item", () => {
    let state = chatReducer(initialChatState, {
      type: "chats/load-succeeded",
      chats: [chat("a", "2026-08-09T00:00:00.000Z"), chat("b", "2026-08-09T00:00:01.000Z")],
    });
    expect(state.orderedChatIds).toEqual(["b", "a"]);
    state = chatReducer(state, { type: "chat/deleted", chatId: "b" });
    expect(state.activeChatId).toBe("a");
    state = chatReducer(state, { type: "chat/deleted", chatId: "a" });
    expect(state.activeChatId).toBeNull();
  });

  it("ignores stale message loads", () => {
    let state = chatReducer(initialChatState, {
      type: "chats/load-succeeded",
      chats: [chat("a", "2026-08-09T00:00:00.000Z")],
    });
    state = chatReducer(state, { type: "messages/load-started", chatId: "a", requestId: "new" });
    state = chatReducer(state, {
      type: "messages/load-succeeded",
      chatId: "a",
      requestId: "old",
      messages: [message("wrong", "a")],
    });
    expect(state.chatsById.a.messages).toEqual([]);
  });

  it("orders a persisted equal-timestamp pair as user then assistant", () => {
    let state = chatReducer(initialChatState, {
      type: "chats/load-succeeded",
      chats: [chat("a", "2026-08-09T00:00:00.000Z")],
    });
    state = chatReducer(state, { type: "messages/load-started", chatId: "a", requestId: "load" });
    const user = { ...message("msg_user_z", "a"), clientRequestId: "request-z", role: "user" as const };
    const assistant = {
      ...message("msg_assistant_a", "a"),
      clientRequestId: "request-z",
      role: "assistant" as const,
    };
    state = chatReducer(state, {
      type: "messages/load-succeeded",
      chatId: "a",
      requestId: "load",
      messages: [assistant, user],
    });

    expect(state.chatsById.a.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
  });

  it("normalizes equal-timestamp pairs when restoring whole chats", () => {
    const restored = chat("a", "2026-08-09T00:00:00.000Z");
    restored.messages = [
      {
        ...message("msg_assistant_a", "a"),
        clientRequestId: "request-restored",
        role: "assistant",
      },
      {
        ...message("msg_user_z", "a"),
        clientRequestId: "request-restored",
        role: "user",
      },
    ];

    const state = chatReducer(initialChatState, {
      type: "chats/load-succeeded",
      chats: [restored],
    });

    expect(state.chatsById.a.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
  });

  it("retries in place without duplicating the user message", () => {
    let state = chatReducer(initialChatState, {
      type: "chats/load-succeeded",
      chats: [chat("a", "2026-08-09T00:00:00.000Z")],
    });
    const send = createOptimisticSend({ chatId: "a", text: "hello" });
    state = chatReducer(state, { type: "send/started", ...send });
    expect(state.chatsById.a.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
    state = chatReducer(state, {
      type: "send/failed",
      clientRequestId: send.operation.clientRequestId,
      error: new ClientError({ code: "PROVIDER_TIMEOUT", message: "timeout", retryable: true }),
    });
    state = chatReducer(state, {
      type: "send/retry-started",
      clientRequestId: send.operation.clientRequestId,
    });
    expect(state.chatsById.a.messages).toHaveLength(2);
    expect(state.chatsById.a.messages.filter((item) => item.role === "user")).toHaveLength(1);
    expect(state.chatsById.a.messages.find((item) => item.role === "assistant")?.status).toBe(
      "pending",
    );
  });
});
