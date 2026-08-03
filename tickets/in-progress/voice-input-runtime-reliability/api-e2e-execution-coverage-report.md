# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced solution evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-018`, `CRR-024`, `CRR-025`.
- Implementation / Code Review: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `implementation-revision-record.md`; `code-review-report.md`; `code-review-revision-record.md`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-011 / 11`.
- Reviewed source: `8680c6a9693f3b55021c9317e0163281c946ca96`.
- Prior result: `API-REV-010 — Fail / 97%` at `API-F-007` during Chinese input-manifest verification.
- Latest authoritative result: **`API-REV-011 — Fail / 98%` at `API-F-008` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: shared-contract and prior-English validity decision -> exact-source focused/full checks -> fresh actual M1 Functional Preflight 2 -> current-source input materialization and exact corpora -> canonical first Chinese construction -> focused authenticated Apple ranlib alias/canonical-target probe.
- Existing coverage decision change: API-REV-010 English remains valid historical direct behavior evidence, but cannot be reused as the current QSet subject. Its Summary, runner, and provenance bind `e133c4a7`; current QSet 2 requires both profile subjects to bind `8680c6a9`. A full current-source English rerun is therefore required after Chinese construction succeeds.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`; after directly resolving `API-F-007`, the first Chinese native build failed because the trusted native owner canonicalizes the authenticated `ranlib` alias to `libtool`, changing command semantics. No CMake/tool override, PATH substitution, retry, unsandboxed build, provider/model/threshold change, or release action occurred.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; execution used owned roots and did not target product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario                              | Requirements / Criteria                          | Surface / Mode                                                    | Result                                      | Evidence                                                                                    |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `API-VOICE-001`                       | source integrity                                 | clean detached exact source; focused/full suites                  | Pass                                        | `api-rev-011/repository/`                                                                   |
| `API-VOICE-002` / `013`               | `AC-007`, `AC-009`, `AC-017`                     | exact authority/test continuity                                   | Pass / Reused                               | shared-contract impact JSON; full repository log                                            |
| shared `API-VOICE-003` / `004` impact | `AC-006`, `AC-017`, `AC-019`                     | Build Input Path 1 and QSet/provenance source identity            | Pass / decision complete                    | both retained manifests verify; current-source English rerun required                       |
| shared current-host readiness         | `AC-020`                                         | actual M1 Functional Preflight 2                                  | Pass / `loaded-host`                        | AC/thermal/memory/tool/sandbox/purge Pass; `67.71166666666667%` average idle                |
| shared current-source inputs/corpora  | `AC-006`, `AC-007`, `AC-009`, `AC-017`           | exact recipe materialization and 49/200 WAV validators            | Pass                                        | `inputs/`                                                                                   |
| `API-VOICE-004` input verification    | `AC-006`, `AC-017`, `AC-019`                     | all 3,149 exact Chinese records through production verifier       | Pass; prior `API-F-007` resolved            | build advanced into native C/C++ compilation                                                |
| `API-VOICE-004` native construction   | `AC-006`, `AC-017`, `AC-019`                     | CMake exact Apple toolchain under network-denied Seatbelt         | **Fail — `API-F-008`**                      | link at 5% invokes canonical `libtool` as `CMAKE_RANLIB`; static library cannot be produced |
| remaining Chinese qualification       | `AC-003`, `AC-008`, `AC-009`, `AC-011`, `AC-017` | second build/repro, 200 WAV, exact 30/30/100, lifecycle/resources | Not Tested after required construction Fail | no Chinese archive or executable qualification subject                                      |
| current-source `API-VOICE-003`        | `AC-003`, `AC-006`, `AC-009`, `AC-017`, `AC-023` | English rebuild/requalification needed for same-source QSet       | Not Tested after Chinese Fail               | API-REV-010 remains historical evidence only                                                |
| `API-VOICE-011` / `012`               | compliance/privacy/QSet/projection               | serial current matrix                                             | Not Tested after Fail                       | no complete same-source two-profile subject                                                 |
| `API-VOICE-005`–`010`                 | non-current targets                              | none                                                              | Deferred / Outside Current Matrix           | approved scope                                                                              |

## Repository Coverage Execution

| Command                                                                              | Result                                                                                               | Evidence                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| exact `e133c4a7...8680c6a9` shared-contract/runtime/evidence comparison              | Pass; runtime/provider archive unchanged; Build Input Path shared; prior English QSet identity stale | `repository/API-VOICE-003-004-shared-contract-impact.json` |
| new production verifier against retained English and Chinese API-REV-010 input trees | Pass: English 48/48; Chinese 3,149/3,149                                                             | `repository/retained-build-input-verification.log`         |
| `npm ci --ignore-scripts`                                                            | Pass                                                                                                 | `repository/npm-ci.log`                                    |
| exact-Go focused Build Input Path contract                                           | Pass, 4/4 with zero skips                                                                            | `repository/focused-build-input-path.log`                  |
| exact-Go `npm run check`                                                             | Pass: 76 top-level / 83 TAP Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks   | `repository/npm-run-check.log`                             |

## Validation Confidence Scorecard

| Category                                   | Post-Repository | Final | New Evidence / Limitation                                                                                                            |
| ------------------------------------------ | --------------: | ----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Requirement/acceptance proof               |             85% |   95% | Build Input contract passes directly; required Chinese construction now directly fails at a later exact tool boundary                |
| Changed-boundary directness                |             85% |  100% | exact reviewed source, both manifests, preflight, materializer, production package builder, CMake, and Apple tool path executed      |
| Cross-boundary realism                     |             75% |   97% | actual network-denied native Chinese build reaches CMake linking; no archive/model/lifecycle subject exists after failure            |
| Environment/configuration/fixture fidelity |             85% |  100% | actual M1 on AC, exact Go/CMake/Xcode/SDK/purge/Seatbelt, current-source inputs, exact corpora, authenticated alias and target bytes |
| Failure/lifecycle/recovery                 |             78% |   96% | deterministic production failure and independent same-byte alias probe captured; downstream Chinese lifecycle cannot start           |
| User/browser/desktop                       |             N/A |   N/A | runtime-only                                                                                                                         |
| Durable regression quality                 |             95% |  100% | focused/full suites pass with zero skips; no API/E2E-owned durable test code changed                                                 |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `98%` (six-category rounded average).
- Critical criteria fully proven: `No`; `AC-006`, `AC-017`, and `AC-019` directly fail for required Chinese package construction.
- Default clean Pass target met: `No`; a confidence score cannot override a failing critical criterion.
- Confidence reflects directness and fidelity of the pass/failure evidence, not product qualification success.

## Broader Validation Execution

### Shared Contract And English Reuse Decision

- Production changes from `e133c4a7` to `8680c6a9` are bounded to Build Input Path 1, its materializer/verifier consumers, contract, and implementation-owned tests. Provider Archive/runtime implementation diff is empty.
- The new production verifier accepted the retained API-REV-010 English input tree (`48/48`) and Chinese input tree (`3,149/3,149`), including all ten formerly rejected routing paths.
- API-REV-010 English remains trustworthy historical functional/performance evidence, but cannot be an authoritative current-source QSet row: its Summary `sourceCommit`, `runnerCommit`, and provenance source commit are `e133c4a7`; QSet 2 requires all three to match requested source/runner `8680c6a9`.
- Decision: rematerialize, rebuild twice, and fully requalify English at `8680c6a9` after the Chinese construction path succeeds.

### Shared Host And Current-Source Inputs

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64.
- Functional Preflight 2: Pass on AC with low-power off, owned `caffeinate`, normal thermal/memory state, exact tool identities, Seatbelt canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `loaded-host`; samples `76.72, 59.63, 62.33, 68.87, 69.23, 69.49`, average `67.71166666666667%`, no task-owned competing process. This did not block functionality and is not called controlled performance.
- Exact current-source materialization: Pass for both profiles. English input manifest SHA-256 `cc259c889a7fdc9ba30b5ece7bc2c01efd0b5ec1c4b4172e174e4c04572357c8`; Chinese input manifest SHA-256 `176317cc4a286eb8fe88f69b80ae1ca8437fc928e99f5231e4a3eed8e9603ff2`.
- Production corpus validators accepted all 49 unique English and 200 unique Chinese WAV identities.

### Chinese darwin-arm64 — `API-F-007` Resolved, `API-F-008` Failed

- `API-F-007` direct resolution: the canonical package builder accepted all 3,149 materialized records and advanced through CMake configuration and C/C++ compilation. No input path was renamed, omitted, projected, or mutated.
- Expected next behavior: exact authenticated Apple tools compile and link the native Fun-ASR worker so two reproducible archives can be created.
- Observed: at 5%, CMake attempted to link `libggml-base.a`; the configured `CMAKE_RANLIB` path was `/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/libtool`. `libtool` rejected ranlib-style argv with `no output file specified`, so make/CMake/package assembly exited nonzero before archive creation.
- Focused proof: Xcode's authenticated `.../usr/bin/ranlib` alias is a symlink to the same canonical `libtool` target and exact SHA-256 `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`. Invoking the alias on the same static archive succeeds (`0`); invoking the canonical target with the same archive argument fails (`1`) with the production error. The tool's alias/argv[0] is semantically required despite identical target bytes.
- Preliminary origin: bounded implementation defect in trusted native tool identity and resolved CMake composition. Canonical path resolution preserves bytes but destroys the authenticated command alias behavior.
- The run stopped fail-closed. No `CMAKE_RANLIB` override, PATH/tool substitution, retry, unsandboxed build, provider/model/threshold substitution, or release action was used.

## Platform / Runtime And Desktop Decision

- Current target reached: Chinese darwin-arm64 production construction on the actual M1 Max; it failed before archive/runtime creation.
- API-REV-010 English actual M1 evidence remains historical only; current-source English execution was not started after the serial Chinese failure.
- Other OS/architectures and `auto`: deferred, not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- User/product state: untouched; the user's unrelated installed voice worker remained running and was not signaled or reused.
- Chinese package/provider lifecycle: not created or started.
- Task-owned build processes exited; owned `caffeinate` was reaped.

## Durable Coverage Changed

None added, updated, or removed. This is a failure-origin review handoff, not a successful-test-code review handoff.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/environment/darwin-arm64-preflight-v2.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/chinese-darwin-arm64/`
- Structured finding: `API-F-008-chinese-ranlib-alias-loss-failure.json`.
- Independent focused analysis: `API-F-008-chinese-ranlib-alias-analysis.json` and `API-VOICE-004-ranlib-alias-semantics-probe.log`.

## Temporary Executable Probes

| Probe                                                      | Purpose                                                           | Result                                                            | Cleanup                                         |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| new verifier against both exact retained API-REV-010 trees | decide Build Input shared-contract validity                       | English 48/48 and Chinese 3,149/3,149 Pass                        | read-only; no input mutation                    |
| English evidence/QSet identity comparison                  | decide whether historical complete English can enter current QSet | historical behavior valid; current QSet reuse rejected            | read-only; no evidence mutation                 |
| authenticated Xcode ranlib alias vs canonical target       | isolate static-library link failure                               | same target bytes; alias succeeds; canonical `libtool` path fails | owned probe files retained; no source/tool edit |
| process scan after fail-closed stop                        | verify task-owned lifecycle cleanup                               | owned `caffeinate` reaped; no task-owned package/provider process | unrelated existing user worker preserved        |

## Cleanup

- Owned `caffeinate` PID `44378`: interrupted and reaped.
- Task-owned package/provider/qualification processes: none present.
- Exact-source checkout: clean at `8680c6a9693f3b55021c9317e0163281c946ca96`; retained with owned current-source inputs/output for correction rerun.
- User product state, unrelated user voice worker, tags, releases, and publication: untouched.

## Preliminary Classification

- `API-F-008`: `Local Fix / implementation defect` in trusted native command identity alias preservation and resolved CMake configuration. The production owner authenticates the correct Apple target bytes but supplies canonical `libtool` instead of the semantic `ranlib` alias.
- Recommended correction owner after focused review: Implementation Engineer.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final confidence: `98%`.
- Default clean Pass target met: `No`; required Chinese package construction directly failed.
- Broader validation: `Required; executed through Build Input resolution and the critical first Chinese native-link failure`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed correction: exact Chinese double construction/reproducibility, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; then Qualification Set 2 and independently verified Branch Catalog Projection 2.
