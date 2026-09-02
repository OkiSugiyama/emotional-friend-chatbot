import assert from "node:assert/strict";
import { test } from "vitest";
import { loadServerConfig } from "../../server/config";
import { OpenAIResponsesProvider, ProviderUnavailableError } from "../../server/openai-provider";

const config = loadServerConfig({
  OPENAI_MODEL: "test-model",
  OPENAI_SYSTEM_PROMPT: "Be supportive.",
  OPENAI_PROMPT_VERSION: "prompt-v7",
  OPENAI_TIMEOUT_MS: "2000",
  OPENAI_MAX_OUTPUT_TOKENS: "300",
});

test("OpenAI adapter retries one transient failure and sends structured priority/uncertainty instructions", async () => {
  const calls: Array<Record<string, any>> = [];
  const client = {
    responses: {
      async create(body: Record<string, any>) {
        calls.push(body);
        if (calls.length === 1) throw { status: 500, response: { body: "must never escape" } };
        return {
          id: "resp_test",
          output_text: "I hear that the written message is positive.",
          usage: { input_tokens: 20, output_tokens: 10 },
        };
      },
    },
  };
  const provider = new OpenAIResponsesProvider(config, client as any);
  const result = await provider.generateReply({
    currentText: "I actually feel good today",
    history: [{ role: "assistant", text: "Earlier context" }],
    emotionContext: {
      label: "sad",
      confidenceBand: "medium",
      modelVersion: "face-expression-v1",
      observedAt: "2026-08-08T12:00:00.000Z",
    },
    safetyIdentifier: "safety_v1_pseudonymous",
    signal: new AbortController().signal,
  });

  assert.equal(calls.length, 2);
  assert.equal(result.retryCount, 1);
  assert.equal(calls[1].safety_identifier, "safety_v1_pseudonymous");
  assert.equal(calls[1].store, false);
  assert.match(calls[1].instructions, /written text outranks/i);
  assert.match(JSON.stringify(calls[1].input), /Optional uncertain local expression estimate/);
  assert.equal(calls[1].model, "test-model");
});

test("OpenAI adapter does not retry permanent upstream errors or leak their body", async () => {
  let calls = 0;
  const client = {
    responses: {
      async create() {
        calls += 1;
        throw {
          status: 400,
          code: "invalid_request_error",
          response: { body: "UPSTREAM_SECRET" },
        };
      },
    },
  };
  const provider = new OpenAIResponsesProvider(config, client as any);
  await assert.rejects(
    provider.generateReply({
      currentText: "Hello",
      history: [],
      safetyIdentifier: "safety_v1_pseudonymous",
      signal: new AbortController().signal,
    }),
    (error: unknown) =>
      error instanceof ProviderUnavailableError &&
      error.upstreamStatus === 400 &&
      error.upstreamCode === "invalid_request_error" &&
      !String(error).includes("UPSTREAM_SECRET"),
  );
  assert.equal(calls, 1);
});
