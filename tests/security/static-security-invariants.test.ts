import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

function parseEnvTemplate(source: string) {
  return new Map(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)] as const;
      })
  );
}

describe("static security and privacy invariants", () => {
  it("keeps Firestore ownership checks authenticated and deny-by-default", () => {
    const rules = readWorkspaceFile("firestore.rules");
    const compactRules = rules.replace(/\s+/g, " ");

    expect(rules).toContain("rules_version = '2'");
    expect(compactRules).toContain(
      "return request.auth != null && request.auth.uid == uid;"
    );
    expect(compactRules).toContain("match /users/{uid}");
    expect(compactRules).toContain("match /chats/{chatId}");
    expect(compactRules).toContain("match /messages/{messageId}");
    expect(compactRules).toContain("request.resource.data.ownerUid == uid");
    expect(compactRules).toContain("resource.data.ownerUid == uid");
    expect(compactRules).toContain(
      "match /{document=**} { allow read, write: if false; }"
    );
    expect(rules).not.toMatch(/allow\s+(?:read|write|create|update|delete)[^;]*:\s*if\s+true\s*;/);
  });

  it("requires canonical user fields, types, identity, and update boundaries", () => {
    const compactRules = readWorkspaceFile("firestore.rules").replace(/\s+/g, " ");

    expect(compactRules).toContain("function validUserCore(uid, createdAt)");
    expect(compactRules).toContain("function validUserCreate(uid)");
    expect(compactRules).toContain("return validUserCore(uid, request.time)");
    expect(compactRules).toContain(
      ".keys().hasOnly([ 'uid', 'displayName', 'createdAt', 'settings', 'consent' ])"
    );
    expect(compactRules).toContain("request.resource.data.uid == uid");
    expect(compactRules).toContain("request.resource.data.createdAt == createdAt");
    expect(compactRules).toContain("request.resource.data.settings is map");
    expect(compactRules).toContain(
      ".settings.keys().hasOnly([ 'useEmotionContext', 'quotesVisible', 'locale' ])"
    );
    expect(compactRules).toContain(
      "request.resource.data.settings.useEmotionContext is bool"
    );
    expect(compactRules).toContain(
      "request.resource.data.settings.quotesVisible is bool"
    );
    expect(compactRules).toContain("request.resource.data.settings.locale is string");
    expect(compactRules).toContain("request.resource.data.consent is map");
    expect(compactRules).toContain(
      ".consent.keys().hasOnly([ 'cameraNoticeVersion', 'cameraNoticeAcceptedAt' ])"
    );
    expect(compactRules).toContain(
      "request.resource.data.consent.cameraNoticeAcceptedAt is timestamp"
    );
    expect(compactRules).toContain("function validConsentUpdate()");
    expect(compactRules).toContain(
      "request.resource.data.consent == resource.data.consent"
    );
    expect(compactRules).toContain(
      "request.resource.data.consent.cameraNoticeVersion == 'camera-notice-v1'"
    );
    expect(compactRules).toContain(
      "request.resource.data.consent.cameraNoticeAcceptedAt == request.time"
    );
    expect(compactRules).toContain("function validUserUpdate(uid)");
    expect(compactRules).toContain(
      "return validUserCore(uid, resource.data.createdAt)"
    );
    expect(compactRules).toContain(
      "request.resource.data.uid == resource.data.uid"
    );
    expect(compactRules).toContain(
      ".affectedKeys() .hasOnly(['displayName', 'settings', 'consent'])"
    );
    expect(compactRules).toContain(
      ".settings.diff(resource.data.settings).affectedKeys() .hasOnly(['useEmotionContext', 'quotesVisible', 'locale'])"
    );
    expect(compactRules).toContain(
      ".consent.diff(resource.data.consent).affectedKeys() .hasOnly(['cameraNoticeVersion', 'cameraNoticeAcceptedAt'])"
    );
    expect(compactRules).toContain("&& validConsentUpdate();");
    expect(compactRules).toContain(
      "allow create: if signedInAs(uid) && validUserCreate(uid);"
    );
    expect(compactRules).toContain(
      "allow update: if signedInAs(uid) && validUserUpdate(uid);"
    );
  });

  it("keeps client chat creates and updates ownership-bound and field-restricted", () => {
    const compactRules = readWorkspaceFile("firestore.rules").replace(/\s+/g, " ");

    expect(compactRules).toContain("function validChatCreate(uid)");
    expect(compactRules).toContain("function validChatUpdate(uid)");
    expect(compactRules).toContain("request.resource.data.title.size() > 0");
    expect(compactRules).toContain("request.resource.data.title.size() <= 100");
    expect(compactRules).toContain(
      "request.resource.data.titleSource in ['default', 'generated', 'user']"
    );
    expect(compactRules).toContain("request.resource.data.updatedAt == request.time");
    expect(compactRules).toContain(
      ".affectedKeys() .hasOnly(['title', 'titleSource', 'updatedAt'])"
    );
    expect(compactRules).toContain(
      "allow create: if signedInAs(uid) && validChatCreate(uid);"
    );
    expect(compactRules).toContain(
      "allow update: if signedInAs(uid) && validChatUpdate(uid);"
    );
  });

  it("keeps chat deletion and message creation/document deletion backend-only", () => {
    const rules = readWorkspaceFile("firestore.rules");
    const compactRules = rules.replace(/\s+/g, " ");
    const chatBlock = compactRules.indexOf("match /chats/{chatId}");
    const chatDeleteDenial = compactRules.indexOf(
      "allow delete: if false;",
      chatBlock
    );
    const messageBlock = compactRules.indexOf(
      "match /messages/{messageId}",
      chatBlock
    );

    expect(chatBlock).toBeGreaterThanOrEqual(0);
    expect(chatDeleteDenial).toBeGreaterThan(chatBlock);
    expect(messageBlock).toBeGreaterThan(chatDeleteDenial);
    expect(compactRules).toContain("allow create, delete: if false;");
    expect(compactRules).toContain(
      "allow update: if signedInAs(uid) && validMessageDeletion(uid);"
    );
  });

  it("limits direct message updates to an immutable-identity transition to deleted", () => {
    const rules = readWorkspaceFile("firestore.rules");
    const compactRules = rules.replace(/\s+/g, " ");
    const deletionFunction = rules.match(
      /function\s+validMessageDeletion\(uid\)\s*\{([\s\S]*?)\n\s*\}/
    )?.[1] ?? "";

    expect(compactRules).toContain("function validMessageDeletion(uid)");
    expect(compactRules).toContain("resource.data.ownerUid == uid");
    expect(compactRules).toContain("request.resource.data.ownerUid == uid");
    expect(compactRules).toContain(
      "request.resource.data.role == resource.data.role"
    );
    expect(compactRules).toContain(
      "request.resource.data.chatId == resource.data.chatId"
    );
    expect(compactRules).toContain(
      "request.resource.data.clientRequestId == resource.data.clientRequestId"
    );
    expect(compactRules).toContain(
      "request.resource.data.createdAt == resource.data.createdAt"
    );
    expect(compactRules).toContain("resource.data.status != 'deleted'");
    expect(compactRules).toContain("request.resource.data.status == 'deleted'");
    expect(compactRules).toContain("request.resource.data.text == ''");
    expect(compactRules).toContain(
      "request.resource.data.completedAt == request.time"
    );
    const removedTombstoneFields = [
      "emotionContext",
      "generationMetadata",
      "safety",
      "safetySupport",
      "variant",
      "errorCode"
    ];
    for (const field of removedTombstoneFields) {
      expect(deletionFunction).toContain(
        `!('${field}' in request.resource.data)`
      );
    }

    const retainedSensitiveSafetyMetadata = ["safety", "safetySupport"].filter(
      (field) =>
        !deletionFunction.includes(`!('${field}' in request.resource.data)`)
    );
    expect(
      retainedSensitiveSafetyMetadata,
      "deleted messages must not retain sensitive safety metadata"
    ).toEqual([]);

    const affectedKeysSource = deletionFunction.match(
      /affectedKeys\(\)\s*\.hasOnly\(\s*\[([\s\S]*?)\]\s*\)/
    )?.[1] ?? "";
    const affectedKeys = Array.from(
      affectedKeysSource.matchAll(/'([^']+)'/g),
      (match) => match[1]
    );
    expect([...affectedKeys].sort()).toEqual(
      [
        "text",
        "status",
        "completedAt",
        ...removedTombstoneFields
      ].sort()
    );
    expect(rules).not.toMatch(/function\s+validMessage\s*\(/);
  });

  it("keeps idempotency records inaccessible to clients", () => {
    const compactRules = readWorkspaceFile("firestore.rules").replace(/\s+/g, " ");

    expect(compactRules).toContain(
      "match /idempotency/{requestId} { allow read, write: if false; }"
    );
  });

  it("ships restrictive browser security and device permissions headers", () => {
    const deployment = JSON.parse(readWorkspaceFile("vercel.json")) as {
      headers: Array<{
        source: string;
        headers: Array<{ key: string; value: string }>;
      }>;
    };
    const globalHeaders = deployment.headers.find(({ source }) => source === "/(.*)");
    const headers = new Map(
      globalHeaders?.headers.map(({ key, value }) => [key.toLowerCase(), value])
    );
    const csp = headers.get("content-security-policy") ?? "";

    expect(globalHeaders).toBeDefined();
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("strict-transport-security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("permissions-policy")).toContain("camera=(self)");
    expect(headers.get("permissions-policy")).toContain("microphone=()");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("https://*.clerk.accounts.dev");
    expect(csp).toContain("https://*.protect.clerk.com");
    expect(csp).toContain("font-src 'self' data:");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/u);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("keeps server credentials out of public environment variables and examples", () => {
    const environment = parseEnvTemplate(readWorkspaceFile(".env.example"));
    const serverSecrets = [
      "OPENAI_API_KEY",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_SERVICE_ACCOUNT_JSON",
      "GUEST_TOKEN_HMAC_SECRET",
      "SAFETY_IDENTIFIER_HMAC_SECRET",
      "RATE_LIMIT_HMAC_SECRET"
    ];

    for (const key of serverSecrets) {
      expect(environment.has(key), key).toBe(true);
      expect(environment.get(key), key).toBe("");
      expect(environment.has(`VITE_${key}`), `VITE_${key}`).toBe(false);
    }

    for (const [key, value] of environment) {
      if (/(?:API_KEY|PRIVATE_KEY|SECRET|CLIENT_EMAIL)$/.test(key)) {
        expect(value, `${key} must remain a placeholder`).toBe("");
      }
    }
  });

  it("uses the exact active security configuration names without deprecated aliases", () => {
    const environment = parseEnvTemplate(readWorkspaceFile(".env.example"));
    const serverConfig = readWorkspaceFile("server/config.ts");
    const expectedSecurityConfigNames = [
      "ALLOWED_ORIGINS",
      "GUEST_TOKEN_HMAC_SECRET",
      "SAFETY_IDENTIFIER_HMAC_SECRET",
      "RATE_LIMIT_HMAC_SECRET",
      "CLERK_JWT_KEY",
      "GUEST_TOKEN_TTL_SECONDS",
      "REQUEST_BODY_LIMIT_BYTES",
      "REGISTERED_RATE_LIMIT",
      "GUEST_RATE_LIMIT",
      "IP_RATE_LIMIT",
      "RATE_LIMIT_WINDOW_MS",
      "DELETE_BATCH_SIZE",
      "OPENAI_TIMEOUT_MS",
      "OPENAI_MAX_OUTPUT_TOKENS"
    ];
    const deprecatedAliases = [
      "GUEST_SESSION_SECRET",
      "RATE_LIMIT_REGISTERED_PER_MINUTE",
      "RATE_LIMIT_GUEST_PER_MINUTE",
      "AI_HISTORY_LIMIT",
      "AI_TIMEOUT_MS"
    ];

    for (const name of expectedSecurityConfigNames) {
      expect(environment.has(name), `.env.example:${name}`).toBe(true);
      expect(serverConfig, `server/config.ts:${name}`).toMatch(
        new RegExp(`\\b${name}\\b`)
      );
    }
    for (const name of deprecatedAliases) {
      expect(environment.has(name), `.env.example:${name}`).toBe(false);
      expect(serverConfig, `server/config.ts:${name}`).not.toMatch(
        new RegExp(`\\b${name}\\b`)
      );
    }
  });

  it("allowlists only documented public VITE environment names", () => {
    const environment = parseEnvTemplate(readWorkspaceFile(".env.example"));
    const clientEnvTypes = readWorkspaceFile("src/env.d.ts");
    const documentedPublicNames = [...environment.keys()]
      .filter((name) => name.startsWith("VITE_"))
      .sort();
    const typedPublicNames = [
      ...clientEnvTypes.matchAll(/readonly (VITE_[A-Z0-9_]+)\??:/g)
    ]
      .map(([, name]) => name)
      .sort();

    expect(typedPublicNames).toEqual(documentedPublicNames);
    expect(documentedPublicNames).toEqual([
      "VITE_CLERK_PUBLISHABLE_KEY",
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_APP_ID",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_AUTH_EMULATOR_HOST",
      "VITE_FIREBASE_AUTH_EMULATOR_PORT",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIRESTORE_EMULATOR_HOST",
      "VITE_FIRESTORE_EMULATOR_PORT",
      "VITE_RELEASE_VERSION",
      "VITE_USE_FIREBASE_EMULATORS"
    ]);
  });

  it("uses Authorization for guest tokens and exposes no X-Guest header contract", () => {
    const activeSecuritySurfaces = [
      readWorkspaceFile("server/http.ts"),
      readWorkspaceFile("server/security.ts"),
      readWorkspaceFile("server/config.ts"),
      readWorkspaceFile("vercel.json"),
      readWorkspaceFile(".env.example")
    ].join("\n");
    const http = readWorkspaceFile("server/http.ts");

    expect(http).toContain(
      '"Authorization, Content-Type, Idempotency-Key, X-Request-Id"'
    );
    expect(http).toContain("/^Bearer ([^\\s]+)$/");
    expect(activeSecuritySurfaces).not.toMatch(/\bx-guest(?:-[a-z0-9-]+)?\b/i);
  });

  it("documents redacted client diagnostics instead of sensitive telemetry", () => {
    const template = readWorkspaceFile(".env.example");

    expect(template).toContain(
      "# Optional client diagnostics. Never send message or camera content."
    );
    expect(template).toContain("VITE_RELEASE_VERSION=development");
    expect(template).not.toMatch(/VITE_(?:OPENAI|FIREBASE_ADMIN|GUEST_SESSION_SECRET)/);
  });
});
