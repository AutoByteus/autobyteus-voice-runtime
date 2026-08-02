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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `N/A`
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-002`
- Current Execution Round: `2`
- Trigger: `CRR-008` Pass for `IR-007` against `SR-007` / `ARCH-REV-008`.
- Prior Round Reviewed: `API-REV-001 — Fail / 65% at API-VOICE-002`
- Latest Authoritative Round: `API-REV-002 — Blocked / 78% after API-VOICE-002 and API-VOICE-013 Pass`

## Investigation And Execution Basis

- Coverage investigation artifact: canonical path above.
- Investigation completed before durable coverage changes or final execution: `Yes`
- Investigation plan followed: `Yes`. The prior failing scenario was rechecked first. Durable coverage changed only after it passed. Exact-package construction did not start once the supported preflight proved required closed inputs, approvals, hosts, and cold-cache permission were unavailable.
- Existing coverage decisions revised during execution: `Yes`. English-v2 corpus/baseline changed from pending recheck to `Still Valid`; `tests/release/trusted-baseline.test.mjs` remains valid and now includes the production corpus-validator regression requested by `API-VOICE-013`.
- Reroute required before or during execution: `No product/source reroute`. The remaining outcome is an execution dependency Blocked state, which requires a user request rather than teammate routing.
- Notes: `API-REV-001` remains failed history. No prior package scenario is inferred to have passed.

## Compatibility / Legacy Scope Check

- Reviewed requirements/design introduce backward compatibility in scope: `No`
- Compatibility-only or legacy-retention behavior observed: `No`
- Approved persisted-data transition followed without unnecessary migration or fallback: `N/A — persisted user/application data is not affected`
- Durable coverage added only for compatibility behavior: `No`
- Invalid final English-v1 files remain absent; immutable historical 50-row study evidence is not a runtime fallback.

## Changed Boundary And Evidence Matrix

| Scenario ID | Behavior / Requirement / Acceptance-Criteria IDs | Changed Boundary | Execution Surface / Mode | Evidence Type | Result | Evidence / Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| `API-VOICE-001` | `BEH-002`–`BEH-012`; source/contract criteria | Current source, unit, contract, launcher, evidence owners | Node/Python/Go repository checks | Durable | Pass | Round-2 `npm-run-check.log`: 39/39 Node, 7/7 Python, all Go/source/evidence checks |
| `API-VOICE-002` | `BEH-005`; `R-006`; `AC-007`, `AC-009`, `AC-017` | Corrected English-v2 authority, exact audio, trust binding | Production corpus validator plus exact 49 WAVs, baseline owner, checksum and reproduction paths | Temporary/direct | Pass | `API-VOICE-002-corpus-identity-resolution.json`: approved digests, 49/49 unique IDs/paths/audio hashes, 70/969, one-to-one trusted baseline; six outputs byte-identical |
| `API-VOICE-003` | English `darwin-arm64`; `AC-003`, `AC-006`, `AC-009`, `AC-017` | Exact MLX package, M1 30/30/100 qualification | Supported package workflow | Live | Blocked | No complete closed input tree/approved audits; `sudo -n purge` unavailable |
| `API-VOICE-004` | Chinese `darwin-arm64`; same criteria | Exact Fun-ASR package, M1 30/30/100 and 200 clips | Supported package workflow | Live | Blocked | Same; preserved source/model bytes are partial candidate assets, not approved closed inputs |
| `API-VOICE-005` | English `darwin-x64` | Exact faster-whisper package/target | Actual target | Live | Blocked | No actual darwin-x64 runner or complete input/audit set |
| `API-VOICE-006` | Chinese `darwin-x64` | Exact Fun-ASR package/target | Actual target | Live | Blocked | Same |
| `API-VOICE-007` | English `linux-x64` | Exact faster-whisper package/target | Actual target | Live | Blocked | Docker server is linux-arm64; no linux-x64 runner or complete inputs/audits |
| `API-VOICE-008` | Chinese `linux-x64` | Exact Fun-ASR package/target | Actual target | Live | Blocked | Same |
| `API-VOICE-009` | English `win32-x64` | Exact faster-whisper package/Windows launcher and Job behavior | Actual target | Live | Blocked | No Windows x64 runner or complete inputs/audits |
| `API-VOICE-010` | Chinese `win32-x64` | Exact Fun-ASR package/Windows launcher and Job behavior | Actual target | Live | Blocked | Same |
| `API-VOICE-011` | `AC-007`, `AC-008`, `AC-011`, `AC-017` | Notices/licenses/privacy over exact package bytes | Audit | Temporary/live | Blocked | No approved license/offline audit records bound to exact package inventories |
| `API-VOICE-012` | `AC-006`, `AC-007`, `AC-010`, `AC-017` | Eight-package catalog/evidence/reproducibility recomputation | Aggregate CLI without publication | Temporary/live | Blocked | No complete qualification matrix exists; no release action attempted |
| `API-VOICE-013` | `AC-007`, `AC-009`, `AC-017`; SR-007 item 7 | Durable production corpus-validator boundary | Node test with deterministic 49-file English-v2-shaped fixture | Durable | Pass | Focused 6/6 and full 39/39 Node; rejects duplicate ID, path, and audio hash |

## Additional Repository Coverage Execution

| Order | Command | Working Directory / Configuration | Boundary Or Scenario Proven | Result | Evidence / Output Path |
| --- | --- | --- | --- | --- | --- |
| 1 | Production `validateCorpus()` + `loadTrustedBaseline()` + one-to-one assertions over exact staged English-v2 bytes/WAVs | Assigned worktree; owned `/private/tmp/autobyteus-voice-api-e2e-r2-20260802` | `API-VOICE-002` prior-failure resolution | Pass | `api-e2e-evidence/api-rev-002/repository/API-VOICE-002-corpus-identity-resolution.json` and exact validation log |
| 2 | `npm run check:evidence`; original and English-v2 checksum lists; six output byte comparison | Assigned worktree plus reviewed solution evidence | SR-007 reproduction/source/output authority | Pass | Round-2 reproduction/checksum/identity logs |
| 3 | `node --test tests/release/trusted-baseline.test.mjs`; Prettier | Assigned worktree | `API-VOICE-013` | Pass | 6/6; formatting Pass |
| 4 | `npm ci --ignore-scripts` | Assigned worktree; Node 22.23.1 | Locked JS environment | Pass | Round-2 `npm-ci.log` |
| 5 | `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Exact authenticated Go 1.26.5 darwin-arm64 root | Full current regression baseline | Pass | 39/39 Node, 7/7 Python, all Go/source/evidence checks |
| 6 | Go root verification, runner query, `VOICE_*`/host/input/audit/cold-procedure readiness probes | Local M1 Max, GitHub, preserved study assets | Exact package-matrix readiness | Blocked | `api-e2e-evidence/api-rev-002/environment/` |

## Validation Confidence Scorecard (Mandatory)

| Confidence Category | Post-Repository Score | Final Score | Change | New / Final Supporting Evidence | Residual Uncertainty |
| --- | ---: | ---: | ---: | --- | --- |
| Requirement and acceptance-criteria proof | 75% | 75% | 0 | Prior English acceptance failure resolved directly | Exact packages, quality, resource, target, audit, and aggregate criteria remain blocked |
| Changed-boundary execution directness | 75% | 75% | 0 | Exact 49-WAV production validation and current repository owners executed | No exact final package/private recognizer executed |
| Cross-boundary integration realism and mock gap | 75% | 75% | 0 | Real audio/trust/evidence/Go boundaries executed | Launcher/private host/model/actual-target integration remains blocked |
| Environment, configuration, identity, and fixture fidelity | 75% | 75% | 0 | Exact M1 Max, Node, authenticated Darwin Go roots, reviewed evidence bytes, and exact English audio used | Complete inputs/audits and three actual target classes are unavailable; M1 cold procedure unavailable |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | 75% | 0 | All current durable failure/lifecycle checks pass | Real package lifecycle and recovery remain blocked |
| User-surface, browser, and desktop-shell confidence | N/A | N/A | N/A | Runtime-only; no UI/desktop ticket boundary | None in scope |
| Durable regression coverage quality and relevance | 95% | 95% | 0 | API-VOICE-013 plus exact authority/duplicate/reproduction guards pass | Run-specific target evidence cannot reasonably be durable |

- Overall post-repository confidence: `78%`
- Overall final confidence: `78%`
- Calculation method: simple average of the six applicable category scores, rounded to the nearest whole percentage.
- Confidence change produced by broader validation: `0`; readiness evidence made the blocker exact but did not execute packages.
- Every critical acceptance criterion directly proven: `No`
- Any final applicable category below `90%`: `Yes` — requirement proof, directness, integration realism, environment fidelity, and lifecycle/recovery.
- Default final confidence target of `95%` met: `No`
- Confidence-limiting residual risks: exact eight-package construction/reproducibility, actual MLX/faster-whisper/Fun-ASR inference, M1 30/30/100 performance/RSS/size, Linux/Windows behavior, notices/licenses/privacy, and aggregate release-evidence verification.

## Broader Validation Decision And Execution

- Decision and selected mode: `Blocked`; required CLI/lifecycle/worker/actual-target package qualification.
- Material deviation: package construction did not start because the supported preflight proved mandatory inputs and approvals were absent. Partial study assets were not promoted ad hoc.
- Confidence gap addressed: resolved the prior exact English corpus uncertainty and identified the precise environment dependency package.
- Exact unavailable dependencies:
  1. complete `SHA256SUMS.json`-closed `VOICE_BUILD_INPUT_ROOT/<profile>/<target>` trees for all eight packages;
  2. authoritative per-package `license-audit-v1.json` and per-target `offline-environment-v1.json` under `VOICE_EVIDENCE_ROOT`;
  3. actual darwin-x64, linux-x64, and win32-x64 runners with exact target Go roots (GitHub currently reports zero self-hosted runners);
  4. noninteractive permission for pinned `sudo -n purge` on the M1 Max reference runner;
  5. configured corpus/evidence/power/background-load roots/conditions.
- Attempted alternatives: exact local corpus/audio validation, full repository checks, inspection of preserved study models/sources/Python archive, authentication of both available Darwin Go roots, Docker target check, and current GitHub runner query. Docker is linux-arm64 and cannot substitute for linux-x64; partial study assets and self-authored approvals cannot substitute for approved release inputs.
- Startup/readiness: no package process or release action started because preconditions failed closed.
- Environment: MacBookPro18,4 M1 Max, 64 GB, macOS kernel 25.5.0, arm64; Node 22.23.1; CMake 4.3.3; Docker linux/arm64.
- Fixture state: exact 49 English WAVs were staged only in the owned temporary root and removed after validation.

| Scenario / Journey Step | Expected Observable Result | Actual Observable Result | Evidence | Result |
| --- | --- | --- | --- | --- |
| Corrected English prerequisite | 49 exact unique audio identities bind one-to-one to trusted baseline | 49/49 unique; every digest matches; 70/969; approved digests and six outputs match | Round-2 API-VOICE-002 JSON/logs | Pass |
| Package-matrix readiness | All exact inputs, audits, target runners, and M1 cold permission are present | Required roots unset; audits absent; zero runners; only local arm64 target; purge denied | Readiness JSON and runner/Go logs | Blocked |
| Eight package builds/qualifications | Exact actual-target package proof | Not started after fail-closed readiness result | Same | Blocked |
| Audit and aggregate proof | Approved exact inventories and complete matrix recompute | No authoritative audits or complete matrix | Same | Blocked |

## Desktop Application Validation

- Validation approach: `N/A — runtime-only`
- Browser-tested behavior: None.
- Shell-specific behavior: repository Go/contract checks passed; actual package shell/process behavior remains blocked.
- Effect on running desktop application: `None`
- Desktop confidence consequence: None; desktop is outside this ticket.

## Platform / Runtime Targets

- Executed host: darwin-arm64 M1 Max only.
- Runtime versions: Node 22.23.1; Python 3.9.6 for local checks; authenticated Go 1.26.5; CMake 4.3.3.
- Additional available compiler root: darwin-x64 Go 1.26.5 authenticated as availability evidence only; no x64 Node/actual Intel target qualification.
- Missing actual targets: darwin-x64, linux-x64, win32-x64.

## Lifecycle / Upgrade / Restart / Persisted-Data Checks

- Approved persisted-data decision: `Not Affected`
- Representative existing data exercised: None required; no user-state reader/writer exists in this runtime repository.
- Version-specific branch, dual read/write, or compatibility fallback observed: `No`
- Residual persisted-data risk: None in scope. Real package lifecycle/recovery risk remains blocked and is scored separately.

## Tests Implemented Or Updated

| Path / Scenario | Change | Requirement / Boundary | Execution Result | Notes |
| --- | --- | --- | --- | --- |
| `tests/release/trusted-baseline.test.mjs` / `API-VOICE-013` | Updated | `AC-007`, `AC-009`, `AC-017`; production corpus-validator uniqueness boundary | Pass | Deterministic 49-file fixture derived from English-v2 manifest shape; production validator accepts unique input and rejects duplicate ID/path/hash |

## Tests Removed As Stale Or Obsolete

None.

## Durable Coverage Changed In The Codebase

- Repository-resident durable coverage changed: `Yes`
- Paths added or updated: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tests/release/trusted-baseline.test.mjs`
- Paths removed: None.
- Attached for proportional test-code review: `Not yet — Blocked outcomes are not handed to a teammate; attach on resumed completed Pass/Fail routing.`

## Other Execution Artifacts

| Artifact Path | Type / Purpose | Retained Or Temporary | Notes |
| --- | --- | --- | --- |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/repository/` | Exact corpus, authority, source-check, and durable-test evidence | Retained | Round-specific; prior failure evidence untouched |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/environment/API-VOICE-003-012-readiness.json` | Structured blocker/readiness evidence | Retained | Authoritative missing-dependency inventory |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/environment/github-runners.json` | GitHub runner query | Retained | `total_count: 0` |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/environment/go-root-verification.log` | Exact Darwin Go-root authentication | Retained | arm64 host proof; x64 availability only |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/environment/cleanup.log` | Owned-root cleanup evidence | Retained | Temp corpus root absent after cleanup |

## Temporary Execution Methods / Scaffolding

| Path / Method | Why Needed | Result / Evidence | Cleanup Result |
| --- | --- | --- | --- |
| `/private/tmp/autobyteus-voice-api-e2e-r2-20260802` | Stage byte-identical English-v2 manifest and exact referenced 49 WAVs | API-VOICE-002 Pass | Removed with repository `removeWritableTree`; absence verified |
| Inline Node probes | Exercise production validators/owners and record environment facts without adding tooling | Pass/Blocked as recorded | Process-local only; no script retained |

## Dependencies Mocked Or Emulated

- No dependency was mocked for API-VOICE-002.
- API-VOICE-013 uses deterministic temporary audio bytes to durably exercise validator mechanics; exact licensed WAV integrity is separately proven by API-VOICE-002.
- Docker linux-arm64 was inspected only and was not treated as linux-x64 evidence.

## Result Summary

| Result | Scenario IDs | Summary / Reason |
| --- | --- | --- |
| Pass | `API-VOICE-001`, `API-VOICE-002`, `API-VOICE-013` | Current repository checks pass; the prior English corpus defect is directly resolved; durable validator coverage passes. |
| Blocked | `API-VOICE-003`–`API-VOICE-012` | Exact closed inputs, approved audits, required target runners, and M1 cold-cache permission are unavailable. |
| Out Of Scope | Desktop integration; tag/publication | Runtime-only ticket; release/finalization remains Delivery-owned. |

## Cleanup Performed

| Resource / Process / Data | Ownership | Cleanup Action | Result |
| --- | --- | --- | --- |
| `/private/tmp/autobyteus-voice-api-e2e-r2-20260802` | API/E2E-owned | Repository `removeWritableTree` | Pass; root absent |
| Package processes/containers/releases | None created | No action | No target package or release action started |
| Preserved backend-study assets | Upstream/shared evidence | Untouched | Retained |

## Preliminary Classification

- Classification: `Blocked — exact execution dependency`
- This is not evidence of a source, test, design, quality, or package failure. It is also not a Pass.
- Do not relax thresholds, substitute a provider/host, invent a legal approval, use linux-arm64 as linux-x64, or bypass the pinned M1 cold procedure.

## Recommended Recipient

- `User request`; no teammate routing while Blocked.
- Open the next API/E2E revision at `API-VOICE-003` after the exact dependency package is available. Re-run API-VOICE-002 only if its authoritative bytes or referenced audio change.

## Evidence / Notes

The user's offered manual audio validation is compatible with deferring difficult live inference, but it cannot be recorded as team-executed package acceptance. If the user wants to remove those gates rather than provision them, the approved requirements/design scope must be revised upstream; this report will not silently convert untested audio/package behavior into Pass.

## Latest Authoritative Result

- Result: `Blocked`
- Final validation confidence: `78%`
- Default `95%` confidence target met: `No`
- Any final applicable confidence category below `90%`: `Yes` — requirement proof, directness, integration realism, environment fidelity, lifecycle/recovery.
- Broader validation decision: `Blocked`
- Critical criteria lacking direct proof: exact `AC-003`, `AC-006`, `AC-009`, `AC-011`, and `AC-017` package/target/resource/audit/aggregate gates.
- Required next recipient: `User request`
- Notes: API-VOICE-002 and API-VOICE-013 Pass. API-VOICE-003–API-VOICE-012 remain Blocked, not failed or passed. No tag, publication, or release mutation occurred.
