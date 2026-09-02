---
task_id: TASK-04
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: privacy-qa
status: blocked
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "2ab65bb4a593ff169c1c37dda6c87b62bead924c"
branch: ai/TASK-04-camera-privacy-evidence
worktree: ../EmotionalFriendChatbot-TASK-04
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
  - docs/tasks/TASK-04-camera-privacy-evidence.md
  - docs/ARCHITECTURE.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/PRIVACY_NOTICE_DRAFT.md
  - docs/RELEASE_CHECKLIST.md
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
  - tests/accessibility/app-view.a11y.test.tsx
  - tests/traceability/**
write_scope:
  - docs/qa/TASK-04.md
  - docs/qa/artifacts/TASK-04/**
  - docs/handoffs/TASK-04.md
forbidden:
  - application source, tests, models, assets, configuration, dependency, or governance changes
  - physical camera use, real face/video/frame/landmark/embedding/biometric-like data, screenshots of a person, or real conversation/personal/health data
  - raw HAR, browser profile, token, cookie, authorization header, email, raw identity, message text, or unsanitized request/response body in evidence
  - remote model origin, provider call, production access/data, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/unit/client-camera.test.ts tests/unit/client-emotion.test.ts tests/unit/client-session-lifecycle.test.ts tests/unit/client-firestore-repository.test.ts tests/accessibility/app-view.a11y.test.tsx
  - npm run build
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-04 — Browser-Local Camera Privacy Evidence

## Exact objective

Produce sanitized local-browser evidence that optional expression estimation
stays inside the frozen consent, processing, transmission, persistence, and
teardown boundaries. Observe only; do not repair implementation findings.

## Boundary

Use deterministic synthetic/fake media only. Do not activate the physical
camera. The text chat must remain usable for every camera-off, denied,
unsupported, model-failure, no-face, stop, hidden-page, sign-out, and guest-expiry
case.

## Required runtime evidence

- Camera defaults off and no model load or permission request occurs before
  explicit intent and notice acceptance.
- Media request is video-only; no microphone request occurs.
- Local display and `use for reply tone` are independent and revocable states.
- Network observation shows zero raw frame/video/landmark/embedding/biometric-like
  egress and records only sanitized request categories/origins.
- Browser storage inspection shows zero raw or derived camera payload persistence
  outside the approved coarse consent/settings boundary.
- Low confidence, no face, remote model origin, model error, and inference error
  resolve to neutral/unavailable without fabrication.
- Stop, hidden page, sign-out, expiry, and unmount terminate every synthetic
  track/timer and prevent overlapping inference.
- Positive text with an estimated-sad signal preserves text precedence.

Evidence artifacts must contain only sanitized summaries, timestamps, synthetic
fixture identifiers, counts, and hashes. Do not retain raw browser captures.

## Completion criteria

- All required lifecycle cases have an independently reproducible result.
- Raw/derived visual egress and persistence counts are zero, or the task returns
  a P1/P2 finding without fixing it.
- The owner-owned untracked UI directory remains untouched and unstaged.
- A fresh privacy/security reviewer is required before acceptance.

## Handoff

Write `docs/handoffs/TASK-04.md` in the mandatory machine-readable handoff
format. This evidence alone cannot approve RG-06, Gate C, or production use.

## Human gate record

- Owner approved receipt of the blocked baseline at
  `a2c4a5fe3b50fb48090791680a482665c255a9ee` without merge or acceptance.
- The independent review accepted only the truthfulness of the blocked evidence.
- Required fake-media browser runtime observations remain incomplete.
- Separate browser-local privacy evidence packet creation and dispatch are approved.
