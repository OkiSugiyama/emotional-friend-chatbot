# Emotional Friend Chatbot Agent Instructions

## Project identity

- Project ID: `01M0Z716GT7DXBMSXNVNHTSFT2`
- Knowledge project: `projects/personal_projects/emotional-friend-chatbot/index.md`
- Frozen contract: `projects/personal_projects/emotional-friend-chatbot/requirements.md`
- Contract revision: `2`
- Integration branch: `main`

## Required reading order

1. This `AGENTS.md`.
2. The assigned task packet in `docs/tasks/`.
3. `../../cloudHead/projects/personal_projects/emotional-friend-chatbot/requirements.md`.
4. `docs/project.yaml` and `docs/DEFINITION-OF-DONE.md`.
5. Only the files listed in the task packet's read scope.

If the contract path cannot be read, stop and report the blocker. Do not infer a substitute contract.

## Frozen product interfaces

Changes to the following require an explicit contract revision and owner approval:

- Firebase principal and resource-ownership rules.
- Message API request/response and authentication boundaries.
- Emotion-estimation consent, browser-local processing, storage, and transmission rules.
- Safety-response behavior, including crisis escalation and non-medical boundaries.
- Privacy-safe logging and telemetry boundaries.

## Safety and privacy rules

- Use synthetic or fixture data only. Never use real personal, health, emotional, or conversation data.
- Do not read `.env`, credentials, secrets, production data, or restricted content. `.env.example` may be read only when the task packet permits it.
- Do not call production services, provider APIs, cloud execution, GitHub connectors, or Codex Cloud.
- Do not deploy, publish, change repository visibility, incur charges, or access production.
- Treat emotion estimation as optional and consent-gated. It must remain browser-local unless a later frozen contract explicitly says otherwise.
- Preserve the non-medical boundary. Do not present diagnosis, treatment, clinical certainty, or emergency-service guarantees.
- Never modify, delete, stage, or otherwise operate on `UI Mockup/web-app-ui-design-brief/`; it is owner-owned untracked content in the primary checkout.

## Change discipline

- Work only within the assigned task packet's read and write scopes.
- Preserve all unrelated user changes.
- Do not modify the frozen contract, this file, the Definition of Done, or other task packets unless the assigned packet explicitly authorizes it.
- Do not add or upgrade dependencies without PM approval. `package-lock.json` is authoritative for an approved exact install.
- Stop and escalate when a required change would cross a frozen interface, expand scope, or require personal data, production access, publication, deployment, billing, secrets, or a provider-side action.

## Standard local verification

Run only commands authorized by the active task packet. The standard suite is:

```sh
npm run typecheck
npm run test
npm_config_offline=true npm run test:rules
npm run build
git diff --check
```

Record exact commands, outcomes, failures, skipped checks, and environment limitations in the task handoff. A passing structural check is not evidence of release readiness.

## Commits

Include traceability trailers:

```text
Project: 01M0Z716GT7DXBMSXNVNHTSFT2
Task: TASK-NN
Requirements: FR-N,NFR-N
Decisions: DEC-NNN
```
