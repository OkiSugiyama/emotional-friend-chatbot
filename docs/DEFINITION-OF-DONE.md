---
document: "definition-of-done"
dod_version: "1"
effective_from: "2026-08-27"
project_id: "01M0Z716GT7DXBMSXNVNHTSFT2"
contract_revision: "1"
---

# Definition of Done — Emotional Friend Chatbot

A task is Done only when all applicable conditions below are met and evidenced in its handoff.

## Scope and contract

- The change stays within the assigned task packet's read/write scope and frozen contract revision.
- Every claimed requirement, deliverable, and decision is traceable to the frozen contract.
- No frozen interface changed without an approved contract revision.
- Unrelated user changes, especially `UI Mockup/web-app-ui-design-brief/`, remain unchanged and unstaged.

## Implementation quality

- The implementation is the smallest coherent change that satisfies the packet.
- Errors and degraded states are explicit; safety-critical behavior does not fail open.
- No secret, credential, personal data, health data, or real conversation content is introduced into source, fixtures, logs, screenshots, or evidence.
- New dependencies or lockfile changes have explicit PM approval.

## Verification

- Every packet acceptance command is run locally and its exact outcome is recorded.
- Relevant automated tests cover positive, negative, and boundary behavior.
- Safety, privacy, accessibility, and misuse-sensitive changes receive independent review evidence appropriate to their risk.
- Evidence distinguishes structural correctness from release readiness and identifies every skipped or blocked check.
- `git diff --check` passes, and the final diff contains only authorized files.

## Human-centered safety and privacy

- Emotion estimation is optional, consent-gated, and browser-local under contract revision `1`.
- No raw camera, microphone, biometric-like signal, inferred emotion, or conversation content is transmitted or persisted outside the approved boundary.
- Uncertain or incorrect emotion inference has a clear correction, dismissal, and no-consent path.
- User-facing content preserves the non-medical boundary and does not claim diagnosis, treatment, clinical certainty, or guaranteed crisis intervention.
- Safety evaluation uses synthetic cases and documents false-positive, false-negative, ambiguity, and escalation behavior.

## Handoff

- `docs/handoffs/<TASK-ID>.md` identifies files changed, commands run, outcomes, residual risks, and follow-up needs.
- Required QA evidence is stored in `docs/qa/` and contains no restricted material.
- The working tree is left reviewable, with no generated reports or local environment files accidentally staged.

## Explicitly not Done

The following require separate owner authorization and are not implied by task completion:

- Deployment, publication, repository visibility changes, or production access.
- Real provider calls, production data access, secret handling, or charge-incurring operations.
- Resolution of a P1/P2 safety or privacy finding without independent verification and the required human gate.
