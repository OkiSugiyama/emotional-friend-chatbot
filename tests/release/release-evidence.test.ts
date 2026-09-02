import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type GateStatus = "pending" | "blocked" | "passed";

interface ReleaseEvidence {
  schemaVersion: number;
  policy: {
    prohibitQuarantinedP0: boolean;
    blockingStatuses: GateStatus[];
  };
  gates: Array<{
    id: string;
    requirement: string;
    owner: string;
    status: GateStatus;
    requiredEvidence: string[];
    evidence: string[];
    notes: string;
  }>;
}

const workspaceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const requirements = readFileSync(
  resolve(workspaceRoot, "docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md"),
  "utf8"
);
const releaseEvidence = JSON.parse(
  readFileSync(resolve(workspaceRoot, "tests/release/release-evidence.json"), "utf8")
) as ReleaseEvidence;
const checklist = readFileSync(
  resolve(workspaceRoot, "tests/release/RELEASE_EVIDENCE_CHECKLIST.md"),
  "utf8"
);

function normativeReleaseGates(source: string) {
  const section = source
    .slice(source.indexOf("### 19.2 Release gates"))
    .split("## 20. MVP Acceptance Scenarios", 1)[0];

  return [...section.matchAll(/^- (.+)$/gm)].map(([, gate]) => gate);
}

describe("release evidence contract", () => {
  it("tracks every normative release gate verbatim and in order", () => {
    const normativeGates = normativeReleaseGates(requirements);

    expect(normativeGates).toHaveLength(10);
    expect(releaseEvidence.gates.map(({ requirement }) => requirement)).toEqual(
      normativeGates
    );
    expect(releaseEvidence.gates.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 10 },
        (_, index) => `RG-${String(index + 1).padStart(2, "0")}`
      )
    );
  });

  it("requires an owner and defined evidence for every gate", () => {
    for (const gate of releaseEvidence.gates) {
      expect(gate.owner.trim().length, `${gate.id}:owner`).toBeGreaterThan(0);
      expect(
        gate.requiredEvidence.length,
        `${gate.id}:requiredEvidence`
      ).toBeGreaterThan(0);
      expect(
        gate.requiredEvidence.every((item) => item.trim().length > 0),
        gate.id
      ).toBe(true);
    }
  });

  it("never represents a passing gate without attached evidence", () => {
    const allowedStatuses = new Set<GateStatus>(["pending", "blocked", "passed"]);

    for (const gate of releaseEvidence.gates) {
      expect(allowedStatuses.has(gate.status), gate.id).toBe(true);
      if (gate.status === "passed") {
        expect(gate.evidence.length, `${gate.id}:evidence`).toBeGreaterThanOrEqual(
          gate.requiredEvidence.length
        );
      } else {
        expect(gate.notes.trim().length, `${gate.id}:notes`).toBeGreaterThan(0);
      }
    }
  });

  it("makes pending and blocked status release-blocking and prohibits P0 quarantine", () => {
    expect(releaseEvidence.policy.prohibitQuarantinedP0).toBe(true);
    expect(new Set(releaseEvidence.policy.blockingStatuses)).toEqual(
      new Set<GateStatus>(["pending", "blocked"])
    );
  });

  it("keeps the human checklist aligned with every gate and unapproved by default", () => {
    for (const gate of releaseEvidence.gates) {
      expect(checklist, gate.id).toContain(gate.id);
    }
    expect(checklist).toContain(
      "Status: **NOT READY — all gates remain pending until evidence is attached**"
    );
    expect(checklist).not.toMatch(/^- \[[xX]\]/m);
  });
});
