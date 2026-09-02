# P0 WCAG 2.2 AA Manual Checklist

Status: **PENDING — required before release**

Authority: `docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md` §§10–11, 19–20 and `UI Mockup/project/Handoff - Engineering Bundle.dc.html` §4.

Record the build URL/version, browser, viewport, operating system, assistive technology and evidence link for every run. An unchecked item is not passing evidence.

## Test record

- [ ] Build/release version recorded:
- [ ] Tester and date recorded:
- [ ] Desktop keyboard run: latest two major Chrome, Firefox, Safari and Edge versions represented:
- [ ] Screen-reader run: VoiceOver + Safari on macOS:
- [ ] Screen-reader run: NVDA + Firefox or Chrome on Windows:
- [ ] Mobile screen-reader run: VoiceOver + iOS Safari or TalkBack + Android Chrome:
- [ ] 320 CSS px and 200% zoom runs recorded:
- [ ] Reduced-motion run recorded:
- [ ] Contrast evidence attached:

## Universal semantics and keyboard

- [ ] A11Y-001: every P0 journey can be completed at WCAG 2.2 Level AA without relying on the camera.
- [ ] A11Y-002: every interactive control is reachable and operable by keyboard alone.
- [ ] Focus follows a logical reading and task order; no positive `tabindex` is used.
- [ ] Visible focus is a 2 px `#4E2BC5` ring with a 2 px offset or an approved equivalent, remains unobscured, and is never clipped by overflow.
- [ ] A11Y-003: chat navigation, header, main conversation, message log and composer form expose distinct semantic regions.
- [ ] A mechanism exists to reach the main conversation without traversing the entire chat history repeatedly.
- [ ] A11Y-004: icon-only controls have accessible names and decorative icons are hidden from assistive technology.
- [ ] Selected chat, current camera state, message ownership and pending/failed/deleted state do not rely on color or position alone.
- [ ] Disabled and loading controls expose their state and do not accept duplicate activation.
- [ ] Pointer and touch actions have equivalent keyboard paths; no action is hover-only.

## Authentication — AC-001, AC-002, AC-003

- [ ] Sign in, Google sign-in, Create account, Forgot password, password reset and Try demo mode are announced as operable controls.
- [ ] A11Y-005: every field has a persistent visible label; placeholder text is not the label.
- [ ] Password fields expose appropriate purpose/autocomplete semantics to password managers.
- [ ] Help and error text is programmatically associated with the correct field.
- [ ] Invalid registration identifies every correctable field without moving focus unpredictably.
- [ ] Authentication and Google-provider errors are announced once with user-safe wording.
- [ ] Pending authentication prevents repeated submission while leaving status perceivable.
- [ ] Auth restoration does not expose or announce protected chat content before identity is resolved.

## Guest lifecycle — AC-004, AC-005, AC-006

- [ ] The demo banner is persistent, non-blocking, and clearly explains device-local temporary storage and 30-minute inactivity expiry.
- [ ] Restored guest chats/messages retain logical chronological reading order.
- [ ] Expiry moves to a calm explanation with an obvious next action and does not strand focus.
- [ ] The expiry screen communicates that guest data was removed and the camera stopped.
- [ ] Sign-up copy does not imply automatic guest-chat migration.

## Chat and messaging — AC-007, AC-008, AC-009, AC-010

- [ ] Chat selection exposes `aria-current` or an equivalent current-state semantic.
- [ ] Chat overflow, rename and delete actions are keyboard accessible even when not hovered.
- [ ] Rename and delete dialogs trap focus, close on Escape and return focus to the invoking control.
- [ ] The safe dialog action is first in DOM/keyboard order and initially focused.
- [ ] User and assistant messages expose hidden ownership labels such as “You said” and “Emotional Friend said”.
- [ ] Internal line breaks are retained and read in a sensible order.
- [ ] A11Y-006: “Writing a reply” is announced politely once; the completed response is announced once and rerenders do not repeat it.
- [ ] Failure is announced once, stays next to the affected message and offers keyboard-operable retry/edit actions.
- [ ] Enter sends on desktop, Shift+Enter inserts a line, and mobile Enter does not accidentally send.
- [ ] Scrolling upward is not interrupted by a new response; Return to latest is named and keyboard operable.
- [ ] Message deletion confirmation or undo is perceivable, and existing assistant replies are not silently re-announced as changed.

## Camera and privacy — AC-011, AC-012, AC-013, AC-014, AC-015

- [ ] The camera panel is closed by default and its trigger exposes expanded/collapsed state.
- [ ] First-use consent is readable before the browser permission prompt and explicitly says local, optional, uncertain, no frame upload and no microphone.
- [ ] A11Y-007: camera state, chat ownership, pending/failed state and current selection are programmatically determinable and do not rely on color alone.
- [ ] Camera on/off/loading/no-face/denied/unavailable states are exposed as text, not color alone.
- [ ] “Estimated expression” or equivalent uncertainty language is used; “Current emotion” is not used.
- [ ] The estimate-to-reply toggle has a name, role and state independent of stopping the camera.
- [ ] Permission denial, missing device and model failure state that chat remains usable and provide a next action.
- [ ] Camera stop, sign-out and expiry make the off state perceivable without unexpected focus movement.
- [ ] Sad, angry and fearful estimates do not produce a visually alarming color or announcement change.

## Safety-support state — AC-016

- [ ] The non-clinical limitation is available and understandable before a crisis interaction.
- [ ] Immediate-help guidance is concise, supportive, non-diagnostic and does not imply monitoring or rescue.
- [ ] Primary immediate action and country/region selection are named, keyboard operable and presented in logical order.
- [ ] Unknown-region behavior remains location-neutral and contains no unreviewed phone number.
- [ ] The safety state avoids a red full-screen alarm, countdown, focus theft or excessive repeated announcement.
- [ ] Safety content and actions remain available to screen magnification and screen-reader users without truncation.

## Security/error presentation — AC-017, AC-018

- [ ] Authorization errors use safe, understandable wording without exposing private paths or existence-sensitive data.
- [ ] HTML/script input is announced as inert text and does not alter landmark, focus or message semantics.
- [ ] Long unbroken hostile strings do not obscure retry, navigation, privacy or destructive-confirmation controls.

## Reflow, zoom, touch and motion — AC-019, AC-020

- [ ] A11Y-008: at 320 CSS px, the main P0 flows need no horizontal scrolling and lose no core content or action.
- [ ] At 200% browser zoom, the desktop shell reflows to one column without loss of content or function.
- [ ] At 390 × 844, the drawer is no wider than `min(88vw, 336px)`, traps focus, closes on Escape and returns focus to the menu button.
- [ ] Touch targets are at least 44 × 44 CSS px where required.
- [ ] A11Y-009: video is not required; the composer and all core chat functions remain available without camera input.
- [ ] The composer remains available above the software keyboard and safe-area inset.
- [ ] Message bubbles remain within approximately 86% of content width.
- [ ] Core messages, errors, consent text and safety actions are never truncated.
- [ ] Long titles, long display names, 20 chats, multi-paragraph replies, guest banner plus camera plus error, and increased text spacing remain usable.
- [ ] `prefers-reduced-motion` removes nonessential transforms and looping indicators; reply status remains available as static text.
- [ ] No bouncing, breathing or human-typing imitation remains under normal or reduced-motion settings.

## Contrast and visual distinction

- [ ] Normal text and meaningful UI graphics meet WCAG 2.2 AA contrast requirements in every state.
- [ ] `textQuiet` is used only at an approved size/contrast; white text is not placed on soft pastel tokens.
- [ ] Default, hover/touch, focus, selected, disabled, loading, warning, error and destructive states remain distinguishable without color alone.
- [ ] Focus, error and selected-state boundaries remain visible in forced-colors/high-contrast mode where supported.

## Evidence and sign-off

- [ ] A11Y-010: automated scans are supplemented by keyboard, screen-reader, zoom/reflow and contrast review.
- [ ] Automated accessibility report attached:
- [ ] Keyboard recording or annotated screenshots attached:
- [ ] Screen-reader output/notes attached:
- [ ] 320 px and 200% zoom evidence attached:
- [ ] Contrast evidence attached:
- [ ] All defects link to a requirement and acceptance scenario:
- [ ] Accessibility reviewer approval recorded with name and date:

## TASK-05 execution record

The checkbox syntax above remains unchecked because the repository's checklist contract prohibits self-approval and a fresh independent accessibility reviewer is still required. For this task, **checked** means the observation reached a conclusive pass or finding in the matrix below; it does not mean release approval.

- Reviewer: OpenAI Codex, local accessibility-QA agent (not an independent human approver)
- Date: 2026-08-26
- Reviewed revision: `2ab65bb4a593ff169c1c37dda6c87b62bead924c`
- Manual tally: **41 checked** = 36 observed-pass + 5 observed-finding; **43 pending**; total 84
- Findings: 0 critical, 3 high, 2 medium
- Evidence: [environment](../../docs/qa/artifacts/TASK-05/environment.md), [Safari keyboard transcript](../../docs/qa/artifacts/TASK-05/safari-keyboard-transcript.md), [responsive/contrast](../../docs/qa/artifacts/TASK-05/responsive-contrast.md), [findings](../../docs/qa/artifacts/TASK-05/findings.md), [platform limitations](../../docs/qa/artifacts/TASK-05/platform-limitations.md), [acceptance commands](../../docs/qa/artifacts/TASK-05/acceptance-commands.md)

`PENDING` rows include partial observations; each states what remains unavailable and why the gap matters for release.

| ID | Status | Observation or concrete pending reason | Release impact |
|---|---|---|---|
| MC-001 | OBSERVED-PASS | Build/source revision and command record are attached. Evidence: `docs/qa/artifacts/TASK-05/environment.md:6-7`; `docs/qa/artifacts/TASK-05/acceptance-commands.md:7-14`. | Metadata requirement met for this run. |
| MC-002 | OBSERVED-PASS | Reviewer identity and UTC/local date are attached. Evidence: `docs/qa/artifacts/TASK-05/environment.md:8-9`. | Metadata requirement met; independent approval still separate. |
| MC-003 | PENDING | Only Safari 26.5.2 was controllable; browser runtime listed no Chrome/Edge/Firefox binding. | Latest-two-major desktop browser matrix is incomplete. |
| MC-004 | PENDING | VoiceOver app and bundle-id connections both timed out with `-10005`; Safari AX output is not a VoiceOver run. | Required macOS screen-reader evidence is missing. |
| MC-005 | PENDING | Host is macOS; no Windows/NVDA environment was available. | Windows screen-reader evidence is missing. |
| MC-006 | PENDING | No iOS/Android device, simulator, VoiceOver, or TalkBack control was available. | Mobile AT evidence is missing. |
| MC-007 | PENDING | Safari verified 200%; minimum window at 250% was approximately 307 CSS px, not exact 320. | Exact AC-020 320 CSS px run remains open. |
| MC-008 | PENDING | No safe control to toggle/emulate `prefers-reduced-motion`; CSS inspection is structural only. | Manual motion evidence is missing. |
| MC-009 | OBSERVED-PASS | Token ratios and the control-boundary failure are recorded. Evidence: `EVD-RC-02`; `FIND-005`. | Contrast was reviewed; FIND-005 blocks an AA claim. |
| MC-010 | PENDING | Camera-denied guest chat and synthetic states worked, but registered/provider and every P0 journey were unavailable. | A11Y-001 cannot be accepted across all P0 journeys. |
| MC-011 | PENDING | Representative auth/guest/chat/dialog/camera/safety controls were keyboard operable; unavailable journeys were not. | Universal keyboard completion remains incomplete. |
| MC-012 | PENDING | Observed orders were logical except documented findings; positive-tabindex absence was source-observed only, not every runtime state. | Full focus-order coverage remains incomplete. |
| MC-013 | PENDING | A visible focus ring was directly recorded only for New chat and Try again; EVD-RC-01 also notes the focused retry control met the sticky composer's edge. Source defines the intended 2 px ring, but retained evidence does not establish every required control, unobscured focus, or absence of clipping. Evidence: `EVD-KB-02`; `EVD-RC-01`; `src/styles/global.css:56-59`. | The full focus-visibility and non-obscuration requirement remains unverified. |
| MC-014 | PENDING | Retained evidence proves named Conversation navigation, Active conversation main, and Conversation messages log semantics. The composer is a footer containing a form, but retained evidence does not prove that it exposes the distinct named semantic region required by this checklist item. Evidence: `EVD-KB-02`; `tests/accessibility/app-view.a11y.test.tsx:200-219`; `tests/accessibility/app-view.a11y.test.tsx:222-265`; `src/components/AppView.tsx:1047`; `src/components/AppView.tsx:1230-1232`; `src/components/AppView.tsx:1454-1456`. | A11Y-003 remains pending because the distinct composer-region requirement is unverified. |
| MC-015 | OBSERVED-FINDING | No skip/bypass control was exposed; 20 chats created 40+ repeated stops before main. Evidence: `EVD-KB-02`; `FIND-001`. | High; blocks WCAG 2.4.1 and AC-019. |
| MC-016 | PENDING | Retained evidence names representative chat, drawer, and message action controls and source shows several icons hidden, but it does not directly document an exhaustive icon-only/decorative-icon audit across every state. Evidence: `EVD-KB-02`; `src/components/AppView.tsx:775-776`; `src/components/AppView.tsx:832-845`; `src/components/AppView.tsx:1349-1356`. | A11Y-004 cannot be accepted universally from representative evidence. |
| MC-017 | OBSERVED-PASS | Reviewed source exposes selected chat, camera, ownership, pending, failed, and deleted states through ARIA or text rather than color/position alone. Evidence: `src/components/AppView.tsx:810-829`; `src/components/AppView.tsx:959-998`; `src/components/AppView.tsx:1304-1348`; `tests/accessibility/app-view.a11y.test.tsx:222-265`. | The listed state semantics are directly source/test-supported. |
| MC-018 | PENDING | Disabled controls exposed disabled state; auth/loading duplicate-activation timing was not manually available. | Pending/loading behavior remains open. |
| MC-019 | PENDING | No hover-only path appeared and keyboard overflow worked; mobile touch equivalence was unavailable. | Touch equivalence remains unverified. |
| MC-020 | OBSERVED-PASS | The reviewed auth screens exposed named Sign in, Google, Create account, Forgot password, reset, and demo controls. Evidence: `EVD-KB-01`; `tests/accessibility/app-view.a11y.test.tsx:160-198`. | AC-001 entry-control evidence passed for the reviewed screens. |
| MC-021 | OBSERVED-PASS | Reviewed auth fields had persistent visible labels; placeholders were not the sole labels. Evidence: `EVD-KB-01`; `src/components/AppView.tsx:415-428`. | A11Y-005 label evidence passed for reviewed fields. |
| MC-022 | OBSERVED-PASS | Safari exposed password fields and its suggestion surface; source/test evidence shows current/new password purposes in the reviewed forms. Evidence: `EVD-KB-01`; `src/components/AppView.tsx:565-575`; `src/components/AppView.tsx:615-633`; `tests/accessibility/app-view.a11y.test.tsx:173-179`. | Password-purpose semantics are directly supported. |
| MC-023 | OBSERVED-PASS | Email and confirm-password errors were present in each field's accessible description. Evidence: `EVD-KB-01`; `src/components/AppView.tsx:415-438`; `tests/accessibility/app-view.a11y.test.tsx:171-194`. | Error association passed for the reviewed invalid registration. |
| MC-024 | OBSERVED-PASS | Synthetic invalid registration identified email and confirmation errors and focused Email first. Evidence: `EVD-KB-01`; `src/components/AppView.tsx:467-470`. | AC-002 representative validation passed. |
| MC-025 | PENDING | Error text was exposed, but VoiceOver announcement-once and Google-provider error behavior were unavailable. | Screen-reader/provider error evidence is missing. |
| MC-026 | PENDING | No auth backend/pending fixture was invoked. | Duplicate-prevention and pending-status evidence is missing. |
| MC-027 | PENDING | Real/fixture registered auth restoration was outside the available no-account journey. | AC-003 protected restoration remains open. |
| MC-028 | OBSERVED-PASS | The reviewed guest state exposed the persistent 30-minute device-local banner and an operable composer after chat creation. Evidence: `EVD-KB-02`. | AC-004 banner evidence passed for the reviewed state. |
| MC-029 | PENDING | Live guest failure showed reversed user/failure order; a restore-at-29:59 run was not available. | AC-005 chronological restore remains open. |
| MC-030 | OBSERVED-FINDING | Timed expiry was calm with actions, but focus fell to HTML content and no live status announced it. Evidence: `EVD-KB-06`; `FIND-002`. | High; blocks AC-006 for keyboard/screen-reader users. |
| MC-031 | OBSERVED-PASS | The timed expiry screen stated local data removal and that the camera was switched off. Evidence: `EVD-KB-06`. | Expiry content evidence passed. |
| MC-032 | PENDING | The prior matrix asserted `Nothing transfers automatically`, but no detailed retained transcript section directly records that migration statement; source only references the copy key at `src/components/AppView.tsx:873-879`. | The no-implied-migration copy requires a directly retained observation. |
| MC-033 | OBSERVED-PASS | The reviewed selected chat was exposed as current, and source uses `aria-current="page"`. Evidence: `EVD-KB-02`; `src/components/AppView.tsx:802-829`. | Current-chat semantic passed for the reviewed state. |
| MC-034 | OBSERVED-PASS | Chat overflow was reachable while unhovered; rename/delete actions and dialogs were keyboard reachable. Evidence: `EVD-KB-02`. | AC-007 representative operation passed. |
| MC-035 | OBSERVED-PASS | The reviewed rename/delete dialogs trapped focus, closed with Escape, and returned focus to the overflow invoker. Evidence: `EVD-KB-02`; `src/components/AppView.tsx:284-338`. | Dialog focus lifecycle passed for the reviewed dialogs. |
| MC-036 | PENDING | Delete initially focused Keep chat; Rename intentionally focused its editable name field rather than the safe Cancel action. | Checklist wording is not fully met and needs human disposition. |
| MC-037 | OBSERVED-PASS | Safari AX exposed `You said` and `Emotional Friend said` for the reviewed messages. Evidence: `EVD-KB-03`; `src/components/AppView.tsx:1343-1347`. | Message ownership passed for the reviewed messages. |
| MC-038 | OBSERVED-PASS | Shift+Return preserved two lines and Safari AX returned them in text order. Evidence: `EVD-KB-03`. | Internal line-break evidence passed. |
| MC-039 | PENDING | VoiceOver and successful-response timing were unavailable; source/AX live-region structure is not announcement-once proof. | A11Y-006 success announcement remains open. |
| MC-040 | OBSERVED-FINDING | Failure had alert/retry semantics but appeared before the affected user message. Evidence: `EVD-KB-03`; `FIND-003`; `src/components/AppView.tsx:1316-1328`. | High; chronology and retry context block AC-008/009. |
| MC-041 | PENDING | Desktop Enter and Shift+Enter passed; mobile Enter was unavailable. | Mobile accidental-send evidence remains open. |
| MC-042 | PENDING | No controllable delayed successful response/scroll-arrival fixture was available. | AC-010 remains open. |
| MC-043 | PENDING | Chat delete confirmation passed; message delete/undo and reannouncement were not manually exercised. | Message deletion evidence remains open. |
| MC-044 | OBSERVED-PASS | The reviewed camera trigger was closed by default and exposed state text; source supplies expanded/collapsed state. Evidence: `EVD-KB-04`; `src/components/AppView.tsx:970-999`; `src/components/AppView.tsx:1473-1482`. | Camera default state passed for the reviewed state. |
| MC-045 | OBSERVED-PASS | The first-use notice preceded Safari permission and covered local processing, uncertainty, optional use, no frame upload, and no microphone. Evidence: `EVD-KB-04`. | Camera consent copy passed for the reviewed denial journey. |
| MC-046 | OBSERVED-PASS | Camera, ownership, pending/failed, and current-selection states are exposed through reviewed AX plus direct source/test semantics. Evidence: `EVD-KB-03`; `EVD-KB-04`; `src/components/AppView.tsx:810-829`; `src/components/AppView.tsx:1304-1348`; `tests/accessibility/app-view.a11y.test.tsx:222-302`. | A11Y-007 listed states are directly supported. |
| MC-047 | PENDING | Off, on-fixture, and denied were observed; loading, no-face, and model-failure variants were not manually executed. | Full camera-state matrix remains open. |
| MC-048 | OBSERVED-PASS | The reviewed synthetic camera state used `Estimated expression` and `guess, not a fact`; no `Current emotion` appeared in that state. Evidence: `EVD-KB-04`; `tests/accessibility/app-view.a11y.test.tsx:268-302`. | Uncertainty language passed for the reviewed state. |
| MC-049 | OBSERVED-PASS | The named switch changed on→off with Space while the synthetic camera state remained on. Evidence: `EVD-KB-04`; `src/components/AppView.tsx:1582-1595`. | Independent estimate-use control passed for the reviewed state. |
| MC-050 | PENDING | Permission-denied recovery passed; missing-device and model-failure paths were unavailable. | AC-012/013 matrix remains incomplete. |
| MC-051 | PENDING | Expiry copy exposed off state, but timed expiry lost focus; real camera stop/sign-out were prohibited/unavailable. | Camera lifecycle/focus evidence remains incomplete. |
| MC-052 | PENDING | Synthetic sad estimate was visually calm; angry/fearful and screen-reader announcement changes were not observed. | SAFE-009 variant coverage remains incomplete. |
| MC-053 | OBSERVED-PASS | Source places the non-clinical limitation on auth and composer surfaces before a safety state; the reviewed safety copy remained non-diagnostic. Evidence: `src/components/AppView.tsx:702`; `src/components/AppView.tsx:1493`; `EVD-KB-05`. | SAFE-001 presentation is source/observation-supported. |
| MC-054 | OBSERVED-PASS | The reviewed synthetic guidance was concise, supportive, non-diagnostic, and made no monitoring/rescue promise. Evidence: `EVD-KB-05`. | AC-016 copy presentation passed for the reviewed state. |
| MC-055 | OBSERVED-PASS | The reviewed immediate action and region selector were named and followed the recorded keyboard order. Evidence: `EVD-KB-05`; `src/components/AppView.tsx:1384-1415`. | Safety action order passed for the reviewed state. |
| MC-056 | OBSERVED-PASS | The reviewed unknown-region state used generic local emergency/trusted-person guidance and no phone number. Evidence: `EVD-KB-05`. | Location-neutral presentation passed for the reviewed state. |
| MC-057 | PENDING | No alarm/countdown/focus theft was seen; VoiceOver repeated-announcement behavior was unavailable. | Screen-reader repetition evidence remains open. |
| MC-058 | PENDING | Safety content survived 200/250% magnification; actual screen-reader truncation behavior was unavailable. | Combined magnification/screen-reader evidence remains open. |
| MC-059 | PENDING | No authorized registered/foreign-chat error state was manually reachable without accounts/backend. | AC-017 presentation remains open. |
| MC-060 | OBSERVED-PASS | The literal synthetic HTML-like payload was exposed as inert text and did not alter the reviewed semantics. Evidence: `EVD-KB-07`. | AC-018 representative inert rendering passed. |
| MC-061 | OBSERVED-PASS | A 300-character unbroken synthetic string wrapped without visible horizontal overflow or obscured core controls in the observed narrow desktop layout. Evidence: `EVD-KB-07`. | Representative hostile-string stress passed. |
| MC-062 | PENDING | Approximately 307 CSS px was observed at Safari 250%, but exact 320 was not numerically controlled. | Exact A11Y-008/AC-020 evidence remains open. |
| MC-063 | OBSERVED-PASS | Safari Page Menu confirmed 200%; the reviewed shell reflowed to one column with working drawer/composer behavior. Evidence: `EVD-RC-01`. | Representative 200% zoom passed. |
| MC-064 | PENDING | Approximate 384 CSS px drawer behavior passed; exact 390×844 mobile viewport was unavailable. | Exact responsive-mobile evidence remains open. |
| MC-065 | PENDING | Reviewed controls visually/source-measured at 44 CSS px minimum, but no mobile touch environment was available. | Touch-target manual evidence remains open. |
| MC-066 | OBSERVED-PASS | A two-line guest message reached inline failure after camera denial; camera input was not required for that path. Evidence: `EVD-KB-03`; `EVD-KB-04`. | Camera-independent composer/chat path passed. |
| MC-067 | PENDING | No mobile software keyboard or safe-area environment was available. | Composer keyboard-avoidance remains open. |
| MC-068 | OBSERVED-PASS | Observed narrow-layout bubbles stayed within the content column and long content wrapped; source caps narrow messages at 86%. Evidence: `EVD-KB-07`; `EVD-RC-01`; `src/styles/app-view.css:2172-2175`; `src/styles/app-view.css:2393-2395`. | Representative bubble-width evidence passed; this is not mobile-device evidence. |
| MC-069 | PENDING | Long message/error/consent/safety samples wrapped, but every required state/platform was not observed. | Universal no-truncation claim remains open. |
| MC-070 | PENDING | Long title/name, 20 chats, and multi-paragraph reply passed; combined guest+camera+error and increased spacing did not. | Full stress matrix remains open. |
| MC-071 | PENDING | Reduced-motion media behavior could not be manually toggled; inspected CSS cannot substitute. | Motion acceptance remains open. |
| MC-072 | OBSERVED-FINDING | Normal reply status defines a looping three-dot fade that imitates human typing. Evidence: `EVD-RC-03`; `FIND-004`; `src/styles/app-view.css:1270-1283`; `docs/EMOTIONAL_FRIEND_REBUILD_REQUIREMENTS.md:637-639`. | Medium; blocks the approved motion requirement. |
| MC-073 | OBSERVED-FINDING | Text pairs passed, but meaningful control borders were 1.67:1/1.29:1 against white. Evidence: `EVD-RC-02`; `FIND-005`. | Medium; blocks an unqualified WCAG AA contrast claim. |
| MC-074 | OBSERVED-PASS | Reviewed `textQuiet` uses were inactive/disabled; reviewed white text pairs were primary/danger rather than soft pastel tokens. Evidence: `EVD-RC-02`. | Reviewed token-use condition passed. |
| MC-075 | PENDING | Representative focus/selected/error/destructive states had text/shape semantics; every hover/touch/loading state was not observed. | Full state-distinction matrix remains open. |
| MC-076 | PENDING | Forced-colors/high-contrast mode was unavailable on the controlled Safari/macOS surface. | Forced-color boundary evidence is missing. |
| MC-077 | PENDING | Keyboard, AX tree, zoom, and contrast supplemented automation; actual screen reader/reduced motion/text spacing remain missing. | A11Y-010 is incomplete. |
| MC-078 | OBSERVED-PASS | Packet accessibility test result is attached: 2 files and 10 tests passed. Evidence: `docs/qa/artifacts/TASK-05/acceptance-commands.md:11`. | Automated evidence attached; not a manual substitute. |
| MC-079 | OBSERVED-PASS | Sanitized keyboard/focus transcript sections are attached. Evidence: `EVD-KB-01` through `EVD-KB-07`. | Keyboard evidence attached. |
| MC-080 | OBSERVED-PASS | VoiceOver attempts and Safari AX notes are attached with an explicit non-pass limitation. Evidence: `docs/qa/artifacts/TASK-05/environment.md:15`; `docs/qa/artifacts/TASK-05/platform-limitations.md:7`. | Honest screen-reader limitation notes attached; no screen-reader pass is claimed. |
| MC-081 | PENDING | 200% evidence and approximate 307 CSS px evidence are attached; exact 320 remains missing. | AC-020 evidence incomplete. |
| MC-082 | OBSERVED-PASS | Exact contrast ratios and affected tokens/components are attached. Evidence: `EVD-RC-02`; `FIND-005`. | Contrast evidence attached; finding unresolved. |
| MC-083 | OBSERVED-PASS | Corrected mapping and evidence are attached for all five findings. Evidence: `FIND-001`, `FIND-002`, `FIND-003`, `FIND-004`, `FIND-005` in `docs/qa/artifacts/TASK-05/findings.md`. | Defect traceability attached; mapping does not imply acceptance. |
| MC-084 | PENDING | Codex is not a fresh independent human accessibility reviewer and cannot approve its own evidence. | RG-05, D-5, Gate C, release, and publication remain blocked. |
