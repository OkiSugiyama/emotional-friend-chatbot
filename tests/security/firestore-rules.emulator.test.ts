// @vitest-environment node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeWithEmulator = emulatorAvailable ? describe : describe.skip;
const projectId = "demo-emotional-friend-rules";
const ownerUid = "owner-user";
const otherUid = "other-user";

let environment: RulesTestEnvironment;

function canonicalUser(uid: string) {
  return {
    uid,
    displayName: "Test User",
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
  };
}

function canonicalChat(uid: string, title = "New conversation") {
  return {
    schemaVersion: 1,
    ownerUid: uid,
    title,
    titleSource: "default",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: null,
    quoteId: null,
    quoteSnapshot: null,
  };
}

async function seedOwnerTree() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `users/${ownerUid}`), {
      ...canonicalUser(ownerUid),
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    });
    await setDoc(doc(db, `users/${ownerUid}/chats/chat-1`), {
      ...canonicalChat(ownerUid),
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      updatedAt: Timestamp.fromMillis(1_700_000_000_000),
    });
    await setDoc(doc(db, `users/${ownerUid}/chats/chat-1/messages/message-1`), {
      schemaVersion: 1,
      chatId: "chat-1",
      ownerUid,
      role: "assistant",
      text: "Sensitive support reply",
      status: "complete",
      clientRequestId: "11111111-1111-4111-8111-111111111111",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      completedAt: Timestamp.fromMillis(1_700_000_001_000),
      emotionContext: { label: "sad" },
      generationMetadata: { provider: "openai" },
      variant: "safety_support",
      safetySupport: true,
      safety: { category: "self_harm_or_suicide" },
      errorCode: null,
    });
    await setDoc(doc(db, `users/${otherUid}`), {
      ...canonicalUser(otherUid),
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    });
    await setDoc(doc(db, `users/${otherUid}/chats/private-chat`), {
      ...canonicalChat(otherUid),
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      updatedAt: Timestamp.fromMillis(1_700_000_000_000),
    });
  });
}

describeWithEmulator("Firestore ownership and integrity rules", () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: await readFile(resolve(process.cwd(), "firestore.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await environment.clearFirestore();
    await seedOwnerTree();
  });

  afterAll(async () => {
    await environment?.cleanup();
  });

  test("allows owner reads and denies non-owner and anonymous reads", async () => {
    const ownerDb = environment.authenticatedContext(ownerUid).firestore();
    const otherDb = environment.authenticatedContext(otherUid).firestore();
    const anonymousDb = environment.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(ownerDb, `users/${ownerUid}/chats/chat-1`)));
    await assertFails(getDoc(doc(otherDb, `users/${ownerUid}/chats/chat-1`)));
    await assertFails(getDoc(doc(anonymousDb, `users/${ownerUid}/chats/chat-1`)));
    await assertFails(getDoc(doc(ownerDb, `users/${otherUid}/chats/private-chat`)));
    await assertFails(getDoc(doc(ownerDb, `users/${otherUid}/chats/missing-chat`)));
  });

  test("allows an exact owner profile and fail-closed consent transition", async () => {
    const uid = "new-owner";
    const db = environment.authenticatedContext(uid).firestore();
    const profileRef = doc(db, `users/${uid}`);
    await assertSucceeds(setDoc(profileRef, canonicalUser(uid)));
    await assertSucceeds(
      updateDoc(profileRef, {
        "settings.useEmotionContext": true,
        "consent.cameraNoticeVersion": "camera-notice-v1",
        "consent.cameraNoticeAcceptedAt": serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(profileRef, {
        "consent.cameraNoticeVersion": "invented-notice",
        "consent.cameraNoticeAcceptedAt": Timestamp.fromMillis(1_700_000_000_000),
      }),
    );
  });

  test("rejects forged ownership, oversized titles, and arbitrary quote payloads", async () => {
    const db = environment.authenticatedContext(ownerUid).firestore();
    await assertFails(
      setDoc(doc(db, `users/${ownerUid}/chats/forged-owner`), canonicalChat(otherUid)),
    );
    await assertFails(
      setDoc(
        doc(db, `users/${ownerUid}/chats/oversized`),
        canonicalChat(ownerUid, "x".repeat(101)),
      ),
    );
    await assertFails(
      setDoc(doc(db, `users/${ownerUid}/chats/quote-payload`), {
        ...canonicalChat(ownerUid),
        quoteSnapshot: { unreviewed: "payload" },
      }),
    );
  });

  test("denies non-owner, anonymous, and malformed client writes", async () => {
    const ownerDb = environment.authenticatedContext(ownerUid).firestore();
    const otherDb = environment.authenticatedContext(otherUid).firestore();
    const anonymousDb = environment.unauthenticatedContext().firestore();

    await assertFails(
      updateDoc(doc(otherDb, `users/${ownerUid}/chats/chat-1`), {
        title: "Stolen",
        titleSource: "user",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(anonymousDb, `users/anonymous-write`), canonicalUser("anonymous-write")),
    );
    await assertFails(
      setDoc(doc(ownerDb, `users/${ownerUid}/chats/malformed-chat`), {
        ...canonicalChat(ownerUid),
        titleSource: 42,
      }),
    );
    await assertFails(updateDoc(doc(ownerDb, `users/${ownerUid}`), { unexpected: true }));
  });

  test("denies client-created trusted messages and hard deletion", async () => {
    const db = environment.authenticatedContext(ownerUid).firestore();
    const forgedMessage = doc(db, `users/${ownerUid}/chats/chat-1/messages/forged`);
    await assertFails(
      setDoc(forgedMessage, {
        ownerUid,
        chatId: "chat-1",
        role: "assistant",
        text: "Forged assistant reply",
        status: "complete",
      }),
    );
    await assertFails(deleteDoc(doc(db, `users/${ownerUid}/chats/chat-1`)));
    await assertFails(
      setDoc(doc(db, `users/${ownerUid}/chats/chat-1/messages/oversized`), {
        ownerUid,
        chatId: "chat-1",
        role: "user",
        text: "x".repeat(8_001),
        status: "pending",
      }),
    );
    await assertFails(
      updateDoc(doc(db, `users/${ownerUid}/chats/chat-1/messages/message-1`), {
        status: "failed",
      }),
    );
  });

  test("allows only a complete privacy tombstone for an owned message", async () => {
    const db = environment.authenticatedContext(ownerUid).firestore();
    const messageRef = doc(db, `users/${ownerUid}/chats/chat-1/messages/message-1`);

    await assertFails(updateDoc(messageRef, { text: "", status: "deleted" }));
    await assertSucceeds(
      updateDoc(messageRef, {
        text: "",
        status: "deleted",
        completedAt: serverTimestamp(),
        emotionContext: deleteField(),
        generationMetadata: deleteField(),
        variant: deleteField(),
        safetySupport: deleteField(),
        safety: deleteField(),
        errorCode: deleteField(),
      }),
    );
  });

  test("denies foreign paths and server-only operation documents", async () => {
    const db = environment.authenticatedContext(ownerUid).firestore();
    await assertFails(getDoc(doc(db, `users/${otherUid}`)));
    await assertFails(
      setDoc(doc(db, `users/${ownerUid}/chats/chat-1/idempotency/request-1`), {
        state: "completed",
      }),
    );
  });
});
