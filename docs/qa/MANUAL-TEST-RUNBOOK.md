# Manual test runbook

For the evidence that no local agent session can produce. Written 2026-08-30
against `main`. Pair it with `tests/accessibility/MANUAL_CHECKLIST.md`, which is
the checklist of *what* to assert; this file is *how* to get into each state.

Automated and headless-Chrome evidence already exists and is not repeated here.
See `docs/qa/TASK-08.md` and `docs/qa/TASK-09.md`.

## Pass criteria for the help affordance

Measured in Chrome 151 headless, before and after sign-in, four states each.
These are the numbers a manual run should reproduce, not re-derive.

| Viewport | Help strip top | Viewport height |
|---|---|---|
| 390 × 844 | 788 | 844 |
| 320 × 800 | 744 | 800 |
| 640 × 800 | 744 | 800 |
| 1280 × 800 | 744 | 800 |

Plus, in every state: the strip is fully inside the viewport on arrival without
scrolling; the composer's bottom edge meets the strip's top edge and never
crosses it; no horizontal scrollbar at 320 CSS px; the help panel opens fully
inside the viewport.

A **failure** looks like: the strip below the fold on arrival, the strip sitting
on top of the composer or the send button, a horizontal scrollbar at 320, or the
opened panel running off the bottom.

---

## Setup

### A. Auth screen only — no Firebase needed

The simplest setup, and enough for the pre-sign-in screen where the
below-the-fold defect was originally found and where safe-area matters most.

```bash
cd /Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot
npm run dev                 # http://localhost:5173
npm run dev -- --host       # also serve on the LAN, for phones
```

With no Firebase configuration the app renders the auth screen and stays there.

### B. Signed in — Firebase emulators, no production credentials

Two terminals. Nothing here touches the real Firebase project, and no `.env`
file is created.

```bash
# terminal 1
cd /Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot
npx --yes firebase-tools@15.26.0 emulators:start \
  --only auth,firestore --project demo-emotional-friend-ui
```

```bash
# terminal 2
cd /Users/okisugiyama/Documents/Dev/EmotionalFriendChatbot
VITE_FIREBASE_API_KEY=demo-key \
VITE_FIREBASE_AUTH_DOMAIN=demo-emotional-friend-ui.firebaseapp.com \
VITE_FIREBASE_PROJECT_ID=demo-emotional-friend-ui \
VITE_FIREBASE_APP_ID=1:0:web:demo \
VITE_FIREBASE_STORAGE_BUCKET=demo-emotional-friend-ui.appspot.com \
VITE_FIREBASE_MESSAGING_SENDER_ID=0 \
VITE_USE_FIREBASE_EMULATORS=true \
VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1 \
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099 \
VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1 \
VITE_FIRESTORE_EMULATOR_PORT=8080 \
npm run dev
```

Create the test account once, in a third terminal:

```bash
curl -s -X POST "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key" \
  -H 'Content-Type: application/json' \
  -d '{"email":"layout-check@example.test","password":"SyntheticCheck!2026","returnSecureToken":true}'
```

Then sign in with those values. The emulator UI is at http://127.0.0.1:4000.

**The generation API is not running**, so sent messages settle into the failed
state. That is fine for layout and keyboard work; it is not fine for testing a
successful assistant reply, which stays out of scope until a local backend
fixture exists.

### The loopback constraint — read before testing on a phone

`src/services/firebase-client.ts` validates the emulator host and accepts only
`localhost`, `::1`, and `127.x.x.x`. A phone pointed at the Mac's LAN address
for the emulator will throw. This is deliberate and is not a bug to work around.
Consequences:

| Target | Signed-in via emulators? | How |
|---|---|---|
| Mac Safari / Firefox / Chrome | yes | setup B as written |
| iOS Simulator | yes | shares the Mac's network stack, so `127.0.0.1` resolves |
| Physical Android over USB | yes | `adb reverse` (below) |
| Physical iPhone | no | test the auth screen with setup A, or use real Firebase config |

For physical Android, forward the three ports over USB, then browse to
`http://127.0.0.1:5173` **on the phone**:

```bash
adb reverse tcp:5173 tcp:5173
adb reverse tcp:9099 tcp:9099
adb reverse tcp:8080 tcp:8080
```

---

## T1 — Safari on the Mac — DONE 2026-08-30, passed

Run over safaridriver after the owner enabled Safari → Settings → Developer →
Allow remote automation. WebKit matched Blink and Gecko to the pixel; see
`docs/qa/TASK-09.md`. Safari cannot reach 320 CSS px — its smallest window gives
336 — so the exact-320 evidence comes from Chrome and Firefox.

Re-run manually only if the CSS changes. The steps below remain the manual path.

The highest-value single test. `100dvh`, `position: sticky`, and
`env(safe-area-inset-bottom)` are exactly where WebKit diverges from Chrome, and
all three carry the fix.

1. Safari → Settings → Advanced → *Show features for web developers*.
2. Develop → Enter Responsive Design Mode (⌃⌘R).
3. Set each viewport in turn: 390×844, 320×800, 640×800, 1280×800.
4. At each: load the page fresh and **do not scroll**. Is the Help strip visible
   at the bottom?
5. Open the Help panel. Does it fit on screen? Close it.
6. At 320: is there a horizontal scrollbar? There must not be.
7. Repeat signed in, setup B, with a conversation long enough to scroll. Grow
   the composer with a long draft and confirm the strip never covers it.

To read the actual number, in the Web Inspector console:

```js
const s = document.querySelector('.ss-help-affordance').getBoundingClientRect();
({ top: Math.round(s.top), viewport: innerHeight, visible: s.top < innerHeight });
```

## T2 — Firefox on the Mac — DONE 2026-08-30, passed

Automated over WebDriver BiDi; see `docs/qa/TASK-09.md`. Gecko matched Blink
exactly on both screens. Re-run manually only if the CSS changes.

Same seven steps. Responsive Design Mode is ⌥⌘M. Firefox resolves `dvh` and
sticky differently again, so run it even if Safari passes.

## T3 — iOS

Preferred: **iOS Simulator** (Xcode → Open Developer Tool → Simulator). It gives
real WebKit, real safe-area insets for the device model, and real toolbar
collapse, and it reaches `127.0.0.1`, so setup B works unchanged.

1. Simulator → File → Open Simulator → an iPhone with a home indicator, which is
   what makes `env(safe-area-inset-bottom)` non-zero. This value has never been
   exercised anywhere; every measurement to date had an inset of 0.
2. Safari on the simulator → `http://127.0.0.1:5173`.
3. On arrival, without scrolling: is the Help strip visible above the home
   indicator, and not underneath it?
4. Scroll the page down and back up. **The toolbar collapse case:** as Safari's
   bottom toolbar shrinks, does the strip stay pinned above the content, or does
   it drift off? This is the specific behaviour headless Chrome cannot show, and
   the reason `position: sticky` is in the CSS at all.
5. Tap the composer to raise the software keyboard. Is the strip pushed above the
   keyboard, hidden behind it, or overlapping the composer?
6. Repeat at the smallest and largest available device sizes.

A physical iPhone adds real hardware but only for the auth screen, per the
loopback constraint.

## T4 — Android

Physical device over USB with `adb reverse`, or Android Studio's emulator with
the same forwarding. Chrome on Android → `http://127.0.0.1:5173`. Run the same
steps 3–6 as T3. Android's toolbar behaviour and keyboard insets differ from
iOS, so both are needed.

## T5 — VoiceOver on macOS

⌘F5 toggles VoiceOver. Safari is the pairing to use.

1. From page load, Tab once. The first stop should be a bypass link; confirm
   "Skip to help" is announced.
2. Activate it. Focus should land on the Help trigger.
3. Confirm the trigger is announced with its name and its collapsed state.
4. Activate it. Confirm the expanded state is announced and the panel content is
   reachable.
5. Confirm nothing in the announced text claims monitoring, rescue, dispatch,
   diagnosis, or a phone number.
6. Close, and confirm focus returns somewhere sensible rather than to the top.

VO navigation: ⌃⌥→ moves, ⌃⌥Space activates, ⌃⌥U opens the rotor.

## T6 — VoiceOver on iOS

Settings → Accessibility → VoiceOver, and set the Accessibility Shortcut to
triple-click. Same six assertions as T5. Swipe right moves, double-tap
activates. This is the run that catches a control that is visible but not
reachable by swipe order.

## T7 — NVDA on Windows

Needs a Windows machine or VM; the checklist requires it and nothing on macOS
substitutes. Same six assertions, with Firefox and again with Chrome. NVDA+F7
lists elements, which is the fastest way to confirm the Help trigger is exposed
as a button with the right name.

## T8 — Reduced motion — DONE 2026-08-30, passed

Chrome or Edge DevTools → ⌘⇧P → *Show Rendering* → **Emulate CSS
prefers-reduced-motion**. Set to `reduce`, reload, and open and close the Help
panel. No animation may remain, and no content may become unreachable because a
transition was suppressed. Confirm again on the real setting, System Settings →
Accessibility → Display → Reduce motion, since the emulation and the OS setting
have diverged before.

## T9 — Forced colors — pre-check DONE 2026-08-30; Windows acceptance still required

Needs Windows: Settings → Accessibility → Contrast themes. Open the Help
affordance and confirm the strip keeps a visible boundary against the page, the
focus ring survives, and the trigger is still distinguishable from body text.
Chrome DevTools' *Emulate forced-colors* is a useful pre-check but is not
acceptance evidence.

## T10 — Increased text spacing — DONE 2026-08-30, passed

WCAG 1.4.12. Paste in the console, then re-check that nothing clips or overlaps,
in particular the Help strip against the composer:

```js
document.querySelectorAll('*').forEach(el => {
  el.style.lineHeight = '1.5';
  el.style.letterSpacing = '0.12em';
  el.style.wordSpacing = '0.16em';
});
document.querySelectorAll('p').forEach(el => el.style.marginBottom = '2em');
```

## T11 — Rendered contrast — DONE 2026-08-30, measured; one observation for you

Source tokens are already checked; what is missing is measurement of actual
painted pixels. Use Digital Color Meter (macOS, in Utilities) to sample the
foreground and background of the Help trigger text, the strip against the page,
and the focus ring against both, then compute the ratio. AA needs 4.5:1 for body
text, 3:1 for large text and for UI component boundaries. Record the sampled hex
pairs, not just the verdict.

## T12 — 320 CSS px and 200% zoom — DONE 2026-08-30, passed

At exactly 320 CSS px wide, and separately at 200% browser zoom on a 1280-wide
window, confirm no horizontal scrolling, no clipped control, and that the Help
strip and composer still do not overlap. TASK-05 recorded that exact 320 could
not be set in its environment; responsive design mode in Safari or Firefox sets
it precisely.

---

## Recording results

Record each run in `tests/accessibility/MANUAL_CHECKLIST.md`, and put the
observations in the relevant `docs/qa/TASK-0*.md`. For anything that fails,
record the viewport, the browser and version, and the measured number — not just
that it failed. For anything not run, leave it unchecked; the standing rule in
this project is that an unperformed check is never recorded as pass or as N/A.
