---
task_id: TASK-09
project_id: 01M0Z716GT7DXBMSXNVNHTSFT2
role: safety-product-boundary
status: ready
contract_path: projects/personal_projects/emotional-friend-chatbot/requirements.md
contract_revision: "2"
base_revision: "e79a0e74f87aa5a1906520a5ab3e192890b7e543"
revised_at: "2026-08-30"
revised_by: "PM agent, under owner approval"
revised_reason: "re-pointed from contract revision 1 to revision 2; FR-5 scope"
branch: ai/TASK-09-persistent-help-affordance
worktree: ../EmotionalFriendChatbot-TASK-09
depends_on: TASK-08
requirements:
  - FR-5
  - FR-8
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
  - DEC-007
read_scope:
  - AGENTS.md
  - docs/project.yaml
  - docs/DEFINITION-OF-DONE.md
  - docs/tasks/TASK-09-persistent-help-affordance.md
  - docs/tasks/TASK-08-accessibility-remediation.md
  - docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md
  - docs/ARCHITECTURE.md
  - package.json
  - package-lock.json
  - src/App.tsx
  - src/components/AppView.tsx
  - src/styles/**
  - server/safety.ts
  - tests/accessibility/**
  - tests/unit/client-session-lifecycle.test.ts
  - docs/qa/TASK-08.md
  - docs/handoffs/TASK-08.md
write_scope:
  - src/components/AppView.tsx
  - src/styles/app-view.css
  - src/styles/tokens.css
  - tests/accessibility/persistent-help.test.tsx
  - tests/accessibility/app-view.a11y.test.tsx
  - docs/qa/TASK-09.md
  - docs/handoffs/TASK-09.md
forbidden:
  - frozen contract, safety routing, category schema, safety API/response metadata, provider interface, prompts, auth/session/message/camera schema, dependency, lockfile, configuration, or governance changes
  - any new crisis resource, region-specific phone number, hotline, service name, URL, or regional content of any kind
  - monitoring, guaranteed rescue, dispatch, diagnosis, treatment, clinical certainty, credential, consciousness, or confidentiality claims
  - weakening, deleting, or suppressing any TASK-08 accessibility assertion or axe coverage
  - implying the affordance detects risk, is monitored, or replaces emergency services
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

# TASK-09 — Detection-Independent Persistent Help Affordance

## Why this task exists

Independent measurement of the TASK-06 safety router at
`7940068e88147eea0813bf272578cef41e47ce76`, using 232 synthetic probes authored
and frozen before any contact with the implementation, found a residual routing
false-negative rate of **82.9%** (92 of 111 current-risk probes), including
**68.4%** on the plainest direct phrasing and **93%** on
`severe_medical_danger`. Failures run 13:1 in the dangerous direction.

The owner's decision is to stop making user safety depend on detection
succeeding. This task lowers the cost of a false negative instead of trying to
eliminate it. It does **not** modify the router.

## Exact objective

Add a calm, persistent, always-available, non-clinical help affordance to the
chat shell that a user can reach at any time **without the safety router having
routed anything**, and without it having detected, inferred, or classified
anything about them.

## Required behavior

- Present at all times in the chat application shell, in every session state
  (registered, guest, pre-expiry, post-expiry, failed reply, camera on or off).
  Its presence must not depend on message content, routing, or emotion state.
- Reachable by keyboard, exposed to assistive technology with a stable
  accessible name, and operable without color, hover, motion, or camera.
- Calm and non-alarming. It must not imply the app is watching the user,
  that risk was detected, or that anything was inferred about them.
- Location-neutral only. It may point the user toward local emergency services
  and trusted people in general terms. It must not name, number, or link any
  specific service, hotline, region, or organization.
- It must state plainly that Emotional Friend is not monitored and cannot
  provide emergency care, consistent with existing reviewed safety copy.
- Dismissible or collapsible if it occupies persistent visual space, but it must
  remain reachable after dismissal and must not be permanently removable in a
  way that defeats its purpose.
- No new dependency. No network call. No storage of anything about why the user
  opened it — opening it is not an event to record.

## Boundary and a known contract question

You own presentation-layer implementation and its regression tests only.

The frozen contract versions `safety-routing-v1` and
`location-neutral-placeholder-v1` govern the **`safety_support` response**, and
`camera-notice-v1` governs the camera notice. Contract revision 1 declares no
version slot for general UI help copy, and states that "UI owns calm,
accessible presentation." The PM's recorded reading is that a minimal
affordance which introduces **no new claim and no new resource** sits inside
that existing UI-presentation authority and needs no contract revision.

**That reading is an assumption, not a settled fact.** If satisfying this
packet would require you to introduce a new claim, a new resource, a new
versioned copy constant, or any change to `SAFETY_COPY_VERSION` or
`SAFETY_POLICY_VERSION`, then stop and escalate to the PM as a contract
deviation. Do not resolve it yourself. Reusing or closely mirroring the wording
already reviewed in `server/safety.ts` is the preferred route.

## Completion criteria

- Automated tests cover presence across every session state, keyboard
  reachability, accessible name and role, reduced-motion behavior, contrast
  tokens, dismiss-and-recover, and independence from routing and emotion state.
- A negative test asserts the affordance renders when the router returns no
  route, proving it does not depend on detection.
- A content test asserts absence of monitoring, rescue, dispatch, diagnosis,
  treatment, clinical-certainty, credential, consciousness, and confidentiality
  language, and absence of any digit sequence resembling a phone number.
- Every TASK-08 accessibility assertion and axe check remains enabled and
  passing. No existing assertion is weakened.
- Full suite and build pass locally.
- QA states explicitly that VoiceOver/NVDA/TalkBack, mobile, exact-viewport and
  rendered-contrast manual evidence remains pending, inherited from TASK-08.
- A fresh independent reviewer must inspect the exact final SHA.
- This task cannot approve D-5, RG-05, Gate C, release, or publication, and it
  does not remediate FR-5. The router's measured 82.9% residual stands.

## Handoff

Write `docs/handoffs/TASK-09.md` with exact commands, outcomes, the
finding-to-test mapping, the contract question above and how it resolved,
residual manual gaps, and contract deviations.

## Re-pointed to contract revision 2 — 2026-08-30

Regenerated under step 5 of the contract change rule. This packet is FR-5-scoped
and was authored against revision 1. `contract_revision` is now `"2"`.

The body above is left as written, because it is the instruction the implementing
agent actually worked to. Two passages in it are superseded by revision 2 and
must be read through this section instead.

**Superseded — "Boundary and a known contract question".** That section records
the PM's reading that a minimal affordance introducing no new claim and no new
resource sits inside existing UI-presentation authority and needs no contract
revision, and marks that reading as an assumption rather than a settled fact.
Revision 2 settles it in the other direction and in the packet's favour: FR-5
now states the affordance as an explicit, named requirement — "a
detection-independent, always-available, non-clinical help affordance that does
not require the router to fire and is reachable in every non-modal state
including before sign-in". The affordance no longer rests on an inferred
authority. The escalation instruction in that section still stands unchanged for
any new claim, new resource, or version-constant change.

**Superseded — completion criteria, final bullet.** "It does not remediate FR-5.
The router's measured 82.9% residual stands." Under revision 2 this packet
discharges FR-5's positive duty, and the delivered test that asserts the
affordance renders with no routing decision taken is the artifact revision 2's
acceptance oracle asks for. The router is no longer the subject of an FR-5
recall duty, so there is no residual for this packet to leave standing; the
82.9% figure is recorded in revision 2 as an observation, not standing evidence,
and must not be cited as an acceptance instrument.

**Unchanged.** This packet still cannot approve D-5, RG-05, Gate C, release, or
publication. The manual, device, and cross-engine evidence listed as pending is
still pending; see `docs/qa/TASK-09.md`.
