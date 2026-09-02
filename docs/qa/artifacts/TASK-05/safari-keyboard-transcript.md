# Safari keyboard and semantics transcript

Evidence IDs in this file are sanitized observations from Safari `26.5.2` on macOS `26.5.2`. All entered content was synthetic.

## EVD-KB-01 — Authentication entry and validation

- Safari's local preference required `Option+Tab` to include every webpage control. The observed welcome order was Privacy notice → Terms → Continue with Google → Email → Password (Safari displayed its password suggestion surface) → Forgot password → Sign in → Try demo mode → Create an account.
- The sign-up screen exposed persistent labels for Display name, Email, Password, and Confirm password. Password help appeared in the password field's accessible description.
- Synthetic invalid email and mismatched passwords were submitted from the keyboard. Safari exposed both messages in the page announcement and attached the individual descriptions to Email and Confirm password.
- Focus moved to the first invalid field, Email, without a provider call.
- Forgot password opened a named reset screen with Email, Send reset link, and Back to sign in.

## EVD-KB-02 — Guest and chat operation

- Try demo mode produced named `Conversation navigation` and `Active conversation` regions, a persistent 30-minute device-local banner, and an initially disabled composer until a chat existed.
- Keyboard activation of New chat created and selected a chat. The focus ring was visible around New chat.
- The chat overflow control was reachable while not hovered and was named `Actions for New chat`.
- Rename opened a named dialog with initial focus in Chat name. Focus cycled Chat name → Cancel → Save name → Chat name; Escape closed it and returned focus to `Actions for New chat`.
- Delete confirmation initially focused `Keep chat`. Focus cycled Keep chat → Delete chat → Keep chat; Escape closed it and returned focus to the invoker.
- The 20-chat synthetic drawer exposed every chat and overflow control to the accessibility tree, initially focused Close conversations, trapped focus, closed on Escape, and returned focus to Show conversations.

## EVD-KB-03 — Composer and failure

- In the live guest state, `Shift+Return` retained two separate lines in the textarea and Safari exposed both lines in order.
- `Return` initiated the local send path. No backend/provider was present; the UI reached an inline failed-reply state with `Try again` keyboard reachable.
- The failure was exposed as `Reply failed`, and the user message retained the hidden ownership prefix `You said`.
- Finding: the live DOM/accessibility and visual order was `Reply failed` before `You said ...`, reversing cause and response. See `FIND-003`.

## EVD-KB-04 — Camera-independent path

- The camera trigger was closed by default and announced `Expression context is off`.
- The first-use panel stated on-device estimation, uncertainty, no saved/sent frames, no microphone, optional use, and that chat works the same with camera off before Safari displayed its permission prompt.
- The Safari permission prompt was answered **Don't Allow**. No physical camera stream started.
- The resulting state exposed `Expression estimate unavailable`, `Your browser blocked camera access`, `Try again`, and `Continue without it`; the composer remained enabled for text.
- A synthetic no-media fixture exposed `Estimated expression: Sad`, `Medium confidence · this is a guess, not a fact`, a named switch, and Stop camera without red/alarming styling.
- Keyboard Space changed the switch from `Value: on` to `Value: off`; the camera state stayed `On`, and help text changed to say the estimate stayed on-device and never reached the assistant.

## EVD-KB-05 — Safety support

- A synthetic `safetySupport: true` state exposed `You said`, `Emotional Friend said`, and a named `Get help now` complementary region.
- Keyboard order was user message actions → assistant message actions → Contact local emergency services → Choose my country or region → composer.
- Region expansion exposed a named select, disabled Show relevant support options until selection, reviewed-catalogue copy, and no phone number.
- Copy was concise, non-diagnostic, location-neutral, and explicitly stated that no one was watching or had reported the conversation.
- The presentation used the regular canvas/purple action treatment; no red full-screen alarm, countdown, or focus theft was observed.

## EVD-KB-06 — Guest-expiry focus transition

- A timed synthetic transition started with focus in the guest composer and replaced the view with the guest-expired screen after 15 seconds.
- The new screen calmly stated that local demo data was removed and the camera switched off, with Create an account, Start another demo, and Back to sign in.
- Focus fell to the document (`HTML content`), not the heading or a next action, and the new screen contained no alert/status live region. See `FIND-002`.

## EVD-KB-07 — Inert and stress content

- Literal `<img src=x onerror=alert('synthetic')>` rendered and was exposed as inert text.
- A contiguous 300-character synthetic string wrapped inside the user bubble and did not create visible horizontal overflow at the observed narrow desktop layout.
- A 100-character title, long synthetic display name, 20 chats, and 12 multi-paragraph response blocks remained reachable; the header/drawer shortened long labels visually while the accessibility tree retained their full names.
