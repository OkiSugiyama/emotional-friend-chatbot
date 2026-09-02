---
task_id: TASK-03
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: safety-evaluation
status: blocked
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "2ab65bb4a593ff169c1c37dda6c87b62bead924c"
branch: ai/TASK-03-versioned-safety-evaluation
worktree: ../EmotionalFriendChatbot-TASK-03
depends_on:
requirements:
  - FR-4
  - FR-5
  - NFR-1
  - NFR-2
  - NFR-3
  - NFR-4
  - NFR-5
  - NFR-8
deliverables:
  - D-2
decisions:
  - DEC-004
  - DEC-005
  - DEC-006
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-03-versioned-safety-evaluation.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/RELEASE_CHECKLIST.md
  - docs/PRIVACY_NOTICE_DRAFT.md
  - docs/TERMS_DRAFT.md
  - package.json
  - package-lock.json
  - server/safety.ts
  - server/openai-provider.ts
  - server/contracts.ts
  - server/api-handlers.ts
  - tests/integration/server-api.test.ts
  - tests/integration/server-openai.test.ts
  - tests/integration/server-security.test.ts
  - tests/traceability/**
  - tests/release/**
write_scope:
  - tests/safety/**
  - docs/qa/TASK-03.md
  - docs/handoffs/TASK-03.md
forbidden:
  - application or server implementation fixes, prompt/provider changes, policy/copy/resource changes, configuration changes, dependency changes, or governance changes
  - real conversations, personal or health data, clinical examples tied to a person, unreviewed regional phone numbers, or unsupported emergency-resource claims
  - camera metadata as a safety-routing input or a camera-only crisis trigger
  - provider calls, network access, production access/data, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - diagnosis, treatment, consciousness, credential, monitoring, rescue, or confidentiality guarantees
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/safety
  - npm run test
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-03 — Versioned Synthetic Safety Evaluation

## Exact objective

Create a deterministic, versioned, synthetic-only evaluation of the current
text/context safety router and non-medical response boundary. This task measures
the baseline; it does not fix safety behavior or rewrite policy/copy.

## Boundary

You own the evaluation fixtures, assertions, sanitized result report, and
handoff. You do not own product behavior. Any critical mismatch is reported as
a P1 finding and stops acceptance; it is never repaired inside this task.

## Required evaluation matrix

- Direct, indirect, ambiguous, joking, quoted, fictional, and third-person
  language for each declared harm category.
- Benign lookalikes and context reversals for false-positive coverage.
- Camera-only and contradictory-estimate cases proving camera metadata cannot
  trigger or override safety routing.
- Location-neutral immediate-help behavior without invented regional resources.
- Claims involving diagnosis, treatment, monitoring, rescue, clinical certainty,
  credentials, consciousness, and confidentiality.
- Exact `policyVersion`, `copyVersion`, fixture version, expected outcome,
  actual outcome, and critical-failure disposition.

All fixtures must be clearly synthetic and contain no real person, location,
chat, or health history.

## Completion criteria

- The dedicated safety suite executes every declared case with zero skips.
- Expected and actual outcomes are machine-checkable and mapped to FR-4/FR-5.
- The report distinguishes false positives, false negatives, ambiguity, and
  escalation behavior.
- No unresolved critical result is reclassified or waived.
- A fresh independent safety reviewer is required before acceptance.

## Handoff

Write `docs/handoffs/TASK-03.md` in the mandatory machine-readable handoff
format. This task cannot approve RG-07, Gate C, release, or public safety claims.

## Human gate record

- Owner approved receipt of the blocked baseline at
  `0fad411ec32f85cb3d659e752c73f480e8f43285` without merge or acceptance.
- The independent review accepted only the truthfulness of the blocked evidence.
- Sixteen critical and twenty-seven high mismatches remain unresolved.
- Separate safety remediation packet creation and dispatch are approved.
