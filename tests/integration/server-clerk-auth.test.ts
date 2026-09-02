// @vitest-environment node
import { describe, expect, it } from "vitest";
import { exportSPKI, generateKeyPair, SignJWT } from "jose";
import { ClerkTokenVerifier } from "../../server/clerk-auth";
import { loadServerConfig } from "../../server/config";

async function fixture() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const pem = await exportSPKI(publicKey);
  const config = loadServerConfig({
    NODE_ENV: "test",
    ALLOWED_ORIGINS: "https://app.example",
    CLERK_JWT_KEY: pem,
  });
  const token = async (azp: string, subject = "user_clerk123") =>
    new SignJWT({ azp, sts: "active" })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(subject)
      .setIssuedAt()
      .setNotBefore(Math.floor(Date.now() / 1_000) - 1)
      .setExpirationTime("1m")
      .sign(privateKey);
  return { config, token };
}

describe("Clerk session verification", () => {
  it("derives the registered principal from a valid Clerk session", async () => {
    const { config, token } = await fixture();
    await expect(new ClerkTokenVerifier(config).verify(await token("https://app.example"))).resolves.toEqual({
      type: "registered",
      id: "user_clerk123",
      uid: "user_clerk123",
    });
  });

  it("rejects a token issued to an unapproved origin", async () => {
    const { config, token } = await fixture();
    await expect(
      new ClerkTokenVerifier(config).verify(await token("https://attacker.example")),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
  });
});
