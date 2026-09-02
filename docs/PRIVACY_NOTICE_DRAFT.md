# Emotional Friend Privacy Notice — Review Draft

> **Not approved for publication.** The product owner must add the legal
> operator identity, contact path, launch regions, processor details, storage
> regions, retention periods, and effective date, then obtain legal/privacy
> approval before launch.

## What the service handles

- Account information and sign-in methods are handled by Clerk. Firebase
  Authentication receives a scoped technical credential only so Firestore can
  enforce the signed-in Clerk user's data boundary.
- Registered conversations are stored in Firestore under the signed-in user's
  ownership boundary and remain until the user deletes them or an approved
  retention policy changes.
- Demo conversations remain in that browser only and are cleared after 30
  minutes of inactivity or explicit guest sign-out.
- A message and a bounded amount of recent conversation context are sent to the
  configured AI provider to produce a reply.

## Optional expression context

The camera is off by default. If a person explicitly enables it, expression
estimation runs in the browser. Raw frames, video, landmarks, face embeddings,
biometric templates, and screenshots are neither persisted nor sent to the
application backend or AI provider. With separate consent enabled, only a
normalized expression label, coarse confidence band, model version, and
observation time may accompany a message. Estimates can be wrong and text is
always treated as stronger evidence.

## Operations and analytics

Operational records may include a pseudonymous request identifier, release,
model and prompt version, latency, error category, retry count, rate-limit
events, and token usage. Routine logs and analytics must not include message
bodies, model replies, camera content, email addresses, or raw user IDs.

## Control and deletion

People can use text chat without the camera, stop the camera at any time,
disable use of an estimate while leaving the local preview on, delete messages
and chats, sign out, or leave demo mode. Registered account deletion and data
export are post-MVP features and must not be represented as available until
implemented.

## Safety and limits

Emotional Friend is conversational support, not medical or emergency care. No
human is monitoring conversations. A reviewed safety policy may provide
location-neutral immediate-help guidance when message content suggests danger;
the product must not infer a crisis from a facial-expression estimate alone.

## Required publication fields

- Operator/legal entity and contact method: **TBD**
- Effective date and version: **TBD**
- Intended countries/regions: **United States** (owner decision, 2026-09-02).
- Data processors and contractual roles: four processors — Google (Firebase Auth,
  Firestore), Clerk (sign-in), OpenAI (reply generation) and Vercel (hosting).
  **Clerk and Vercel are missing from the body of this notice and must be added.**
  Original note: **Firebase/Google and OpenAI details
  require operator review**
- Storage/processing regions and transfer safeguards: **TBD — must be read from the
  Firebase console before publication.** The owner believes the project is in a US
  region, probably `us-central`; that is unverified and is a factual claim to users.
- Operational metadata retention: **30 days** (ceiling; see
  `docs/qa/GATE-D-DECISIONS.md` for the full retention table). **Not yet enforced —
  no retention mechanism exists in the codebase.**
- Backup and vendor deletion behavior: **TBD**
- Privacy rights and complaint paths by market: **TBD**

