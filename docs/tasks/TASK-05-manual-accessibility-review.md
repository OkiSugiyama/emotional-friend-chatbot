---
task_id: TASK-05
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: accessibility-qa
status: blocked
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "2ab65bb4a593ff169c1c37dda6c87b62bead924c"
branch: ai/TASK-05-manual-accessibility-review
worktree: ../EmotionalFriendChatbot-TASK-05
depends_on:
requirements:
  - FR-1
  - FR-2
  - FR-3
  - FR-6
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
  - docs/tasks/TASK-05-manual-accessibility-review.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/RELEASE_CHECKLIST.md
  - package.json
  - package-lock.json
  - src/App.tsx
  - src/components/AppView.tsx
  - src/**/*.css
  - tests/accessibility/**
  - tests/traceability/**
write_scope:
  - tests/accessibility/MANUAL_CHECKLIST.md
  - docs/qa/TASK-05.md
  - docs/qa/artifacts/TASK-05/**
  - docs/handoffs/TASK-05.md
forbidden:
  - application source, automated tests, configuration, dependency, or governance changes
  - checking an item without observed evidence or converting unavailable platform/assistive-technology coverage into pass or N/A without owner approval
  - real accounts, real conversations, personal/health data, physical camera use, secret, credential, production data, or unsanitized screenshot/transcript
  - provider calls, production access, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/accessibility
  - npm run build
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-05 — Manual Accessibility Review

## Exact objective

Execute and document the locally available WCAG 2.2 AA manual review for the
P0 auth, guest, chat, camera, safety, error, responsive, and motion states using
synthetic data only. Do not fix findings in this task.

## Boundary

You own observed checklist entries, sanitized evidence, finding classification,
and the handoff. You do not own UI or test changes. Every unavailable browser,
operating system, screen reader, mobile environment, or physical-input check
must remain unchecked and be reported as a concrete release-evidence gap.

## Required manual evidence

- Build revision, reviewer identity, date, OS, browser/version, viewport, zoom,
  input method, and assistive technology for every run.
- Keyboard-only completion and logical focus for auth, guest, chat, dialogs,
  retry/error, camera-off/denied, and safety-support journeys.
- Local VoiceOver + Safari evidence where available; unavailable NVDA/Windows
  and mobile screen-reader coverage remains pending rather than inferred.
- 320 CSS px, 200% zoom, increased text spacing, reduced motion, forced colors
  where available, contrast, touch-target, long-content, and software-keyboard
  behavior.
- Camera-independent operation and non-alarming, non-medical safety presentation.
- Findings mapped to FR/AC/A11Y identifiers and ranked without self-remediation.

Artifacts may contain sanitized annotations or transcripts, but no real identity,
conversation, face, camera image, credential, token, or browser profile data.

## Completion criteria

- Every checked item has traceable observed evidence.
- Every unchecked or unavailable item has a concrete reason and release impact.
- Automated accessibility tests are rerun but are not substituted for manual
  evidence.
- A fresh independent accessibility reviewer is required before acceptance.

## Handoff

Write `docs/handoffs/TASK-05.md` in the mandatory machine-readable handoff
format. This task cannot approve RG-05, Gate C, release, or publication by itself.

## Human gate record

- Owner approved receipt of the blocked baseline at
  `5852f8a4ad8d42aa640d36e1639fa8ebbb2cb758` without merge or acceptance.
- Final fresh-context review accepted only the truthfulness of the blocked evidence.
- Five findings and forty-three pending checklist items remain unresolved.
- Separate accessibility remediation packet creation and dispatch are approved.
