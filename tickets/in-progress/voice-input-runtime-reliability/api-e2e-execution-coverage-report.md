# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/backend-selection-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/aggregate-results.json`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/SHA256SUMS.txt`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `N/A`
- Relevant Delivery Revision IDs: `N/A`
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-001`
- Current Execution Round: `1`
- Trigger: `CRR-005` source/architecture Pass for `IR-005` against `SR-006` / `ARCH-REV-007`.
- Prior Round Reviewed: `None`
- Latest Authoritative Round: `Round 1 — Fail`

## Investigation And Execution Basis

- Coverage investigation artifact: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- Investigation completed before durable coverage changes or final execution: `Yes`
- Investigation plan followed: `Yes`. Repository checks and promoted evidence integrity ran first. The first real qualification-boundary check then failed the approved final-corpus uniqueness gate, so package construction/inference/target execution stopped fail-closed rather than manufacturing partial acceptance.
- Existing coverage decisions revised during execution: `Yes`. The checked-in English final qualification manifest and promoted baseline changed from presumed usable evidence to `Needs Update`; proposed `API-VOICE-013` should validate final checked-in corpora through the real validator after corrected evidence is supplied.
- Reroute required during execution: `Yes`
- Notes: This is a completed `Fail`, not `Blocked`. The failure is deterministic and precedes provider inference or target-host availability.

## Compatibility / Legacy Scope Check

- Reviewed requirements/design introduce, tolerate, or ambiguously describe backward compatibility in scope: `No`
- Compatibility-only or legacy-retention behavior observed in implementation: `No`
- Approved persisted-data transition followed without unnecessary migration or version-specific runtime fallback: `N/A — Not Affected`
- Durable coverage added or retained only for compatibility-only behavior: `No`
- If compatibility-related invalid scope was observed: `N/A`
- Upstream recipient notified: This report requests focused failure-origin review by `code_reviewer`.

## Changed Boundary And Evidence Matrix

| Scenario ID | Behavior / Requirement / Acceptance-Criteria IDs | Changed Boundary | Execution Surface / Mode | Evidence Type | Result | Evidence / Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| `API-VOICE-001` | `BEH-002`–`BEH-012`; `AC-002`, `AC-004`–`AC-008`, `AC-010`, `AC-011`, `AC-013`, `AC-017` | Source/unit/contract owners | Node/Python/Go repository checks | Durable | Pass | `api-e2e-evidence/repository/npm-run-check.log`: 34/34 Node, 7/7 Python, all Go/source checks |
| `API-VOICE-002` | `BEH-005`; `R-006`; `AC-007`, `AC-009`, `AC-017` | Promoted selection evidence and final corpus/baseline identity | Checksum validation plus direct real-audio corpus validation | Temporary/direct | Fail | `api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json` |
| `API-VOICE-003` | English `darwin-arm64`; `AC-003`, `AC-006`, `AC-009`, `AC-017` | Exact MLX package | Planned target package qualification | Live | Not Tested | Stopped because mandatory English corpus validation fails before inference |
| `API-VOICE-004` | Chinese `darwin-arm64`; same criteria | Exact Fun-ASR package | Planned target package qualification | Live | Not Tested | Stopped after earlier release-blocking matrix failure |
| `API-VOICE-005` | English `darwin-x64` | Exact faster-whisper package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-006` | Chinese `darwin-x64` | Exact Fun-ASR package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-007` | English `linux-x64` | Exact faster-whisper package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-008` | Chinese `linux-x64` | Exact Fun-ASR package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-009` | English `win32-x64` | Exact faster-whisper package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-010` | Chinese `win32-x64` | Exact Fun-ASR package | Planned actual-target qualification | Live | Not Tested | Same |
| `API-VOICE-011` | `AC-007`, `AC-008`, `AC-011`, `AC-017` | Exact package notices/licenses/privacy | Planned audit | Temporary/live | Not Tested | Requires corrected complete qualification matrix |
| `API-VOICE-012` | `AC-006`, `AC-007`, `AC-010`, `AC-017` | Catalog/release-evidence/reproducibility recomputation | Planned CLI aggregation without publication | Temporary/live | Not Tested | Complete matrix cannot be assembled after critical corpus failure |

## Additional Repository Coverage Execution

| Order | Command | Working Directory / Configuration | Boundary Or Scenario Proven | Result | Evidence / Output Path |
| --- | --- | --- | --- | --- | --- |
| 1 | `npm ci --ignore-scripts` | Assigned worktree; Node 22.23.1 | Locked test dependency setup | Pass | `api-e2e-evidence/repository/npm-ci.log` |
| 2 | `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Assigned worktree; official complete Go 1.26.5 darwin-arm64 root | `API-VOICE-001` source/unit/contract baseline | Pass | `api-e2e-evidence/repository/npm-run-check.log` |
| 3 | `(cd evidence/selection-study && shasum -a 256 -c SHA256SUMS.txt)` | Assigned worktree | All 191 promoted selection-study records | Pass | `api-e2e-evidence/repository/selection-study-checksums.log` |
| 4 | Direct Node import of `benchmark/corpus/validate-corpus.mjs` against repository-owned qualification manifests plus exact preserved WAV trees | Isolated `/private/tmp/autobyteus-voice-api-e2e-20260802/corpora` | Final corpus ID/path/audio-hash closure | Fail | `api-e2e-evidence/repository/corpus-validation.log`; `API-VOICE-002-corpus-identity-failure.json` |

## Validation Confidence Scorecard

| Confidence Category | Post-Repository Score | Final Score | Change | New / Final Supporting Evidence | Residual Uncertainty |
| --- | ---: | ---: | ---: | --- | --- |
| Requirement and acceptance-criteria proof | 50% | 50% | 0 | Critical `AC-007` directly fails; repository and Chinese corpus checks passed | All exact-package criteria remain unrun |
| Changed-boundary execution directness | 50% | 50% | 0 | Real validator and real audio identities directly exposed the defect | No final provider package ran |
| Cross-boundary integration realism and mock gap | 50% | 50% | 0 | Repository owners passed; qualification input boundary ran | Launcher/private host/model/target boundaries remain unrun |
| Environment, configuration, identity, and fixture fidelity | 75% | 75% | 0 | Exact M1 Max, Node, official Go root, promoted evidence, manifests, and WAV bytes | Other targets/inputs/audits remain unavailable and unneeded for this fail |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | 75% | 0 | Durable lifecycle/failure tests passed | Real package conformance remains unrun |
| User-surface, browser, and desktop-shell confidence | N/A | N/A | N/A | Runtime-only ticket | None for this scope |
| Durable regression coverage quality and relevance | 90% | 90% | 0 | All durable tests passed | No test invokes the checked-in final English corpus through `validateCorpus()` |

- Overall post-repository confidence: `65%`
- Overall final confidence: `65%`
- Calculation method: simple average of six applicable categories; UI/desktop is genuinely inapplicable.
- Confidence change produced by broader validation: `0`; broader package validation did not start after the critical fail.
- Every critical acceptance criterion directly proven: `No`
- Any final applicable category below `90%`: `Yes` — all except durable regression coverage.
- Default final confidence target of `95%` met: `No`
- Confidence-limiting residual risks: English final corpus/baseline is invalid; every exact package/target/quality/resource/license/release-evidence gate remains unexecuted.

## Broader Validation Decision And Execution

- Decision and selected execution mode from the coverage investigation: `Required` — CLI/lifecycle/worker/actual-target package qualification.
- Material deviation: execution stopped before package build because a prerequisite critical acceptance gate failed deterministically.
- Confidence gap or residual risk actually addressed: final qualification corpus provenance/identity closure.
- If Blocked: `N/A`; this is not an access/environment blocker.
- Startup order, commands, and readiness results: no provider process was started. The authoritative harness calls `validateCorpus()` before package execution; its English input fails the same uniqueness invariant.
- Environment choices: exact repository manifests and exact preserved study WAVs were staged under an isolated API/E2E-owned root. No corpus row or baseline was edited.
- Seed data/fixtures: English 50-row repository qualification manifest plus preserved exact audio; Chinese 200-row manifest plus exact audio.

| Scenario / Journey Step | Expected Observable Result | Actual Observable Result | Evidence | Result |
| --- | --- | --- | --- | --- |
| Verify promoted study bundle | Every checksum-indexed byte matches | 191/191 matched | `selection-study-checksums.log` | Pass |
| Validate final English qualification corpus before inference | 50 final rows have unique IDs, paths, and audio hashes | 50 rows, 49 unique in each dimension; `fleurs-en-2009` / `audio/fleurs-en-2009.wav` / SHA-256 `d6b0b81a9bebf170ea3443b629cf2fa5a38ffcd6cbb2cbc99c50506ef8dc6fe7` occurs twice | Failure JSON | Fail |
| Validate final Chinese qualification corpus | 200 unique IDs, paths, audio hashes and valid rights fields | 200/200 unique; validation passed | Failure JSON includes Chinese pass record | Pass |
| Compare promoted English baseline identity | Baseline has one result per unique final clip/audio | 50 results but 49 unique IDs/audio hashes; the same `fleurs-en-2009` identity occurs twice | Failure JSON | Fail |

## Desktop Application Validation

- Validation approach executed: `N/A`; runtime-only CLI scope.
- Browser-tested web-equivalent behavior: None.
- Shell-specific or lifecycle behavior: Package launcher lifecycle was planned but not run after prerequisite failure.
- Effect on any already-running desktop application: `None`
- Behavior not directly proven and confidence consequence: Desktop behavior is out of scope; package lifecycle is an unproven critical runtime residual.

## Platform / Runtime Targets

- Operating system / platform: macOS 26.5.2 (Darwin 25.5.0), arm64
- Hardware: MacBookPro18,4; Apple M1 Max; 64 GiB
- Runtime versions: Node 22.23.1; local Python 3.9.6 for source tests; official complete Go 1.26.5 darwin-arm64 root; CMake 4.3.3 discovered but package build not run.
- Browser / engine: `N/A`
- Locale/timezone: not material to the corpus identity failure.

## Lifecycle / Upgrade / Restart / Persisted-Data Checks

- Approved persisted-data decision: `Not Affected`
- Representative existing data exercised: `N/A`
- Direct-use, discard/rebuild, or migration result: `N/A`
- Migration completion/recovery evidence: `N/A`
- Version-specific runtime branch, dual read/write, or compatibility fallback observed: `No`
- Residual untested persisted-data risk: None. Commands remained inside the assigned runtime worktree, preserved study input, and API/E2E-owned temp root; no desktop state was accessed.

## Tests Implemented Or Updated

None.

## Tests Removed As Stale Or Obsolete

None.

## Durable Coverage Changed In The Codebase

- Repository-resident durable coverage added, updated, or removed this round: `No`
- Paths added or updated: `None`
- Paths removed: `None`
- Added or updated paths attached for proportional test-code review: `Not Applicable`
- Diff or repository evidence supplied for removed paths: `Not Applicable`

## Other Execution Artifacts

| Artifact Path | Type / Purpose | Retained Or Temporary | Notes |
| --- | --- | --- | --- |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/npm-ci.log` | Setup log | Retained | Pass |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/npm-run-check.log` | Full repository check log | Retained | 34 Node, 7 Python, all Go/source checks passed |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/selection-study-checksums.log` | Promoted evidence integrity log | Retained | 191/191 pass |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/corpus-validation.log` | Initial failing validator trace | Retained | Direct `validateCorpus()` failure |
| `tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json` | Structured expected/observed failure evidence | Retained | Authoritative failure detail; includes Chinese control pass |

## Temporary Execution Methods / Scaffolding

| Path / Method | Why Needed | Result / Evidence | Cleanup Result |
| --- | --- | --- | --- |
| `/private/tmp/autobyteus-voice-api-e2e-20260802/corpora` | Pair repository qualification manifests with exact preserved external WAVs without adding copyrighted audio to Git | Deterministic English failure and Chinese pass | Removed with repository `removeWritableTree`; absence verified |
| Inline Node corpus identity probe | Preserve duplicate dimensions and baseline alignment in structured evidence | Failure JSON generated | Process exited; no persistent scaffold |

## Dependencies Mocked Or Emulated

None for `API-VOICE-002`. Exact manifests and audio bytes were used. Repository lifecycle tests in `API-VOICE-001` contain their designed mocks, but they are not claimed as package proof.

## Result Summary

| Result | Scenario IDs | Summary / Reason |
| --- | --- | --- |
| Pass | `API-VOICE-001` | All reviewed repository source/unit/contract checks passed. |
| Fail | `API-VOICE-002` | English final corpus and its trusted baseline repeat one identity, directly violating `AC-007` and preventing qualification before inference. |
| Not Tested | `API-VOICE-003`–`API-VOICE-012` | Deliberately stopped after the critical fail; partial target/package results cannot produce release acceptance. |

## Cleanup Performed

| Resource / Process / Data | Ownership | Cleanup Action | Result |
| --- | --- | --- | --- |
| `/private/tmp/autobyteus-voice-api-e2e-20260802` | API/E2E-created | Repository `removeWritableTree` | Pass; absence verified |
| Provider/target processes | None created | N/A | None running |
| Worktree | Shared reviewed worktree | No reset/revert; retained upstream reviewer modifications and API/E2E artifacts only | `git diff --check` passes |

## Preliminary Classification

`Design Impact` is the preliminary classification. The approved requirements and benchmark protocol explicitly disclose that the initial 50-row English control has only 49 unique identities and explicitly require the **final** corpus to reject duplicate IDs, paths, and audio hashes. The implementation nonetheless promotes that acknowledged initial control as `release/evidence/qualification-corpora/english-v1.json` and as the trusted English baseline. Correcting this is not safely achieved by API/E2E dropping the row, selecting a new clip, or recomputing a baseline ad hoc because those actions change evidence authority and the non-regression comparator. `code_reviewer` should confirm origin and likely return the evidence/corpus/baseline decision to `solution_designer`.

## Recommended Recipient

`code_reviewer` for focused failure-origin review. No durable test code changed, so this is not a proportional successful-test review.

## Evidence / Notes

- Expected: every final profile corpus rejects duplicate ID/path/audio-hash samples before inference.
- Observed: English manifest SHA-256 `30c4cc0c6d952de68e881b239e07fd47b80144e06f487bc964deb89e6144b46e` has 50 rows and 49 unique IDs/paths/hashes. The duplicate is `fleurs-en-2009`, path `audio/fleurs-en-2009.wav`, audio SHA-256 `d6b0b81a9bebf170ea3443b629cf2fa5a38ffcd6cbb2cbc99c50506ef8dc6fe7`.
- Trusted English baseline SHA-256 `4cda09c10fa50e22981397c1be80f072b450da2154a0f604db40c940249927d1` repeats the same clip/audio result and likewise has only 49 unique identities.
- Chinese manifest SHA-256 `f10e79f85842b153b461cb3c54309c0fdfcece54d0ec2b1219805309d5b9d787` passed with 200/200 unique identities.
- The source/contract suite passing does not override the acceptance failure; it reveals that no durable test currently executes the checked-in final qualification corpus through the real validator.

## Latest Authoritative Result

- Result: `Fail`
- Final validation confidence: `65%`
- Default `95%` confidence target met: `No`
- Any final applicable confidence category below `90%`: `Yes` — requirement proof, directness, integration realism, environment fidelity, lifecycle/recovery.
- Broader validation decision: `Required`, but stopped fail-closed at the prerequisite corpus gate.
- Critical acceptance criteria lacking direct proof: `AC-002`–`AC-006`, package portion of `AC-007`, `AC-008`, quality/non-regression portion of `AC-009`, `AC-011`, package portion of `AC-013`, and package/target/notice portions of `AC-017`. `AC-007` is directly failing for English.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Notes: Resume with `API-REV-002` and the same scenario IDs only after corrected unique English corpus/baseline evidence passes upstream review. Recheck `API-VOICE-002` first; do not infer prior package success from this incomplete round.
