# Safety policy publication split

Recorded 2026-08-30 by the PM agent, under owner direction, on `main`.

## Why

The owner is considering publishing this repository as a portfolio demo. The
contract's explicit non-goals (`requirements.md`) forbid *"Publishing exact
safety triggers, production prompts, abuse controls, private endpoints,
operational secrets, or real-user evidence"*, and list *"exposure of exact
safety/abuse internals"* as an escalation. Until now the high-risk routing
trigger set was four regular expressions written inline in `server/safety.ts` —
by a plain reading of that clause, the abuse control itself, in source.

## What changed

The trigger set became configuration rather than source.

| File | Committed | Contents |
| --- | --- | --- |
| `server/safety-policy.ts` | yes | Loader, validation, resolution order |
| `server/safety-policy.json` | yes | Shipped **illustrative** set, `policyVersion: "illustrative-v1"`, `evaluated: false` |
| `server/safety-policy.local.json` | **no**, gitignored | **Evaluated** set, `policyVersion: "safety-routing-v1"`, `evaluated: true` |

Resolution order is `SAFETY_POLICY_PATH`, then `server/safety-policy.local.json`,
then the shipped file. `server/safety.ts` keeps its public API unchanged —
`routeHighRisk`, `validateProviderOutput`, `SAFETY_POLICY_VERSION`,
`SAFETY_COPY_VERSION` — and `server/api-handlers.ts` was not touched.

The evaluated file was generated mechanically from the previous inline
definitions rather than transcribed, so the patterns are exact.

## Version integrity

`SAFETY_POLICY_VERSION` is now the loaded policy's own `policyVersion`, not a
constant. A routed response therefore cannot be stamped with a policy version
whose patterns were not the ones in force. With the shipped set loaded, routed
responses record `illustrative-v1`.

`tests/safety/safety-evaluation.test.ts` gained a precondition block. If the
loaded policy is not `safety-routing-v1`, one test fails with an explanation and
the 81-test evaluation is held back instead of reporting numbers against a
policy it did not measure.

This does not weaken NFR-4. Wherever the evaluated policy is loaded the suite
runs in full and its unresolved-critical gate stays red; where it is not loaded,
the precondition fails. There is no arrangement that yields a green run without
both the evaluated policy present and the 16 criticals resolved.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm test`, evaluated policy loaded | 244 passed, 1 failed — the same pre-existing D-2 gate, same 16 critical IDs as before the change |
| `npm test`, shipped policy only | 1 failed (the precondition), 81 skipped |
| `npm run build` | succeeds |
| `dist/` scanned for trigger literals | none — the router is server-only |

The 16 unresolved critical IDs are byte-identical to those recorded before this
change, which is the regression check that matters: externalising the policy
altered no routing behaviour.

## What stays public, and why

**The synthetic evaluation corpus (`tests/safety/fixtures.ts`) stays.** Every
case is prefixed `Synthetic scenario:` / `Synthetic fiction:`, is declared
`provenance: "synthetic-only"`, and contains no real-user content. It is the
D-2 evidence, and it is the part of this work worth showing.

**Correction, 2026-08-31.** As first written, this document said the split meant
"the exact trigger inventory of a running service is never published." That
overstated it, and the overstatement was measured rather than argued away: of
the 21 literal alternatives in the evaluated pattern set, **11 appeared verbatim
in the published corpus** at the time this was written. The corpus has to contain phrases the router catches
— that is what its `direct` variants are for — so publishing the corpus reveals
roughly half the inventory whatever the policy file does.

What the split does achieve is narrower and still worth having. The tuned set is
no longer source, so as the policy is corrected — which is the open FR-5 work —
the corrected set never enters the repository, and the gap between what is
published and what is deployed only widens from here.

**Correction, 2026-08-31, second.** The paragraph that stood here said the
residual exposure was acceptable because "the live site does not run this
router." That was wrong, and it was wrong in the worst direction: it was an
assurance about a live service based on a check that did not cover it.

What had been verified was that `personal_website` — a separate Next.js
implementation — contains no high-risk routing code. What had *not* been checked
was whether this repository itself had a deployment. It did:
`emotionalfriendchatbot.okisugiyama.com`, status Ready, built from `df2a2a8`,
the head of `origin/main`. That commit carries `server/safety.ts` with the
trigger patterns inline. So for the period between publication and the
retirement recorded below, the published corpus did describe the controls of a
running service.

**Superseded, 2026-08-31.** Retiring the deployment was the wrong lever, and the
owner said so: the project is meant to be deployed. Taking the site down would
have deferred the problem to the next deploy, not solved it. The durable fix is
that the published repository stops carrying the bypass specifics — then the
deployment can stay up, and shipping the rebuilt version later does not reopen
this.

So the corpus was externalised the same way the policy was:

| File | Committed | Contents |
| --- | --- | --- |
| `tests/safety/corpus.json` | yes | Descriptions of each case, `fixtureVersion: "illustrative-corpus-v1"` |
| `tests/safety/corpus.local.json` | **no**, gitignored | The evaluated phrasings, `task-03-synthetic-safety-fixtures-v1` |

`tests/safety/fixtures.ts` keeps everything that makes this an evaluation rather
than a word list: the 7 × 7 category and language-form matrix, the classification
rules, the severity model, the dimension counts and the recorded outcomes. Only
the wordings moved. The evaluation suite's precondition now gates on both the
policy and the corpus, and `FIXTURE_VERSION` is the loaded corpus's own version,
so no run can be labelled with a corpus it did not use.

Verified: locally, 245 passed and 1 failed on the same D-2 gate, with the 16
unresolved critical IDs byte-identical to before the change. With the shipped
files only, both preconditions fail and the 81-test evaluation is held back.

The paragraph below is kept for the record.

**Superseded — being resolved by retiring the deployment.** The owner chose to take the
production deployment down rather than trim the published evidence. That is the
better order of operations: the deployment runs the 2026-08-09 code, which
predates the safety evaluation, the accessibility remediation and this policy
split by 62 commits, and it has never passed any release gate — the contract
does not count external release among its completion conditions at all. A public
record of how a retired prototype failed is evidence. The same record about a
running service is a bypass guide.

Once nothing is deployed, the corpus describes a system that runs nowhere, which
is the condition this document wrongly assumed from the start. **This entry will
be updated to record the retirement as done, with its date, once confirmed. Until
that line appears here, treat the deployment as live.**

**The measured residual stays.** `docs/qa/`, the TASK-03 and TASK-06 packets and
`INTEGRATION-STATE.md` record that indirect and ambiguous phrasings evade the
router, that 16 criticals are unresolved, and that `main` is deliberately red.
Publishing a failure *class* is not publishing a working bypass, and an engineer
who measured their own safety system's failure rate and refused to hide it is
the honest thing to show.

The distinction drawn here is between an inventory of live triggers and an
account of what the system gets wrong. The first is an abuse control; the second
is evidence.

## Limit — this does not clear the repository for publication

The previous inline patterns remain in git history. `git log -S "being
trafficked"` returns three or more commits. **Removing them from `HEAD` does not
remove them from a published repository.** Anyone who clones it can read the
evaluated set from history.

This split is correct architecture and it governs everything from here forward —
as the policy is tuned, the tuned set never enters the repository. It does not,
on its own, make the existing history safe to publish.

**Resolved 2026-08-31.** The owner chose to publish a fresh repository carrying
no prior history, under MIT. This repository stays private and keeps the full
record. The history question therefore does not arise for the published copy.

## Residual overlap, measured 2026-08-31

After externalising both the policy and the corpus, **6 of the 21 evaluated
literal alternatives remain visible** in published files, down from 11. All six
come from the shipped illustrative policy, which has to contain something for
the router to match in a local demo: `kill myself`, `end my life`, `suicid`,
`immediate danger`, `being abused`, `severe chest pain`.

These are the first phrases anyone writing such a matcher would try. They are not
the useful half. What is gone is the other half — the indirect, ambiguous,
joking, quoted and third-person constructions, which is the part that told a
reader what slips past. That set now exists only in gitignored files.

One further occurrence was removed: the requirements document illustrated a
safety-support exchange with a real trigger phrase, and now describes the message
instead of quoting it.

## Precondition semantics, corrected 2026-09-02

The precondition first written here failed whenever the evaluated inputs were
absent. That was wrong for the published repository, and the error was one of
meaning rather than mechanism: absent inputs are the documented state of that
repository, not a defect. The public CI was reporting red for "you did not give
me the private files", while the failure that must never be hidden — the D-2
unresolved-critical gate — was not even running there, 88 tests skipped.

A red signal that does not mean what a reader will take it to mean is worse than
no signal.

Three states now:

| Inputs | Behaviour | Where |
| --- | --- | --- |
| Both evaluated | Evaluation runs; the D-2 gate fails on 16 unresolved criticals | Local work, private CI |
| Neither | Evaluation skipped, 88 tests reported as skipped | The published repository |
| One of each | Fails — results from that mix belong to no recorded evaluation | Misconfiguration |

This does not weaken NFR-4. The D-2 gate is reachable only by supplying both
evaluated inputs, and supplying them makes it red. Deleting them to chase a green
run deletes the evaluation along with it, which the skip count states in the test
output and README "Status" states in prose.
