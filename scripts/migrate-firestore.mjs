import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CONFIRMED_PROJECT_ID = process.env.MIGRATION_CONFIRM_PROJECT_ID;
const BACKUP_REFERENCE = process.env.MIGRATION_BACKUP_REFERENCE;
const PAGE_SIZE = 100;
const MIGRATION_STARTED_AT_MS = Date.now();
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

if (!PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID is required.");
}

if (APPLY && CONFIRMED_PROJECT_ID !== PROJECT_ID) {
  throw new Error(
    "Refusing to write. Set MIGRATION_CONFIRM_PROJECT_ID to the exact FIREBASE_PROJECT_ID."
  );
}

if (APPLY && !BACKUP_REFERENCE) {
  throw new Error(
    "Refusing to write without MIGRATION_BACKUP_REFERENCE for a verified Firestore backup."
  );
}

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const db = getFirestore();
let totals = { users: 0, usersWithExtraFields: 0, chats: 0, messages: 0, writes: 0 };
let executeWrites = false;

function normalizedTimestamp(value, { rejectFuture = false } = {}) {
  let timestamp = null;
  if (value instanceof Timestamp) timestamp = value;
  else if (value instanceof Date && Number.isFinite(value.getTime())) timestamp = Timestamp.fromDate(value);
  if (typeof value === "string") {
    const milliseconds = Date.parse(value);
    if (Number.isFinite(milliseconds)) timestamp = Timestamp.fromMillis(milliseconds);
  }
  if (!timestamp && value && typeof value === "object") {
    const seconds = value.seconds ?? value._seconds;
    const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;
    if (Number.isInteger(seconds) && Number.isInteger(nanoseconds)) {
      timestamp = new Timestamp(seconds, nanoseconds);
    }
  }
  if (timestamp && timestamp.toMillis() > MIGRATION_STARTED_AT_MS + MAX_FUTURE_SKEW_MS) {
    if (rejectFuture) throw new Error("Refusing to migrate an implausibly future timestamp.");
    return null;
  }
  return timestamp;
}

function timestampOrNow(value) {
  if (value == null) return Timestamp.now();
  const timestamp = normalizedTimestamp(value, { rejectFuture: true });
  if (!timestamp) throw new Error("Refusing to replace a malformed persisted timestamp.");
  return timestamp;
}

function assertMigratableVersion(data, recordType) {
  const version = data.schemaVersion;
  if (version == null || version === 0 || version === 1) return;
  throw new Error(`Refusing to migrate an unsupported ${recordType} schemaVersion.`);
}

function canonicalUser(uid, data) {
  if (data.createdAt != null) normalizedTimestamp(data.createdAt, { rejectFuture: true });
  const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
  const consent = data.consent && typeof data.consent === "object" ? data.consent : {};
  const acceptedAt = normalizedTimestamp(consent.cameraNoticeAcceptedAt);
  const reviewedConsent = consent.cameraNoticeVersion === "camera-notice-v1" && acceptedAt !== null;
  return {
    uid,
    displayName: typeof data.displayName === "string" ? data.displayName.slice(0, 100) : null,
    createdAt: timestampOrNow(data.createdAt),
    settings: {
      ...settings,
      useEmotionContext: reviewedConsent && settings.useEmotionContext === true,
      quotesVisible: settings.quotesVisible === true,
      locale:
        typeof settings.locale === "string" && settings.locale.trim()
          ? settings.locale.trim().slice(0, 35)
          : "en"
    },
    consent: {
      ...consent,
      cameraNoticeVersion: reviewedConsent ? "camera-notice-v1" : null,
      cameraNoticeAcceptedAt: reviewedConsent ? acceptedAt : null
    }
  };
}

function userNeedsCanonicalization(uid, data) {
  if (data.createdAt != null) normalizedTimestamp(data.createdAt, { rejectFuture: true });
  if (data.uid !== uid || !(data.createdAt instanceof Timestamp)) return true;
  if (
    (data.displayName !== null && typeof data.displayName !== "string") ||
    (typeof data.displayName === "string" && data.displayName.length > 100)
  ) return true;
  if (!data.settings || typeof data.settings !== "object") return true;
  if (typeof data.settings.useEmotionContext !== "boolean") return true;
  if (
    typeof data.settings.quotesVisible !== "boolean" ||
    typeof data.settings.locale !== "string" ||
    !data.settings.locale.trim() ||
    data.settings.locale.length > 35
  ) return true;
  if (!data.consent || typeof data.consent !== "object") return true;
  const acceptedAt = normalizedTimestamp(data.consent.cameraNoticeAcceptedAt);
  const consentPairIsEmpty =
    data.consent.cameraNoticeVersion === null && data.consent.cameraNoticeAcceptedAt === null;
  const consentPairIsReviewed =
    data.consent.cameraNoticeVersion === "camera-notice-v1" &&
    acceptedAt !== null &&
    data.consent.cameraNoticeAcceptedAt instanceof Timestamp;
  if (!consentPairIsEmpty && !consentPairIsReviewed) return true;
  return data.settings.useEmotionContext === true && !consentPairIsReviewed;
}

function chatPatch(data) {
  assertMigratableVersion(data, "chat");
  if (data.createdAt != null) normalizedTimestamp(data.createdAt, { rejectFuture: true });
  if (data.updatedAt != null) normalizedTimestamp(data.updatedAt, { rejectFuture: true });
  if (data.lastMessageAt != null) {
    normalizedTimestamp(data.lastMessageAt, { rejectFuture: true });
  }
  const patch = {};
  if (data.schemaVersion !== 1) patch.schemaVersion = 1;
  if (typeof data.title !== "string" || !data.title.trim()) {
    patch.title = typeof data.name === "string" && data.name.trim() ? data.name.trim() : "New conversation";
  }
  if (!data.titleSource) patch.titleSource = "default";
  if (!(data.createdAt instanceof Timestamp)) patch.createdAt = timestampOrNow(data.createdAt);
  if (!(data.updatedAt instanceof Timestamp)) patch.updatedAt = timestampOrNow(data.updatedAt ?? data.createdAt);
  if (data.lastMessageAt != null && !(data.lastMessageAt instanceof Timestamp)) {
    patch.lastMessageAt = timestampOrNow(data.lastMessageAt);
  }
  if (!("lastMessageAt" in data)) patch.lastMessageAt = null;
  if (!("quoteId" in data)) patch.quoteId = null;
  if (!("quoteSnapshot" in data)) patch.quoteSnapshot = null;
  return patch;
}

function messagePatch(id, chatId, uid, data) {
  assertMigratableVersion(data, "message");
  if (data.ownerUid != null && data.ownerUid !== uid) {
    throw new Error("Refusing to migrate a message with a path ownership mismatch.");
  }
  if (data.chatId != null && data.chatId !== chatId) {
    throw new Error("Refusing to migrate a message with a path chat mismatch.");
  }
  if (data.createdAt != null) normalizedTimestamp(data.createdAt, { rejectFuture: true });
  if (data.completedAt != null) normalizedTimestamp(data.completedAt, { rejectFuture: true });
  const patch = {};
  if (data.schemaVersion !== 1) patch.schemaVersion = 1;
  if (!data.chatId) patch.chatId = chatId;
  if (!data.ownerUid) patch.ownerUid = uid;
  if (!data.role) patch.role = data.isChatbot === true ? "assistant" : "user";
  if (!data.status) patch.status = "complete";
  if (!data.clientRequestId) patch.clientRequestId = `legacy_${id}`;
  if (!(data.createdAt instanceof Timestamp)) patch.createdAt = timestampOrNow(data.createdAt);
  if (!("completedAt" in data)) patch.completedAt = timestampOrNow(data.createdAt);
  else if (data.completedAt != null && !(data.completedAt instanceof Timestamp)) {
    patch.completedAt = timestampOrNow(data.completedAt);
  }
  if (!("emotionContext" in data)) {
    patch.emotionContext = {
      label: "unavailable",
      confidenceBand: null,
      modelVersion: null,
      observedAt: null
    };
  } else if (data.emotionContext && data.emotionContext.observedAt != null) {
    const observedAt = normalizedTimestamp(data.emotionContext.observedAt);
    if (!(data.emotionContext.observedAt instanceof Timestamp) || !observedAt) {
      patch.emotionContext = {
        ...(observedAt
          ? { ...data.emotionContext, observedAt }
          : {
              label: "unavailable",
              confidenceBand: null,
              modelVersion: null,
              observedAt: null
            })
      };
    }
  }
  if (!("generationMetadata" in data)) {
    patch.generationMetadata = {
      provider: null,
      model: null,
      promptVersion: null
    };
  }
  return patch;
}

async function applyPatches(patches) {
  if (!patches.length) return;
  totals.writes += patches.length;
  if (!executeWrites) return;

  for (let offset = 0; offset < patches.length; offset += 400) {
    const batch = db.batch();
    for (const { ref, data } of patches.slice(offset, offset + 400)) {
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
}

async function migrateMessages(uid, chatRef) {
  let cursor;
  do {
    let query = chatRef.collection("messages").orderBy("__name__").limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const patches = [];
    for (const document of snapshot.docs) {
      totals.messages += 1;
      const patch = messagePatch(document.id, chatRef.id, uid, document.data());
      if (Object.keys(patch).length) patches.push({ ref: document.ref, data: patch });
    }
    await applyPatches(patches);
    cursor = snapshot.docs.at(-1);
    if (snapshot.size < PAGE_SIZE) break;
  } while (cursor);
}

async function migrateChats(uid, userRef) {
  let cursor;
  do {
    let query = userRef.collection("chats").orderBy("__name__").limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const patches = [];
    for (const document of snapshot.docs) {
      totals.chats += 1;
      const data = document.data();
      if (data.ownerUid != null && data.ownerUid !== uid) {
        throw new Error("Refusing to migrate a chat with a path ownership mismatch.");
      }
      const patch = chatPatch(data);
      if (!data.ownerUid) patch.ownerUid = uid;
      if (Object.keys(patch).length) patches.push({ ref: document.ref, data: patch });
      await migrateMessages(uid, document.ref);
    }
    await applyPatches(patches);
    cursor = snapshot.docs.at(-1);
    if (snapshot.size < PAGE_SIZE) break;
  } while (cursor);
}

async function migrateAllUsers() {
  const userRefs = await db.collection("users").listDocuments();
  for (const userRef of userRefs) {
    totals.users += 1;
    const snapshot = await userRef.get();
    if (snapshot.exists) {
      const data = snapshot.data();
      assertMigratableVersion(data, "user");
      if (data.uid != null && data.uid !== userRef.id) {
        throw new Error("Refusing to migrate a user with a path ownership mismatch.");
      }
      const topLevelExtras = Object.keys(data).filter(
        (key) => !["uid", "displayName", "createdAt", "settings", "consent"].includes(key)
      );
      const settingsExtras = Object.keys(data.settings ?? {}).filter(
        (key) => !["useEmotionContext", "quotesVisible", "locale"].includes(key)
      );
      const consentExtras = Object.keys(data.consent ?? {}).filter(
        (key) => !["cameraNoticeVersion", "cameraNoticeAcceptedAt"].includes(key)
      );
      if (topLevelExtras.length + settingsExtras.length + consentExtras.length > 0) {
        totals.usersWithExtraFields += 1;
      }
      if (userNeedsCanonicalization(userRef.id, data)) {
        await applyPatches([{ ref: userRef, data: canonicalUser(userRef.id, data) }]);
      }
    }
    await migrateChats(userRef.id, userRef);
  }
}

await migrateAllUsers();

if (APPLY) {
  totals = { users: 0, usersWithExtraFields: 0, chats: 0, messages: 0, writes: 0 };
  executeWrites = true;
  await migrateAllUsers();
}

const mode = APPLY ? "applied" : "planned";
process.stdout.write(`${JSON.stringify({ mode, projectId: PROJECT_ID, ...totals }, null, 2)}\n`);

if (!APPLY && totals.writes > 0) {
  process.stdout.write(
    "Dry run only. Review counts on a production-like copy, then set MIGRATION_CONFIRM_PROJECT_ID and run npm run migrate:apply.\n"
  );
}
