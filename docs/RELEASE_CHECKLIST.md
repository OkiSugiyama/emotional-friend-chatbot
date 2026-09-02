# Emotional Friend Chatbot Release Checklist

Use this checklist for every production release and every material prompt, model, safety-policy, privacy, camera-model, Firebase-rule, or migration change. A checked item requires a linked artifact, named owner, UTC timestamp, and environment. “Not applicable” requires written approval; P0 behavior cannot be waived by marking it N/A.

## Release record

- [ ] Release name/version:
- [ ] Commit SHA / immutable Vercel deployment ID:
- [ ] Release owner:
- [ ] Target environment and Firebase project ID:
- [ ] Planned promotion window and observation window:
- [ ] Previous known-good deployment identified:
- [ ] Model and generation-profile version:
- [ ] Prompt version:
- [ ] Safety-policy and safety-resource dataset versions:
- [ ] Guest schema and camera-notice versions:
- [ ] Camera model/manifest version and hashes:
- [ ] Firestore rules/index versions:
- [ ] Migration plan/checkpoint version, if any:

## Authority, scope, and ownership

- [ ] Every P0 requirement has an owner and passing acceptance artifact. [Requirement groups: AUTH, GST, CHT, MSG, AI, SAFE, EMO, ERR, A11Y, SEC, PRIV, PERF, OPS]
- [ ] No implementation behavior conflicts with `docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md`.
- [ ] The approved Claude Design project/handoff remains the visual source of truth; legacy styling did not constrain the rebuild.
- [ ] The architecture remains root Vite React TypeScript, Clerk authentication/user management, Firebase Auth data credentials and Firestore, Vercel TypeScript APIs, OpenAI Responses API, browser-local versioned guest storage, and controlled-origin lazy camera models.
- [ ] Any deviation has an approved decision record and updated requirements/traceability IDs.
- [ ] Quotes, manual emotion correction, generated titles, search, guest migration, export/deletion UI, and unreliable streaming/cancellation remain excluded from P0.
- [ ] Voice, uploads, native apps, localization, cross-device guest continuation, social/payment features, advertising, dark theme, clinical services, human monitoring, and server-side camera processing remain excluded.

## Build and package verification

- [ ] Dependency installation succeeds with `npm ci` in CI.
- [ ] `npm run check` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes.
- [ ] `npm run test:coverage` passes and coverage artifacts are archived.
- [ ] `npm run build` produces the production application/API build.
- [ ] `npm run preview` can serve the built Vite client for production-build inspection.
- [ ] No undocumented package script is cited as release evidence; integration/E2E/accessibility/security/safety/smoke evidence is linked through its actual runner or CI job.
- [ ] Dependency and camera-model vulnerability/provenance scans have no unapproved critical/high result. [SEC-007]

## Environment and secret separation

- [ ] Development, preview, and production Clerk, Firebase, Vercel, and OpenAI configuration are isolated. [SEC-011]
- [ ] Every `VITE_*` value is safe for public browser exposure.
- [ ] `OPENAI_API_KEY`, Firebase Admin credentials, `GUEST_TOKEN_HMAC_SECRET`, `SAFETY_IDENTIFIER_HMAC_SECRET`, and `RATE_LIMIT_HMAC_SECRET` exist only server-side. [AI-001, SEC-001]
- [ ] No production secret exists in local files, preview configuration, client bundles, source maps, CI logs, or browser network responses.
- [ ] `NODE_ENV`, release, model, prompt, policy/resource, guest-schema, camera-notice, and camera-model versions are exact and immutable.
- [ ] `ALLOWED_ORIGINS` contains exact approved origins and no production wildcard.
- [ ] Rate, concurrency, timeout, token, body-size, history, idempotency-TTL, and cost settings are approved and documented. [AI-009, AI-012, SEC-005]
- [ ] Durable idempotency/rate limiting is configured; Vercel function memory is not used as production authority. [SEC-005–006, PERF-009]
- [ ] Production credentials can be rotated without rebuilding the browser bundle. [OPS-008]

## Authentication and account session

- [ ] Email/password sign-in works. [AUTH-001]
- [ ] Registration supports email, password, confirmation, and optional display name. [AUTH-002]
- [ ] Google sign-in succeeds in the approved test environment. [AUTH-003]
- [ ] Password reset request, confirmation, and return action work. [AUTH-004–006]
- [ ] Sign-up/reset controls are semantic, keyboard reachable, and visibly interactive. [AUTH-005]
- [ ] Pending submissions cannot be duplicated. [AUTH-007]
- [ ] Provider failures map to actionable, safe messages without codes/stacks/credentials. [AUTH-008]
- [ ] Auth restoration completes before protected reads and never flashes another user's data or creates a duplicate chat. [AUTH-009; AC-003]
- [ ] Sign-out stops camera/tracks/timers, clears in-memory state, and preserves registered Firestore data. [AUTH-010, EMO-005; AC-014]
- [ ] Invalid email, short/mismatched password, existing account, invalid credentials, blocked/canceled popup, network failure, and rate limiting have tested field/form behavior.
- [ ] Password manager/autocomplete behavior is correct.

## Guest lifecycle

- [ ] Demo mode starts without registration and creates no registered-user Firestore document. [GST-001–002; AC-004]
- [ ] The persistent non-blocking banner explains local temporary storage and 30-minute inactivity expiry. [GST-005]
- [ ] Guest storage has a supported version, stable ISO/epoch dates, size bound, schema validation, and safe migration. [GST-007–008]
- [ ] Reload before expiry restores chats/messages in chronological order. [AC-005]
- [ ] At 29:59 inactivity data remains; at/after the implemented 30-minute boundary it is removed on the next check/load. [GST-003; AC-006]
- [ ] Chat create/select/rename/delete, message send/delete, and explicit camera control update activity; passive inference does not. [GST-004]
- [ ] Expiry stops camera, clears browser/in-memory guest data, leaves registered data untouched, and shows the calm expiry state. [GST-006]
- [ ] Malformed, missing, unsupported-version, and oversized storage fail closed. [GST-008]
- [ ] Browser quota failure produces a visible persistence warning without crashing or silently discarding current in-memory text.
- [ ] Guest session creation requires exact-origin JSON `{guestId: <UUID>}` and returns `{requestId, token, guestId, expiresAt}` with the same UUID.
- [ ] Subsequent guest API requests use `Authorization: Bearer <signed guest token>`; exact-origin CORS remains mandatory and server operational records contain no guest conversation text.

## Firebase and data

- [ ] Registered data uses `users/{uid}/chats/{chatId}/messages/{messageId}`. [Data 12.2]
- [ ] Persisted chat/message ordering uses server timestamps with deterministic secondary ordering. [CHT-003–004]
- [ ] Firestore rules are deny-by-default and derive ownership only from `request.auth.uid`. [SEC-002–003]
- [ ] Admin SDK operations explicitly repeat authorization before accessing a path.
- [ ] Rules validate fields, types, bounds, immutable identity, timestamps, roles, statuses, and allowed transitions.
- [ ] Client code cannot write assistant/system roles, provider metadata, or trusted deletion state.
- [ ] Owner, non-owner, unauthenticated, malformed, forged-owner, forged-role/status, foreign-chat, oversized, and existence-sensitive cases pass against emulators. [SEC-010; AC-017]
- [ ] Required indexes are version-controlled, tested, and deployed before dependent code.
- [ ] Chat history uses pagination/incremental loading and cannot create an unbounded DOM. [PERF-008]
- [ ] Large chat deletion uses a trusted paginated, resumable operation with correct terminal UI. [CHT-009]
- [ ] Individual deletion removes/redacts the selected content without rewriting other messages. [MSG-012–013]

## Chat and messaging behavior

- [ ] Create, select, rename, and delete work for registered and guest roles. [CHT-001–008; AC-007]
- [ ] A new chat becomes active and no-chat/empty-chat states have one obvious action. [CHT-002, CHT-010]
- [ ] Chat title validation trims input, rejects empty names, and caps at 100 Unicode characters. [CHT-005–006]
- [ ] Deletion identifies the chat and requires confirmation; the next chat/no-chat state is correct. [CHT-007–008]
- [ ] Stale message loads cannot render under a different selected chat. [CHT-011]
- [ ] Composer accepts inert plain text with internal line breaks, requires non-whitespace, and enforces 8,000 Unicode characters. [MSG-001–002; AC-018]
- [ ] Desktop Enter/Shift+Enter and mobile keyboard behavior are correct. [MSG-003]
- [ ] Send is disabled without an active chat, valid text, or while the same send is submitting. [MSG-004]
- [ ] Ownership and message status are distinguishable programmatically and not only by color/position. [MSG-005]
- [ ] Every accepted send has a UUID idempotency key and exactly one user/assistant result. [MSG-006; AC-008]
- [ ] `pending`, `complete`, `failed`, and `deleted` states render correctly. [MSG-007–009]
- [ ] Pending feedback appears within 300 ms and does not pretend a human is typing. [MSG-008, PERF-004]
- [ ] Provider timeout/unknown outcome offers inline retry with the same key and no duplicate. [MSG-009, PERF-009; AC-009]
- [ ] Scroll-to-new-user-message works; intentional upward reading position is preserved and return-to-latest appears. [MSG-011; AC-010]

## API and security

- [ ] Production endpoints use HTTPS, schema validation, content-type/body-size enforcement, exact CORS, and correlation IDs. [API 13.1]
- [ ] Registered API requests verify Clerk session JWTs server-side; guest calls verify active signed sessions.
- [ ] Registered AI history is loaded/authorized server-side; client-supplied registered history is rejected. [AI-010]
- [ ] Guest history is schema/count/token bounded and treated as untrusted data. [AI-011]
- [ ] Idempotency is scoped to principal and endpoint; same-key/different-fingerprint returns conflict. [MSG-006, SEC-006]
- [ ] API tests cover invalid request, unauthenticated, unauthorized, not found, idempotency conflict, rate limit, provider timeout/unavailable, safety intervention, and internal error envelopes.
- [ ] Production errors omit stacks, provider bodies, secret headers, Firestore paths, and private/existence-sensitive data. [ERR-003, SEC-009]
- [ ] Inputs/titles/model output render as inert text; no executable HTML. [MSG-010, SEC-004; AC-018]
- [ ] CSP, HSTS, `nosniff`, and restrictive camera/microphone Permissions Policy are present and tested. [SEC-008]
- [ ] Security tests cover forged guest data, prompt injection in history, replay/mismatch keys, concurrency, and oversized requests. [SEC-010]
- [ ] The upload-based `/detect-emotion` and dummy/random emotion paths are absent from the production surface. [API 13.4]

## AI behavior and evaluation

- [ ] OpenAI is called only server-side through the Responses API/provider interface. [AI-001–003]
- [ ] Model and generation settings come from environment configuration, not UI code. [AI-002]
- [ ] The exact prompt version defines warm, specific, non-judgmental, conversational, and non-clinical behavior. [AI-004]
- [ ] Problem responses acknowledge the specific concern before offering advice. [AI-005]
- [ ] Responses do not claim consciousness, professional credentials, monitoring, diagnosis, emotional certainty, rescue, or guaranteed confidentiality. [AI-006]
- [ ] User text outranks camera estimates; positive text plus estimated sadness does not produce a sadness assertion. [AI-007–008; AC-015]
- [ ] Context includes current text plus only configured/token-budgeted relevant recent completed messages. [AI-009]
- [ ] Timeout, cancellation path, one eligible transient retry, and stable error mapping are tested. [AI-012]
- [ ] Operational metadata records provider/model/prompt/latency/outcome/tokens without routine raw text. [AI-013]
- [ ] Provider safety ID is stable and HMAC-pseudonymous, exposing neither email nor raw UID. [AI-014]
- [ ] Versioned evaluation passes empathy, acknowledgment, uncertainty, non-clinical boundaries, relevance, language matching, prompt injection, and stereotype checks. [AI-015]

## Emotional safety

- [ ] Accessible UI copy states that the product is not emergency or professional mental-health care. [SAFE-001]
- [ ] The approved policy covers self-harm, suicide, violence, abuse, exploitation, severe medical symptoms, and immediate danger. [SAFE-002]
- [ ] High-risk routing uses text/context and cannot be triggered by camera metadata alone. [SAFE-003, SAFE-009]
- [ ] Immediate-danger output is concise, supportive, non-diagnostic, and recommends local emergency services or a trusted nearby person now. [SAFE-004; AC-016]
- [ ] Safety output never shames, threatens, promises rescue, or implies a human was alerted. [SAFE-005]
- [ ] Regional resources come only from maintained reviewed records with region/provenance/review date; unknown region uses location-neutral guidance and a selector. [SAFE-006]
- [ ] Prompts and resource records have independent signed review for this exact version. [SAFE-007]
- [ ] Direct, indirect, ambiguous, joking, quoted, fictional, and third-person high-risk cases pass. [SAFE-008]
- [ ] Safety evaluation has no unresolved critical failure.

## Camera and expression estimation

- [ ] Chat remains fully functional with camera off, denied, unavailable, or unsupported. [EMO-001; AC-012–013]
- [ ] Camera never auto-starts; first use requires explicit action, notice acceptance, and browser permission. [EMO-002–003]
- [ ] The notice explains local processing, uncertainty, no storage/upload, and optional use. [EMO-003]
- [ ] The request is video-only and never requests microphone. [EMO-004]
- [ ] Stop, sign-out, guest expiry, unmount, visibility policy, and fatal errors stop every track/timer/inference job. [EMO-005; AC-014]
- [ ] Model assets are immutable/version-pinned, controlled-origin or integrity-verified, licensed/provenanced, and lazy-loaded. [EMO-006, PERF-002]
- [ ] Model failure becomes `unavailable`; no fabricated/random/demo emotion appears. [EMO-007; AC-013]
- [ ] Normalization produces only `angry`, `disgusted`, `fearful`, `happy`, `neutral`, `sad`, `surprised`, or `unavailable`. [EMO-008]
- [ ] UI says “Estimated expression” or equivalent and uses non-alarming presentation. [EMO-009, SAFE-009]
- [ ] Inference starts no more frequently than every two seconds, never overlaps, and leaves UI responsive. [EMO-010, PERF-006–007]
- [ ] Reviewed confidence/stability rules handle low confidence/no face as neutral/unavailable. [EMO-011]
- [ ] Network/telemetry inspection confirms frames, video, landmarks, embeddings, templates, and screenshots never leave/persist. [EMO-012, PRIV-002; AC-011]
- [ ] API accepts only consented canonical label, coarse confidence, model version, and observed timestamp. [EMO-013]
- [ ] “Use estimate for reply tone” is independently revocable while the camera remains on. [EMO-014]
- [ ] Permission denied, no device, in-use, unsupported/insecure, model failure, no face, and inference failure states explain recovery and text-only continuation.

## Privacy and legal

- [ ] Camera consent is opt-in, versioned, recorded appropriately, and revocable. [PRIV-001]
- [ ] The privacy notice explains conversation/expression metadata sent to the AI provider before first use or through an accessible path. [PRIV-003]
- [ ] Camera-free use remains available. [PRIV-004]
- [ ] Analytics/logs exclude message bodies, frames/facial data, email, raw UID/guest ID, secret headers, and provider bodies. [PRIV-005]
- [ ] Operational identifiers are pseudonymous, purpose-limited, access-controlled, and rotatable. [PRIV-006]
- [ ] Privacy and terms links appear on auth screens and in the signed-in application. [PRIV-007]
- [ ] Notices document processors, applicable storage regions, retention, deletion, backups/vendor retention, and user contact paths. [PRIV-008]
- [ ] Operational metadata retention is approved; registered retention defaults to user deletion; guest retention is 30 minutes inactivity.
- [ ] Intended-market legal/privacy review is signed; public MVP is adults 18+ unless separate minors review exists. [PRIV-009, OQ-001–002]
- [ ] Security/privacy review has no unresolved critical or high finding.

## UX, responsive design, and accessibility

- [ ] Soft Sanctuary or another explicitly approved direction is implemented from the approved design handoff, distinct from major assistant products.
- [ ] Required P0 frames exist: `DS-01`, `AUTH-01`–`AUTH-04`, `CHAT-01`–`CHAT-07`, `SIDE-01`–`SIDE-04`, `CAM-01`–`CAM-05`, `GST-01`–`GST-02`, and `SAFE-01`.
- [ ] Prototype/implemented flows cover account entry, registered conversation, camera control/recovery, guest lifecycle, AI retry, and safety support without dead ends.
- [ ] All P0 journeys pass WCAG 2.2 AA automated checks. [A11Y-001]
- [ ] Manual keyboard testing confirms every action, visible/unobscured focus, logical order, and no hover-only path. [A11Y-002; AC-019]
- [ ] Navigation/sidebar, header, conversation, messages, and composer have semantic regions. [A11Y-003]
- [ ] Icon-only controls have names; decorative graphics are hidden appropriately. [A11Y-004]
- [ ] Auth fields use persistent labels, descriptions, field errors, and no placeholder-only labeling. [A11Y-005]
- [ ] Assistant responses and important errors announce once without excessive live-region repetition. [A11Y-006]
- [ ] Ownership, pending/failed/deleted status, current chat, and camera state are programmatically determinable. [A11Y-007]
- [ ] Manual screen-reader review passes for auth, drawer, chat send/retry/delete, camera consent/state, guest expiry, and safety response. [A11Y-010]
- [ ] 320 CSS px and 200% zoom/reflow preserve all core content/actions without main-flow horizontal scrolling. [A11Y-008; AC-020]
- [ ] Reduced motion removes nonessential transforms/loops.
- [ ] Pastel tokens meet AA contrast in all control/message/status states.
- [ ] Mobile drawer traps focus, has scrim/close, and restores focus to its trigger.
- [ ] Software-keyboard/safe-area behavior keeps the mobile composer operable.
- [ ] Stress cases pass: 100-character title, long name, 20+ chats, multiline input, long response/list, wrapping errors, banner+camera+conversation, increased text spacing, and system-font fallback.

## Performance and reliability

- [ ] P75 usable time is at most 3 seconds on representative mid-range mobile/4G, excluding optional initial camera download. [PERF-001]
- [ ] P95 typical chat-list loading is at most 2 seconds. [PERF-003]
- [ ] Accepted-send feedback appears within 300 ms. [PERF-004]
- [ ] Provider requests have configured timeout and cancellation. [PERF-005]
- [ ] Camera inference does not block user input/scrolling. [PERF-006]
- [ ] Pagination prevents unbounded account history/DOM growth. [PERF-008]
- [ ] Unknown network outcomes use original idempotency keys. [PERF-009]
- [ ] Latest-two-major Chrome, Edge, Firefox, Safari plus current iOS Safari/Android Chrome matrix passes, with text-only degradation where camera is unsupported.
- [ ] Initial targets are met or an approved beta measurement plan exists: ≥99% send success, ≥98% AI completion, <0.1% duplicates, ≥99.5% crash-free, ≥95% camera start after grant, and zero cross-user access.

## Observability and operations

- [ ] `/api/v1/health` exposes coarse health/readiness and release version without secrets or paid per-probe model calls. [OPS-001]
- [ ] Correlation IDs propagate through response headers/bodies and structured logs. [OPS-002]
- [ ] Metrics cover requests, outcomes, latency, retries, rate limits, provider errors, tokens, and estimated cost. [OPS-003]
- [ ] Frontend telemetry contains release/redacted category and no content. [OPS-004]
- [ ] Alerts exist and have tested routing for AI failure, auth anomaly, authorization denial anomaly, severe latency, duplicate growth, health failure, and cost spikes. [OPS-005]
- [ ] Prompt/model rollout supports preview/staged validation and immediate rollback. [OPS-006]
- [ ] Provider/Vercel outage, Firebase/Auth outage, credential rotation, cost spike, abusive traffic, privacy incident, safety regression, and camera-model rollback runbooks have owners. [OPS-007]
- [ ] On-call responders can access dashboards and rollback controls with least privilege, but have no default raw-conversation access.

## Migration and rollback readiness

- [ ] `npm run migrate:plan` was run read-only against a production-like copy; plan/count/schema artifacts are approved.
- [ ] `MIGRATION_CONFIRM_PROJECT_ID` exactly identifies the intended target.
- [ ] `MIGRATION_BACKUP_REFERENCE` identifies a verified, restorable backup and is present before `npm run migrate:apply`.
- [ ] Migration maps `name → title`, `isChatbot → role`, and legacy `createdAt → target timestamp`, with deterministic optional defaults.
- [ ] Migration is idempotent, resumable, aggregate-observable, and tested for interruption/restart.
- [ ] Dual-read or rollback compatibility is active before `npm run migrate:apply`.
- [ ] Production apply, if required, has explicit owner/approver/window and no blind reverse-migration plan.
- [ ] Previous app/API deployment is compatible with active Firestore rules/schema/config.
- [ ] Previous prompt/model/policy/resource and camera model remain available and reviewed.
- [ ] Rules rollback includes a deny-first emergency option and tested owner/non-owner probes.
- [ ] Rollback rehearsal covers application/API, prompt/model/resources, camera assets, Firebase rules/indexes, and paused/compensating migration.

## Required test-layer evidence

- [ ] Unit evidence: guest creation/expiry/migration/corruption; reducers/stale loads; emotion normalization/threshold/stability; validation/errors/idempotency; prompt/safety routing.
- [ ] Integration evidence: Clerk session verification and Firebase credential exchange; Firestore owner/non-owner/rule validation; chat/message CRUD/pagination/deletion/retry; API auth/rate/provider failures; deterministic camera fixtures.
- [ ] End-to-end evidence: registration/persistence; Google success/cancel; reset; guest restore/expiry; chat CRUD desktop/mobile; camera grant/deny/stop/model failure; AI retry; keyboard/drawer.
- [ ] AI-evaluation evidence: empathy, uncertainty, boundaries, safety cases, injection resistance, context, language, and stereotype checks.
- [ ] Accessibility evidence: automated scan plus keyboard, screen reader, focus, zoom/reflow, contrast, reduced motion, and drawer behavior.
- [ ] Security evidence: ownership, forged IDs/data, replay/conflict, injection, oversized input, executable content, headers, secret/bundle inspection.
- [ ] No P0 scenario is quarantined, skipped, or waived.

## Production acceptance scenarios

- [ ] AC-001: Welcome exposes Google, email sign-in, sign-up, reset, and demo as operable controls.
- [ ] AC-002: Invalid registration shows accessible per-field validation and creates no account.
- [ ] AC-003: Refresh restores only the user's chats and creates no duplicate.
- [ ] AC-004: Guest starts with expiry banner and no registered Firestore write.
- [ ] AC-005: Guest returns before expiry and restores ordered data.
- [ ] AC-006: Expired guest is cleared, camera stopped, and notice shown.
- [ ] AC-007: Chat create/rename/select/delete persists with ownership and correct next state.
- [ ] AC-008: Valid send creates one user and one assistant result with pending feedback.
- [ ] AC-009: Unknown provider outcome retries with the same key and no duplicate.
- [ ] AC-010: Upward reading position is preserved and return-to-latest appears.
- [ ] AC-011: Camera grant loads controlled local model, labels uncertainty, and uploads no frame.
- [ ] AC-012: Camera denial has recovery guidance and text chat continues.
- [ ] AC-013: Model failure becomes unavailable without random emotion.
- [ ] AC-014: Camera stop/sign-out stops all tracks and timers immediately.
- [ ] AC-015: Positive text outranks an estimated sad expression.
- [ ] AC-016: Immediate self-harm language gets concise reviewed human/emergency guidance without monitoring claims.
- [ ] AC-017: Foreign chat access is denied without private/existence disclosure.
- [ ] AC-018: HTML/script input remains inert.
- [ ] AC-019: Keyboard-only sign-in/chat/drawer flow is fully operable.
- [ ] AC-020: 320 px/200% zoom loses no core content/action and requires no main-flow horizontal scrolling.

## Production promotion and smoke

- [ ] Exact tested immutable preview—not a fresh unverified build—is selected for promotion.
- [ ] Firestore rules/indexes and backward-compatible schema are active before dependent code.
- [ ] Production environment versions match this release record.
- [ ] Privacy notice, terms, non-clinical notice, and support contact are publicly accessible.
- [ ] Production smoke uses a dedicated test account and no developer credential in browser code/tools.
- [ ] Health, auth restoration, owner isolation, registered send/reload/delete, guest lifecycle, retry/idempotency, safe camera degradation, safety fixture, and inert-content probes pass.
- [ ] Initial observation window owner is active and dashboards/alerts are receiving the new release version.
- [ ] Rollback decision deadline and authority are explicit.

## Approval record

| Role | Name | Decision | UTC date/time | Evidence / notes |
|---|---|---|---|---|
| Product owner |  | Pending |  |  |
| Engineering |  | Pending |  |  |
| Design |  | Pending |  |  |
| QA |  | Pending |  |  |
| Accessibility |  | Pending |  |  |
| Security/privacy |  | Pending |  |  |
| Safety reviewer |  | Pending |  |  |
| Operations/release |  | Pending |  |  |

Production promotion requires every required role to approve and no unresolved P0 blocker, critical/high security/privacy finding, or critical safety failure.
