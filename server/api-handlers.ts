import type { ApiHandler, ApiRequest, ApiResponse } from "./http-types.js";
import { loadServerConfig, requireSecret, requireValue, type ServerConfig } from "./config.js";
import {
  chatMessageResponseSchema,
  chatIdSchema,
  clientEventRequestSchema,
  deleteRequestFingerprint,
  guestSessionRequestSchema,
  idempotencyKeySchema,
  messageRequestSchema,
  parseWithSchema,
  requestFingerprint,
  sanitizeMessageRequest,
  type MessageRequest,
  type RecentHistoryMessage,
} from "./contracts.js";
import type {
  ProviderConcurrencyLease,
  ProviderConcurrencyLimiter,
} from "./concurrency.js";
import { AppError, ConfigurationError } from "./errors.js";
import { ClerkTokenVerifier } from "./clerk-auth.js";
import { createFirebaseCustomToken, FirestoreChatRepository } from "./firebase-adapters.js";
import type { GuestIdempotencyStore } from "./guest-idempotency.js";
import {
  FirestoreGuestIdempotencyStore,
  FirestoreProviderConcurrencyLimiter,
  FirestoreRateLimiter,
  FirestoreReadinessProbe,
  type ReadinessProbe,
} from "./firestore-operational-adapters.js";
import {
  enforceCors,
  enforceMethod,
  getBearerToken,
  getClientAddress,
  getIdempotencyKey,
  getQueryValue,
  initializeRequest,
  logCompleted,
  readJsonBody,
  writeEmpty,
  writeError,
  writeJson,
  type RequestContext,
} from "./http.js";
import { AllowlistLogger } from "./logger.js";
import { OpenAIResponsesProvider, ProviderTimeoutError, ProviderUnavailableError } from "./openai-provider.js";
import type {
  ChatRepository,
  CompletedSend,
  ConversationProvider,
  RegisteredTokenVerifier,
  Principal,
} from "./ports.js";
import type { RateLimiter } from "./rate-limit.js";
import { HmacGuestTokenService, operationKeyHash, pseudonymousIdentifier } from "./security.js";
import { routeHighRisk, SAFETY_POLICY_VERSION, validateProviderOutput } from "./safety.js";

export interface ApiDependencies {
  env?: NodeJS.ProcessEnv;
  rateLimiter?: RateLimiter;
  guestIdempotency?: GuestIdempotencyStore;
  logger?: AllowlistLogger;
  registeredAuth?: RegisteredTokenVerifier;
  chatRepository?: ChatRepository;
  provider?: ConversationProvider;
  providerConcurrency?: ProviderConcurrencyLimiter;
  readinessProbe?: ReadinessProbe;
  firebaseTokenIssuer?: (config: ServerConfig, uid: string) => Promise<string>;
  now?: () => number;
}

export interface ApiHandlers {
  health: ApiHandler;
  clientEvent: ApiHandler;
  guestSession: ApiHandler;
  postMessage: ApiHandler;
  deleteChat: ApiHandler;
  firebaseToken: ApiHandler;
}

export function createApiHandlers(dependencies: ApiDependencies = {}): ApiHandlers {
  const env = dependencies.env ?? process.env;
  const logger = dependencies.logger ?? new AllowlistLogger();
  const now = dependencies.now ?? Date.now;
  let durableLimiter: RateLimiter | undefined;
  let durableGuestOperations: GuestIdempotencyStore | undefined;
  let durableProviderConcurrency: ProviderConcurrencyLimiter | undefined;
  let durableReadinessProbe: ReadinessProbe | undefined;

  const getLimiter = (config: ServerConfig): RateLimiter => {
    if (dependencies.rateLimiter) return dependencies.rateLimiter;
    durableLimiter ??= new FirestoreRateLimiter(config, now);
    return durableLimiter;
  };

  const getGuestOperations = (config: ServerConfig): GuestIdempotencyStore => {
    if (dependencies.guestIdempotency) return dependencies.guestIdempotency;
    durableGuestOperations ??= new FirestoreGuestIdempotencyStore(config, now);
    return durableGuestOperations;
  };

  const getProviderConcurrency = (config: ServerConfig): ProviderConcurrencyLimiter => {
    if (dependencies.providerConcurrency) return dependencies.providerConcurrency;
    durableProviderConcurrency ??= new FirestoreProviderConcurrencyLimiter(config, now);
    return durableProviderConcurrency;
  };

  const getReadinessProbe = (): ReadinessProbe => {
    if (dependencies.readinessProbe) return dependencies.readinessProbe;
    durableReadinessProbe ??= new FirestoreReadinessProbe();
    return durableReadinessProbe;
  };

  const health = withBoundary("/api/v1/health", ["GET"], false, async (request, response, context) => {
    const mode = request.query?.mode;
    if (mode !== undefined && mode !== "live" && mode !== "ready") {
      throw new AppError({ code: "INVALID_REQUEST", status: 400, message: "The request is invalid." });
    }
    if (mode !== "live") {
      assertReadyConfiguration(context.config);
      try {
        await getReadinessProbe().check(context.config);
      } catch (error) {
        if (error instanceof ConfigurationError) throw error;
        throw new ConfigurationError();
      }
    }
    writeJson(response, 200, {
      requestId: context.requestId,
      status: mode === "live" ? "alive" : "ready",
      service: "emotional-friend-api",
      releaseVersion: context.config.releaseVersion ?? "unknown",
      timestamp: new Date(now()).toISOString(),
    });
  });

  const guestSession = withBoundary(
    "/api/v1/guest-sessions",
    ["POST"],
    true,
    async (request, response, context) => {
      const guestSecret = requireSecret(context.config.guestTokenSecret);
      const limiter = getLimiter(context.config);
      await enforceRateLimit(
        limiter,
        pseudonymousIdentifier(guestSecret, "ip", getClientAddress(request)),
        context.config.ipRateLimit,
        context.config.rateLimitWindowMs,
      );
      const tokenService = new HmacGuestTokenService(
        guestSecret,
        context.config.guestTokenTtlSeconds,
        now,
      );
      const body = parseWithSchema(
        guestSessionRequestSchema,
        await readJsonBody(request, context.config.requestBodyLimitBytes),
      );
      const issued = tokenService.issue(body.guestId);
      writeJson(response, 201, { requestId: context.requestId, ...issued });
    },
  );

  const clientEvent = withBoundary(
    "/api/v1/client-events",
    ["POST"],
    true,
    async (request, response, context) => {
      const rateSecret = getRateLimitSecret(context.config);
      await enforceRateLimit(
        getLimiter(context.config),
        pseudonymousIdentifier(rateSecret, "client-event-ip", getClientAddress(request)),
        context.config.ipRateLimit,
        context.config.rateLimitWindowMs,
      );
      const event = parseWithSchema(
        clientEventRequestSchema,
        await readJsonBody(request, context.config.requestBodyLimitBytes),
      );
      logger.clientEvent({
        requestId: context.requestId,
        route: context.route,
        releaseVersion: event.releaseVersion,
        category: event.category,
      });
      writeJson(response, 202, { requestId: context.requestId, accepted: true });
    },
  );

  const postMessage = withBoundary(
    "/api/v1/chats/{chatId}/messages",
    ["POST"],
    true,
    async (request, response, context) => {
      const rateSecret = getRateLimitSecret(context.config);
      const limiter = getLimiter(context.config);
      await enforceRateLimit(
        limiter,
        pseudonymousIdentifier(rateSecret, "ip", getClientAddress(request)),
        context.config.ipRateLimit,
        context.config.rateLimitWindowMs,
      );

      const principal = await authenticate(request, context.config, dependencies.registeredAuth, now);
      context.principalType = principal.type;
      context.principalHash = pseudonymousIdentifier(
        rateSecret,
        "principal",
        `${principal.type}:${principal.id}`,
      );
      await enforceRateLimit(
        limiter,
        context.principalHash,
        principal.type === "registered"
          ? context.config.registeredRateLimit
          : context.config.guestRateLimit,
        context.config.rateLimitWindowMs,
      );

      const chatId = parseWithSchema(chatIdSchema, getQueryValue(request, "chatId"));
      const idempotencyKey = parseWithSchema(idempotencyKeySchema, getIdempotencyKey(request));
      const parsedBody = parseWithSchema(
        messageRequestSchema,
        await readJsonBody(request, context.config.requestBodyLimitBytes),
      );
      let body = sanitizeMessageRequest(parsedBody, {
        nowMs: now(),
        maxEmotionAgeMs: context.config.emotionContextMaxAgeMs,
        futureSkewMs: context.config.emotionContextFutureSkewMs,
      });
      if (principal.type === "registered" && body.recentHistory !== undefined) {
        throw new AppError({
          code: "INVALID_REQUEST",
          status: 400,
          message: "Registered chat history must not be supplied by the client.",
        });
      }

      const repository =
        principal.type === "registered"
          ? dependencies.chatRepository ?? new FirestoreChatRepository(context.config)
          : undefined;
      if (principal.type === "registered" && body.emotionContext) {
        const consent = await repository!.loadRegisteredEmotionConsent(principal.uid);
        const supportedConsent =
          consent.useEmotionContext &&
          consent.cameraNoticeAcceptedAt !== null &&
          consent.cameraNoticeVersion !== null &&
          context.config.supportedCameraNoticeVersions.has(consent.cameraNoticeVersion);
        if (!supportedConsent) body = { ...body, emotionContext: undefined };
      }

      const fingerprint = requestFingerprint(rateSecret, chatId, body);
      const operationKey = operationKeyHash(rateSecret, principal, chatId, idempotencyKey);
      const userMessageId = `msg_user_${operationKey.slice(0, 24)}`;
      const assistantMessageId = `msg_assistant_${operationKey.slice(0, 24)}`;
      const leaseMs = context.config.openAiTimeoutMs + 5_000;
      const guestOperations =
        principal.type === "guest" ? getGuestOperations(context.config) : undefined;

      const begin =
        principal.type === "registered"
          ? await repository!.beginSend({
              uid: principal.uid,
              chatId,
              operationKey,
              requestFingerprint: fingerprint,
              clientRequestId: idempotencyKey,
              userMessageId,
              assistantMessageId,
              text: body.text,
              emotionContext: body.emotionContext,
              leaseMs,
              idempotencyTtlMs: context.config.idempotencyTtlSeconds * 1_000,
            })
          : await guestOperations!.claim({
              key: operationKey,
              fingerprint,
              userMessageId,
              assistantMessageId,
              leaseMs,
              ttlMs: context.config.idempotencyTtlSeconds * 1_000,
            });

      context.idempotencyState = begin.kind;
      if (begin.kind === "replay") {
        writeJson(response, 200, responseBody(context.requestId, begin.completion));
        return;
      }

      await enforceRateLimit(
        limiter,
        `generation:${context.principalHash}`,
        principal.type === "registered"
          ? context.config.registeredRateLimit
          : context.config.guestRateLimit,
        context.config.rateLimitWindowMs,
      );

      const history = await loadHistory(
        principal,
        repository,
        body,
        chatId,
        context.config.openAiHistoryLimit,
        begin.userMessageId,
      );
      const safetyRoute = routeHighRisk(body.text, history);
      if (safetyRoute) {
        context.safetyIntervention = true;
        const completion: CompletedSend = {
          userMessageId: begin.userMessageId,
          assistantMessageId: begin.assistantMessageId,
          assistantText: safetyRoute.responseText,
          variant: "safety_support",
          safety: safetyRoute.safety,
        };
        await completeOperation(
          principal,
          repository,
          guestOperations,
          chatId,
          operationKey,
          fingerprint,
          completion,
          {
            provider: "safety-policy",
            model: null,
            promptVersion: SAFETY_POLICY_VERSION,
          },
        );
        writeJson(response, 200, responseBody(context.requestId, completion));
        return;
      }

      let concurrencyLease: ProviderConcurrencyLease | undefined;
      let concurrencyLimiter: ProviderConcurrencyLimiter | undefined;
      try {
        const safetySecret = requireSecret(context.config.safetyIdentifierSecret);
        concurrencyLimiter = getProviderConcurrency(context.config);
        concurrencyLease = await concurrencyLimiter.acquire({
          limit: context.config.providerConcurrencyLimit,
          leaseMs: context.config.openAiTimeoutMs + 5_000,
        });
        const provider = dependencies.provider ?? new OpenAIResponsesProvider(context.config);
        const controller = new AbortController();
        const generated = await provider.generateReply({
          currentText: body.text,
          history,
          emotionContext: body.emotionContext,
          safetyIdentifier: pseudonymousIdentifier(
            safetySecret,
            "safety",
            `${principal.type}:${principal.id}`,
          ),
          signal: controller.signal,
        });
        let assistantText: string;
        try {
          assistantText = validateProviderOutput(generated.text);
        } catch {
          throw new ProviderUnavailableError();
        }
        const completion: CompletedSend = {
          userMessageId: begin.userMessageId,
          assistantMessageId: begin.assistantMessageId,
          assistantText,
          variant: "assistant",
        };
        await completeOperation(
          principal,
          repository,
          guestOperations,
          chatId,
          operationKey,
          fingerprint,
          completion,
          {
            provider: generated.provider,
            model: generated.model,
            promptVersion: generated.promptVersion,
            providerResponseId: generated.providerResponseId,
            inputTokens: generated.inputTokens,
            outputTokens: generated.outputTokens,
          },
        );
        logger.log({
          level: "info",
          event: "provider.completed",
          requestId: context.requestId,
          route: context.route,
          principalType: context.principalType,
          principalHash: context.principalHash,
          provider: generated.provider,
          model: generated.model,
          promptVersion: generated.promptVersion,
          retryCount: generated.retryCount,
          inputTokens: generated.inputTokens,
          outputTokens: generated.outputTokens,
        });
        writeJson(response, 200, responseBody(context.requestId, completion));
      } catch (error) {
        const mapped = mapProviderError(error);
        await failOperation(
          principal,
          repository,
          guestOperations,
          chatId,
          operationKey,
          fingerprint,
          mapped,
        );
        logger.log({
          level: "error",
          event: "provider.failed",
          requestId: context.requestId,
          route: context.route,
          principalType: context.principalType,
          principalHash: context.principalHash,
          errorCode: mapped.code,
          providerStatus:
            error instanceof ProviderUnavailableError ? error.upstreamStatus : undefined,
          providerErrorCode:
            error instanceof ProviderUnavailableError ? error.upstreamCode : undefined,
        });
        throw mapped;
      } finally {
        if (concurrencyLease && concurrencyLimiter) {
          try {
            await concurrencyLimiter.release(concurrencyLease);
          } catch {
            // The durable lease has a short expiry; release failures must not expose internals.
          }
        }
      }
    },
  );

  const deleteChat = withBoundary(
    "/api/v1/chats/{chatId}",
    ["DELETE"],
    true,
    async (request, response, context) => {
      const rateSecret = getRateLimitSecret(context.config);
      const limiter = getLimiter(context.config);
      await enforceRateLimit(
        limiter,
        pseudonymousIdentifier(rateSecret, "ip", getClientAddress(request)),
        context.config.ipRateLimit,
        context.config.rateLimitWindowMs,
      );
      const principal = await authenticate(request, context.config, dependencies.registeredAuth, now);
      context.principalType = principal.type;
      context.principalHash = pseudonymousIdentifier(
        rateSecret,
        "principal",
        `${principal.type}:${principal.id}`,
      );
      if (principal.type !== "registered") {
        throw new AppError({
          code: "UNAUTHORIZED",
          status: 403,
          message: "Guest chats are deleted on the device.",
        });
      }
      await enforceRateLimit(
        limiter,
        context.principalHash,
        context.config.registeredRateLimit,
        context.config.rateLimitWindowMs,
      );
      const chatId = parseWithSchema(chatIdSchema, getQueryValue(request, "chatId"));
      const idempotencyKey = parseWithSchema(idempotencyKeySchema, getIdempotencyKey(request));
      const operationKey = operationKeyHash(
        rateSecret,
        principal,
        chatId,
        idempotencyKey,
        "delete-chat.v1",
      );
      const repository = dependencies.chatRepository ?? new FirestoreChatRepository(context.config);
      const deletion = await repository.deleteChat({
        uid: principal.uid,
        chatId,
        batchSize: context.config.deleteBatchSize,
        operationKey,
        requestFingerprint: deleteRequestFingerprint(rateSecret, chatId),
        leaseMs: 300_000,
        idempotencyTtlMs: context.config.idempotencyTtlSeconds * 1_000,
      });
      context.idempotencyState = deletion.replayed ? "replay" : "execute";
      writeJson(response, deletion.status === "pending" ? 202 : 200, {
        requestId: context.requestId,
        operationId: deletion.operationId,
        status: deletion.status,
      });
    },
  );

  const firebaseToken = withBoundary(
    "/api/v1/data-session",
    ["POST"],
    true,
    async (request, response, context) => {
      const rateSecret = getRateLimitSecret(context.config);
      const limiter = getLimiter(context.config);
      await enforceRateLimit(
        limiter,
        pseudonymousIdentifier(rateSecret, "ip", getClientAddress(request)),
        context.config.ipRateLimit,
        context.config.rateLimitWindowMs,
      );
      const principal = await authenticate(request, context.config, dependencies.registeredAuth, now);
      context.principalType = principal.type;
      context.principalHash = pseudonymousIdentifier(
        rateSecret,
        "principal",
        `${principal.type}:${principal.id}`,
      );
      if (principal.type !== "registered") {
        throw new AppError({
          code: "UNAUTHORIZED",
          status: 403,
          message: "A registered account is required.",
        });
      }
      await enforceRateLimit(
        limiter,
        context.principalHash,
        context.config.registeredRateLimit,
        context.config.rateLimitWindowMs,
      );
      const issue = dependencies.firebaseTokenIssuer ?? createFirebaseCustomToken;
      const token = await issue(context.config, principal.uid);
      writeJson(response, 200, { requestId: context.requestId, token });
    },
  );

  return { health, clientEvent, guestSession, postMessage, deleteChat, firebaseToken };

  function withBoundary(
    route: string,
    methods: ReadonlyArray<string>,
    requireOrigin: boolean,
    action: (request: ApiRequest, response: ApiResponse, context: RequestContext) => Promise<void>,
  ): ApiHandler {
    return async (request, response) => {
      const base = initializeRequest(request, response, route);
      let context: RequestContext | undefined;
      try {
        const config = loadServerConfig(env);
        context = { ...base, config };
        enforceCors(request, response, config, methods, requireOrigin);
        if (request.method?.toUpperCase() === "OPTIONS") {
          writeEmpty(response, 204);
          return;
        }
        enforceMethod(request, response, methods);
        await action(request, response, context);
      } catch (error) {
        writeError(response, base.requestId, error);
      } finally {
        logCompleted(logger, request, response, context ?? base);
      }
    };
  }
}

async function authenticate(
  request: ApiRequest,
  config: ServerConfig,
  injectedVerifier: RegisteredTokenVerifier | undefined,
  now: () => number,
): Promise<Principal> {
  const token = getBearerToken(request);
  if (token.startsWith("guest.")) {
    return new HmacGuestTokenService(
      requireSecret(config.guestTokenSecret),
      config.guestTokenTtlSeconds,
      now,
    ).verify(token);
  }
  return (injectedVerifier ?? new ClerkTokenVerifier(config)).verify(token);
}

async function loadHistory(
  principal: Principal,
  repository: ChatRepository | undefined,
  body: MessageRequest,
  chatId: string,
  limit: number,
  excludeMessageId: string,
): Promise<RecentHistoryMessage[]> {
  if (principal.type === "registered") {
    return repository!.loadRecentHistory({
      uid: principal.uid,
      chatId,
      limit,
      excludeMessageId,
    });
  }
  return (body.recentHistory ?? []).slice(-limit);
}

async function completeOperation(
  principal: Principal,
  repository: ChatRepository | undefined,
  guestOperations: GuestIdempotencyStore | undefined,
  chatId: string,
  operationKey: string,
  fingerprint: string,
  completion: CompletedSend,
  generation: {
    provider: string;
    model: string | null;
    promptVersion: string;
    providerResponseId?: string;
    inputTokens?: number;
    outputTokens?: number;
  },
): Promise<void> {
  if (principal.type === "registered") {
    await repository!.completeSend({
      uid: principal.uid,
      chatId,
      operationKey,
      requestFingerprint: fingerprint,
      completion,
      generation,
    });
    return;
  }
  await guestOperations!.complete(operationKey, fingerprint, completion);
}

async function failOperation(
  principal: Principal,
  repository: ChatRepository | undefined,
  guestOperations: GuestIdempotencyStore | undefined,
  chatId: string,
  operationKey: string,
  fingerprint: string,
  error: AppError,
): Promise<void> {
  try {
    if (principal.type === "registered") {
      await repository!.failSend({
        uid: principal.uid,
        chatId,
        operationKey,
        requestFingerprint: fingerprint,
        errorCode: error.code,
        retryable: error.retryable,
      });
    } else {
      await guestOperations!.fail(operationKey, fingerprint);
    }
  } catch {
    // Preserve the original safe error; persistence failures are deliberately not exposed.
  }
}

function mapProviderError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ProviderTimeoutError) {
    return new AppError({
      code: "PROVIDER_TIMEOUT",
      status: 504,
      message: "The reply could not be generated in time.",
      retryable: true,
    });
  }
  if (error instanceof ProviderUnavailableError) {
    return new AppError({
      code: "AI_TEMPORARILY_UNAVAILABLE",
      status: 503,
      message: "The reply could not be generated right now.",
      retryable: true,
    });
  }
  if (error instanceof ConfigurationError) return error;
  return new AppError({
    code: "INTERNAL_ERROR",
    status: 500,
    message: "The reply could not be generated right now.",
    retryable: true,
  });
}

function responseBody(requestId: string, completion: CompletedSend): Record<string, unknown> {
  return chatMessageResponseSchema.parse({
    requestId,
    userMessage: { id: completion.userMessageId, status: "complete" },
    assistantMessage: {
      id: completion.assistantMessageId,
      text: completion.assistantText,
      status: "complete",
      variant: completion.variant,
      ...(completion.safety ? { safety: completion.safety } : {}),
    },
  });
}

function getRateLimitSecret(config: ServerConfig): string {
  return requireSecret(
    config.rateLimitSecret ?? config.guestTokenSecret ?? config.safetyIdentifierSecret,
  );
}

async function enforceRateLimit(
  limiter: RateLimiter,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const result = await limiter.consume({ key, limit, windowMs });
  if (result.allowed) return;
  throw new AppError({
    code: "RATE_LIMITED",
    status: 429,
    message: "Too many requests. Try again later.",
    retryable: true,
    retryAfterSeconds: result.retryAfterSeconds,
  });
}

function assertReadyConfiguration(config: ServerConfig): void {
  requireValue(config.releaseVersion);
  requireSecret(config.guestTokenSecret);
  requireSecret(config.safetyIdentifierSecret);
  getRateLimitSecret(config);
  requireValue(config.clerkJwtKey);
  requireValue(config.openAiApiKey);
  requireValue(config.openAiModel);
  requireValue(config.openAiSystemPrompt);
  requireValue(config.openAiPromptVersion);
  if (config.allowedOrigins.size === 0) throw new ConfigurationError();
  if (config.firebaseUseEmulators) {
    requireValue(config.firebaseProjectId);
    requireValue(config.firestoreEmulatorHost);
    requireValue(config.firebaseAuthEmulatorHost);
    return;
  }
  const hasJsonCredential = Boolean(config.firebaseServiceAccountJson);
  const hasSplitCredential = Boolean(
    config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey,
  );
  if (!hasJsonCredential && !hasSplitCredential) throw new ConfigurationError();
}
