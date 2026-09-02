import type { ConfidenceBand, EmotionContext, ExpressionLabel } from "../types";
import {
  EXPRESSION_STABLE_SAMPLE_COUNT,
  HIGH_CONFIDENCE_THRESHOLD,
  MEDIUM_CONFIDENCE_THRESHOLD,
  NON_NEUTRAL_CONFIDENCE_THRESHOLD,
} from "./constants";

const EXPRESSION_ALIASES: Readonly<Record<string, ExpressionLabel>> = {
  angry: "angry",
  anger: "angry",
  disgusted: "disgusted",
  disgust: "disgusted",
  fearful: "fearful",
  fear: "fearful",
  happy: "happy",
  happiness: "happy",
  neutral: "neutral",
  sad: "sad",
  sadness: "sad",
  surprised: "surprised",
  surprise: "surprised",
  unavailable: "unavailable",
};

export interface RawExpressionEstimate {
  label: string;
  confidence: number;
  modelVersion: string;
  observedAt: string;
}

export const UNAVAILABLE_EMOTION_CONTEXT: EmotionContext = {
  label: "unavailable",
  confidenceBand: null,
  modelVersion: null,
  observedAt: null,
};

export function normalizeExpressionLabel(label: string): ExpressionLabel {
  return EXPRESSION_ALIASES[label.trim().toLowerCase()] ?? "unavailable";
}

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}

export class ExpressionStabilizer {
  private candidate: ExpressionLabel | null = null;
  private count = 0;

  reset(): EmotionContext {
    this.candidate = null;
    this.count = 0;
    return { ...UNAVAILABLE_EMOTION_CONTEXT };
  }

  accept(estimate: RawExpressionEstimate): EmotionContext {
    const label = normalizeExpressionLabel(estimate.label);
    const validConfidence =
      Number.isFinite(estimate.confidence) &&
      estimate.confidence >= 0 &&
      estimate.confidence <= 1;
    if (
      label === "unavailable" ||
      !validConfidence ||
      (label !== "neutral" && estimate.confidence < NON_NEUTRAL_CONFIDENCE_THRESHOLD)
    ) {
      return this.reset();
    }

    if (this.candidate === label) this.count += 1;
    else {
      this.candidate = label;
      this.count = 1;
    }

    if (this.count < EXPRESSION_STABLE_SAMPLE_COUNT) {
      return { ...UNAVAILABLE_EMOTION_CONTEXT };
    }

    return {
      label,
      confidenceBand: confidenceBand(estimate.confidence),
      modelVersion: estimate.modelVersion,
      observedAt: estimate.observedAt,
    };
  }
}

