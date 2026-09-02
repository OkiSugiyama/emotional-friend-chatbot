---
task_id: TASK-02
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: security-qa
status: blocked
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: ""
branch: ai/TASK-02-firestore-rules-evidence
worktree: ../EmotionalFriendChatbot-TASK-02
depends_on:
requirements:
  - FR-7
  - NFR-1
  - NFR-2
  - NFR-3
  - NFR-4
  - NFR-5
  - NFR-8
deliverables:
  - D-4
decisions:
  - DEC-004
  - DEC-005
  - DEC-006
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-02-firestore-rules-evidence.md
  - package.json
  - package-lock.json
  - firebase.json
  - firestore.rules
  - tests/security/firestore-rules.emulator.test.ts
  - tests/security/static-security-invariants.test.ts
  - tests/release/release-evidence.json
write_scope:
  - docs/qa/TASK-02.md
  - docs/handoffs/TASK-02.md
forbidden:
  - application source, tests, Firestore rules, configuration, dependency, lockfile, or governance changes
  - fetching or installing firebase-tools, changing npm cache/configuration, or adding a dependency without a separate PM-approved dependency decision
  - retrying, weakening, focusing, skipping, quarantining, or suppressing authorization checks to obtain a pass
  - any .env file, secret, credential, personal data, health data, real conversation, production Firebase project, or non-demo project identifier
  - provider calls, production access, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm_config_offline=true npm run test:rules
  - npm run test -- tests/security/static-security-invariants.test.ts
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-02 — Deterministic Firestore Rules Evidence

## Exact objective

Produce reproducible, local-only Firestore emulator evidence for the frozen
owner-scoping and field-integrity contract. This task observes the existing
rules and tests; it does not repair either one.

## Dispatch blocker

TASK-01, its fresh-context review, and the PM shell all reproduced
`ENOTCACHED` for `firebase-tools@15.26.0` in the isolated worktree. The owner
previously observed 7/7 passing in the primary checkout. Before dispatch, the
owner must separately approve a deterministic local/offline availability
method for the exact existing CLI version. The task may then be changed to
`ready`; the agent may not invent or fetch that method.

## Boundary

You own the sanitized runtime authorization matrix and its evidence report.
You do not own rule, test, dependency, or configuration changes. A failing rule
or test becomes a finding and a separately reviewed remediation proposal.

## Required evidence

- Record exact CLI/emulator versions and prove the demo project ID is used.
- Run all seven current emulator cases with exact pass/fail/skip counts.
- Map owner, non-owner, anonymous, forged ownership, malformed payload,
  trusted-message, deletion/tombstone, foreign-path, and server-only-operation
  behavior to FR-7 and D-4.
- Treat expected `PERMISSION_DENIED` output from negative tests as evidence, not
  as an unexpected failure, while preserving exact test assertions.
- Record zero production/provider access and sanitized metadata only.

## Completion criteria

- `npm_config_offline=true npm run test:rules` executes the emulator suite with
  zero skipped cases, or the task returns `partial`/`blocked` with exact evidence.
- Only the QA report and formal handoff change.
- A fresh security reviewer independently checks the matrix before acceptance.

## Handoff

Write `docs/handoffs/TASK-02.md` in the mandatory machine-readable handoff
format. Do not claim release, Gate C, or RG-04 approval.
