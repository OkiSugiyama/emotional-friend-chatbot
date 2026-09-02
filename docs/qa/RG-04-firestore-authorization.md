# RG-04 — Firestore authorization evidence

Recorded 2026-08-30 by the PM agent, on `main` at `0aa4e27`.

RG-04 (`tests/release/release-evidence.json`) requires: *"Firestore authorization
tests pass."* Owner: Security engineer. Required evidence: a Firebase emulator
report, an owner / non-owner / unauthenticated matrix, and forged-ID results.
Before this run the gate's note read *"Static rules checks exist; emulator
authorization evidence is still required."* This document supplies the emulator
report and the matrix. It does not approve the gate — see **Ledger status** below.

## Environment

No production credentials, no `.env`, no real data. The Firebase project ID is a
`demo-` project, which the emulator treats as unable to reach any live service.

| Item | Value |
| --- | --- |
| Repository commit | `0aa4e27` (`main`) |
| `firestore.rules` SHA-256 | `16b77fa3e59572131eb131a7b0bc5802f6a2e5ef7b5f1b17757048c4e50eafda` (144 lines) |
| Firebase CLI | `firebase-tools@15.26.0` via `npx`, from the local npx cache |
| Firestore emulator | `cloud-firestore-emulator-v1.22.0.jar`, standard edition |
| Java | OpenJDK 23.0.2 (Homebrew) |
| Project ID | `demo-emotional-friend-rules` |
| Emulator port | 8080 (loopback), UI websocket 9150 |
| Test runner | vitest 4.1.10 |
| Client libraries | `firebase` 12.17.1, `@firebase/rules-unit-testing` 5.0.1 |

## Command and result

```
npm run test:rules
# → npx --yes firebase-tools@15.26.0 emulators:exec --only firestore \
#     --project demo-emotional-friend-rules \
#     "vitest run tests/security/firestore-rules.emulator.test.ts"
```

Two independent runs, both green.

| Run | Start | Tests | Duration | Exit |
| --- | --- | --- | --- | --- |
| 1 (default reporter) | 15:59:56 | 7 passed / 7 | 1.56 s | 0 |
| 2 (`--reporter=verbose`) | 16:00:15 | 7 passed / 7 | 1.27 s | 0 |

Per-test results from run 2:

```
✓ allows owner reads and denies non-owner and anonymous reads          241ms
✓ allows an exact owner profile and fail-closed consent transition      98ms
✓ rejects forged ownership, oversized titles, and arbitrary quote payloads 53ms
✓ denies non-owner, anonymous, and malformed client writes              68ms
✓ denies client-created trusted messages and hard deletion              47ms
✓ allows only a complete privacy tombstone for an owned message         47ms
✓ denies foreign paths and server-only operation documents              35ms
```

The suite is guarded by `const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST)`
and skips itself when that variable is absent. Seven tests reported *passed*, not
*skipped*, so the emulator connection was live for this run.

## Authorization matrix

`ownerUid = "owner-user"`, `otherUid = "other-user"`, plus an unauthenticated
context. Every row below is an assertion in
`tests/security/firestore-rules.emulator.test.ts`, and every row held.

### Reads

| Principal | Path | Expected | Observed |
| --- | --- | --- | --- |
| Owner | `users/owner-user/chats/chat-1` | allow | allow |
| Non-owner | `users/owner-user/chats/chat-1` | deny | deny |
| Unauthenticated | `users/owner-user/chats/chat-1` | deny | deny |
| Owner, reading across the boundary | `users/other-user/chats/private-chat` | deny | deny |
| Owner, reading a non-existent foreign doc | `users/other-user/chats/missing-chat` | deny | deny |
| Owner, reading a foreign profile | `users/other-user` | deny | deny |

The non-existent-document row matters: it shows the rules deny on the path, not
on document existence, so absence is not disclosed to a non-owner.

### Writes

| Principal | Operation | Expected | Observed |
| --- | --- | --- | --- |
| Owner | create own profile with the canonical shape | allow | allow |
| Owner | update own settings + a recognised consent version | allow | allow |
| Owner | set an invented consent notice version | deny (fail-closed) | deny |
| Owner | add an unexpected field to own profile | deny | deny |
| Owner | create a chat whose `ownerUid` names another user | deny | deny |
| Owner | create a chat with a 101-character title | deny | deny |
| Owner | create a chat carrying an unreviewed `quoteSnapshot` | deny | deny |
| Owner | create a chat with `titleSource: 42` | deny | deny |
| Owner | create an assistant message from the client | deny | deny |
| Owner | create a message with 8001 characters of text | deny | deny |
| Owner | flip a stored message's `status` to `failed` | deny | deny |
| Owner | partial privacy tombstone (`text`/`status` only) | deny | deny |
| Owner | complete privacy tombstone with all sensitive fields cleared | allow | allow |
| Owner | hard-delete an owned chat | deny | deny |
| Owner | write a server-only `idempotency/` document | deny | deny |
| Non-owner | rename another user's chat | deny | deny |
| Unauthenticated | create a user profile | deny | deny |

Deletion is `allow delete: if false` for users, chats and messages, and the
`idempotency/` subcollection is `allow read, write: if false`, so no principal
is privileged there; the matrix has no per-principal axis to vary.

## The emulator really evaluated these rules

Denials surfaced on stderr as `PERMISSION_DENIED` carrying the deciding line
numbers inside the 144-line `firestore.rules` — for example
`false for 'create' @ L130, false for 'create' @ L141` and
`false for 'delete' @ L126, false for 'delete' @ L141`. L141 is the terminal
`match /{document=**} { allow read, write: if false; }` catch-all. The denials
are rule evaluations against the repository's own file, not transport errors.

## Negative control

A passing suite proves nothing unless it can fail. Replacing the rules with a
fully permissive `allow read, write: if true` made **all 7 tests fail** — every
test in the file carries at least one assertion that a permissive regression
would break. Sample failures:

```
FAIL … > allows only a complete privacy tombstone for an owned message
  Error: Expected request to fail, but it succeeded.   (line 230)
FAIL … > denies foreign paths and server-only operation documents
  Error: Expected request to fail, but it succeeded.   (line 248)
Test Files  1 failed (1)      Tests  7 failed (7)
```

Method note, because the first attempt was wrong and the wrong result looked
right. Passing `--config` with a permissive rules file to `emulators:exec`
changed nothing: the suite still reported 7 passed. The reason is that the test
does not use the emulator's configured rules at all — it reads them itself:

```ts
firestore: { rules: await readFile(resolve(process.cwd(), "firestore.rules"), "utf8") }
```

The lever is the **working directory**, not the Firebase config. The valid
control ran vitest from a scratch directory holding a permissive
`firestore.rules`, with `--root` still pointing at the repository. The
repository's `firestore.rules` was never modified.

## Coverage against RG-04's required evidence

| Required | Status |
| --- | --- |
| Firebase emulator report | **Met.** Two runs, versions and commit pinned above. |
| Owner / non-owner / unauthenticated matrix | **Met.** All three principals exercised on reads and writes. |
| Forged-ID results | **Partial.** See below. |

Forged *ownership* is covered: a signed-in user writing a document whose
`ownerUid` names someone else is denied, as is writing into another user's path.
Forged *tokens* are not covered and cannot be, here.
`@firebase/rules-unit-testing` mints identities through the emulator's own
bypass, and the emulator does not verify token signatures. Signature and issuer
validation is a production-only property; it needs a live-project check, which
is outside this contract's boundary.

## What this run does not establish

- No `list`/query assertions. The suite uses `getDoc` only, so collection-level
  reads are covered by the same `allow read` clause but are not separately
  exercised.
- App Check, rate limits, and index enforcement are not emulated.
- The rules have not been deployed anywhere. This is evidence about the file in
  the repository, not about any live project's active ruleset.
- Token-signature and issuer verification, as noted above.

## Ledger status

`tests/release/release-evidence.json` still records RG-04 as
`status: "pending"` with `evidence: []`, and this document does not change that.
RG-04 is owned by the Security engineer; moving a release gate is the owner's
call, not the PM agent's, and the contract requires explicit owner approval for
gate and release actions. The artifact is now available to be attached.

The other nine gates are untouched by this run. RG-04 was chosen because it was
the only gate whose outstanding evidence could be produced locally, with no
credentials, no network to a live project, and no deployment.
