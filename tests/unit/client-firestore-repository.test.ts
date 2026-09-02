import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  deleteField: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>("firebase/firestore");
  return { ...actual, ...firestoreMocks };
});

import {
  FirestoreChatRepository,
  P0_CAMERA_NOTICE_VERSION,
  decodeFirestoreMessage,
  ensureFirestoreUserProfile,
} from "../../src/services/firestore-repository";

describe("Firestore repository write contracts", () => {
  const firestore = { name: "test-firestore" } as never;
  const timestamp = { _methodName: "serverTimestamp" };
  const deletedField = { _methodName: "deleteField" };

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.serverTimestamp.mockReturnValue(timestamp);
    firestoreMocks.deleteField.mockReturnValue(deletedField);
  });

  it("records the P0 camera notice through exact non-destructive consent fields", async () => {
    const reference = { path: "users/user-1" };
    firestoreMocks.doc.mockReturnValue(reference);
    const repository = new FirestoreChatRepository(firestore, "user-1", vi.fn());

    await repository.recordCameraNoticeAcceptance();

    expect(P0_CAMERA_NOTICE_VERSION).toBe("camera-notice-v1");
    expect(firestoreMocks.doc).toHaveBeenCalledWith(firestore, "users", "user-1");
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(reference, {
      "consent.cameraNoticeVersion": P0_CAMERA_NOTICE_VERSION,
      "consent.cameraNoticeAcceptedAt": timestamp,
    });
  });

  it("updates only the registered user's emotion-context tone setting", async () => {
    const reference = { path: "users/user-1" };
    firestoreMocks.doc.mockReturnValue(reference);
    const repository = new FirestoreChatRepository(firestore, "user-1", vi.fn());

    await repository.setUseEmotionContext(true);

    expect(firestoreMocks.doc).toHaveBeenCalledWith(firestore, "users", "user-1");
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(reference, {
      "settings.useEmotionContext": true,
    });
  });

  it("restores the safety-card flag from the server-persisted message variant", () => {
    const message = decodeFirestoreMessage({
      id: "assistant-safety",
      data: () => ({
        chatId: "chat-1",
        role: "assistant",
        text: "Please contact immediate local support.",
        status: "complete",
        clientRequestId: "request-safety",
        createdAt: "2026-08-09T00:00:00.000Z",
        completedAt: "2026-08-09T00:00:01.000Z",
        emotionContext: null,
        safetySupport: false,
        variant: "safety_support",
        safety: {
          category: "self_harm_or_suicide",
          policyVersion: "safety-routing-v1",
          copyVersion: "location-neutral-placeholder-v1",
          locationNeutral: true,
          requiresReview: true,
        },
      }),
    } as never);

    expect(message).toMatchObject({
      id: "assistant-safety",
      safetySupport: true,
    });

    const explicitlyFlagged = decodeFirestoreMessage({
      id: "assistant-explicit",
      data: () => ({
        chatId: "chat-1",
        role: "assistant",
        text: "Support response",
        status: "complete",
        clientRequestId: "request-explicit",
        createdAt: "2026-08-09T00:00:00.000Z",
        completedAt: "2026-08-09T00:00:01.000Z",
        emotionContext: null,
        safetySupport: true,
        variant: "assistant",
      }),
    } as never);
    expect(explicitlyFlagged.safetySupport).toBe(true);
  });

  it("creates the canonical user record with an immutable uid matching its path", async () => {
    const reference = { path: "users/user-1" };
    firestoreMocks.doc.mockReturnValue(reference);
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    await ensureFirestoreUserProfile(firestore, {
      uid: "user-1",
      displayName: "Rowan",
    } as Parameters<typeof ensureFirestoreUserProfile>[1]);

    expect(firestoreMocks.doc).toHaveBeenCalledWith(firestore, "users", "user-1");
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(reference, {
      uid: "user-1",
      displayName: "Rowan",
      createdAt: timestamp,
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
  });

  it("tombstones only mutable message fields and preserves immutable metadata", async () => {
    const reference = { path: "users/user-1/chats/chat-1/messages/message-1" };
    firestoreMocks.doc.mockReturnValue(reference);
    const repository = new FirestoreChatRepository(firestore, "user-1", vi.fn());

    await repository.deleteMessage("chat-1", "message-1");

    expect(firestoreMocks.doc).toHaveBeenCalledWith(
      firestore,
      "users",
      "user-1",
      "chats",
      "chat-1",
      "messages",
      "message-1",
    );
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(reference, {
      text: "",
      status: "deleted",
      completedAt: timestamp,
      emotionContext: deletedField,
      generationMetadata: deletedField,
      safety: deletedField,
      variant: deletedField,
      errorCode: deletedField,
      safetySupport: deletedField,
    });
    const update = firestoreMocks.updateDoc.mock.calls[0][1];
    expect(update).toHaveProperty("emotionContext", deletedField);
    expect(update).toHaveProperty("generationMetadata", deletedField);
    expect(update).toHaveProperty("safety", deletedField);
    expect(update).toHaveProperty("variant", deletedField);
    expect(update).toHaveProperty("errorCode", deletedField);
    expect(update).toHaveProperty("safetySupport", deletedField);
  });
});
