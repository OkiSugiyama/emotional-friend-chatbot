import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ServerConfig } from "./config.js";
import { AppError, asAppError } from "./errors.js";
import type { ApiRequest, ApiResponse, HeaderValue } from "./http-types.js";
import type { AllowlistLogger } from "./logger.js";

const requestIdSchema = z.string().uuid();

export interface RequestContext {
  requestId: string;
  route: string;
  startedAt: number;
  config: ServerConfig;
  principalType?: "registered" | "guest";
  principalHash?: string;
  idempotencyState?: "execute" | "replay";
  safetyIntervention?: boolean;
}

export function initializeRequest(request: ApiRequest, response: ApiResponse, route: string): Omit<RequestContext, "config"> {
  const supplied = singleHeader(request.headers["x-request-id"]);
  const requestId = requestIdSchema.safeParse(supplied).success ? supplied! : randomUUID();
  response.setHeader("X-Request-Id", requestId);
  response.setHeader("Cache-Control", "no-store");
  return { requestId, route, startedAt: Date.now() };
}

export function enforceCors(
  request: ApiRequest,
  response: ApiResponse,
  config: ServerConfig,
  allowedMethods: ReadonlyArray<string>,
  requireOrigin = false,
): void {
  const origin = singleHeader(request.headers.origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", [...allowedMethods, "OPTIONS"].join(", "));
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Idempotency-Key, X-Request-Id",
  );
  response.setHeader("Access-Control-Expose-Headers", "X-Request-Id, Retry-After");
  response.setHeader("Access-Control-Max-Age", "600");
  if (!origin) {
    if (requireOrigin) throw originNotAllowed();
    return;
  }
  if (!config.allowedOrigins.has(origin)) {
    throw originNotAllowed();
  }
  response.setHeader("Access-Control-Allow-Origin", origin);
}

export function enforceMethod(request: ApiRequest, response: ApiResponse, allowed: ReadonlyArray<string>): void {
  const method = request.method?.toUpperCase() ?? "GET";
  if (allowed.includes(method)) return;
  response.setHeader("Allow", [...allowed, "OPTIONS"].join(", "));
  throw new AppError({
    code: "METHOD_NOT_ALLOWED",
    status: 405,
    message: "This method is not allowed.",
  });
}

export async function readJsonBody(request: ApiRequest, maxBytes: number): Promise<unknown> {
  const contentType = singleHeader(request.headers["content-type"]);
  if (!contentType || contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new AppError({
      code: "UNSUPPORTED_MEDIA_TYPE",
      status: 415,
      message: "Content-Type must be application/json.",
    });
  }
  const contentLength = singleHeader(request.headers["content-length"]);
  if (contentLength) {
    const parsed = Number(contentLength);
    if (!Number.isFinite(parsed) || parsed < 0) throw invalidRequest();
    if (parsed > maxBytes) throw requestTooLarge();
  }

  if (request.body !== undefined) {
    if (Buffer.isBuffer(request.body)) return parseJsonBuffer(request.body, maxBytes);
    if (typeof request.body === "string") return parseJsonBuffer(Buffer.from(request.body, "utf8"), maxBytes);
    let encoded: Buffer;
    try {
      encoded = Buffer.from(JSON.stringify(request.body), "utf8");
    } catch {
      throw invalidRequest();
    }
    if (encoded.byteLength > maxBytes) throw requestTooLarge();
    return request.body;
  }

  const iterator = request[Symbol.asyncIterator];
  if (!iterator) throw invalidRequest();
  const chunks: Buffer[] = [];
  let size = 0;
  const iterable: AsyncIterable<Uint8Array | string> = {
    [Symbol.asyncIterator]: () => iterator.call(request),
  };
  for await (const chunk of iterable) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > maxBytes) throw requestTooLarge();
    chunks.push(buffer);
  }
  return parseJsonBuffer(Buffer.concat(chunks), maxBytes);
}

export function getBearerToken(request: ApiRequest): string {
  const authorization = singleHeader(request.headers.authorization);
  if (!authorization || authorization.length > 8_192) throw unauthenticated();
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  if (!match) throw unauthenticated();
  return match[1];
}

export function getClientAddress(request: ApiRequest): string {
  const vercelForwarded = singleHeader(request.headers["x-vercel-forwarded-for"]);
  if (vercelForwarded) return vercelForwarded.split(",", 1)[0].trim().slice(0, 128);
  return request.socket.remoteAddress?.slice(0, 128) || "unknown";
}

export function getQueryValue(request: ApiRequest, name: string): string {
  const value = request.query?.[name];
  const single = singleHeader(value);
  if (!single) throw invalidRequest();
  return single;
}

export function getIdempotencyKey(request: ApiRequest): string {
  const value = singleHeader(request.headers["idempotency-key"]);
  if (!value || value.length > 128) throw invalidRequest();
  return value;
}

export function writeJson(response: ApiResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (response.status && response.json) {
    response.status(status).json!(body);
    return;
  }
  response.end(JSON.stringify(body));
}

export function writeEmpty(response: ApiResponse, status: number): void {
  response.statusCode = status;
  response.end();
}

export function writeError(
  response: ApiResponse,
  requestId: string,
  error: unknown,
): AppError {
  const safe = asAppError(error);
  if (safe.retryAfterSeconds) response.setHeader("Retry-After", String(safe.retryAfterSeconds));
  writeJson(response, safe.status, {
    requestId,
    error: {
      code: safe.code,
      message: safe.message,
      retryable: safe.retryable,
      ...(safe.safeDetails ? { details: safe.safeDetails } : {}),
    },
  });
  return safe;
}

export function logCompleted(
  logger: AllowlistLogger,
  request: ApiRequest,
  response: ApiResponse,
  context: Omit<RequestContext, "config"> | RequestContext,
): void {
  logger.log({
    level: response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info",
    event: response.statusCode >= 400 ? "request.failed" : "request.completed",
    requestId: context.requestId,
    route: context.route,
    method: request.method,
    status: response.statusCode,
    durationMs: Math.max(0, Date.now() - context.startedAt),
    principalType: context.principalType,
    principalHash: context.safetyIntervention ? undefined : context.principalHash,
    idempotencyState: context.idempotencyState,
    safetyIntervention: context.safetyIntervention,
  });
}

function parseJsonBuffer(buffer: Buffer, maxBytes: number): unknown {
  if (buffer.byteLength > maxBytes) throw requestTooLarge();
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw invalidRequest();
  }
}

function singleHeader(value: HeaderValue): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function invalidRequest(): AppError {
  return new AppError({ code: "INVALID_REQUEST", status: 400, message: "The request is invalid." });
}

function requestTooLarge(): AppError {
  return new AppError({
    code: "REQUEST_TOO_LARGE",
    status: 413,
    message: "The request body is too large.",
  });
}

function unauthenticated(): AppError {
  return new AppError({ code: "UNAUTHENTICATED", status: 401, message: "Authentication is required." });
}

function originNotAllowed(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    status: 403,
    message: "This origin is not allowed.",
  });
}
