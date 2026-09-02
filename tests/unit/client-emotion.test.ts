import { describe, expect, it } from "vitest";
import {
  ExpressionStabilizer,
  normalizeExpressionLabel,
} from "../../src/domain/emotion";

const estimate = (label: string, confidence: number, observedAt = "2026-08-09T00:00:00.000Z") => ({
  label,
  confidence,
  modelVersion: "face-expression-v1",
  observedAt,
});

describe("expression normalization and stability", () => {
  it("normalizes provider aliases and rejects unknown labels", () => {
    expect(normalizeExpressionLabel("fear")).toBe("fearful");
    expect(normalizeExpressionLabel("surprise")).toBe("surprised");
    expect(normalizeExpressionLabel("invented")).toBe("unavailable");
  });

  it("requires two stable samples and the non-neutral threshold", () => {
    const stabilizer = new ExpressionStabilizer();
    expect(stabilizer.accept(estimate("sad", 0.8)).label).toBe("unavailable");
    const stable = stabilizer.accept(estimate("sad", 0.8, "2026-08-09T00:00:02.000Z"));
    expect(stable).toMatchObject({ label: "sad", confidenceBand: "medium" });

    expect(stabilizer.accept(estimate("angry", 0.64)).label).toBe("unavailable");
    expect(stabilizer.accept(estimate("unknown", 1)).label).toBe("unavailable");
  });

  it("uses medium at .70 and high at .85", () => {
    const medium = new ExpressionStabilizer();
    medium.accept(estimate("happy", 0.7));
    expect(medium.accept(estimate("happy", 0.7)).confidenceBand).toBe("medium");
    const high = new ExpressionStabilizer();
    high.accept(estimate("happy", 0.85));
    expect(high.accept(estimate("happy", 0.85)).confidenceBand).toBe("high");
  });
});

