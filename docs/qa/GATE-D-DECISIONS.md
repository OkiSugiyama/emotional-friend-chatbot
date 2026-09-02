# Gate D — owner decisions

Recorded 2026-09-02. Gate D is the contract's external-release gate. It is not a
checkbox: it is five deferred questions (`requirements.md`, "Human questions to
answer before execution"). Four are answered below. One is answered only in part,
and this document says which part.

## 1. Operator and legal identity — answered

**An individual: Oki Sugiyama.** Not a company or other legal entity.

Consequence for the privacy notice and terms: the operator is a natural person,
so there is no corporate veil, no DPO, and no entity address to publish. A
contact path is still required and is not yet chosen.

## 2. Launch market — answered

**The United States.**

## 3. Processor, region, retention — answered in part

### Processors

Four, not the two the privacy notice draft names:

| Processor | Role |
| --- | --- |
| Google (Firebase Auth, Firestore) | Identity records and conversation storage |
| Clerk | Sign-in and session issuance |
| OpenAI | Reply generation |
| Vercel | Application and API hosting |

The draft names only Firebase/Google and OpenAI. **Clerk and Vercel must be added
before publication.** Clerk arrived on the deployment line and never reached the
privacy documentation.

### Storage region — NOT verified

The owner believes the Firebase project is in a US region, probably
`us-central`. **This has not been verified.** The region is a property of the
live `emotional-friend` project fixed at creation time; it appears nowhere in
this repository, and production configuration was not read.

A storage region is a factual claim made to users in a privacy notice. It must be
read off the Firebase console and confirmed before publication, not asserted from
memory. If it turns out to be a non-US region, US users' conversations are stored
outside the launch market and the notice has to say so.

### Retention — decided by the PM agent, at the owner's instruction

The owner asked for a reasonable policy rather than specifying one. This is what
was chosen, and why.

| Data | Retention | Reasoning |
| --- | --- | --- |
| Registered conversations and messages | Until the user deletes them, then automatic deletion after **24 months of account inactivity** | Conversation history is the product — multiple chats, continuity across sessions — so a short expiry would break the thing people came for. Twenty-four months bounds indefinite accumulation without touching an account anyone still uses. |
| Deleted messages | Text cleared **immediately** on delete; the tombstone document removed after **30 days** | The privacy tombstone already clears text, emotion context, generation metadata and safety fields at the moment of deletion. The tombstone itself only needs to live long enough to reconcile clients. |
| Guest sessions | Browser-local only; session token expires in **30 minutes** | Already implemented. Nothing about a guest conversation is written to Firestore. |
| Operational metadata (rate-limit windows, idempotency records, concurrency leases) | **30 days** maximum | Already TTL'd far shorter in practice. The cap is a ceiling, not a target. |
| Server logs | **30 days** | The allowlist logger already excludes message text, principal identifiers and safety categories. |

**None of this is enforced yet.** No retention mechanism exists in the codebase.
The only TTLs present are the operational ones above, which expire individual
records; there is no job that deletes conversations, and no Firestore TTL policy
is configured. Making the table true requires:

- A Firestore TTL policy on the tombstone documents' existing `expiresAt` field.
- A scheduled job for the 24-month inactivity deletion. **No scheduler exists in
  this project.** This is the gap between the policy and the implementation, and
  publishing a retention promise that nothing enforces would be a false statement
  to users.

## 4. Live model and cost — answered in part

### Model — NOT found

`OPENAI_MODEL` has no default and no value anywhere in this repository, in any
local environment file, or in the personal website. It is set **only in the
Vercel environment**, which was not read.

The owner must read it from Vercel → Settings → Environment Variables. RG-08
requires the model and prompt version as evidence, and a version nobody can name
is not evidence.

### Cost — nothing exists

| Control | State |
| --- | --- |
| Per-request output cap | 800 tokens |
| History sent per request | 5 messages |
| Request timeout | 15 s |
| Rate limits | 20/min registered, 5/min guest, 30/min IP |
| Provider concurrency | 20 |
| **Spend cap** | **none** |
| **Cost alerting** | **none** |

RG-08 requires cost alerting to be configured. Nothing implements or configures
it. Rate limits bound request frequency per principal, not total spend: they do
not stop a large number of principals, and they are not a budget.

For an individual operator on a public US launch this is the most direct
financial exposure in the project. A spend cap belongs in the OpenAI account
(usage limits) rather than in application code, and should be set before
publication.

## 5. External publication — answered

**General public.**

## Crisis resources — approved, and what changed

The owner approved surfacing **988**. Adding a region-specific crisis resource is
an escalation item under the contract, and this approval is the record of it.

What was implemented:

- Routed safety responses now name US resources **conditionally**: 988 for
  self-harm and suicide, 911 for violence, abuse and severe medical danger. The
  phrasing is "if you are in the US", so a visitor outside the launch market
  still reads "contact local emergency services" and is not handed a number that
  does not work where they are. A public demo linked from a public repository
  will receive international traffic regardless of launch market.
- `SAFETY_COPY_VERSION` moved to `us-conditional-v1`.
- **The always-visible help panel stays location-neutral.** It is shown to every
  visitor at all times, whereas a routed response only fires on a message that
  indicates real risk. It now pins to its own `persistentHelpText` field, and its
  strict neutrality guards — no digits, no region names, no service names — are
  unchanged and still passing.

### A frozen interface was widened

`locationNeutral` was the literal type `true` in both `server/ports.ts` and the
Zod schema in `server/contracts.ts`. It was the machine-checkable assertion that
the copy names no region-specific resource. That assertion is no longer true, so
the field was widened to `boolean` and now reports the loaded policy's actual
value.

This is a frozen-interface change. It follows necessarily from approving 988 —
the alternative was a field that claims neutrality the shipped copy does not
have — but it is recorded here rather than folded silently into the copy change.

### The wording still needs a safety review

The contract requires final safety wording to pass safety review, and RG-07
requires a reviewed policy as evidence. The copy above was written by the PM
agent and has not been reviewed by anyone. It should not ship as final wording
on that basis alone.

## What Gate D still does not have

Answering the five questions does not approve the gate. The release gates remain
unapproved, and two are load-bearing here:

- **RG-07 is red.** 16 unresolved critical mismatches: the router does not catch
  indirect or ambiguous phrasing. Adding 988 gives a better resource to the
  people the router does catch. It does nothing for the people it misses, which
  is the larger group. This is the substantive safety issue in the project and no
  amount of configuration closes it.
- **RG-09** needs a published privacy notice and terms with the TBDs above filled,
  a support contact, and legal approval. The notice currently contradicts the
  processor list and states a retention policy nothing enforces.
