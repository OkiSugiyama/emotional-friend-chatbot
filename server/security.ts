import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ConfigurationError, AppError } from "./errors.js";
import type { Principal } from "./ports.js";

const guestPayloadSchema = z
  .object({
    v: z.literal(1),
    typ: z.literal("guest"),
    sub: z.string().uuid(),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .strict();
const uuidSchema = z.string().uuid();

export interface GuestTokenResult {
  token: string;
  guestId: string;
  expiresAt: string;
}

export class HmacGuestTokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
    private readonly now: () => number = Date.now,
  ) {
    if (Buffer.byteLength(secret, "utf8") < 32) throw new ConfigurationError();
  }

  issue(existingGuestId?: string): GuestTokenResult {
    const nowSeconds = Math.floor(this.now() / 1_000);
    const guestId = existingGuestId ?? randomUUID();
    if (!uuidSchema.safeParse(guestId).success) {
      throw new AppError({ code: "INVALID_REQUEST", status: 400, message: "The request is invalid." });
    }
    const payload = {
      v: 1 as const,
      typ: "guest" as const,
      sub: guestId,
      iat: nowSeconds,
      exp: nowSeconds + this.ttlSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signature = this.sign(encoded);
    return {
      token: `guest.${encoded}.${signature}`,
      guestId,
      expiresAt: new Date(payload.exp * 1_000).toISOString(),
    };
  }

  verify(token: string): Principal {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "guest") throw unauthenticated();
    const expected = Buffer.from(this.sign(parts[1]), "base64url");
    let supplied: Buffer;
    try {
      supplied = Buffer.from(parts[2], "base64url");
    } catch {
      throw unauthenticated();
    }
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw unauthenticated();

    try {
      const parsed = guestPayloadSchema.parse(JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")));
      const nowSeconds = Math.floor(this.now() / 1_000);
      if (parsed.exp <= nowSeconds || parsed.iat > nowSeconds + 60 || parsed.exp - parsed.iat > this.ttlSeconds) {
        throw unauthenticated();
      }
      return { type: "guest", id: parsed.sub, guestId: parsed.sub };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw unauthenticated();
    }
  }

  private sign(encodedPayload: string): string {
    return createHmac("sha256", this.secret).update(`guest.v1.${encodedPayload}`, "utf8").digest("base64url");
  }
}

export function pseudonymousIdentifier(secret: string, domain: string, value: string): string {
  if (Buffer.byteLength(secret, "utf8") < 32) throw new ConfigurationError();
  const digest = createHmac("sha256", secret).update(`${domain}\0${value}`, "utf8").digest("base64url");
  return `${domain}_v1_${digest.slice(0, 32)}`;
}

export function operationKeyHash(
  secret: string,
  principal: Principal,
  chatId: string,
  idempotencyKey: string,
  scope = "message.v1",
): string {
  const subject = `${principal.type}:${principal.id}`;
  return createHmac("sha256", secret)
    .update(`${scope}\0${subject}\0${chatId}\0${idempotencyKey}`, "utf8")
    .digest("hex");
}

function unauthenticated(): AppError {
  return new AppError({
    code: "UNAUTHENTICATED",
    status: 401,
    message: "Authentication is required.",
  });
}
