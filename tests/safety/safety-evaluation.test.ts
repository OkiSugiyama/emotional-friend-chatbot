import { describe, expect, test } from "vitest";
import {
  SAFETY_COPY_VERSION,
  SAFETY_POLICY_VERSION,
  routeHighRisk,
  validateProviderOutput,
} from "../../server/safety";
import { safetyPolicy } from "../../server/safety-policy";
import {
  declaredHarmCategories,
  evaluationManifest,
  FIXTURE_VERSION,
  RECORDED_COPY_VERSION,
  EVALUATED_FIXTURE_VERSION,
  RECORDED_POLICY_VERSION,
  requiredLanguageForms,
  type SafetyEvaluationCase,
} from "./fixtures";

function evaluateActualOutcome(fixture: SafetyEvaluationCase): string {
  if (fixture.dimension === "non_medical_claim") {
    try {
      validateProviderOutput(fixture.providerOutput ?? "");
      return "provider_output:accepted";
    } catch {
      return "provider_output:rejected";
    }
  }

  const route = routeHighRisk(fixture.currentText, fixture.history);
  return route ? `safety_support:${route.category}` : "assistant:no_route";
}

// This suite is evidence about one specific routing policy. The trigger set is
// configuration (see server/safety-policy.ts), and the illustrative set shipped
// in the repository is deliberately not the evaluated one. Running the corpus
// against a different policy would produce numbers belonging to no recorded
// evaluation, so the precondition below fails loudly and the evaluation is held
// back rather than reported under a version it did not measure.
//
// This does not weaken NFR-4. Wherever the evaluated policy IS loaded — locally,
// and in any environment holding it — the suite runs in full and its unresolved
// critical gate stays red. No arrangement of these two blocks yields a green run
// without both the evaluated policy present and the criticals resolved.
const evaluatedPolicyLoaded = SAFETY_POLICY_VERSION === RECORDED_POLICY_VERSION;
const evaluatedCorpusLoaded = FIXTURE_VERSION === EVALUATED_FIXTURE_VERSION;

// Three states, and they are not the same thing.
//
//   both  — the evaluated policy and corpus are present. Run the evaluation. Its
//           unresolved-critical gate is expected to fail, and must never be hidden.
//   neither — the published state of this repository. The evaluated inputs are
//           deliberately not distributed, so the evaluation is not applicable
//           rather than failing. Skip, loudly: 88 tests report as skipped.
//   mixed — one input evaluated and the other illustrative. Nobody configures
//           that on purpose, and results from it would belong to no recorded
//           evaluation, so it fails.
//
// Skipping the "neither" case does not weaken NFR-4. The D-2 gate can only be
// reached by supplying both evaluated inputs, and supplying them makes it red.
// Removing them to chase a green run removes the evaluation itself, which the
// skip count and README "Status" both state plainly.
const evaluationInputsPresent = evaluatedPolicyLoaded && evaluatedCorpusLoaded;
const evaluationInputsAbsent = !evaluatedPolicyLoaded && !evaluatedCorpusLoaded;
const describeEvaluated = evaluationInputsPresent ? describe : describe.skip;
const describeMixed = evaluationInputsAbsent ? describe.skip : describe;

describeMixed("TASK-03 safety evaluation precondition", () => {
  test("does not mix an evaluated input with an illustrative one", () => {
    expect(
      { policy: SAFETY_POLICY_VERSION, corpus: FIXTURE_VERSION },
      "The safety evaluation was given one evaluated input and one illustrative one. " +
        "Results from that combination belong to no recorded evaluation. Supply both, as " +
        "server/safety-policy.local.json and tests/safety/corpus.local.json or through " +
        "SAFETY_POLICY_PATH and SAFETY_CORPUS_PATH, or neither. " +
        "See docs/qa/SAFETY-POLICY-PUBLICATION.md.",
    ).toEqual({ policy: RECORDED_POLICY_VERSION, corpus: EVALUATED_FIXTURE_VERSION });
  });
});

describeEvaluated("TASK-03 versioned synthetic safety evaluation", () => {
  test("pins the fixture, policy, and copy versions", () => {
    expect(evaluationManifest.fixtureVersion).toBe(FIXTURE_VERSION);
    expect(evaluationManifest.policyVersion).toBe(RECORDED_POLICY_VERSION);
    expect(evaluationManifest.copyVersion).toBe(RECORDED_COPY_VERSION);
    expect(SAFETY_POLICY_VERSION).toBe(RECORDED_POLICY_VERSION);
    expect(SAFETY_COPY_VERSION).toBe(RECORDED_COPY_VERSION);
  });

  test("covers every declared harm category in every required language form exactly once", () => {
    const matrixCases = evaluationManifest.cases.filter(
      (fixture) => fixture.dimension === "harm_language",
    );
    expect(matrixCases).toHaveLength(declaredHarmCategories.length * requiredLanguageForms.length);
    for (const harmCategory of declaredHarmCategories) {
      for (const languageForm of requiredLanguageForms) {
        expect(
          matrixCases.filter(
            (fixture) =>
              fixture.harmCategory === harmCategory && fixture.languageForm === languageForm,
          ),
          `${harmCategory}:${languageForm}`,
        ).toHaveLength(1);
      }
    }
  });

  test("covers required false-positive, camera, location, and non-medical dimensions", () => {
    const counts = Object.fromEntries(
      [
        "benign_lookalike",
        "context_reversal",
        "camera_only",
        "contradictory_estimate",
        "location_neutral",
        "non_medical_claim",
      ].map((dimension) => [
        dimension,
        evaluationManifest.cases.filter((fixture) => fixture.dimension === dimension).length,
      ]),
    );
    expect(counts).toEqual({
      benign_lookalike: 7,
      context_reversal: 7,
      camera_only: 2,
      contradictory_estimate: 1,
      location_neutral: 1,
      non_medical_claim: 8,
    });
    expect(evaluationManifest.cases).toHaveLength(75);
    expect(new Set(evaluationManifest.cases.map(({ id }) => id)).size).toBe(75);
    expect(evaluationManifest.cases.every(({ provenance }) => provenance === "synthetic-only")).toBe(
      true,
    );
  });

  test.each(evaluationManifest.cases)("records the current actual outcome for $id", (fixture) => {
    expect(evaluateActualOutcome(fixture)).toBe(fixture.actualOutcome);
  });

  test("records false-positive, false-negative, and disposition fields consistently", () => {
    for (const fixture of evaluationManifest.cases) {
      if (fixture.expectedOutcome === fixture.actualOutcome) {
        expect(fixture.classification, fixture.id).toBe("none");
        expect(fixture.criticalDisposition, fixture.id).toBe("none");
        continue;
      }
      if (fixture.expectedOutcome === "assistant:no_route") {
        expect(fixture.classification, fixture.id).toBe("false_positive");
      } else {
        expect(fixture.classification, fixture.id).toBe("false_negative");
      }
      expect(fixture.criticalDisposition, fixture.id).toBe(
        fixture.severityOnMismatch === "critical"
          ? "P1-unresolved-stop-acceptance"
          : "high-unresolved-review-required",
      );
    }
  });

  test("all current safety responses carry exact reviewed-status metadata and reviewed copy", () => {
    const routedCases = evaluationManifest.cases.filter((fixture) =>
      fixture.actualOutcome.startsWith("safety_support:"),
    );
    expect(routedCases.length).toBeGreaterThan(0);
    for (const fixture of routedCases) {
      const route = routeHighRisk(fixture.currentText, fixture.history);
      expect(route, fixture.id).toBeDefined();
      expect(route?.safety, fixture.id).toEqual({
        category: route?.category,
        policyVersion: RECORDED_POLICY_VERSION,
        copyVersion: RECORDED_COPY_VERSION,
        locationNeutral: safetyPolicy.locationNeutral,
        requiresReview: true,
      });
      expect(route?.responseText, fixture.id).toMatch(/local emergency services|trusted person|urgent medical care/i);
      expect(route?.responseText, fixture.id).not.toMatch(/\+?\d[\d\s()-]{6,}/);
      expect(route?.responseText, fixture.id).not.toMatch(/guaranteed rescue|human (?:was|has been) alerted/i);
    }
  });

  test("has no unresolved critical mismatch before safety acceptance", () => {
    const unresolvedCriticalIds = evaluationManifest.cases
      .filter(
        (fixture) =>
          fixture.expectedOutcome !== fixture.actualOutcome &&
          fixture.criticalDisposition === "P1-unresolved-stop-acceptance",
      )
      .map(({ id }) => id);
    expect(unresolvedCriticalIds, "critical mismatches must stop TASK-03 acceptance").toEqual([]);
  });
});
