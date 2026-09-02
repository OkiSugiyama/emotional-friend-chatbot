# Rebuild MVP Release Evidence Checklist

Status: **NOT READY — all gates remain pending until evidence is attached**

The machine-readable source is `tests/release/release-evidence.json`. Update a gate to `passed` only after adding durable evidence references and reviewer details. P0 tests may not be skipped, focused, quarantined or waived through retries.

## RG-01 — P0 ownership and acceptance artifacts

- [ ] Every enumerated P0 requirement has a named owner.
- [ ] AC-001 through AC-020 appear in the traceability report.
- [ ] Every P0 requirement links to a passing automated artifact or signed manual review.
- [ ] Traceability validation passes for the release commit.

## RG-02 — Production builds

- [ ] Frontend production build passed in CI:
- [ ] Backend production build passed in CI:
- [ ] Immutable CI run and commit SHA recorded:

## RG-03 — Required automated suites

- [ ] Unit suite passed:
- [ ] Integration suite passed:
- [ ] Security suite passed:
- [ ] Accessibility automation passed:
- [ ] Responsive suite passed:
- [ ] End-to-end suite passed:
- [ ] No P0 test is skipped, focused, quarantined or accepted only after retry:

## RG-04 — Firestore authorization

- [ ] Firebase emulator owner/non-owner/unauthenticated/malformed matrix passed:
- [ ] Forged user, chat and message identifiers were denied:
- [ ] Denials disclosed no existence-sensitive private data:

## RG-05 — WCAG 2.2 AA

- [ ] Automated accessibility report attached:
- [ ] `tests/accessibility/MANUAL_CHECKLIST.md` completed:
- [ ] Keyboard, screen-reader, contrast, 320 px and 200% evidence attached:
- [ ] Accessibility reviewer approval recorded:

## RG-06 — Security and privacy review

- [ ] Static security/privacy contract suite passed:
- [ ] Dependency and model-asset vulnerability scan attached:
- [ ] API abuse, XSS, IDOR, prompt-injection and privacy-egress reports attached:
- [ ] CSP, HSTS, `X-Content-Type-Options` and restrictive permissions policy verified in the deployed response:
- [ ] No unresolved critical/high finding; reviewer sign-off attached:

## RG-07 — Safety evaluation

- [ ] Versioned safety evaluation covers direct, indirect, ambiguous, joking, quoted, fictional and third-person cases:
- [ ] Camera-only emotion signals never trigger crisis routing:
- [ ] Final safety wording independently reviewed:
- [ ] Regional resource catalog includes source, region and review date:
- [ ] No unresolved critical safety failure; reviewer sign-off attached:

## RG-08 — Model and operational controls

- [ ] Deployed model and prompt versions recorded:
- [ ] Staged rollout and rollback rehearsal attached:
- [ ] Account/session and network abuse rate limits verified:
- [ ] Cost, latency, provider failure, auth anomaly and authorization-denial alerts verified:
- [ ] Correlation IDs and redacted telemetry verified without message/camera content:

## RG-09 — Legal and support surfaces

- [ ] Privacy notice is deployed and linked from authentication and signed-in UI:
- [ ] Terms are deployed and linked from authentication and signed-in UI:
- [ ] Support contact is available:
- [ ] Processors, regions, retention, deletion and contact paths are documented:
- [ ] Intended-market legal/privacy approval attached:

## RG-10 — Production smoke

- [ ] Clean browser profile used; no developer credentials or tools were present:
- [ ] Sign-in, create chat, send, reply, reload and sign-out passed:
- [ ] Text-only chat passed with camera denied:
- [ ] Readiness endpoint, correlation ID and release telemetry verified:
- [ ] Client bundle scan found no server credential or hard-coded model secret:
- [ ] Production smoke report and release manager approval attached:

## Final decision

- [ ] All ten machine-readable gate statuses are `passed`.
- [ ] Product, engineering, QA, security/privacy, accessibility and safety approvals are recorded.
- [ ] Release decision, approver and timestamp recorded:

