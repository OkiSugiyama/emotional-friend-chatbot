# TASK-09 — Detection-independent persistent help affordance QA

Result: **automated implementation pass only on the exact code-under-test revision; fresh independent review required**.

TASK-09 adds a presentation-layer, always-available help affordance on frozen contract revision `1`. The evidence in this report is local, automated, and synthetic-only. It does not approve D-5, RG-05, Gate C, release, publication, or deployment, and it does **not** remediate FR-5. The measured 82.9% residual routing false-negative rate of the TASK-06 safety router stands unchanged; this task lowers the cost of a false negative, it does not reduce the false-negative rate.

## Scope and provenance

- Agent: Claude (Anthropic), implementation agent; not the independent safety, accessibility, or QA approver
- Project: `01M0Z716GT7DXBMSXNVNHTSFT2`
- Task: `TASK-09`
- Contract revision: `1`
- Contract sha256: `766e98ff9f761bb3432f567dff279c500b33d41aa01cfa162427022afcc53b57` (identical to the value recorded by TASK-08; the frozen contract was read only and is unchanged)
- Packet authoritative base revision: `e79a0e74f87aa5a1906520a5ab3e192890b7e543`
- Worktree revision at task start: `7a9d94ee663e0a9cdbaa0f894f57b36dd33dcb65` (TASK-09 packet commit)
- Exact code-under-test revision: `319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49`
- Superseded first code-under-test revision: `0154b09e0cba42cbeae7cc37c1f56f7ba734b28d` (evidence commit `75a09ce`, reviewed FAIL; its acceptance record is retained below, not relabeled)
- Branch: `ai/TASK-09-persistent-help-affordance`
- Worktree: `/Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot-TASK-09`
- Execution host: the owner's local computer; Node `v24.3.0`, npm `11.4.2`, platform `darwin`
- Data: synthetic fixture data only
- Network, providers, cloud, Codex, connectors, production, accounts, secrets, `.env`, physical devices, GUI/manual platform review, deployment, publication, push, merge, and billing: not used

TASK-08 evidence at `docs/qa/TASK-08.md` and `docs/handoffs/TASK-08.md` was read only. It was not modified, and its `PASS`-with-lows and `FAIL` verdicts are not extended to this task.

## What was built

A `PersistentHelp` presentation component rendered from the `AppView` root fragment, after the session experience and outside every session-specific subtree.

| Property | Implementation |
|---|---|
| Presence | Rendered unconditionally for `initializing`, `anonymous`, `registered`, `guest`, and `guest-expired`. It is not a child of `AppShell`, `AuthExperience`, `GuestExpiredScreen`, or `LoadingScreen`, so no session branch can omit it. |
| Independence | Takes no props. It cannot read message content, `safetySupport`, routing metadata, camera phase, expression label, or confidence band. |
| Role and name | `<section>` with `aria-labelledby` bound to its own trigger, giving landmark role `region` with the stable accessible name `Help`. |
| Disclosure | Trigger `<button>` with `aria-expanded` / `aria-controls`; the panel is always in the DOM and toggled with the `hidden` attribute, so `aria-controls` always resolves. |
| Dismiss and recover | The panel closes from its own `Close` control or `Escape`, returning focus to the trigger. The trigger itself is never removable. |
| Side effects | No action prop invoked, no `fetch`, no `localStorage`/`sessionStorage` write, no telemetry, no `window.alert`. Opening it is not recorded anywhere. |
| Motion | No JS-driven motion. One `background-color` transition on the trigger, cancelled in the existing `prefers-reduced-motion: reduce` block, which is the last block in the stylesheet and therefore still wins. |
| Layout | Every full-viewport layout root reserves `--help-affordance-space`, derived from what the strip actually occupies: `1px + var(--space-1) + var(--control-min) + max(var(--space-1), env(safe-area-inset-bottom)) + 3px`. The safe-area term is what keeps the reserve from under-shooting on a device with a home indicator. The affordance occupies its own strip instead of overlaying content; only the user-opened, user-dismissible panel overlays. |

## Copy provenance — no new claim, no new resource

Every user-facing sentence in the affordance already existed in reviewed source. The PM granted exactly one new string for the trigger label (DECISION 1) and one for the bypass link; both are neutral nouns that assert nothing and name no resource.

| Rendered string | Source | Verbatim |
|---|---|---|
| `Help` (trigger label and region name) | new string, granted by the PM in DECISION 1 | n/a — replaces the earlier reuse of `copy.safety.title` |
| `Skip to help` (bypass link) | new string, UI chrome, mirroring the existing `Skip to active conversation` bypass | n/a |
| `If you or someone else may be harmed now, contact local emergency services or move to a safer place with a trusted person nearby.` | `server/safety.ts` → `violence_or_immediate_danger.responseText`, first sentence | yes, reproduced |
| `Emotional Friend is not monitored and cannot provide emergency care.` | `server/safety.ts` → same `responseText`, second sentence; identical in all four routed categories | yes, reproduced |
| `Close` | `src/copy.ts` → `copy.common.close` | yes, by reference |

The two reproduced sentences together are the complete reviewed `violence_or_immediate_danger` response text, split only across two paragraphs for presentation. No sentence was rewritten, shortened, softened, or recombined.

## Content boundary evidence

`tests/accessibility/persistent-help.test.tsx` asserts, against the affordance's full rendered text in the expanded state:

| Prohibited category | Assertion |
|---|---|
| Any digit | `not.toMatch(/\d/)` — stricter than "no phone-number-like sequence"; the affordance contains no digit at all |
| URL, domain, email | no `https?:`, `www.`, `.org`, `.com`, `.net`, `@` |
| Named service or resource | no `hotline`, `helpline`, `lifeline`, `crisis line`, `text line`, `dial`, `toll-free` |
| Region-specific content | no country, region, organisation, or emergency-number token from an explicit denylist |
| Monitoring / surveillance | no "we monitor/watch/track", "is being monitored", "someone is watching/reviewing/notified/alerted" |
| Rescue / dispatch | no "help is on the way", "we have alerted/notified/contacted/dispatched/reported", "emergency services have been…" |
| Diagnosis / treatment | no `diagnos*`, `treatment`, `prescri*`, `therapy`, `therapist`, `counsellor`, `clinician`, `psychiatr*` |
| Credential | no `licensed`, `certified`, `qualified`, `medical professional` |
| Clinical certainty | no "you are depressed/suicidal/at risk/in crisis", no "I can tell / noticed / detected / sense / see that you…" |
| Consciousness | no "I am alive/conscious/real/human/sentient", no "I feel", "I understand exactly", "I truly know" |
| Confidentiality | no `confidential`, `private and secure`, `encrypted`, `never shared`, `secret`, `anonymous` |
| Detection implication | no `detect*`, "we noticed/saw/found/flagged", "based on your…", "your messages/expression/camera/face/mood/emotion", "because you…", "this appeared/opened because…" |

The required boundary sentence is asserted positively, so it cannot be silently dropped. A further test asserts the affordance's text is byte-identical whether or not a routed `safety_support` message is present, which is the direct evidence that the affordance neither reacts to nor reveals routing.

## Completion-criteria to test mapping

| Packet completion criterion | Test(s) in `tests/accessibility/persistent-help.test.tsx` |
|---|---|
| Presence across every session state | `renders in the {initializing, anonymous, registered, guest (pre-expiry), guest-expired (post-expiry)} session state` (5 cases) plus `covers every declared session state in this suite`, which fails if a state is dropped from the table |
| Presence for failed reply, camera on or off | `renders unchanged for a failed reply, an empty chat, and camera on or off` (asserts a single distinct rendered text across all four variants) |
| Keyboard reachability | `is keyboard reachable and opens, dismisses, and recovers without loss`; `collapses on Escape and returns focus to the persistent trigger` |
| Accessible name and role | `exposes a stable accessible name, role, and collapsed disclosure state`; every query resolves the affordance by `role="region"` and name `Help` |
| Reduced-motion behavior | `remains operable when reduced motion is preferred` — behavioural open/close under mocked `prefers-reduced-motion`, plus a bounded CSS-block assertion and a source-order assertion proving the reduced-motion rule still overrides the affordance rule |
| Contrast tokens | `uses boundary and text tokens that meet the contrast targets` — computed ratios for `--color-control-border` vs `--color-surface`/`--color-canvas` (≥3:1) and `--color-text-primary`/`--color-text-secondary` vs `--color-surface` (≥4.5:1), plus assertions that the trigger, close control, and panel text actually consume those tokens |
| Dismiss and recover | `is keyboard reachable and opens, dismisses, and recovers without loss`; `collapses on Escape and returns focus to the persistent trigger` |
| Independence from routing and emotion state | `renders unchanged for a failed reply, an empty chat, and camera on or off`; `stays present and distinct while a routed safety response is shown`; `keeps identical content whether or not a safety response is present` |
| Negative test: renders when the router returns no route | `does not depend on the safety router producing a route` — asserts the routed safety card and its emergency control are absent while the affordance is present and enabled |
| Content test: prohibited language and phone-like digits | the five `content boundaries` tests listed in the table above |
| No storage / no event recorded | `invokes no action, records nothing, and touches no storage when opened` — asserts all 32 action props uncalled and `Storage.prototype.setItem`/`removeItem` and `fetch` unused |
| Operable without color, hover, motion, camera | `does not rely on color, hover, or motion to be understood` — visible text label, single decorative `aria-hidden` icon, `[hidden]` guard |
| Axe coverage of the new surface | `exposes a stable accessible name, role, and collapsed disclosure state` (collapsed) and `has no axe violations while expanded` |
| Reserved space rather than overlay | `reserves its own layout space instead of overlaying content` |
| Visible on arrival rather than below the fold | `pins the declarations that keep the strip inside the viewport` — a **source pin only**; the property itself is evidenced by the browser measurement in "Real-browser layout fix and re-measurement", not by any test |
| Does not disturb the TASK-08 shell contract | `is a sibling of the session experience and never nested in the shell` — asserts the affordance is outside `.ss-app` and that the skip link remains `.ss-app`'s first element child |

## TASK-08 assertion preservation

`tests/accessibility/app-view.a11y.test.tsx` was **not modified**. It is in the TASK-09 write scope, and no edit was needed: every TASK-08 assertion and every `axe` call remains exactly as TASK-08 left it, enabled and passing.

| Suite | TASK-08 record (`3a88836…`) | TASK-09 (`319d6e7f…`) | TASK-09 this revision | Delta vs TASK-08 |
|---|---|---|---|---|
| `tests/accessibility` + `tests/unit/client-session-lifecycle.test.ts` | 3 files, 24 tests passed | 4 files, 51 tests passed | 4 files, 52 tests passed | +1 file, +28 tests; 0 removed, 0 skipped |
| Full suite | 19 files passed / 1 skipped; 135 passed / 7 skipped / 142 total | 20 files passed / 1 skipped; 162 passed / 7 skipped / 169 total | 20 files passed / 1 skipped; 163 passed / 7 skipped / 170 total | +28 passing tests; skip count unchanged at 1 file / 7 tests |

The 1 skipped file and 7 skipped tests are the pre-existing skips recorded by TASK-08. TASK-09 did not add, remove, relabel, focus, or quarantine any skip, and no skip is presented as passing evidence.

Two existing accessibility assertions constrained the design and were deliberately protected rather than adjusted:

- `screen.getByRole("complementary", { name: /Get help now/i })` and `screen.getByRole("button", { name: /Contact local emergency services/i })` are singular queries against the routed `SafetyActionCard`. The affordance therefore uses landmark role `region` (not `complementary`) and exposes no control named `Contact local emergency services`, so both queries still resolve to exactly one element when a routed safety message is present.
- `expect(shell?.firstElementChild).toBe(bypass)` requires the keyboard bypass to remain the first child of `.ss-app`. The affordance is rendered as a sibling of `.ss-app`, after it, so the bypass ordering is untouched and the affordance is last in tab order rather than ahead of the bypass.

## Contrast calculations

sRGB relative luminance and WCAG contrast ratios, computed in-test from the token values in `src/styles/tokens.css`:

| Pair | Tokens | Ratio | Target |
|---|---|---|---|
| Trigger and close boundary vs panel/control fill | `--color-control-border` `#9585a2` vs `--color-surface` `#ffffff` | ≥ 3:1 (asserted) | 3:1 non-text |
| Trigger boundary vs affordance strip | `--color-control-border` `#9585a2` vs `--color-canvas` `#fcfaff` | ≥ 3:1 (asserted) | 3:1 non-text |
| Trigger label | `--color-text-primary` `#252233` vs `--color-surface` `#ffffff` | ≥ 4.5:1 (asserted) | 4.5:1 text |
| Panel body text | `--color-text-secondary` `#625d72` vs `--color-surface` `#ffffff` | ≥ 4.5:1 (asserted) | 4.5:1 text |

These are token-level calculations, not rendered-pixel measurements. Rendered contrast remains a pending manual gap, as below.

## Acceptance command record

The complete packet sequence was run **exactly once, in packet order**, on the clean committed code-under-test revision `0154b09e0cba42cbeae7cc37c1f56f7ba734b28d`.

| # | Command | Exit | Recorded result |
|---|---|---|---|
| 1 | `node --version` | 0 | `v24.3.0` |
| 2 | `npm --version` | 0 | `11.4.2` |
| 3 | `npm ci --offline` | 0 | 511 packages added, 512 audited in 6s; 84 funding notices; 0 vulnerabilities; 2 deprecation warnings (`node-domexception@1.0.0`, `glob@10.5.0`) |
| 4 | `npm run typecheck` | 0 | `tsc -b --pretty false` completed with no diagnostics |
| 5 | `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` | 0 | test_files_passed=4 test_files_total=4; tests_passed=50 tests_failed=0 tests_skipped=0 tests_total=50; duration 1.20s |
| 6 | `npm run test` | 0 | test_files_passed=20 test_files_skipped=1 test_files_total=21; tests_passed=161 tests_failed=0 tests_skipped=7 tests_total=168; duration 2.53s |
| 7 | `npm run build` | 0 | 1,909 modules transformed; 9 emitted artifact entries; built in 498ms; one advisory block for 2 chunks over 500 kB (`917.69 kB`, `1,314.50 kB` before gzip); CSS bundle `47.99 kB` |
| 8 | `git status --short` | 0 | no output; entries=0 |
| 9 | `git diff --check` | 0 | no output |

### Pre-acceptance working-tree history (preserved, not relabeled)

Before the acceptance sequence, and before any commit, the following commands whose text matches packet acceptance commands were invoked against the **uncommitted, incomplete working tree**. They were environment reconnaissance and a development install, not an acceptance run, and they are recorded here rather than folded into the table above. A process exit interrupted the session partway through implementation; nothing had been committed at that point.

| Command | When | Exit | Result |
|---|---|---|---|
| `node --version` | environment reconnaissance | 0 | `v24.3.0` |
| `npm --version` | environment reconnaissance | 0 | `11.4.2` |
| `npm run typecheck` | before `node_modules` existed | non-zero (exact code not captured) | failed with `sh: tsc: command not found`; this is a preserved failure, not a pass |
| `npm ci --offline` | development install so implementation could proceed | 0 | 511 packages added, 512 audited in 4s; 84 funding notices; 0 vulnerabilities; 2 deprecation warnings |
| `git status --short` | 3 invocations during diff review, re-orientation, and staging | 0 | showed the uncommitted working tree, then the staged change set |

`npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts`, `npm run test`, `npm run build`, and `git diff --check` were **never** invoked before the acceptance sequence. Development iteration deliberately used non-packet command forms (`npx tsc -b --pretty false`, `npx vitest run …`, `npx vite build`) so the packet forms stayed unused until the single acceptance run. Two intermediate `npx vitest run tests/accessibility/persistent-help.test.tsx` iterations are also part of that history: the first exited 1 with 25 of 26 tests passing because a CSS-block marker in the new test matched the pre-existing `.ss-auth, .ss-app, .ss-expired` rule instead of the new reserve rule; the marker was made unique and the file then passed 26 of 26. That failure is preserved, not erased.

### Second acceptance run (this revision)

The first acceptance sequence above accepted revision `0154b09e0cba42cbeae7cc37c1f56f7ba734b28d`. Independent review of the evidence revision `75a09ce` returned FAIL, the PM issued DECISION 1 and DECISION 2 and assigned a reduced fix set, and the code changed. The sequence was therefore run **once more, in packet order and in full**, on the new clean committed code-under-test revision `319d6e7f31dcfeb1874df4071c8fdc1eb1d6ab49`. This is a second acceptance of a different revision, not a re-run of the first; both records stand.

| # | Command | Exit | Recorded result |
|---|---|---|---|
| 1 | `node --version` | 0 | `v24.3.0` |
| 2 | `npm --version` | 0 | `11.4.2` |
| 3 | `npm ci --offline` | 0 | 511 packages added, 512 audited in 5s; 84 funding notices; 0 vulnerabilities; 2 deprecation warnings (`node-domexception@1.0.0`, `glob@10.5.0`) |
| 4 | `npm run typecheck` | 0 | `tsc -b --pretty false` completed with no diagnostics |
| 5 | `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` | 0 | test_files_passed=4 test_files_total=4; tests_passed=51 tests_failed=0 tests_skipped=0 tests_total=51; duration 1.23s |
| 6 | `npm run test` | 0 | test_files_passed=20 test_files_skipped=1 test_files_total=21; tests_passed=162 tests_failed=0 tests_skipped=7 tests_total=169; duration 2.50s |
| 7 | `npm run build` | 0 | 1,909 modules transformed; 9 emitted artifact entries; built in 516ms; one advisory block for 2 chunks over 500 kB (`918.06 kB`, `1,314.50 kB` before gzip); CSS bundle `48.13 kB` |
| 8 | `git status --short` | 0 | no output; entries=0 |
| 9 | `git diff --check` | 0 | no output |

Development iteration for this revision used `./node_modules/.bin/tsc` and `./node_modules/.bin/vitest` only. No `npx` invocation was made in this round, per the PM's standing boundary. One deliberate mutation test was run and reverted: the panel boundary sentence was temporarily altered to confirm the new drift guard fails on drift; it did, and `src/components/AppView.tsx` was restored before the acceptance sequence.

### Third acceptance run (this revision)

The below-the-fold defect was fixed and the sequence was run **once more, in
packet order and in full**. Two things differ from the two runs above and both
are stated rather than smoothed over.

First, this run was made against the **working tree containing the fix, before
it was committed**, so command 8 legitimately reports two modified files instead
of no output; the earlier runs were made after committing and reported a clean
tree. That tree was then committed **unchanged** as
`aacd6a2aa3ab95f6fbff7c1b330665faf8c598d0`, which is therefore the code-under-test
revision for this round: the two files listed by command 8 are exactly the two
files in that commit, and no source file was touched between the run and the
commit. Second, two output details were not retained from the captured tail —
`npm ci`'s package counts and the build's module count — and are left blank
rather than copied forward from the previous run.

| # | Command | Exit | Recorded result |
|---|---|---|---|
| 1 | `node --version` | 0 | `v24.3.0` |
| 2 | `npm --version` | 0 | `11.4.2` |
| 3 | `npm ci --offline` | 0 | 84 funding notices; 0 vulnerabilities. Package counts not retained from the captured output |
| 4 | `npm run typecheck` | 0 | `tsc -b --pretty false` completed with no diagnostics |
| 5 | `npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts` | 0 | test_files_passed=4 test_files_total=4; tests_passed=52 tests_failed=0 tests_skipped=0 tests_total=52; duration 1.42s |
| 6 | `npm run test` | 0 | test_files_passed=20 test_files_skipped=1 test_files_total=21; tests_passed=163 tests_failed=0 tests_skipped=7 tests_total=170; duration 2.62s |
| 7 | `npm run build` | 0 | built in 521ms; one advisory block for 2 chunks over 500 kB (`918.06 kB`, `1,314.50 kB` before gzip); CSS bundle `48.21 kB`. Module count not retained |
| 8 | `git status --short` | 0 | entries=2 — ` M src/styles/app-view.css`, ` M tests/accessibility/persistent-help.test.tsx`. The documentation changes in this revision were written after this run |
| 9 | `git diff --check` | 0 | no output |

Development iteration for this revision used `./node_modules/.bin/vite` only, to
serve the app for the browser measurement. No `npx` invocation was made. The
browser work used `/Applications/Google Chrome.app` directly over the DevTools
protocol and installed nothing.

## Contract and privacy review

- No frozen interface changed. `server/safety.ts`, `SAFETY_POLICY_VERSION`, `SAFETY_COPY_VERSION`, the router, the category schema, the `safety_support` response metadata, the provider interface, prompts, and the auth/session/message/camera schemas are untouched; `git diff` over `server/`, `src/copy.ts`, `src/App.tsx`, `package.json`, and `package-lock.json` is empty.
- No dependency, lockfile, configuration, or governance file changed. One import was added: `CircleHelp` from the already-depended-on `lucide-react`, chosen so the permanent strip does not wear the routed `SafetyActionCard`’s `ShieldCheck` identity (DECISION 1). No dependency was added to do it.
- No new crisis resource, phone number, hotline, service name, URL, or regional content was introduced, and the content tests fail if one ever is.
- No monitoring, rescue, dispatch, diagnosis, treatment, clinical-certainty, credential, consciousness, or confidentiality claim was introduced.
- No real or private personal, health, emotional, conversation, account, camera, credential, secret, production, or provider data was used. All fixtures are synthetic.
- No network call, provider call, cloud execution, connector, deployment, publication, push, merge, billing, or repository-visibility change occurred.
- `UI Mockup/web-app-ui-design-brief/` was never read, modified, staged, or referenced.
- One read outside the literal packet read scope is declared: `src/copy.ts`, which `src/components/AppView.tsx` imports. It was inspected to reuse existing reviewed copy constants rather than author new strings. It was not modified and is not in the write scope.

## Disposition of the independent review of `75a09ce`

Independent review returned FAIL (0 Critical, 3 High, 5 Medium, 7 Low). The PM then reduced the scope to a minimal fix set and directed which findings to leave open. Everything below is stated as it stands, including what was deliberately not done.

| Finding | Disposition |
|---|---|
| H-1 — the "cannot drift silently" claim was false | **Fixed.** A drift guard in `persistent-help.test.tsx` reads `server/safety.ts` and asserts the panel's two rendered paragraphs, joined by a single space, equal the `violence_or_immediate_danger` `responseText`. The false claim is corrected in this document and in the handoff. The guard was verified by mutation: altering the client boundary sentence failed the test, and the source was restored. |
| H-2 — inert while a modal dialog is open, untested | **Documented, not fixed and not tested.** The PM scoped modal-state tests out of this round. The occlusion-only note is replaced by an accurate one: every such dialog traps focus and sets `aria-modal="true"`, so the trigger is neither keyboard-reachable nor exposed to assistive technology until dismissed, and no test exercises any modal state. |
| H-3 — governance | **Not acted on.** The PM took this to the owner and instructed the implementation agent not to act. |
| M-1 / M-2 — label identity and the monitoring line | **Fixed by PM decision.** DECISION 1 replaced the trigger label with the neutral noun `Help` and changed the icon to `CircleHelp`; DECISION 2 removed `copy.safety.monitoring` from the panel. |
| M-3 — the fixed 56px reserve under-reserves on a device with a home indicator | **Fixed.** `--help-affordance-space` is now derived from the strip's own parts, including `max(var(--space-1), env(safe-area-inset-bottom))`. No test evaluates CSS `calc`, so the rendered result is still unverified. |
| M-4 — trigger last in tab order | **Fixed.** A `Skip to help` bypass link focuses the trigger. It is not covered by a dedicated test in this round. |
| M-5 — surfaces outside the write scope | **Open.** `src/App.tsx` and `src/main.tsx` are outside the packet write scope; carried as residual risk. |
| L-1 — per-group test counts are wrong | **Not fixed, by PM instruction.** The four-group breakdown in the handoff still reflects the 26-test revision and is explicitly flagged there as not recounted. The totals in this document are the real measured numbers. |
| L-5 — `sendBeacon` not spied | **Not fixed, by PM instruction.** The no-side-effect test still spies `fetch`, `Storage.prototype.setItem` and `removeItem` only. |
| Remaining Low findings | **Not addressed in this round.** The PM's instruction was minimal-only; they are neither fixed nor withdrawn. |

## Judgment calls a reviewer should examine

These are design decisions the implementation agent made and cannot self-accept.

1. **Persistent-label tone — escalated and resolved.** The trigger originally reused `copy.safety.title` = `Get help now`. That was escalated and the PM overruled it in DECISION 1: the label is now the neutral noun `Help` with a `CircleHelp` icon, because a permanent strip wearing the routed card's exact label and `ShieldCheck` erodes the distinction the packet requires, and a permanent imperative gets habituated. This is recorded as a resolved escalation, not an agent decision.
2. **Reproducing server copy in the client.** Two sentences from `server/safety.ts` are reproduced as client literals. They are unversioned presentation text, not a copy constant. A drift guard in `persistent-help.test.tsx` reads `server/safety.ts` at test time and asserts that the panel's two rendered paragraphs, joined by a single space, equal the `violence_or_immediate_danger` `responseText` verbatim, so an edit to either side alone fails the suite. That guard is the whole of the protection and its limits should be read literally: it covers only that one category's text, it does not check the boundary sentence against the other three categories, and it cannot stop a simultaneous edit to both sides. A reviewer may still prefer that this text be sourced from a single shared location; that would be a contract-adjacent change and was not made.
3. **Dismissal reading.** The packet requires the affordance to be dismissible if it occupies persistent visual space, yet also requires it to be present at all times and not permanently removable. This was resolved as: the disclosure panel is dismissible; the compact trigger is permanent and reserves `--help-affordance-space`. A reviewer may disagree with that balance.
4. **Presence on `anonymous` and `initializing`.** The packet enumerates registered, guest, pre-expiry, and post-expiry. The affordance also renders on the sign-in and loading screens, which is broader than enumerated. Availability was prioritised.
5. **Layout reserve.** Reducing every full-viewport layout by `--help-affordance-space` is the mechanism that keeps the affordance from obscuring the composer, send control, or auth actions. It changes global layout heights. This was verified only by token/CSS assertions at the time it was written, and browser measurement later showed the reserve was **not sufficient on its own** — being a `min-height`, it did nothing when a screen was taller than the viewport, and the strip fell below the fold at every mobile width. See "Defect found" and the fix section that follows it. Its rendered effect on the signed-in screens, at 200% zoom, and on physical mobile is still unverified.
6. **Auth screen made its own scroll container.** The fix gives `.ss-auth` a fixed height and `overflow-y: auto`, so its content scrolls inside it rather than scrolling the page. That is the change that removes the overlay/occlusion trade-off, and it is verified in Chrome at four viewports — but it also changes mobile scrolling behaviour in a way headless Chrome cannot show, since a page that scrolls its own body lets a mobile browser collapse its toolbar and an inner scroll container generally does not. A reviewer may want this looked at on a physical device.

## Remaining manual and platform gaps

All of the following remain **pending**, inherited from TASK-08 and extended to the new surface. None was performed for this task, and no automated result substitutes for them:

- VoiceOver with Safari, and NVDA with Firefox or Chrome, including how the new `region` landmark and disclosure state are announced.
- iOS VoiceOver and Android TalkBack, touch target, software keyboard, and safe-area behaviour for the affordance strip and panel.
- Latest-two-major Chrome, Firefox, Safari, and Edge keyboard and browser coverage.
- ~~Exact 320 CSS px, exact 390 × 844, 200% zoom, increased text spacing, and long-content reflow~~ — **partly closed.** 320 × 800, 390 × 844, 640 × 800 (1280 at 200% zoom) and 1280 × 800 were measured in headless Chrome: no horizontal overflow, and the panel's `min(360px, 100vw - 32px)` width lands fully inside the viewport at all four. Increased text spacing and long-content reflow remain untested, and all of this is Chrome only.
- Manual `prefers-reduced-motion`, forced-colors/high-contrast, and visible/unobscured focus review.
- **Modal states are entirely untested.** The affordance is inert while any modal dialog is open — sign-out, delete-message, edit-and-resend, and the mobile camera-denied sheet all trap focus and set `aria-modal="true"` — so the trigger is neither keyboard-reachable nor exposed to assistive technology until the dialog is dismissed. The PM scoped modal-state tests out of this round; no test covers any of them.
- Rendered contrast measurement. Only token-level ratios were computed.
- Confirmation in a real browser that the strip does not overlay the composer, send control, or guest banner. **Still open for the signed-in states**, which need credentials this session must not use. Now closed for the pre-sign-in auth actions: zero occluded focusables at four viewports, on arrival and scrolled to the end.
- Physical-camera lifecycle remains untested and is expressly forbidden for this task.

## Human-gate boundary

This implementation agent does not self-accept. A fresh independent reviewer must inspect the exact final SHA. TASK-09 does not approve D-5, RG-05, Gate C, release, publication, or deployment, and it does not remediate FR-5: the safety router is unchanged and its measured 82.9% residual routing false-negative rate stands. This task only reduces the cost of a false negative by making a calm, non-clinical, location-neutral help path reachable without detection succeeding.

## Real-browser layout evidence, 2026-08-29 (owner-approved manual experiment)

First evidence for this task from an engine that performs layout. Every prior
number came from jsdom, which does not.

**Method.** Local Vite dev server on `localhost:5199` from this worktree at
`6290c5f`. Headless Chrome 151.0.7922.174 driven over the DevTools protocol from
a throwaway profile. Firebase configured with synthetic placeholder values and
`VITE_USE_FIREBASE_EMULATORS=true` pointed at `127.0.0.1:9099` / `127.0.0.1:8080`
where nothing listens, so the SDK targets loopback only and no request reaches
any external service. No credential, no `.env` read, no provider call, no npx,
no network install. Screen under test is the pre-sign-in auth screen, which is
the state the affordance's detection-independence claim most depends on.

### Confirmed

| Property | Result |
|---|---|
| App renders in a real engine at 390×844, 320×800, 1280×800, 640×800 | yes, all four |
| Affordance present pre-sign-in | yes, all four |
| Trigger accessible name | `Help` |
| `aria-expanded` at rest / panel `hidden` | `false` / `true` |
| Bypass link present, position in tab order | yes, **tab stop 1** |
| Trigger reachable by keyboard | yes, tab stop 11 of 11 |
| Horizontal overflow at 320 CSS px | none (`scrollWidth` == viewport at every size) |
| `--help-affordance-space` resolves | `calc(1px + 4px + 44px + max(4px, 0px) + 3px)` → **56px** |
| Same arithmetic with a 34px safe area substituted | **86px**, against a 56px strip |

The M-3 safe-area fix is arithmetically sound: the reserve grows with the inset
rather than staying at a fixed 56px. Note the limit — headless Chrome on macOS
reports `env(safe-area-inset-bottom)` as 0, so the 86px figure comes from
substituting 34px into the same expression, not from observing an iOS inset.

### Defect found: the affordance was below the fold at mobile widths

Measured at `6290c5f`, before the fix. Superseded by the section below, which
records the same measurement after it. Kept because it is the evidence the fix
was built against.

| Viewport | Affordance top | Viewport height | Visible without scrolling |
|---|---|---|---|
| 390×844 | 856 | 844 | **no**, 12px below |
| 320×800 | 918 | 800 | **no**, 118px below |
| 640×800 (= 1280 at 200% zoom) | 800 | 800 | **no**, exactly at the edge |
| 1280×800 | 744 | 800 | yes |

Diagnosis. `.ss-help-affordance` is `position: relative`, in normal flow, as the
last sibling after `<main class="ss-auth">`. The reserve at `app-view.css:2476`
sets `min-height: calc(100dvh - var(--help-affordance-space))`, which is a
*minimum*: it stops the shell collapsing and overlaying the strip, but does
nothing when content is *taller* than the viewport. At 390px the auth `main` is
856px tall on its own, so the strip is pushed past the fold. The page scrolls
(`scrollHeight` 912), so the affordance is **reachable** — by scrolling, and by
the bypass link at tab stop 1, which focuses and scrolls it into view — but it
is **not visible** on arrival at mobile widths.

This is exactly the class of defect jsdom cannot detect. The suite's presence
assertions are all true; they are DOM assertions, and the element is in the DOM.

Characterisation at `6290c5f`: the affordance was **present and reachable in
every non-modal state, and visible without scrolling only when the screen's
content fit the viewport.** It was not visible on arrival at 390px, 320px or
640px on the auth screen. **This no longer describes the code**; see below.

## Real-browser layout fix and re-measurement, 2026-08-29 (`aacd6a2`)

The owner's decision on the defect above was to make the affordance visible on
arrival. This section records the change and the measurement that checks it.

**Method.** Identical to the section above and re-run from scratch: local Vite
dev server on `localhost:5199` from this worktree, headless Chrome
151.0.7922.174 over the DevTools protocol from a throwaway profile, Firebase
given synthetic placeholder values with `VITE_USE_FIREBASE_EMULATORS=true`
pointed at `127.0.0.1:9099` / `127.0.0.1:8080` where nothing listens, so the SDK
targets loopback only and no request reaches any external service. No
credential, no `.env` read, no provider call, no npx, no network install. Screen
under test is again the pre-sign-in auth screen. The pre-fix numbers in the
section above were reproduced exactly on the unmodified tree before anything was
changed, so the two tables are the same measurement either side of one edit.

### What changed

Two rules in `src/styles/app-view.css`, inside the existing TASK-09 block. No
change to `AppView.tsx`, to `tokens.css`, to any copy, or to any TASK-08 file.

1. `.ss-help-affordance` moves from `position: relative` to
   `position: sticky; bottom: 0`.
2. `.ss-auth` is given `height: calc(100dvh - var(--help-affordance-space))` and
   `overflow-y: auto`.

The second rule is what actually fixes the defect, and it is worth being precise
about why the first one alone does not. Sticky on its own does make the strip
visible at every width, but it then paints over whatever is at the bottom of the
viewport: measured with sticky and nothing else, it occluded `Privacy notice`
and `Terms` at 390 and 640, and the `Create an account` button at 320 — each one
returning `section.ss-help-affordance` from `document.elementFromPoint` at its
own centre. Visible-on-arrival was bought by occluding controls, which is not an
acceptable trade.

Sizing the auth screen to the reserve and giving it its own scrolling removes
that trade. The screen's content scrolls inside the screen instead of pushing
the page, so the strip sits in normal flow beneath a box that cannot displace
it, and there is nothing for it to overlay. The auth screen is the one that
needed this because its card drops `max-height` and `overflow` below 768px and
lets the page scroll instead.

`position: sticky` is kept as a second line of defence rather than reverted. It
is inert in every configuration measured below, and the evidence for keeping it
is in "The sticky rule is not decorative" further down.

### Confirmed after the fix

| Viewport | Strip top | Strip bottom | Viewport height | Visible on arrival | Fully in viewport |
|---|---|---|---|---|---|
| 390×844 | **788** | 844 | 844 | **yes** | yes |
| 320×800 | **744** | 800 | 800 | **yes** | yes |
| 640×800 | **744** | 800 | 800 | **yes** | yes |
| 1280×800 | **744** | 800 | 800 | **yes** | yes |

Against the pre-fix tops of 856, 918, 800 and 744. The strip now ends exactly on
the viewport's bottom edge at all four sizes, and the trigger inside it
hit-tests to itself at its own centre at all four.

Occlusion, checked as the owner specified — for every focusable, either its
painted rect does not intersect the strip, or `document.elementFromPoint` at the
centre of its painted rect still returns that element:

| Viewport | Focusables | Occluded on arrival | Occluded scrolled to the end | Unreachable |
|---|---|---|---|---|
| 390×844 | 11 | **0** | **0** | 0 |
| 320×800 | 11 | **0** | **0** | 0 |
| 640×800 | 11 | **0** | **0** | 0 |
| 1280×800 | 11 | **0** | **0** | 0 |

"Painted rect" matters here and an earlier version of this probe got it wrong.
`getBoundingClientRect` keeps reporting a geometric position for content that a
scroll container has clipped away, so a naive rect test called three controls
occluded when they were simply scrolled out of view. The probe now intersects
each element's rect with the viewport and with every clipping ancestor first,
and treats a clipped-away element as off-screen rather than occluded. Both
readings are in the run log; the corrected one is what is reported here.

Also confirmed at every one of the four sizes:

| Property | Result |
|---|---|
| Horizontal overflow at 320 CSS px | none — `scrollWidth` == `clientWidth` == 320, `body.scrollWidth` 320 |
| Horizontal overflow with the panel open | none at any width |
| Document itself scrolls | no — `scrollHeight` == `clientHeight` (844/844, 800/800) |
| Every focusable, once focused, is painted and hit-tests to itself | 11 of 11 |
| Disclosure panel, opened, lands fully inside the viewport | yes (390: 585–787, 320: 521–743, 640 and 1280: 541–743) |
| Bypass link reaches its focused position | yes, `translateY(0)`, rect top 12 |

The focus walk needed two corrections to be worth anything: transitions
suppressed for the walk, so a focus transform is read at its end state rather
than mid-animation, and CDP `Emulation.setFocusEmulationEnabled`, without which
headless Chrome never applied `.ss-skip-link:focus` and the bypass link
reported a false failure at all four sizes.

Where the auth screen's content exceeds the reserve it now scrolls inside
itself: 856 of content in a 788 box at 390, 918 in 744 at 320, 800 in 744 at
640, and 744 in 744 at 1280, which does not scroll at all. Nothing is clipped —
the `unreachable` column above is 0 everywhere, and the focus walk brings each
of the previously below-the-fold controls into view.

### The sticky rule is not decorative

Since the heights make the document not scroll, sticky never engages in any
configuration above, so keeping it needs an argument. The realistic failure it
covers is a real device where `dvh` lags a collapsing browser toolbar and the
page scrolls anyway — which headless Chrome cannot reproduce. That condition was
instead simulated directly, by overriding `.ss-auth` back to `height: auto` at
runtime and re-measuring:

| Viewport | Document scrolls | Strip top, `sticky` | Strip top, forced back to `relative` |
|---|---|---|---|
| 390×844 | yes | **788, visible** | 856, below the fold |
| 320×800 | yes | **744, visible** | 918, below the fold |
| 640×800 | yes | **744, visible** | 800, below the fold |
| 1280×800 | no | 744, visible | 744, visible |

The `relative` column reproduces the original defect numbers exactly, which is
what makes this a real test of the rule rather than an assertion about it.

### Why `.ss-expired` and `.ss-loading-screen` were left alone

The height-plus-overflow rule is applied only to `.ss-auth`. Extending it to the
other screens was tried and rejected on evidence. `.ss-expired` relies on
`overflow: hidden` to clip two decorative pseudo-elements; making it a
fixed-height scroller turned those into roughly 200px of empty scrollable space
— a synthetic reconstruction of that screen's markup against the real stylesheet
reported `scrollHeight` 944 against `clientHeight` 744 at every width, while its
card content was only 374–481px tall. `.ss-loading-screen` is a short block that
does not overflow. Both keep the `min-height` reserve, and the sticky rule
covers them if they ever do overflow.

Note the limit: that reconstruction is hand-built from the JSX and `src/copy.ts`,
not the real component, because reaching the guest-expired state needs a session
this run must not create. It is good enough to reject a change; it is not
evidence about how that screen renders.

### Regression test added

One test in `tests/accessibility/persistent-help.test.tsx`, `pins the
declarations that keep the strip inside the viewport`. It asserts the `.ss-auth`
height and `overflow-y`, and `position: sticky` with `bottom: 0` on the strip.

**It is a source pin, not a layout proof, and should not be read as one.** jsdom
performs no layout, so nothing in the suite can observe where the strip renders;
a jsdom test that claimed to would be a test that cannot fail for the right
reason. What this one does is fail if either declaration that the browser
measurement showed to be load-bearing is deleted. The property itself —
visible on arrival, occluding nothing — is checkable only in an engine that lays
out, and the measurements above are the only evidence for it.

### Still unverified after this experiment

Unchanged from the section above, and none of it is closed by this fix:
VoiceOver/Safari and NVDA announcement behaviour; iOS and Android physical
devices and a real non-zero safe-area inset, still substituted arithmetically
rather than observed; Safari and Firefox engines, where `dvh`, sticky and
`env(safe-area-inset-bottom)` differ most from Chrome; software-keyboard
behaviour; rendered-contrast measurement; increased text spacing;
`prefers-reduced-motion` and forced-colors.

Two gaps are specific to this change and worth stating plainly:

- **The signed-in screens were not measured.** Reaching them needs credentials
  this session must not use. `.ss-app` was already `height: calc(100dvh -
  var(--help-affordance-space))` with `overflow: hidden` and was not modified,
  so the composer, send control and guest banner overlap question is unchanged
  by this fix — but it is also still unanswered, and it is the question the
  reserve exists for.
- **Making the auth screen its own scroll container changes mobile scrolling
  behaviour.** A page that scrolls its own body lets a mobile browser collapse
  its toolbar; an inner scroll container generally does not. That is a real
  behavioural difference on a physical device, it was not measured, and a
  reviewer may reasonably want it looked at before this ships.

Physical camera remains forbidden and untested.

## Signed-in screen layout evidence, 2026-08-30 (owner-approved emulator experiment)

This closes the gap this document previously recorded as open: the signed-in
screens had never been measured, so composer overlap was an open question.

**Method.** Firebase Auth and Firestore emulators, project
`demo-emotional-friend-ui`, started with `firebase-tools@15.26.0` — the version
already pinned in this repository's `test:rules` script. No production
credentials, no real data, no production project. One synthetic account,
`layout-check@example.test`. Vite dev was given the `VITE_FIREBASE_*` values as
inline process environment variables, so **no `.env` file was created** and the
working tree stayed clean. Chrome 151 headless driven over CDP with
`Emulation.setFocusEmulationEnabled`. Code under test: `main` at `1c3110d`.

**State under test.** Signed in, one chat, 5 messages rendered. The message log
was genuinely overflowing — `scrollHeight` 1334 against `clientHeight` 567 — so
the scroll container was full rather than empty. Four viewports were each
measured in four states: scrolled to end, scrolled to top, composer grown to its
maximum by a long draft, and composer focused.

**Result: the affordance and the composer do not overlap in any measured state.**

| Viewport | strip top | viewport h | visible on arrival | fully in viewport | composer | strip/composer overlap | occluded focusables |
|---|---|---|---|---|---|---|---|
| 390×844 | 788 | 844 | yes | yes | 667–788, 491–788 grown | none | 0 |
| 320×800 | 744 | 800 | yes | yes | 623–744, 447–744 grown | none | 0 |
| 640×800 | 744 | 800 | yes | yes | 623–744, 449–744 grown | none | 0 |
| 1280×800 | 744 | 800 | yes | yes | 576–744, 456–744 grown | none | 0 |

The composer's bottom edge equals the strip's top edge exactly at every width, in
every state: they abut and never intersect. The strip top values are identical to
the pre-sign-in figures already recorded above, so the reserve behaves the same
on both sides of authentication.

The message log shrinks correctly when the composer grows — 609px tall to 433px
at 390×844 — and `logOverlapsComposer` was false in all sixteen measurements. The
help panel opened fully inside the viewport at all four widths. No horizontal
overflow at any width, panel open or closed.

**Two measurement errors, made and corrected.** Both inflated the occlusion count
before correction, and both are recorded because the corrected number is only
meaningful with them stated.

1. The first probe clamped each control's test point to the viewport edge, so a
   control scrolled above the fold was tested at y=1 and reported as covered by
   the header, and one below the fold was reported as covered by the textarea.
   Focus recovery exposed it: the flagged elements had rects at y=-609, -370,
   -302 and -63, outside the viewport entirely.
2. Removing the clamp was not enough. `getBoundingClientRect` still reports
   geometry for content clipped by an ancestor's `overflow`, so controls scrolled
   out of `.ss-message-log` still produced in-viewport centres while the painted
   pixel belonged to whatever was actually there. The final probe judges a
   control only when its centre lies inside the viewport **and** inside the
   client box of every scrollable ancestor.

Under the corrected probe the occlusion count is **0 in all sixteen
measurements**, with 7 to 20 controls actually judged per state.

**Still not verified.** Safari and Firefox, physical iOS and Android devices, a
non-zero safe-area inset, software-keyboard behaviour, mobile toolbar collapse,
and screen-reader announcement all remain unverified, exactly as recorded above;
the emulator changes none of them. One further limit specific to this run: the
generation API was not running, so the messages rendered in the `failed` state.
A conversation containing completed assistant replies, which produces different
bubble heights, was not measured.

## Cross-engine and environment evidence, 2026-08-30

Executed by the PM against `main` at `07adbef` with the emulator setup in
`docs/qa/MANUAL-TEST-RUNBOOK.md`. Firestore ran on 8099 because a macOS process
already held 8080; `firebase.json` was not modified, a scratch config was used.

### T2 — Firefox 153.0.4, Gecko

Driven over WebDriver BiDi. `browsingContext.setViewport` sets an exact CSS
viewport, so **320 CSS px was reached precisely** — the measurement TASK-05
recorded as unobtainable in its environment.

Auth screen and signed-in screen, four viewports each, four states signed in
(scrolled to end, scrolled to top, composer grown, composer focused). Signed in
carried 7 messages with the log genuinely overflowing, `scrollHeight` 2163
against `clientHeight` 612, and the composer grew from 670–788 to 494–788.

| Viewport | strip top | viewport h | visible on arrival | fully in viewport | strip/composer overlap | occluded |
|---|---|---|---|---|---|---|
| 390×844 | 788 | 844 | yes | yes | none | 0 |
| 320×800 | 744 | 800 | yes | yes | none | 0 |
| 640×800 | 744 | 800 | yes | yes | none | 0 |
| 1280×800 | 744 | 800 | yes | yes | none | 0 |

**Gecko matches Blink exactly**, on both sides of authentication, in all 24
measurements. No horizontal overflow at 320. The panel fits at every width.

### T8 — prefers-reduced-motion: reduce

Panel opens (`aria-expanded` true, height 202), is reachable, fits the viewport,
and closes again. Transition duration resolves to 1e-05s under `reduce` and to
0s without it: the panel has no motion either way, so nothing is animated and
nothing is lost when motion is suppressed.

### T9 — forced-colors: active (pre-check only)

Under Chrome's emulation the strip renders black with a 1px solid white top
border, and the trigger renders white on black with a border. The boundary that
is faint in the default palette becomes high-contrast here. This is a pre-check;
acceptance still requires a real Windows contrast theme.

### T10 — increased text spacing, WCAG 1.4.12

Line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing
2em. Strip position unchanged at 788/844, still fully in the viewport, no
horizontal overflow introduced, and **0 clipped elements**.

### T12 — exact 320 CSS px and 200% zoom

320×800: strip 744, fully in viewport, no horizontal overflow. 1280×800 at 200%
zoom, which is a 640×400 CSS viewport: strip top 344 against a 400 viewport,
fully in, no overflow. Both closed in Blink and, for 320, in Gecko too.

### T11 — rendered contrast, sampled from actual painted pixels

Screenshots were captured over CDP and the PNG decoded in-process, so these are
measured pixels rather than computed style values.

| Pair | Sampled | Ratio | AA threshold | |
|---|---|---|---|---|
| Trigger text vs its fill | `#252233` on `#ffffff` | 15.49:1 | 4.5 | pass |
| Focus ring vs strip fill | `#4e2bc5` on `#fcfaff` | 8.18:1 | 3.0 | pass |
| Trigger pill border vs strip fill | `#9585a2` on `#fcfaff` | 3.29:1 | 3.0 | pass, thin margin |
| Strip top border vs page above | `#e6e0ef` on `#fcfaff` | 1.24:1 | 3.0 | see below |

The focus ring measured at the pixel level is `rgb(78, 43, 197)` solid 2px with a
2px offset, which is exactly the `2 px #4E2BC5` ring with `2 px` offset the
manual checklist requires. Confirmed rather than inferred from source.

**One observation for the owner, not a conformance claim.** The strip's fill is
the same colour as the page above it, `#fcfaff` against `#fcfaff`, a ratio of
1.00, and the only painted separation is a single row of `#e6e0ef` at 1.24:1.
SC 1.4.11 applies to visual information *required to identify* a component, and
the interactive component here is the trigger, which is identified by its own
pill border at 3.29:1 and its text at 15.49:1. On that reading the strip's outer
edge is a design question rather than a failure. Two things make it worth
recording anyway: the strip is a persistent safety affordance whose visual
separateness carries meaning, and the 3.29:1 that carries conformance has very
little headroom — a small palette change would push the trigger border below 3:1.

### Two sequencing errors, made and corrected

Both are the same underlying mistake and are recorded because the passing
results depend on having found them.

1. The first Firefox signed-in run reported clean numbers that were worthless:
   `.ss-message-log` was absent and the "composer grown" state had the same rect
   as the resting state. Typing and submitting had been issued in a single
   evaluation, so React's batched state update had not landed and the submit saw
   an empty composer. Chrome had tolerated this by timing accident. Splitting
   type and submit into separate turns produced 7 real messages.
2. The first reduced-motion check reported the panel as unreachable with
   `aria-expanded` still false, because it clicked and measured in one turn.
   Measured a turn later, the panel opens correctly.

### Not done, and why

| Test | Status |
|---|---|
| T1 Safari | **Blocked on a setting.** safaridriver refuses: "You must enable 'Allow remote automation' in the Developer section of Safari Settings." That is a persistent change to the owner's browser and was not made. |
| T3 iOS | **No simulator runtime installed.** `xcrun simctl list devices available` returns none. Installing one is a large download and a change to the machine. |
| T4 Android | No `adb` on the machine. |
| T5–T7 VoiceOver, NVDA | Not automatable and, for NVDA, needs Windows. |
| T9 acceptance | Needs a real Windows contrast theme. |

### T1 — Safari 26.6.2, WebKit 605.1.15 (owner enabled remote automation)

Driven over safaridriver after the owner enabled Safari → Settings → Developer →
Allow remote automation. This is the engine the whole fix depends on: `100dvh`,
`position: sticky`, and `env(safe-area-inset-bottom)` all diverge here.

Auth screen, four viewports; signed in, four viewports × four states, with 7
messages and the log genuinely overflowing at `scrollHeight` 2163 against
`clientHeight` 609. `logPresent` was asserted per row rather than assumed.

| Requested | Achieved | strip top | viewport h | visible on arrival | fully in | strip/composer overlap | occluded |
|---|---|---|---|---|---|---|---|
| 390×844 | 390×844 | 788 | 844 | yes | yes | none | 0 |
| 320×800 | **336×800** | 744 | 800 | yes | yes | none | 0 |
| 640×800 | 640×800 | 744 | 800 | yes | yes | none | 0 |
| 1280×800 | 1280×800 | 744 | 800 | yes | yes | none | 0 |

**WebKit matches Blink and Gecko to the pixel**, on both screens, across all 20
measurements. The composer rectangles are identical to Chrome's in every state:
667–788 resting and 491–788 grown at 390, 623–744 and 447–744 at the narrow
width, 623–744 and 449–744 at 640, 576–744 and 456–744 at 1280. `dvh`, sticky and
the safe-area fallback behave the same in all three engines at a zero inset.

**Exact 320 CSS px is not reachable in Safari.** The smallest real Safari window
gives an inner size of 336×348, which independently reproduces the limitation
TASK-05 recorded. The 336 result is not a substitute for a 320 measurement, but
it exercises the same CSS: the only media breakpoint in that region is
`@media (max-width: 359px)` in `src/styles/app-view.css:2423`, so 320 and 336 sit
in the same band. `min-width: 320px` in `global.css:10` is a floor, not a
breakpoint. Direct 320 measurements exist in Blink and in Gecko.

Two Safari-specific process notes. The first Safari signed-in run reported clean
numbers with zero messages, the same batching trap as Firefox; safaridriver's
round-trips are slower, and 350 ms between typing and submitting was not enough
where 650 ms is. Separately, resizing across the mobile breakpoint can deselect
the conversation, which silently turns a loaded-state measurement into an
empty-state one — visible in an intermediate run as `logOverlapsComposer` going
null and the judged-control count dropping to four. The final run asserts the log
is present on every row.

### Cross-engine summary

| | Blink 151 | Gecko 153 | WebKit 605.1.15 |
|---|---|---|---|
| Auth, strip top at 390/320/640/1280 | 788/744/744/744 | 788/744/744/744 | 788/744*/744/744 |
| Signed in, all four states | no overlap, 0 occluded | no overlap, 0 occluded | no overlap, 0 occluded |
| Exact 320 CSS px | yes | yes | not reachable, 336 measured |

\* Safari's narrow row is 336 CSS px, not 320.
