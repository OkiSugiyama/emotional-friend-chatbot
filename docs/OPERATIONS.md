# Emotional Friend Chatbot Operations

## Purpose

This runbook covers local operation, environment management, deployment, observability, rollback, and incident response for the P0 rebuild. Product, privacy, safety, and accessibility requirements in `docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md` remain authoritative. Architecture and contracts are defined in `docs/ARCHITECTURE.md`.

The service is conversational support, not medical care, crisis monitoring, or an emergency service. Operational responders must never imply that conversations are routinely monitored by humans.

## Environment model

Development, preview, and production are isolated.

| Environment | Clerk / Firebase | Vercel | OpenAI | Data policy |
|---|---|---|---|---|
| Local | Clerk development instance plus Firebase Auth/Firestore emulators and isolated test identities | Separate local Vercel API process | Dedicated development key/model allowlist | Synthetic data only by default. |
| Preview | Isolated Clerk and Firebase non-production configuration | Immutable preview deployment | Preview-scoped key and evaluated model/profile | Synthetic or approved de-identified fixtures. |
| Production | Clerk production instance and production Firebase project | Promoted immutable deployment | Production-scoped key and approved model/profile | Real user data under approved retention/privacy policy. |

Production secrets must not appear in local files, preview settings, client bundles, browser logs, CI output, or screenshots. Firebase's public web configuration is not a credential, but it never substitutes for Firestore rules or API authorization.

Environment-variable names and exposure rules are listed in the root `README.md`. Vercel is the production source of truth for server variables. Each deployment records immutable release, model, prompt, safety-policy, safety-resource, guest-schema, camera-notice, and camera-model versions.

### Active runtime configuration contract

Production/runtime configuration is limited to the names parsed by `server/config.ts`:

```text
NODE_ENV
ALLOWED_ORIGINS
RELEASE_VERSION
GUEST_TOKEN_HMAC_SECRET
SAFETY_IDENTIFIER_HMAC_SECRET
RATE_LIMIT_HMAC_SECRET
CLERK_JWT_KEY
FIREBASE_SERVICE_ACCOUNT_JSON
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_USE_EMULATORS
FIRESTORE_EMULATOR_HOST
FIREBASE_AUTH_EMULATOR_HOST
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_SYSTEM_PROMPT
OPENAI_PROMPT_VERSION
OPENAI_HISTORY_LIMIT
OPENAI_TIMEOUT_MS
OPENAI_MAX_OUTPUT_TOKENS
GUEST_TOKEN_TTL_SECONDS
REQUEST_BODY_LIMIT_BYTES
REGISTERED_RATE_LIMIT
GUEST_RATE_LIMIT
IP_RATE_LIMIT
RATE_LIMIT_WINDOW_MS
DELETE_BATCH_SIZE
EMOTION_CONTEXT_MAX_AGE_MS
EMOTION_CONTEXT_FUTURE_SKEW_MS
PROVIDER_CONCURRENCY_LIMIT
SUPPORTED_CAMERA_NOTICE_VERSIONS
IDEMPOTENCY_TTL_SECONDS
```

Migration additionally uses `MIGRATION_CONFIRM_PROJECT_ID` and requires `MIGRATION_BACKUP_REFERENCE` for apply. Browser-visible configuration is limited to `VITE_CLERK_PUBLISHABLE_KEY`, the Firebase web values, paired emulator host/port values, emulator opt-in, and optional `VITE_RELEASE_VERSION` documented in `README.md`. Do not introduce aliases in Vercel; unknown names do not configure the runtime.

Readiness fails closed unless release, origin, Clerk JWT public key, HMAC secrets, and OpenAI settings are present. Production additionally requires one valid Firebase Admin credential form and rejects wildcard/malformed/non-HTTPS origins and all emulator settings. Emulator mode instead requires `NODE_ENV=development` or `test`, a project ID, both loopback server emulator hosts, and no Admin credentials.

## Local operations

### First-time preparation

```sh
npm ci
npx vercel link
npx vercel env pull .env.local
```

Use only development credentials. Confirm the local environment file is ignored before it contains secrets.

### Required three-process topology

Terminal 1 — Firebase Auth and Firestore emulators:

```sh
npx firebase-tools emulators:start --only auth,firestore --project emotional-friend-local
```

Terminal 2 — Vercel TypeScript API functions:

```sh
npx vercel dev --listen 3000
```

Terminal 3 — root Vite React application:

```sh
npm run dev
```

Open `http://localhost:5173`, matching `ALLOWED_ORIGINS=http://localhost:5173`. Vite proxies same-origin `/api` requests to the separate Vercel process on port 3000; production continues to use same-origin `/api`.

Quick validation:

1. `GET /api/v1/health` through the Vite origin performs readiness and returns `200`, `status="ready"`, a request ID, and the local release version.
2. Registration/sign-in uses emulators, never production.
3. A registered send includes a Firebase emulator ID token and produces exactly one user/assistant pair.
4. `POST /api/v1/guest-sessions` accepts `{guestId: <UUID>}` and returns `{requestId, token, guestId, expiresAt}`; subsequent guest calls use the signed bearer token while messages remain browser-local.
5. Starting/stopping the camera opens only video and tears down all tracks.

### Implemented verification commands

```sh
npm run typecheck
npm run test
npm run test:rules
npm run test:coverage
npm run build
npm run preview
npm run check
```

Use `npm run test:watch` only during development. `npm run test:rules` is the dedicated Firestore authorization gate. Browser end-to-end, AI-safety evaluation, and production smoke tests remain required layers without dedicated package scripts.

## Firebase rules and emulator operation

Rules are deny-by-default. Client access is limited to the authenticated user's `users/{uid}` tree, and trusted provider fields/cascade deletion remain server-only. Admin SDK code must repeat the ownership check because Admin bypasses Firestore rules.

Before every rule change:

1. Add or update emulator cases for owner, non-owner, unauthenticated, malformed, forged `ownerUid`, forged assistant/system role, invalid status transition, foreign chat ID, oversized input, and existence-sensitive denial.
2. Run the authorization suite against emulators and archive the result in the release evidence.
3. Review indexes and query plans together; deploy indexes before code that requires them.
4. Use an isolated Firebase project for preview validation.

Deploy reviewed rules/indexes to an explicit target:

```sh
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <target-project-id>
```

Never rely on the active CLI project implicitly for production. Confirm the printed target before approval.

## Migration operation

Existing registered conversations are preserved by default. Migration is expand/migrate/contract and maps `name` to `title`, `isChatbot` to `role`, and legacy `createdAt` to server-compatible timestamps with deterministic defaults.

Planning is read-only:

```sh
npm run migrate:plan
```

Archive the plan identifier, source/target schema versions, record counts, validation sample, estimated duration, and rollback/dual-read decision. Review it against a production-like copy first.

Apply only after explicit production approval:

```sh
npm run migrate:apply
```

Before apply, `MIGRATION_CONFIRM_PROJECT_ID` must exactly match the intended Firebase target and `MIGRATION_BACKUP_REFERENCE` must identify a verified, restorable backup. Apply must fail closed if either guard is absent or mismatched. An apply must be resumable and idempotent, emit aggregate progress without conversation text, and stop safely on schema/authorization anomalies. Do not remove dual-read or legacy compatibility until post-migration counts, order, ownership, and sampled rendering pass.

## Deployment procedure

### 1. Prepare the release candidate

- Freeze the commit and record its SHA as `RELEASE_VERSION`/`VITE_RELEASE_VERSION`.
- Complete `npm ci`, `npm run check`, `npm run test:coverage`, and `npm run build` in CI.
- Produce and approve `npm run migrate:plan` if the data shape changes.
- Confirm exact environment scope and absence of production secrets from client variables.
- Confirm the prompt, model, safety policy/resources, camera disclosure/model, guest schema, rules, and indexes are versioned.
- Complete the privacy, safety, security, accessibility, and design gates in `docs/RELEASE_CHECKLIST.md`.

### 2. Deploy infrastructure compatibility first

- Deploy additive/backward-compatible Firestore indexes and rules to the preview project.
- Verify the controlled-origin camera manifest, immutable cache headers, hashes, and rollback availability.
- Confirm rate limiting and idempotency use their durable production-approved backend, not function memory.
- Confirm health/readiness, redacted telemetry, dashboards, alerts, and cost thresholds.

### 3. Create and validate preview

```sh
npx vercel
```

Use preview-only Firebase/OpenAI credentials. Execute all P0 acceptance scenarios, rule tests, API security cases, browser/camera matrix, WCAG checks, AI/safety evaluation, and migration rehearsal. Preview failures must not be waived for a production P0 path.

### 4. Apply approved migration if required

Keep the application dual-read/backward-compatible. Run `npm run migrate:apply` only through the approved production workflow, monitor aggregate progress, then validate ownership, ordering, counts, retry/resume, and old/new application compatibility.

### 5. Promote the tested immutable deployment

Promote the exact tested preview through the approved Vercel dashboard or CLI workflow. Do not rebuild from an unverified worktree. Record the deployment ID, release SHA, approvers, Firebase rules/index versions, and all model/policy/data versions.

### 6. Production smoke and observation

- Health/readiness succeeds.
- Auth restoration loads only the signed-in user's recent chats and creates no duplicate chat.
- Registered create/send/reload/delete works with a production test account.
- Guest start/restore/expiry stays out of registered Firestore data.
- AI pending feedback appears, response persists, and same-key retry does not duplicate.
- Camera grant/deny/start/stop and model failure degrade safely with no uploaded frames.
- A reviewed safety fixture produces the expected non-monitoring escalation hierarchy.
- Unauthorized and inert-HTML probes remain denied/safe.
- No developer credential is present in the browser.

Observe the initial release window for auth anomalies, authorization denials, AI outcome/latency, retry rate, duplicate rate, rate limits, token/cost growth, client crashes, and camera failures.

## Service signals

### Health and readiness

- `/api/v1/health` and `?mode=ready` perform readiness; `?mode=live` performs liveness only.
- Readiness returns coarse `status="ready"`, service, release version, request ID, and timestamp. Liveness returns the same safe shape with `status="alive"`.
- Readiness validates required configuration and Firestore availability without making a paid OpenAI request on each probe.
- A missing secret/configuration or failed required initialization returns `503`; provider degradation is represented separately so probes do not amplify an outage.

### Required metrics

Aggregate metrics include:

- Request count and success/failure category by endpoint/environment/release.
- Latency percentiles and provider timeout/unavailable counts.
- Automatic/client retries, idempotency replays/conflicts, and duplicate-message rate.
- Rate-limit/concurrency denials by pseudonymous class, never raw identity.
- OpenAI input/output tokens, estimated cost, configured model, and prompt version.
- Authentication failure categories and authorization denials.
- Guest storage warning/expiry categories without guest contents.
- Camera start/model-load/inference error categories without frames or facial data.
- Frontend crash-free sessions and redacted error category/release version.

Do not log request/response text, chat titles, camera frames, facial features, email, raw Firebase UID, raw guest ID, authorization headers or bearer tokens, Firestore document paths containing identifiers, provider bodies, or secrets.

### Initial objectives and alerting

| Signal | Objective / alert intent |
|---|---|
| Valid chat sends | At least 99% success excluding confirmed upstream-wide outages. |
| Accepted AI requests | At least 98% completion. |
| Duplicate messages | Below 0.1%; any sustained increase pages the service owner. |
| Crash-free sessions | At least 99.5%. |
| Camera start after grant | At least 95% on supported devices. |
| Pending UI feedback | Within 300 ms. |
| App usable P75 | Within 3 seconds on representative mobile/4G. |
| Chat-list load P95 | Within 2 seconds for a typical account. |
| Cross-user access | Zero; any confirmed case is a critical privacy incident. |

Alerts are required for elevated AI failure, authentication anomaly, authorization-denial anomaly, severe latency, cost spikes, duplicate growth, and health/readiness failure. Alerts must identify environment and release without sensitive content.

## Access and retention operations

- Restrict production Firebase, Vercel, OpenAI, logs, and alerting access by least privilege and reviewed groups.
- Operators have no consumer admin UI and no default access to raw conversations.
- Guest data expires locally after 30 minutes of inactivity or explicit guest exit.
- Registered conversations remain until user deletion or an approved retention policy changes.
- Operational metadata retention must be approved before launch and contain no raw text by default.
- Document vendor retention, storage regions, backups, deletion behavior, processors, and user contact paths in the privacy notice.
- Review access quarterly and immediately after personnel/role changes or an incident.

## Privacy and safety deployment gates

No public release or material model/prompt/policy change proceeds without:

- Independent safety review of prompts, high-risk routing, immediate-danger wording, and resource records.
- Passing direct, indirect, ambiguous, joking, quoted, fictional, and third-person safety cases.
- Confirmation that camera estimates cannot trigger crisis classification and text/self-report takes precedence.
- Confirmation that frames, landmarks, embeddings, screenshots, message bodies, emails, and raw identifiers are absent from APIs/analytics/logs as required.
- Current privacy notice, terms, support contact, processors, regions, retention/deletion, backup/vendor retention, and camera/provider disclosure.
- Market-specific legal/privacy approval; public MVP defaults to adults 18+.
- Security/privacy review with no unresolved critical or high finding and safety evaluation with no unresolved critical failure.

## Incident response framework

### Severity

- **SEV-1:** Confirmed/suspected cross-user access, facial data leaving the browser, secret exposure, materially unsafe crisis behavior, destructive data corruption, or widespread total outage.
- **SEV-2:** Sustained AI/Firebase/auth failure, severe latency, large cost/abuse spike, broken deletion, or camera model failure without privacy exposure.
- **SEV-3:** Contained degradation with a working safe fallback.

For every incident: assign commander/communications/technical leads, record UTC timestamps and release/config versions, preserve evidence without copying private content, contain first, publish only reviewed user communications, and create a blameless follow-up with owners and due dates.

## Rollback runbook

### Application/API deployment

1. Freeze further promotions and record the failing deployment/release.
2. Confirm whether the previous immutable deployment is compatible with current rules/schema/config.
3. Route production back to that deployment using Vercel's approved rollback/promote workflow.
4. Run health, auth, ownership, send/idempotency, guest, and safe-camera smoke tests.
5. Continue incident monitoring; rollback completion is not incident closure.

### Prompt, model, or safety resources

1. Stop the staged rollout and capture active model/prompt/policy/resource versions.
2. Restore the last independently reviewed configuration and its compatible output limits.
3. Redeploy/promote server configuration without changing browser bundles unless required.
4. Run the versioned AI/safety evaluation before returning to full traffic.
5. Never fail over to an unapproved model/provider or invent regional resource data.

### Camera model

1. Force the feature to `unavailable` while text chat remains active.
2. Restore the prior immutable controlled-origin manifest/assets; retain old assets long enough for cached clients.
3. Revalidate integrity, performance, normalization, threshold/stability, and no-upload behavior.
4. Never enable randomized/demo emotion fallback.

### Firestore rules/indexes

1. If exposure is possible, deploy the safest deny-first reviewed rule set immediately.
2. Restore a known-good rules/index version compatible with both current and previous app deployments.
3. Run emulator plus production-safe owner/non-owner probes.
4. Treat any possible cross-user exposure as a SEV-1 privacy incident.

### Data migration

Do not run an automatic reverse migration. Pause the apply, preserve checkpoints, keep/restore dual-read, run `npm run migrate:plan`, and use a reviewed compensating migration only after ownership/count/data-loss analysis. Resume only from an idempotent checkpoint.

## Provider/Vercel outage runbook

1. Confirm scope through health, failure categories, latency, release comparison, and provider status without sending private test content.
2. Freeze deployments and prevent retry storms; preserve the one-automatic-retry ceiling.
3. Keep user text visible with inline pending/failed status and idempotent retry. Do not create duplicate messages.
4. For OpenAI failure, show stable temporary-unavailable messaging. Do not silently switch to an unreviewed provider/model.
5. For Vercel/API failure, preserve local composer/guest state and restore the last known-good deployment if release-correlated.
6. Verify recovery with synthetic and approved safety fixtures, then gradually restore traffic/retry settings.

## Firebase/Auth outage runbook

1. Determine whether Auth, Firestore reads, writes, rules, or indexes are affected.
2. Do not show stale or another user's cached data during uncertain auth restoration.
3. Registered features enter an explicit unavailable/read-only state as appropriate; do not silently convert registered conversations into guest data.
4. Guest local chat may continue if safe, but AI still requires a valid signed guest API session and available Vercel/OpenAI services.
5. Avoid unbounded write queues. Retried writes keep original idempotency keys.
6. After recovery, verify auth restoration, ownership denial, ordering, duplicate rate, and pending/failed reconciliation.

## Cost-spike runbook

1. Validate the alert against OpenAI usage, token counts, request rate, model/prompt version, and Vercel traffic; do not inspect message bodies by default.
2. Identify whether growth is legitimate traffic, abuse, retry amplification, configuration regression, or compromised credentials.
3. Contain with existing rate/concurrency limits, block abusive pseudonymous/IP signals, and stop retry amplification.
4. If needed, pause guest AI generation before registered service, reduce approved history/output budgets, or roll back the model/prompt. Any changed generation profile must remain within evaluated bounds.
5. Rotate credentials if compromise is suspected.
6. Restore limits gradually and update forecasts/alerts after root-cause review.

## Abusive-traffic runbook

1. Confirm rate-limit, origin, safety, and cost signals without collecting prohibited identifiers/content.
2. Tighten per-session/account and privacy-reviewed IP limits through server configuration or the durable limiter.
3. Reject oversized, malformed, replayed, or excessive concurrent requests before provider invocation.
4. Rotate the guest signing secret only if token forgery is suspected; plan for active guest API sessions to re-establish without deleting local conversations.
5. Do not weaken privacy controls to investigate routine abuse.

## Credential-rotation runbook

1. Create a replacement credential in the provider with minimum scope.
2. Add it to the correct Vercel environment; never expose it through `VITE_*`.
3. Validate health and a synthetic request on preview, then production.
4. Revoke the old credential after propagation and verify error/cost signals.
5. For HMAC/guest secrets, support a brief dual-key verification window when possible, then remove the old key and expire affected sessions.
6. Record actor, reason, UTC time, affected environments, and verification evidence without recording secret material.

## Privacy incident runbook

Examples include cross-user access, raw conversation logging, facial data upload/persistence, secret leakage, unauthorized operator access, or incorrect vendor/retention behavior.

1. Declare SEV-1 and restrict incident access to the response team.
2. Contain the affected endpoint, deployment, log sink, integration, account, model asset, or credential. Prefer safe feature disablement to continued exposure.
3. Preserve relevant audit evidence; do not copy raw conversations into tickets or chat rooms.
4. Determine data categories, users/regions, duration, processors, access path, backups, and whether data remains accessible.
5. Rotate credentials and deploy deny-first rules when relevant.
6. Engage privacy/legal and safety reviewers to decide required user/regulator/vendor notifications and timelines. Do not make unsupported assurances.
7. Correct or delete improperly retained data where legally/technically appropriate and verify downstream/vendor handling.
8. Validate the fix with security/privacy tests, monitor recurrence, document root cause, and update notices/runbooks/controls.

## Safety-regression runbook

1. Treat an unsafe immediate-danger response, claim of monitoring/rescue, diagnostic certainty, or camera-triggered crisis routing as potentially SEV-1.
2. Capture only the minimum controlled evaluation fixture and version metadata; avoid copying a real user's conversation.
3. Stop the prompt/model/policy rollout and restore the last reviewed combination.
4. If safe behavior cannot be assured, disable AI generation and present reviewed service-unavailable/non-emergency guidance. Do not improvise resource numbers.
5. Re-run the complete safety set, including ambiguous and quoted/fictional cases, before restoration.
6. Obtain independent safety approval for the remediation.

## P1/P2 operational exclusions

The MVP has no production runbook, SLO, migration, or support commitment for quotes, emotion correction/self-report, generated titles, chat search, guest migration, self-service export, voice, uploads, native apps, localization, social/payment features, dark theme, or cross-device guest data. Streaming and cancellation are excluded unless explicitly promoted to P0 and all reliability/accessibility/rollback requirements are added before release.
