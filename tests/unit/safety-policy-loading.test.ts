// @vitest-environment node

import { afterEach, describe, expect, test } from "vitest";
import { loadSafetyPolicy } from "../../server/safety-policy";

/**
 * The production guard is the reason these tests exist. The shipped policy is a
 * deliberately weak illustrative set, and the evaluated set reaches a deployment
 * only through an environment variable. Nothing in the type system stops a
 * deployment being handed the weak set, so a test does.
 */

const evaluatedPolicy = {
  policyVersion: "test-evaluated-v1",
  copyVersion: "location-neutral-placeholder-v1",
  evaluated: true,
  categories: [
    {
      category: "test_category",
      pattern: "\\b(?:test trigger phrase)\\b",
      responseText: "Reviewed response text for the test category.",
      sample: "this is a test trigger phrase",
    },
  ],
};

const illustrativePolicy = { ...evaluatedPolicy, policyVersion: "test-illustrative-v1", evaluated: false };

const touched = ["SAFETY_POLICY_JSON", "SAFETY_POLICY_PATH", "NODE_ENV", "VERCEL_ENV"] as const;
const original = Object.fromEntries(touched.map((key) => [key, process.env[key]]));

function setEnv(values: Partial<Record<(typeof touched)[number], string | undefined>>) {
  for (const key of touched) {
    const value = key in values ? values[key] : undefined;
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const key of touched) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("safety policy loading", () => {
  test("serves an inline policy from SAFETY_POLICY_JSON, which is how production is configured", () => {
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(evaluatedPolicy) });
    const policy = loadSafetyPolicy();
    expect(policy.source).toBe("SAFETY_POLICY_JSON");
    expect(policy.policyVersion).toBe("test-evaluated-v1");
    expect(policy.evaluated).toBe(true);
    expect(policy.categories).toHaveLength(1);
  });

  test("refuses to start in production when the policy is not the evaluated one", () => {
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(illustrativePolicy), VERCEL_ENV: "production" });
    expect(() => loadSafetyPolicy()).toThrow(/Refusing to start/);
  });

  test("refuses on NODE_ENV=production too, for hosts that do not set VERCEL_ENV", () => {
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(illustrativePolicy), NODE_ENV: "production" });
    expect(() => loadSafetyPolicy()).toThrow(/evaluated: false/);
  });

  test("allows an unevaluated policy outside production, so a clone can run", () => {
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(illustrativePolicy) });
    expect(loadSafetyPolicy().evaluated).toBe(false);
  });

  test("a production deployment given the evaluated policy starts normally", () => {
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(evaluatedPolicy), VERCEL_ENV: "production" });
    expect(loadSafetyPolicy().policyVersion).toBe("test-evaluated-v1");
  });

  test("rejects a sample that its own pattern does not match", () => {
    const inconsistent = {
      ...evaluatedPolicy,
      categories: [{ ...evaluatedPolicy.categories[0]!, sample: "unrelated wording" }],
    };
    setEnv({ SAFETY_POLICY_JSON: JSON.stringify(inconsistent) });
    expect(() => loadSafetyPolicy()).toThrow(/does not match its own pattern/);
  });

  test("rejects malformed JSON and a missing path rather than falling back silently", () => {
    setEnv({ SAFETY_POLICY_JSON: "{ not json" });
    expect(() => loadSafetyPolicy()).toThrow(/not readable JSON/);

    setEnv({ SAFETY_POLICY_PATH: "/nonexistent/safety-policy.json" });
    expect(() => loadSafetyPolicy()).toThrow(/names no existing file/);
  });
});
