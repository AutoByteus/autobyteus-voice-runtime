# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced solution evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-017`, `CRR-022`, `CRR-023`.
- Implementation / Code Review: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `implementation-revision-record.md`; `code-review-report.md`; `code-review-revision-record.md`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-010 / 10`.
- Reviewed source: `e133c4a7a73a5531c726ecb04461acb641461667`.
- Prior result: `API-REV-009 — Fail / 95%` at `API-F-005` and `API-F-006`.
- Latest authoritative result: **`API-REV-010 — Fail / 97%` at `API-F-007` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: exact source/authority -> focused/full repository checks -> actual M1 Functional Preflight 2 -> source-bound input materialization and exact corpora -> canonical English double construction/verification/reproducibility -> compliance/conditions -> complete real English profile qualification -> canonical first Chinese construction.
- Existing coverage decision change: `None`; `API-VOICE-002` and durable `API-VOICE-013` remained byte-identical and reusable. The IR-017 launcher/evidence regression coverage is implementation-owned and source-reviewed.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`; the first required Chinese construction rejected its generated input manifest before native build/archive creation. No manifest edit, path-policy relaxation, source-tree mutation, retry, fallback, provider/model/threshold change, unsandboxed build, or release action occurred.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; execution used owned roots and did not target product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario                                 | Requirements / Criteria                                                       | Surface / Mode                                                     | Result                                      | Evidence                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `API-VOICE-001`                          | source integrity                                                              | clean detached exact source; focused/full suites                   | Pass                                        | `api-rev-010/repository/`                                                                             |
| `API-VOICE-002` / `013`                  | `AC-007`, `AC-009`, `AC-017`                                                  | exact-byte reuse plus production 49-WAV validator                  | Pass / Reused                               | source-reuse JSON; corpus-validation log                                                              |
| shared `API-VOICE-003` / `004` readiness | `AC-020`                                                                      | actual M1 Functional Preflight 2                                   | Pass / `controlled`                         | AC/thermal/memory/tool/sandbox/purge Pass; `80.63166666666666%` average idle                          |
| shared inputs/corpora                    | `AC-006`, `AC-007`, `AC-009`, `AC-017`                                        | exact source-bound recipes and 49/200 WAV validators               | Pass                                        | `inputs/`                                                                                             |
| `API-VOICE-003` construction             | `AC-006`, `AC-017`                                                            | two network-denied English builds, verifier, reproducibility       | Pass                                        | exact archive SHA-256 `08ecb07a195bbe78901ca21a4a4775d8067ac42e75049861f78f7b647626581d`              |
| `API-VOICE-003` real qualification       | `AC-002`–`AC-007`, `AC-009`, `AC-011`, `AC-013`, `AC-017`, `AC-020`, `AC-023` | packaged MLX public launcher, 49 WAV, exact 30/30/100, conformance | Pass; `API-F-005` / `API-F-006` resolved    | Summary 2, Assessment 1, 160/160 ledger, raw results, conformance, compliance, package/repro evidence |
| `API-VOICE-004` construction             | `AC-006`, `AC-017`, `AC-019`                                                  | first network-denied Chinese build through production verifier     | **Fail — `API-F-007`**                      | `build-primary.log`; exact manifest copy; independent closure/path analysis                           |
| remaining Chinese qualification          | `AC-003`, `AC-008`, `AC-009`, `AC-011`, `AC-017`                              | second build/repro, 200 WAV, exact 30/30/100, lifecycle/resources  | Not Tested after required construction Fail | no Chinese archive or executable qualification subject                                                |
| `API-VOICE-011`                          | compliance/privacy/offline                                                    | per-package generated evidence                                     | Partial: English Pass; Chinese not reached  | English compliance and offline package evidence; Chinese closed-input notices exist but no package    |
| `API-VOICE-012`                          | `AC-019`, `AC-021`, `AC-023`                                                  | QSet 2 / Branch Catalog Projection 2 / independent verification    | Not Tested after Fail                       | no complete two-profile subject                                                                       |
| `API-VOICE-005`–`010`                    | non-current targets                                                           | none                                                               | Deferred / Outside Current Matrix           | approved scope                                                                                        |

## Repository Coverage Execution

| Command                                                         | Result                                                                                             | Evidence                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| exact `1d712683...e133c4a7` authority/execution-byte comparison | Pass; English authority, recipes, matrix, preflight, package and path-policy owners unchanged      | `repository/API-VOICE-001-002-013-source-reuse.json` |
| `npm ci --ignore-scripts`                                       | Pass                                                                                               | `repository/npm-ci.log`                              |
| exact-Go launcher/evidence focused tests                        | Pass, 4/4 with zero skips                                                                          | `repository/focused-launcher-evidence.log`           |
| exact-Go `npm run check`                                        | Pass: 72 top-level / 79 TAP Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks | `repository/npm-run-check.log`                       |

## Validation Confidence Scorecard

| Category                                   | Post-Repository | Final | New Evidence / Limitation                                                                                                      |
| ------------------------------------------ | --------------: | ----: | ------------------------------------------------------------------------------------------------------------------------------ |
| Requirement/acceptance proof               |             85% |   94% | every English gate directly passes; Chinese input/package closure directly fails before construction                           |
| Changed-boundary directness                |             85% |   99% | exact reviewed source, host, package builders, public launcher, full English runner, and Chinese production verifier executed  |
| Cross-boundary realism                     |             75% |   96% | real English archive/model/process/lifecycle is complete; real Chinese native/runtime boundary is absent after input rejection |
| Environment/configuration/fixture fidelity |             85% |  100% | actual M1 on AC, exact toolchain/purge/Seatbelt/source-bound inputs and exact 49/200 corpus identities                         |
| Failure/lifecycle/recovery                 |             78% |   96% | full English conformance/recovery and terminal evidence pass; Chinese lifecycle cannot start                                   |
| User/browser/desktop                       |             N/A |   N/A | runtime-only                                                                                                                   |
| Durable regression quality                 |             95% |   99% | focused/full suites pass; no API/E2E-owned durable test code changed                                                           |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `97%` (six-category rounded average).
- Critical criteria fully proven: `No`; `AC-006`, `AC-017`, and `AC-019` directly fail for the required Chinese profile.
- Default clean Pass target met: `No`; a confidence score cannot override a failing critical criterion.
- Confidence reflects directness and fidelity of the pass/failure evidence, not product qualification success.

## Broader Validation Execution

### Shared Host And Inputs

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64.
- Functional Preflight 2: Pass on AC with low-power off, owned `caffeinate`, normal thermal/memory state, exact tool identities, Seatbelt canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `controlled`; six idle samples `81.73, 81.7, 78.14, 77.26, 82.51, 82.45`, average `80.63166666666666%`, no task-owned competing process.
- Source-bound English/Chinese materialization: Pass. Production corpus validators accepted all 49 unique English and 200 unique Chinese WAV identities.

### English darwin-arm64 — Complete Pass

- Both canonical archive constructions completed wholly inside the pinned deny-network Seatbelt after trusted native-environment authorization outside it. Archives and reports were byte-identical; package verification and reproducibility passed.
- Archive SHA-256: `08ecb07a195bbe78901ca21a4a4775d8067ac42e75049861f78f7b647626581d`; compressed `645,513,073` bytes; extracted `1,195,561,049` bytes; `6,502` entries.
- Actual packaged MLX public launcher/model/process journey passed. All `160/160` attempts succeeded with zero failed, timed-out, excluded, or hard-deadline-violating attempts: exactly 30 filesystem-cold, 30 warm-preparation, and 100 warm requests.
- English quality passed all 49 exact WAVs: WER `7.223942208462332%`, equal to the locked baseline, zero empty/failed results.
- Package/resource gates passed: peak provider-process-tree RSS `1,769,275,392` bytes; extracted size below the blocking 1.25 GiB bound; package remained read-only/unmodified.
- Runtime conformance passed no-speech, malformed audio/message, request timeout, unexpected exit, forced termination, clean next start, and no automatic replay.
- Performance Assessment 1 is `controlled-pass`. P95 values all met their reference targets: handshake `608.585292 ms`; cold preparation `5,790.622625 ms`; warm preparation `4,110.215708 ms`; cold result `8,798.928625 ms`; warm request `227.865083 ms`.
- Final Summary 2 and Assessment 1 were both written and digest-bound. Together with focused production-shaped non-pass coverage, this directly resolves `API-F-005` and `API-F-006`.

### Chinese darwin-arm64 — `API-F-007`

- Expected: the exact recipe-materialized Chinese tree is accepted by `verifyInputManifest()`, allowing two byte-identical Fun-ASR packages and full 200-WAV qualification.
- Observed: the first canonical network-denied construction exited `1` in `build/profile-builders/funasr.mjs` with `Error: Invalid input manifest record.` No native Chinese build or archive was created.
- The generated `SHA256SUMS.json` has SHA-256 `45ebe9bfe4885fb3207c8c613ac76a5bbc439343ff6b93f0345082718e99515e`, `3,149` records, and exact tree closure. Independent analysis verified every record's bytes, size, mode, uniqueness, and actual path; there are zero mismatches and no missing/extra paths.
- Exactly ten records violate only the production record-path allowlist `^[A-Za-z0-9._/-]+$`. They are clean exact llama.cpp UI source paths containing parentheses, brackets, or plus signs, beginning with `llama-cpp-source/tools/ui/src/routes/(chat)/+layout.svelte`.
- Preliminary origin: bounded implementation defect in Chinese closed-input materialization versus production input-manifest validation. The UI paths are not a host, permission, corpus, provider/model, threshold, performance, or user-state failure.
- The round stopped fail-closed. The second Chinese construction, archive/repro verification, 200-WAV inference, exact 30/30/100, Chinese lifecycle/resource/quality/compliance evidence, Qualification Set 2, and Branch Catalog Projection 2 were not run.

## Platform / Runtime And Desktop Decision

- Current target executed: both exact darwin-arm64 production entries were reached on the actual M1 Max; English completed, Chinese failed during first package construction.
- Other OS/architectures and `auto`: deferred, not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- User/product state: untouched; the user's unrelated installed voice worker remained running and was not signaled or reused.
- English package: relocation, isolated public launcher, contained recognizer, read-only/no-mutation, offline operation, bounded shutdown, forced termination, clean recovery, and no-orphan behavior passed.
- Chinese package: not created; no Chinese provider process started.

## Durable Coverage Changed

None added, updated, or removed. This is a failure-origin review handoff, not a successful-test-code review handoff.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/environment/darwin-arm64-preflight-v2.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/english-darwin-arm64/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/chinese-darwin-arm64/`
- Structured finding: `API-F-007-chinese-input-manifest-path-policy-failure.json`.
- Independent focused analysis: `API-F-007-chinese-input-manifest-analysis.json`.

## Temporary Executable Probes

| Probe                                               | Purpose                                                         | Result                                                                    | Cleanup                                        |
| --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| exact generated Chinese manifest closure/path audit | distinguish corrupt input from materializer/verifier policy gap | all bytes/sizes/modes/tree closure match; exactly ten path-policy rejects | read-only analysis; no source/input mutation   |
| process scan after fail-closed stop                 | verify task-owned lifecycle cleanup                             | owned `caffeinate` reaped; no task-owned package/provider process         | unrelated existing user voice worker preserved |

## Cleanup

- Owned `caffeinate` PID `73462`: interrupted and reaped.
- Task-owned package/provider/qualification processes: none present.
- Exact-source checkout: clean at `e133c4a7a73a5531c726ecb04461acb641461667`; retained with owned generated inputs/output for correction rerun.
- User product state, unrelated user voice worker, tags, releases, and publication: untouched.

## Preliminary Classification

- `API-F-007`: `Local Fix / implementation defect` in Chinese closed-input materialization/production-verifier integration. The exact source-bound materializer emits ten build-irrelevant llama.cpp UI paths that its mandatory downstream input-record validator rejects.
- Recommended correction owner after focused review: Implementation Engineer.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final confidence: `97%`.
- Default clean Pass target met: `No`; required Chinese package construction directly failed.
- Broader validation: `Required; executed through complete English qualification and the critical first Chinese construction failure`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed correction: exact Chinese double construction/reproducibility, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence, then Qualification Set 2 and independently verified Branch Catalog Projection 2.
