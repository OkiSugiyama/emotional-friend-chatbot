# TASK-05 acceptance command record

Commands are listed in packet order and were run once each.

| # | Exact command | Exit | Exact count/result |
|---:|---|---:|---|
| 1 | `node --version` | 0 | stdout: `v24.3.0` |
| 2 | `npm --version` | 0 | stdout: `11.4.2` |
| 3 | `npm ci --offline` | 0 | added 511 packages; audited 512 packages; 84 packages looking for funding; 0 vulnerabilities; 2 deprecation warnings |
| 4 | `npm run typecheck` | 0 | TypeScript build completed with no diagnostics |
| 5 | `npm run test -- tests/accessibility` | 0 | 2 test files passed (2); 10 tests passed (10); duration 1.25 s |
| 6 | `npm run build` | 0 | 1,909 modules transformed; build completed in 566 ms; emitted 8 files; 2 JavaScript chunks exceeded 500 kB and produced one advisory warning block |
| 7 | `git status --short` | 0 | three entries: ` M tests/accessibility/MANUAL_CHECKLIST.md`; `?? docs/handoffs/`; `?? docs/qa/` |
| 8 | `git diff --check` | 0 | no output |
