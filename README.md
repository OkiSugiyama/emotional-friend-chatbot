# Emotional Friend Chatbot

Emotional Friend Chatbot is a privacy-conscious conversational-support web app. It provides registered and temporary guest conversations, empathetic AI replies, and optional browser-local facial-expression context. It is not therapy, medical care, diagnosis, crisis monitoring, or an emergency service.

This repository is being rebuilt as a root Vite React TypeScript application with:

- Clerk authentication and user management, with Firestore at `users/{uid}/chats/{chatId}/messages/{messageId}`.
- Vercel TypeScript API functions.
- OpenAI Responses API behind a server-only provider adapter.
- Versioned guest data stored only in the browser.
- Lazy-loaded expression models served from a controlled application origin.

## License

[MIT](LICENSE). This repository is published as a portfolio record of the work.
The licence covers the code; nothing here is an offer of a service.

## Status

This is a working repository, not a released product. Nothing here is deployed,
and no release gate has been approved.

- **Not deployed.** There is no production environment, no live URL, and no
  production data. Every artifact in `docs/qa/` was produced locally against
  emulators and synthetic fixtures.
- **All ten release gates are pending.** `tests/release/release-evidence.json`
  records RG-01 through RG-10 with no attached evidence, and the file's own
  policy makes `pending` release-blocking. See
  [Integration state](docs/qa/INTEGRATION-STATE.md).
- **The test suite is deliberately red.** One test fails on purpose. The safety
  evaluation records 16 unresolved critical mismatches — indirect and ambiguous
  phrasings that the high-risk router does not catch — and the acceptance gate
  refuses to pass while they stand. Silencing it by skipping, excluding, or
  loosening the assertion is forbidden by the project's own rules, so it stays
  red until the router is fixed.
- **The safety evaluation does not run in this repository.** Its evaluated
  trigger set and corpus are not published — see
  [High-risk routing policy](#high-risk-routing-policy) — so the suite reports
  88 skipped tests rather than measuring against inputs it was not recorded
  against. With those inputs supplied, it runs in full and the gate above is
  red. That is why CI here is green while the safety gate is not passed: this
  repository is not where that gate is adjudicated.

The measured failure rate is published rather than hidden because a safety
system's honest weaknesses are the useful part of the record.

## Authority and documentation

Product and safety behavior is defined by [the rebuild requirements](docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md). The approved Claude Design project is the visual source of truth. Legacy UI styling is not authoritative.

- [Architecture](docs/ARCHITECTURE.md) — runtime boundaries, data contracts, API behavior, and security model.
- [Operations](docs/OPERATIONS.md) — environments, deployment, monitoring, rollback, and incident runbooks.
- [Release checklist](docs/RELEASE_CHECKLIST.md) — required evidence and launch gates.

When documentation conflicts, resolve it in this order: safety/privacy/accessibility, P0 requirements, approved architecture decisions, approved design system, then implementation convenience. Product changes must update the requirements and their traceability IDs.

## MVP scope

P0 includes authentication, a 30-minute guest demo, multiple chats, idempotent messaging, bounded conversational context, reviewed safety behavior, optional local expression estimation, responsive WCAG 2.2 AA UI, and production observability.

The following are intentionally excluded from the MVP:

- P1: inspirational quotes, emotion correction/self-report, guest-to-account migration, chat search, generated titles, account export/deletion UI, and streaming/cancellation if they cannot pass P0 reliability and accessibility gates.
- P2: voice, file/image input, native apps, localization beyond English UI, cross-device guest continuation, user tone/length preferences, social features, payments, advertising, and dark theme.
- Product non-goals: diagnosis, treatment, therapist matching, live crisis counseling, human monitoring, server-side camera processing, and training a production emotion-recognition model.

## Prerequisites

- A supported Node.js LTS release and npm.
- Firebase CLI access to isolated development/preview projects and the production project when authorized.
- Vercel CLI access to the linked project.
- A Clerk application with the intended email and Google sign-in methods enabled.
- An OpenAI project/API key for the correct environment.
- Reviewed Firebase rules/indexes, safety prompt/resource versions, and controlled-origin camera model assets.

Use `npx firebase-tools` and `npx vercel` if the CLIs are not installed globally.

## Environment variables

Never put a server secret in a `VITE_` variable. Vite intentionally exposes `VITE_*` values to the browser. Local environment files must remain uncommitted; Vercel environment variables are the production source of truth.

### Browser-visible variables

| Variable | Required | Purpose |
|---|---:|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Public Clerk publishable key consumed by the React SDK. |
| `VITE_FIREBASE_API_KEY` | Yes | Public Firebase web configuration; not an authorization secret. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase web SDK domain used by the transparent Firestore credential bridge. |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Environment-specific Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase web configuration only; uploads are not an MVP feature. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase web application configuration. |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web application ID. |
| `VITE_USE_FIREBASE_EMULATORS` | Local only | `true` connects the browser Firebase SDKs to local emulators; default/example is `false`. Production ignores or rejects emulator opt-in. |
| `VITE_FIREBASE_AUTH_EMULATOR_HOST` | Local only | Auth emulator host only; example `127.0.0.1`. |
| `VITE_FIREBASE_AUTH_EMULATOR_PORT` | Local only | Auth emulator port; example `9099`. |
| `VITE_FIRESTORE_EMULATOR_HOST` | Local only | Firestore emulator host only; example `127.0.0.1`. |
| `VITE_FIRESTORE_EMULATOR_PORT` | Local only | Firestore emulator port; example `8080`. |
| `VITE_RELEASE_VERSION` | Optional | Release identifier used only by the bounded client diagnostics contract. |

### Server-only variables

These names mirror the active `server/config.ts` contract. Defaults and bounds shown here are runtime-enforced.

| Variable | Production requirement | Default / purpose |
|---|---:|---|
| `NODE_ENV` | Set explicitly | `development`, `test`, or `production`; runtime default is `production`. |
| `ALLOWED_ORIGINS` | Required for readiness | Comma-separated exact origins. `*`, malformed origins, credentials/paths, and production HTTP origins are rejected. Development HTTP is limited to loopback hosts. |
| `RELEASE_VERSION` | Required for readiness | Immutable commit/deployment identifier returned by health/readiness and used in redacted telemetry. |
| `GUEST_TOKEN_HMAC_SECRET` | Required | At least 32 bytes; signs the current bearer guest token. |
| `SAFETY_IDENTIFIER_HMAC_SECRET` | Required | At least 32 bytes; derives the provider safety identifier without email/raw UID. |
| `RATE_LIMIT_HMAC_SECRET` | Required | At least 32 bytes; hashes rate-limit principals. |
| `CLERK_JWT_KEY` | Required for readiness | Server-only configuration containing Clerk's PEM JWT public key. It verifies session tokens without a runtime Clerk API call. |
| `FIREBASE_PROJECT_ID` | Conditional | Required with split credentials and for emulator mode. |
| `FIREBASE_CLIENT_EMAIL` | Conditional | Required with `FIREBASE_PROJECT_ID` and `FIREBASE_PRIVATE_KEY` when JSON credentials are not used. |
| `FIREBASE_PRIVATE_KEY` | Conditional | Required with split credentials; restore embedded newlines when loading. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional alternative | Accepted service-account JSON for local tooling/runtime configuration; never expose through `VITE_*`. Use only an approved production credential method. |
| `FIREBASE_USE_EMULATORS` | Must be `false` | Default `false`. `true` is allowed only outside production and requires the loopback hosts below while rejecting Admin credentials. |
| `FIRESTORE_EMULATOR_HOST` | Local server only | Host and port, normally `127.0.0.1:8080`; required when server emulator mode is enabled. |
| `FIREBASE_AUTH_EMULATOR_HOST` | Local server only | Host and port, normally `127.0.0.1:9099`; required when server emulator mode is enabled. |
| `OPENAI_API_KEY` | Required for readiness | Server-only OpenAI credential. |
| `OPENAI_MODEL` | Required for readiness | Evaluated Responses API model identifier. |
| `OPENAI_SYSTEM_PROMPT` | Required for readiness | Exact independently reviewed system prompt. |
| `OPENAI_PROMPT_VERSION` | Required for readiness | Immutable approved prompt version; example `ef-support-v1`. |
| `OPENAI_HISTORY_LIMIT` | Required/configured | Completed recent-message limit; default `5`, allowed `1–20`. |
| `OPENAI_TIMEOUT_MS` | Required/configured | Provider timeout; default `15000`, allowed `1000–60000`. |
| `OPENAI_MAX_OUTPUT_TOKENS` | Required/configured | Response ceiling; default `800`, allowed `64–8192`. |
| `GUEST_TOKEN_TTL_SECONDS` | Required/configured | Signed guest bearer-token lifetime; default `1800`, allowed `60–3600`. |
| `REQUEST_BODY_LIMIT_BYTES` | Required/configured | JSON request-body limit; default `65536`, allowed `8192–262144`. |
| `REGISTERED_RATE_LIMIT` | Required/configured | Registered-principal requests per rate window; default `20`, allowed `1–1000`. |
| `GUEST_RATE_LIMIT` | Required/configured | Guest-principal requests per rate window; default `5`, allowed `1–1000`. |
| `IP_RATE_LIMIT` | Required/configured | Privacy-reviewed address-based requests per window; default `30`, allowed `1–5000`. |
| `RATE_LIMIT_WINDOW_MS` | Required/configured | Shared rate window; default `60000`, allowed `1000–3600000`. |
| `DELETE_BATCH_SIZE` | Required/configured | Maximum child messages processed per deletion page; default `200`, allowed `1–400`. |
| `IDEMPOTENCY_TTL_SECONDS` | Required/configured | Metadata/result-reference retention; default `86400`, allowed `3600–2592000`. |
| `PROVIDER_CONCURRENCY_LIMIT` | Required/configured | Global provider lease budget; default `20`, allowed `1–100`. |
| `EMOTION_CONTEXT_MAX_AGE_MS` | Required/configured | Maximum accepted estimate age; default `300000`, allowed `1000–3600000`. |
| `EMOTION_CONTEXT_FUTURE_SKEW_MS` | Required/configured | Permitted client/server clock skew; default `30000`, allowed `0–300000`. |
| `SUPPORTED_CAMERA_NOTICE_VERSIONS` | Required/configured | Comma-separated accepted consent versions; default `camera-notice-v1`. |

### Migration-only variables

| Variable | Requirement | Purpose |
|---|---:|---|
| `MIGRATION_CONFIRM_PROJECT_ID` | Required by migration workflow | Must exactly identify the intended Firebase target before planning/applying. |
| `MIGRATION_BACKUP_REFERENCE` | Required for `migrate:apply` | Identifier of a verified, restorable backup. Apply must fail closed when it is absent. |

Rate limiting, idempotency, provider concurrency, and paged deletion use durable Firestore-backed operational metadata. Per-instance memory is not production authority. Configure Firestore TTL policies for `messageRequests.expiresAt`, `apiOperations.expiresAt`, `apiGuestMessageOperations.expiresAt`, `apiRateLimits.expiresAt`, and `apiProviderConcurrency.expiresAt`.

## Initial setup

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Link the local checkout to the non-production Vercel project and pull its development environment:

   ```sh
   npx vercel link
   npx vercel env pull .env.local
   ```

3. Add the browser and server emulator values from `.env.example` to `.env.local`: `NODE_ENV=development`, `ALLOWED_ORIGINS=http://localhost:5173`, `FIREBASE_USE_EMULATORS=true`, the server loopback host/port values, and the separate `VITE_*` host/port values. Omit Admin credentials in emulator mode. Confirm that `.env.local` is ignored before storing secrets in it.

4. Select an isolated Firebase project for emulator/development work. Never point automated tests at production.

5. Confirm that the pinned camera model files exist beneath the configured controlled-origin path and that their version/integrity information matches the approved release manifest.

## Firebase rules and emulators

Start Authentication and Firestore locally in a dedicated terminal:

```sh
npx firebase-tools emulators:start --only auth,firestore --project emotional-friend-local
```

The application must connect to emulators only when `VITE_USE_FIREBASE_EMULATORS=true`. Firestore rules are deny-by-default and may grant an authenticated user access only to `users/{uid}` when `request.auth.uid == uid`. Ownership is derived from authentication, never from a client-provided `ownerUid`.

Before deployment, test rules for owner, non-owner, unauthenticated, malformed, forged-ID, and oversized operations. Rules and indexes are deployed before the application that depends on them. See [Architecture](docs/ARCHITECTURE.md#firestore-security-model) and [Release checklist](docs/RELEASE_CHECKLIST.md#firebase-and-data).

## High-risk routing policy

`server/safety.ts` routes a message to a reviewed, location-neutral safety
response instead of the model when it matches a high-risk pattern. The trigger
set is **configuration, not source**, resolved in this order:

1. `SAFETY_POLICY_PATH`
2. `server/safety-policy.local.json` — gitignored
3. `server/safety-policy.json` — the shipped file

The shipped file is **illustrative**: one narrow phrase per category, enough to
exercise the routing path locally. It is not the set the safety evaluation was
run against, and it carries `policyVersion: "illustrative-v1"` so that no
evidence produced with it can be mislabelled. The evaluated set is a deployment
artifact and is deliberately absent, so that a tuned trigger set never enters
the repository as the policy is corrected. Note that the published synthetic
corpus necessarily contains phrases the router catches, so it reveals part of
the set regardless; see
[the publication record](docs/qa/SAFETY-POLICY-PUBLICATION.md).

`tests/safety/safety-evaluation.test.ts` therefore cannot run against a clone
without the evaluated policy. It fails one precondition test with an
explanation rather than reporting numbers for a policy it did not measure.

The user-facing `responseText` is public by design — it is what a person in
crisis actually reads, and it is checked against the UI for drift by
`tests/accessibility/persistent-help.test.tsx`.

See [Safety policy publication split](docs/qa/SAFETY-POLICY-PUBLICATION.md).

## Local development

Local full-stack development uses separate Vite and Vercel processes. Vite is the browser entry point and proxies `/api` to the local Vercel port.

1. Start the Firebase emulators in terminal one:

   ```sh
   npx firebase-tools emulators:start --only auth,firestore --project emotional-friend-local
   ```

2. Start the Vercel TypeScript API runtime in terminal two:

   ```sh
   npx vercel dev --listen 3000
   ```

3. Start Vite in terminal three:

   ```sh
   npm run dev
   ```

4. Open `http://localhost:5173`, matching the example `ALLOWED_ORIGINS`. Requests use `/api`; the configured Vite proxy forwards them to the separate Vercel process on `http://localhost:3000`.

This topology is required for testing authentication headers, correlation IDs, CORS, idempotency, rate limits, provider timeouts, and the real API envelope. Do not point local write tests at production.

## Guest API session contract

A demo session keeps chats/messages in versioned browser storage. To call protected guest APIs, the browser exchanges its UUID principal for a short-lived signed bearer token:

```http
POST /api/v1/guest-sessions
Origin: <exact ALLOWED_ORIGINS match>
Content-Type: application/json

{ "guestId": "123e4567-e89b-42d3-a456-426614174000" }
```

```json
{
  "requestId": "req_...",
  "token": "<signed-guest-token>",
  "guestId": "123e4567-e89b-42d3-a456-426614174000",
  "expiresAt": "2026-08-08T12:30:00.000Z"
}
```

Subsequent guest calls use `Authorization: Bearer <signed-guest-token>`. The server validates the exact `Origin`; the token does not relax CORS. Server-side guest operational records contain fingerprints/state/non-sensitive IDs/timestamps/expiry only—never user or assistant conversation text.

## Implemented package scripts

These scripts exist in the new package:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production build. |
| `npm run preview` | Serve the built Vite application for local inspection. |
| `npm run typecheck` | Run TypeScript checks without emitting output. |
| `npm run test` | Run the automated test suite once. |
| `npm run test:rules` | Start the Firestore emulator and run the ownership/integrity authorization matrix. |
| `npm run test:watch` | Run tests in watch mode for development. |
| `npm run test:coverage` | Run tests and produce coverage results. |
| `npm run migrate:plan` | Produce a read-only migration plan for `MIGRATION_CONFIRM_PROJECT_ID`. |
| `npm run migrate:apply` | Apply an explicitly approved plan; requires `MIGRATION_BACKUP_REFERENCE`. |
| `npm run check` | Run the package's combined local/CI verification command. |

Browser end-to-end, AI-safety evaluation, and production smoke coverage remain release gates without dedicated package scripts. Integration, accessibility, and Firestore authorization checks run through the commands above.

## Deployment

1. Pass the relevant sections of [the release checklist](docs/RELEASE_CHECKLIST.md).
2. Deploy reviewed Firestore rules/indexes to the target Firebase project.
3. Create a Vercel preview with preview-only credentials and run integration, accessibility, security, safety-evaluation, and smoke suites.
4. Verify the exact prompt, model, safety-resource, camera-model, and release versions.
5. Promote the already-tested immutable deployment to production.
6. Run production smoke checks without exposing developer credentials in the browser.
7. Monitor authentication, authorization denials, API failures, latency, rate limits, tokens, cost, and client crashes through the initial observation window.

Never share production secrets with development/preview, silently migrate guest chats, upload camera data, or deploy an unreviewed prompt/model/resource change. Detailed procedures and rollback/runbooks are in [Operations](docs/OPERATIONS.md).
