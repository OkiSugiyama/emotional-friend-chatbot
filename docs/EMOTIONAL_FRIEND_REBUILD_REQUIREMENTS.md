# Emotional Friend Chatbot — Rebuild Requirements Definition

- **Document status:** Draft baseline for product, design, engineering, QA, and safety review
- **Version:** 1.0
- **Date:** 2026-08-08
- **Product name:** Emotional Friend Chatbot
- **Primary release:** Rebuild MVP
- **Primary design tool:** Claude Design
- **Source of truth:** This document supersedes informal feature descriptions for the rebuild. Any later approved product or design decision must update this document and its requirement IDs.
- **Design authority:** The new Claude Design project and its approved design system are the visual source of truth. Existing CSS, screenshots, and UI code are behavioral references only and MUST NOT constrain the new visual direction.

---

## 0. Claude Design Execution Brief

This section is intentionally front-loaded so the document can be imported directly into Claude Design. Claude Design should read the complete document, but use the following order when resolving design decisions:

1. Section 0 — execution instructions and creative direction.
2. Section 3 — product purpose and emotional positioning.
3. Section 8 — user journeys.
4. Section 9 — functional states and controls.
5. Section 10 — complete visual, interaction, component, and delivery specification.
6. Section 11 — accessibility constraints.
7. Section 20 — acceptance scenarios that must be represented in the design.

Engineering, data, API, security, and migration sections provide behavioral context. They should inform states and trust cues, but they should not be rendered as end-user product content unless explicitly required.

### 0.1 Ready-to-paste Claude Design prompt

Use this prompt when starting the Claude Design project:

> Create a brand-new, high-fidelity responsive web-app design and interactive prototype for **Emotional Friend Chatbot** using the attached requirements definition and the linked codebase. Treat the codebase as a source of product behavior and content only. Ignore its existing visual styling, CSS, layout, and component appearance; this is a from-scratch redesign.
>
> The experience must feel gentle, emotionally safe, human, calm, trustworthy, and quietly intelligent. It must not feel clinical, childish, mystical, surveillance-oriented, or like a clone of Gemini, ChatGPT, or another assistant product. Camera-based expression estimation is optional and uncertain, so present it as a discreet supporting feature rather than the center of the product.
>
> Work in phases. First create three clearly different visual-direction boards that all satisfy the same requirements. For each direction, show the palette, typography, shape language, elevation, icon approach, auth-card sample, message sample, composer sample, and camera-status sample. Recommend one direction with a short rationale. Pause for selection if collaboration allows; otherwise continue with the recommended **Soft Sanctuary** direction defined in Section 10.
>
> After direction selection, build the design system, all mandatory desktop and mobile screens, key component states, and the end-to-end interactive prototype listed in Section 10. Use realistic English product copy from this document, not lorem ipsum. Show loading, empty, success, error, destructive confirmation, guest, camera, AI-pending, and safety-support states. Meet WCAG 2.2 Level AA and annotate any accessibility-sensitive behavior.
>
> Finish with a Claude Code handoff bundle containing design tokens, reusable components and variants, responsive behavior, interaction notes, asset exports, screen inventory, and implementation acceptance notes. Do not invent features that conflict with the requirements. Record optional ideas separately instead of silently adding them to the MVP.

### 0.2 Import and setup instructions

When creating the Claude Design project:

- Import this requirements document.
- Point Claude Design at the repository so it can understand behavior, routes, content, and existing assets.
- Explicitly mark `frontend/src/App.css`, `frontend/src/styles.css`, and `frontend/src/components/ChatSidebar.css` as **non-authoritative legacy styling**.
- Treat the existing chatbot image, logo files, and favicon as replaceable reference assets, not mandatory brand assets.
- Do not import `gemini_design.md` as a visual reference. It is historical research and must not make the result resemble Gemini.
- Create a new project-level design system named **Emotional Friend — Soft Sanctuary**.
- Keep the design project organization-scoped/private while it contains product and safety details.

### 0.3 Required creative process

Claude Design MUST use the following sequence:

1. **Explore:** Create three design directions before committing to a high-fidelity system.
2. **Select:** Recommend one direction and record the approved direction.
3. **Systematize:** Define tokens, components, variants, content patterns, and responsive rules before producing every screen.
4. **Design:** Build the mandatory screen/state matrix at desktop and mobile sizes.
5. **Prototype:** Connect the P0 journeys with realistic interactions and transitions.
6. **Audit:** Check consistency, responsive behavior, accessibility, emotional tone, and camera/privacy messaging.
7. **Handoff:** Export the final design and create the Claude Code handoff bundle.

### 0.4 Design decision hierarchy

When instructions conflict, use this order:

1. User safety, privacy, and accessibility.
2. Explicit P0 functional requirements.
3. Clear interaction and state communication.
4. Approved design-system consistency.
5. Visual polish and novelty.

Claude Design MAY improve spacing, grouping, hierarchy, illustration style, and microcopy when the meaning is preserved. It MUST flag any proposed behavioral change instead of treating it as approved.

## 1. Purpose

This document defines the requirements for rebuilding Emotional Friend Chatbot as a dependable, privacy-conscious web application. The product combines an empathetic text conversation experience with optional, on-device facial-expression estimation so that the assistant can adapt its tone without presenting the estimate as a diagnosis or fact.

The specification has four purposes:

1. Preserve the valuable behavior of the current application.
2. Correct security, privacy, safety, reliability, and usability gaps found in the current implementation.
3. Establish testable acceptance criteria for the rebuild.
4. Separate the MVP from optional parity features and future enhancements.

The intended audience is the product owner, designer, frontend and backend engineers, QA engineers, AI/prompt engineers, security reviewers, and deployment operators.

## 2. Requirement Language and Priorities

The keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

| Priority | Meaning |
|---|---|
| P0 | Required for the rebuild MVP to launch. |
| P1 | Required for legacy parity or the first post-MVP release. |
| P2 | Future enhancement; explicitly outside the MVP commitment. |

A requirement is complete only when its acceptance criteria pass in a production-like environment.

## 3. Product Summary

### 3.1 Product vision

Emotional Friend Chatbot should feel like a calm, supportive conversation partner. Users can write about their day, feelings, decisions, or challenges and receive warm, context-aware replies. Camera-based expression estimation is optional context, not the primary source of truth about the user's emotional state.

### 3.2 Problem statement

Ordinary chatbots may respond correctly at a factual level while missing emotional context. Users who want to be heard may therefore receive responses that feel impersonal, overly solution-oriented, or poorly timed. This product aims to improve perceived empathy while keeping the user in control of sensitive camera and conversation data.

### 3.3 Value proposition

- A low-friction conversational space for reflection and supportive dialogue.
- Emotion-aware tone adaptation when the user explicitly enables camera analysis.
- Persistent multi-chat history for registered users.
- A no-sign-up demo for users who want to evaluate the experience first.
- A friendly, accessible, pastel visual system across desktop and mobile.

### 3.4 Product positioning and limitations

The product is a general wellbeing and conversational support application. It is **not** a therapist, medical device, diagnostic system, emergency service, or substitute for qualified professional care. Facial-expression estimates MUST NOT be described as proof of a user's internal emotional state.

## 4. Goals and Success Measures

### 4.1 MVP goals

- Deliver a stable end-to-end conversation flow for registered and guest users.
- Make camera use optional, explicit, reversible, and local to the browser.
- Give the assistant useful recent context while protecting data and controlling cost.
- Preserve user ownership boundaries for all stored chats and messages.
- Provide consistent authentication, sidebar, message, camera, and mobile experiences.
- Define and test safe behavior for distress, self-harm, abuse, and emergency-related language.
- Provide enough observability to diagnose failures without logging sensitive content by default.

### 4.2 Initial success metrics

Final targets should be confirmed after a beta baseline is measured.

| Metric | Initial target |
|---|---|
| Chat send success rate | At least 99% of valid sends, excluding confirmed upstream outages. |
| AI response completion rate | At least 98% of accepted chat requests. |
| Duplicate-message rate | Below 0.1% of accepted sends. |
| Crash-free sessions | At least 99.5%. |
| Camera start success | At least 95% on supported devices after permission is granted. |
| P75 first response feedback | Within 3 seconds; a visible loading or streaming state must appear earlier. |
| Accessibility | All P0 user journeys meet WCAG 2.2 Level AA acceptance checks. |
| Unauthorized cross-user reads/writes | Zero in automated security tests. |

### 4.3 Non-goals for MVP

- Clinical diagnosis, treatment plans, or medical record handling.
- Human therapist matching or live crisis counseling.
- Voice calls, speech-to-text, or text-to-speech.
- Image or file uploads to the assistant.
- Social feeds, public profiles, friend lists, or user-to-user messaging.
- Advertising, payment, subscriptions, or in-app purchases.
- Native iOS or Android applications.
- Administrative reading of private conversations through a product UI.
- Server-side storage or processing of camera frames.
- Training an original production emotion-recognition model.

## 5. Users, Roles, and Permissions

### 5.1 Primary personas

**Guest evaluator**

Wants to try the product without creating an account. Accepts that data is device-local and temporary.

**Registered user**

Wants private, persistent conversations available after sign-in and across sessions.

**Returning mobile user**

Needs a compact layout, obvious chat navigation, large touch targets, and camera controls that do not block the conversation.

**User in distress**

Needs calm acknowledgment, non-judgmental language, and appropriate escalation guidance without false claims of professional or emergency support.

**Operator/developer**

Needs health signals, error categories, rate-limit visibility, and deployment diagnostics without routine exposure of message content or images.

### 5.2 Roles

| Role | Authentication | Data location | Core permissions |
|---|---|---|---|
| Guest | Local guest session | Browser storage | Create, rename, select, and delete guest chats; send and delete guest messages. |
| Registered user | Email/password or Google via Clerk | Firestore under the user's ownership boundary | Manage the user's chats and messages; use AI and optional emotion context. |
| Operator | Deployment and monitoring credentials, outside the consumer UI | Operational systems | View service health, aggregated metrics, and redacted errors. No default access to raw conversations. |

There is no consumer-facing admin role in the MVP.

## 6. Current-State Baseline

The rebuild is based on the repository implementation and the original project concept. This section is descriptive; where it conflicts with later normative requirements, the later requirement wins.

### 6.1 Current implementation

- React 18 and TypeScript render a single-page web application.
- Clerk supports email/password, Google sign-in, password reset, sign-out, and user management.
- Firestore stores registered users' chats and nested messages.
- Guest mode stores chats in `localStorage` and expires after 30 minutes of inactivity.
- Users can create, select, rename, and delete chats and delete individual messages.
- The browser loads `face-api.js` models and samples expressions approximately every two seconds after camera start.
- The current emotion label and the last five displayed messages are sent to `/api/chatbot` with the next user message.
- A Vercel serverless function calls OpenAI and returns an empathetic text response.
- A separate Express/Python emotion endpoint exists but is not used by the active frontend.
- The sidebar displays a local fallback quote for each chat; registered empty chats may receive a generated quote explanation when selected.
- The UI uses a pastel pink, lavender, mint, and soft-red palette and switches layout at mobile breakpoints.

### 6.2 Verified build status at document creation

- The frontend production build completes successfully.
- The backend TypeScript build completes successfully.
- The guest-mode unit test suite passes three tests.
- Automated coverage does not currently validate authentication, Firestore authorization, AI behavior, camera behavior, responsive UI, or end-to-end chat flows.

### 6.3 Gaps the rebuild must address

- The AI endpoint currently has no application-level authentication, ownership check, input schema, rate limit, or idempotency control.
- The active production API and the standalone Express backend use different models, limits, prompts, and response shapes.
- Model names and generation settings are hard-coded.
- Camera models are loaded from an unpinned third-party GitHub URL at runtime.
- Failed model loading activates randomized “demo” emotions, which can mislead users.
- Emotion labels are inconsistent across components (`fear` vs. `fearful`, `surprise` vs. `surprised`, and related variants).
- Camera-derived emotion is treated as true context rather than a fallible estimate.
- The product lacks a defined crisis-safety response policy.
- The UI reports failures through alerts or console logs and does not support retryable message states.
- Chat and message deletion lack a complete confirmation, retry, and large-collection strategy.
- Guest timestamps are serialized using Firestore-specific objects in browser storage instead of a stable portable format.
- Chat quotes and their explanations are not consistently persisted or applied to guest users.
- Legacy and active chat components duplicate behavior.
- No Firestore rules, indexes, privacy notice, terms, account deletion flow, or data-retention policy are present in the repository.

## 7. MVP Scope and Release Boundaries

### 7.1 P0 MVP scope

- Authentication and account session handling.
- Thirty-minute guest demo mode.
- Multi-chat management.
- Persistent registered-user messages and device-local guest messages.
- Empathetic AI replies with recent conversational context.
- Optional client-side camera and expression estimation.
- Explicit privacy and limitation disclosures.
- Safety behavior for high-risk language.
- Responsive pastel UI and accessibility compliance.
- Secure API access, validation, rate limiting, retries, and observability.
- Automated unit, integration, security, accessibility, and end-to-end tests.

### 7.2 P1 legacy-parity scope

- Curated inspirational quote per chat.
- Quote explanation in a new/empty chat.
- Manual correction or override of estimated emotion.
- Streaming AI output and user-initiated generation cancellation if not delivered in P0.
- Guest-to-account chat migration after successful registration.
- Search and filtering for chat history.

### 7.3 P2 future scope

- Voice conversation.
- Multimodal input.
- User-controlled export.
- Localization beyond English.
- Cross-device guest continuation.
- Personal preferences for tone, response length, and quote visibility.

## 8. User Journeys

### 8.1 First visit and sign-in

1. The visitor sees the welcome screen and the product's non-clinical purpose.
2. The visitor can open Clerk sign-in or sign-up, use the enabled email/Google/password-recovery flows, or start demo mode.
3. On successful authentication, the application loads the user's most recent chat.
4. If no chat exists, the application shows a clear empty state and a primary **New Chat** action.
5. Authentication errors remain on the form and identify the next corrective action without exposing provider internals.

### 8.2 Guest demo

1. The visitor chooses **Try Demo Mode**.
2. The application creates a device-local guest session and clearly states the 30-minute inactivity rule.
3. The guest creates a chat before the message composer becomes active.
4. Each user interaction updates last activity.
5. After expiry, local guest data is removed and the welcome screen explains that the demo session expired.

### 8.3 Emotion-aware conversation

1. The user can chat with the camera off; emotion context defaults to unavailable/neutral.
2. The user selects **Start Camera** and sees a concise explanation before the browser permission prompt if consent has not already been captured.
3. After permission, the local model estimates an expression and displays it as an estimate.
4. The user may stop the camera at any time; all tracks stop immediately.
5. When the user sends a message, the backend receives only the normalized optional emotion label and confidence band, never a frame or biometric template.
6. The assistant uses the user's words as the primary context and the expression estimate only as a weak tone signal.

### 8.4 Chat management

1. The user creates a new chat.
2. The new chat becomes active and displays an empty-state prompt.
3. The user can switch between chats without losing unsent text unless explicitly confirmed or intentionally designed per-chat.
4. The user can rename a chat with keyboard and pointer controls.
5. The user can delete a chat after confirmation; the UI selects the next chat or returns to the no-chat state.

### 8.5 AI or network failure

1. The user's message remains visible with a clear status.
2. A failed assistant generation is represented inline, not only through an alert.
3. The user can retry without duplicating the user message.
4. A retry reuses the same idempotency key and either completes the pending assistant message or returns a stable error.

### 8.6 Distress or emergency language

1. The system identifies high-risk text through a documented safety layer; facial-expression estimation alone MUST NOT trigger a crisis classification.
2. The assistant responds calmly, acknowledges the text, avoids diagnosis, and encourages appropriate immediate human or emergency support when warranted.
3. Region-specific resource presentation is used only when the user's region is known or selected; otherwise the response uses location-neutral emergency guidance.
4. The application does not claim that a human is monitoring the conversation.

## 9. Functional Requirements

### 9.1 Authentication and account session

| ID | Priority | Requirement |
|---|---:|---|
| AUTH-001 | P0 | The application MUST provide Clerk email/password sign-in. |
| AUTH-002 | P0 | The application MUST provide Clerk registration and user-profile management. |
| AUTH-003 | P0 | The application MUST provide Google sign-in through Clerk. |
| AUTH-004 | P0 | The application MUST expose Clerk's password-recovery flow when password authentication is enabled. |
| AUTH-005 | P0 | **Sign In** and **Create Account** MUST be semantic, keyboard-focusable Clerk entry controls. |
| AUTH-006 | P0 | Clerk's sign-in, sign-up, recovery, and user-management surfaces MUST be visually usable with the application shell and remain accessible. |
| AUTH-007 | P0 | The UI MUST prevent repeated submissions while an authentication request is pending. |
| AUTH-008 | P0 | Provider errors MUST be mapped to user-safe messages. Raw provider codes, stack traces, and credentials MUST NOT be rendered. |
| AUTH-009 | P0 | A signed-in user MUST be restored through Clerk before protected data is requested; Firestore access MUST use a server-minted Firebase credential scoped to the verified Clerk user ID. |
| AUTH-010 | P0 | Sign-out MUST stop the camera, clear in-memory chat state, and return to the welcome screen. It MUST NOT delete persisted registered-user data. |
| AUTH-011 | P1 | The application SHOULD offer verified-email messaging and a resend path if email verification becomes a launch policy. |
| AUTH-012 | P1 | The application SHOULD provide account deletion with recent-authentication handling and cascading data deletion. |

**Acceptance criteria**

- Invalid email, short password, mismatched confirmation, existing email, invalid credentials, blocked popup, canceled popup, network failure, and rate limiting each produce an actionable form message.
- Password fields support password managers and appropriate `autocomplete` attributes.
- Refreshing a protected route does not briefly show another user's data or create a duplicate chat.
- A user cannot read another user's Firestore path by changing a client-provided identifier.

### 9.2 Guest mode

| ID | Priority | Requirement |
|---|---:|---|
| GST-001 | P0 | A visitor MUST be able to start demo mode without registration. |
| GST-002 | P0 | Guest data MUST remain in browser storage and MUST NOT be written to the registered-user Firestore collections. |
| GST-003 | P0 | The guest session MUST expire after 30 consecutive minutes without qualifying activity. |
| GST-004 | P0 | Qualifying activity MUST include creating/selecting/renaming/deleting a chat, sending/deleting a message, and explicit camera control. Passive emotion sampling MUST NOT keep the session alive. |
| GST-005 | P0 | The UI MUST display a persistent but non-blocking demo banner that explains temporary storage. |
| GST-006 | P0 | Expiry MUST stop the camera, clear browser guest data, clear in-memory data, and return to the welcome screen with an expiry notice. |
| GST-007 | P0 | Guest dates MUST be serialized as ISO 8601 strings or epoch milliseconds, not Firestore `Timestamp` objects. |
| GST-008 | P0 | Malformed, missing, unsupported-version, or oversized guest storage MUST fail closed by clearing the session and returning to a safe welcome state. |
| GST-009 | P1 | After registration, the user SHOULD be offered a one-time, explicit migration of guest chats into the new account. |

**Acceptance criteria**

- A session at 29:59 inactivity remains available; a session beyond 30:00 is removed on the next check or app load.
- Reloading before expiry restores guest chats and messages in chronological order.
- Expiry never affects registered-user Firestore data.
- Browser storage quota errors produce a visible warning that the demo conversation may not persist.

### 9.3 Chat session management

| ID | Priority | Requirement |
|---|---:|---|
| CHT-001 | P0 | Users MUST be able to create multiple chat sessions. |
| CHT-002 | P0 | A newly created chat MUST become the active chat immediately. |
| CHT-003 | P0 | Chat lists MUST be ordered by most recent meaningful activity, with a deterministic secondary order. |
| CHT-004 | P0 | Users MUST be able to select a chat and load its messages in chronological order. |
| CHT-005 | P0 | Users MUST be able to rename a chat inline or through an accessible dialog. |
| CHT-006 | P0 | Chat names MUST be trimmed, non-empty, and limited to 100 Unicode characters. |
| CHT-007 | P0 | Users MUST be able to delete a chat only after a confirmation that identifies the chat. |
| CHT-008 | P0 | Deleting an active chat MUST select the next available chat; if none remains, the application MUST show the no-chat state. |
| CHT-009 | P0 | Chat deletion MUST remove all child messages through a scalable server-side or trusted backend operation. It MUST NOT assume a single Firestore batch can delete an unlimited number of messages. |
| CHT-010 | P0 | Loading, empty, error, and retry states MUST be defined for the chat list and active chat. |
| CHT-011 | P0 | Switching chats MUST ignore or cancel stale message-load responses so that messages from one chat never render under another chat. |
| CHT-012 | P1 | Chat titles SHOULD be generated from the first exchange when the user has not manually renamed the chat. |
| CHT-013 | P1 | Users SHOULD be able to search chat titles. |

### 9.4 Messaging

| ID | Priority | Requirement |
|---|---:|---|
| MSG-001 | P0 | The composer MUST accept plain text and preserve internal line breaks. |
| MSG-002 | P0 | A message MUST contain at least one non-whitespace character and MUST NOT exceed 8,000 Unicode characters in the MVP. |
| MSG-003 | P0 | **Enter** MUST send on desktop when appropriate; **Shift+Enter** MUST insert a line break. Mobile keyboard behavior MUST not cause accidental sends. |
| MSG-004 | P0 | The send action MUST be disabled when there is no active chat, input is empty, or the same send is already being submitted. |
| MSG-005 | P0 | The user's message MUST appear on the right and the assistant's message on the left. Ownership MUST also be communicated by accessible labels, not color or position alone. |
| MSG-006 | P0 | Each accepted send MUST have a client-generated idempotency key. Retry MUST NOT create duplicate user or assistant messages. |
| MSG-007 | P0 | Message state MUST support at least `pending`, `complete`, `failed`, and `deleted`. |
| MSG-008 | P0 | The interface MUST show an inline pending indicator while awaiting the assistant. |
| MSG-009 | P0 | A failed generation MUST offer retry and preserve the user's text. |
| MSG-010 | P0 | Messages MUST render as text, not unsanitized HTML. Markdown, if later enabled, MUST be sanitized and tested. |
| MSG-011 | P0 | The chat view MUST scroll to a newly sent user message. It MUST NOT force-scroll a user who has intentionally scrolled upward without offering a return-to-latest control. |
| MSG-012 | P0 | Users MUST be able to delete their own individual messages after confirmation or an undo-capable interaction. |
| MSG-013 | P0 | Deleting a message MUST NOT silently rewrite the already-generated content of other messages. |
| MSG-014 | P1 | The assistant response SHOULD stream progressively with accessible live-region behavior. |
| MSG-015 | P1 | Users SHOULD be able to cancel a generation in progress. |
| MSG-016 | P1 | Users MAY regenerate the latest assistant response while retaining an audit-safe local revision relationship. |

### 9.5 AI conversation behavior

| ID | Priority | Requirement |
|---|---:|---|
| AI-001 | P0 | The backend MUST call the model provider; API keys MUST never be shipped to the browser. |
| AI-002 | P0 | The production implementation MUST use a server-configured model and generation profile. Model identifiers MUST NOT be hard-coded into UI code. |
| AI-003 | P0 | New OpenAI integration SHOULD use the Responses API for the multi-turn workflow; provider-specific code MUST be isolated behind an application service interface. |
| AI-004 | P0 | The system prompt MUST define the assistant as supportive, warm, non-judgmental, conversational, and non-clinical. |
| AI-005 | P0 | The assistant MUST acknowledge the user's specific concern before giving advice when the user is expressing a problem. |
| AI-006 | P0 | The assistant MUST NOT claim consciousness, professional credentials, human monitoring, diagnosis, certainty about inferred emotion, or guaranteed confidentiality. |
| AI-007 | P0 | The user's text MUST be treated as stronger evidence than a facial-expression estimate. |
| AI-008 | P0 | Emotion context MUST be expressed to the model as uncertain, for example “an optional local estimate suggests…”, and MUST NOT compel the assistant to mention the camera. |
| AI-009 | P0 | Conversation context MUST contain the current message plus a bounded amount of relevant recent history. The initial implementation MAY use the last five completed messages for parity, but the limit MUST be configuration-driven and token-budgeted. |
| AI-010 | P0 | Registered-user history used by the model MUST be loaded or authorized server-side. The server MUST NOT trust arbitrary client-supplied messages as belonging to a chat. |
| AI-011 | P0 | Guest history MAY be submitted by the client, but it MUST be schema-validated, bounded, and treated as untrusted input. |
| AI-012 | P0 | The application MUST define request timeouts, one automatic retry for eligible transient failures, and stable user-facing error categories. |
| AI-013 | P0 | The application MUST record model, prompt version, latency, outcome, and token usage as operational metadata without routinely logging raw message text. |
| AI-014 | P0 | Requests for individual end users SHOULD include a stable, privacy-preserving provider safety identifier when supported. The identifier MUST NOT expose an email address or raw Firebase UID. |
| AI-015 | P0 | Prompt changes and model changes MUST pass a versioned evaluation set before production rollout. |

**Required response characteristics**

- Warm and direct, without repetitive generic reassurance.
- Appropriate to the user's stated language; MVP UI copy is English, but the assistant should respond in the language used by the user when model capability allows.
- Usually concise enough for conversational reading, with longer structure only when requested or helpful.
- Practical suggestions are optional and should follow acknowledgment rather than replace it.
- Questions should be purposeful and not interrogate the user.
- The assistant should not overstate the meaning of a single message or expression estimate.

### 9.6 Emotional safety and crisis behavior

| ID | Priority | Requirement |
|---|---:|---|
| SAFE-001 | P0 | The product MUST display a concise, accessible statement that it is not emergency or professional mental-health care. |
| SAFE-002 | P0 | A documented safety policy MUST cover self-harm, suicide, violence, abuse, exploitation, severe medical symptoms, and immediate danger. |
| SAFE-003 | P0 | High-risk routing MUST be based on message content and conversation context, never facial-expression estimation alone. |
| SAFE-004 | P0 | For apparent immediate danger, the response MUST encourage contacting local emergency services or a trusted nearby person now and MUST remain concise enough to act on. |
| SAFE-005 | P0 | The response MUST NOT shame, threaten, diagnose, promise rescue, or imply that a human responder has been alerted. |
| SAFE-006 | P0 | Location-specific crisis resources MUST be shown only from a maintained, reviewed data source with region and review date. If location is unknown, the product MUST use location-neutral guidance and offer a country/region selector. |
| SAFE-007 | P0 | Safety-related prompts and resource records MUST be independently reviewed before launch and after any material model or policy change. |
| SAFE-008 | P0 | Safety test cases MUST include direct, indirect, ambiguous, joking, quoted, fictional, and third-person high-risk statements. |
| SAFE-009 | P0 | The camera panel MUST NOT visually escalate a user merely because the model estimates sadness, anger, or fear. |
| SAFE-010 | P1 | The product SHOULD provide a persistent, non-alarming path to support resources from the main UI. |

### 9.7 Camera and expression estimation

| ID | Priority | Requirement |
|---|---:|---|
| EMO-001 | P0 | Chat MUST work fully with the camera off, unavailable, or denied. |
| EMO-002 | P0 | Camera capture MUST begin only after an explicit user action and browser permission. It MUST NOT auto-start after login or refresh. |
| EMO-003 | P0 | Before first use, the UI MUST explain that processing is local, estimates can be wrong, frames are not stored or uploaded, and camera use is optional. |
| EMO-004 | P0 | The application MUST request only video, never microphone access. |
| EMO-005 | P0 | **Stop Camera**, sign-out, guest expiry, component unmount, page visibility policy, and fatal camera errors MUST stop every media track and detection timer. |
| EMO-006 | P0 | Production model assets MUST be version-pinned and served from the application's controlled origin or a controlled, integrity-verified asset host. |
| EMO-007 | P0 | Failure to load the model MUST show an unavailable state and fall back to no emotion context. Random or fabricated emotions MUST NOT be presented as detected results. |
| EMO-008 | P0 | The canonical expression set MUST be `angry`, `disgusted`, `fearful`, `happy`, `neutral`, `sad`, and `surprised`, plus `unavailable`. Provider-specific labels MUST be normalized. |
| EMO-009 | P0 | The UI MUST label the value as **Estimated expression** or equivalent, not **Current Emotion**. |
| EMO-010 | P0 | Detection SHOULD sample no more frequently than once every two seconds in the MVP and MUST avoid overlapping inference jobs. |
| EMO-011 | P0 | A displayed non-neutral label MUST meet a configurable confidence threshold and stability rule. Low-confidence or no-face results MUST resolve to neutral/unavailable rather than a fabricated label. |
| EMO-012 | P0 | Raw video frames, face landmarks, embeddings, biometric templates, and screenshots MUST NOT leave the browser or be persisted. |
| EMO-013 | P0 | The message API MAY receive only a normalized label, coarse confidence band, model version, and capture timestamp, subject to user consent. |
| EMO-014 | P0 | The user MUST be able to disable use of the estimate in AI responses independently of stopping the camera. |
| EMO-015 | P1 | The user SHOULD be able to correct the estimate or choose a self-reported feeling. Self-report MUST take precedence. |

**Camera error states**

- Permission denied.
- No camera/device unavailable.
- Camera already in use.
- Unsupported browser or insecure context.
- Model download failure.
- No face detected.
- Inference failure.

Each state must explain whether chat remains available and what the user can do next.

### 9.8 Inspirational quotes

Quotes are retained as a P1 legacy-parity feature because they are not essential to the central emotional-support flow.

| ID | Priority | Requirement |
|---|---:|---|
| QTE-001 | P1 | Each chat MAY display one quote selected from a locally available, reviewed catalog. |
| QTE-002 | P1 | The selected quote ID and snapshot SHOULD be persisted per chat so that it does not change on every reload. |
| QTE-003 | P1 | The quote catalog MUST include reviewed text, author attribution, source/provenance where available, and rights status. |
| QTE-004 | P1 | Quote failure MUST NOT block chat loading or message sending. |
| QTE-005 | P1 | A new empty chat MAY receive a short assistant explanation of its quote, but this behavior MUST be consistent for guest and registered users and MUST be user-dismissible. |
| QTE-006 | P1 | A user SHOULD be able to hide quotes. |

### 9.9 Notifications and error handling

| ID | Priority | Requirement |
|---|---:|---|
| ERR-001 | P0 | Recoverable errors MUST be shown near the affected control or content. Browser alerts MUST NOT be the primary error UI. |
| ERR-002 | P0 | Every error state MUST provide at least one of: retry, edit and resend, reauthenticate, return, or dismiss. |
| ERR-003 | P0 | Error copy MUST avoid exposing stack traces, provider response bodies, secrets, Firestore paths, and sensitive user data. |
| ERR-004 | P0 | Success feedback MUST be provided for password reset, rename, deletion, guest migration, and account deletion as applicable. |
| ERR-005 | P0 | Destructive operations MUST either require confirmation or provide a reliable undo period. |

## 10. User Interface and Experience Requirements

### 10.1 From-scratch design mandate

Claude Design MUST create a new visual identity and interaction system rather than reskinning the current application.

- Existing layouts, CSS declarations, gradients, dimensions, component shapes, and button treatments MUST NOT be copied by default.
- Existing code MAY be used to discover product behavior, labels, and state transitions.
- The result MUST not imitate Gemini, ChatGPT, Claude, Pi, Replika, or another recognizable assistant interface.
- The design MUST make text conversation the primary task and optional camera analysis a secondary, user-controlled enhancement.
- The overall experience MUST feel emotionally safe without suggesting therapy, medicine, diagnosis, or surveillance.
- The final design MUST be practical to implement in React and ordinary CSS/design tokens. Avoid visual effects that require a heavy 3D or shader runtime for core usability.
- The MVP requires a polished light theme. A dark theme MAY be explored separately but MUST NOT delay or create inconsistencies in the required light-theme deliverables.

### 10.2 Brand personality

The brand should communicate the following traits in priority order:

1. **Safe:** private-feeling, calm, and never visually alarming without cause.
2. **Human:** warm language, considerate spacing, and natural conversational rhythm.
3. **Trustworthy:** clear controls, honest camera language, visible system states, and no deceptive affordances.
4. **Gentle:** pastel color, soft geometry, restrained motion, and low visual noise.
5. **Capable:** polished, modern, responsive, and technically credible.
6. **Hopeful:** subtly uplifting without forced positivity.

The brand MUST NOT feel:

- Clinical, hospital-like, diagnostic, or therapy-branded.
- Childish, toy-like, overly cute, or dependent on emoji.
- Mystical, spiritual, or based on unsupported emotional claims.
- Cold, cyberpunk, neon, robotic, or surveillance-oriented.
- Like a productivity dashboard with dense cards and metrics.
- Overly feminine or masculine; the system should be broadly welcoming.

### 10.3 Visual direction exploration

Claude Design MUST create three direction boards before high-fidelity screen production. Each board must show the same representative elements so they can be compared fairly.

| Direction | Intent | Suggested expression |
|---|---|---|
| **A. Soft Sanctuary — recommended** | A quiet, protected space for conversation. | Warm near-white canvas, lavender primary action, misty lilac/pink atmospheric shapes, mint support states, rounded but mature geometry, soft depth, generous breathing room. |
| **B. Quiet Garden** | A grounded, restorative space with a more organic personality. | Sage, muted peach, cream, botanical abstraction, tactile surfaces, slightly editorial typography, minimal illustration. |
| **C. Friendly Orbit** | A more contemporary AI companion with energy but no sci-fi styling. | Periwinkle, powder blue, mint, circular/orbital motifs, crisp typography, clean panels, restrained luminous accents. |

Each direction board MUST include:

- Full semantic palette with contrast notes.
- Display and body typography.
- Logo/mark direction.
- Background and surface treatment.
- Shape, radius, border, and shadow language.
- Icon family and stroke style.
- Primary, secondary, quiet, and destructive buttons.
- Text field and composer.
- User and assistant message samples.
- Chat list item in default, hover, selected, and focus states.
- Camera off/on/unavailable status samples.
- Authentication-card sample.
- One desktop chat thumbnail and one mobile chat thumbnail.
- A short explanation of what the direction communicates and where it may fail.

If no explicit direction is selected, Claude Design MUST continue with **Soft Sanctuary**.

### 10.4 Soft Sanctuary reference tokens

These are seed values for the recommended direction, not permission to skip exploration. Claude Design MAY refine a value to improve visual quality or accessibility but MUST preserve the semantic role and record material changes.

#### Color

| Token | Seed value | Use |
|---|---:|---|
| `color.canvas` | `#FCFAFF` | Primary page background. |
| `color.canvasTint` | `#F7F3FF` | Secondary background and quiet regions. |
| `color.surface` | `#FFFFFF` | Cards, composer, dialogs, sidebar. |
| `color.surfaceRaised` | `#FFFEFF` | Elevated overlays. |
| `color.textPrimary` | `#252233` | Main text. |
| `color.textSecondary` | `#625D72` | Supporting text. |
| `color.textQuiet` | `#7B7589` | Metadata only when contrast remains compliant. |
| `color.border` | `#E6E0EF` | Default borders and separators. |
| `color.borderStrong` | `#CEC4DD` | Active boundaries and stronger separators. |
| `color.primary` | `#6D4AFF` | Primary actions and selected state. |
| `color.primaryHover` | `#5936DB` | Primary hover/pressed progression. |
| `color.primarySoft` | `#EDE8FF` | Selected backgrounds and assistant accent. |
| `color.mintSoft` | `#DDF7EC` | Camera active and positive status. |
| `color.mintInk` | `#176247` | Text/icons on mint. |
| `color.amberSoft` | `#FFF1C7` | Guest and informational notices. |
| `color.amberInk` | `#7A4B00` | Text/icons on amber. |
| `color.dangerSoft` | `#FDE8EC` | Error and delete surfaces. |
| `color.dangerInk` | `#962F43` | Error and destructive text/icons. |
| `color.focus` | `#4E2BC5` | High-visibility focus ring. |

Pastel color belongs mainly on backgrounds, accents, and large surfaces. Text and critical controls MUST use sufficiently strong ink colors. White text on a pastel fill is not automatically acceptable.

#### Typography

- Preferred family: **Manrope**, with `Inter`, `ui-sans-serif`, and the platform system font as fallbacks.
- Use one family in the MVP unless a second display face produces a clear, approved brand benefit.
- Display: 40/48, 700 weight, desktop welcome headline only.
- Page title: 28/36, 700.
- Section title: 20/28, 700.
- Component title: 16/24, 650–700.
- Body: 16/24, 400–500.
- Small: 14/20, 450–600.
- Caption: 12/16, 500, only for secondary metadata.
- Long assistant messages MUST use a comfortable reading measure, approximately 60–75 characters per line.

#### Spacing, shape, and depth

- Base spacing unit: 4 pixels.
- Primary spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Control heights: 44 pixels minimum; 48 pixels preferred for primary/mobile controls.
- Radius scale: 8 for small controls, 12 for fields, 16 for cards, 20–24 for major panels, full-pill only for compact status chips.
- Border: 1 pixel default, 2 pixels for selected/focus emphasis when needed.
- Shadows: soft, neutral-to-lavender, low opacity; no heavy floating glass panels.
- Use translucency only where text contrast and browser performance remain reliable.

#### Iconography and imagery

- Use a consistent rounded line-icon family at 20 or 24 pixels with approximately 1.75–2 pixel strokes.
- Icons must support labels; unfamiliar or destructive actions MUST NOT rely on icons alone.
- The brand mark SHOULD combine the ideas of a conversation, a protected space, and a gentle spark without using a literal robot face or medical heart/ECG symbol.
- Abstract gradient haze, soft arcs, nested speech shapes, or a subtle companion spark MAY be used as atmospheric imagery.
- Avoid stock photos of distressed people, brain imagery, face-scanning grids, biometric boxes, and pulsing red risk graphics.

#### Motion

- Standard micro-interaction duration: 120–220 milliseconds.
- Drawer/dialog duration: 200–280 milliseconds.
- Use opacity and short-distance transforms; avoid bouncing, breathing, or emotionally manipulative animation.
- AI pending motion should be calm and lightweight, not a human-like “typing” deception.
- Reduced-motion mode MUST remove nonessential transforms and looping effects.

### 10.5 Content and voice for the design

Claude Design MUST use realistic English product copy rather than lorem ipsum. Copy should be warm, direct, and honest.

**Preferred product tagline**

“A gentle space to talk things through.”

**Welcome supporting copy**

“Share what’s on your mind and receive thoughtful, emotionally aware support. Camera-based expression context is always optional.”

**Camera-off label**

“Expression context is off”

**Camera first-use explanation**

“If you turn this on, your browser estimates facial expressions on this device. Video frames are not saved or sent to the assistant. Estimates can be wrong, and you can stop at any time.”

**Camera-on label**

“Estimated expression: Sad”

**Emotion-context toggle**

“Use this estimate to adjust reply tone”

**Empty chat prompt**

“What would you like to talk through?”

**Composer placeholder**

“Write what’s on your mind…”

**Guest banner**

“Demo mode · This conversation stays on this device and clears after 30 minutes of inactivity.”

**AI error**

“I couldn’t reply just now. Your message is still here.”

**Non-clinical note**

“Emotional Friend offers conversational support, not medical or emergency care.”

**Representative normal conversation**

- User: “I froze during my presentation and I can’t stop replaying it.”
- Assistant: “That sounds really uncomfortable, especially when your mind keeps returning to the moment. Freezing once doesn’t erase the work you put in. Do you want to unpack what happened, or focus on what might help for the next presentation?”

**Representative safety-support state**

- User: *[a message stating imminent risk of self-harm — the exact trigger wordings are not published; see `docs/qa/SAFETY-POLICY-PUBLICATION.md`]*
- Assistant: “I’m really sorry you’re in this much pain. Please contact local emergency services now, or ask someone you trust to stay with you. If you can, move away from anything you could use to hurt yourself. Tell me your country or region and I can show relevant crisis support options.”

The final safety wording requires safety review. Claude Design should show the hierarchy and interaction, not invent unsupported regional phone numbers.

### 10.6 Authentication experience

The authentication experience is one coherent flow with four states: sign in, sign up, reset request, and reset confirmation.

**Desktop composition**

- Two-column or balanced centered layout is allowed; the form must remain the obvious task.
- A restrained brand/atmosphere region may sit beside the form, but must not contain dense marketing copy.
- Auth card target width: 400–460 pixels.
- Privacy, terms, and non-clinical note remain visible without dominating the form.

**Mobile composition**

- Single column with 20–24 pixel horizontal page padding.
- Brand header remains compact enough that primary fields appear early.
- Primary actions use full available width.

**Required states**

- Default sign in.
- Email validation error.
- Invalid credentials error.
- Google sign-in loading.
- Sign-up with password requirements and confirmation.
- Password reset request.
- Password reset success.
- Demo mode entry.

Buttons for **Sign Up**, **Forgot Password**, and **Back to Sign In** must look and behave as intentional controls, not quiet footer text that can be missed.

### 10.7 Desktop application shell

Claude Design MUST create the primary desktop design at **1440 × 1024** and verify behavior down to 1024 pixels wide.

**Sidebar**

- Width: 304–328 pixels in the recommended direction.
- Contains brand mark/name, primary **New Chat** action, optional search placeholder for P1, scrollable chat list, and compact user/settings area.
- Chat items show title and concise metadata. Quotes, if shown, are P1 and must not make every list item excessively tall.
- Rename/delete actions appear on hover and keyboard focus and remain available through a labeled overflow menu.
- Selected state uses background, border/accent, and `aria-current` semantics rather than color alone.

**Header**

- Height target: 64–72 pixels.
- Contains sidebar toggle when applicable, active chat title, quiet connection/status region, and account action.
- Do not repeat emotion information prominently in the global header.

**Conversation column**

- Center the readable conversation in the main region with a target maximum width of 820–900 pixels.
- Preserve generous vertical rhythm between message groups.
- Use a subtle assistant identity mark, not a large avatar on every message.
- User bubbles may use `primarySoft` or a stronger accessible tint; assistant responses should feel open and readable, not trapped in a heavy card.
- Long replies must support paragraphs, lists, links, and code only if implementation scope later permits them.

**Composer**

- Persistent at the bottom of the main region with the same maximum width as the conversation.
- Multiline input, clear send action, helper/status row, and space for retry/cancel state.
- Input expands to a defined maximum height, then scrolls internally.
- Camera context control is adjacent to or above the composer as a quiet chip/button, not embedded as an ambiguous icon.

**Camera/context panel**

- Closed by default.
- Opens as a compact anchored panel or secondary card, not a full-width permanent block.
- Video preview target: approximately 176 × 132 pixels desktop.
- Shows camera state, local-processing explanation, estimated expression, confidence language, context toggle, and stop action.
- Must not visually resemble facial recognition, security scanning, or diagnostics.

### 10.8 Mobile application shell

Claude Design MUST create the primary mobile design at **390 × 844** and verify reflow at 320 pixels wide.

- Top bar target height: 56–64 pixels with menu, abbreviated chat title, and account/overflow action.
- Sidebar becomes a left modal drawer no wider than `min(88vw, 336px)`.
- The drawer has a scrim, visible close action, focus containment annotation, and returns focus to the menu button.
- Conversation uses 16-pixel page gutters; bubbles should not exceed approximately 86% of the content width.
- The composer remains visible above the software keyboard and safe-area inset.
- Send is a 44–48 pixel control with a text alternative.
- Camera context opens in a bottom sheet or compact expandable card. The video must not exceed roughly one-third of the available viewport height.
- Guest and safety notices must wrap without pushing the composer permanently below the fold.
- Hover-only behavior is prohibited; every action must have a touch path.

### 10.9 Component inventory and variants

Claude Design MUST build reusable components rather than independently styling each screen.

| Component | Required variants/states |
|---|---|
| App shell | Desktop sidebar open/closed; tablet; mobile drawer closed/open. |
| Brand mark | Full lockup; compact mark; monochrome; favicon/app-icon crop. |
| Button | Primary, secondary, quiet/ghost, destructive, icon-only; default, hover, pressed, focus, disabled, loading. |
| Text field | Default, focus, filled, error, disabled; email, password, display name. |
| Auth card | Sign in, sign up, reset, confirmation. |
| Chat list item | Default, hover, focus, selected, rename, menu open, loading. |
| Message | User, assistant, safety-support; pending, complete, failed, deleted placeholder; action menu. |
| Composer | Empty, typing, multiline, disabled, sending, generation active, retry available. |
| Status chip | Neutral/unavailable, camera off, camera on, guest, warning, error. |
| Camera panel | First-use notice, model loading, permission prompt, on, no face, denied, unavailable, stopped. |
| Banner/callout | Guest, informational, privacy, non-clinical, recoverable error, safety support. |
| Dialog | Delete chat, delete message, sign out during pending work, camera consent, guest expiry. |
| Toast/inline feedback | Success, retryable failure, storage warning. |
| Empty state | No chats, empty chat, no search results, guest expired. |
| Loading | Auth initialization, sidebar skeleton, message skeleton, AI reply indicator, camera model progress. |
| Quote card | P1 compact sidebar version and optional empty-chat version. |

Each component must include token usage, spacing, responsive behavior, and content limits in the handoff.

### 10.10 Mandatory screen and state matrix

Claude Design MUST produce the following frames. “D” means desktop 1440 × 1024; “M” means mobile 390 × 844.

| Frame ID | Screen/state | Required sizes | Notes |
|---|---|---|---|
| DS-01 | Design system and token board | Canvas | Palette, type, spacing, radius, shadow, icons, components, accessibility notes. |
| AUTH-01 | Sign in | D, M | Google, email/password, demo, sign-up, reset, legal links. |
| AUTH-02 | Sign-up | D, M | Display name, email, password, confirmation, requirements, errors. |
| AUTH-03 | Password reset request | D, M | Email, submit, back action. |
| AUTH-04 | Password reset confirmation | D, M | Success message and return action. |
| CHAT-01 | No chats | D, M | Clear New Chat action and calm empty state. |
| CHAT-02 | Empty active chat, camera off | D, M | Prompt ideas may be shown, but no fabricated user history. |
| CHAT-03 | Normal conversation | D, M | At least four messages with mixed lengths. |
| CHAT-04 | AI response pending/streaming | D, M | Pending user message and accessible generation feedback. |
| CHAT-05 | AI response failed | D, M | Inline retry and preserved message. |
| CHAT-06 | User scrolled away from latest | D, M | Return-to-latest control. |
| CHAT-07 | Message actions/delete confirmation | D, M | Menu, focus state, and confirmation/undo pattern. |
| SIDE-01 | Sidebar with active/history states | D | Default, hover, focus, selected, menu. |
| SIDE-02 | Rename chat | D, M | Inline or dialog with validation. |
| SIDE-03 | Delete chat confirmation | D, M | Chat title, destructive hierarchy, cancel. |
| SIDE-04 | Mobile drawer | M | Open state, scrim, close, active chat. |
| CAM-01 | Camera first-use consent | D, M | Local processing and uncertainty clearly stated. |
| CAM-02 | Camera model loading | D, M | Progress without blocking chat. |
| CAM-03 | Camera on and context enabled | D, M | Preview, estimate, context toggle, stop. |
| CAM-04 | Camera denied/unavailable | D, M | Recovery guidance and text-only continuation. |
| CAM-05 | No face/low confidence | D, M | Neutral/unavailable language; no alarming visual. |
| GST-01 | Active demo mode | D, M | Temporary-storage banner and sign-up path. |
| GST-02 | Guest session expired | D, M | Calm explanation and return to welcome. |
| SAFE-01 | Safety-support response | D, M | Clear immediate actions, region selector path, non-alarming hierarchy. |
| QTE-01 | Quote feature | D, M | P1, separate from P0 prototype approval. |

Claude Design MAY place multiple related variants on one well-organized canvas, but no mandatory state may be omitted.

### 10.11 Interactive prototype flows

The final prototype MUST support these clickable/tappable flows:

**Flow A — account entry**

1. Sign in screen.
2. Open sign-up and return.
3. Open forgot-password state.
4. Submit reset request and view confirmation.
5. Return to sign in.

**Flow B — registered conversation**

1. Enter application.
2. Create a new chat.
3. Type and send a multiline message.
4. View pending/streaming state.
5. View assistant response.
6. Open message actions.
7. Switch chats.
8. Rename and delete a chat with confirmation.

**Flow C — optional camera context**

1. Open camera-context control.
2. Read and accept first-use explanation.
3. View model loading.
4. View camera-on state.
5. Toggle whether the estimate affects reply tone.
6. Stop camera.
7. Demonstrate denied/unavailable recovery path.

**Flow D — guest session**

1. Start demo mode.
2. Create and use a chat.
3. Open sign-up path from the guest banner.
4. View session-expired state.

**Flow E — failure and safety**

1. Show AI generation failure and retry.
2. Show safety-support response with immediate-action hierarchy.
3. Open the region/resource selection path without inventing unreviewed numbers.

Transitions should demonstrate intent and state changes, not decorative animation.

### 10.12 Empty, loading, error, and system-feedback rules

- Empty states must explain what is empty and present one obvious next action.
- Loading states must name what is loading when delay may be noticeable.
- Skeletons should approximate final geometry and avoid excessive shimmer.
- AI pending must not imply a human is typing.
- Errors remain visually close to the affected message, field, camera panel, or chat item.
- A global toast may confirm success but must not be the only record of a critical failure.
- Destructive dialogs put the safe action first in keyboard order and visually distinguish the destructive button.
- Safety-support states use calm emphasis and plain language. Do not use red full-screen alerts unless there is an application error unrelated to emotional risk.
- Camera-unavailable state must explicitly say the user can continue chatting.

### 10.13 Responsive and content-stress requirements

Claude Design MUST validate the system using:

- Long chat titles up to 100 characters.
- A one-word message and an 8–10 line message.
- A long assistant response with paragraphs and a short list.
- A long display name.
- Browser zoom/reflow expectations at 200%.
- 320-pixel-wide viewport.
- Software keyboard open on mobile.
- Sidebar containing at least 20 chats.
- Guest banner plus camera card plus active conversation on the same screen.
- Error text that wraps to two or three lines.
- Increased text spacing and system font fallback.

Truncation is allowed for chat-list titles when the full title is available on focus/selection. Core messages, errors, consent text, and safety actions MUST NOT be truncated.

### 10.14 Claude Design deliverables

The approved design project MUST contain:

1. Three visual-direction boards and recorded selection.
2. One consolidated design-system canvas.
3. Every mandatory frame in Section 10.10.
4. Connected prototype flows from Section 10.11.
5. Responsive specifications for desktop, tablet, and mobile.
6. Component variants and state definitions.
7. Accessibility annotations for focus, keyboard, screen-reader announcements, contrast, reduced motion, and mobile drawer behavior.
8. Copy deck containing all visible UI strings used in the prototype.
9. Exportable brand mark and any original visual assets in SVG where possible, plus raster fallbacks where needed.
10. A design decision log listing approved deviations from this document.

The final export MUST include:

- Shareable organization-scoped Claude Design URL.
- Standalone HTML prototype or project folder export when available.
- PDF overview for asynchronous review if useful.
- Claude Code handoff bundle.

The handoff bundle MUST include:

- Semantic design tokens with names and values.
- Font files/links and licensing notes.
- Component names mapped to variants and states.
- Screen/frame inventory.
- Layout grids, breakpoints, max widths, and spacing rules.
- Icon and asset exports with usage notes.
- Interaction and motion specifications.
- Required copy and validation text.
- Accessibility behavior annotations.
- A “do not implement” list for P1/P2 elements shown only for exploration.
- Open design decisions and unresolved product questions.

### 10.15 Design approval checklist

The Claude Design output is ready for handoff only when all answers are **yes**:

- Does the result look newly designed rather than like the current application?
- Is the identity distinct from major assistant products?
- Does normal text chat remain fully usable without camera permission?
- Is expression context clearly optional, local, and uncertain?
- Are sign-up and forgot-password controls unmistakably interactive?
- Is the composer wide, multiline, and easy to use on desktop and mobile?
- Are user and assistant messages distinguishable without relying on color alone?
- Are all mandatory frames and component states present?
- Can each P0 prototype flow be completed without a dead end?
- Are failure, retry, guest-expiry, and safety-support states designed?
- Does every control have default, hover/touch, focus, disabled, and loading treatment where relevant?
- Does the pastel system maintain WCAG 2.2 AA contrast?
- Does mobile behavior work at 390 pixels and reflow at 320 pixels?
- Are content stress cases handled without clipped critical content?
- Are reduced-motion and keyboard/focus behaviors annotated?
- Is the handoff bundle explicit enough for Claude Code to implement without guessing visual rules?

## 11. Accessibility Requirements

| ID | Priority | Requirement |
|---|---:|---|
| A11Y-001 | P0 | All P0 journeys MUST target WCAG 2.2 Level AA. |
| A11Y-002 | P0 | Every interactive control MUST be keyboard reachable with a visible, unobscured focus indicator. |
| A11Y-003 | P0 | Semantic regions MUST identify navigation/sidebar, header, main conversation, messages, and composer. |
| A11Y-004 | P0 | Icon-only controls MUST have accessible names; decorative emoji and icons MUST be hidden from assistive technology when appropriate. |
| A11Y-005 | P0 | Authentication fields MUST have persistent labels, programmatic descriptions, and field-level errors. Placeholders MUST NOT substitute for labels. |
| A11Y-006 | P0 | New assistant responses and important errors MUST be announced without causing excessive live-region repetition. |
| A11Y-007 | P0 | Chat ownership, pending/failed status, current selection, and camera state MUST be programmatically determinable. |
| A11Y-008 | P0 | The interface MUST reflow without loss of content or function at 320 CSS pixels and at 200% browser zoom. |
| A11Y-009 | P0 | Video content MUST not be required to operate the product. |
| A11Y-010 | P0 | Automated accessibility scans MUST be supplemented by keyboard, screen-reader, zoom/reflow, and contrast review. |

## 12. Data Requirements

### 12.1 Registered-user logical model

Implementation may use Firestore, but ownership and lifecycle semantics are normative.

```text
User
  uid: string
  displayName: string | null
  createdAt: server timestamp
  settings:
    useEmotionContext: boolean
    quotesVisible: boolean
    locale: string
  consent:
    cameraNoticeVersion: string | null
    cameraNoticeAcceptedAt: timestamp | null

Chat
  id: string
  ownerUid: string
  title: string
  titleSource: "default" | "generated" | "user"
  createdAt: server timestamp
  updatedAt: server timestamp
  lastMessageAt: server timestamp | null
  quoteId: string | null
  quoteSnapshot: object | null

Message
  id: string
  chatId: string
  ownerUid: string
  role: "user" | "assistant" | "system"
  text: string
  status: "pending" | "complete" | "failed" | "deleted"
  clientRequestId: string
  createdAt: server timestamp
  completedAt: server timestamp | null
  emotionContext:
    label: canonical expression | "unavailable"
    confidenceBand: "low" | "medium" | "high" | null
    modelVersion: string | null
    observedAt: timestamp | null
  generationMetadata:
    provider: string | null
    model: string | null
    promptVersion: string | null
```

### 12.2 Firestore structure

The current compatible structure is:

```text
users/{uid}
users/{uid}/chats/{chatId}
users/{uid}/chats/{chatId}/messages/{messageId}
```

The rebuild MAY keep this structure, provided that:

- Security rules derive ownership from authenticated identity and do not trust an `ownerUid` supplied by the client.
- Users can access only their own paths.
- Required compound indexes are documented and version controlled.
- Message and chat timestamps use server timestamps for persisted ordering.
- Cascade deletion is performed by trusted backend code or a tested extension/job.
- Data migration is idempotent and resumable.

### 12.3 Guest storage model

Guest storage MUST include:

```text
schemaVersion
guestId
createdAt
lastActivityAt
chats[]
  id
  title
  createdAt
  updatedAt
  messages[]
    id
    role
    text
    status
    createdAt
```

The stored object MUST be size-checked, schema-validated, and migratable between supported schema versions.

### 12.4 Data retention and deletion

- Guest data: deleted after 30 minutes of inactivity or explicit guest sign-out.
- Registered chat/message data: retained until the user deletes it or an approved retention policy states otherwise.
- Operational request metadata: retention period MUST be documented before launch; raw message text MUST not be included by default.
- Account deletion: when implemented, all owned chats and messages MUST be deleted or queued for deletion with a visible completion state.
- Backups, analytics, and vendor retention MUST be documented in the privacy notice and reviewed before launch.

## 13. API Requirements

### 13.1 General rules

- All production endpoints MUST use HTTPS.
- JSON requests MUST be validated against explicit schemas.
- Request bodies MUST have enforced size limits.
- Registered API requests MUST verify Clerk session JWTs server-side against the configured public key and approved origin.
- Guest requests MUST use a server-issued or signed guest session token if server state is required, plus conservative rate limits.
- CORS MUST allow only approved origins.
- API responses MUST include a request/correlation ID.
- Rate limits MUST exist per account/session and per IP or another privacy-reviewed abuse signal.
- Logs MUST classify failures without storing secret headers or full message content.

### 13.2 Chat generation endpoint

Recommended target contract:

```http
POST /api/v1/chats/{chatId}/messages
Authorization: Bearer <Clerk session JWT>    # registered user
Idempotency-Key: <UUID>
Content-Type: application/json
```

```json
{
  "text": "I had a difficult day.",
  "emotionContext": {
    "label": "sad",
    "confidenceBand": "medium",
    "modelVersion": "face-expression-v1",
    "observedAt": "2026-08-08T12:00:00.000Z"
  }
}
```

Minimum non-streaming response:

```json
{
  "requestId": "req_...",
  "userMessage": {
    "id": "msg_...",
    "status": "complete"
  },
  "assistantMessage": {
    "id": "msg_...",
    "text": "That sounds exhausting. What part of the day weighed on you most?",
    "status": "complete"
  }
}
```

The implementation MAY use a streaming transport, but the final persisted result and retry semantics must remain equivalent.

### 13.3 Standard error envelope

```json
{
  "requestId": "req_...",
  "error": {
    "code": "AI_TEMPORARILY_UNAVAILABLE",
    "message": "The reply could not be generated right now.",
    "retryable": true
  }
}
```

Required error categories include invalid request, unauthenticated, unauthorized, chat not found, conflict/idempotency mismatch, rate limited, provider timeout, provider unavailable, safety intervention, and internal error.

### 13.4 Deprecated backend behavior

The rebuild MUST NOT use the current server-side image-upload `/detect-emotion` endpoint in the MVP. The endpoint and dummy/random model path SHOULD be removed from the deployable production surface after confirming no external consumer depends on it.

## 14. Security Requirements

| ID | Priority | Requirement |
|---|---:|---|
| SEC-001 | P0 | OpenAI and other server credentials MUST exist only in protected server-side environment variables. |
| SEC-002 | P0 | Firebase client configuration MAY be public, but Firestore rules and backend authorization MUST enforce ownership. |
| SEC-003 | P0 | Every chat and message read/write MUST be authorized against the authenticated user or active guest session. |
| SEC-004 | P0 | User input, titles, quote data, and model output MUST be rendered safely without executable HTML. |
| SEC-005 | P0 | The API MUST enforce input length, schema, content type, request size, timeout, concurrency, and rate limits. |
| SEC-006 | P0 | Idempotency records MUST be scoped to the authenticated principal and endpoint. |
| SEC-007 | P0 | Dependencies, model assets, and deployment actions MUST be version controlled and scanned for known vulnerabilities. |
| SEC-008 | P0 | Security headers SHOULD include an appropriate Content Security Policy, HSTS, `X-Content-Type-Options`, and a restrictive permissions policy for camera/microphone. |
| SEC-009 | P0 | Production error responses MUST not include stack traces or upstream response bodies. |
| SEC-010 | P0 | Automated tests MUST attempt cross-user Firestore access, forged chat IDs, forged guest data, prompt injection in history, replayed idempotency keys, and oversized requests. |
| SEC-011 | P0 | The production deployment MUST have separate development, preview, and production configuration with no shared production secrets in local files. |
| SEC-012 | P1 | Firebase App Check or an equivalent abuse-reduction control SHOULD be evaluated and enabled if compatible with the chosen architecture. |

## 15. Privacy Requirements

| ID | Priority | Requirement |
|---|---:|---|
| PRIV-001 | P0 | Camera use MUST be opt-in and revocable. |
| PRIV-002 | P0 | No raw frame, video, landmark, face embedding, or biometric template may be sent to the application backend or AI provider. |
| PRIV-003 | P0 | The product MUST explain what conversation and expression metadata is sent to the AI provider before first use or through an accessible privacy notice. |
| PRIV-004 | P0 | The user MUST be able to chat without providing camera data. |
| PRIV-005 | P0 | Analytics MUST NOT include message bodies, camera frames, facial data, email addresses, or raw user identifiers. |
| PRIV-006 | P0 | Operational identifiers MUST be pseudonymous and purpose-limited. |
| PRIV-007 | P0 | Privacy and terms links MUST be available from the authentication screen and the signed-in application. |
| PRIV-008 | P0 | The product MUST document data processors, storage regions where applicable, retention, deletion, and user contact paths before public launch. |
| PRIV-009 | P0 | A legal/privacy review is required before launch in each intended market, especially if minors are allowed. |
| PRIV-010 | P1 | Users SHOULD be able to export and delete their data through self-service controls. |

## 16. Performance and Reliability Requirements

| ID | Priority | Requirement |
|---|---:|---|
| PERF-001 | P0 | The production application SHOULD become usable within 3 seconds at P75 on a representative mid-range mobile device and 4G-class connection, excluding first-time optional camera-model download. |
| PERF-002 | P0 | Camera models MUST be lazy-loaded only after user intent or an explicit preload policy that does not request camera access. |
| PERF-003 | P0 | Initial chat list loading SHOULD complete within 2 seconds at P95 for a typical account under normal service conditions. |
| PERF-004 | P0 | The first visible AI pending/streaming feedback MUST appear within 300 milliseconds of an accepted send. |
| PERF-005 | P0 | AI provider requests MUST have a configured timeout and cancellation path. |
| PERF-006 | P0 | The UI MUST remain responsive while expression inference runs. |
| PERF-007 | P0 | Detection jobs MUST not overlap; slow inference MUST skip or delay the next sample rather than queue indefinitely. |
| PERF-008 | P0 | Chat history MUST use pagination or incremental loading before an account can accumulate an unbounded DOM. |
| PERF-009 | P0 | A retry after an unknown network outcome MUST use idempotency to prevent duplicates. |
| PERF-010 | P1 | The application SHOULD meet 99.5% monthly availability excluding documented upstream provider-wide outages and planned maintenance. |

## 17. Compatibility and Technical Constraints

- The product is a responsive web application built with React and TypeScript unless an approved architecture decision changes the framework.
- Clerk is the authentication/user-management service; Firebase Authentication supplies only scoped Firestore data credentials, and Firestore remains the registered chat store.
- Vercel is the default frontend/serverless deployment target.
- The build system is an implementation decision; Create React App is not a product requirement.
- The supported baseline is the latest two major versions of Chrome, Edge, Firefox, and Safari available at release review, plus current iOS Safari and Android Chrome.
- Camera features require a secure context and browser support for `getUserMedia`.
- Unsupported cameras or browsers must degrade to text-only chat.
- Environment variables and required Firebase rules/indexes must be documented in version-controlled templates without secrets.

## 18. Observability and Operations

| ID | Priority | Requirement |
|---|---:|---|
| OPS-001 | P0 | The service MUST expose a health/readiness signal for deployed backend functions. |
| OPS-002 | P0 | Each API request MUST have a correlation ID propagated through application logs. |
| OPS-003 | P0 | Metrics MUST include request count, success/failure category, latency, retries, rate limits, provider errors, token usage, and estimated cost. |
| OPS-004 | P0 | Frontend telemetry MUST capture release version and redacted error category without message content. |
| OPS-005 | P0 | Alerts MUST exist for elevated AI failure rate, authentication failure anomaly, authorization denials, severe latency, and cost spikes. |
| OPS-006 | P0 | Prompt and model rollout MUST support staged preview validation and rollback. |
| OPS-007 | P0 | Runbooks MUST cover provider outage, Firebase outage, credential rotation, unexpected cost growth, abusive traffic, and privacy incident response. |
| OPS-008 | P0 | Production secrets MUST be rotatable without rebuilding client bundles unless they are intentionally public Firebase client values. |

## 19. Testing and Quality Requirements

### 19.1 Test layers

**Unit tests**

- Guest-session creation, expiry, schema migration, and malformed storage.
- Chat reducers/state transitions and stale-request cancellation.
- Emotion label normalization, threshold, stability, and unavailable fallback.
- Input validation, error mapping, and idempotency behavior.
- Prompt construction and safety routing with message content redacted from snapshots where appropriate.

**Integration tests**

- Clerk authentication flows against an isolated development instance, plus the Clerk-to-Firebase credential exchange.
- Firestore rules for owner, non-owner, unauthenticated, and malformed operations.
- Chat/message create, load, rename, delete, retry, and pagination.
- API validation, auth verification, provider timeout, provider failure, and rate limiting.
- Local camera model loading with deterministic fixtures where browser automation permits.

**End-to-end tests**

- Register, create chat, send message, receive reply, reload, and see persisted history.
- Google sign-in success and canceled popup behavior in an appropriate test environment.
- Password-reset submission.
- Guest start, reload restore, inactivity expiry, and clean return to welcome.
- Create, switch, rename, and delete chats on desktop and mobile.
- Camera grant, deny, start, stop, unavailable model, and text-only continuation.
- AI failure followed by idempotent retry.
- Keyboard-only and responsive drawer navigation.

**AI evaluation**

- Empathy and acknowledgment.
- Avoidance of false emotional certainty.
- Non-clinical boundaries.
- Safety response correctness across direct and ambiguous risk cases.
- Resistance to prompt injection embedded in prior messages.
- Response relevance using recent context.
- Language matching and harmful stereotype checks across representative users.

### 19.2 Release gates

- All P0 requirements have an owner and a passing acceptance artifact.
- Frontend and backend production builds pass in CI.
- Unit, integration, and end-to-end suites pass with no quarantined P0 scenario.
- Firestore authorization tests pass.
- WCAG 2.2 AA automated and manual checks pass for P0 journeys.
- Security and privacy review has no unresolved critical/high finding.
- Safety evaluation has no unresolved critical failure.
- Model/prompt version, rollback procedure, rate limits, and cost alerting are configured.
- Privacy notice, terms, and support contact are available.
- Production smoke test passes without use of developer credentials in the browser.

## 20. MVP Acceptance Scenarios

| ID | Scenario | Expected result |
|---|---|---|
| AC-001 | New visitor opens the application. | Welcome screen offers Clerk sign-in, Clerk sign-up, and demo mode as operable controls; enabled email, Google, and recovery methods are available within Clerk. |
| AC-002 | User submits invalid registration data. | Inline accessible validation identifies every correctable field; no account is created. |
| AC-003 | Registered user refreshes after login. | Auth state restores, only that user's recent chats load, and no duplicate chat is created. |
| AC-004 | Guest enters demo mode. | Temporary session is created, banner explains expiry, and no Firestore user data is written. |
| AC-005 | Guest returns within 30 minutes. | Chats/messages restore in order. |
| AC-006 | Guest returns after 30 minutes of inactivity. | Guest data is cleared, camera is off, and the welcome screen explains expiry. |
| AC-007 | User creates, renames, selects, and deletes chats. | Each operation persists for that role, preserves ownership, and presents correct empty/next-chat state. |
| AC-008 | User sends valid text. | One user message and one assistant result are created; pending state is visible and duplicates do not occur. |
| AC-009 | Provider times out after accepting the request. | Inline retry is offered; retry with the same idempotency key does not duplicate the user message. |
| AC-010 | User scrolls upward while a response arrives. | Reading position is preserved and a return-to-latest control appears. |
| AC-011 | User grants camera permission. | Controlled local model loads, video starts, estimate is labeled as uncertain, and no frame is uploaded. |
| AC-012 | User denies camera permission. | Clear error guidance appears and chat remains fully usable. |
| AC-013 | Emotion model download fails. | Expression status becomes unavailable; no random emotion is shown and chat continues. |
| AC-014 | User stops camera or signs out. | All media tracks and inference timers stop immediately. |
| AC-015 | Camera estimates sadness but user text is positive. | Assistant follows the user's text and does not assert that the user is sad. |
| AC-016 | User expresses possible immediate self-harm intent. | Safety policy response is concise, supportive, non-diagnostic, and directs the user toward immediate human/emergency help without claiming monitoring. |
| AC-017 | User attempts to fetch another user's chat ID. | Request is denied; no existence-sensitive private data is disclosed. |
| AC-018 | User enters HTML/script content. | Content is displayed as inert text and does not execute. |
| AC-019 | Keyboard-only user completes sign-in and chat flow. | Focus is visible, order is logical, drawer focus is managed, and all actions are operable. |
| AC-020 | Viewport is 320 CSS pixels wide or browser zoom is 200%. | No core content or action is lost; horizontal scrolling is not required for the main flow. |

## 21. Migration and Rebuild Plan Requirements

### 21.1 Compatibility

- Existing registered chats use `users/{uid}/chats/{chatId}/messages` and should be preserved unless the product owner explicitly approves a reset.
- The migration must map current `name` to target `title`, current `isChatbot` to target `role`, and current `createdAt` to the new timestamp model.
- Records missing optional fields must receive deterministic defaults.
- Migration must be idempotent, resumable, observable, and testable on a copy of production-like data.
- A rollback or dual-read period must be defined before production data is changed.

### 21.2 Code consolidation

- The rebuild must have one active chat orchestration component or state module.
- Duplicate legacy components must be removed only after parity tests confirm they are unused.
- The production application must use one canonical chat API contract.
- The unused Express/Python upload-based emotion path must be retired from the deployable surface unless separately approved.
- Shared types must define chats, messages, emotion labels, request status, and error envelopes.

### 21.3 Suggested delivery sequence

1. Establish shared schemas, Firebase emulator/rules, and API authentication.
2. Rebuild authentication and guest-session state.
3. Rebuild chat persistence, idempotent messaging, and failure states.
4. Integrate the server-side model provider and safety layer.
5. Add optional local camera estimation and consent.
6. Complete responsive/pastel UI and accessibility work.
7. Add legacy quote parity if approved for the release.
8. Run migration rehearsal, security/privacy review, AI evaluation, and production smoke tests.

## 22. Risks and Required Mitigations

| Risk | Impact | Required mitigation |
|---|---|---|
| Expression estimate is wrong or biased. | User feels misunderstood or stereotyped. | Label as estimate, keep camera optional, use a confidence/stability rule, prioritize text/self-report, test representative conditions. |
| User relies on the bot during a crisis. | Potential physical or psychological harm. | Non-clinical positioning, reviewed safety policy, concise escalation behavior, maintained resources, evaluation and monitoring. |
| Public AI endpoint is abused. | Cost growth, outages, harmful traffic. | Authentication/session tokens, rate limits, size limits, safety controls, cost alerts, idempotency. |
| Cross-user Firestore access. | Severe privacy breach. | Deny-by-default rules, server-side verification, emulator tests, security review. |
| Remote model assets change or fail. | Camera feature breaks or behaves unpredictably. | Pin/version and self-host or integrity-verify assets; fail to unavailable without fabricated results. |
| Guest browser storage is corrupt or full. | Lost demo history or app crash. | Versioned schema, size checks, guarded parsing, visible persistence warning. |
| Large chat deletion exceeds Firestore batch limits. | Partial deletion and inconsistent state. | Trusted paginated deletion job with retry and completion tracking. |
| Model or prompt update changes safety behavior. | Regression without code change. | Versioned configuration, evaluation gate, staged rollout, rollback. |
| Quotes are inaccurate or misattributed. | Trust and rights issues. | Reviewed catalog with provenance and optional display. |
| Pastel colors have insufficient contrast. | Accessibility failure. | Token-level contrast testing and WCAG 2.2 AA review. |

## 23. Decisions and Open Questions

These items require product-owner approval. Until resolved, the provisional default applies.

| ID | Question | Provisional default |
|---|---|---|
| OQ-001 | Who is the intended age range? | Adults 18+ for public MVP; minors require separate legal, safety, consent, and content review. |
| OQ-002 | Which countries/regions will launch first? | Limited beta with location-neutral safety guidance until reviewed regional resources exist. |
| OQ-003 | Must existing production chats be retained? | Yes; preserve and migrate. |
| OQ-004 | Are inspirational quotes required in the MVP? | No; P1 parity feature. |
| OQ-005 | Should guest chats migrate after sign-up? | P1 opt-in migration; do not migrate silently. |
| OQ-006 | How long should registered conversations be retained? | Until user deletion, subject to privacy/legal review. |
| OQ-007 | Should AI replies stream in P0? | Preferred, but may move to P1 if it threatens MVP reliability or accessibility. |
| OQ-008 | Which model and cost ceiling should be used? | Environment-configured model selected through quality, latency, safety, and cost evaluation; no UI hard-coding. |
| OQ-009 | Is expression context enabled automatically after camera start? | Camera may display locally, but sending the estimate to the AI requires an explicit enabled toggle and notice acceptance. |
| OQ-010 | Should users be able to delete individual assistant messages? | Yes for parity, with confirmation/undo and without rewriting other messages. |
| OQ-011 | Which Claude Design visual direction is approved? | Soft Sanctuary unless the product owner selects Quiet Garden or Friendly Orbit. |
| OQ-012 | Is a dark theme part of the first release? | No; light theme only for MVP. |

## 24. Traceability Summary

| Product goal | Primary requirement groups | Primary acceptance scenarios |
|---|---|---|
| Dependable conversation | MSG, AI, API, PERF | AC-008, AC-009, AC-010 |
| Private optional emotion context | EMO, PRIV | AC-011 through AC-015 |
| Persistent and temporary user modes | AUTH, GST, CHT, DATA | AC-001 through AC-007, AC-017 |
| Safe emotional support | AI, SAFE | AC-015, AC-016 |
| Accessible pastel interface | UX, A11Y | AC-019, AC-020 |
| Secure and operable service | SEC, OPS, TEST | AC-009, AC-017, AC-018 |

## 25. Reference Basis

This requirements definition was derived from the current repository implementation, `README.md`, `instruction.md`, `gemini_design.md`, `VERCEL_SETUP.md`, and the original `LaunchPad Project Idea.docx`.

External technical reference points:

- Claude Design supports document/codebase import, design-system creation, interactive prototypes, project exports, and Claude Code handoff bundles; those capabilities define the design workflow in Sections 0 and 10: <https://www.anthropic.com/news/claude-design-anthropic-labs>
- OpenAI model guidance recommends the Responses API for multi-turn workflows and documents privacy-preserving safety identifiers for individual end users: <https://developers.openai.com/api/docs/guides/latest-model>
- WCAG 2.2 is the accessibility conformance target for this rebuild: <https://www.w3.org/TR/WCAG22/>

These references inform technical choices; the product-specific privacy, safety, legal, and clinical-risk decisions still require appropriate human review before public launch.

---

## Approval Record

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product owner |  | Pending |  |  |
| Design |  | Pending |  |  |
| Engineering |  | Pending |  |  |
| QA |  | Pending |  |  |
| Security/privacy |  | Pending |  |  |
| Safety reviewer |  | Pending |  |  |
