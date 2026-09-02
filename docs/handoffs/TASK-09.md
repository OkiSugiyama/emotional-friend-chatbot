---
schema_version: 1
agent: claude
task_id: TASK-09
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
result: pass
result_scope: automated-implementation-pass-only
base_revision: e79a0e74f87aa5a1906520a5ab3e192890b7e543
worktree_revision_at_start: 7a9d94ee663e0a9cdbaa0f894f57b36dd33dcb65
head_revision: HEAD
code_under_test_revision: aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0
prior_code_under_test_revisions:
  - 319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49
  - 0154b09e0cba42cbeae7cc37c1f56f7ba734b28d
branch: ai/TASK-09-persistent-help-affordance
worktree: /Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot-TASK-09
contract_revision: "1"
contract_sha256: 766e98ff9f761bb3432f567dff279c500b33d41aa01cfa162427022afcc53b57
requirements:
  - FR-5
  - FR-8
  - NFR-1
  - NFR-2
  - NFR-3
  - NFR-4
  - NFR-8
deliverables:
  - D-5
decisions:
  - DEC-004
  - DEC-005
  - DEC-006
  - DEC-007
changed_files:
  - src/components/AppView.tsx
  - src/styles/app-view.css
  - src/styles/tokens.css
  - tests/accessibility/persistent-help.test.tsx
  - docs/qa/TASK-09.md
  - docs/handoffs/TASK-09.md
unchanged_in_write_scope:
  - tests/accessibility/app-view.a11y.test.tsx
command_results:
  - order: 1
    command: node --version
    exit_code: 0
    result: "v24.3.0"
  - order: 2
    command: npm --version
    exit_code: 0
    result: "11.4.2"
  - order: 3
    command: npm ci --offline
    exit_code: 0
    result: "funding=84 vulnerabilities=0; package counts not retained from captured output"
  - order: 4
    command: npm run typecheck
    exit_code: 0
    result: "TypeScript build completed with no diagnostics"
  - order: 5
    command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
    authority: implementation_agent
    verified_revision: aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0
    exit_code: 0
    result: "test_files_passed=4 test_files_failed=0 test_files_total=4 tests_passed=52 tests_failed=0 tests_skipped=0 tests_total=52 duration_seconds=1.42"
  - order: 6
    command: npm run test
    exit_code: 0
    result: "test_files_passed=20 test_files_skipped=1 test_files_total=21 tests_passed=163 tests_failed=0 tests_skipped=7 tests_total=170 duration_seconds=2.62"
  - order: 7
    command: npm run build
    exit_code: 0
    result: "duration_ms=521 advisory_warning_blocks=1 oversized_javascript_chunks=2 css_bundle_kb=48.21; module count not retained from captured output"
  - order: 8
    command: git status --short
    exit_code: 0
    result: "entries=2; run against the working tree holding the fix, committed unchanged as aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0"
  - order: 9
    command: git diff --check
    exit_code: 0
    result: "no output"
acceptance_sequence_run_count: 3
pre_acceptance_working_tree_history:
  - command: node --version
    context: environment_reconnaissance
    revision_state: uncommitted_working_tree
    exit_code: 0
    result: "v24.3.0"
  - command: npm --version
    context: environment_reconnaissance
    revision_state: uncommitted_working_tree
    exit_code: 0
    result: "11.4.2"
  - command: npm run typecheck
    context: run_before_node_modules_existed
    revision_state: uncommitted_working_tree
    exit_code: non_zero_exact_code_not_captured
    result: "sh: tsc: command not found"
    preserved_not_relabeled: true
  - command: npm ci --offline
    context: development_install_to_enable_implementation
    revision_state: uncommitted_working_tree
    exit_code: 0
    result: "added=511 audited=512 duration_seconds=4 funding=84 vulnerabilities=0 deprecation_warnings=2"
  - command: git status --short
    context: diff_review_reorientation_and_staging
    invocations: 3
    revision_state: uncommitted_working_tree
    exit_code: 0
  - command: npx vitest run tests/accessibility/persistent-help.test.tsx
    context: development_iteration_non_packet_form
    revision_state: uncommitted_working_tree
    exit_code: 1
    result: "tests_passed=25 tests_failed=1 tests_total=26"
    defect: "A cssBlock marker in the new test matched the pre-existing `.ss-auth, .ss-app, .ss-expired` rule instead of the new reserve rule; the marker was made unique and the file then passed 26 of 26."
    preserved_not_relabeled: true
never_invoked_before_acceptance:
  - npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
  - npm run test
  - npm run build
  - git diff --check
session_interruption:
  cause: process_exit
  committed_work_at_interruption: none
  packet_acceptance_sequence_run_before_interruption: false
contract_question:
  question: "Does a minimal always-available help affordance sit inside existing UI-presentation authority, or does it require a contract revision?"
  resolution: no_deviation_required
  basis:
    - "no new claim: every rendered sentence already existed in reviewed source"
    - "no new resource: no service, hotline, number, URL, region, or organisation named"
    - "no new versioned copy constant introduced"
    - "SAFETY_COPY_VERSION unchanged"
    - "SAFETY_POLICY_VERSION unchanged"
    - "server/safety.ts unchanged; router untouched"
    - "safety_support response, its metadata, and camera-notice-v1 untouched"
  escalation_raised: false
contract_deviations: []
test_failures:
  - "Acceptance sequence on aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0: 0 failed."
  - "Prior acceptance sequence on 319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49: 0 failed. That revision passed its packet suite but was later measured in a real browser to place the affordance below the fold at every mobile width; the record is retained, not relabeled."
  - "Earlier acceptance sequence on 0154b09e0cba42cbeae7cc37c1f56f7ba734b28d: 0 failed. That revision was reviewed FAIL on evidence commit 75a09ce and superseded; the record is retained, not relabeled."
  - "Preserved history: one pre-commit `npm run typecheck` failed with `tsc: command not found` before node_modules existed, and one pre-commit `npx vitest run tests/accessibility/persistent-help.test.tsx` iteration failed 1 of 26 on a test-only CSS marker defect."
test_skips:
  - "Targeted oracle: 0 skipped."
  - "Full suite: 1 file and 7 tests skipped, unchanged from the TASK-08 baseline. No skip was added, removed, relabeled, or presented as passing evidence."
task_08_assertions_weakened: 0
task_08_axe_checks_disabled: 0
remediates_fr5: false
router_residual_false_negative_rate_unchanged: "82.9%"
synthetic_only: true
physical_camera_used: false
gui_or_manual_platform_claimed: false
external_connectors_used: false
provider_calls_used: false
network_used: false
production_accessed: false
deployed: false
published: false
pushed: false
merged: false
billing_used: false
self_accepted: false
human_gate_required: true
---

# TASK-09 handoff

## Summary

TASK-09 adds a detection-independent, always-available help affordance to the client presentation layer on frozen contract revision `1`. It does not modify the TASK-06 safety router, and it does not remediate FR-5. The router's independently measured 82.9% residual routing false-negative rate stands unchanged. This task lowers the cost of a false negative by making a calm, non-clinical, location-neutral help path reachable at any time without the router having routed anything and without the app having detected, inferred, or classified anything about the user.

The exact code-under-test revision is `aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0`; the superseded revisions are `319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49` and `0154b09e0cba42cbeae7cc37c1f56f7ba734b28d`. `aacd6a2` fixes a defect that only a real browser could find: on every revision before it the affordance rendered **below the fold** on the pre-sign-in screen at 390 × 844, 320 × 800 and 640 × 800, so it was present and reachable but not visible on arrival at any mobile width. The jsdom suite passed throughout, because the element was in the DOM and jsdom performs no layout. See "Below-the-fold defect and fix" below. `head_revision: HEAD` is the canonical symbolic value resolved by the handoff gate against the checked-out evidence commit; an evidence commit cannot embed its own future SHA. The machine-readable result is `pass` only because the packet acceptance suite passed on that exact revision. It is automated implementation evidence, not self-acceptance, and a fresh independent reviewer must inspect the exact final SHA.

## Changed files

| Path | Purpose | Requirements |
|---|---|---|
| `src/components/AppView.tsx` | Adds the `PersistentHelp` presentation component and renders it from the `AppView` root fragment, after the session experience and outside every session branch. It takes no props, invokes no action, performs no network call, and stores nothing. | FR-5 (cost-of-failure mitigation only), FR-8 |
| `src/styles/app-view.css` | Styles the affordance strip, trigger, disclosure panel, and close control; reserves the affordance's height in every full-viewport layout so it never overlays content; adds a reduced-motion rule for the trigger inside the existing single reduced-motion block, which remains last in the stylesheet. At `aacd6a2`, additionally sizes `.ss-auth` to the reserve with `overflow-y: auto` and moves the strip to `position: sticky; bottom: 0`, which is what makes the affordance visible on arrival at mobile widths. | FR-8 |
| `src/styles/tokens.css` | Adds `--help-affordance-space`, computed from the strip’s own parts including `max(var(--space-1), env(safe-area-inset-bottom))` so the reserve does not under-shoot on a device with a home indicator. | FR-8 |
| `tests/accessibility/persistent-help.test.tsx` | New 28-test regression suite covering presence in every session state, routing and emotion independence, the no-route negative case, keyboard reachability, accessible name and role, dismiss-and-recover, Escape, reduced motion, contrast tokens, no-storage/no-action/no-fetch, layout reserve, axe in both collapsed and expanded states, the full prohibited-content matrix, and a source pin on the two declarations that keep the strip inside the viewport. | FR-5, FR-8, NFR-4 |
| `docs/qa/TASK-09.md` | Structural QA: copy provenance, content-boundary matrix, completion-criteria-to-test mapping, contrast calculations, command record, judgment calls, manual gaps, gate boundary. | NFR-1–NFR-4, NFR-8 |
| `docs/handoffs/TASK-09.md` | This handoff. | NFR-1–NFR-4, NFR-8 |

`tests/accessibility/app-view.a11y.test.tsx` is in the TASK-09 write scope and was deliberately **not** modified. No TASK-08 assertion or axe check needed adjusting, so none was touched. No other file was modified; in particular no dependency, lockfile, configuration, contract, governance, server, router, safety-copy, or `UI Mockup/web-app-ui-design-brief/` path changed.

## The contract question, and how it resolved

The packet flagged an unsettled reading: contract revision 1 declares no version slot for general UI help copy but states that "UI owns calm, accessible presentation". The PM's recorded reading was that a minimal affordance introducing no new claim and no new resource sits inside that authority. The packet required escalation rather than self-resolution if the work needed a new claim, a new resource, a new versioned copy constant, or any change to `SAFETY_COPY_VERSION` or `SAFETY_POLICY_VERSION`.

**It resolved as no deviation, because none of those four triggers was reached.** The implementation was constrained so that the question never had to be decided:

- **No new claim.** The panel's two guidance sentences are the complete reviewed `violence_or_immediate_danger.responseText` from `server/safety.ts`, reproduced verbatim and split only across two paragraphs; nothing was rewritten, softened, shortened, or recombined. The dismiss control is `copy.common.close`. The PM granted two new strings, both neutral nouns that assert nothing: the trigger label `Help` (DECISION 1) and the bypass label `Skip to help`. `copy.safety.monitoring` was **removed** from the panel per DECISION 2, because shown unconditionally it reads as a general data-handling assurance that is not accurate; removal is a reduction, not a new claim.
- **No new resource.** No service, organisation, hotline, phone number, URL, region, or country appears. A content test asserts the affordance contains no digit at all, which is stricter than "no phone-number-like sequence".
- **No new versioned copy constant.** The two reproduced sentences are plain unversioned presentation literals in the component. No version string, no version slot, no registry entry.
- **`SAFETY_COPY_VERSION` and `SAFETY_POLICY_VERSION` unchanged.** `server/safety.ts` is byte-identical; `git diff` over `server/` is empty. The router, the category schema, the `safety_support` response and its metadata, and `camera-notice-v1` are untouched.

No contract deviation was raised by the implementation agent, and the one question it escalated — the trigger label — was answered by the PM in DECISION 1 (grant the neutral noun `Help`, drop the reuse of `copy.safety.title`, differentiate the icon) and DECISION 2 (remove `copy.safety.monitoring` from the panel). The remaining judgment calls are itemised under "Judgment calls a reviewer should examine" in `docs/qa/TASK-09.md`, and the most consequential is that two reviewed sentences from `server/safety.ts` now also exist as client literals. A drift guard reads `server/safety.ts` at test time and asserts the panel's two rendered paragraphs, joined by a single space, equal the `violence_or_immediate_danger` `responseText` verbatim, so editing either side alone fails the suite. State its limits plainly: it pins that one category's text only, it does not check the shared boundary sentence against the other three categories, and it cannot catch an edit made to both sides at once. A reviewer may still prefer a single shared source.

## Requirement coverage

| Requirement | Evidence and disposition |
|---|---|
| FR-5 | **Not remediated.** The router is unchanged and its 82.9% residual routing false-negative rate stands. What this task contributes is a detection-independent help path: an always-present affordance that renders when the router returns no route, carries reviewed location-neutral guidance, states plainly that Emotional Friend is not monitored and cannot provide emergency care, names no resource, and claims no monitoring, rescue, dispatch, diagnosis, treatment, clinical certainty, credential, consciousness, or confidentiality. A negative test proves it renders with no route present; a content test proves its text is identical whether or not a routed `safety_support` message exists. |
| FR-8 | The affordance is present in all five session states, keyboard reachable, exposed as landmark role `region` with the stable accessible name `Help`, operable without color, hover, motion, or camera, static under `prefers-reduced-motion`, and built from ≥3:1 boundary and ≥4.5:1 text tokens. It reserves its own layout height rather than overlaying content; only the user-opened, dismissible panel overlays. From `aacd6a2` it is also **visible on arrival** rather than below the fold, measured in Chrome at four viewports with zero occluded focusables; before that revision it was present and reachable but off-screen on arrival at every mobile width. Every TASK-08 assertion and axe check remains enabled and passing, with `tests/accessibility/app-view.a11y.test.tsx` unmodified. Manual WCAG and platform evidence, and every non-Chrome engine, remains pending. |
| NFR-1 | All work ran on the owner's local computer in the named worktree. No Codex, cloud, hosted agent, connector, network, provider, deployment, publication, push, or merge was used. |
| NFR-2 | Synthetic fixtures only. No real or private personal, health, emotional, conversation, account, camera, credential, or production data. |
| NFR-3 | No production action, credential operation, charge, deletion, publication, visibility change, or deployment. |
| NFR-4 | The packet sequence was run locally in packet order once per code-under-test revision — three revisions, three runs, no re-runs — with exit codes and counts recorded for each. The third run was made against the working tree holding the fix, which was then committed unchanged as `aacd6a2`; that difference is stated in the record rather than smoothed over. Pre-acceptance working-tree history, including two preserved failures, is recorded separately and not relabeled. No skip was added or converted. Automation is not substituted for manual or independent acceptance, and the agent does not self-accept. |
| NFR-8 | The change is limited to the six authorized paths. `UI Mockup/web-app-ui-design-brief/` was never read, modified, or staged. `git status --short` and `git diff --check` are clean on the code-under-test revision. A human gate is still required. |

## Below-the-fold defect and fix (`aacd6a2`)

**The defect.** `.ss-help-affordance` was `position: relative`, in normal flow,
as the last sibling after the session experience. The reserve is a `min-height`,
so it stopped a short screen collapsing onto the strip and did nothing when a
screen was taller than the viewport. Measured in headless Chrome on the
pre-sign-in screen, the strip's top was 856 against an 844 viewport at 390 × 844,
918 against 800 at 320 × 800, and 800 against 800 at 640 × 800. It was reachable
— by scrolling, and by the bypass link at tab stop 1 — but not visible on
arrival at any mobile width.

Worth stating plainly for the reviewer: **the whole automated suite passed on the
defective revision, and would have kept passing.** Every presence assertion was
true, because the element was in the DOM and jsdom performs no layout. Nothing in
this repository's test strategy could have caught this.

**The fix.** Two rules in `src/styles/app-view.css`. The strip becomes
`position: sticky; bottom: 0`, and `.ss-auth` is given
`height: calc(100dvh - var(--help-affordance-space))` with `overflow-y: auto`.

The second rule is the one that does the work, and sticky alone is not
sufficient. Measured with sticky and nothing else, the strip was visible at every
width but painted over `Privacy notice` and `Terms` at 390 and 640, and over
`Create an account` at 320 — each returning `section.ss-help-affordance` from
`document.elementFromPoint` at its own centre. That trades occlusion for
visibility, which is not acceptable for controls. Sizing the auth screen to the
reserve and giving it its own scrolling removes the trade entirely: content
scrolls inside the screen instead of pushing the page, so the strip sits in
normal flow beneath a box that cannot displace it and has nothing to overlay.

Sticky is kept deliberately, as a second line of defence for a real device where
`dvh` lags a collapsing browser toolbar and the page scrolls anyway. It is inert
in every configuration measured, so it was verified by simulation instead: with
the height override removed at runtime, sticky holds the strip at 788/744/744
and visible, while forcing it back to `relative` reproduces 856/918/800 exactly.

**Result.** Strip tops 788, 744, 744, 744 against viewports of 844, 800, 800,
800 — fully inside the viewport at all four sizes, with zero occluded focusables
on arrival and scrolled to the end, all 11 focusables painted and hit-testing to
themselves once focused, the disclosure panel opening fully inside the viewport,
and no horizontal overflow at 320 CSS px. Full numbers, method, and the two
measurement errors that had to be corrected along the way are in
`docs/qa/TASK-09.md`.

**Not applied to `.ss-expired` or `.ss-loading-screen`.** `.ss-expired` relies on
`overflow: hidden` to clip two decorative pseudo-elements; making it a
fixed-height scroller turned those into roughly 200px of empty scrollable space.
Both keep the `min-height` reserve, and sticky covers them if they ever overflow.

## Commands executed

The complete packet sequence, run exactly once in packet order on clean committed revision `0154b09e0cba42cbeae7cc37c1f56f7ba734b28d`:

```text
$ node --version                                                                    exit=0   v24.3.0
$ npm --version                                                                     exit=0   11.4.2
$ npm ci --offline                                                                  exit=0   511 added, 512 audited, 6s, 0 vulnerabilities, 2 deprecation warnings
$ npm run typecheck                                                                 exit=0   no diagnostics
$ npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts    exit=0   files 4/4, tests 50/50, failed 0, skipped 0, 1.20s
$ npm run test                                                                      exit=0   files 20 passed + 1 skipped, tests 161 passed + 7 skipped of 168, failed 0, 2.53s
$ npm run build                                                                     exit=0   1,909 modules, 9 artifacts, 498ms, 1 advisory block (2 chunks >500 kB)
$ git status --short                                                                exit=0   no output
$ git diff --check                                                                  exit=0   no output
```

After independent review returned FAIL and the PM issued DECISION 1, DECISION 2 and a reduced fix set, the code changed, so the sequence was run once more in full on the new clean committed code-under-test revision `319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49`. Both records stand; the second is an acceptance of a different revision, not a re-run of the first.

```text
$ node --version                                                                    exit=0   v24.3.0
$ npm --version                                                                     exit=0   11.4.2
$ npm ci --offline                                                                  exit=0   511 added, 512 audited, 5s, 0 vulnerabilities, 2 deprecation warnings
$ npm run typecheck                                                                 exit=0   no diagnostics
$ npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts    exit=0   files 4/4, tests 51/51, failed 0, skipped 0, 1.23s
$ npm run test                                                                      exit=0   files 20 passed + 1 skipped, tests 162 passed + 7 skipped of 169, failed 0, 2.50s
$ npm run build                                                                     exit=0   1,909 modules, 9 artifacts, 516ms, 1 advisory block (2 chunks >500 kB)
$ git status --short                                                                exit=0   no output
$ git diff --check                                                                  exit=0   no output
```

Development iteration for this second revision used `./node_modules/.bin/tsc` and `./node_modules/.bin/vitest` only; no `npx` invocation was made in this round, per the PM's standing boundary. One deliberate mutation was run and reverted: the panel boundary sentence was temporarily altered to confirm the new drift guard fails on drift. It did, and the source was restored before the acceptance sequence.

Real-browser measurement then found the below-the-fold defect, the owner decided it should be fixed, and the code changed again. The sequence was run once more in full. Unlike the two runs above it was executed against the **working tree** holding the fix, which is why command 8 reports two entries rather than none; that tree was committed unchanged as `aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0`, and the two files it lists are exactly the two files in that commit.

```text
$ node --version                                                                    exit=0   v24.3.0
$ npm --version                                                                     exit=0   11.4.2
$ npm ci --offline                                                                  exit=0   0 vulnerabilities, 84 funding notices (package counts not retained)
$ npm run typecheck                                                                 exit=0   no diagnostics
$ npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts    exit=0   files 4/4, tests 52/52, failed 0, skipped 0, 1.42s
$ npm run test                                                                      exit=0   files 20 passed + 1 skipped, tests 163 passed + 7 skipped of 170, failed 0, 2.62s
$ npm run build                                                                     exit=0   521ms, 1 advisory block (2 chunks >500 kB), CSS 48.21 kB (module count not retained)
$ git status --short                                                                exit=0   2 entries: src/styles/app-view.css, tests/accessibility/persistent-help.test.tsx
$ git diff --check                                                                  exit=0   no output
```

Development iteration for this third revision used `./node_modules/.bin/vite` only, to serve the app for the browser measurement. No `npx` invocation was made. Chrome was driven directly over the DevTools protocol from `/Applications/Google Chrome.app`; nothing was installed and no request left loopback.

### Preserved pre-acceptance history

The session was interrupted by a process exit during implementation, with nothing committed. **The packet acceptance sequence had not been run before the interruption.** Four commands whose text matches packet acceptance commands had, however, been invoked against the uncommitted, incomplete working tree as environment reconnaissance and a development install: `node --version` (exit 0), `npm --version` (exit 0), `npm run typecheck` (failed with `sh: tsc: command not found`, before `node_modules` existed), and `npm ci --offline` (exit 0). `git status --short` was invoked three times during diff review, re-orientation, and staging. These are preserved above and in `docs/qa/TASK-09.md` and are not folded into, or relabeled as, acceptance evidence.

`npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts`, `npm run test`, `npm run build`, and `git diff --check` were never invoked before the acceptance sequence. Development iteration deliberately used non-packet forms (`npx tsc -b --pretty false`, `npx vitest run …`, `npx vite build`) so the packet forms stayed unused until the single acceptance run. One of those iterations exited 1 with 25 of 26 tests passing, caused by a test-only CSS-block marker that matched a pre-existing rule; the marker was made unique and the file then passed 26 of 26. That failure is preserved, not erased.

This is an implementation-agent judgment the PM may overrule: the earlier invocations were treated as pre-acceptance history rather than as the packet's single acceptance run, on the grounds that they were not the sequence, were not in packet order, were not complete, included a failure, and ran against an uncommitted and unfinished tree.

## Finding-to-test mapping

The full completion-criteria-to-test table is in `docs/qa/TASK-09.md`. In summary, `tests/accessibility/persistent-help.test.tsx` contributes 28 tests across four groups (the per-group breakdown below was written against the 26-test revision and the PM explicitly deferred recounting it; the two tests added since are the copy drift guard, in the content group, and the viewport declaration pin, in the presentation-tokens group):

- **Presence (8 tests)** — one per session state (`initializing`, `anonymous`, `registered`, `guest`, `guest-expired`), a guard that fails if a state is dropped from the table, invariance across failed reply / empty chat / camera on / camera denied, the no-route negative case, coexistence with a routed safety card without collision, and structural placement outside `.ss-app` with the TASK-08 bypass still first.
- **Operability (6 tests)** — accessible name, role, `aria-expanded`/`aria-controls`/`hidden` disclosure state, keyboard reach, dismiss-and-recover, Escape with focus return, axe while expanded, no action/storage/fetch side effect, and operability plus CSS override order under reduced motion.
- **Presentation tokens (4 tests)** — layout reserve, computed contrast ratios with the tokens actually consumed, no dependence on color, hover, or motion, and a pin on the `.ss-auth` height plus `overflow-y` and the strip's `position: sticky` and `bottom: 0`. That last one is a **source pin, not a layout proof**: jsdom performs no layout, so it cannot observe where the strip renders, and it earns its place only by failing if a declaration the browser measurement showed to be load-bearing is deleted. The property itself is evidenced only by the measurements in `docs/qa/TASK-09.md`.
- **Content boundaries (6 tests)** — positive assertion of the three reviewed sentences, then absence of digits, URLs, emails, named services, regional tokens, monitoring/rescue/dispatch claims, diagnosis/treatment/clinical-certainty/credential claims, consciousness and confidentiality claims, and any detection or inference implication; plus byte-identical content with and without a routed safety response.

## Contract deviations

None.

## Known issues and residual risk

- **FR-5 is not remediated.** The router is untouched and its 82.9% residual routing false-negative rate, 68.4% on the plainest direct phrasing and 93% on `severe_medical_danger`, stands. A user who is not routed must notice and choose to open the affordance; this task cannot show that they will.
- **The affordance is a per-render UI state only.** It resets on reload by design, because opening it is deliberately not recorded. There is therefore no evidence about repeat discoverability across sessions.
- **The layout reserve was not sufficient on its own, and that is why `aacd6a2` exists.** Being a `min-height`, it only stopped a short screen collapsing onto the strip and did nothing when a screen was taller than the viewport. Rendered behaviour is now measured in Chrome at 320 × 800, 390 × 844, 640 × 800 and 1280 × 800; behaviour on a device with a real non-zero home-indicator inset is still substituted arithmetically rather than observed, and 200% zoom is covered only by the 640 × 800 proxy.
- **The fix makes the auth screen its own scroll container.** A page that scrolls its own body lets a mobile browser collapse its toolbar; an inner scroll container generally does not. That behavioural difference is real on a physical device, headless Chrome cannot show it, and it was not measured.
- **The signed-in screens were never measured in a browser.** Reaching them needs credentials this session must not use. `.ss-app` already had `height: calc(100dvh - var(--help-affordance-space))` with `overflow: hidden` and was not modified by the fix, so the composer, send control and guest banner overlap question is unchanged — and still unanswered.
- **The affordance is inert while a modal dialog is open** — every such dialog traps focus and sets `aria-modal="true"`, so the trigger is neither keyboard-reachable nor exposed to assistive technology until the dialog is dismissed; no test exercises any modal state.

## Residual manual gaps

Pending, inherited from TASK-08 and extended to this new surface: VoiceOver/Safari and NVDA/Firefox-or-Chrome announcement behaviour for the new landmark and disclosure; iOS VoiceOver and Android TalkBack, touch, software keyboard and safe-area behaviour; latest-two-major browser keyboard coverage — Safari and Firefox matter most here, because `dvh`, `position: sticky` and `env(safe-area-inset-bottom)` are exactly where they diverge from Chrome; increased text spacing and reflow; manual `prefers-reduced-motion`, forced-colors and visible/unobscured focus review; rendered-contrast measurement as opposed to token-level calculation; and real-browser confirmation that the strip does not overlay the composer, send control or guest banner in the signed-in states. Exact 320 CSS px, exact 390 × 844 and a 200% zoom proxy are now measured in Chrome and no longer pending; the auth actions specifically are confirmed unoccluded. Physical-camera lifecycle remains untested and is expressly forbidden for this task.

## Integration notes

- Base `e79a0e74f87aa5a1906520a5ab3e192890b7e543`; branch `ai/TASK-09-persistent-help-affordance`; not merged, not pushed.
- The affordance adds no props to `AppViewViewProps` or `AppViewActionProps`, so `src/App.tsx` needs no change and none was made. It deliberately does not call `onEmergencyHelp`, which currently raises a `window.alert`.
- Two singular accessibility queries in `tests/accessibility/app-view.a11y.test.tsx` constrained the design and are documented in `docs/qa/TASK-09.md`: the affordance uses landmark role `region`, not `complementary`, and exposes no control named `Contact local emergency services`, so the routed safety card remains uniquely addressable.
- Reviewers should note the reduced-motion block must remain the last block in `src/styles/app-view.css`; a test asserts the affordance rule precedes it so the override order cannot silently invert.

## Recommended next action

A fresh independent reviewer with no prior context should inspect the exact final SHA, with particular attention to the six judgment calls in `docs/qa/TASK-09.md`, the copy-provenance table, the content-boundary matrix, and the layout fix at `aacd6a2` — specifically whether making the auth screen its own scroll container is acceptable on physical mobile, which was not measured. TASK-09 approves nothing: D-5, RG-05, Gate C, release, publication, and deployment remain unapproved, and this handoff is not implementation-agent self-acceptance.

## Open governance item H-3 — PM disposition, 2026-08-29 (owner-delegated)

**Behaviour is unchanged and this is recorded as open, not resolved.**

The finding. `requirements.md:203` assigns acceptance of safety *wording* and
coverage to an independently reviewed policy/evaluation. The two sentences this
affordance displays are verbatim reviewed wording, but that review covered them
only as the response to a routed `violence_or_immediate_danger` classification.
This affordance shows them unconditionally, in states the review never
considered, including before sign-in.

Why nothing was changed. The wording introduces no new claim and no new
resource, adds no versioned copy constant, and touches neither
`SAFETY_COPY_VERSION` nor `SAFETY_POLICY_VERSION`. Removing it now would
withdraw the only detection-independent help surface and leave the false
negatives recorded in `docs/handoffs/TASK-06.md` unmitigated, which is a
regression in safety, not a return to a safe baseline. The proportionate remedy
is re-review of the wording for the unconditional context, not withdrawal of
the surface.

What is required next, and by whom. The next independent safety review must
rule on whether the reviewed wording remains acceptable when shown
unconditionally and pre-sign-in. Until it does, TASK-09 must not be described
as having independently reviewed copy for this context, and D-5, RG-05 and
Gate C remain unapproved. If that review rules against unconditional display,
the remedy is new independently reviewed wording under a version bump per
`requirements.md:209`, not silent editing of the strings in place.

Project: 01M0Z716GT7DXBMSXNVNHTSFT2 / Task: TASK-09 / Requirements: FR-9,NFR-6,S-3

### H-3 independent safety review — verdict ACCEPTABLE, 2026-08-29

A fresh independent reviewer with no prior involvement, read-only, ruled on the
single question of whether the reviewed wording may be displayed unconditionally
and pre-sign-in. Verdict: **ACCEPTABLE**, no `SAFETY_COPY_VERSION` bump required.
The reviewer's ground: the change is of venue, not of copy — no string changed,
no resource was added, and no edit was required.

Reasoning recorded because the acceptance depends on it. Sentence one is
conditionally framed, so its truth conditions never depended on the router
firing; unconditional display only re-anchors "now" from what the user just
wrote to the moment the user chose to open the panel, which is the correct
anchor for a self-service surface. Sentence two is a statement about the
product, not the user, so it is context-independent by construction. On the
monitoring axis unconditional display is *safer* than the routed context: a
surface appearing only sometimes invites "why did this appear now?", while one
always present, identical in every state, and collapsed until clicked cannot
carry that inference. Habituation largely dissolves because the wording is not
permanently on screen — only the neutral `Help` chip is; the sentences render
only on a deliberate open. The boundary sentence never stands alone: it is
always paragraph two of two, bound to the reviewed `responseText` by the drift
guard.

**Acceptance lapses and re-review is required if any of these change:** the
panel auto-opens or expands from any signal; the sentences render outside the
collapsed panel; the panel's content becomes conditional on session state,
message content, or an expression estimate; or any resource, contact, region
selector, or action is added to it.

**H-3 stays open as a documentation item even though the behaviour is accepted.**
The safety copy/evaluation record must be updated to state that
`violence_or_immediate_danger.responseText` is now reviewed for two contexts —
the routed reply, and unconditional user-initiated persistent disclosure
including pre-sign-in — so that the next `SAFETY_COPY_VERSION` bump re-evaluates
both. That record lives outside this repository and was not updated here.

**Coupling to record:** the drift guard makes that `responseText` load-bearing
for two surfaces. Any future edit must be evaluated against both. A rewording
that is fine as a response to a disclosure — anything second-person about what
the user wrote — could be false or strange shown to a visitor who has written
nothing.

**Two non-blocking coverage notes from the reviewer.** SAFE-010 asks for a
persistent path to support resources; the panel gives guidance but names no
resource and offers no region selector, so SAFE-010 is only partially met, and
closing that gap means new resource content requiring independent review and
version treatment. Separately, the generic label `Help` may be read as product
support, so someone opening it for FAQ-type help meets crisis guidance; the
content corrects that expectation immediately and the boundary sentence denies
staffing, so it is not a safety defect, but it is flagged for the label owner.
