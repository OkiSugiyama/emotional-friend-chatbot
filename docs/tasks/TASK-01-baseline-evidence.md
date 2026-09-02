---
task_id: TASK-01
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: qa-baseline
status: blocked
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "94c7b2341720f74d770c35576ce02fb4820b7d27"
branch: ai/TASK-01-baseline-evidence
worktree: ../EmotionalFriendChatbot-TASK-01
depends_on:
requirements:
  - FR-1
  - FR-2
  - FR-3
  - FR-4
  - FR-5
  - FR-6
  - FR-7
  - FR-8
  - FR-9
  - NFR-1
  - NFR-2
  - NFR-3
  - NFR-4
  - NFR-5
  - NFR-8
deliverables:
  - D-1
decisions:
  - DEC-004
  - DEC-005
  - DEC-006
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-01-baseline-evidence.md
  - package.json
  - package-lock.json
  - tsconfig.json
  - tsconfig.*.json
  - vite.config.*
  - vitest.config.*
  - firebase.json
  - firestore.rules
  - vercel.json
  - README.md
  - docs/**
  - src/**
  - server/**
  - api/**
  - tests/**
  - .env.example
write_scope:
  - docs/qa/TASK-01.md
  - docs/handoffs/TASK-01.md
forbidden:
  - application source, tests, configuration, or dependency changes
  - frozen contract, AGENTS.md, Definition of Done, or task packet changes
  - any .env file other than .env.example
  - secrets, credentials, personal data, health data, or real conversation content
  - fixing or suppressing findings discovered by this task
  - provider or production calls, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test
  - npm_config_offline=true npm run test:rules
  - npm run test:coverage
  - npm run build
  - npm_config_offline=true npm run check
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-01 — Baseline Evidence

## Objective

Establish a reproducible, local-only baseline of the repository against frozen contract revision `1`. This task observes and reports; it does not fix, reclassify, or suppress findings.

## Required context

Read the frozen contract from:

`../../cloudHead/projects/personal_projects/emotional-friend-chatbot/requirements.md`

If that file or revision `1` is unavailable, stop and report the blocker. Do not substitute repository prose for the frozen contract.

## Procedure

1. Confirm the assigned worktree and branch match the packet.
2. Read only the authorized scope and inventory the current implementation, tests, and documented release-gate state.
3. Run the acceptance commands exactly as listed, locally, without provider credentials or production access.
4. Do not repair failures. Classify each finding by affected requirement, severity, reproducibility, and whether it is a structural check or release-readiness gap.
5. Write `docs/qa/TASK-01.md` and `docs/handoffs/TASK-01.md` only.

## Required evidence

The QA report must include:

- Git base revision, operating system, Node version, npm version, and lockfile-install outcome.
- Exact command results, test counts, failures, skips, warnings, and relevant local limitations.
- Current status of release gates RG-01 through RG-10, without converting absence of evidence into a pass.
- A requirement-by-requirement baseline for the listed FRs and NFRs.
- Separate sections for AI safety, optional consent, browser-local emotion estimation, incorrect-inference recovery, non-medical boundaries, accessibility, and data handling.
- Findings ranked P1 through P4, with P1/P2 safety or privacy findings explicitly flagged for a human gate.
- A proposed decomposition into independently verifiable follow-up tasks. Do not create or dispatch those packets.

Use synthetic fixtures and sanitized metadata only. Do not include secrets, personal data, raw emotional signals, real chats, or restricted content in evidence.

## Acceptance

- Both authorized evidence files exist and contain the required sections.
- Every acceptance command has an exact recorded result; skipped commands include a concrete reason.
- No application, test, configuration, dependency, frozen-governance, or owner-owned file changed.
- The handoff clearly states that this task is baseline evidence, not release approval.

## Human gate record

- Owner response: `Shōnin`
- Decision: receive delivery head
  `f557992abfa63f7464a3529f80b647d6d6312d69` as accurate partial D-1
  baseline evidence.
- TASK-01 remains unaccepted and unmerged because the mandatory handoff gate
  cannot pass while the recorded rules and combined-check commands exit `1`.
- RG-01 through RG-10 remain pending. This decision is not Gate C or Gate D.
- Follow-up packet creation is approved for deterministic Firestore rules
  execution, versioned safety evaluation, browser-local camera privacy
  evidence, and manual accessibility review.
- Implementation and dispatch require a separate owner approval.
