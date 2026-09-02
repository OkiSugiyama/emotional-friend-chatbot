import type { RecentHistoryMessage } from "./contracts.js";
import type { CompletedSend } from "./ports.js";
import { safetyPolicy } from "./safety-policy.js";

/**
 * The trigger set is loaded from configuration — see `./safety-policy.ts`. The
 * version recorded on a routed response is the loaded policy's own version, so
 * evidence can never claim a policy version whose patterns were not in force.
 */
export const SAFETY_POLICY_VERSION = safetyPolicy.policyVersion;
export const SAFETY_COPY_VERSION = safetyPolicy.copyVersion;

const categories = safetyPolicy.categories;

export interface SafetyRoute {
  category: string;
  responseText: string;
  safety: NonNullable<CompletedSend["safety"]>;
}

export function routeHighRisk(
  currentText: string,
  history: ReadonlyArray<RecentHistoryMessage>,
): SafetyRoute | undefined {
  const recentUserContext = history
    .filter((message) => message.role === "user")
    .slice(-1)
    .map((message) => message.text)
    .join("\n");
  const content = `${recentUserContext}\n${currentText}`;
  const match = categories.find((candidate) => candidate.pattern.test(content));
  if (!match) return undefined;

  return {
    category: match.category,
    responseText: match.responseText,
    safety: {
      category: match.category,
      policyVersion: SAFETY_POLICY_VERSION,
      copyVersion: SAFETY_COPY_VERSION,
      locationNeutral: safetyPolicy.locationNeutral,
      requiresReview: true,
    },
  };
}

export function validateProviderOutput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || Array.from(trimmed).length > 32_000) {
    throw new Error("invalid provider output");
  }
  return trimmed;
}
