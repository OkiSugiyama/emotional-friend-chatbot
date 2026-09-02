# TASK-05 accessibility findings

No finding was fixed in TASK-05.

| ID | Severity | WCAG / requirement mapping | Observed evidence | Release impact |
|---|---|---|---|---|
| FIND-001 | high | WCAG 2.4.1; FR-8; A11Y-002, A11Y-003; AC-019 | No skip/bypass control was exposed. With 20 chats, keyboard order traversed each chat and overflow action before reaching the conversation. Evidence: `EVD-KB-02`. | Keyboard and switch users repeatedly cross dozens of controls. Blocks WCAG 2.2 AA and D-5/Gate C evidence. |
| FIND-002 | high | WCAG 2.4.3, 4.1.3; FR-2, FR-8; GST-006; AC-006 | Timed synthetic expiry replaced a focused composer with the expiry screen. Focus fell to `HTML content`; no alert/status live region announced the removal/camera-off state. Evidence: `EVD-KB-06`; `src/components/AppView.tsx:730-744`. | Keyboard users lose the task focus sequence, and screen-reader users may miss a privacy- and task-significant session status change. Blocks AC-006 and D-5/Gate C evidence. |
| FIND-003 | high | WCAG 1.3.2; FR-3, FR-8; MSG-005, MSG-007, MSG-009; A11Y-006; AC-008, AC-009 | In the live guest failure path, both Safari accessibility order and visual order placed `Reply failed` before the preceding `You said` message. Evidence: `EVD-KB-03`; `src/components/AppView.tsx:1255-1276`; `src/components/AppView.tsx:1316-1328`. | The response/failure is encountered before its cause, impairing chronology and retry context. Blocks affected P0 messaging evidence. |
| FIND-004 | medium | FR-8; motion/human-typing-imitation requirement at `docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md:637-639`; MC-072 | Normal-mode reply status uses three looping fading dots (`ss-fade-dot 1.5s ... infinite`), a conventional human-typing imitation. Evidence: `EVD-RC-03`; `src/styles/app-view.css:1270-1283`. | Conflicts with the approved motion requirement. Reduced-motion code exists but was not manually emulated. Blocks an unqualified motion pass. |
| FIND-005 | medium | WCAG 1.4.11; FR-8; A11Y-001; AC-001, AC-002, AC-020 | `#CEC4DD` control boundaries on white calculate to 1.67:1; `#E6E0EF` boundaries calculate to 1.29:1. Inputs and related controls use these tokens on white/similar surfaces. Evidence: `EVD-RC-02`; `src/styles/tokens.css:10`; `src/styles/app-view.css:187`; `src/styles/app-view.css:1004`. | Low-vision users may not reliably perceive control boundaries. Blocks an unqualified WCAG 2.2 AA contrast claim. |

Summary: `critical=0`, `high=3`, `medium=2`, `low=0`.
