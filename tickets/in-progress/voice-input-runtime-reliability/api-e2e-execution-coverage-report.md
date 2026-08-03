# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced solution evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-016`, `CRR-020`, `CRR-021`.
- Implementation / Code Review: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `implementation-revision-record.md`; `code-review-report.md`; `code-review-revision-record.md`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-009 / 9`.
- Reviewed source: `1d712683c70c338d8bf5074f27c8b0c9da47a8cb`.
- Prior result: `API-REV-008 — Fail / 93%` at package manifest path validation (`API-F-004`).
- Latest authoritative result: **`API-REV-009 — Fail / 95%` at `API-F-005` and `API-F-006` in `API-VOICE-003`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before final execution: `Yes`.
- Plan followed: exact source/authority -> focused/full repository checks -> actual M1 Functional Preflight 2 -> source-bound input materialization and exact corpora -> canonical English double construction/verification/reproducibility -> compliance/conditions -> actual profile qualification.
- Existing coverage decision change: `None`; `API-VOICE-002` and durable `API-VOICE-013` remained byte-identical and reusable. IR-016 regression coverage is implementation-owned and already source-reviewed.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`; the first actual cold package trial failed before hello/model loading, and terminal Summary evidence was schema-invalid. No retry, fallback, provider/model/threshold change, isolation bypass, or release action occurred.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; execution used owned roots and did not touch product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario                                        | Requirements / Criteria                 | Surface / Mode                                                          | Result                            | Evidence                                                                                                   |
| ----------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `API-VOICE-001`                                 | source integrity                        | clean detached exact source; focused/full suites                        | Pass                              | `api-rev-009/repository/`                                                                                  |
| `API-VOICE-002` / `013`                         | `AC-007`, `009`, `017`                  | exact-byte reuse plus production 49-WAV validator                       | Pass / Reused                     | source-reuse JSON; corpus-validation log                                                                   |
| shared `API-VOICE-003`/`004` readiness          | `AC-020`                                | actual M1 Functional Preflight 2                                        | Pass                              | AC/thermal/memory/tool/sandbox/purge Pass; loaded-host `78.21%` average idle                               |
| shared inputs/corpora                           | `AC-006`, `007`, `009`, `017`           | exact source-bound recipes and 49/200 WAV validators                    | Pass                              | `inputs/`                                                                                                  |
| `API-VOICE-003` construction                    | `AC-006`, `017`                         | two network-denied English builds, verifier, reproducibility            | Pass; prior `API-F-004` resolved  | two 616 MiB archives; exact SHA-256 `057c011a6371e40fdfdc7bcc67fe99709ea39024ed2dcf47f97d84b84dc2b15f`     |
| `API-VOICE-003` public package start            | `AC-002`, `006`, `013`, `017`           | first cold purge/trial and focused exact public launcher under Seatbelt | **Fail — `API-F-005`**            | ledger `fail/process-loss`; focused launcher exits 1 with `ModuleNotFoundError: autobyteus_voice_provider` |
| `API-VOICE-003` terminal failure evidence       | `AC-003`, `007`, `011`, `017`, `023`    | Summary 2 / Assessment retention after process-loss                     | **Fail — `API-F-006`**            | Summary schema rejects forwarded archive `schemaVersion`; no Summary/Assessment created                    |
| remaining English inference/lifecycle/30/30/100 | current-platform contract               | actual package                                                          | Not Tested after Fail             | zero completed transcriptions; model never loaded                                                          |
| `API-VOICE-004`, `011`, `012`                   | Chinese/compliance aggregate/projection | serial current matrix                                                   | Not Tested after Fail             | no passing English profile subject                                                                         |
| `API-VOICE-005`–`010`                           | non-current targets                     | none                                                                    | Deferred / Outside Current Matrix | approved scope                                                                                             |

## Repository Coverage Execution

| Command                                                        | Result                                                                                             | Evidence                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| exact `24a994a...1d712683` authority/execution-byte comparison | Pass; listed authorities, package/preflight/profile/path-policy owners unchanged                   | `repository/API-VOICE-001-002-013-source-reuse.json` |
| `npm ci --ignore-scripts`                                      | Pass                                                                                               | `repository/npm-ci.log`                              |
| exact-Go focused runtime-closure/archive-normalization tests   | Pass, 11/11                                                                                        | `repository/focused-runtime-closure.log`             |
| exact-Go `npm run check`                                       | Pass: 71 top-level / 78 TAP Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks | `repository/npm-run-check.log`                       |

## Validation Confidence Scorecard

| Category                                   | Post-Repository | Final | New Evidence / Limitation                                                                                      |
| ------------------------------------------ | --------------: | ----: | -------------------------------------------------------------------------------------------------------------- |
| Requirement/acceptance proof               |             85% |   90% | construction passes; public-launcher and terminal-evidence criteria directly fail; downstream inference absent |
| Changed-boundary directness                |             85% |   98% | exact preflight, inputs, double package, verifier, purge, and public launcher executed                         |
| Cross-boundary realism                     |             75% |   95% | real extracted archive/public launcher/private host boundary fails; model not loaded                           |
| Environment/configuration/fixture fidelity |             85% |   99% | exact actual M1 on AC, toolchain, purge, Seatbelt, source-bound inputs, exact corpora                          |
| Failure/lifecycle/recovery                 |             78% |   88% | direct process-loss plus masked terminal evidence captured; recovery/shutdown/full counts absent               |
| User/browser/desktop                       |             N/A |   N/A | runtime-only                                                                                                   |
| Durable regression quality                 |             95% |   99% | focused/full suites pass; no API/E2E test code changed                                                         |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `95%` (six-category rounded average).
- Critical criteria fully proven: `No`; multiple critical criteria directly fail.
- Default clean Pass target met: `No`; failure/lifecycle is below 90% and critical criteria fail.
- Confidence reflects directness of the failure evidence, not product qualification success.

## Broader Validation Execution

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64.
- Preflight: functional Pass on AC. Low-power off, owned `caffeinate`, normal thermal/memory, exact tool identities, Seatbelt canaries, and `/usr/bin/sudo -n /usr/sbin/purge` capability passed.
- Performance classification: `loaded-host`, six samples `78.2, 79.17, 78.89, 79.9, 73.71, 79.39`, average `78.21%`. This did not block functionality and is not called controlled performance.
- Inputs: source-bound English/Chinese materialization passed. Production validators accepted all exact unique 49 English and 200 Chinese WAVs.
- English construction: both canonical builds completed wholly inside the pinned deny-network Seatbelt after one trusted native environment was created outside it. Package verifier and byte-for-byte reproducibility passed. Compressed size `645,512,982` bytes; extracted size `1,195,561,020` bytes, below the blocking 1.25 GiB gate; archive entry count `6,502`.
- Compliance and conditions generation: Pass.
- First cold trial: exact purge completion recorded. The attempt failed `process-loss` after `3,988.390125 ms`, before hello/model loading/transcription. No result was produced.
- Focused exact-public-launcher reproduction: the extracted relocated launcher ran under the same qualification Seatbelt and exited `1` in `792.1125 ms`. Its contained `worker/worker.py` exists, but the launcher invokes the contained Python host with `-I -B -X utf8`; isolated mode omits the adjacent worker directory, so import of `autobyteus_voice_provider` fails.
- Terminal evidence: the attempt ledger correctly says `fail/process-loss`, but `profile-qualification-evidence.mjs` composes `archive: { ...build.archive, fileName }`. The build archive object contains `schemaVersion: 1`; Summary 2's strict archive schema forbids that property. Evidence writing throws, masks the original error at the CLI boundary, creates no Summary 2, and therefore creates no Performance Assessment 1.

## Platform / Runtime And Desktop Decision

- Current target executed: English darwin-arm64 on the actual M1 Max.
- Chinese darwin-arm64: not started after serial English failure.
- Other OS/architectures: deferred, not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- User/product state: untouched.
- Package relocation/extraction: directly passed before launcher startup.
- Hello, model preparation, transcription, shutdown, recovery, no-orphan full journey: Not Tested after startup process-loss.
- Focused probe process: exited; no task-owned provider process remained.

## Durable Coverage Changed

None added, updated, or removed. Proportional API/E2E test-code review is `Not Applicable`.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/environment/darwin-arm64-preflight-v2.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/english-darwin-arm64/`
- Structured findings: `API-F-005-public-launcher-isolated-worker-import-failure.json`; `API-F-006-terminal-summary-archive-schema-failure.json`.

## Temporary Executable Probes

| Probe                                                                   | Purpose                                                              | Result                                                                    | Cleanup                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| exact archive extraction + public launcher under qualification Seatbelt | unmask first cold `process-loss` hidden by evidence-writer exception | contained Python fails import before hello; confirms API-F-005            | owned 1.2 GiB extraction removed; process absent |
| archive projection/schema comparison                                    | isolate terminal Summary validation error                            | only unexpected property is forwarded `schemaVersion`; confirms API-F-006 | no source modification                           |

## Cleanup

- Owned `caffeinate` PID 64914: interrupted/reaped; absent.
- Focused extracted package root: removed through repository safe writable-tree owner.
- Task-owned package/provider/qualification processes: none present.
- Exact-source checkout: clean at `1d712683c70c338d8bf5074f27c8b0c9da47a8cb`; retained with generated package/input roots for the correction rerun.
- User state, tags, releases, and publication: untouched.

## Preliminary Classification

- `API-F-005`: `Local Fix / implementation defect` in the host-neutral public launcher-to-contained-Python-worker composition. Exact launcher isolation prevents its packaged worker from importing adjacent application modules.
- `API-F-006`: `Local Fix / implementation defect` in profile qualification archive projection and terminal-failure evidence retention. Summary 2 receives one forbidden build-report field, masks the real runtime failure, and cannot create the required evidence chain.
- Recommended correction owner after focused review: Implementation Engineer.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final confidence: `95%`.
- Default clean Pass target met: `No`.
- Final applicable category below 90%: failure/lifecycle/recovery.
- Broader validation: `Required; executed until critical public-launcher and terminal-evidence failures`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed correction: complete English 49-WAV/model/lifecycle/exact 30/30/100/resource proof, then full Chinese package/200-WAV equivalent, compliance/privacy closure, Qualification Set 2, and independently verified Branch Catalog Projection 2.
