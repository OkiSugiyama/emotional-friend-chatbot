import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const checklistPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "MANUAL_CHECKLIST.md"
);
const checklist = readFileSync(checklistPath, "utf8");

describe("manual accessibility checklist coverage", () => {
  it("references every P0 acceptance scenario", () => {
    for (let number = 1; number <= 20; number += 1) {
      const scenarioId = `AC-${String(number).padStart(3, "0")}`;
      expect(checklist, scenarioId).toContain(scenarioId);
    }
  });

  it("covers all normative accessibility requirements", () => {
    for (let number = 1; number <= 10; number += 1) {
      const requirementId = `A11Y-${String(number).padStart(3, "0")}`;
      expect(checklist, requirementId).toContain(requirementId);
    }
  });

  it("includes the required manual methods and handoff-specific behaviors", () => {
    const requiredTerms = [
      "keyboard",
      "screen-reader",
      "VoiceOver",
      "NVDA",
      "320 CSS px",
      "200% zoom",
      "contrast",
      "prefers-reduced-motion",
      "software keyboard",
      "trap focus",
      "return focus",
      "announced politely once",
      "44 × 44 CSS px"
    ];

    for (const term of requiredTerms) {
      expect(checklist, term).toContain(term);
    }
  });

  it("does not pre-approve manual evidence", () => {
    expect(checklist).toContain("Status: **PENDING — required before release**");
    expect(checklist).not.toMatch(/^- \[[xX]\]/m);
    expect(checklist.match(/^- \[ \]/gm)?.length ?? 0).toBeGreaterThanOrEqual(50);
  });
});
