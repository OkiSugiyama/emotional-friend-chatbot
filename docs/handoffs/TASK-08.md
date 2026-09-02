---
schema_version: 1
agent: codex
task_id: TASK-08
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
result: pass
result_scope: automated-implementation-pass-only
base_revision: fe79e5d7d20048db5725a673011a54f32f61decd
head_revision: HEAD
code_under_test_revision: 3a88836006096d9d9d1c1dc123c700004d8d153c
failed_review_revision: cb8d89997a0f970a34de98b481d5b9a8e04d8ec4
branch: ai/TASK-08-accessibility-remediation
worktree: /Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot-TASK-08
contract_revision: "1"
contract_sha256: 766e98ff9f761bb3432f567dff279c500b33d41aa01cfa162427022afcc53b57
completed_at: "2026-08-28T16:46:40Z"
requirements:
  - FR-2
  - FR-3
  - FR-8
  - FR-9
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
changed_files:
  - src/components/AppView.tsx
  - src/styles/app-view.css
  - src/styles/tokens.css
  - tests/accessibility/app-view.a11y.test.tsx
  - docs/qa/TASK-08.md
  - docs/handoffs/TASK-08.md
finding_counts:
  code_level_remediated: 5
  r4_pass_with_low_findings: 6
  r4_low_fixed: 5
  r4_low_evidence_non_action: 1
  r5_pass_with_low_findings: 7
  r5_low_fixed: 5
  r5_low_evidence_non_action: 2
  pending_independent_disposition: 7
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
    result: "added=511 audited=512 duration_seconds=5 funding=84 vulnerabilities=0 deprecation_warnings=2"
  - order: 4
    command: npm run typecheck
    exit_code: 0
    result: "TypeScript build completed with no diagnostics"
  - order: 5
    command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
    authority: implementation_agent
    verified_revision: 3a88836006096d9d9d1c1dc123c700004d8d153c
    exit_code: 0
    result: "test_files_passed=3 test_files_failed=0 test_files_total=3 tests_passed=24 tests_failed=0 tests_skipped=0 tests_total=24 duration_seconds=1.32"
  - order: 6
    command: npm run test
    exit_code: 0
    result: "test_files_passed=19 test_files_skipped=1 test_files_total=20 tests_passed=135 tests_failed=0 tests_skipped=7 tests_total=142 duration_seconds=2.53"
  - order: 7
    command: npm run build
    exit_code: 0
    result: "modules_transformed=1909 emitted_artifact_entries=9 duration_ms=516 advisory_warning_blocks=1 oversized_javascript_chunks=2"
  - order: 8
    command: git status --short
    exit_code: 0
    result: "entries=0; clean code-under-test revision"
  - order: 9
    command: git diff --check
    exit_code: 0
    result: "no output; clean code-under-test revision"
prior_working_tree_attempts:
  - related_order: 5
    authority: implementation_agent
    revision_state: uncommitted_working_tree
    command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
    exit_code: 1
    result: "test_files_passed=2 test_files_failed=1 test_files_total=3 tests_passed=17 tests_failed=1 tests_skipped=0 tests_total=18 duration_seconds=1.25"
    selector_defect: "The new edit-textarea assertion at tests/accessibility/app-view.a11y.test.tsx:375 expected the exact accessible name Message; the actual accessible name correctly included its existing help and character-count text. The query was corrected before the full-suite command."
    preserved_not_relabeled_or_erased: true
failed_independent_review:
  reviewed_revision: cb8d89997a0f970a34de98b481d5b9a8e04d8ec4
  result: fail
  findings:
    - "FIND-003 HIGH: pending/retry presentation order inverted"
    - "FIND-005 HIGH: switch track contrast 1.53:1"
    - "FIND-002 MED: guest-expiry status not announced"
    - "EVID MED: evidence revision did not identify the reviewed final SHA"
    - "FIND-005b LOW: return-to-latest boundary contrast 1.67:1"
    - "FIND-003b LOW: legacy edit association lost"
    - "TEST LOW: reduced-motion assertion checked CSS text only"
  preserved_as_failed_review: true
fresh_review_r3:
  reviewed_head_revision: ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa
  reviewed_code_revision: dac3484fe68063cc33ea581ca8bfaed9f6619489
  result: fail
  counts:
    critical: 0
    high: 1
    medium: 1
    low: 6
  findings:
    - "H-1 HIGH: completed replies reverted to reversed source order before their user message"
    - "M-1 MED: status-chip and warning-variant boundaries were below 3:1 or transparent"
    - "L-1 LOW: expiry status aria-label could duplicate the title and drop the body"
    - "L-2 LOW: programmatically focused conversation and expiry targets lacked a :focus fallback"
    - "L-3 LOW: deleted request owners lost failed-reply edit association"
    - "L-4 LOW: distant reused request IDs could hoist a failed alert away from the composer"
    - "L-5 LOW: reduced-motion completion test unmounted instead of exercising the same tree"
    - "L-6 LOW: handoff head revision used a HEAD placeholder and result scope needed qualification"
  preserved_as_failed_review: true
fresh_review_r4:
  reviewed_head_revision: c77de9af9e891a988ab8e4ef245c5865be4ad0d1
  reviewed_code_revision: 7e8ebc20b00a047464f366a7795f0fd57256d76c
  result: pass
  qualification: pass_with_lows
  counts:
    critical: 0
    high: 0
    medium: 0
    low: 6
  commands: "reviewer reported all commands passed"
  findings:
    - "L1 LOW: conversation focus ring could be covered or clipped"
    - "L2 LOW: narrow :focus fallback versus :focus-visible parity required explicit rationale"
    - "L3 LOW: camera-state chip boundaries were 1.29:1 or transparent"
    - "L4 LOW: Edit could remain exposed for a deleted failed-reply owner"
    - "L5 LOW: reply-progress role=status aria-label could mask or duplicate its body"
    - "L6 LOW: reduced-motion/status transition coverage was reported as cold-mount"
  preserved_as_pass_with_lows: true
  covers_later_follow_up: false
fresh_review_r5:
  reviewed_head_revision: 87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01
  reviewed_code_revision: e79a030daa2270979d0f2451387e3ec23e153909
  result: pass
  qualification: pass_with_lows
  counts:
    critical: 0
    high: 0
    medium: 0
    low: 7
  allowlist_certified: true
  reviewer_writes: 0
  reported_command_results:
    - "node --version: pass"
    - "npm --version: pass"
    - "npm run typecheck: pass"
    - "scoped accessibility/session tests: pass; tests_passed=23"
    - "full tests: pass; tests_passed=134 tests_skipped=7"
    - "git diff --check: pass"
  procedural_deviation:
    command: npx vitest --reporter=verbose
    authorization: unrequested
    environment: local_no_network
    purpose: inspect_skips
    normalized_into_packet_acceptance: false
  findings:
    - "L1 LOW: bare :focus remains on the programmatically focused conversation target"
    - "L2 LOW: duplicate Writing a reply polite live-region sources"
    - "L3 LOW: expiry heading focus and status repeat the title"
    - "L4 LOW: failed alert aria-label plus atomic visible body may mask or duplicate content"
    - "L5 LOW: 1.6-second indeterminate reply-progress motion loops indefinitely"
    - "L6 LOW: conversation isolation creates a stacking context"
    - "L7 LOW: accessibility test uses a class query and an EOF media-query slice"
  preserved_as_pass_with_lows: true
  covers_later_follow_up: false
prior_code_under_test_acceptance:
  revision: 7e8ebc20b00a047464f366a7795f0fd57256d76c
  command_results:
    - "1 node --version: exit=0 version=v24.3.0"
    - "2 npm --version: exit=0 version=11.4.2"
    - "3 npm ci --offline: exit=0 added=511 audited=512 duration_seconds=5 funding=84 vulnerabilities=0 deprecation_warnings=2"
    - "4 npm run typecheck: exit=0 diagnostics=0"
    - "5 focused test: exit=0 files=3/3 tests=23/23 failed=0 skipped=0 duration_seconds=1.28"
    - "6 full test: exit=0 files_passed=19 files_skipped=1 tests_passed=134 tests_failed=0 tests_skipped=7 duration_seconds=2.39"
    - "7 build: exit=0 modules=1909 artifacts=9 duration_ms=541 advisory_warning_blocks=1 oversized_javascript_chunks=2"
    - "8 git status --short: exit=0 entries=0"
    - "9 git diff --check: exit=0 output=none"
  preserved_not_replaced: true
prior_r4_follow_up_acceptance:
  revision: e79a030daa2270979d0f2451387e3ec23e153909
  command_results:
    - "1 node --version: exit=0 version=v24.3.0"
    - "2 npm --version: exit=0 version=11.4.2"
    - "3 npm ci --offline: exit=0 added=511 audited=512 duration_seconds=5 funding=84 vulnerabilities=0 deprecation_warnings=2"
    - "4 npm run typecheck: exit=0 diagnostics=0"
    - "5 focused test: exit=0 files=3/3 tests=23/23 failed=0 skipped=0 duration_seconds=1.56"
    - "6 full test: exit=0 files_passed=19 files_skipped=1 tests_passed=134 tests_failed=0 tests_skipped=7 duration_seconds=3.17"
    - "7 build: exit=0 modules=1909 artifacts=9 duration_ms=556 advisory_warning_blocks=1 oversized_javascript_chunks=2"
    - "8 git status --short: exit=0 entries=0"
    - "9 git diff --check: exit=0 output=none"
  preserved_not_replaced: true
follow_up_attempt_history:
  - code_under_test_revision: c4e4c46932c4c0b7382690b769bf06481ff76dfe
    command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
    exit_code: 1
    result: "test_files_passed=2 test_files_failed=1 test_files_total=3 tests_passed=19 tests_failed=1 tests_skipped=0 tests_total=20 duration_seconds=1.47"
    failure: "Reduced-motion test rerender reached MessageLog scrolling and JSDOM threw TypeError: element.scrollTo is not a function at src/components/AppView.tsx:1275 before the assertion completed."
    disposition: "Test-only transition was isolated without changing application behavior; the failed revision and result remain preserved."
  - code_under_test_revision: 0e8709c39c7987d1c824fe1e752873fb77dbff5a
    commands_completed: 5
    stopped_after_order: 5
    command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
    exit_code: 1
    result: "test_files_passed=2 test_files_failed=1 test_files_total=3 tests_passed=17 tests_failed=7 tests_skipped=0 tests_total=24 duration_seconds=1.34"
    failure: "The new semantic failed-alert helper assumed the visible strong text was Reply failed, but the preserved product copy differs; seven tests sharing that helper failed before their assertions."
    disposition: "A separate test-only commit identifies the failed alert by its stable Retry control without changing application behavior or visible copy. Commands 6 through 9 were not run on this failed revision."
pm_supplemental_final_revision_verification:
  authority: PM
  verified_revision: d7edf8f888e156a60a859c00827cc6dac1467b29
  command: npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
  first_attempt:
    result: "failed before test collection with EPERM writing node_modules/.vite-temp under the managed sandbox"
  approved_local_worktree_rerun:
    exit_code: 0
    result: "test_files_passed=3 test_files_total=3 tests_passed=18 tests_failed=0 tests_skipped=0 tests_total=18 duration_seconds=1.26"
  preserves_original_command_record: true
  replaces_manual_or_independent_review: false
test_failures:
  - "Primary code-under-test targeted oracle on 3a88836006096d9d9d1c1dc123c700004d8d153c: 0 failed."
  - "Historical failures preserved: the original uncommitted working-tree selector attempt failed 1 of 18, the c4e4c46932c4c0b7382690b769bf06481ff76dfe JSDOM test-harness attempt failed 1 of 20, and the 0e8709c39c7987d1c824fe1e752873fb77dbff5a failed-alert selector attempt failed 7 of 24."
test_skips:
  - "Primary code-under-test targeted oracle: 0 skipped."
  - "Primary code-under-test full suite: 1 file and 7 tests skipped; no skip is relabeled as passing evidence."
contract_deviations: []
out_of_scope:
  - "The reviewer-noted pre-existing src/App.tsx retry issue is outside TASK-08 write scope; it was not changed, waived, or claimed resolved."
synthetic_only: true
physical_camera_used: false
gui_or_manual_platform_claimed: false
external_connectors_used: false
provider_calls_used: false
production_accessed: false
deployed: false
published: false
pushed: false
billing_used: false
human_gate_required: true
---

# TASK-08 handoff

## Summary

TASK-08 implements the five presentation-layer remediations assigned by `docs/tasks/TASK-08-accessibility-remediation.md` on authoritative base `fe79e5d7d20048db5725a673011a54f32f61decd`. Earlier review of `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4` failed and remains preserved. Strict-allowlist fresh review r3 of head `ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa` / code `dac3484fe68063cc33ea581ca8bfaed9f6619489` also failed with 0 critical, 1 high, 1 medium, and 6 low findings; that verdict remains `FAIL`. Fresh review r4 of evidence head `c77de9af9e891a988ab8e4ef245c5865be4ad0d1` / code `7e8ebc20b00a047464f366a7795f0fd57256d76c` remains `PASS` with 0 critical, 0 high, 0 medium, and 6 low follow-up findings. Fresh review r5 of evidence head `87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01` / code `e79a030daa2270979d0f2451387e3ec23e153909` remains `PASS` with 0 critical, 0 high, 0 medium, and 7 low findings; the allowlist was certified and reviewer writes were 0. The authorized r5 polish and its test-selector correction were committed before the final complete acceptance sequence, and `code_under_test_revision` identifies exact tested code SHA `3a88836006096d9d9d1c1dc123c700004d8d153c`. `head_revision: HEAD` remains the canonical gate-compatible symbolic value resolved against the checked-out evidence commit; it is intentionally distinct from the code-under-test SHA because an evidence commit cannot embed its own future SHA.

The machine-readable current result is `pass` because the recorded acceptance suite passed on the exact code-under-test SHA. This result is limited to automated implementation evidence and is not implementation-agent self-acceptance. The r4 and r5 verdicts apply only to their exact reviewed evidence/code pairs; the later r5 polish has not received independent review in this task.

This handoff does not approve D-5, RG-05, Gate C, release, publication, deployment, or any manual/platform claim. TASK-05 sibling evidence remained read-only and was neither modified nor merged.

## Changed files

| Path | Purpose | Requirements / findings |
|---|---|---|
| `src/components/AppView.tsx` | Adds the early bypass and target; persistent unlabeled body-only expiry status/focus; adjacency-capped request pairing for pending/failed/complete states including deleted owners and legacy no-ID edit association; one neutral atomic reply-progress announcement source; unlabeled atomic failed-alert content; suppresses Edit when a failed reply's owner is deleted. | FR-2, FR-3, FR-8; FIND-001–FIND-004, FIND-003b; r3 H-1, L-1, L-3, L-4; r4 L4, L5; r5 L2–L4 |
| `src/styles/app-view.css` | Styles the focus-revealed bypass, above-content programmatic conversation focus, finite 4.8-second neutral progress with a static final state, static reduced-motion behavior, documented narrow programmatic-focus/stacking rationale, and remediated input, status-chip, camera-state chip, switch-track, return-control, and other meaningful control boundaries. | FR-8; FIND-001, FIND-004, FIND-005, FIND-005b; r3 M-1, L-2; r4 L1–L3; r5 L1, L5, L6 |
| `src/styles/tokens.css` | Adds `--color-control-border: #9585a2`. | FR-8; FIND-005 |
| `tests/accessibility/app-view.a11y.test.tsx` | Adds positive, negative, focus, request-paired pending→failed/complete ordering, deleted/legacy association, distance-capped interleaving, same-identity mounted status transitions, single-source/body-only/unlabeled alert semantics, finite/default and static/reduced motion, camera-state token contrast, semantic selectors, bounded CSS-block parsing, and focus-overlay regressions while retaining axe assertions. | FR-2, FR-3, FR-8, NFR-4; FIND-001–FIND-005; all r3/r4 and r5 implementation/test findings |
| `docs/qa/TASK-08.md` | Records structural QA, command outcomes, mappings, calculations, limitations, and gate boundary. | FR-9, NFR-1–NFR-4, NFR-8 |
| `docs/handoffs/TASK-08.md` | Provides this formal and machine-readable handoff. | FR-9, NFR-1–NFR-4, NFR-8 |

No other file was intentionally modified. In particular, no dependency, lockfile, config, contract, governance, TASK-05, or `UI Mockup/web-app-ui-design-brief/` path changed.

## Requirement coverage

| Requirement | Evidence and disposition |
|---|---|
| FR-2 | Guest expiry focuses the visible explanation and mutates a persistent, unlabeled live status containing the existing data-removal/camera-off body without repeating the focused title. Existing session-lifecycle cleanup tests remain enabled. Manual expiry announcement behavior is pending. |
| FR-3 | Adjacent pending, failed, and completed assistant states are paired by the existing `clientRequestId` and remain after their user message across state transitions. Pairing includes deleted request owners, is capped to adjacent source entries so distant reused IDs remain anchored, retains the no-ID legacy edit association, and does not bind nonempty unmatched failures. A deleted owner remains adjacent but cannot expose Edit. Domain, idempotency, storage, and API behavior are unchanged. |
| FR-8 | The app shell starts with a main-conversation bypass; programmatic conversation/expiry focus has an explicit visible fallback, with the conversation ring layered above in-scope content; pending reply presentation is neutral, has one atomic status source, animates for at most 4.8 seconds to a static end, and renders an immediately static branch for reduced motion; failed alerts expose visible content without an overriding label; meaningful input, composer, secondary-button, region, status-chip, camera-state chip, switch-track, and return-control boundaries use the at-least-3:1 token against relevant adjacent surfaces. Manual WCAG/platform evidence remains pending. |
| FR-9 | Exact local commands, synthetic-only boundaries, result limitations, finding mappings, and the human-gate boundary are recorded without a release claim. |
| NFR-1 | Work ran only in the named local worktree; no cloud, hosted execution, connector, network/provider, deployment, publication, or push was used. |
| NFR-2 | Only synthetic test fixtures were used; no real/private personal, health, emotional, conversation, camera, account, production, or credential data was accessed. |
| NFR-3 | No production action, credential operation, charge, deletion, publication, visibility change, or deployment occurred. |
| NFR-4 | Existing axe and session-lifecycle assertions remain enabled. Exact failed/skipped counts are recorded; automation is not substituted for manual or independent acceptance. |
| NFR-8 | The implementation is limited to the six authorized paths listed above. The owner-owned UI Mockup path remained outside all operations. Human acceptance is still required. |

## Commands executed

The primary command record below is the complete packet sequence run exactly once, in packet order, on committed code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c`. The earlier implementation working-tree selector failure, PM sandbox/retry history, failed reviews, r4/r5 `PASS`-with-lows records, prior passing acceptance revisions, and incomplete `c4e4c469…` and `0e8709c…` attempts remain separate history; none is relabeled or erased.

```text
$ node --version
exit=0
```

Recorded output: `v24.3.0`.

```text
$ npm --version
exit=0
```

Recorded output: `11.4.2`.

```text
$ npm ci --offline
exit=0
```

Recorded result: 511 packages added and 512 audited in 5 seconds; 84 packages seeking funding; 0 vulnerabilities; 2 deprecation warnings, for `node-domexception@1.0.0` and `glob@10.5.0`.

```text
$ npm run typecheck
exit=0
```

Recorded result: TypeScript build completed with no diagnostics.

```text
$ npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
exit=0
```

Recorded on `3a88836006096d9d9d1c1dc123c700004d8d153c`: 3 of 3 test files passed; 24 of 24 tests passed; 0 failed; 0 skipped; duration 1.32 seconds. This focused run includes single-source reply progress, body-only expiry status, unlabeled atomic failure content with retry/edit, finite normal motion, static reduced motion, stable semantic selectors, bounded media-block parsing, session-lifecycle tests, and retained accessibility/axe assertions.

```text
$ npm run test
exit=0
```

Recorded result: 19 test files passed and 1 skipped out of 20; 135 tests passed and 7 skipped out of 142; 0 failed; duration 2.53 seconds.

```text
$ npm run build
exit=0
```

Recorded result: 1,909 modules transformed; 9 emitted artifact entries listed; build completed in 516 milliseconds. One advisory warning block identified 2 JavaScript chunks over 500 kB: `916.45 kB` and `1,314.50 kB` before gzip.

```text
$ git status --short
exit=0
```

Recorded output: none. The committed code-under-test revision was clean.

```text
$ git diff --check
exit=0
```

Recorded output: none. The committed code-under-test revision was clean.

### Preserved prior test and review history

The preceding acceptance sequence on `7e8ebc20b00a047464f366a7795f0fd57256d76c` also ran all nine packet commands exactly once in order. It recorded Node `v24.3.0`; npm `11.4.2`; offline install exit 0 with 511 packages added, 512 audited in 5 seconds, 84 funding notices, 0 vulnerabilities, and 2 deprecation warnings; typecheck exit 0; focused tests exit 0 with 3 of 3 files and 23 of 23 tests passed, 0 failed/skipped, in 1.28 seconds; full tests exit 0 with 19 files passed, 1 file skipped, 134 tests passed, 7 tests skipped, 0 failed, in 2.39 seconds; build exit 0 with 1,909 modules, 9 listed artifacts, 541 milliseconds, and one advisory block for two chunks (`916.61 kB`, `1,314.50 kB`); and clean/no-output status and diff checks. This passing history is preserved rather than overwritten by the later primary record.

The later acceptance sequence on `e79a030daa2270979d0f2451387e3ec23e153909` likewise ran all nine commands once in order. It recorded the same Node/npm versions; offline install exit 0 with 511 packages added, 512 audited in 5 seconds, 84 funding notices, 0 vulnerabilities, and 2 deprecation warnings; typecheck exit 0; focused tests exit 0 with 3 of 3 files and 23 of 23 tests passed, 0 failed/skipped, in 1.56 seconds; full tests exit 0 with 19 files passed, 1 file skipped, 134 tests passed, 7 tests skipped, 0 failed, in 3.17 seconds; build exit 0 with 1,909 modules, 9 listed artifacts, 556 milliseconds, and one advisory block for two chunks (`916.63 kB`, `1,314.50 kB`); and clean/no-output status and diff checks. It remains the code reviewed by r5 and is not overwritten by the later polish record.

Fresh review r4 reviewed evidence head `c77de9af9e891a988ab8e4ef245c5865be4ad0d1` and code `7e8ebc20b00a047464f366a7795f0fd57256d76c`. It remains `PASS` with 0 critical, 0 high, 0 medium, and 6 low findings, and the reviewer reported all commands passed. L1 concerned conversation focus visibility; L2 the narrow programmatic `:focus` rationale; L3 camera-state chip boundaries; L4 deleted-owner Edit exposure; L5 the reply-status label; and L6 same-mounted reduced-motion/status lifecycle coverage. The verdict is not relabeled or erased, and it is not claimed to cover the later `e79a030…` follow-up.

Fresh review r5 reviewed evidence head `87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01` and code `e79a030daa2270979d0f2451387e3ec23e153909`. It remains `PASS` with 0 critical, 0 high, 0 medium, and 7 low findings. The reviewer certified the allowlist, made no writes, and reported passing Node/npm version checks, typecheck, 23 scoped tests, 134 full-suite passes with 7 skips, and `git diff --check`. The reviewer additionally ran unrequested local/no-network `npx vitest --reporter=verbose` to inspect skips; that procedural deviation is preserved, not normalized into packet acceptance, and does not convert skips to passes. D-5, RG-05, Gate C, and manual/platform criteria remain unapproved.

The r5-low dispositions on later code revision `3a88836006096d9d9d1c1dc123c700004d8d153c` are:

| r5 finding | Disposition | Evidence / rationale |
|---|---|---|
| L1 | Evidence-based non-action. | Preserve the narrow `.ss-conversation:focus` fallback because bypass activation programmatically focuses a `tabIndex=-1` main. Direct mouse focus can also show the ring; this narrow tradeoff is documented rather than regressing visible programmatic focus. |
| L2 | Fixed. | Hidden live regions no longer repeat reply-writing text; the visible neutral ReplyIndicator is the sole polite status source, with same-mounted pending→complete coverage. |
| L3 | Fixed. | The persistent expiry status contains only the existing privacy-significant body, while focus supplies the title and next-action context. Tests assert stable `data-session-status`, exact body, no title, and no label. |
| L4 | Fixed. | The failed atomic alert no longer has a redundant label; visible strong/body content and Retry/Edit remain exposed. Its test helper selects the alert through the semantic Retry control rather than product-copy or class coupling. |
| L5 | Fixed. | The 1.6-second animation runs three times (4.8 seconds), ends static, rejects `infinite`, and retains an immediately static reduced-motion branch and CSS safeguard. |
| L6 | Evidence-based non-action. | `isolation: isolate` intentionally contains the inset focus overlay; no reachable descendant depends on escaping that stacking context. The narrow rationale is documented in CSS and asserted. |
| L7 | Fixed/test hygiene. | Status lookup uses visible text plus role, failed-alert lookup uses Retry, and a balanced CSS-block parser bounds reduced-motion assertions instead of slicing to EOF; axe assertions remain enabled. |

These five fixes and two evidence-based non-actions do not relabel r5, which applies only to `87d7e449…` / `e79a030…`, and they are not an independent pass claim for the later code revision.

The first r5 polish acceptance attempt used code revision `0e8709c39c7987d1c824fe1e752873fb77dbff5a`. Commands 1–4 passed: Node `v24.3.0`, npm `11.4.2`, offline install with 511 packages added and 512 audited in 6 seconds, 84 funding notices, 0 vulnerabilities, and 2 deprecation warnings, and typecheck with no diagnostics. Focused command 5 exited 1: 2 of 3 files passed and 1 failed; 17 of 24 tests passed and 7 failed; 0 skipped; duration 1.34 seconds. The new failed-alert helper assumed literal visible text `Reply failed`, while preserved product copy differs. A separate test-only commit selected the alert by its stable Retry control; commands 6–9 were not run on the failed revision. This stopped attempt is not relabeled or erased.

Before final-code-revision verification, the implementation agent ran `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` against the uncommitted working tree. It exited 1: 2 of 3 test files passed and 1 failed; 17 of 18 tests passed and 1 failed; 0 skipped; duration 1.25 seconds. The only failure was the new edit-textarea assertion at `tests/accessibility/app-view.a11y.test.tsx:375`, which expected the exact accessible name `Message`; the actual accessible name correctly included its existing help and character-count text. The query was corrected before the full-suite command. Under the implementation agent's exactly-once constraint, that agent did not rerun the exact targeted command.

This prior event has been moved from primary command-result order 5 into explicit history so the primary oracle describes the verified final code revision. Its exit 1, counts, duration, and selector defect are preserved completely; it was not relabeled, converted to a pass, or erased.

The PM later attempted the same focused command against `d7edf8f888e156a60a859c00827cc6dac1467b29`. Its managed-sandbox attempt failed before test collection with `EPERM` while writing `node_modules/.vite-temp`; the approved local-worktree rerun exited 0 with 3 of 3 files and 18 of 18 tests passed, 0 failed/skipped, in 1.26 seconds. This is historical pre-review evidence only.

Independent accessibility review of exact SHA `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4` was `FAIL`, with FIND-003 HIGH, FIND-005 HIGH, FIND-002 MED, EVID MED, FIND-005b LOW, FIND-003b LOW, and TEST LOW. This failed disposition remains authoritative for that SHA and was not converted by later implementation work.

Strict-allowlist fresh review r3 of head `ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa` / code `dac3484fe68063cc33ea581ca8bfaed9f6619489` was also `FAIL`: 0 critical, 1 high, 1 medium, and 6 low findings. The findings were H-1 completed-reply ordering, M-1 status-chip boundaries, L-1 expiry live-region labeling, L-2 programmatic-focus fallback, L-3 deleted-owner association, L-4 distance-capped pairing, L-5 same-mount reduced-motion coverage, and L-6 exact revision/result scoping. This verdict remains authoritative for the reviewed SHAs and is not converted by the later implementation or passing automation.

The first follow-up code revision, `c4e4c46932c4c0b7382690b769bf06481ff76dfe`, began a packet-order acceptance sequence. Its focused command exited 1: 2 of 3 files passed and 1 failed; 19 of 20 tests passed and 1 failed; 0 skipped; duration 1.47 seconds. The reduced-motion test rerender reached the message-log scrolling path and JSDOM threw `TypeError: element.scrollTo is not a function` at `src/components/AppView.tsx:1275`. The test-only transition was isolated in the next commit; this failed test result and SHA are preserved, and the incomplete sequence stopped at command 5.

## Tests

| Finding | Automated regression tests | Remaining acceptance boundary |
|---|---|---|
| FIND-001 / r4 L1, L2 | Bypass is first in the application shell, targets the named main, moves focus, and is absent from the anonymous shell. The main's focus indicator is an inset, above-content layer; the exact `:focus` fallback remains narrow because the main and expiry heading are programmatically focused `tabIndex=-1` targets, while global `:focus-visible` remains unchanged. | Independent keyboard/switch review with long chat navigation and rendered focus non-obscuration. |
| FIND-002 / r3 L-1 / r5 L3 | A focused guest composer transitions to an expiry heading; the same unlabeled live-region node persists and gains the full privacy-significant body without repeating the focused title; session cleanup tests remain enabled. | VoiceOver/NVDA announcement behavior and timed local journey. |
| FIND-003 / FIND-003b / r3 H-1, L-3, L-4 / r4 L4 | Adjacent reverse source order is presented as user then pending, failed, or completed state by `clientRequestId`; pending→failed and pending→complete rerenders retain adjacency; deleted owners stay paired but cannot expose Edit; no-ID legacy edit association is retained; distant reused IDs remain anchored while an interleaved adjacent turn remains paired. | Live guest and registered pending/completion/failure/retry/edit journeys. |
| FIND-004 / TEST / r3 L-5 / r4 L5, L6 / r5 L2, L5, L7 | Pending presentation has one visible status source and a neutral progress graphic; normal motion is finite at 4.8 seconds with a static final keyframe; a mocked reduced-motion preference renders the no-animation branch; CSS retains the native safeguard; semantic selectors and balanced media-block parsing avoid class/EOF coupling; and the same mounted main/request/message identity transitions from pending to complete. | Manual reduced-motion and screen-reader announcement-once review. |
| FIND-005 / FIND-005b / r3 M-1, L-2 / r4 L3 | Tests calculate the committed control-border token against the relevant surfaces and assert its use for status-chip, camera-state-chip, switch, return, and earlier target controls; camera state ratios are 3.02:1 on mint and 3.03:1 on amber. | Rendered contrast, focus visibility, and forced-colors review across states. |

- Primary code-under-test targeted oracle (`3a88836006096d9d9d1c1dc123c700004d8d153c`): `3 passed, 0 failed, 3 files total`; `24 passed, 0 failed, 24 tests total`; skipped `0`; duration `1.32 s`.
- Prior `e79a030daa2270979d0f2451387e3ec23e153909` targeted oracle: `3 passed, 0 failed, 3 files total`; `23 passed, 0 failed, 23 tests total`; skipped `0`; duration `1.56 s`.
- Prior `7e8ebc20b00a047464f366a7795f0fd57256d76c` targeted oracle: `3 passed, 0 failed, 3 files total`; `23 passed, 0 failed, 23 tests total`; skipped `0`; duration `1.28 s`.
- Prior uncommitted-working-tree targeted attempt: `2 passed, 1 failed, 3 files total`; `17 passed, 1 failed, 18 tests total`; skipped `0`; duration `1.25 s`.
- Prior `c4e4c46932c4c0b7382690b769bf06481ff76dfe` targeted attempt: `2 passed, 1 failed, 3 files total`; `19 passed, 1 failed, 20 tests total`; skipped `0`; duration `1.47 s`.
- Prior `0e8709c39c7987d1c824fe1e752873fb77dbff5a` targeted attempt: `2 passed, 1 failed, 3 files total`; `17 passed, 7 failed, 24 tests total`; skipped `0`; duration `1.34 s`.
- Primary code-under-test full run: `19 passed, 1 skipped, 20 files total`; `135 passed, 7 skipped, 142 tests total`; failed `0`; skipped `7`; duration `2.53 s`.
- Existing axe assertions were neither deleted nor weakened; the recorded test result includes them.
- Existing session-lifecycle tests remained enabled in both applicable runs.
- Test failures: the primary code-under-test focused oracle and full suite recorded zero failures. The prior working-tree exact-name-query failure, `c4e4c469…` JSDOM test-transition failure, and `0e8709c…` failed-alert-selector failure remain visible in history and are not rewritten as passes.
- Test skips: the primary focused oracle and all recorded failed focused histories recorded zero skips. The primary full suite recorded 1 skipped file and 7 skipped tests; these are not relabeled as passing evidence.

Automated tests are structural evidence only and make no GUI, real-screen-reader, exact-viewport, physical-camera, provider, or release claim.

### PM supplemental final-code-revision verification

This is preserved historical evidence for `d7edf8f888e156a60a859c00827cc6dac1467b29`; it is not the primary code-under-test oracle and predates the failed independent review of `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4`.

- Authority: PM.
- Verified revision: `d7edf8f888e156a60a859c00827cc6dac1467b29`.
- Command: `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts`.
- First PM attempt: failed before test collection with `EPERM` while writing `node_modules/.vite-temp` under the managed sandbox. No test pass/fail count is inferred from that attempt.
- Approved local-worktree rerun of the same command: exit 0; 3 of 3 test files passed; 18 of 18 tests passed; 0 failed; 0 skipped; duration 1.26 seconds.
- Evidence boundary: moving the implementation agent's earlier uncommitted-working-tree exit 1 into explicit history does not erase, replace, relabel, or convert that event into a pass. This historical verification does not apply to later code changes and does not replace keyboard, screen-reader, mobile, exact-viewport, reduced-motion, forced-colors, rendered-contrast, other manual/platform evidence, or fresh independent accessibility review.

## Static and build evidence

- Typecheck: exit 0 with no diagnostics.
- Build: exit 0 after transforming 1,909 modules and listing 9 emitted artifact entries in 516 milliseconds; one advisory warning block identified 2 oversized JavaScript chunks (`916.45 kB`, `1,314.50 kB`).
- `git diff --check`: exit 0 with no output on the clean code-under-test revision.
- Lint: no lint script is defined in `package.json`; it was not run and no lint result is claimed.
- Format: no format-check script is defined; it was not run. The packet whitespace check is not relabeled as formatting evidence.
- Control boundary calculations: `#9585A2` is 3.41:1 against `#FFFFFF`, 3.40:1 against `#FFFEFF`, 3.29:1 against `#FCFAFF`, and 3.12:1 against `#F7F3FF`.
- Default, success, and warning status-chip variants now use the `#9585A2` boundary; against the surrounding `#FFFFFF`/`#F7F3FF` header surfaces it is 3.41:1/3.12:1 rather than transparent or 1.29:1.
- Default, on, and warning camera-state chips now use the same boundary; it is 3.12:1 against `#F7F3FF`, 3.02:1 against on-state `#DDF7EC`, and 3.03:1 against warning-state `#FFF1C7`.
- The off-state switch track uses `#9585A2` against `#F7F3FF` at 3.12:1; the on-state track uses `#6D4AFF` against `#F7F3FF` at 4.72:1. The return-to-latest control uses `#9585A2` against its `#FFFFFF` surface at 3.41:1.
- Global focus-visible treatment remains a 2 px `#4E2BC5` outline with 2 px offset; its contrast against white is 8.48:1. The programmatic conversation target uses the same 2 px token in an inset `z-index: 4` pseudo-element above its in-scope child layers, and the expiry heading retains its narrow `:focus` fallback. Field/composer focus overrides remain present.
- Default motion runs three 1.6-second iterations (4.8 seconds total) and ends at a static full-width keyframe. Reduced-motion behavior renders the progress fill without its animated modifier when `matchMedia` reports the preference; CSS also removes animation/transform and retains a static full bar. This is source/test evidence, not a manual reduced-motion pass.

## Security and dependency evidence

- `npm ci --offline`: exit 0; 511 packages added, 512 audited in 5 seconds, 84 funding notices, 0 vulnerabilities, and 2 deprecation warnings.
- No dependency, `package.json`, or `package-lock.json` change was made.
- Dedicated secret scan: not authorized by the packet and not run; no secret-scan result is claimed.
- Dedicated license scan: not authorized by the packet and not run; no license-scan result is claimed.
- No `.env`, secret, credential, real account, production data, personal/health/emotional data, private conversation, browser profile, physical camera, external URL, provider, connector, cloud runtime, deployment, publication, push, billing, or repository-visibility action was used.
- Presentation ordering uses the existing `clientRequestId` already present on messages; no auth, storage, message API, idempotency, safety, camera, provider, logging, telemetry, or retention contract changed.

## Contract deviations

None. Frozen contract revision `1`, task scope, privacy boundary, non-medical safety boundary, copy semantics, and all frozen interfaces were preserved. No new dependency, configuration, contract revision, schema, provider call, camera behavior, or domain behavior was introduced.

## Assumptions made

- `clientRequestId` is the existing presentation-safe association between an optimistic user message and its pending/failed/completed assistant state, as already used by retry in the authorized `src/App.tsx` read scope. Presentation reordering does not alter the stored array, reducer, timestamps, idempotency, or API payload. Only adjacent source entries are presentation-paired; this covers the observed reversed pair without relocating a distant stale/reused ID. A blank/missing request ID retains an immediately preceding legacy association, and a nonempty unmatched or distant ID does not bind an unrelated message.
- A focused expiry heading provides predictable title context and leaves unchanged recovery actions next in sequential keyboard order; the separate live status carries only the existing privacy-significant body so it does not repeat the focused title.
- The animated horizontal bar is a neutral system-progress metaphor, not a human typing imitation. Default motion is bounded to 4.8 seconds and ends static. Under reduced motion the component renders without the animated modifier while its visible status text remains; the CSS media query is retained as a second safeguard.
- The exact `.ss-conversation:focus` and `.ss-expired__card h1:focus` fallbacks are intentional because these `tabIndex=-1` elements receive programmatic focus. A direct mouse click can also expose that narrow ring; preserving programmatic focus visibility is the selected tradeoff. This does not replace or weaken the global `:focus-visible` treatment for ordinary controls. The conversation's `isolation: isolate` contains its focus overlay, and no reachable descendant depends on escaping that stacking context.
- Automated axe/DOM/CSS tests and mathematical token calculations are structural evidence, not manual browser, assistive-technology, rendered-contrast, or release evidence.
- `head_revision: HEAD` is the canonical symbolic value resolved by the handoff gate against the checked-out evidence commit. `code_under_test_revision: 3a88836006096d9d9d1c1dc123c700004d8d153c` remains the exact immutable implementation/test commit on which all nine primary commands ran. This distinction avoids a false self-referential SHA, does not broaden the automated-only result, and still requires independent disposition of the final follow-up.

## Known issues

The exact code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c` has no failure in the focused oracle, full suite, typecheck, build, status, or whitespace check. The implementation agent's original uncommitted-working-tree selector attempt and the `c4e4c469…` JSDOM and `0e8709c…` selector attempts exited 1; their exact counts, defects, and dispositions remain explicit history and were not relabeled or erased. The PM's older `d7edf8f…` sandbox/rerun record and the prior passing `7e8ebc20…` and `e79a030…` acceptance records also remain historical evidence.

Independent review of `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4` remains `FAIL`. Later r3, r4, and r5 reviews are recorded against their own exact revisions and do not relabel or erase that failed disposition.

Strict-allowlist fresh review r3 of `ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa` / code `dac3484fe68063cc33ea581ca8bfaed9f6619489` remains `FAIL` with 0 critical, 1 high, 1 medium, and 6 low findings. Fresh r4 of evidence `c77de9af…` / code `7e8ebc20…` remains `PASS` with 0 critical/high/medium and 6 low findings. Fresh r5 of evidence `87d7e449…` / code `e79a030…` remains `PASS` with 0 critical/high/medium and 7 low findings. The authorized r5-low polish is on `3a888360…`; it has passing automation but no independent review in this task.

The reviewer-noted pre-existing `src/App.tsx` retry issue is outside TASK-08 write scope. It remains unchanged, unresolved by this task, and is not waived or claimed as a TASK-08 finding closure.

The following manual/platform work remains pending and is not inferred as pass or N/A:

- VoiceOver + Safari, Windows + NVDA, iOS VoiceOver, and Android TalkBack.
- Latest-two-major Chrome, Firefox, Safari, and Edge keyboard/browser coverage.
- Exact 320 CSS px, exact 390 × 844, 200% zoom, touch, software keyboard, safe-area, increased text spacing, and long-content reflow.
- Manual `prefers-reduced-motion`, forced colors/high contrast, rendered contrast, and full focus visibility/non-obscuration.
- Announcement-once behavior for pending/completed replies, failures, and expiry.
- Live guest/registered retry/edit ordering, successful reply arrival, scroll preservation, auth restoration, and safety routing using separately approved local fixtures.
- Physical-camera lifecycle was forbidden and remains pending.
- Fresh r5 did not inspect the later `3a888360…` r5-low polish or its final evidence commit.

Therefore the implementation remediations must not be treated as accepted finding closures for D-5/RG-05/Gate C or release.

## Integration notes

- Review code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c` together with the later documentation-only evidence commit; preserve r4 and r5 `PASS`-with-lows only for their exact reviewed pairs, and do not merge or copy TASK-05 sibling evidence.
- The intended diff is limited to `AppView.tsx`, `app-view.css`, `tokens.css`, the existing accessibility test, and TASK-08 QA/handoff documents.
- Display-only pairing keeps adjacent pending, failed, and completed states with the user message sharing their nonempty `clientRequestId`; deleted owners remain matchable, distant/unmatched states stay anchored, and a no-ID legacy failure retains only an immediately preceding user association.
- The bypass is rendered only in authenticated/guest app-shell states and is the shell's first element before conversation navigation.
- The control-border token is scoped to target boundaries; general decorative borders remain unchanged.
- The pre-existing `src/App.tsx` retry issue is out of TASK-08 write scope and was not changed.
- Passing automation does not approve D-5, RG-05, Gate C, release, publication, deployment, or accessibility conformance.

Human-gate boundary: this implementation agent cannot self-accept. A fresh independent accessibility reviewer and the authorized human gate must inspect and disposition the exact final SHA before any acceptance or release claim.

## Recommended next action

Have the authorized reviewer/human gate disposition the final r5-low polish at code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c` and its exact later evidence commit, while preserving r4 and r5 as `PASS`-with-lows only for their reviewed pairs. Separately authorized keyboard/screen-reader/browser/mobile/exact-viewport/reduced-motion/forced-colors/contrast evidence remains pending. Only the authorized human gate may decide D-5, RG-05, Gate C, release, publication, or deployment.
