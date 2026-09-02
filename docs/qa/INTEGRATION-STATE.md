# Integration state of `main`

Recorded by the PM at the TASK-01/03/04/05/08/09 integration, 2026-08-30, under
owner approval. Contract revision 2.

## `main` is deliberately red. Do not make it green.

`npm test` on `main` reports **one failing test**, and that failure is required
to be there:

```
tests/safety/safety-evaluation.test.ts
  > TASK-03 versioned synthetic safety evaluation
  > has no unresolved critical mismatch before safety acceptance
```

It fails on 16 unresolved critical mismatches: the `INDIRECT` and `AMBIGUOUS`
language forms of all seven declared harm categories, plus `CLAIM-MONITORING`
and `CLAIM-RESCUE` at the provider-output boundary.

This is the D-2 acceptance gate, not a defect. NFR-4 requires that critical
failures stay visible with no skip, focus, quarantine, waiver, reclassification,
or retry. Anything that turns this green without fixing the underlying
behaviour — `it.skip`, `it.fails`, a test-path exclusion, loosening the
assertion, reclassifying a case — violates NFR-4 and misrepresents safety
readiness. The gate goes green when the routing and provider-boundary behaviour
it measures actually changes, and by no other route.

For unrelated work, read the other 20 test files; do not remove this one from
the default `npm test`.

## Counts at this integration

| Run | Files | Tests |
|---|---|---|
| `main` before integration | 19 passed | 123 passed |
| `main` after integration | 20 passed, 1 failed | 243 passed, 1 failed |

`npm run typecheck` clean. `npm run build` succeeds. The Firestore rules
emulator suite (`npm run test:rules`) was not run at this integration. It was
run afterwards, on 2026-08-30, against `main` at `0aa4e27`: 7 passed of 7,
with a negative control confirming all 7 fail when the rules are made
permissive. It touches none of the counts above, which are `npm test` only.
See `docs/qa/RG-04-firestore-authorization.md`.

## Merged

| Branch | Result of record | What it brought |
|---|---|---|
| TASK-01 baseline evidence | — | docs only |
| TASK-03 versioned safety evaluation | **blocked** | the evaluation suite and fixtures, and the red gate above |
| TASK-04 camera privacy evidence | — | docs and sanitized synthetic artifacts |
| TASK-05 manual accessibility review | — | docs, synthetic fixture, manual checklist |
| TASK-08 accessibility remediation | — | source, styles, accessibility suite |
| TASK-09 persistent help affordance | — | FR-5 detection-independent affordance, arrival-visibility fix |

TASK-03 is merged while recorded `blocked`. Its blocked status is a finding about
the router it measured, not about the evaluation work. Keeping the instrument out
of `main` would leave `main` with no record that the router fails, which is the
worse misrepresentation.

## Not merged

| Branch | Why |
|---|---|
| `ai/TASK-06-safety-remediation` | recorded FAIL; its packet is marked invalid against revision 2 |
| `ai/TASK-07-browser-privacy-evidence` | recorded blocked |

## Not approved by this integration

D-2, D-5, RG-05, RG-07, Gate C, Gate D, release, publication, and any recall
claim. Merging is integration, not acceptance. Nothing has been pushed,
deployed, or published.

## Evidence that is still absent

Carried forward from `docs/qa/TASK-05.md`, `docs/qa/TASK-08.md`, and
`docs/qa/TASK-09.md`, and not closed by this integration:

- physical iOS and Android devices, a non-zero safe-area inset, software-keyboard
  behaviour, and mobile toolbar collapse. No iOS simulator runtime is installed
  and there is no `adb` on the machine
- VoiceOver, NVDA, and TalkBack announcement behaviour
- forced-colors acceptance, which needs a real Windows contrast theme

**Closed 2026-08-30, third pass — all three engines.** Safari 26.6.2 / WebKit
605.1.15, run after the owner enabled remote automation, matches Blink and Gecko
to the pixel across 20 measurements on both screens. Exact 320 CSS px is not
reachable in Safari, whose smallest window gives 336; 336 sits in the same
`max-width: 359px` media band, and direct 320 measurements exist in Blink and
Gecko.

**Closed 2026-08-30, second pass.** Firefox 153 matches Chrome exactly on both
screens across 24 measurements, including an exact 320 CSS px viewport that
TASK-05 could not reach. `prefers-reduced-motion`, increased text spacing, 200%
zoom, and rendered contrast sampled from decoded screenshot pixels were also
measured. One observation stands for owner adjudication: the strip's fill is the
same colour as the page above it and its top border is 1.24:1, while the
conformance-carrying trigger border is 3.29:1 with little headroom. See
`docs/qa/TASK-09.md`.

**Closed 2026-08-30.** The signed-in screens were measured against Firebase
emulators with no production credentials and no real data. The help affordance
and the composer abut exactly and never overlap, at 390×844, 320×800, 640×800
and 1280×800, in four states each, with zero occluded controls. See
`docs/qa/TASK-09.md`.

jsdom performs no layout. No jsdom test in this repository is evidence about
rendered position, occlusion, or visibility.

## Boundary deviation disclosed at this integration

The signed-in measurement required `firebase-tools`, which is not a dependency of
this repository. It was obtained with `npx --yes firebase-tools@15.26.0`, the
exact version already pinned in `package.json`'s `test:rules` script, so no new
version was introduced. It installed into the user-level npx cache only.
`package.json`, `package-lock.json`, `node_modules`, and the working tree were
verified unchanged. This used the network, which the standing execution boundary
otherwise avoids, and is recorded rather than treated as routine.

## Release gates, as of 2026-08-30

`tests/release/release-evidence.json` records all ten gates RG-01..RG-10 as
`status: "pending"` with `evidence: []`. The file's own
`policy.blockingStatuses` lists `pending` and `blocked`, so every gate is
currently release-blocking. Nothing in this integration, and nothing in the
layout, cross-engine or Firestore work that followed it, changed any gate's
status.

RG-04's outstanding evidence — an emulator report and an owner / non-owner /
unauthenticated matrix — now exists at
`docs/qa/RG-04-firestore-authorization.md`. It is an artifact awaiting the
Security engineer, not an approval. The gate remains `pending` in the ledger.

Of the ten, RG-04 was the only one whose missing evidence could be produced
locally. RG-02 needs a CI run, RG-03 needs E2E suites that do not exist, RG-06
needs an independent reviewer, RG-07 needs the 16 unresolved criticals resolved,
RG-08..RG-10 need deployment, legal and operational decisions the contract
defers to the owner at Gate D.
