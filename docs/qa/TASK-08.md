# TASK-08 — Accessibility remediation QA

Result: **automated implementation pass only on the exact code-under-test revision; fresh independent accessibility review required**.

TASK-08 applies presentation-layer remediations for TASK-05 findings FIND-001 through FIND-005 on frozen contract revision `1`. The evidence in this report is local, automated, and synthetic-only. It does not approve D-5, RG-05, Gate C, release, publication, deployment, or any manual/platform acceptance criterion.

## Scope and provenance

- Agent: OpenAI Codex, implementation agent; not the independent accessibility approver
- Project: `01M0Z716GT7DXBMSXNVNHTSFT2`
- Task: `TASK-08`
- Contract revision: `1`
- Authoritative base revision: `fe79e5d7d20048db5725a673011a54f32f61decd`
- Failed independent-review revision: `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4` (`FAIL`)
- Strict-allowlist fresh review r3: head `ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa` / code `dac3484fe68063cc33ea581ca8bfaed9f6619489` (`FAIL`; 0 critical, 1 high, 1 medium, 6 low)
- Fresh review r4: evidence head `c77de9af9e891a988ab8e4ef245c5865be4ad0d1` / code `7e8ebc20b00a047464f366a7795f0fd57256d76c` (`PASS` with 0 critical, 0 high, 0 medium, and 6 low follow-up findings; reviewer commands all passed)
- Fresh review r5: evidence head `87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01` / code `e79a030daa2270979d0f2451387e3ec23e153909` (`PASS` with 0 critical, 0 high, 0 medium, and 7 low findings; allowlist certified; reviewer writes 0)
- Exact code-under-test revision: `3a88836006096d9d9d1c1dc123c700004d8d153c`
- Evidence checkout revision: `HEAD` (canonical symbolic value resolved by the handoff gate against the checked-out evidence commit; not the code-under-test SHA)
- Branch: `ai/TASK-08-accessibility-remediation`
- Worktree: `/Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot-TASK-08`
- Completed at: `2026-08-28T16:46:40Z`
- Data: synthetic fixture data only
- Network, providers, cloud, production, connectors, accounts, secrets, `.env`, physical devices, GUI review, deployment, publication, push, and billing: not used

TASK-05 at evidence revision `5852f8a4ad8d42aa640d36e1639fa8ebbb2cb758` was read only. It was not modified, merged, or treated as an accepted dependency.

## Finding dispositions and test mapping

| Finding | Presentation remediation | Regression evidence | Implementation disposition |
|---|---|---|---|
| FIND-001 | A first-in-shell `Skip to active conversation` link targets and focuses the named active-conversation main before sidebar controls. It is absent outside the chat shell. | `places a keyboard bypass before repeated navigation and moves focus to the conversation`; `does not add the conversation bypass outside the chat application shell` | Code-level remediation implemented; keyboard/manual verification pending. |
| FIND-002 / r3 L-1 | Guest expiry mutates a polite atomic status that persists across the session transition without an overriding label. The status contains the existing privacy-significant body but not the title already exposed by focus on the visible expiry heading; unchanged recovery actions follow. | Expiry regression verifies stable `data-session-status` identity, absence of `aria-label` and repeated title, exact visible status body, heading focus, and retained axe assertions; session lifecycle cleanup tests | Follow-up code-level remediation implemented; real screen-reader announcement behavior pending. |
| FIND-003 / FIND-003b / r3 H-1, L-3, L-4 | Adjacent pending, failed, and completed assistant states are paired by nonempty `clientRequestId` after their user message. Deleted owners remain matchable; no-ID legacy failures retain only an immediate preceding-user association; distant reused IDs remain anchored while an interleaved adjacent turn is paired. | Existing failed/pending tests plus `keeps a request-paired completed reply after its user on the same mounted rerender`, deleted-owner regression, and distance-capped interleaving regression | Follow-up code-level remediation implemented; live registered/guest journey verification pending. |
| FIND-004 / TEST / r3 L-5 | Neutral progress animates for three 1.6-second iterations, ends in a meaningful static state within 4.8 seconds, and remains static under reduced motion. JSDOM polyfills `Element.scrollTo`, and completion is asserted through the same mounted AppView instead of unmounting. | Focused tests assert the single announcement source, finite normal animation, final static keyframe, reduced-motion branch/safeguard, same main-node identity, completion, and retained axe coverage | Follow-up code/test remediation implemented; manual reduced-motion and AT timing pending. |
| FIND-005 / FIND-005b / r3 M-1, L-2 | The `#9585A2` boundary now applies to all status-chip variants as well as earlier targeted controls; explicit `:focus` outlines cover programmatically focused conversation and expiry targets while preserving the global focus treatment. | Control-boundary regression checks default/success/warning selectors and token ratios; focus regression checks both fallback selectors and unchanged token/ring | Follow-up token/focus remediation implemented; forced-colors and rendered-browser review pending. |

No existing axe assertion was removed, weakened, skipped, focused, quarantined, suppressed, or replaced.

### Fresh r4 low-finding triage

Fresh review r4 remains `PASS` with lows for evidence head `c77de9af9e891a988ab8e4ef245c5865be4ad0d1` and code `7e8ebc20b00a047464f366a7795f0fd57256d76c`; the later follow-up does not relabel that verdict.

| r4 finding | Verification and disposition on `e79a030…` | Regression evidence |
|---|---|---|
| L1 | Fixed: the programmatically focused conversation now draws an inset, pointer-transparent focus border in a `z-index: 4` pseudo-element above its highest in-scope child layer, avoiding viewport clipping and child coverage. | Focus CSS assertions verify positioning, isolation, inset, stacking, focus token, and pointer behavior. |
| L2 | Evidence-based non-action on selector scope: `:focus` remains intentionally limited to the conversation main and expiry heading because both are programmatically focused `tabIndex=-1` targets. The global `:focus-visible` rule remains unchanged for ordinary controls. | Existing bypass/expiry focus behavior plus focused CSS assertions for both narrow fallbacks and the unchanged global rule. |
| L3 | Fixed: base, on, and warning camera-state chips use `--color-control-border`; calculated ratios are 3.12:1 on tinted canvas, 3.02:1 on mint, and 3.03:1 on amber. | Token/selector contrast test covers all three variants and both state surfaces. |
| L4 | Fixed: a failed reply paired with a deleted owner stays adjacent but no longer exposes Edit for deleted content. Retry remains unchanged. | Deleted-owner regression now asserts adjacency and absence of Edit/dialog. |
| L5 | Fixed: reply progress has no `aria-label`; its visible complete status body is exposed through an explicit atomic status. | Pending-status tests assert visible body, no label, atomic status, axe, and removal on completion. |
| L6 | Fixed/test-strengthened: the reduced-motion test retains one mounted `AppView`, the same main node, the same user/request ID, and the same assistant message ID while pending transitions to complete. | `keeps reply progress neutral and static under reduced motion`. |

The reviewer-noted pre-existing retry issue in `src/App.tsx` is outside TASK-08 write scope. It was not investigated beyond previously authorized reading, changed, waived, or claimed as resolved.

### Fresh r5 review record

Fresh review r5 remains `PASS` with lows for evidence head `87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01` and code `e79a030daa2270979d0f2451387e3ec23e153909`: 0 critical, 0 high, 0 medium, and 7 low findings. The reviewer certified the allowlist and made no writes. Reported passing checks were Node and npm version commands, typecheck, the scoped accessibility/session run with 23 tests passed, the full run with 134 tests passed and 7 skipped, and `git diff --check`.

The reviewer also ran unrequested command `npx vitest --reporter=verbose` locally without network access to inspect the skips. That event is preserved as a procedural deviation. It is not normalized into the packet acceptance sequence, is not evidence that skipped tests passed, and does not alter the r5 result or the manual/human-gate boundary.

The seven low findings concern the narrow conversation `:focus` tradeoff, duplicate reply-progress live announcements, duplicate expiry-title announcement, the failed-alert label/body relationship, unbounded progress motion, the benign conversation isolation stacking context, and class-query/EOF-slice test hygiene. The following dispositions apply only to the later code-under-test revision; they do not relabel r5 or claim independent review of the follow-up.

| r5 finding | Disposition on `3a888360…` | Regression evidence / rationale |
|---|---|---|
| L1 | Evidence-based non-action: preserve the narrow bare `.ss-conversation:focus` fallback because the `tabIndex=-1` conversation is focused programmatically after bypass activation. The known tradeoff is that a direct mouse click can also show this ring; removing it would regress visible programmatic focus. | Selector assertions retain the narrow conversation and expiry fallbacks and the unchanged global `:focus-visible` rule; the CSS comment records the tradeoff. |
| L2 | Fixed: the hidden `LiveRegions` container no longer repeats the pending reply text. The visible neutral `ReplyIndicator` remains the sole polite status source. | Same-mounted pending/completion test asserts exactly one visible reply status and no duplicate writing text in hidden live regions. |
| L3 | Fixed: focus still moves to the expiry h1, while the persistent polite atomic status contains only the existing privacy-significant body and no repeated title. | Expiry test asserts focused heading, stable `data-session-status`, no `aria-label`, no title in the status, and exact visible body. |
| L4 | Fixed: the failed atomic alert no longer has a redundant `aria-label`; its visible strong/body content, Retry, and eligible Edit controls remain exposed. | Semantic failed-alert helper anchors on the Retry button and tests unlabeled atomic visible content plus retry/edit behavior. |
| L5 | Fixed: the 1.6-second progress animation runs three times (4.8 seconds total), fills to a static end state, and remains immediately static under reduced motion. | CSS parsing tests reject `infinite`, calculate a total no greater than 5 seconds, verify the final keyframe, and exercise both default and reduced-motion branches. |
| L6 | Evidence-based non-action: `isolation: isolate` is retained because it contains the inset focus overlay; no reachable descendant depends on escaping the conversation stacking context. | Narrow CSS comment and focus-overlay assertions document the contained stacking rationale without changing behavior. |
| L7 | Fixed/test hygiene: class-based status lookup is replaced by visible status text plus role, failed alerts use their semantic Retry control, and reduced-motion media extraction uses a balanced block parser instead of an EOF slice. | Focused tests pass with stable semantic targets and bounded media-block assertions while retaining all axe coverage. |

## Contrast calculations

WCAG relative luminance calculations use linearized sRGB and `(L1 + 0.05) / (L2 + 0.05)`.

| Boundary / adjacent surface | Ratio | Structural disposition |
|---|---:|---|
| `#9585A2` / surface `#FFFFFF` | 3.41:1 | Meets the 3:1 meaningful-boundary target. |
| `#9585A2` / raised surface `#FFFEFF` | 3.40:1 | Meets the target. |
| `#9585A2` / canvas `#FCFAFF` | 3.29:1 | Meets the target. |
| `#9585A2` / tinted canvas `#F7F3FF` | 3.12:1 | Meets the target. |
| off-state switch track `#9585A2` / row `#F7F3FF` | 3.12:1 | Meets the target; replaces the failed-review 1.53:1 track. |
| on-state switch track `#6D4AFF` / row `#F7F3FF` | 4.72:1 | Meets the target and distinguishes the state. |
| return-to-latest border `#9585A2` / control surface `#FFFFFF` | 3.41:1 | Meets the target; replaces the failed-review 1.67:1 boundary. |
| status-chip variant border `#9585A2` / surrounding `#FFFFFF` | 3.41:1 | Meets the target; replaces the r3 1.29:1/transparent boundaries. |
| status-chip variant border `#9585A2` / surrounding `#F7F3FF` | 3.12:1 | Meets the target on the tinted header surface. |
| camera-state chip border `#9585A2` / on-state `#DDF7EC` | 3.02:1 | Meets the target; replaces the r4 transparent state boundary. |
| camera-state chip border `#9585A2` / warning-state `#FFF1C7` | 3.03:1 | Meets the target; replaces the r4 transparent state boundary. |
| focus `#4E2BC5` / `#FFFFFF` | 8.48:1 | Existing visible focus color retained. |

The automated test calculates these ratios from the committed tokens rather than accepting hard-coded pass labels. Rendered-browser contrast, forced colors, and every state still require independent manual review.

## Acceptance command record

The primary record is the complete nine-command packet sequence run exactly once, in packet order, on committed code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c`. Earlier working-tree, PM, independent-review, r3, r4, r5, `c4e4c469…`, `7e8ebc20…`, `e79a030…`, and stopped `0e8709c…` histories are preserved separately below and were not relabeled or erased.

| # | Exact command | Exit | Exact result |
|---:|---|---:|---|
| 1 | `node --version` | 0 | `v24.3.0` |
| 2 | `npm --version` | 0 | `11.4.2` |
| 3 | `npm ci --offline` | 0 | Added 511 packages; audited 512 in 5 s; 84 packages seeking funding; 0 vulnerabilities; 2 deprecation warnings (`node-domexception@1.0.0`, `glob@10.5.0`). |
| 4 | `npm run typecheck` | 0 | TypeScript build completed with no diagnostics. |
| 5 | `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` | 0 | On `3a88836006096d9d9d1c1dc123c700004d8d153c`: 3/3 files passed; 24/24 tests passed; 0 failed; 0 skipped; 1.32 s. Includes single-source reply progress, body-only expiry status, unlabeled atomic failure content, finite/default and static/reduced motion, stable semantic selectors, bounded media parsing, session lifecycle, and retained a11y/axe coverage. |
| 6 | `npm run test` | 0 | 20 files: 19 passed, 1 skipped; 142 tests: 135 passed, 7 skipped, 0 failed; 2.53 s. |
| 7 | `npm run build` | 0 | 1,909 modules transformed; 9 emitted artifact entries listed; 516 ms; 1 advisory warning block for 2 JavaScript chunks over 500 kB (`916.45 kB`, `1,314.50 kB`). |
| 8 | `git status --short` | 0 | No output; committed code-under-test revision clean. |
| 9 | `git diff --check` | 0 | No output; committed code-under-test revision clean. |

### Prior `7e8ebc20…` acceptance and fresh r4 history

The preceding primary acceptance sequence on `7e8ebc20b00a047464f366a7795f0fd57256d76c` also ran all nine packet commands exactly once in order. It recorded Node `v24.3.0`; npm `11.4.2`; offline install exit 0 with 511 packages added, 512 audited in 5 seconds, 84 funding notices, 0 vulnerabilities, and the same 2 deprecation warnings; typecheck exit 0; focused tests exit 0 with 3/3 files and 23/23 tests passed, 0 failed/skipped, in 1.28 seconds; full tests exit 0 with 19 files passed, 1 file skipped, 134 tests passed, 7 tests skipped, 0 failed, in 2.39 seconds; build exit 0 with 1,909 modules, 9 listed artifacts, 541 milliseconds, and one advisory block for two chunks (`916.61 kB`, `1,314.50 kB`); and clean/no-output status and diff checks.

Fresh review r4 reviewed evidence head `c77de9af9e891a988ab8e4ef245c5865be4ad0d1` and code `7e8ebc20b00a047464f366a7795f0fd57256d76c`. Its result remains `PASS` with 0 critical, 0 high, 0 medium, and 6 low findings; the reviewer reported all commands passed. The six low findings are preserved in the triage table above. The review is not relabeled as a failure and is not claimed to cover the later `e79a030…` follow-up.

### Prior `e79a030…` acceptance and fresh r5 history

The later acceptance sequence on `e79a030daa2270979d0f2451387e3ec23e153909` ran all nine packet commands exactly once in order. It recorded Node `v24.3.0`; npm `11.4.2`; offline install exit 0 with 511 packages added, 512 audited in 5 seconds, 84 funding notices, 0 vulnerabilities, and the same 2 deprecation warnings; typecheck exit 0; focused tests exit 0 with 3/3 files and 23/23 tests passed, 0 failed/skipped, in 1.56 seconds; full tests exit 0 with 19 files passed, 1 file skipped, 134 tests passed, 7 tests skipped, 0 failed, in 3.17 seconds; build exit 0 with 1,909 modules, 9 listed artifacts, 556 milliseconds, and one advisory block for two chunks (`916.63 kB`, `1,314.50 kB`); and clean/no-output status and diff checks.

Fresh review r5 reviewed evidence head `87d7e4496cac73acf9a9a84a5ce20cb6b4f63b01` and that exact code revision. It remains `PASS` with 0 critical, 0 high, 0 medium, and 7 low findings. The allowlist/no-write certification, reviewer-reported command results, unrequested local/no-network verbose Vitest deviation, and unapproved manual/human gates remain exactly as recorded above. It is not claimed to cover the later `3a888360…` polish.

### Prior working-tree attempt history

Before final-code-revision verification, the implementation agent ran `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` against the uncommitted working tree. It exited 1: 3 files total, 2 passed and 1 failed; 18 tests total, 17 passed and 1 failed; 0 skipped; duration 1.25 seconds. The failure was the new exact-name edit-textarea query at `tests/accessibility/app-view.a11y.test.tsx:375`: it expected the exact accessible name `Message`, while the actual accessible name correctly included the existing help and character-count text. The query was corrected before the full-suite command, and the implementation agent did not rerun the exact targeted command under the exactly-once constraint.

This earlier exit 1, its 17/18 count, duration, and selector defect are preserved completely as prior-working-tree evidence. Moving the event out of the primary code-under-test oracle did not relabel, convert, or erase it.

### PM supplemental final-code-revision verification

- Historical scope: pre-review evidence for `d7edf8f888e156a60a859c00827cc6dac1467b29`; not the current primary oracle.
- Authority: PM.
- Verified revision: `d7edf8f888e156a60a859c00827cc6dac1467b29`.
- Command: `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts`.
- First PM attempt: failed before test collection with `EPERM` while writing `node_modules/.vite-temp` under the managed sandbox; no test count is inferred from that attempt.
- Approved local-worktree rerun of the same command: exit 0; 3 of 3 files passed; 18 of 18 tests passed; 0 failed; 0 skipped; duration 1.26 seconds.
- Evidence boundary: this record does not apply to later code changes, does not erase or relabel the implementation agent's prior failure, and does not replace any manual/platform criterion or fresh independent review.

### Failed independent review and follow-up attempt history

Independent accessibility review of exact SHA `cb8d89997a0f970a34de98b481d5b9a8e04d8ec4` was `FAIL`. The recorded findings were FIND-003 HIGH (pending/retry order), FIND-005 HIGH (1.53:1 switch track), FIND-002 MED (expiry status announcement), EVID MED (code-under-test revision provenance), FIND-005b LOW (1.67:1 return-control boundary), FIND-003b LOW (legacy edit association), and TEST LOW (CSS-string-only reduced-motion coverage). This disposition remains a failure for that SHA; later implementation work does not relabel or erase it.

The first follow-up code revision was `c4e4c46932c4c0b7382690b769bf06481ff76dfe`. Its packet-order sequence stopped at focused command 5 after exit 1: 3 files total, 2 passed and 1 failed; 20 tests total, 19 passed and 1 failed; 0 skipped; duration 1.47 seconds. The reduced-motion test rerender reached `MessageLog` scrolling and JSDOM threw `TypeError: element.scrollTo is not a function` at `src/components/AppView.tsx:1275`. The test-only transition was isolated in the next commit without changing application behavior. The failed SHA, result, and defect remain preserved.

The first r5-polish acceptance attempt used code revision `0e8709c39c7987d1c824fe1e752873fb77dbff5a`. Commands 1–4 passed: Node `v24.3.0`; npm `11.4.2`; offline install with 511 packages added and 512 audited in 6 seconds, 84 funding notices, 0 vulnerabilities, and 2 deprecation warnings; and typecheck with no diagnostics. Focused command 5 exited 1: 2 of 3 files passed and 1 failed; 17 of 24 tests passed and 7 failed; 0 skipped; duration 1.34 seconds. The new failed-alert helper assumed literal visible text `Reply failed`, while the preserved product copy differs. A separate test-only commit selected the alert through its stable semantic Retry control without changing product behavior or visible copy. Commands 6–9 were not run on this revision. The stopped attempt is not relabeled or erased.

Strict-allowlist fresh review r3 of final head `ab408a89a1e178cc53bd8932c2cc7d2b7b9067aa` / code `dac3484fe68063cc33ea581ca8bfaed9f6619489` was `FAIL`: 0 critical, 1 high, 1 medium, and 6 low. H-1 covered completed-reply ordering; M-1 status-chip boundaries; L-1 expiry status labeling; L-2 programmatic-focus fallback; L-3 deleted-owner association; L-4 distance-capped pairing; L-5 same-mount reduced-motion coverage; and L-6 exact revision/result scoping. This verdict remains authoritative for those reviewed SHAs and is not relabeled or erased by the later implementation or automated pass.

## Test and static-check disposition

- Primary code-under-test targeted oracle files: `3 passed, 0 failed, 3 total`; tests: `24 passed, 0 failed, 24 total`; skipped: `0`; duration: `1.32 s`.
- Prior `e79a030…` targeted oracle files: `3 passed, 0 failed, 3 total`; tests: `23 passed, 0 failed, 23 total`; skipped: `0`; duration: `1.56 s`.
- Prior `7e8ebc20…` targeted oracle files: `3 passed, 0 failed, 3 total`; tests: `23 passed, 0 failed, 23 total`; skipped: `0`; duration: `1.28 s`.
- Prior uncommitted-working-tree targeted attempt files: `2 passed, 1 failed, 3 total`; tests: `17 passed, 1 failed, 18 total`; skipped: `0`; duration: `1.25 s`.
- Prior `c4e4c469…` targeted attempt files: `2 passed, 1 failed, 3 total`; tests: `19 passed, 1 failed, 20 total`; skipped: `0`; duration: `1.47 s`.
- Prior `0e8709c…` targeted attempt files: `2 passed, 1 failed, 3 total`; tests: `17 passed, 7 failed, 24 total`; skipped: `0`; duration: `1.34 s`.
- Primary code-under-test full suite files: `19 passed, 1 skipped, 20 total`; tests: `135 passed, 7 skipped, 142 total`; failed: `0`; skipped: `7`; duration: `2.53 s`.
- Existing accessibility axe assertions remained enabled. Neither historical focused failure was an axe failure; the primary code-under-test focused oracle and full suite passed.
- Existing `tests/unit/client-session-lifecycle.test.ts` remained enabled and passed in the targeted run and the later full run.
- Typecheck: exit 0 with no diagnostics.
- Build: exit 0 after 1,909 modules and 516 milliseconds; 9 emitted artifact entries were listed; one advisory warning block identified 2 JavaScript chunks over 500 kB (`916.45 kB`, `1,314.50 kB`).
- Lint: no lint script is defined in `package.json`; not run; no lint result claimed.
- Format: no format-check script is defined in `package.json`; not run; packet `git diff --check` is recorded separately and is not described as a formatter.
- Dedicated secret scan: not authorized by the packet and not run; no secret-scan result claimed.
- Dedicated license scan: not authorized by the packet and not run; no license-scan result claimed.
- Dependency/lockfile: no dependency or lockfile change; offline install result is recorded above.

Automated results are structural regression evidence only. They are not VoiceOver, NVDA, TalkBack, mobile, keyboard-recording, exact-viewport, rendered contrast, or release evidence.

The focused oracle is an automated implementation pass only on exact code-under-test revision `3a88836006096d9d9d1c1dc123c700004d8d153c`. The implementation agent's original working-tree exit 1, PM sandbox history, failed `cb8d899…` review, failed `c4e4c469…` and `0e8709c…` test attempts, r3 `FAIL`, prior `7e8ebc20…` and `e79a030…` acceptances, and r4/r5 `PASS`-with-lows remain explicit history and were not reclassified, relabeled, or erased. Neither the focused oracle nor the full suite replaces manual/platform evidence or independent review of the final r5-low follow-up.

## Contract and privacy review

- Contract deviations: none.
- Auth, storage, message API, provider, safety, camera, logging, telemetry, retention, and resource-ownership interfaces were not changed.
- The r4-noted pre-existing `src/App.tsx` retry issue is outside TASK-08 write scope and remains unchanged and unresolved by this follow-up.
- Existing user-facing auth, guest, retry/edit, safety, camera-consent, privacy, storage, and non-medical copy semantics were preserved. The only new visible text is the navigation bypass label.
- No real or private personal, health, emotional, conversation, account, camera, credential, secret, production, or provider data was used.
- No dependency, lockfile, configuration, contract, governance, TASK-05, or owner-owned UI Mockup path was modified.

## Remaining manual and platform gaps

The following remain pending until a separately authorized rerun on the exact final commit:

- VoiceOver with Safari and NVDA with Firefox or Chrome.
- iOS VoiceOver and Android TalkBack, touch, software keyboard, and safe-area behavior.
- Latest-two-major Chrome, Firefox, Safari, and Edge keyboard/browser coverage.
- Exact 320 CSS px, exact 390 × 844, 200% zoom, increased text spacing, and long-content reflow.
- Manual `prefers-reduced-motion`, forced-colors/high-contrast, visible/unobscured focus, and rendered contrast review.
- Screen-reader announcement-once behavior for reply progress, successful replies, failures, and guest expiry.
- Live guest and registered failure/retry/edit ordering, successful assistant arrival, scroll preservation, auth restoration, and safety routing using separately approved local fixtures.
- Physical-camera lifecycle remains untested and was expressly forbidden for this task.
- Fresh r5 review passed evidence `87d7e449…` / code `e79a030…` with lows; the later r5-low polish at `3a888360…` has not been independently reviewed and still requires the authorized final disposition.

## Human-gate boundary

This implementation agent does not self-accept its remediation. Fresh r4 and r5 remain `PASS`-with-lows only for their exact reviewed evidence/code pairs, not for the later r5-low polish. D-5, RG-05, Gate C, release, publication, deployment, and public accessibility claims remain unapproved. A human gate and independent disposition of the exact final follow-up are required; TASK-08 automated evidence cannot substitute for those decisions.
