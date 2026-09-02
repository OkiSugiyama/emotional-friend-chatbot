---
task_id: TASK-06
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: safety-remediation
status: invalid
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "1"
base_revision: "fe79e5d7d20048db5725a673011a54f32f61decd"
invalidated_at: "2026-08-30"
invalidated_by: "PM agent, under owner approval"
invalidated_reason: "contract revision 2 rewrote FR-5, which this packet is scoped to"
branch: ai/TASK-06-safety-remediation
worktree: ../EmotionalFriendChatbot-TASK-06
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
  - docs/tasks/TASK-06-safety-remediation.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/ARCHITECTURE.md
  - package.json
  - package-lock.json
  - server/safety.ts
  - server/contracts.ts
  - server/api-handlers.ts
  - server/openai-provider.ts
  - tests/integration/server-api.test.ts
  - tests/integration/server-openai.test.ts
  - tests/integration/server-security.test.ts
  - ../EmotionalFriendChatbot-TASK-03/tests/safety/**
  - ../EmotionalFriendChatbot-TASK-03/docs/qa/TASK-03.md
  - ../EmotionalFriendChatbot-TASK-03/docs/handoffs/TASK-03.md
write_scope:
  - server/safety.ts
  - tests/safety/**
  - tests/integration/server-api.test.ts
  - tests/integration/server-openai.test.ts
  - docs/qa/TASK-06.md
  - docs/handoffs/TASK-06.md
forbidden:
  - frozen contract, safety API/category schema, provider request/response interface, prompt/copy/resource, dependency, configuration, or governance changes
  - weakening, deleting, focusing, skipping, quarantining, reclassifying, or retrying away any TASK-03 case
  - camera metadata as a safety-routing input or a camera-only crisis trigger
  - diagnosis, treatment, clinical certainty, credentials, consciousness, monitoring, rescue, or confidentiality guarantees
  - real conversation, person, location, health history, regional phone number, personal data, secret, credential, or production data
  - provider calls, network access, production access, cloud execution, connectors, deployment, publication, push, billing, or repository visibility changes
  - UI Mockup/web-app-ui-design-brief/
acceptance_commands:
  - node --version
  - npm --version
  - npm ci --offline
  - npm run typecheck
  - npm run test -- tests/safety tests/integration/server-api.test.ts tests/integration/server-openai.test.ts tests/integration/server-security.test.ts
  - npm run test
  - npm run build
  - git status --short
  - git diff --check
isolation_level: audit
risk_class: high
human_gate_required: true
---

# TASK-06 — Safety Router and Output Boundary Remediation

## Exact objective

Resolve the four independently reviewed TASK-03 findings without changing the
frozen safety interface: fourteen critical indirect/ambiguous routing misses,
twenty-one contextual false positives, two critical monitoring/rescue output
claims, and six additional non-medical claim-boundary gaps.

## Evidence input

TASK-03 at `0fad411ec32f85cb3d659e752c73f480e8f43285` is blocked evidence,
not an accepted dependency. Copy its versioned synthetic fixtures into this
task worktree, preserve every case and disposition, and make the current
implementation satisfy them. Do not merge or modify the TASK-03 worktree.

## Boundary

You own the smallest deterministic change to `server/safety.ts`, the copied
versioned safety regression suite, directly affected integration assertions,
the sanitized QA report, and the formal handoff. You do not own policy/category
schema, user-facing safety copy, regional resources, provider prompts, camera
behavior, dependencies, or contract changes.

## Required behavior

- Route direct, indirect, ambiguous, joking-current, quoted-current, and
  third-person current danger for every declared category.
- Do not route explicitly fictional, benign-reference, or clearly corrected
  prior-context text when no current risk remains.
- Preserve stronger written-risk precedence; camera metadata remains excluded.
- Reject bounded synthetic output containing diagnosis, treatment, monitoring,
  guaranteed rescue, clinical certainty, credential, consciousness, or
  confidentiality claims while preserving ordinary supportive output.
- Preserve exact policy/copy versions and location-neutral behavior.

## Completion criteria

- All 75 TASK-03 cases execute with zero skip/focus/quarantine and no critical
  or high mismatch.
- Positive and negative integration behavior remains covered.
- The full suite and build pass locally.
- A fresh independent safety reviewer must review the exact final SHA.
- This task cannot approve RG-07, Gate C, release, or public safety claims.

## Handoff

Write `docs/handoffs/TASK-06.md` from the mandatory handoff template and record
exact case counts, commands, versions, residual risks, and contract deviations.

## Invalidated against contract revision 2 — 2026-08-30

This packet is **marked invalid**, not regenerated, under step 5 of the contract
change rule. It was authored against revision 1 and its scope includes FR-5,
which revision 2 rewrote in full.

**Why invalid rather than regenerated.** Revision 2 removed FR-5's dependency on
classifier recall and replaced it with a detection-independent duty. This
packet's acceptance oracle is built on the recall premise, so regenerating it
would mean writing a new packet against a requirement that no longer asks for
what this one was scoped to deliver.

**Why no replacement packet exists yet.** A regenerated FR-5 router packet would
need a new acceptance instrument: a corpus authored, frozen, and SHA-256
registered before it touches the implementation. Creating one now would burn it
as an uncontaminated generalization instrument before there is any decision to
resume router work. It must be created at the start of that work, not before.

**Standing of the branch.** `ai/TASK-06-safety-remediation` is recorded FAIL and
is not merged. Its work remains readable for its measurement record; it carries
no accepted deliverable. D-2, RG-07, and Gate C remain unapproved.

**Superseded figures.** Neither the 82.9% routing residual nor the earlier 8/76
held-out figure may be cited as an acceptance instrument. See
`docs/handoffs/TASK-06.md` and the revision 2 entry in the contract.
