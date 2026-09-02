import { importSPKI, jwtVerify } from "jose";
import { AppError, ConfigurationError } from "./errors.js";
import { requireValue, type ServerConfig } from "./config.js";
import type { Principal, RegisteredTokenVerifier } from "./ports.js";

let cachedPem: string | undefined;
let cachedKey: CryptoKey | undefined;

/** Verifies Clerk session JWTs without a Clerk secret or a runtime network call. */
export class ClerkTokenVerifier implements RegisteredTokenVerifier {
  constructor(private readonly config: ServerConfig) {}

  async verify(token: string): Promise<Principal> {
    try {
      const pem = requireValue(this.config.clerkJwtKey).replace(/\\n/g, "\n");
      if (!cachedKey || cachedPem !== pem) {
        cachedKey = await importSPKI(pem, "RS256");
        cachedPem = pem;
      }
      const { payload } = await jwtVerify(token, cachedKey, {
        algorithms: ["RS256"],
        clockTolerance: 5,
      });
      if (
        typeof payload.sub !== "string" ||
        !/^user_[A-Za-z0-9]+$/u.test(payload.sub) ||
        payload.sts === "pending"
      ) {
        throw unauthenticated();
      }
      if (
        payload.azp !== undefined &&
        (typeof payload.azp !== "string" || !this.config.allowedOrigins.has(payload.azp))
      ) {
        throw unauthenticated();
      }
      return { type: "registered", id: payload.sub, uid: payload.sub };
    } catch (error) {
      if (error instanceof ConfigurationError || error instanceof AppError) throw error;
      throw unauthenticated();
    }
  }
}

function unauthenticated(): AppError {
  return new AppError({
    code: "UNAUTHENTICATED",
    status: 401,
    message: "Authentication is required.",
  });
}
