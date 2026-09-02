# TASK-05 — Manual accessibility review

Result: **BLOCKED** for D-5, RG-05, Gate C, release, and publication.

The corrected local Safari review completed 41 of 84 checklist observations: 36 observed passes and 5 observed findings. Forty-three items remain pending with concrete evidence, environment, or journey limitations. This audit did not modify application source, automated tests, configuration, or dependencies, and it did not fix findings.

## Scope and provenance

- Frozen contract revision: `1`
- Base/reviewed source revision: `2ab65bb4a593ff169c1c37dda6c87b62bead924c`
- Prior independent evidence review: exact head `1b5cdb1bcc0920a20363c8d7a9ae899af657d498`; outcome `changes-required` for row-level traceability and finding mappings
- Reviewer: OpenAI Codex, local accessibility-QA agent; not a fresh independent human approver
- Host/browser: local arm64 macOS `26.5.2`, Safari `26.5.2`
- Data: synthetic fixture/state only
- Physical camera: denied and never used
- Provider/cloud/production/connectors/deploy/publish/push/billing: not used

Detailed metadata is in [environment.md](artifacts/TASK-05/environment.md).

## Counts and findings

| Measure | Count |
|---|---:|
| Checklist total | 84 |
| Checked/observed | 41 |
| Observed pass | 36 |
| Observed finding | 5 |
| Pending/partial | 43 |
| Critical findings | 0 |
| High findings | 3 |
| Medium findings | 2 |

The unresolved findings are:

1. **FIND-001 high** — no bypass mechanism before the repeated chat/navigation block; 20 chats create more than 40 keyboard stops before the conversation.
2. **FIND-002 high** — guest expiry replaces a focused composer but leaves focus on the document and has no alert/status announcement.
3. **FIND-003 high** — the live guest failure path places `Reply failed` before the affected `You said` message in visual and accessibility order.
4. **FIND-004 medium** — the normal reply status uses looping three-dot human-typing-like animation.
5. **FIND-005 medium** — meaningful control borders calculate to 1.67:1 or 1.29:1 against white/similar surfaces.

See [findings.md](artifacts/TASK-05/findings.md) for exact FR/AC/A11Y/WCAG mapping and release impact. No finding was remediated.

## Observed coverage

- Safari keyboard/focus: auth entry, invalid registration, reset entry, guest entry, chat create, overflow, rename/delete dialogs, drawer, multiline composer, local failure/retry, camera consent/denial, estimate switch, safety actions, and guest-expiry transition.
- Semantics: named auth controls/fields, navigation/conversation/message regions, message ownership, error descriptions, current/camera/failure states, safety actions, and inert literal HTML-like text.
- Responsive: Safari-confirmed 200% one-column reflow and drawer lifecycle; Safari-confirmed 250% at the minimum 768 UI-px window, approximately 307 CSS px.
- Stress: 100-character title, long synthetic display name, 20 chats, 12-paragraph response, and a 300-character unbroken string.
- Safety/privacy UX: camera denied without physical use; text chat remained usable; synthetic sad estimate remained non-alarming; synthetic safety state was calm, non-diagnostic, location-neutral, and made no monitoring/rescue claim.
- Contrast: exact token-pair ratios recorded; focus color passed, control-boundary tokens failed where 3:1 is required.

The sanitized transcript is in [safari-keyboard-transcript.md](artifacts/TASK-05/safari-keyboard-transcript.md), and responsive/contrast details are in [responsive-contrast.md](artifacts/TASK-05/responsive-contrast.md). The reproducible synthetic state harness is [manual-fixture.html](artifacts/TASK-05/manual-fixture.html).

## Pending platform and journey coverage

VoiceOver, Windows/NVDA, mobile screen readers, Chrome/Edge/Firefox, exact 320 CSS px, exact 390×844, software keyboard, touch, reduced motion, forced colors, increased text spacing, full focus visibility/non-obscuration, a distinct composer semantic region, exhaustive icon semantics, directly retained guest-migration copy, real camera lifecycle, registered auth restoration, successful assistant/live safety routing, and scroll-arrival remain pending. Reasons and release impacts are recorded individually in [platform-limitations.md](artifacts/TASK-05/platform-limitations.md) and in every pending checklist row.

No unavailable platform was converted to pass or N/A. Safari accessibility-tree output was not treated as VoiceOver evidence. The approximately 307 CSS px observation was not treated as an exact 320 CSS px run.

## Acceptance commands

The packet's eight commands were run once each in order. Exact exits and counts are recorded in [acceptance-commands.md](artifacts/TASK-05/acceptance-commands.md) and the machine-readable handoff.

Automated accessibility results are structural evidence only and do not close the pending manual coverage or findings.

## Decision

TASK-05 produces an honest local audit record but does not satisfy the D-5 acceptance condition. Three unresolved high findings and missing required platform/manual evidence block RG-05, Gate C, release, and publication. A fresh independent accessibility reviewer is required after remediation and after the missing platform matrix is exercised.
