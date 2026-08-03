# API/E2E Revision Record

## Revision Index

| Revision ID   | Triggering Role / Report / Round                               | Related Upstream Revision IDs                                      | Prior Result / Confidence | Current Result / Confidence |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------- | --------------------------- |
| `API-REV-001` | Code Reviewer / `code-review-report.md` / `CRR-005`            | `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005`                      | `N/A`                     | `Fail / 65%`                |
| `API-REV-002` | Code Reviewer / `code-review-report.md` / `CRR-008`            | `SR-007`, `ARCH-REV-008`, `IR-007`, `CRR-008`                      | `Fail / 65%`              | `Blocked / 78%`             |
| `API-REV-003` | Code Reviewer / `code-review-report.md` / `CRR-011`            | `SR-008`, `SR-009`, `ARCH-REV-010`, `IR-010`, `CRR-011`            | `Blocked / 78%`           | `Fail / 79%`                |
| `API-REV-004` | Code Reviewer / `code-review-report.md` / `CRR-013`            | `SR-008`, `SR-009`, `ARCH-REV-010`, `IR-011`, `CRR-013`            | `Fail / 79%`              | `Blocked / 82%`             |
| `API-REV-005` | Code Reviewer / `code-review-report.md` / `CRR-015`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-013`, `CRR-015`            | `Blocked / 82%`           | `Fail / 87%`                |
| `API-REV-006` | Code Reviewer / `code-review-report.md` / `CRR-017`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-014`, `CRR-017`            | `Fail / 87%`              | `Fail / 89%`                |
| `API-REV-007` | Code Reviewer / `code-review-report.md` / `CRR-019`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-015`, `CRR-019`            | `Fail / 89%`              | `Blocked / 86%`             |
| `API-REV-008` | User AC-readiness confirmation after Code Reviewer / `CRR-019` | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-015`, `CRR-019`            | `Blocked / 86%`           | `Fail / 93%`                |
| `API-REV-009` | Code Reviewer / `code-review-report.md` / `CRR-021`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-016`, `CRR-020`, `CRR-021` | `Fail / 93%`              | `Fail / 95%`                |
| `API-REV-010` | Code Reviewer / `code-review-report.md` / `CRR-023`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-017`, `CRR-022`, `CRR-023` | `Fail / 95%`              | `Fail / 97%`                |

## Revision Entries

### API-REV-001 — Final English corpus identity blocks exact-package qualification

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-005`; API/E2E round 1.
- Triggering finding or scenario IDs: `API-VOICE-002`; `AC-007`, `AC-009`, `AC-017`.
- Related solution, architecture-review, implementation, code-review, or delivery revision IDs: `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005`; delivery `N/A`.
- Why this baseline was recorded: The mandatory investigation completed, repository checks passed, and the first direct qualification prerequisite found that the checked-in final English corpus and trusted baseline repeat one clip/audio identity even though approved final corpora must be unique. The real validator fails before inference, so the remaining package matrix stopped fail-closed.
- Coverage decisions or durable test paths changed: No repository test code changed. `release/evidence/qualification-corpora/english-v1.json` and `release/evidence/baselines/english-v1.json` are `Needs Update`. Proposed future `API-VOICE-013` should validate corrected checked-in final corpora through `validateCorpus()`.
- Scenarios added, changed, removed, or rechecked: Established `API-VOICE-001`–`API-VOICE-012`; `API-VOICE-001` passed, `API-VOICE-002` failed, and `API-VOICE-003`–`API-VOICE-012` were not run after the critical failure.
- Commands, environment, fixture, or broader-validation delta: Node 22.23.1, official complete Go 1.26.5 darwin-arm64 root, exact MacBookPro18,4 M1 Max/64 GB host, 191-file promoted-study checksum run, repository manifests, and exact preserved English/Chinese WAVs. No provider package was started.

#### Prior Failure Resolution

None.

- Canonical artifacts and sections updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json`
- Prior result and confidence: `N/A`
- Current result and confidence: `Fail / 65%`
- New or remaining failure IDs: `API-VOICE-002` remains open. Exact package scenarios `API-VOICE-003`–`API-VOICE-012` remain unexecuted, not failed.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary classification `Design Impact`, likely evidence-authority correction by `solution_designer`.
- Remaining risks, blocked evidence, or untested scope: All eight exact packages, actual MLX/faster-whisper/Fun-ASR inference, M1 30/30/100 performance/RSS/size, actual Linux/Windows behavior, notices/licenses/privacy, and release-evidence aggregation must run after `API-VOICE-002` is corrected and re-reviewed.

### API-REV-002 — Corrected English authority passes; exact package matrix lacks required environment

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-008`; API/E2E round 2.
- Triggering finding or scenario IDs: recheck `API-VOICE-002`; continue `API-VOICE-003`–`API-VOICE-012`; add `API-VOICE-013`.
- Related solution, architecture-review, implementation, code-review, or delivery revision IDs: `SR-007`, `ARCH-REV-008`, `IR-006`, `IR-007`, `CRR-007`, `CRR-008`; delivery `N/A`.
- Why this revision was recorded: The exact corrected 49-WAV corpus/baseline prerequisite directly resolves the prior failure, and a bounded durable production-validator regression now passes. The supported actual-package matrix then reached a real environment blocker: no complete closed build-input trees or approved audits are configured, no x64/Windows target runners exist, GitHub reports zero self-hosted runners, and the M1 runner lacks noninteractive pinned purge permission.
- Coverage decisions or durable test paths changed: `release/evidence/qualification-corpora/english-v2.json` and `release/evidence/baselines/english-v2.json` are `Still Valid`. Updated `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tests/release/trusted-baseline.test.mjs` for `API-VOICE-013`; no coverage removed.
- Scenarios added, changed, removed, or rechecked: `API-VOICE-002` changed from Fail to Pass; `API-VOICE-001` re-passed; `API-VOICE-013` added and passed; `API-VOICE-003`–`API-VOICE-012` are Blocked, not failed or passed.
- Commands, environment, fixture, or broader-validation delta: exact 49 retained WAVs; production `validateCorpus()`/trusted-baseline/one-to-one validation; supported six-output reproduction and checksum verification; focused 6/6; full 39/39 Node, 7/7 Python and all Go/source/evidence checks; both available Darwin Go roots authenticated; M1/runner/input/audit/cold-procedure readiness probed.

#### Prior Failure Resolution

| Prior Scenario / Failure Reference                                                   | Previous Classification                             | Current Resolution | Evidence                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-VOICE-002` / API-REV-001 English final corpus repeated one operational identity | `Design Impact`; resolved upstream through `SR-007` | `Resolved / Pass`  | `api-e2e-evidence/api-rev-002/repository/API-VOICE-002-corpus-identity-resolution.json`: 49/49 exact unique WAV identities, approved corpus/baseline digests, one-to-one trust, 70/969; supported reproduction and all six output comparisons pass |

- Canonical artifacts and sections updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tests/release/trusted-baseline.test.mjs`
- Prior result and confidence: `Fail / 65%`
- Current result and confidence: `Blocked / 78%`
- New or remaining failure IDs: None. `API-VOICE-003`–`API-VOICE-012` remain Blocked execution dependencies.
- Recommended recipient: User request. No teammate routing while Blocked.
- Remaining risks, blocked evidence, or untested scope: complete eight-package reproducibility and actual-target qualification; real MLX/faster-whisper/Fun-ASR inference/lifecycle/recovery; M1 30 cold / 30 warm-preparation / 100 warm-request latency, RSS, and size; actual Linux/Windows behavior; authoritative notice/license/offline/privacy audits; aggregate release-evidence recomputation.

### API-REV-003 — Actual M1 preflight rejects healthy no-warning output

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-011`; API/E2E round 3.
- Triggering scenarios: reusable `API-VOICE-002`/`013`, then complete current-matrix `API-VOICE-003`, `004`, `011`, and `012`.
- Related upstream revisions: `SR-008`, `SR-009`, `ARCH-REV-010`, `IR-008`–`IR-010`, `CRR-009`–`CRR-011`.
- Why this revision was recorded: the user-approved matrix is now exactly two darwin-arm64 packages. Current source/authority coverage passed, but the mandatory actual M1 production preflight exposed `API-F-001`: its thermal regex matches the word `warning` inside normal “No ... warning ... recorded” output and marks a healthy output shape abnormal. Downstream package work stopped fail-closed.
- Coverage/durable test changes: none. `API-VOICE-002` and accepted durable `API-VOICE-013` were reused only after an empty exact relevant-byte diff and working-tree/source digest match.
- Scenario delta: `API-VOICE-001`, `002`, and `013` Pass; the shared preflight for `003`/`004` Fail; package portions of `003`/`004` and `011`/`012` are Not Tested after Fail; `005`–`010` are Deferred / Outside Current Release Matrix.
- Execution delta: Node 22.23.1; official Go 1.26.5 darwin/arm64; focused 6/6; full 57/57 Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual MacBookPro18,4 M1 Max / 64 GiB production preflight with owned `caffeinate`; focused actual `pmset` and purge probes.

#### Prior Failure Resolution

| Prior Scenario / Failure Reference                | Previous Classification                               | Current Resolution                                                                                                                                                      | Evidence                                                                         |
| ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `API-REV-002` eight-target environment blocker    | Blocked                                               | Scope superseded prospectively, not retroactively: six non-arm64 rows are now Deferred / Outside Current Release Matrix; current pass requires only the two M1 packages | approved `current-platform-qualification.md`                                     |
| `API-VOICE-002` / `API-VOICE-013` reuse authority | Passed boundary, reuse conditional on unchanged bytes | Confirmed unchanged and reusable                                                                                                                                        | `api-e2e-evidence/api-rev-003/repository/API-VOICE-002-013-authority-reuse.json` |

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-003/`
- Prior result/confidence: `Blocked / 78%`.
- Current result/confidence: `Fail / 79%`.
- New failure: `API-F-001` — actual healthy `pmset -g therm` output is misparsed by production preflight.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary `Local Fix` candidate for Implementation Engineer.
- Remaining risks/prerequisites: after reviewed source correction, the host must be connected to AC and must pass exact noninteractive `/usr/bin/sudo -n /usr/sbin/purge`; then the full two-package build/inference/lifecycle/30/30/100/compliance/QSet/projection matrix must run. No package, model, tag, publication, or release action ran in this revision.

### API-REV-004 — Thermal fix passes; M1 host does not reach quiescence

- Trigger: Code Reviewer `CRR-013`; API/E2E round 4; reviewed source `23d766873fa1be357c657fab8203913fec09e65b` (`IR-011`).
- Scenarios: prior `API-F-001` resolution; reusable `API-VOICE-002`/`013`; shared M1 preflight for `API-VOICE-003`/`004`.
- Why recorded: source and exact readiness dependencies passed, and the production preflight directly confirmed the thermal repair. The full 15-minute quiescence window then completed without the required six-sample >=80% CPU-idle average, so package work remained blocked.
- Durable coverage changes: none. Authority/test reuse bytes remain unchanged. IR-011's thermal coverage is upstream implementation coverage already accepted by CRR-013.
- Execution delta: focused thermal/authority 9/9; full 60/60 Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; AC/purge ready; actual M1 production preflight with owned `caffeinate`.

#### Prior Failure Resolution

| Prior Failure                                                    | Previous Classification           | Current Resolution                               | Evidence                                                                                              |
| ---------------------------------------------------------------- | --------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `API-F-001` / API-REV-003 actual healthy thermal output rejected | Local Fix / implementation defect | Resolved / Pass at the exact production boundary | `api-rev-004/environment/darwin-arm64-preflight-v1.json`: `thermalNormal=true`; CRR-013 source review |
| AC power and noninteractive purge absent                         | Environment prerequisites         | Resolved                                         | preflight `acConnected=true`; independent exact `/usr/bin/sudo -n /usr/sbin/purge` exit 0             |

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-004/`
- Prior result/confidence: `Fail / 79%`.
- Current result/confidence: `Blocked / 82%`.
- New failure IDs: none.
- Recommended recipient: user request only; no teammate routing while Blocked.
- Exact blocker: final samples `73.94, 71.42, 69.93, 66.30, 67.73, 68.51`, computed average `69.638%`, required >=80%. Observed major consumers included Docker Desktop's virtualization VM/renderer, WindowServer, WeChat media, and AutoByteus renderers.
- Resume: user quits Docker Desktop/VM and other CPU-heavy apps while keeping AC connected; API/E2E opens the next revision and reruns production preflight before package materialization. No package, model, QSet/projection, tag, publication, or release action ran.

### API-REV-005 — Functional preflight and exact inputs pass; canonical Seatbelt package entry cannot execute

- Trigger: Code Reviewer `CRR-015`; API/E2E round 5; reviewed source `628bef9d9b1f40f263cb1f41e711649b8ca7dfe6` (`IR-013`) against `SR-010`/`SR-011` and `ARCH-REV-012`.
- Scenarios: prior loaded-host blocker resolution; reusable `API-VOICE-002`/`013`; current-matrix `API-VOICE-003`, `004`, `011`, and `012`.
- Why recorded: Functional Preflight 2 correctly passed at `75.17166666666667%` average idle as non-blocking `loaded-host`. Both exact closed input trees and both exact 49/200 corpora passed. The first required English package build then failed at the canonical reviewed Seatbelt command before archive construction because the package assembler live-spawns `/usr/bin/sudo -V` inside Seatbelt and macOS rejects that setuid spawn with `EPERM`.
- Durable coverage changes: none. `API-VOICE-002` and durable `API-VOICE-013` were reused only after exact unchanged-byte proof. Run-specific package/input/corpus evidence remains temporary execution evidence.
- Execution delta: focused 10/10; full 66/66 Node and 7/7 Python plus compileall with all Go/source/schema/evidence checks; actual M1 Functional Preflight 2 Pass; 35 exact cache objects and pinned clean Git checkouts; English/Chinese materialization Pass; exact 49/200 production corpus validation Pass; first network-denied package build Fail.

#### Prior Failure Resolution

| Prior Failure                                      | Previous Classification                          | Current Resolution                                                                | Evidence                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| API-REV-004 sub-80% CPU-idle functional blocker    | Environment Blocked under the superseded v1 gate | Resolved by approved Functional Preflight 2; no idle minimum blocks functionality | `api-rev-005/environment/darwin-arm64-preflight-v2.json`: Pass, `loaded-host`, `75.17166666666667%`; execution continued into inputs/build |
| `API-F-001` thermal parser                         | Resolved in API-REV-004                          | Remains resolved                                                                  | same preflight: `thermalNormal=true`                                                                                                       |
| AC power and exact noninteractive purge capability | Previously resolved prerequisites                | Reconfirmed Pass                                                                  | same preflight: `acConnected=true`, `purge.nonInteractivePass=true`                                                                        |

#### New Failure

- ID: `API-F-002`.
- Scenario / criteria: `API-VOICE-003`; `AC-006`, `AC-017`.
- Expected: the canonical Seatbelt network-denied workflow command consumes the passing Functional Preflight 2 record and constructs the first exact English archive.
- Observed: `package-assembler.mjs` -> `createTrustedNativeBuildEnvironment()` -> `assertPassingDarwinArm64Preflight()` -> `verifyPinnedSudoIdentity()` -> `/usr/bin/sudo -V` throws `spawn EPERM`; no archive is produced.
- Focused reproduction: `/usr/bin/sudo -V` exits `0` outside Seatbelt with the recorded preflight digests; under the pinned profile it exits `71` with `Operation not permitted`; Node child spawn under the same profile throws `EPERM`.
- Preliminary classification: `Local Fix / implementation defect` in the actual workflow/build-entry integration, not user readiness, purge permission, provider/model, or the former 80% rule.
- Stop/reroute: fail-closed. No unsandboxed build, skipped identity verification, fallback, threshold change, or release action. Route cumulative evidence to `code_reviewer` for focused failure-origin review.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-005/`
- Prior result/confidence: `Blocked / 82%`.
- Current result/confidence: `Fail / 87%`.
- Recommended recipient: `code_reviewer` for focused failure-origin review.
- Remaining proof after reviewed correction: both package builds/reproducibility, real 49/200 inference/quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance observations, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-006 — Corrected Seatbelt entry passes; exact Python runtime materialization rejects its locked archive

- Trigger: Code Reviewer `CRR-017`; API/E2E round 6; reviewed source `fda4a3bc482c2452b6842644d62dfb062ad8339c` (`IR-014`) against `SR-010`/`SR-011` and `ARCH-REV-012`.
- Scenarios: direct `API-F-002` resolution; reusable `API-VOICE-002`/`013`; current-matrix `API-VOICE-003`, `004`, `011`, and `012`.
- Why recorded: the exact corrected workflow directly resolves `API-F-002`, but the first English archive still cannot be created. The locked Python Build Standalone archive contains nine relative symlinks; after extraction and successful use of `bin/python3`, production `prune()` calls the globally symlink-rejecting `regularFiles()` and fails `Symbolic links are forbidden.`
- Durable coverage changes: none. Authority/test reuse bytes remain unchanged. Run-specific input/archive/build evidence is temporary executable evidence.
- Execution delta: focused 15/15; full 67/67 Node and 7/7 Python plus compileall with all Go/source/schema/evidence checks; fresh actual M1 Functional Preflight 2 controlled Pass at `81.92666666666666%`; exact source-bound English/Chinese materialization Pass; exact 49/200 production corpus validation Pass; outside-Seatbelt authorization Pass; first English network-denied construction Fail.

#### Prior Failure Resolution

| Prior Failure                                                | Previous Classification                     | Current Resolution                                                                                          | Evidence                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-002` / `CR-F-022` setuid sudo spawned inside Seatbelt | Local Fix / implementation defect           | Resolved / Pass at the exact production boundary                                                            | `api-rev-006/english-darwin-arm64/create-native-build-environment.log` plus `build-primary.log`: outside authorization passes, sandbox consumer advances without `sudo` `EPERM` into MLX Python materialization |
| API-REV-004 sub-80% CPU-idle blocker                         | Historical Blocked under superseded v1 gate | Reconfirmed non-issue; current preflight is controlled but no minimum is needed for functional continuation | fresh API-REV-006 preflight Pass                                                                                                                                                                                |

#### New Failure

- ID: `API-F-003`.
- Scenario / criteria: `API-VOICE-003`; `AC-006`, `AC-017`.
- Expected: the exact authenticated Python Build Standalone archive materializes into a symlink-free hermetic English runtime, allowing the first archive to be created and verified.
- Observed: exact archive SHA-256 `62aeee6161d57303a71a138b75fd5cc6fb8c89c4b1d9c7f0a052d89fa0b6652b` contains nine relative links, including `python/bin/python3 -> python3.12`; `materializePythonRuntime()` extracts and uses it, then `prune()` -> `regularFiles()` rejects the links before output archive creation.
- Preliminary classification: `Local Fix / implementation defect` in locked Python runtime materialization, not a user permission, host readiness, provider/model, corpus, or threshold issue.
- Stop/reroute: fail-closed. No link/input mutation, alternate Python archive, unsandboxed build, fallback, threshold change, or release action. Route cumulative evidence to `code_reviewer` for focused failure-origin review.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/`
- Prior result/confidence: `Fail / 87%`.
- Current result/confidence: `Fail / 89%`.
- Recommended recipient: `code_reviewer` for focused failure-origin review.
- Remaining proof after reviewed correction: both package builds/reproducibility, real 49/200 inference/quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance evidence, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-007 — Corrected Python source passes; actual M1 is not connected to AC

- Trigger: Code Reviewer `CRR-019`; API/E2E round 7; reviewed source `24a994a51256f0eef5840ecdc977febec71ea491` (`IR-015`) against `SR-010`/`SR-011` and `ARCH-REV-012`.
- Scenarios: repository validation and reusable `API-VOICE-002`/`013`, then shared actual-host preflight for `API-VOICE-003`/`004` before `API-F-003` package recheck.
- Why recorded: exact authority and current source coverage passed, but production Functional Preflight 2 observed `acConnected=false` and stopped fail-closed. Independent `pmset` evidence says the Mac is drawing from Battery Power at 100% and discharging. No package work started.
- Durable coverage changes: none.
- Execution delta: focused 24/24 TAP; full 69 top-level / 76 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 preflight Blocked before tool/sandbox/purge/load capture.

#### Prior Failure Resolution

| Prior Failure                                          | Previous Classification           | Current Resolution                                                                                               | Evidence                                                         |
| ------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `API-F-003` / `CR-F-023` Python archive links rejected | Local Fix / implementation defect | Source-reviewed resolved, but runtime recheck not executed after environmental block                             | CRR-019 and current repository suites only; no API package claim |
| `API-F-002` / `CR-F-022` sudo inside Seatbelt          | Resolved in API-REV-006           | Not re-executed this blocked round; source remains unchanged in relevant boundary except the reviewed Python fix | current source review                                            |

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-007/`
- Prior result/confidence: `Fail / 89%`.
- Current result/confidence: `Blocked / 86%`.
- New failure IDs: none.
- Exact blocker: designated M1 reports Battery Power, `acConnected=false`.
- Recommended recipient: user request only; no teammate handoff while Blocked.
- Resume: connect the M1 Mac to AC power, keep it connected, confirm readiness, and open the next API revision with production Functional Preflight 2 before package construction.

### API-REV-008 — AC and Python normalization pass; exact package manifest violates archive path policy

- Triggering role, report path, and round: user supplied the API-REV-007 AC dependency after Code Reviewer `CRR-019`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; API/E2E round 8.
- Triggering scenarios: prior AC blocker and `API-F-003` recheck; reusable `API-VOICE-002`/`013`; current-matrix `API-VOICE-003`, `004`, `011`, and `012`.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-015`, `CRR-019`; delivery `N/A`.
- Why recorded: actual M1 Functional Preflight 2 passed on AC, exact sources/inputs/corpora passed, and the corrected Python archive advanced through normalization into final package staging. The first canonical English build then failed `API-F-004`: its generated 19,003-record manifest retained two files whose paths violate the package archive ASCII path policy, so the Go archive owner rejected the manifest and produced no archive.
- Coverage/durable test changes: none. `API-VOICE-002` and durable `API-VOICE-013` remained reusable after exact byte checks. The manifest observer was temporary execution instrumentation in the isolated checkout and was fully restored.
- Execution delta: focused 24/24 TAP; full 69 top-level / 76 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 preflight Pass on AC at loaded-host `69.83666666666667%`; exact English/Chinese inputs and 49/200 corpora Pass; trusted environment creation outside Seatbelt Pass; primary English network-denied construction Fail.

#### Prior Failure Resolution

| Prior Failure                                                                 | Previous Classification           | Current Resolution                                                                                                                       | Evidence                                                                                                     |
| ----------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| API-REV-007 designated M1 on Battery Power                                    | Environment Blocked               | Resolved / Pass                                                                                                                          | API-REV-008 preflight `status=pass`; cleanup-time `pmset` still reports AC Power                             |
| `API-F-003` / `CR-F-023` Python runtime archive links rejected before pruning | Local Fix / implementation defect | Resolved at the direct production path; normalization/pruning completed and assembly advanced to final 19,003-record manifest validation | `english-darwin-arm64/build-primary.log`; new failure occurs in Go manifest validation, not symlink handling |
| `API-F-002` / `CR-F-022` sudo spawned inside Seatbelt                         | Resolved in API-REV-006           | Remains resolved                                                                                                                         | trusted native environment created outside Seatbelt; primary sandbox build advanced without sudo `EPERM`     |

#### New Failure

- ID: `API-F-004`.
- Scenario / criteria: `API-VOICE-003`; `AC-006`, `AC-017`.
- Expected: the exact authenticated English staging tree satisfies package closure/path policy and produces the first canonical archive, enabling the second build/reproducibility verifier and full profile qualification.
- Observed: production Go validation exits `1` with `manifest paths invalid or unsorted`; no archive is created. Focused analysis proves zero ordering inversions and zero case collisions, but exactly two invalid retained paths: `scipy/io/tests/data/Transparent Busy.ani` contains a space and `torch/include/c10/util/C++17.h` contains plus signs.
- Preliminary classification: `Local Fix / implementation defect` in package assembly closure/path-policy integration. The archive policy correctly fails closed; no policy relaxation, dependency mutation, provider/model substitution, threshold change, or unsandboxed build is acceptable.
- Stop/reroute: repeat construction, package verification/reproducibility, 49/200 inference, exact 30/30/100, lifecycle/compliance, Qualification Set 2, and Branch Catalog Projection 2 were not run after the first required archive failed. Route to `code_reviewer` for focused failure-origin review.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-008/`
- Prior result/confidence: `Blocked / 86%`.
- Current result/confidence: `Fail / 93%`.
- New failure: `API-F-004`; prior `API-F-002`/`003` are resolved on the executed path.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: both complete package constructions and reproducibility, real 49/200 inference/quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance observations, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-009 — Exact package builds; public Python worker and retained terminal evidence fail

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-021`; API/E2E round 9.
- Triggering scenarios: direct `API-F-004` resolution, reusable `API-VOICE-002`/`013`, then current-matrix `API-VOICE-003`, `004`, `011`, and `012`.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-016`, `CRR-020`, `CRR-021`; delivery `N/A`.
- Why recorded: the corrected runtime closure directly resolves package construction, path validation, verification, and reproducibility. The first exact English cold trial then exposed two new production defects: the isolated contained Python worker cannot import its packaged application module (`API-F-005`), and failure evidence cannot create schema-valid Summary 2 because it forwards archive `schemaVersion` (`API-F-006`).
- Coverage/durable test changes: none. API-VOICE-002/013 authorities remained byte-identical. Run-specific package/launcher/attempt evidence is temporary executable evidence.
- Execution delta: focused 11/11; full 71 top-level / 78 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 preflight Pass at loaded-host 78.21%; exact source-bound English/Chinese inputs and 49/200 corpora Pass; two exact 616 MiB English archives, verifier, and reproducibility Pass; compliance/conditions Pass; first cold purge Pass; first launcher trial Fail before hello/model load; terminal evidence Fail.

#### Prior Failure Resolution

| Prior Failure                                                                    | Previous Classification           | Current Resolution                                 | Evidence                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-004` / `CR-F-024` retained Python dependency paths violate archive policy | Local Fix / implementation defect | Resolved / Pass at the exact full package boundary | two byte-identical archives at SHA-256 `057c011a6371e40fdfdc7bcc67fe99709ea39024ed2dcf47f97d84b84dc2b15f`; package verification/reproducibility Pass; extracted size 1,195,561,020 bytes; 6,502 archive entries |
| API-REV-008 AC/preflight/closed input/corpus readiness                           | Passed prerequisites              | Reconfirmed                                        | fresh API-REV-009 preflight Pass on AC; exact source-bound materialization and 49/200 validators Pass                                                                                                           |

#### New Failures

- `API-F-005` — `API-VOICE-003`; `AC-002`, `AC-006`, `AC-013`, `AC-017`.
  - Expected: extracted relocated public launcher starts the contained Python worker under Seatbelt, emits hello/model-preparing/inference-ready, and performs the first cold transcription.
  - Observed: the exact first attempt records `fail/process-loss` after `3,988.390125 ms`. Focused exact public-launcher execution exits `1` after `792.1125 ms`; `worker.py` exists, but Python isolated mode omits its adjacent directory and raises `ModuleNotFoundError: No module named 'autobyteus_voice_provider'` before stdout/hello.
  - Preliminary origin: bounded implementation defect in public launcher-to-private Python worker composition.
- `API-F-006` — `API-VOICE-003`; `AC-003`, `AC-007`, `AC-011`, `AC-017`, `AC-023`.
  - Expected: after process-loss, attempt/raw/sample evidence produces schema-valid fail/process-loss Summary 2 and then Performance Assessment 1 before the CLI exits nonzero.
  - Observed: ledger correctly records fail/process-loss, but Summary composition spreads build archive `schemaVersion: 1` into a strict archive object that permits only fileName/SHA/size/count. Schema validation throws, no Summary/Assessment is written, and the terminal CLI error masks the public-launcher failure.
  - Preliminary origin: bounded implementation defect in profile-evidence archive projection and terminal-failure retention.
- Stop/reroute: fail-closed. No retry, isolation bypass, provider/model/threshold substitution, Chinese execution, QSet/projection, release, tag, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/`
- Prior result/confidence: `Fail / 93%`.
- Current result/confidence: `Fail / 95%`.
- New failures: `API-F-005`, `API-F-006`; prior `API-F-004` is resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary owner is Implementation Engineer.
- Remaining proof after reviewed correction: complete English 49-WAV inference/quality/lifecycle/recovery/exact 30/30/100/resource evidence; then Chinese double package/full 200-WAV equivalent, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-010 — English fully qualifies; Chinese closed-input manifest fails its production path policy

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-023`; API/E2E round 10.
- Triggering scenarios: direct `API-F-005` / `API-F-006` resolution, reusable `API-VOICE-002` / `API-VOICE-013`, then current-matrix `API-VOICE-003`, `API-VOICE-004`, `API-VOICE-011`, and `API-VOICE-012`.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-017`, `CRR-022`, `CRR-023`; delivery `N/A`.
- Why recorded: the reviewed launcher/evidence corrections pass the exact packaged MLX boundary and complete every English functional/performance gate. The first exact Chinese construction then finds `API-F-007`: deterministic materialization emits ten exact llama.cpp UI source paths that the mandatory production input-manifest validator rejects, so no Chinese archive can be constructed.
- Coverage/durable test changes: none. `API-VOICE-002` / `API-VOICE-013` remained exact-byte reusable; run-specific package, corpus, performance, and manifest analysis are temporary executable evidence.
- Execution delta: focused launcher/evidence 4/4; full 72 top-level / 79 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 Functional Preflight 2 controlled Pass at `80.63166666666666%`; exact source-bound English/Chinese materialization and 49/200 corpus validation Pass; English double package/verifier/reproducibility Pass; complete English 160/160/49-WAV/lifecycle/resource/compliance qualification Pass; first Chinese network-denied construction Fail.

#### Prior Failure Resolution

| Prior Failure                                                                       | Previous Classification           | Current Resolution                                                                                                                                                                                                               | Evidence                                                                          |
| ----------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `API-F-005` / `CR-F-025` public launcher cannot import contained Python application | Local Fix / implementation defect | Resolved / Pass at the exact public-package boundary. The compiled relocated launcher starts the contained MLX worker/model, completes real inference, and passes 160/160 attempts plus conformance with no ambient Python path. | English Summary 2, attempt ledger, raw results, runtime conformance, Assessment 1 |
| `API-F-006` / `CR-F-026` Summary archive projection prevents terminal evidence      | Local Fix / implementation defect | Resolved / Pass. The real wider build report projects into schema-valid Summary 2 and a digest-bound Assessment 1 after complete qualification; focused production-shaped process-loss coverage also passes.                     | English Summary 2 / Assessment 1 and repository focused-launcher-evidence log     |
| `API-F-004` / `CR-F-024` retained Python paths violate archive policy               | Resolved in API-REV-009           | Reconfirmed / Pass. Two byte-identical English archives verify/reproduce at SHA-256 `08ecb07a195bbe78901ca21a4a4775d8067ac42e75049861f78f7b647626581d`.                                                                          | English package verification and reproducibility proof                            |

#### New Failure

- ID: `API-F-007`.
- Scenario / criteria: `API-VOICE-004`; `AC-006`, `AC-017`, `AC-019`.
- Expected: exact recipe materialization produces a complete Chinese `SHA256SUMS.json`-closed tree accepted by `verifyInputManifest()`, enabling two byte-identical Fun-ASR archives and full 200-WAV qualification.
- Observed: the first network-denied Chinese construction exits `1` with `Error: Invalid input manifest record.` The generated manifest SHA-256 is `45ebe9bfe4885fb3207c8c613ac76a5bbc439343ff6b93f0345082718e99515e`. Independent audit proves all 3,149 record bytes/sizes/modes and tree closure match, but ten clean exact llama.cpp UI paths contain parentheses, brackets, or plus signs outside the production `^[A-Za-z0-9._/-]+$` record-path allowlist.
- Preliminary classification: `Local Fix / implementation defect` in Chinese closed-input materialization/production-verifier integration, not a host, user permission, corpus, provider/model, threshold, resource, or performance issue.
- Stop/reroute: fail-closed. No manifest edit, policy relaxation, source-tree mutation, retry, fallback, provider/model/threshold substitution, unsandboxed build, QSet/projection, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/`
- Prior result/confidence: `Fail / 95%`.
- Current result/confidence: `Fail / 97%`.
- New failure: `API-F-007`; prior `API-F-005` / `API-F-006` are resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: exact Chinese double construction/reproducibility, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence, then Qualification Set 2 and independently verified Branch Catalog Projection 2.
