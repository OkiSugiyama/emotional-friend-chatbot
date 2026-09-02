# TASK-01 — Local Baseline Evidence

Status: **baseline captured; not release approval**

Human gate: **required**

Contract: `../../cloudHead/projects/personal_projects/emotional-friend-chatbot/requirements.md`, frozen revision `1`

## 1. Scope and evidence handling

This report records the repository exactly as observed. It does not fix, suppress,
waive, or change the status of any finding or release gate.

- Project: `01M0Z716GT7DXBMSXNVNHTSFT2`
- Task: `TASK-01`
- Worktree: `/Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot-TASK-01`
- Branch: `ai/TASK-01-baseline-evidence`
- Git base (`main`): `94c7b2341720f74d770c35576ce02fb4820b7d27`
- Audited source head: `94c7b2341720f74d770c35576ce02fb4820b7d27`
- Base/head relationship: identical before evidence-only changes
- Host: local macOS `26.5.2` (`25F84`), `arm64`
- Node: `v24.3.0`
- npm: `11.4.2`
- Evidence data: repository fixtures and sanitized metadata only
- External activity: none; no network access, connector, provider, production,
  cloud execution, deployment, publication, push, billing, or visibility change
- Restricted material: no `.env`, credential, secret value, personal/health data,
  real conversation, or owner-owned UI mockup content was accessed or recorded

The source head was clean when the packet's `git status --short` command ran.
Generated dependency, coverage, and build outputs were ignored by Git and are not
delivery artifacts.

## 2. Acceptance command evidence

Every acceptance command was invoked in packet order. No acceptance command was
omitted. “N/A” means the command does not produce a test pass/fail/skip count.

| # | Exact command | Exit | Pass / fail / skip | Evidence and warnings |
|---:|---|---:|---|---|
| 1 | `node --version` | 0 | N/A | `v24.3.0` |
| 2 | `npm --version` | 0 | N/A | `11.4.2` |
| 3 | `npm ci --offline` | 0 | install pass | Added 511 packages; audited 512 packages; reported 0 vulnerabilities. Warnings: deprecated `node-domexception@1.0.0`; deprecated `glob@10.5.0`. Also reported 84 packages looking for funding. No lockfile change was made. |
| 4 | `npm run typecheck` | 0 | typecheck pass | `tsc -b --pretty false`; no diagnostics. |
| 5 | `npm run test` | 0 | 123 pass / 0 fail / 7 skip; 19 files pass / 0 fail / 1 skip | Vitest `v4.1.10`; duration 2.29 s. The skipped file is the conditionally gated Firestore emulator suite. |
| 6 | `npm_config_offline=true npm run test:rules` | 1 | 0 pass / 0 fail / 0 skip executed | Runner did not start. `npx --yes firebase-tools@15.26.0` failed with `ENOTCACHED`: no cached response was available while npm was in cache-only/offline mode. No rules result exists. |
| 7 | `npm run test:coverage` | 0 | 123 pass / 0 fail / 7 skip; 19 files pass / 0 fail / 1 skip | Coverage completed; details in section 3. Duration 2.45 s. |
| 8 | `npm run build` | 0 | build pass | `tsc -b && vite build`; Vite `v8.2.1`; 1,909 modules transformed; built in 513 ms. Warning: chunks larger than 500 kB after minification. |
| 9 | `npm_config_offline=true npm run check` | 1 | nested test: 123 pass / 0 fail / 7 skip; combined command fail | Nested typecheck passed and nested test completed. Nested `test:rules` failed with the same `ENOTCACHED` condition. The nested build stage was skipped because the `&&` chain stopped; the independently invoked build in command 8 passed. |
| 10 | `git status --short` | 0 | N/A | Empty output at the acceptance-command checkpoint. |
| 11 | `git diff --check` | 0 | N/A | Empty output at the acceptance-command checkpoint. |

### Command limitations

- The offline-only constraint was preserved. The Firebase CLI package was not
  fetched from the registry, so emulator authorization behavior was not executed.
- The seven skipped tests in commands 5, 7, and 9 are the same emulator-gated
  tests. Their existence is not converted to a pass merely because static tests
  or the rest of the suite passed.
- A local successful build is structural evidence only. It is not the immutable
  frontend/backend CI artifact required by RG-02.
- No provider behavior, production environment, deployed headers, or production
  smoke check was attempted.

## 3. Coverage and build baseline

### Coverage summary

| Metric | Covered / total | Percent |
|---|---:|---:|
| Statements | 1,244 / 3,033 | 41.01% |
| Branches | 879 / 2,247 | 39.11% |
| Functions | 250 / 670 | 37.31% |
| Lines | 1,163 / 2,689 | 43.25% |

Notable structural gaps reported by V8 include:

- `src/App.tsx`: 0% statements, branches, functions, and lines.
- `src/hooks/*`: 0% across the reported hook files.
- `src/services/auth-service.ts`: 0%.
- `src/services/client-telemetry.ts`: 0%.
- `server/runtime.ts`: 0% lines.
- `server/firebase-adapters.ts`: 1.33% statements and 1.50% lines.

The Vitest configuration records coverage but defines no enforcement thresholds.
Therefore exit 0 proves the coverage command ran, not that coverage is sufficient
for release acceptance.

### Build output

- HTML: 0.67 kB (0.39 kB gzip).
- Main CSS: 44.97 kB (11.30 kB gzip).
- Main JavaScript: 915.00 kB (269.53 kB gzip).
- Face API JavaScript chunk: 1,314.50 kB (329.62 kB gzip).
- Vite warned that some chunks exceed 500 kB after minification.
- No local preview, browser performance measurement, backend emitted artifact,
  immutable CI artifact, or release-candidate build inspection was in scope.

## 4. Release gates RG-01 through RG-10

The authoritative machine-readable status remains **pending for all ten gates**.
No status was edited, inferred as passing, or reclassified.

| Gate | Recorded status | Local structural evidence | Evidence still required |
|---|---|---|---|
| RG-01 — P0 ownership and acceptance artifacts | pending | Traceability and release-contract tests are part of the passing aggregate suite. | Named implementation owners and passing artifacts for every P0 requirement; fresh-context review. |
| RG-02 — Production builds | pending | Local `npm run build` exited 0. | Immutable frontend and backend CI logs tied to the release commit. |
| RG-03 — Required automated suites | pending | Aggregate suite: 123 pass, 7 skip. Unit, integration, static security, and rendered accessibility tests exist. | Responsive and browser E2E suites; zero P0 skip/focus/quarantine evidence; successful rules execution. |
| RG-04 — Firestore authorization | pending | Static rule invariants exist. | Emulator matrix did not run because `firebase-tools@15.26.0` was unavailable offline. Owner/non-owner/unauthenticated/forged-ID runtime evidence remains absent. |
| RG-05 — WCAG 2.2 AA | pending | Six rendered AppView axe scenarios and checklist-structure tests are present in the aggregate suite. | Manual checklist is explicitly `PENDING`; keyboard, screen reader, contrast, 320 CSS px, 200% zoom, reduced-motion, and independent approval. |
| RG-06 — Security and privacy review | pending | Static security/privacy invariants and sanitized logging tests exist. | Independent review, dependency/model provenance scan, IDOR/XSS/abuse probes, deployed-header check, and privacy network-egress capture. |
| RG-07 — Safety evaluation | pending | One deterministic, location-neutral high-risk route integration case and provider text-precedence fixture exist. | Versioned modality-complete synthetic safety suite, reviewed wording/resource data, unresolved-critical disposition, and independent reviewer sign-off. |
| RG-08 — Model and operational controls | pending | Configuration schema, timeouts, rate/concurrency controls, health handler, pseudonymous identifiers, and allowlisted logging are structurally tested. | Exact deployed model/prompt, durable environment verification, rollback rehearsal, alert routing, cost/latency evidence, and independent operational review. |
| RG-09 — Legal and support surfaces | pending | Privacy and terms drafts and local routes exist. | Drafts contain required `TBD` fields and are not approved for publication; support contact, processors/regions/retention details, deployment links, and legal/privacy approval remain absent. |
| RG-10 — Production smoke | pending | No production evidence was attempted. | Production release-candidate smoke, clean-browser run, readiness/correlation/telemetry check, client secret scan, and release-manager approval. Production work is explicitly outside TASK-01. |

## 5. Functional-requirement baseline

“Partial” below means structural/local evidence exists; it never means the
requirement or release gate is accepted.

| Requirement | Baseline | Missing acceptance evidence |
|---|---|---|
| FR-1 — Auth and account entry | Partial. Auth states, Firebase adapter, provider-safe error mapping, and rendered accessibility coverage exist. | Auth service has 0% coverage in this run; local emulator/browser register-reset-restore-cancel E2E and manual keyboard evidence are absent. |
| FR-2 — Guest mode | Partial. Versioned browser storage, 30-minute boundary, malformed/oversized rejection, lifecycle cleanup, and synthetic unit fixtures exist. | Guest browser E2E before/after expiry, Firestore write inspection, and camera-expiry browser evidence are absent. |
| FR-3 — Chat and messaging | Partial. Reducer, validation, HTTP idempotency, server API, pagination, deletion, and stale-load structures are tested. | Root orchestration (`src/App.tsx`) has 0% coverage; registered/guest browser E2E and emulator-backed ownership/replay evidence are absent. |
| FR-4 — AI replies | Partial structural evidence. Server-only provider adapter, bounded context, `store: false`, uncertainty framing, and a positive-text/estimated-sad synthetic adapter fixture exist. | No versioned behavior evaluation, reviewed prompt/model result set, language/acknowledgment/non-clinical evaluation, or independent review. No provider call was made. |
| FR-5 — High-risk handling | Not release-demonstrated. A deterministic location-neutral route exists and bypasses the provider in one synthetic direct case. | Required direct, indirect, ambiguous, joking, quoted, fictional, third-person, and camera-only matrix is absent; current baseline router/copy explicitly remains unaccepted without independent safety review. |
| FR-6 — Camera/expression | Partial. Camera defaults off, explicit notice path, video-only request, local same-origin model path check, non-overlapping sampling, stable/coarse estimates, independent tone toggle, and teardown tests exist. | Local browser grant/deny/stop/unmount/hidden/model-failure E2E, asset provenance/hash evidence, and network capture proving zero raw-signal egress/persistence are absent. |
| FR-7 — Data ownership and handling | Partial structural evidence. Deny-by-default rules, server authorization boundaries, inert React rendering, pseudonymous operations, and static security tests exist. | Rules emulator did not run; runtime IDOR/XSS/oversize/replay probes, deletion-state browser evidence, and independent security/privacy review are absent. |
| FR-8 — P0 UX and accessibility | Partial. Soft Sanctuary UI states and rendered axe scenarios exist. | No repository-owned browser E2E; manual checklist is entirely pending; no independent keyboard/screen-reader/contrast/reflow/reduced-motion evidence. |
| FR-9 — Traceable Gate C evidence | Partial structural evidence. P0 traceability manifest, release evidence contract, and this sanitized baseline exist. | All RG statuses remain pending; no coherent accepted D-1 through D-6 pack or claim-to-artifact independent audit exists. |

## 6. Non-functional-requirement baseline

| Requirement | Baseline |
|---|---|
| NFR-1 — Local-only execution | Observed for TASK-01. All work ran in the stated local worktree; no cloud execution, connector, provider, production, or network action was used. This task observation is not a release-wide pass. |
| NFR-2 — Synthetic data only | Observed for TASK-01 and the reviewed fixtures. Evidence contains sanitized metadata only. No production/private conversation source was accessed. Independent full fixture audit remains a release gate. |
| NFR-3 — No destructive/external action | Observed for TASK-01. No deploy, publish, production access, data deletion, credential action, charge, push, or visibility change occurred. |
| NFR-4 — No skipped/waived P0 evidence | Not established. General test and coverage runs report 7 skipped emulator tests, and the dedicated rules run could not start offline. There was no retry-based waiver or status change. |
| NFR-5 — Privacy-safe logging/analytics | Partial. Allowlisted structured logging, pseudonymous identifiers, anonymous bounded client events, and static tests exist. Client telemetry had 0% coverage in this run; bundle/network/log-sink inspection and independent review are absent. |
| NFR-8 — DoD and owner-owned content | Not fully met as a release/accepted change because combined `check` failed and independent gates remain pending. TASK-01 stayed in its write scope; the owner-owned UI mockup area was not accessed, modified, or staged. |

## 7. Human-centered safety and privacy baselines

### AI safety

- Structural positives: provider use is server-side; bounded role/text history is
  validated; user text is explicitly instructed to outrank optional estimates;
  provider output is bounded; raw upstream failure bodies are not returned.
- Gap: the observed test set contains one direct high-risk route case and no
  versioned modality-complete safety evaluation. The baseline router cannot be
  accepted for required ambiguity/context distinctions from structural tests.
- Status: RG-07 pending; P1 finding `F-01`; human safety gate required.

### Optional consent

- Camera is off by default and the UI exposes a pre-permission notice.
- Registered camera notice/version and the separate `useEmotionContext` setting
  are persisted through bounded fields; the server drops registered estimate
  metadata when supported consent is absent.
- The reply-tone toggle is independently revocable while local preview remains
  available. Guest choice remains browser state.
- Missing: local browser consent/revocation lifecycle evidence and independent
  privacy review. No pass is inferred from source existence.

### Browser-local expression estimation

- Structural implementation requests `{ video: true, audio: false }`, checks a
  same-origin model path, performs inference in the browser adapter, and sends at
  most canonical label, coarse confidence, model version, and observation time.
- The server validates freshness, vocabulary, version, and registered consent.
- Missing: browser/network capture, persistence inspection, model provenance and
  immutable asset hashes. Zero raw-frame/video/landmark/embedding egress is not
  empirically demonstrated by this task.

### Incorrect-inference recovery

- Low/unstable/non-face results reset to unavailable; the UI labels output as an
  estimate; users can stop the camera, continue without it, or disable reply-tone
  use. Provider instructions prioritize written text.
- A synthetic provider-adapter fixture covers positive text with an estimated-sad
  signal, but no end-to-end generated-behavior assertion exists.
- No explicit correction/self-report/override control or independently reviewed
  incorrect-inference recovery journey was observed. Manual correction is
  documented as post-MVP, so this is recorded as residual UX evidence rather
  than silently promoted into P0 or treated as a contract revision.

### Non-medical boundary

- Welcome/legal/safety copy states that the app is conversational support, not
  therapy, diagnosis, medical care, monitoring, rescue, or emergency service.
- High-risk output is location-neutral and avoids unreviewed numbers in the
  observed fixture.
- Missing: versioned behavior evaluation for consciousness, credentials,
  diagnosis, emotional certainty, confidentiality, monitoring, and rescue claims;
  final copy review is not attached.

### Accessibility

- Rendered AppView axe scenarios cover welcome, registered empty state, safety,
  pending/failed messages, active camera, error recovery, and guest expiry.
- The manual WCAG checklist remains explicitly `PENDING` with all items unchecked.
- No keyboard, screen-reader, contrast, forced-colors, 320 CSS px, 200% zoom,
  reduced-motion, software-keyboard, or independent reviewer artifact exists.

### Data handling

- Guest conversations are represented by versioned browser storage; registered
  paths are principal-scoped; registered history is server-loaded; guest history
  is bounded and untrusted; logs use an allowlist; provider storage is disabled.
- Static rules are deny-by-default, but their emulator matrix did not execute.
- No production data, real chats, raw emotional signals, credentials, or secret
  values appear in this report.
- Missing: runtime rules evidence, browser storage/network inspection, deployed
  log/telemetry review, retention approval, and independent privacy/security sign-off.

## 8. Findings

Priority definitions used only for this baseline report: P1 critical, P2 high,
P3 medium, P4 low. Existing release-gate statuses remain unchanged.

| ID | Priority | Area / requirements | Reproducible sanitized evidence | Type | Human gate |
|---|---|---|---|---|---|
| F-01 | **P1** | AI safety; FR-4, FR-5, RG-07 | Test inventory contains one direct high-risk routing case. No dedicated versioned safety suite covers indirect, ambiguous, joking, quoted, fictional, third-person, and camera-only modalities. Release evidence says RG-07 is pending and current routing/copy requires review. | Potential critical safety release-readiness gap; not a confirmed real-user incident. | **Yes — independent safety reviewer and owner gate required.** |
| F-02 | **P2** | Camera privacy; FR-6, FR-7, NFR-5, RG-06 | Source/static tests establish intended browser-local boundaries, but no local browser network/persistence capture or independent privacy report exists. | High privacy evidence gap; no egress was observed or alleged. | **Yes — independent privacy/security review required.** |
| F-03 | **P2** | Authorization/evidence integrity; FR-7, NFR-4, RG-03, RG-04 | `npm_config_offline=true npm run test:rules` exits 1 with `ENOTCACHED`; 0 emulator tests execute. General test/coverage/check show 7 skipped tests. Combined `check` exits 1. | High security verification blocker, reproducible locally. | **Yes — security owner reviews successful matrix; no waiver.** |
| F-04 | **P2** | Accessibility; FR-1, FR-6, FR-8, RG-05 | Automated structural cases run, but the manual checklist is `PENDING` and no keyboard, screen-reader, contrast, reflow, zoom, reduced-motion, or browser E2E artifact is attached. | High accessibility release-readiness gap. | Independent accessibility reviewer required. |
| F-05 | **P3** | Test confidence; FR-1, FR-2, FR-3, FR-6, NFR-4 | Overall coverage is 41.01% statements / 43.25% lines; `src/App.tsx`, hooks, auth service, and client telemetry are reported at 0%; no threshold fails the run. | Medium structural coverage gap. | Normal review plus fresh-context verification. |
| F-06 | **P3** | Incorrect-inference recovery; FR-4, FR-6 | Unavailable reset, stop, no-camera path, text priority, and independent tone toggle exist. No direct user correction/self-report control or end-to-end wrong-estimate recovery artifact exists; the repository documents correction as post-MVP. | Medium residual UX/evidence gap; not a contract deviation. | Product/UX decision if scope changes; otherwise verify current P0 recovery independently. |
| F-07 | **P3** | Legal/support evidence; FR-9, RG-09 | Privacy and terms documents say they are not approved for publication and contain operator, region, retention, processor, contact, and effective-date `TBD`s. | Medium release-readiness gap; external completion requires owner/legal authority. | Product/legal owner required before release. |
| F-08 | **P4** | Dependency/build hygiene; FR-6, FR-9 | Offline install warns about two deprecated transitive packages; build warns about >500 kB chunks (915.00 kB main JS and 1,314.50 kB face API chunk). npm reports 0 vulnerabilities, but no independent dependency/model provenance scan exists. | Low baseline warning; not suppressed and not a release pass. | Normal dependency/performance review; approval required before any dependency change. |

## 9. Independently verifiable follow-up proposals

These are decomposition proposals only. No packet was created or dispatched.

1. **Offline Firestore authorization evidence** — provision the already-approved
   exact Firebase CLI version through a PM-approved local/offline mechanism, then
   run the owner/non-owner/unauthenticated/forged-ID/forged-role/oversize matrix.
   Oracle: `test:rules` exit 0 with exact counts and zero skips.
2. **Versioned synthetic safety evaluation** — add a separately reviewable suite
   for all required language modalities, camera-only negative cases, false-positive
   and false-negative disposition, and non-medical claims. Oracle: unresolved
   critical failures 0 plus independent signed safety review.
3. **Camera privacy browser evidence** — local browser run with synthetic state,
   grant/deny/stop/hidden/model-failure lifecycle, network capture, storage audit,
   and track/timer teardown. Oracle: raw visual/derived detail egress and persistence 0.
4. **Registered/guest browser E2E** — local emulators and synthetic fixtures for
   auth restoration, guest expiry, CRUD, stale chat, retry, duplicate count, and
   camera-free chat. Oracle: declared P0 journeys pass with zero quarantine.
5. **Independent WCAG review** — complete the repository checklist for keyboard,
   supported screen readers, contrast, 320 CSS px, 200% zoom, reduced motion, and
   software-keyboard behavior. Oracle: signed checklist and no unresolved
   critical/high P0 accessibility finding.
6. **Orchestration and telemetry test task** — cover root App session transitions,
   auth service, hooks, client telemetry, and Firestore adapters; propose coverage
   thresholds separately for approval. Oracle: deterministic boundary tests and
   agreed thresholds on the reviewed revision.
7. **Legal/support completion task** — owner/legal supplies operator identity,
   markets, processors, regions, retention/deletion, contact, and approval. Oracle:
   approved versioned documents; deployment remains a separate Gate D action.
8. **Dependency/model provenance and bundle review** — evaluate the reported
   deprecations, exact lockfile graph, camera model licensing/hashes, and bundle
   loading performance without upgrading dependencies in the audit task. Oracle:
   reviewed report and separately approved remediation packet if needed.

## 10. Baseline conclusion

The repository has meaningful structural coverage and locally builds, but the
frozen contract's release evidence is not complete. The offline rules runner and
combined check fail, all RG-01 through RG-10 statuses remain pending, and safety,
privacy, accessibility, browser E2E, operational, legal, and production evidence
still require independent human gates. This document is D-1 baseline evidence
input only and must not be cited as release approval or public-availability proof.
