# TASK-05 platform and evidence limitations

Every item below remains pending; none is inferred as pass or N/A.

| Coverage gap | Concrete reason | Release impact |
|---|---|---|
| VoiceOver + Safari | Both `VoiceOver` and `com.apple.VoiceOver` application-control attempts timed out with `-10005`. Safari accessibility-tree output was available, but it is not a screen-reader run. | Required macOS screen-reader acceptance evidence is missing. |
| Windows + NVDA | Execution host is macOS `26.5.2`; no Windows/NVDA environment was available. | Required Windows screen-reader matrix remains open. |
| iOS VoiceOver / Android TalkBack | No mobile OS, mobile screen reader, or device/simulator control was available. | Mobile AT acceptance remains open. |
| Chrome, Edge, Firefox matrix | The in-app browser runtime returned no available browser bindings; only local Safari was controllable. | Latest-two-major cross-browser keyboard/reflow coverage is missing. |
| Exact 320 CSS px | Safari's minimum controllable 768 UI-px window at 250% produced approximately 307 CSS px. Exact 320 could not be numerically set or inspected. | Narrower evidence exists, but AC-020's exact 320 run is still incomplete. |
| `390 × 844`, touch, software keyboard, safe area | No mobile viewport/device keyboard was available. Desktop Safari responsive mode was not controllable. | Drawer height, touch targeting, software-keyboard avoidance, and safe-area behavior remain release gaps. |
| Increased text spacing | Safari blocked `javascript:` style injection because Allow JavaScript from Smart Search field was off; the persistent browser setting was not changed. | WCAG text-spacing manual coverage is missing. |
| Reduced motion | The safe local control surface could not toggle/emulate `prefers-reduced-motion`. CSS rules were inspected but are not a manual pass. | Motion acceptance evidence is missing. |
| Forced colors/high contrast | Safari/macOS did not expose a forced-colors environment through the available control surface. | Boundary/focus behavior under forced colors remains unverified. |
| Full focus visibility/non-obscuration | Retained detail directly records a visible focus ring only for New chat and Try again; the retry observation notes contact with the sticky composer edge. Source styling does not establish every runtime control or absence of clipping. | MC-013 remains pending; the global focus-visibility requirement is not accepted. |
| Distinct composer semantic region | Retained evidence proves named conversation navigation, active-conversation main, and message-log semantics. The composer is a footer containing a form, but retained evidence does not prove the distinct named composer region required by the checklist. | MC-014/A11Y-003 remains pending. |
| Exhaustive icon semantics | Retained transcript/source citations cover representative named icon actions and hidden icons, but not an explicit exhaustive audit of every icon-only/decorative icon across every state. | MC-016/A11Y-004 remains pending. |
| Guest migration copy | The prior matrix contained the exact migration statement, but no detailed retained transcript section directly captured it; source shows only the migration-copy insertion point. | MC-032 remains pending until the visible copy is directly recorded in an approved rerun. |
| Physical camera grant/on/stop/no-face/model-failure | Physical camera use was explicitly forbidden. The permission prompt was denied; no-media synthetic on/denied fixtures were used. | Real track/timer lifecycle and local model failure UI need separate approved hardware review. |
| Registered account/auth restoration/Google | Real accounts, credentials, provider calls, and production services were forbidden. | Registered restoration/pending/provider-error manual journeys remain open. |
| Successful assistant response, live safety routing, scroll-arrival | No local backend/provider was called. Live send reached the local failure path; safety and long-content states used synthetic `AppView` props. | Announcement-once, successful arrival, scroll preservation, and end-to-end safety routing need a separate local backend fixture review. |
| Independent approval | Reviewer was Codex executing TASK-05, not a fresh independent human accessibility reviewer. | TASK-05 cannot approve RG-05, D-5, Gate C, release, or publication. |
