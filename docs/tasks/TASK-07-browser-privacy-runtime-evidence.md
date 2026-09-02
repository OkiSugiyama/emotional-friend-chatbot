---
task_id: TASK-07
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: privacy-evidence
status: ready
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "fe79e5d7d20048db5725a673011a54f32f61decd"
branch: ai/TASK-07-browser-privacy-evidence
worktree: ../EmotionalFriendChatbot-TASK-07
depends_on:
requirements:
  - FR-6
  - FR-7
  - NFR-1
  - NFR-2
  - NFR-3
  - NFR-4
  - NFR-5
  - NFR-6
  - NFR-8
deliverables:
  - D-3
decisions:
  - DEC-004
  - DEC-005
  - DEC-006
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-07-browser-privacy-runtime-evidence.md
  - docs/ARCHITECTURE.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/PRIVACY_NOTICE_DRAFT.md
  - package.json
  - package-lock.json
  - src/services/camera-expression-adapter.ts
  - src/services/firestore-repository.ts
  - src/hooks/use-camera-expression.ts
  - src/domain/emotion.ts
  - src/components/AppView.tsx
  - tests/unit/client-camera.test.ts
  - tests/unit/client-emotion.test.ts
  - tests/unit/client-session-lifecycle.test.ts
  - tests/unit/client-firestore-repository.test.ts
  - ../EmotionalFriendChatbot-TASK-04/docs/qa/TASK-04.md
  - ../EmotionalFriendChatbot-TASK-04/docs/qa/artifacts/TASK-04/**
  - ../EmotionalFriendChatbot-TASK-04/docs/handoffs/TASK-04.md
write_scope:
  - tests/privacy/**
  - docs/qa/TASK-07.md
  - docs/qa/artifacts/TASK-07/**
  - docs/handoffs/TASK-07.md
forbidden:
  - application source, existing tests, model assets, configuration, dependencies, lockfile, frozen contract, or governance changes
  - physical camera or microphone use, real face/video/frame/landmark/embedding/biometric-like data, screenshot of a person, real conversation, personal/health data, secret, credential, browser profile, cookie, token, authorization header, raw HAR, or unsanitized request/response body
  - remote model origin, provider call, production access/data, external URL, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - claiming zero egress, persistence, overlap, or teardown failures when a runtime observation is unavailable
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/privacy tests/unit/client-camera.test.ts tests/unit/client-emotion.test.ts tests/unit/client-session-lifecycle.test.ts tests/unit/client-firestore-repository.test.ts
  - npm run build
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-07 — Fake-Media Browser-Local Privacy Runtime Evidence

## Exact objective

Close the TASK-04 evidence blocker with a deterministic local Safari runtime
harness using fake media only. Produce sanitized, independently reproducible
network, storage, consent, lifecycle, fallback, no-overlap, and text-precedence
evidence without changing product behavior.

## Evidence input

TASK-04 at `a2c4a5fe3b50fb48090791680a482665c255a9ee` is blocked evidence,
not an accepted dependency. Preserve its null/unknown semantics and do not
modify or merge that worktree.

## Boundary

You own privacy-specific test instrumentation, a synthetic local runtime
harness under the TASK-07 artifact folder, sanitized observation summaries,
and the formal handoff. The harness may wrap fake `getUserMedia`, network, timer,
and browser-storage APIs, but it must not weaken or replace product code.

## Required evidence

- Before consent: zero permission requests and zero camera-model initialization.
- Media request: synthetic video only and audio false.
- Revocable local display and independent reply-tone state.
- Sanitized counts/categories for fetch, XHR, beacon, WebSocket, storage, and
  IndexedDB activity; no raw body/header/profile artifact is retained.
- Fake track/timer teardown for stop, hidden page, sign-out, expiry, unmount,
  and fatal error; maximum concurrent inference is one.
- Denied, unsupported, no-face, remote-model, load, and inference failures
  remain unavailable/neutral while text chat stays usable.
- Positive written text overrides a synthetic sad estimate.

Use local Safari/Computer Use only if available. Do not change persistent
browser settings. If safe runtime observation is unavailable, retain `null` or
`unobserved` and return blocked rather than inferring a pass.

## Completion criteria

- Every required case has a synthetic runtime result and a reproducible harness
  identifier, or an explicit blocker with no false zero.
- No raw or derived visual payload is transmitted or persisted by the observed
  product path.
- All artifacts are sanitized text/JSON/HTML with no real data or raw captures.
- A fresh privacy/security reviewer must inspect the exact final SHA.
- This task cannot approve RG-06, Gate C, production use, or publication.

## Handoff

Write `docs/handoffs/TASK-07.md` from the mandatory handoff template with exact
commands, observation counts, unavailable values, and retained-artifact counts.
