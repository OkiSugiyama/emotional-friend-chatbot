import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type Risk = "critical" | "high" | "medium";
type Layer =
  | "unit"
  | "integration"
  | "security"
  | "accessibility"
  | "responsive"
  | "e2e";

interface TraceabilityManifest {
  schemaVersion: number;
  authorities: string[];
  requiredLayers: Layer[];
  scenarios: Array<{
    id: string;
    risk: Risk;
    scenario: string;
    expectedResult: string;
    requirementIds: string[];
    layers: Record<Layer, string[]>;
  }>;
}

const workspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const requirementsPath = resolve(
  workspaceRoot,
  "docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md"
);
const manifestPath = resolve(
  workspaceRoot,
  "tests/traceability/p0-traceability.json"
);

const requirements = readFileSync(requirementsPath, "utf8");
const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8")
) as TraceabilityManifest;

const expectedScenarioIds = Array.from(
  { length: 20 },
  (_, index) => `AC-${String(index + 1).padStart(3, "0")}`
);
const requiredLayers: Layer[] = [
  "unit",
  "integration",
  "security",
  "accessibility",
  "responsive",
  "e2e"
];

function parseAcceptanceScenarios(source: string) {
  return new Map(
    [...source.matchAll(/^\| (AC-\d{3}) \| (.+?) \| (.+?) \|$/gm)].map(
      ([, id, scenario, expectedResult]) => [
        id,
        { scenario, expectedResult }
      ]
    )
  );
}

function parseP0RequirementIds(source: string) {
  return new Set(
    [...source.matchAll(/^\| ([A-Z0-9]+-\d{3}) \| P0 \|/gm)].map(
      ([, id]) => id
    )
  );
}

describe("P0 acceptance traceability", () => {
  it("contains AC-001 through AC-020 exactly once and in order", () => {
    const actualIds = manifest.scenarios.map(({ id }) => id);

    expect(actualIds).toEqual(expectedScenarioIds);
    expect(new Set(actualIds).size).toBe(actualIds.length);
  });

  it("uses only docs and UI Mockup files as product authorities", () => {
    expect(manifest.authorities.length).toBeGreaterThan(0);
    expect(
      manifest.authorities.every(
        (authority) => authority.startsWith("docs/") || authority.startsWith("UI Mockup/")
      )
    ).toBe(true);
  });

  it("keeps scenario wording synchronized with the normative requirements", () => {
    const normativeScenarios = parseAcceptanceScenarios(requirements);

    expect([...normativeScenarios.keys()]).toEqual(expectedScenarioIds);
    for (const entry of manifest.scenarios) {
      expect(normativeScenarios.get(entry.id), entry.id).toEqual({
        scenario: entry.scenario,
        expectedResult: entry.expectedResult
      });
    }
  });

  it("maps every scenario to all required test layers", () => {
    expect(manifest.requiredLayers).toEqual(requiredLayers);

    for (const entry of manifest.scenarios) {
      expect(Object.keys(entry.layers).sort(), entry.id).toEqual(
        [...requiredLayers].sort()
      );
      for (const layer of requiredLayers) {
        expect(entry.layers[layer].length, `${entry.id}:${layer}`).toBeGreaterThan(
          0
        );
        expect(
          entry.layers[layer].every((testCase) => testCase.trim().length > 0),
          `${entry.id}:${layer}`
        ).toBe(true);
      }
    }
  });

  it("references only enumerated P0 requirements", () => {
    const p0RequirementIds = parseP0RequirementIds(requirements);

    for (const entry of manifest.scenarios) {
      expect(entry.requirementIds.length, entry.id).toBeGreaterThan(0);
      for (const requirementId of entry.requirementIds) {
        expect(p0RequirementIds.has(requirementId), `${entry.id}:${requirementId}`).toBe(
          true
        );
      }
    }
  });

  it("assigns an explicit supported risk rank to every scenario", () => {
    const supportedRisks = new Set<Risk>(["critical", "high", "medium"]);

    for (const entry of manifest.scenarios) {
      expect(supportedRisks.has(entry.risk), entry.id).toBe(true);
    }
  });
});
