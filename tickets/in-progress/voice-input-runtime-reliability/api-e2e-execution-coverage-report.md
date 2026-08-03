# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/backend-selection-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/english-preservation-correction.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/english-preservation-v2/`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/current-platform-qualification.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-003`
- Current Execution Round: `3`
- Trigger: `CRR-011` Pass for `IR-010` at source commit `b7342bc8e06d587bfe640faa4209c62ac2f4bae9` against `SR-008` / `SR-009` and `ARCH-REV-010`.
- Prior Round Reviewed: `API-REV-002 — Blocked / 78%`.
- Latest Authoritative Round: `API-REV-003 — Fail / 79%` at the mandatory actual M1 preflight.

## Investigation And Execution Basis

- Investigation completed before final execution: `Yes`.
- Investigation plan followed: `Yes`. Unchanged `API-VOICE-002`/`013` authority was confirmed first, repository checks ran, and the realistic M1 path began with the mandatory preflight. Downstream construction stopped after that critical gate failed.
- Existing coverage decisions revised during execution: `No`. The exact authority/test bytes remain unchanged and reusable; no durable coverage changed.
- Reroute required during execution: `Yes` — `API-F-001` is a directly reproduced production preflight defect.
- Material deviation: package materialization, builds, inference, performance, compliance, QSet, and branch projection were not executed because the approved workflow is fail-closed after a non-pass preflight.

## Compatibility / Legacy Scope Check

- Backward compatibility introduced or tolerated: `No`.
- Compatibility-only behavior observed: `No`.
- Approved persisted-data transition followed: `Yes — Not Affected`.
- Compatibility-only durable coverage added/retained: `No`.
- Legacy bootstrap/protocol-0/provider fallbacks remain absent.

## Changed Boundary And Evidence Matrix

| Scenario ID | Behavior / Boundary | Surface / Mode | Evidence | Result | Artifact |
| --- | --- | --- | --- | --- | --- |
| `API-VOICE-001` | current source/unit/contract/evidence baseline | durable repository checks | exact Node/Go/Python execution | Pass | `api-e2e-evidence/api-rev-003/repository/npm-run-check.log`: 57/57 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |
| `API-VOICE-002` | exact English-v2 49-WAV authority/trust/derivation | unchanged direct authority from API-REV-002 | base-to-source and working-tree digest comparison | Pass / Reused | `repository/API-VOICE-002-013-authority-reuse.json`; actual package inference still required under `003` |
| `API-VOICE-003` | English darwin-arm64 complete package qualification | actual M1 preflight | production CLI with owned `caffeinate` | Fail at shared prerequisite | `environment/API-VOICE-003-004-actual-preflight-failure.json` |
| `API-VOICE-004` | Chinese darwin-arm64 complete package qualification | actual M1 preflight | same mandatory production CLI | Fail at shared prerequisite | same |
| `API-VOICE-005`–`010` | non-arm64 targets | current scope authority | no execution | Deferred / Outside Current Release Matrix | `current-platform-qualification.md` |
| `API-VOICE-011` | exact-package compliance/privacy/offline | aggregate over packages | not reached | Not Tested after Fail | no qualified package exists |
| `API-VOICE-012` | QSet 1 and independently verified Branch Catalog Projection 1 | aggregate CLI | not reached | Not Tested after Fail | no passing profiles exist |
| `API-VOICE-013` | production corpus-validator regression | unchanged durable test | focused 6/6 and full suite | Pass / Reused | focused and full repository logs; accepted by `CRR-011` |

## Additional Repository Coverage Execution

No checks were added after the coverage investigation's planned repository run. Commands executed there:

| Order | Command | Configuration | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `npm ci --ignore-scripts` | Node 22.23.1 | Pass | `repository/npm-ci.log` |
| 2 | `node --test tests/release/trusted-baseline.test.mjs` | assigned worktree | Pass 6/6 | `repository/focused-trusted-baseline.log` |
| 3 | `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | official Go 1.26.5 darwin/arm64 root | Pass | `repository/npm-run-check.log` |

## Validation Confidence Scorecard

| Confidence Category | Post-Repository | Final | Change | Final Evidence | Residual Uncertainty |
| --- | --- | --- | --- | --- | --- |
| Requirement and acceptance-criteria proof | 80% | 70% | -10 | repository authority passes, but mandatory actual preflight fails | both packages and all downstream criteria unproven |
| Changed-boundary execution directness | 80% | 85% | +5 | production preflight executed on the exact M1 and reproduced the source predicate failure | final packages not executed |
| Cross-boundary integration realism and mock gap | 75% | 75% | 0 | actual host boundary reached | model/package integration not reached |
| Environment, configuration, identity, and fixture fidelity | 80% | 75% | -5 | exact host/Node/Go/CMake and actual system outputs captured | host was on battery; purge permission absent; preflight stops before full identities |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | 75% | 0 | fail-closed preflight and durable failure owners work | real package lifecycle/injected failure not reached |
| User-surface, browser, and desktop-shell confidence | N/A | N/A | N/A | runtime-only | none in scope |
| Durable regression coverage quality and relevance | 95% | 95% | 0 | all 57 Node/7 Python/Go/source/schema/evidence and focused authority pass | native run evidence is instance-specific |

- Overall post-repository confidence: `81%`.
- Overall final confidence: `79%`.
- Calculation: simple average of six applicable categories, rounded.
- Every critical acceptance criterion directly proven: `No`.
- Applicable categories below 90%: `Yes` — all except durable regression coverage.
- Default 95% confidence target met: `No`.
- Limiting risks: production thermal-state parser defect, absent AC/purge prerequisites, and all package/inference/resource/compliance/aggregate proof downstream of preflight.

## Broader Validation Decision And Execution

- Decision/mode: `Required`; actual-host CLI/lifecycle/package qualification.
- Startup: created retained evidence directories -> dependency/source checks -> started owned `/usr/bin/caffeinate -dimsu` -> invoked production `darwin-arm64-runner-preflight.mjs` with exact Go/CMake -> retained failure record/log -> stopped owned `caffeinate`.
- Exact host: `darwin/arm64`, MacBookPro18,4, Apple M1 Max, 64 GiB, Node v22.23.1, official Go 1.26.5 darwin/arm64, CMake 4.3.3.
- Observed production result: schema-valid `status: blocked`, `failureCategory: runner-power-or-pressure`, with `acConnected: false`, `thermalNormal: false`, `memoryPressureNormal: true`, and active `caffeinate`.
- Focused source reproduction: actual `/usr/bin/pmset -g therm` reported “No thermal warning level has been recorded” and “No performance warning level has been recorded”; the production regex `/(warning|performance warning|CPU_Speed_Limit...)/i` matches the bare word `warning`, making `thermalNormal=false` for this healthy output. This is `API-F-001`.
- Separate environment prerequisites: the host was drawing from Battery Power, and `/usr/bin/sudo -n /usr/sbin/purge` returned exit 1 with `sudo: a password is required`.
- No alternative was substituted. Warm cache was not labeled cold, no provider/threshold changed, and no package/release action ran.

| Journey | Expected | Actual | Evidence | Result |
| --- | --- | --- | --- | --- |
| repository baseline | all current owners pass | 57/57 Node, 7/7 Python, Go/source/schema/evidence pass | repository logs | Pass |
| actual M1 preflight | healthy host text parses correctly; required conditions then gate exactly | production misclassifies normal no-warning output; host also lacks AC and purge permission | preflight JSON/log, raw pmset/probe logs | Fail |
| English/Chinese packages | only start after passing preflight | not started | fail-closed gate | Not Tested |
| QSet/projection | only aggregate two Pass profiles | not started | prerequisite absent | Not Tested |

## Desktop Application Validation

- `N/A`; runtime-only CLI/package ticket.
- No desktop application was started or changed.

## Platform / Runtime Targets

- Executed: actual `darwin-arm64` MacBookPro18,4 M1 Max / 64 GiB host, through preflight only.
- Runtime/tool versions: Node v22.23.1; Go 1.26.5 darwin/arm64; CMake 4.3.3.
- Deferred: darwin-x64, linux-x64, win32-x64 for both profiles; explicitly outside the current matrix.

## Lifecycle / Restart / Persisted-Data Checks

- Approved persisted-data decision: `Not Affected`.
- User data exercised: none; no supported state reader/writer exists.
- Compatibility/fallback observed: `No`.
- Package lifecycle not directly proven because the prerequisite failed.

## Tests Implemented, Updated, Or Removed

None in API-REV-003.

## Durable Coverage Changed In The Codebase

- Repository-resident durable coverage added, updated, or removed this round: `No`.
- Proportional test-code review: `Not Applicable` for this round. Unchanged `API-VOICE-013` was already accepted in full source review `CRR-011`.

## Other Execution Artifacts

| Artifact | Purpose | Retention |
| --- | --- | --- |
| `api-e2e-evidence/api-rev-003/repository/API-VOICE-002-013-authority-reuse.json` | exact reuse basis | retained |
| `api-e2e-evidence/api-rev-003/repository/npm-ci.log` | dependency evidence | retained |
| `api-e2e-evidence/api-rev-003/repository/focused-trusted-baseline.log` | focused authority regression | retained |
| `api-e2e-evidence/api-rev-003/repository/npm-run-check.log` | full repository execution | retained |
| `api-e2e-evidence/api-rev-003/environment/darwin-arm64-preflight-v1.json` | production preflight result | retained |
| `api-e2e-evidence/api-rev-003/environment/darwin-arm64-preflight.log` | command/failure log | retained |
| `api-e2e-evidence/api-rev-003/environment/pmset-*.actual.txt` and focused probe log | exact host/source reproduction | retained |
| `api-e2e-evidence/api-rev-003/environment/API-VOICE-003-004-actual-preflight-failure.json` | structured failure/routing evidence | retained |

## Temporary Execution Methods / Scaffolding

| Method | Why | Result | Cleanup |
| --- | --- | --- | --- |
| owned `caffeinate` process | meet required sleep-prevention precondition | active during preflight | killed and reaped; PID absent |
| process-local regex/purge probe | separate source defect from environmental prerequisites | defect reproduced; purge exit 1 | process-local only; logs retained |

## Dependencies Mocked Or Emulated

None. The failing evidence is from the actual host and production preflight. No platform/provider/package behavior was imputed from mocks.

## Result Summary

| Result | Scenarios | Summary |
| --- | --- | --- |
| Pass | `API-VOICE-001`, reusable `002`, reusable `013` | current repository and unchanged English authority boundaries pass |
| Fail | shared prerequisite for `API-VOICE-003`/`004` | `API-F-001`: normal actual `pmset` no-warning text is misparsed as a warning |
| Not Tested after Fail | package portions of `003`/`004`, `011`, `012` | approved fail-closed ordering stopped downstream work |
| Deferred / Outside Matrix | `005`–`010` | current release is darwin-arm64 only |

## Cleanup Performed

| Resource | Ownership | Action | Result |
| --- | --- | --- | --- |
| `caffeinate` PID 75084 | API/E2E | killed and waited | Pass; no process remains |
| package/model/build/session roots | none created | no action | no package process or state exists |
| preserved study/upstream evidence | shared/upstream | untouched | retained |
| code-review artifacts | upstream modified/untracked | untouched | preserved |

## Preliminary Classification

- `API-F-001`: `Local Fix` candidate owned by Implementation Engineer. Production `benchmark/darwin-arm64-runner-preflight.mjs` uses a thermal regex that rejects the actual healthy `pmset` output shape.
- Code Reviewer must confirm the failure origin. The correction must parse affirmative warning state without weakening fail-closed thermal checks and should include the captured actual-output regression.
- Separate rerun prerequisites, not the source finding: connect the Mac to AC power and provision least-privilege noninteractive permission for exactly `/usr/sbin/purge`.

## Recommended Recipient

`code_reviewer` for focused failure-origin review.

## Evidence / Notes

The user required complete current-platform qualification. That qualification is **not finished** and no audio/package inference has yet run in API-REV-003. The failure happened earlier at the real M1 preflight. This round does not claim current-platform acceptance, does not defer audio silently, and does not perform release actions.

## Latest Authoritative Result

- Result: `Fail`.
- Final validation confidence: `79%`.
- Default 95% target met: `No`.
- Categories below 90%: `Yes` — requirement proof, directness, integration realism, environment fidelity, lifecycle/recovery.
- Broader validation: `Required; attempted; Fail at mandatory actual-host preflight`.
- Critical criteria lacking direct proof: complete `API-VOICE-003`, `004`, `011`, and `012`, including real English 49/Chinese 200 inference and exact 30/30/100 measurements.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Resume condition: reviewed source fix for `API-F-001`, AC power, and passing exact `/usr/bin/sudo -n /usr/sbin/purge`; then rerun preflight before any materialization/build.
