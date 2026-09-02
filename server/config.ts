import { z } from "zod";
import { ConfigurationError } from "./errors.js";

const optionalNonEmpty = z.string().trim().min(1).optional();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional().default("production"),
    ALLOWED_ORIGINS: z.string().optional().default(""),
    RELEASE_VERSION: optionalNonEmpty,
    GUEST_TOKEN_HMAC_SECRET: optionalNonEmpty,
    SAFETY_IDENTIFIER_HMAC_SECRET: optionalNonEmpty,
    RATE_LIMIT_HMAC_SECRET: optionalNonEmpty,
    CLERK_JWT_KEY: optionalNonEmpty,
    FIREBASE_SERVICE_ACCOUNT_JSON: optionalNonEmpty,
    FIREBASE_PROJECT_ID: optionalNonEmpty,
    FIREBASE_CLIENT_EMAIL: optionalNonEmpty,
    FIREBASE_PRIVATE_KEY: optionalNonEmpty,
    FIREBASE_USE_EMULATORS: z.enum(["true", "false"]).optional().default("false"),
    FIRESTORE_EMULATOR_HOST: optionalNonEmpty,
    FIREBASE_AUTH_EMULATOR_HOST: optionalNonEmpty,
    OPENAI_API_KEY: optionalNonEmpty,
    OPENAI_MODEL: optionalNonEmpty,
    OPENAI_SYSTEM_PROMPT: optionalNonEmpty,
    OPENAI_PROMPT_VERSION: optionalNonEmpty,
    OPENAI_HISTORY_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
    OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
    OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(8_192).default(800),
    GUEST_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3_600).default(1_800),
    REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().min(8_192).max(262_144).default(65_536),
    REGISTERED_RATE_LIMIT: z.coerce.number().int().min(1).max(1_000).default(20),
    GUEST_RATE_LIMIT: z.coerce.number().int().min(1).max(1_000).default(5),
    IP_RATE_LIMIT: z.coerce.number().int().min(1).max(5_000).default(30),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
    DELETE_BATCH_SIZE: z.coerce.number().int().min(1).max(400).default(200),
    EMOTION_CONTEXT_MAX_AGE_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(300_000),
    EMOTION_CONTEXT_FUTURE_SKEW_MS: z.coerce.number().int().min(0).max(300_000).default(30_000),
    PROVIDER_CONCURRENCY_LIMIT: z.coerce.number().int().min(1).max(100).default(20),
    SUPPORTED_CAMERA_NOTICE_VERSIONS: z.string().optional().default("camera-notice-v1"),
    IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().min(3_600).max(2_592_000).default(86_400),
  })
  .passthrough();

export interface ServerConfig {
  environment: "development" | "test" | "production";
  allowedOrigins: ReadonlySet<string>;
  releaseVersion?: string;
  guestTokenSecret?: string;
  safetyIdentifierSecret?: string;
  rateLimitSecret?: string;
  clerkJwtKey?: string;
  firebaseServiceAccountJson?: string;
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  firebaseUseEmulators: boolean;
  firestoreEmulatorHost?: string;
  firebaseAuthEmulatorHost?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  openAiSystemPrompt?: string;
  openAiPromptVersion?: string;
  openAiHistoryLimit: number;
  openAiTimeoutMs: number;
  openAiMaxOutputTokens: number;
  guestTokenTtlSeconds: number;
  requestBodyLimitBytes: number;
  registeredRateLimit: number;
  guestRateLimit: number;
  ipRateLimit: number;
  rateLimitWindowMs: number;
  deleteBatchSize: number;
  emotionContextMaxAgeMs: number;
  emotionContextFutureSkewMs: number;
  providerConcurrencyLimit: number;
  supportedCameraNoticeVersions: ReadonlySet<string>;
  idempotencyTtlSeconds: number;
}

export function loadServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) throw new ConfigurationError();
  const value = parsed.data;
  const firebaseUseEmulators = value.FIREBASE_USE_EMULATORS === "true";
  validateFirebaseTopology({
    environment: value.NODE_ENV,
    firebaseUseEmulators,
    projectId: value.FIREBASE_PROJECT_ID,
    serviceAccountJson: value.FIREBASE_SERVICE_ACCOUNT_JSON,
    clientEmail: value.FIREBASE_CLIENT_EMAIL,
    privateKey: value.FIREBASE_PRIVATE_KEY,
    firestoreHost: value.FIRESTORE_EMULATOR_HOST,
    authHost: value.FIREBASE_AUTH_EMULATOR_HOST,
  });
  const allowedOrigins = parseAllowedOrigins(value.ALLOWED_ORIGINS, value.NODE_ENV);
  return {
    environment: value.NODE_ENV,
    allowedOrigins,
    releaseVersion: value.RELEASE_VERSION,
    guestTokenSecret: value.GUEST_TOKEN_HMAC_SECRET,
    safetyIdentifierSecret: value.SAFETY_IDENTIFIER_HMAC_SECRET,
    rateLimitSecret: value.RATE_LIMIT_HMAC_SECRET,
    clerkJwtKey: value.CLERK_JWT_KEY,
    firebaseServiceAccountJson: value.FIREBASE_SERVICE_ACCOUNT_JSON,
    firebaseProjectId: value.FIREBASE_PROJECT_ID,
    firebaseClientEmail: value.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: value.FIREBASE_PRIVATE_KEY,
    firebaseUseEmulators,
    firestoreEmulatorHost: value.FIRESTORE_EMULATOR_HOST,
    firebaseAuthEmulatorHost: value.FIREBASE_AUTH_EMULATOR_HOST,
    openAiApiKey: value.OPENAI_API_KEY,
    openAiModel: value.OPENAI_MODEL,
    openAiSystemPrompt: value.OPENAI_SYSTEM_PROMPT,
    openAiPromptVersion: value.OPENAI_PROMPT_VERSION,
    openAiHistoryLimit: value.OPENAI_HISTORY_LIMIT,
    openAiTimeoutMs: value.OPENAI_TIMEOUT_MS,
    openAiMaxOutputTokens: value.OPENAI_MAX_OUTPUT_TOKENS,
    guestTokenTtlSeconds: value.GUEST_TOKEN_TTL_SECONDS,
    requestBodyLimitBytes: value.REQUEST_BODY_LIMIT_BYTES,
    registeredRateLimit: value.REGISTERED_RATE_LIMIT,
    guestRateLimit: value.GUEST_RATE_LIMIT,
    ipRateLimit: value.IP_RATE_LIMIT,
    rateLimitWindowMs: value.RATE_LIMIT_WINDOW_MS,
    deleteBatchSize: value.DELETE_BATCH_SIZE,
    emotionContextMaxAgeMs: value.EMOTION_CONTEXT_MAX_AGE_MS,
    emotionContextFutureSkewMs: value.EMOTION_CONTEXT_FUTURE_SKEW_MS,
    providerConcurrencyLimit: value.PROVIDER_CONCURRENCY_LIMIT,
    supportedCameraNoticeVersions: new Set(
      value.SUPPORTED_CAMERA_NOTICE_VERSIONS.split(",")
        .map((version) => version.trim())
        .filter(Boolean),
    ),
    idempotencyTtlSeconds: value.IDEMPOTENCY_TTL_SECONDS,
  };
}

export function requireSecret(value: string | undefined): string {
  if (!value || Buffer.byteLength(value, "utf8") < 32) throw new ConfigurationError();
  return value;
}

export function requireValue(value: string | undefined): string {
  if (!value) throw new ConfigurationError();
  return value;
}

function parseAllowedOrigins(
  raw: string,
  environment: ServerConfig["environment"],
): ReadonlySet<string> {
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of origins) {
    if (origin === "*") throw new ConfigurationError();
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new ConfigurationError();
    }
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.origin !== origin
    ) {
      throw new ConfigurationError();
    }
    if (parsed.protocol === "http:") {
      if (environment === "production" || !isLoopbackHostname(parsed.hostname)) {
        throw new ConfigurationError();
      }
    }
  }
  return new Set(origins);
}

function validateFirebaseTopology(input: {
  environment: ServerConfig["environment"];
  firebaseUseEmulators: boolean;
  projectId?: string;
  serviceAccountJson?: string;
  clientEmail?: string;
  privateKey?: string;
  firestoreHost?: string;
  authHost?: string;
}): void {
  if (!input.firebaseUseEmulators) {
    if (input.firestoreHost || input.authHost) throw new ConfigurationError();
    return;
  }
  if (
    input.environment === "production" ||
    !input.projectId ||
    !input.firestoreHost ||
    !input.authHost ||
    !isLoopbackHostPort(input.firestoreHost) ||
    !isLoopbackHostPort(input.authHost) ||
    input.serviceAccountJson ||
    input.clientEmail ||
    input.privateKey
  ) {
    throw new ConfigurationError();
  }
}

function isLoopbackHostPort(value: string): boolean {
  const match = /^(\[[^\]]+\]|[^:]+):(\d{1,5})$/.exec(value);
  if (!match || !isLoopbackHostname(match[1])) return false;
  const port = Number(match[2]);
  return Number.isInteger(port) && port >= 1 && port <= 65_535;
}

function isLoopbackHostname(value: string): boolean {
  const hostname = value.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
