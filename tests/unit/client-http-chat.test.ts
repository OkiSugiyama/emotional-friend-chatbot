import { describe, expect, it, vi } from "vitest";
import { HttpChatClient } from "../../src/services/http-chat-client";

const success = () =>
  new Response(
    JSON.stringify({
      requestId: "req-1",
      userMessage: { id: "user-1", status: "complete" },
      assistantMessage: {
        id: "assistant-1",
        text: "Hello",
        status: "complete",
        variant: "assistant",
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const input = {
  chatId: "chat-1",
  clientRequestId: "request-1",
  principal: { kind: "guest" as const, guestId: "guest-1", guestSessionToken: "signed-token" },
  request: { text: "Hello", history: [{ role: "user" as const, text: "Earlier" }] },
};

describe("idempotent HTTP chat client", () => {
  it("binds the native fetch receiver before invoking it from the client", async () => {
    const browserFetch = vi.fn(function (this: unknown) {
      expect(this).toBe(globalThis);
      return Promise.resolve(success());
    });
    vi.stubGlobal("fetch", browserFetch);

    try {
      const client = new HttpChatClient();
      await expect(client.send(input)).resolves.toMatchObject({ requestId: "req-1" });
      expect(browserFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("coalesces the same in-flight key and sends the guest bearer token", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedInit = init;
        return new Promise<Response>((resolve) => (resolveResponse = resolve));
      },
    );
    const client = new HttpChatClient({ fetch: fetchMock as unknown as typeof fetch });
    const first = client.send(input);
    const second = client.send(input);
    expect(first).toBe(second);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    resolveResponse?.(success());
    await expect(first).resolves.toMatchObject({ requestId: "req-1" });
    const request = capturedInit as RequestInit;
    const headers = new Headers(request.headers);
    expect(headers.get("Idempotency-Key")).toBe("request-1");
    expect(headers.get("Authorization")).toBe("Bearer signed-token");
    expect(headers.has("X-Guest-Session-Token")).toBe(false);
    expect(headers.has("X-Guest-Id")).toBe(false);
    expect(JSON.parse(String(request.body))).toEqual({
      text: "Hello",
      recentHistory: [{ role: "user", text: "Earlier" }],
    });
  });

  it("retries once with the same key after an eligible failure", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(success()) as unknown as typeof fetch;
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new HttpChatClient({ fetch: fetcher, random: () => 0, sleep });
    await expect(client.send(input)).resolves.toMatchObject({ requestId: "req-1" });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(400, undefined);
    for (const call of (fetcher as ReturnType<typeof vi.fn>).mock.calls) {
      expect(new Headers((call[1] as RequestInit).headers).get("Idempotency-Key")).toBe("request-1");
    }
  });

  it("strips client history for a registered principal", async () => {
    const fetcher = vi.fn().mockResolvedValue(success()) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });
    await client.send({
      ...input,
      principal: { kind: "registered", getIdToken: async () => "firebase-token" },
    });
    const request = (fetcher as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(new Headers(request.headers).get("Authorization")).toBe("Bearer firebase-token");
    expect(JSON.parse(String(request.body))).toEqual({ text: "Hello" });
  });

  it("does not retry non-retryable API errors", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-unauth",
          error: { code: "UNAUTHENTICATED", message: "Sign in.", retryable: false },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher, sleep: vi.fn() });
    await expect(client.send(input)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("accepts bounded validation details and the full canonical server error vocabulary", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-large",
          error: {
            code: "REQUEST_TOO_LARGE",
            message: "The request body is too large.",
            retryable: false,
            details: [{ path: "text", issue: "must contain at most 8000 Unicode characters" }],
          },
        }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });

    await expect(client.send(input)).rejects.toMatchObject({
      code: "REQUEST_TOO_LARGE",
      retryable: false,
    });
  });

  it.each(["REQUEST_IN_PROGRESS", "AI_TEMPORARILY_UNAVAILABLE"] as const)(
    "accepts and retries the canonical %s envelope once",
    async (code) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              requestId: `req-${code}`,
              error: { code, message: "Try again shortly.", retryable: true },
            }),
            { status: code === "REQUEST_IN_PROGRESS" ? 409 : 503 },
          ),
        )
        .mockResolvedValueOnce(success()) as unknown as typeof fetch;
      const sleep = vi.fn().mockResolvedValue(undefined);
      const client = new HttpChatClient({ fetch: fetcher, random: () => 0, sleep });

      await expect(client.send(input)).resolves.toMatchObject({ requestId: "req-1" });
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledWith(400, undefined);
    },
  );

  it("accepts replay-unavailable but never retries it even if a raw flag is inconsistent", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-replay-unavailable",
          error: {
            code: "IDEMPOTENCY_REPLAY_UNAVAILABLE",
            message: "The prior result is no longer available.",
            retryable: true,
          },
        }),
        { status: 409 },
      ),
    ) as unknown as typeof fetch;
    const sleep = vi.fn();
    const client = new HttpChatClient({ fetch: fetcher, sleep });

    await expect(client.send(input)).rejects.toMatchObject({
      code: "IDEMPOTENCY_REPLAY_UNAVAILABLE",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not accept the undocumented PROVIDER_UNAVAILABLE error code", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-provider",
          error: {
            code: "PROVIDER_UNAVAILABLE",
            message: "Undocumented code.",
            retryable: false,
          },
        }),
        { status: 400 },
      ),
    ) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });

    await expect(client.send(input)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      retryable: false,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("accepts and preserves the documented safety-support response fields", async () => {
    const safety = {
      category: "self_harm_or_suicide",
      policyVersion: "safety-routing-v1",
      copyVersion: "location-neutral-placeholder-v1",
      locationNeutral: true,
      requiresReview: true,
    };
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-safety",
          userMessage: { id: "user-safety", status: "complete" },
          assistantMessage: {
            id: "assistant-safety",
            text: "Please contact immediate local support.",
            status: "complete",
            variant: "safety_support",
            safety,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });

    await expect(client.send(input)).resolves.toMatchObject({
      assistantMessage: {
        variant: "safety_support",
        safety,
        safetySupport: true,
      },
    });
  });

  it("still rejects unknown fields in successful raw responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "req-unknown",
          userMessage: { id: "user-1", status: "complete" },
          assistantMessage: {
            id: "assistant-1",
            text: "Hello",
            status: "complete",
            variant: "assistant",
            rawProviderPayload: { content: "must not pass through" },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });

    await expect(client.send(input)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      retryable: false,
    });
  });

  it("rejects a guest without a session token before fetch", async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });
    await expect(
      client.send({
        ...input,
        principal: { kind: "guest", guestId: "guest-1" },
      }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED", retryable: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects unsupported payload fields before transmission", async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const client = new HttpChatClient({ fetch: fetcher });
    await expect(
      client.send({
        ...input,
        request: { text: "Hello", frame: "raw-frame-data" } as never,
      }),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
