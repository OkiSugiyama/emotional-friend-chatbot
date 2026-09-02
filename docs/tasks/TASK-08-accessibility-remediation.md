---
task_id: TASK-08
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: accessibility-remediation
status: ready
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "fe79e5d7d20048db5725a673011a54f32f61decd"
branch: ai/TASK-08-accessibility-remediation
worktree: ../EmotionalFriendChatbot-TASK-08
depends_on:
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
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-08-accessibility-remediation.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/ARCHITECTURE.md
  - package.json
  - package-lock.json
  - src/App.tsx
  - src/components/AppView.tsx
  - src/styles/**
  - tests/accessibility/app-view.a11y.test.tsx
  - tests/accessibility/manual-checklist.test.ts
  - tests/unit/client-session-lifecycle.test.ts
  - ../EmotionalFriendChatbot-TASK-05/docs/qa/TASK-05.md
  - ../EmotionalFriendChatbot-TASK-05/docs/qa/artifacts/TASK-05/**
  - ../EmotionalFriendChatbot-TASK-05/tests/accessibility/MANUAL_CHECKLIST.md
  - ../EmotionalFriendChatbot-TASK-05/docs/handoffs/TASK-05.md
write_scope:
  - src/components/AppView.tsx
  - src/styles/app-view.css
  - src/styles/global.css
  - src/styles/tokens.css
  - tests/accessibility/app-view.a11y.test.tsx
  - docs/qa/TASK-08.md
  - docs/handoffs/TASK-08.md
forbidden:
  - frozen contract, auth/session/message/camera/safety API schema, business logic outside presentation, dependency, lockfile, configuration, or governance changes
  - weakening or deleting existing accessibility assertions, suppressing axe findings, or claiming manual/platform coverage from automated tests
  - changing safety wording, camera consent meaning, storage/retention behavior, or privacy boundaries
  - real account, conversation, personal/health data, physical camera, secret, credential, production data, provider call, network access, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/accessibility tests/unit/client-session-lifecycle.test.ts
  - npm run test
  - npm run build
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-08 — Accessibility Finding Remediation

## Exact objective

Remediate FIND-001 through FIND-005 from the independently reviewed TASK-05
baseline while preserving product behavior and the frozen interfaces.

## Evidence input

TASK-05 at `5852f8a4ad8d42aa640d36e1639fa8ebbb2cb758` is blocked evidence,
not an accepted dependency. Read its final QA, findings, transcript, contrast,
limitations, and checklist; do not modify or merge that worktree.

## Required implementation

- Add an early keyboard bypass that reaches the active conversation before
  repeated chat-navigation controls.
- On guest expiry, move focus predictably to the new explanation/next action
  and expose the privacy-significant transition as an appropriate status.
- Render an inline failed reply after and adjacent to its affected user message
  in visual and accessibility order, preserving retry/edit operation.
- Replace the looping human-typing-like dots with a neutral, non-imitative,
  perceivable reply-progress treatment, including reduced-motion behavior.
- Raise meaningful input, composer, secondary-button, and region-control
  boundaries to at least 3:1 against their adjacent surfaces without relying on
  color alone or weakening the visible focus treatment.

## Boundary

You own presentation-layer implementation and regression tests for the five
findings, plus the QA report and formal handoff. You do not own auth, storage,
message, provider, safety, or camera-domain behavior; do not change contracts or
copy semantics to avoid an accessibility assertion.

## Completion criteria

- Automated tests cover positive, negative, focus-return, ordering, reduced-
  motion/static-status, and contrast-token behavior for all five findings.
- Existing accessibility and session-lifecycle tests remain enabled and pass.
- Full suite and build pass locally.
- QA explicitly states that VoiceOver/NVDA/mobile/exact-viewport manual evidence
  remains pending until a separately authorized rerun.
- A fresh independent accessibility reviewer must inspect the exact final SHA.
- This task cannot approve D-5, RG-05, Gate C, release, or publication.

## Handoff

Write `docs/handoffs/TASK-08.md` from the mandatory handoff template with exact
commands, finding-to-test mapping, residual manual gaps, and contract deviations.
