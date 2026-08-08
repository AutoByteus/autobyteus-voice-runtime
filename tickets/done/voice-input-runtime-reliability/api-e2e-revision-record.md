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
| `API-REV-011` | Code Reviewer / `code-review-report.md` / `CRR-025`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-018`, `CRR-024`, `CRR-025` | `Fail / 97%`              | `Fail / 98%`                |
| `API-REV-012` | Code Reviewer / `code-review-report.md` / `CRR-027`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-019`, `CRR-026`, `CRR-027` | `Fail / 98%`              | `Fail / 98%`                |
| `API-REV-013` | Code Reviewer / `code-review-report.md` / `CRR-029`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-020`, `CRR-028`, `CRR-029` | `Fail / 98%`              | `Fail / 98%`                |
| `API-REV-014` | Code Reviewer / `code-review-report.md` / `CRR-031`            | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-021`, `CRR-030`, `CRR-031` | `Fail / 98%`              | `Fail / 99%`                |
| `API-REV-015` | Code Reviewer / `code-review-report.md` / `CRR-033`            | `SR-012`, `ARCH-REV-013`, `IR-022`, `CRR-032`, `CRR-033`           | `Fail / 99%`              | `Fail / 99%`                |
| `API-REV-016` | Code Reviewer / `code-review-report.md` / `CRR-035`            | `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-023`, `CRR-034`, `CRR-035` | `Fail / 99%`              | `Fail / 99%`                |
| `API-REV-017` | Code Reviewer / `code-review-report.md` / `CRR-037`            | `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-024`, `CRR-036`, `CRR-037` | `Fail / 99%`              | `Pass / 99%`                |
| `API-REV-018` | Code Reviewer / `code-review-report.md` / `CRR-039`            | `API-REV-017`, `DR-003`, `IR-025`, `CRR-038`, `CRR-039`            | `Pass / 99%`              | `Pass / 99%`                |
| `API-REV-019` | Code Reviewer / `code-review-report.md` / `CRR-044`            | `SR-018`, `ARCH-REV-019`, `IR-029`, `CRR-044`                      | `Pass / 99%`              | `Pass / 99%`                |
| `API-REV-020` | Code Reviewer / `code-review-report.md` / `CRR-046`            | `SR-018`, `ARCH-REV-019`, `IR-030`, `CRR-046`, `DR-006`            | `Pass / 99%`              | `Fail / 78%`                |

## Revision Entries

### API-REV-001 — Final English corpus identity blocks exact-package qualification

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-005`; API/E2E round 1.
- Triggering finding or scenario IDs: `API-VOICE-002`; `AC-007`, `AC-009`, `AC-017`.
- Related solution, architecture-review, implementation, code-review, or delivery revision IDs: `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005`; delivery `N/A`.
- Why this baseline was recorded: The mandatory investigation completed, repository checks passed, and the first direct qualification prerequisite found that the checked-in final English corpus and trusted baseline repeat one clip/audio identity even though approved final corpora must be unique. The real validator fails before inference, so the remaining package matrix stopped fail-closed.
- Coverage decisions or durable test paths changed: No repository test code changed. `release/evidence/qualification-corpora/english-v1.json` and `release/evidence/baselines/english-v1.json` are `Needs Update`. Proposed future `API-VOICE-013` should validate corrected checked-in final corpora through `validateCorpus()`.
- Scenarios added, changed, removed, or rechecked: Established `API-VOICE-001`–`API-VOICE-012`; `API-VOICE-001` passed, `API-VOICE-002` failed, and `API-VOICE-003`–`API-VOICE-012` were not run after the critical failure.
- Commands, environment, fixture, or broader-validation delta: Node 22.23.1, official complete Go 1.26.5 darwin-arm64 root, exact MacBookPro18,4 M1 Max/64 GB host, 191-file promoted-study checksum run, repository manifests, and exact preserved English/Chinese WAVs. No provider package was started.

#### Prior Failure Resolution

None.

- Canonical artifacts and sections updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json`
- Prior result and confidence: `N/A`
- Current result and confidence: `Fail / 65%`
- New or remaining failure IDs: `API-VOICE-002` remains open. Exact package scenarios `API-VOICE-003`–`API-VOICE-012` remain unexecuted, not failed.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary classification `Design Impact`, likely evidence-authority correction by `solution_designer`.
- Remaining risks, blocked evidence, or untested scope: All eight exact packages, actual MLX/faster-whisper/Fun-ASR inference, M1 30/30/100 performance/RSS/size, actual Linux/Windows behavior, notices/licenses/privacy, and release-evidence aggregation must run after `API-VOICE-002` is corrected and re-reviewed.

### API-REV-002 — Corrected English authority passes; exact package matrix lacks required environment

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-008`; API/E2E round 2.
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-002/`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tests/release/trusted-baseline.test.mjs`
- Prior result and confidence: `Fail / 65%`
- Current result and confidence: `Blocked / 78%`
- New or remaining failure IDs: None. `API-VOICE-003`–`API-VOICE-012` remain Blocked execution dependencies.
- Recommended recipient: User request. No teammate routing while Blocked.
- Remaining risks, blocked evidence, or untested scope: complete eight-package reproducibility and actual-target qualification; real MLX/faster-whisper/Fun-ASR inference/lifecycle/recovery; M1 30 cold / 30 warm-preparation / 100 warm-request latency, RSS, and size; actual Linux/Windows behavior; authoritative notice/license/offline/privacy audits; aggregate release-evidence recomputation.

### API-REV-003 — Actual M1 preflight rejects healthy no-warning output

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-011`; API/E2E round 3.
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-003/`
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-004/`
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-005/`
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/`
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-007/`
- Prior result/confidence: `Fail / 89%`.
- Current result/confidence: `Blocked / 86%`.
- New failure IDs: none.
- Exact blocker: designated M1 reports Battery Power, `acConnected=false`.
- Recommended recipient: user request only; no teammate handoff while Blocked.
- Resume: connect the M1 Mac to AC power, keep it connected, confirm readiness, and open the next API revision with production Functional Preflight 2 before package construction.

### API-REV-008 — AC and Python normalization pass; exact package manifest violates archive path policy

- Triggering role, report path, and round: user supplied the API-REV-007 AC dependency after Code Reviewer `CRR-019`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; API/E2E round 8.
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-008/`
- Prior result/confidence: `Blocked / 86%`.
- Current result/confidence: `Fail / 93%`.
- New failure: `API-F-004`; prior `API-F-002`/`003` are resolved on the executed path.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: both complete package constructions and reproducibility, real 49/200 inference/quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance observations, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-009 — Exact package builds; public Python worker and retained terminal evidence fail

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-021`; API/E2E round 9.
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/`
- Prior result/confidence: `Fail / 93%`.
- Current result/confidence: `Fail / 95%`.
- New failures: `API-F-005`, `API-F-006`; prior `API-F-004` is resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary owner is Implementation Engineer.
- Remaining proof after reviewed correction: complete English 49-WAV inference/quality/lifecycle/recovery/exact 30/30/100/resource evidence; then Chinese double package/full 200-WAV equivalent, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.

### API-REV-010 — English fully qualifies; Chinese closed-input manifest fails its production path policy

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-023`; API/E2E round 10.
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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/`
- Prior result/confidence: `Fail / 95%`.
- Current result/confidence: `Fail / 97%`.
- New failure: `API-F-007`; prior `API-F-005` / `API-F-006` are resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: exact Chinese double construction/reproducibility, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence, then Qualification Set 2 and independently verified Branch Catalog Projection 2.

### API-REV-011 — Build Input paths pass; canonicalized ranlib loses required alias semantics

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-025`; API/E2E round 11.
- Triggering scenarios: shared Build Input Path / English reuse impact, direct `API-F-007` resolution, then current-matrix `API-VOICE-004`, `API-VOICE-003`, `API-VOICE-011`, and `API-VOICE-012`.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-018`, `CRR-024`, `CRR-025`; delivery `N/A`.
- Why recorded: the shared Build Input correction directly passes both retained input trees and current-source materialization. The first exact Chinese build advances through all 3,149 records and native compilation, resolving `API-F-007`, but fails `API-F-008` when trusted-tool canonicalization supplies `libtool` as `CMAKE_RANLIB` and loses the authenticated `ranlib` alias behavior required by Apple static linking.
- Coverage/durable test changes: none. API-REV-010 English remains valid historical direct behavior evidence, but current QSet source/runner/provenance identity requires a full current-source English rerun after Chinese construction succeeds.
- Execution delta: focused Build Input Path 4/4; full 76 top-level / 83 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; both retained API-REV-010 manifests passed the new production verifier; fresh actual M1 Functional Preflight 2 Pass at loaded-host `67.71166666666667%`; exact current-source English/Chinese materialization and 49/200 corpus validation Pass; first Chinese network-denied construction advanced to 5% native link and Fail.

#### Prior Failure Resolution

| Prior Failure                                                                         | Previous Classification           | Current Resolution                                                                                                                                                                             | Evidence                                                                                    |
| ------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `API-F-007` / `CR-F-027` ten Chinese routing paths rejected by duplicated input regex | Local Fix / implementation defect | Resolved / Pass at the exact production boundary. The new verifier accepts all 3,149 exact records, including the ten routing paths, and package construction advances into C/C++ compilation. | retained-tree verifier log, current-source materialization, and Chinese `build-primary.log` |
| API-REV-010 English complete qualification                                            | Historical direct evidence        | Still valid as historical behavior evidence; not reusable as current QSet authority because Summary/runner/provenance bind `e133c4a7` rather than current reviewed source `8680c6a9`           | `API-VOICE-003-004-shared-contract-impact.json`                                             |

#### New Failure

- ID: `API-F-008`.
- Scenario / criteria: `API-VOICE-004`; `AC-006`, `AC-017`, `AC-019`.
- Expected: after exact input verification, the authenticated Apple toolchain compiles and links the Chinese worker, enabling two byte-identical archives and full profile qualification.
- Observed: at 5%, CMake links `libggml-base.a` with `CMAKE_RANLIB=/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/libtool`; canonical `libtool` rejects ranlib-style argv with `no output file specified`, so no archive is created. The exact Xcode `ranlib` alias points to identical target bytes (SHA-256 `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`) but alias invocation exits `0` while canonical target invocation exits `1`.
- Preliminary classification: `Local Fix / implementation defect` in trusted native tool identity alias preservation and resolved CMake composition, not an input, host, user permission, provider/model, corpus, threshold, resource, or performance issue.
- Stop/reroute: fail-closed. No CMake/tool override, PATH substitution, retry, unsandboxed build, provider/model/threshold substitution, QSet/projection, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/`
- Prior result/confidence: `Fail / 97%`.
- Current result/confidence: `Fail / 98%`.
- New failure: `API-F-008`; prior `API-F-007` is resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: exact Chinese double construction/reproducibility, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; then Qualification Set 2 and independently verified Branch Catalog Projection 2.

### API-REV-012 — Ranlib passes; closed native tool set omits required sed

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-027`; API/E2E round 12.
- Triggering scenarios: direct `API-F-008` recheck in `API-VOICE-004`, reusable `API-VOICE-002` / `API-VOICE-013`, then current-matrix `API-VOICE-004`, `003`, `011`, and `012` while fail-closed gates pass.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-019`, `CRR-026`, `CRR-027`; delivery `N/A`.
- Why recorded: the reviewed ranlib correction directly passes the exact package boundary and builds `libggml-base.a`. The same canonical Chinese construction then exposes `API-F-009`: the locked llama.cpp Metal step invokes bare `sed`, but the authenticated preflight/native-environment/closed trusted PATH omit `/usr/bin/sed`, so construction stops before an archive exists.
- Coverage/durable test changes: none. English-v2 authority and API-VOICE-013 bytes remain unchanged/reusable; run-specific preflight/materialization/build/failure evidence is temporary executable evidence.
- Execution delta: focused trusted-native-environment 8/8; full 77 top-level / 84 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 Functional Preflight 2 Pass at loaded-host `68.22833333333332%`; exact source-bound English/Chinese materialization and 49/200 corpus validation Pass; first Chinese network-denied construction passes ranlib then fails at 6% Metal embedding.

#### Prior Failure Resolution

| Prior Failure                                                                | Previous Classification           | Current Resolution                                       | Evidence                                                                                                                           |
| ---------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-008` / `CR-F-028` authenticated ranlib alias canonicalized to libtool | Local Fix / implementation defect | Resolved / Pass at the exact production package boundary | current trusted environment records `ranlib -> libtool`; canonical build links `libggml-base.a` and emits `Built target ggml-base` |
| `API-F-007` / `CR-F-027` Chinese input paths rejected                        | Resolved in API-REV-011           | Reconfirmed / Pass                                       | current materialization and production package verifier accept all 3,149 records and advance through native compilation            |

#### New Failure

- ID: `API-F-009`.
- Scenario / criteria: `API-VOICE-004`; `AC-006`, `AC-017`, `AC-019`.
- Expected: the exact authenticated closed native tool directory contains every build-time command consumed by the locked Chinese source, allowing construction to produce two reproducible archives.
- Observed: after ranlib passed, locked llama.cpp `ggml/src/ggml-metal/CMakeLists.txt` invoked bare `sed` at Metal embedding. Production PATH contained only `node`, `cmake`, `cc`, `c++`, `ar`, `ranlib`, `ld`, `libtool`, `make`, `sh`, and `tar`; preflight contained no `/usr/bin/sed`. `/bin/sh` reported `sed: command not found`, make exited 127, package assembly exited 1, and no archive was created.
- Host identity evidence: `/usr/bin/sed` exists as a root-owned executable at SHA-256 `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`, but API/E2E did not inject or use it outside the production owner.
- Preliminary classification: `Local Fix / implementation defect` in preflight/native-environment/tool-schema/live-verification/closed-PATH completeness, not a host, permission, input, corpus, provider/model, quality, resource, or performance failure.
- Stop/reroute: fail-closed. No PATH injection, sed override, source edit, retry, unsandboxed build, fallback, provider/model/threshold substitution, QSet/projection, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/`
- Prior result/confidence: `Fail / 98%`.
- Current result/confidence: `Fail / 98%`.
- New failure: `API-F-009`; prior `API-F-008` is directly resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: exact Chinese double construction/reproducibility/package verification, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; Qualification Set 2 and independently verified Branch Catalog Projection 2.

### API-REV-013 — Sed closure passes; canonicalized C++ driver loses required link semantics

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-029`; API/E2E round 13.
- Triggering scenarios: direct `API-F-009` recheck in `API-VOICE-004`, reusable `API-VOICE-002` / `API-VOICE-013`, then current-matrix `API-VOICE-004`, `003`, `011`, and `012` while fail-closed gates pass.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-020`, `CRR-028`, `CRR-029`; delivery `N/A`.
- Why recorded: the reviewed sed correction directly passes the exact package boundary: authenticated `/usr/bin/sed` executes both locked Metal transformations and the native dependency graph compiles. The same canonical Chinese construction then exposes `API-F-010`: generic executable canonicalization records Xcode `clang++ -> clang` only as canonical `clang`, so the final C++ executable link omits the C++ runtime and produces no archive.
- Coverage/durable test changes: none. English-v2 authority and API-VOICE-013 bytes remain unchanged/reusable; run-specific preflight/materialization/build/failure/probe evidence is temporary executable evidence.
- Execution delta: focused trusted-native/sed closure 9/9; full 78 top-level / 85 TAP Node, 7/7 Python plus compileall and all Go/source/schema/evidence checks; fresh actual M1 Functional Preflight 2 Pass at loaded-host `68.98%`; exact source-bound English/Chinese materialization and 49/200 corpus validation Pass; first Chinese network-denied construction passes sed and reaches final C++ link before Fail.

#### Prior Failure Resolution

| Prior Failure                                                                | Previous Classification           | Current Resolution                                           | Evidence                                                                                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-009` / `CR-F-029` closed trusted native tool set omitted required sed | Local Fix / implementation defect | Resolved / Pass at the canonical production package boundary | current preflight/native environment bind exact `/usr/bin/sed`; both locked Metal transformations execute; native dependency graph compiles to final worker link |
| `API-F-008` / `CR-F-027` ranlib alias canonicalized to libtool               | Resolved in API-REV-012           | Reconfirmed / Pass                                           | exact `ranlib -> libtool` invocation remains bound; static-library steps complete                                                                                |
| `API-F-007` / `CR-F-025` Chinese input paths rejected                        | Resolved in API-REV-011           | Reconfirmed / Pass                                           | current materialization and production verifier accept the exact 3,149-record input tree                                                                         |

#### New Failure

- ID: `API-F-010`.
- Scenario / criteria: `API-VOICE-004`; `AC-006`, `AC-017`, `AC-019`.
- Expected: authenticated Xcode C++ compiler identity preserves `clang++` invocation semantics through preflight, native environment, closed `c++` tool entry, explicit `CMAKE_CXX_COMPILER`, and resolved-CMake verification, allowing the final worker executable and archive to be produced.
- Observed: preflight and native environment record only canonical `/Applications/Xcode.app/.../usr/bin/clang`; CMake uses that path and final linkage exits `1` with undefined `std::__1`, `std::runtime_error`, `__cxa`, and `__gxx_personality_v0` symbols. A focused exact-SDK probe proves the root-owned `clang++ -> clang` alias and canonical target have identical SHA-256 `d5ba7be6de1bac17bfd018e1591711e69cb94d199a0ba763427c8b2d67c50697`, but alias invocation exits `0`/prints `ready` while canonical invocation exits `1` with the same missing C++ runtime class.
- Preliminary classification: `Local Fix / implementation defect` in semantically required C++ driver invocation identity preservation. Focused review should consider a strict specialized alias/target identity analogous in principle to the ranlib case, without generic symlink support or explicit `-lc++` workaround.
- Stop/reroute: fail closed. No `-lc++` injection, compiler/CMake override, PATH substitution, source edit, retry, unsandboxed build, provider/model/threshold substitution, QSet/projection, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/`
- Prior result/confidence: `Fail / 98%`.
- Current result/confidence: `Fail / 98%`.
- New failure: `API-F-010`; prior `API-F-009` is directly resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Remaining proof after reviewed correction: exact Chinese double construction/reproducibility/package verification, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; Qualification Set 2 and independently verified Branch Catalog Projection 2.

### API-REV-014 — Chinese package and runtime function pass; quality authority and RSS gates fail

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-031`; API/E2E round 14.
- Triggering scenarios: direct `API-F-010` recheck in `API-VOICE-004`, reusable `API-VOICE-002` / `API-VOICE-013`, then current-matrix `API-VOICE-004`, `003`, `011`, and `012` while fail-closed gates pass.
- Related upstream revisions: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-021`, `CRR-030`, `CRR-031`; delivery `N/A`.
- Why recorded: the corrected strict C++ identity directly passes the actual resolved CMake/link/archive boundary, producing two byte-identical verified Chinese packages. The complete packaged runtime then succeeds on all 260 attempts, including all 200 WAVs, with full lifecycle/recovery/offline/relocation/no-mutation/compliance evidence. Functional Summary 2 nevertheless fails the approved quality-non-regression and process-tree RSS gates.
- Coverage/durable test changes: none. English-v2 authority and API-VOICE-013 remain reusable after exact changed-byte validation; current-source English and aggregate evidence were not started after Chinese Fail.
- Execution delta: focused strict native identity 11/11; full 80 top-level / 87 TAP Node and 7/7 Python plus compileall and all Go/source/schema/evidence checks; actual M1 Functional Preflight 2 Pass / loaded-host; exact inputs and 49/200 corpora Pass; Chinese double construction/verification/reproducibility/compliance Pass; complete Chinese 30 cold / 30 warm-preparation / 200 warm-quality run completed.

#### Prior Failure Resolution

| Prior Failure                                                                                     | Previous Classification           | Current Resolution                           | Evidence                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `API-F-010` / `CR-F-030` Xcode `clang++ -> clang` invocation semantics lost before final C++ link | Local Fix / implementation defect | Resolved / Pass at exact production boundary | both network-denied builds complete final C++ link and produce byte-identical verified archives at SHA-256 `aa785afb...98327` |
| `API-F-009`, `API-F-008`, `API-F-007`                                                             | Resolved in prior rounds          | Reconfirmed / Pass                           | authenticated sed/ranlib and exact 3,149-record inputs complete the full native build                                         |

#### New Findings

- `API-F-011`; scenario/criteria: `API-VOICE-004`; `AC-007`, `AC-009`, `AC-017`, `AC-023`.
  - Expected: complete 200-WAV inference passes absolute CER and `<=0.5`-point non-regression against the exact promoted baseline using one canonical scoring contract.
  - Observed: current CER is `6.3468%` and passes the absolute 7% ceiling, but differs from baseline `5.2128%` by `+1.1340` points. Focused analysis shows 196/200 raw transcripts are byte-identical to promoted output; those identical transcripts gain 76 errors because the promoted baseline used NFKC + OpenCC `t2s` plus Han/ASCII-alphanumeric retention, while current qualification uses production `twp-to-cn` and a narrower punctuation-removal rule.
  - Preliminary classification: `Design Impact / evidence-authority and scoring-contract mismatch`; no threshold, baseline, scorer, transcript, provider, or model was changed.
- `API-F-012`; scenario/criteria: `API-VOICE-004`; `AC-003`, `AC-017`, `AC-023`.
  - Expected: provider process-tree RSS `<=2,684,354,560` bytes (2.5 GiB).
  - Observed: exact persistent packaged provider peaks at `3,949,543,424` bytes (3.678 GiB), `1,265,188,864` bytes above the gate, while completing `260/260` attempts with zero failure/timeout/deadline violations on the 64-GiB M1.
  - Preliminary classification: `Design Impact or runtime resource implementation issue`; the user explicitly accepts this observation and prioritizes functionality, but API/E2E cannot silently revise the approved blocking contract.

- Functional runtime facts: two byte-identical packages; package verification/reproducibility/compliance Pass; 260 started / 260 succeeded / 0 failed / 0 timed out / 0 excluded; all 200 WAVs transcribed; runtime conformance, relocation, offline, no mutation, recovery, license/privacy Pass; extracted size Pass.
- Performance classification: `loaded-host-observation`; warm-preparation p95 `10.326 s` misses the `10 s` reference, while all other p95 references pass. This performance miss is non-blocking and independent of the functional fail.
- Stop/reroute: fail closed after durable Chinese Summary/Assessment/attempt evidence. No retry, threshold change, baseline/scorer rewrite, provider/model substitution, current-source English run, QSet/projection, tag, release, or publication.
- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/`
- Prior result/confidence: `Fail / 98%`.
- Current result/confidence: `Fail / 99%`.
- Recommended recipient: `code_reviewer` for focused failure-origin review. Likely reset owner is Solution Designer unless review identifies a bounded scorer or runtime-resource implementation defect.
- Remaining proof after reviewed resolution: current-source English full package/profile qualification, then Qualification Set 2 and independently verified Branch Catalog Projection 2. Delivery-owned integrated-main/release work remains later.

### API-REV-015 — Corrected resource policy passes; controlled Chinese cold start times out

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-033`; API/E2E round 15.
- Triggering scenarios: direct `API-F-011` / `API-F-012` recheck in `API-VOICE-004`, reusable `API-VOICE-002` / `API-VOICE-013`, then current-matrix `API-VOICE-004`, `003`, `011`, and `012` while fail-closed gates pass.
- Related upstream revisions: `SR-012`, `ARCH-REV-013`, `IR-022`, `CRR-032`, `CRR-033`; delivery `N/A`.
- Why recorded: the corrected Chinese scorer/map/baseline and exact profile resource policy passed source/focused/full checks and propagated into current package evidence. Two current-source Chinese builds were byte-identical and passed verification, reproducibility, and compliance. The controlled actual-M1 full profile then failed a hard cold-start readiness deadline before the warm/quality phase.
- Coverage/durable test changes: none. English-v2 authority and `API-VOICE-013` remain reusable after exact changed-byte validation; all run-specific host/package/failure artifacts are temporary executable evidence.
- Execution delta: exact source `af008705488a029b95007e25c7c00484387d3ffe`; focused 29/29 and full 95/95 Node plus 7/7 Python and all Go/source/schema/evidence checks; controlled actual-M1 preflight at `81.03166666666668%` idle; exact 49/200 corpus validation; Chinese double construction/verification/reproducibility/compliance Pass; 22 cold attempts started before Fail.

#### Prior Failure Resolution

| Prior Failure                                        | Previous Classification            | Current Resolution                                                        | Evidence                                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-012` / Chinese global 2.5-GiB hard RSS gate   | Design Impact                      | Resolved / direct Pass                                                    | Summary applies Chinese 4-GiB hard row; `3,944,415,232 <= 4,294,967,296` B; Assessment retains 2.5-GiB optimization miss without changing the hard result |
| `API-F-011` / incomparable Chinese quality authority | Design Impact                      | Source/identity correction present; executable quality recheck incomplete | current Summary binds v2 raw/raw scorer, frozen map, and v2 baseline, but the new hard timeout stopped before the 200-WAV quality phase                   |
| `API-F-010` and earlier construction defects         | Local Fix / implementation defects | Reconfirmed / Pass                                                        | two exact network-denied builds complete and reproduce archive SHA-256 `e867796b0b362f27e3800f593ffac1201e710d3f2b87af883cd1437660ad66c0`                 |

#### New Failure

- ID: `API-F-013`.
- Scenario / criteria: `API-VOICE-004`; `AC-003`, `AC-008`, `AC-011`, `AC-017`, `AC-020`, `AC-023`.
- Expected: all 30 exact filesystem-cold public-package processes emit `inference-ready` within the hard 30,000-ms preparation deadline, with zero failure, timeout, retry, or exclusion.
- Observed: cold attempts 1–21 succeeded. The final five successful preparation times increased through `21,018`, `21,070`, `23,316`, `26,989`, and `29,460` ms. Attempt 22 emitted a valid hello in `943.551` ms but failed `READY_TIMEOUT` before `inference-ready`; its total cold-attempt wall time was `34,884.236` ms.
- Terminal evidence: the attempt ledger and Summary both finalize `fail / timeout` with `22 started / 21 succeeded / 1 failed / 1 timed out / 0 excluded`; Assessment binds the Summary as `controlled-miss`; runner exit is `1`.
- Environment: Functional Preflight 2 was controlled on the actual M1 Max/64-GiB host, AC connected, no task-owned competing process. Post-failure observation recorded no thermal/performance warning, 93% memory free, and 81.8% CPU idle.
- Preliminary classification: `Unclear` between bounded packaged-provider/runtime reliability and design-level cold-start deadline/stability behavior. Focused failure-origin review is required before selecting Implementation Engineer or Solution Designer.
- Stop/reroute: fail closed. No retry, timeout/policy/threshold relaxation, warm proxy, provider/model substitution, English run, QSet/projection, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-015/`
- Prior result/confidence: `Fail / 99%`.
- Current result/confidence: `Fail / 99%`.
- New failure: `API-F-013`; `API-F-012` is directly resolved; `API-F-011` execution recheck remains incomplete.
- Recommended recipient: `code_reviewer` for focused failure-origin review.
- Remaining proof after reviewed resolution: complete current-source Chinese profile, current-source English full package/profile qualification, Qualification Set 2, and independently verified Branch Catalog Projection 2. Delivery-owned integrated-main/release work remains later.

### API-REV-016 — Both current packages pass; stale QSet path predicate blocks branch closure

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-035`; API/E2E round 16.
- Triggering scenarios: direct `API-F-013` recheck in `API-VOICE-004`, then complete current-source `API-VOICE-004`, `API-VOICE-003`, `API-VOICE-011`, and `API-VOICE-012`.
- Related upstream revisions: `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-023`, `CRR-034`, `CRR-035`; delivery `N/A`.
- Why recorded: exact source `32829080938911f0f46390a3fd2af823e105bd32` passed focused/full checks, actual-M1 preflight, both double builds, both complete package/profile qualifications, quality, lifecycle, resource, compliance, and privacy. QSet 2 then independently failed only because its profile verifier retained an obsolete path regex that rejects ten valid authenticated Chinese Build Input Path 1 routes.
- Coverage/durable test changes: none. Run-specific inputs, packages, profile evidence, QSet failure, and focused probes are temporary executable evidence. The absence of an exact QSet regression for the approved ten paths is part of `API-F-014`.
- Execution delta: loaded-host Functional Preflight 2 at `72.71833333333333%` idle; Chinese archive reproduced at `84783c61...2cc3`, completed 260/260 with CER `342/6580` and `2,105,065,472`-byte peak RSS; English archive reproduced at `9e4d1d598...46f8`, completed 160/160 with baseline-equal WER and `1,770,749,952`-byte peak RSS; both Summary/Assessment records passed. QSet command durably wrote functional Fail and exited nonzero; projection was not produced.

#### Prior Failure Resolution

| Prior Failure                                        | Previous Classification | Current Resolution     | Evidence                                                                                                              |
| ---------------------------------------------------- | ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `API-F-013` / Chinese cold attempt 22 timeout        | Design Impact           | Resolved / direct Pass | 30/30 cold and 30/30 warm preparation; all 60 stage records valid; cold-preparation p95 `2,144.220 ms`; 260/260 total |
| `API-F-012` / Chinese RSS policy                     | Design Impact           | Reconfirmed / Pass     | `2,105,065,472 <= 4,294,967,296` bytes and the 2.5-GiB optimization target is also met                                |
| `API-F-011` / Chinese scorer comparability           | Design Impact           | Resolved / direct Pass | exact v2 scorer/map/trust; candidate `342/6580` versus baseline `343/6580` across 200 WAVs                            |
| `API-F-010` and earlier package-construction defects | Local Fix               | Reconfirmed / Pass     | both exact profiles build twice byte-identically and pass package verification/reproducibility/compliance             |

#### New Failure

- ID: `API-F-014`.
- Scenario / criteria: `API-VOICE-012`; `AC-006`, `AC-019`, `AC-021`, `AC-023`.
- Expected: QSet 2 independently revalidates both passing subjects through canonical Build Input Path 1 and retains exactly two Pass rows before Branch Projection 2.
- Observed: English independent verification passes. Chinese fails `Preserved build-input manifest invalid.` because `release/evidence/bindings.mjs:131-142` uses obsolete `/^[A-Za-z0-9._/-]+$/`; it rejects ten authenticated 3,152-file manifest paths containing approved `()`, `[]`, or `+` routing syntax.
- Terminal evidence: QSet 2 is durably `fail / loaded-host-observation`, Chinese row is `fail / qualification-verification-failed`, and the QSet command exits nonzero. Branch Projection 2 is not generated.
- Preliminary classification: `Local Fix`; the aggregate/profile verifier should reuse the canonical Build Input Path 1 owner and add exact regression coverage for these ten paths. No requirement/design/provider/model/threshold/package/runtime/protocol change is indicated.
- Stop/reroute: fail closed. No path mutation/omission, workaround, profile retry, Catalog 3, tag, release, or publication.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/`
- Prior result/confidence: `Fail / 99%`.
- Current result/confidence: `Fail / 99%`.
- New failure: `API-F-014`; `API-F-013` is directly resolved.
- Recommended recipient: `code_reviewer` for focused failure-origin review.
- Remaining proof after reviewed correction: regenerate/reverify QSet 2 against unchanged exact profile evidence if source/contract impact permits, then produce and independently verify Branch Catalog Projection 2. Delivery-owned integrated-main/release work remains later.

### API-REV-017 — Canonical QSet verifier closes the two-profile branch qualification

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-037`; API/E2E round 17.
- Triggering finding or scenario IDs: direct recheck of `API-F-014` / `CR-F-034` in `API-VOICE-012`; `AC-006`, `AC-019`, `AC-021`, `AC-023`.
- Related solution, architecture-review, implementation, and code-review revisions: `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-023`, `IR-024`, `CRR-035`, `CRR-036`, `CRR-037`; Delivery `N/A`.
- Why recorded: the reviewed aggregate verifier correction delegates the complete build-input manifest path set to canonical Build Input Path 1 without changing any product/package/profile byte. The approved aggregate-only rerun revalidated immutable API-REV-016 evidence, produced a passing Qualification Set 2, produced Branch Catalog Projection 2, and independently verified its exact bytes.
- Coverage/durable test changes: no repository-resident durable API/E2E coverage was added, updated, or removed. The upstream IR-024 two-file correction and exact regression already passed CRR-037.
- Scenarios rechecked: `API-VOICE-012` only. English `API-VOICE-003` and Chinese `API-VOICE-004` profile subjects were reused after exact checksum/scope validation and were neither rerun nor relabeled.
- Execution delta: every API-REV-016 checksum Pass; correction scope exact; focused canonical path contract 6/6 Pass; retained qualification copies and two archives exact; QSet 2 Pass; Branch Catalog Projection 2 Pass; separate projection verifier Pass.

#### Prior Failure Resolution

| Prior Failure                                                                                              | Previous Classification     | Current Resolution                             | Evidence                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-F-014` / `CR-F-034`: QSet used a stale path regex and rejected ten valid authenticated Chinese routes | Local Fix                   | **Resolved / Pass**                            | exact 3,152-record manifest passes canonical owner; QSet SHA `c5eaedef...0003` has two Pass rows; projection SHA `bcc3b1c2...eddd`; independent verifier `decision: pass` |
| `API-F-013` and earlier profile/package failures                                                           | resolved before API-REV-016 | Reconfirmed through immutable content bindings | every API-REV-016 evidence checksum Pass; unchanged Chinese 260/260 and English 160/160 subjects are bound into passing QSet/projection                                   |

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-017/`
- Prior result and confidence: `Fail / 99%`.
- Current result and confidence: **`Pass / 99%`**.
- New or remaining failure IDs: none in the approved current two-profile darwin-arm64 API/E2E scope.
- Recommended recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable`, then Delivery.
- Remaining risks/untested scope: performance remains a loaded-host observation rather than controlled certification; x64, Linux, Windows, and `auto` remain deferred; maintained-main refresh, integrated qualification, documentation sync, Catalog 3, tag, publication, and published-byte equality remain Delivery-owned. No release action occurred.

### API-REV-018 — Archived evidence paths restore the finalized-main source gate

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-039`; API/E2E round 18.
- Triggering finding/scenario: `DR-003` historical prequalification run `30881048872`; new `API-VOICE-014` post-archive source/test gate; `BEH-004`, `BEH-010`.
- Related revisions: `API-REV-017`, `DR-002`, `DR-003`, `IR-025`, `CRR-038`, `CRR-039`.
- Why recorded: Delivery correctly archived the ticket before finalized-main prequalification, exposing two durable tests that still read immutable evidence from the removed in-progress path. IR-025 changes only those two literals to the final done path. This round directly validates the corrected archived-checkout source/test lifecycle without repeating unrelated packages or release actions.
- Coverage/durable test changes by API/E2E: none. IR-025 owns the existing two-test literal correction; API/E2E added only run-specific evidence and canonical reports.
- Scenario delta: added `API-VOICE-014`; revalidated API-REV-017 and DR-003 checksum continuity; package/profile scenarios remain accepted and were not rerun after exact impact analysis.
- Execution delta: clean detached archived checkout at `b19f51f...`; correction scope exact; former ticket path absent; two fixture identities exact; focused 9/9 Pass; full 111/111 Node TAP, 7/7 Python plus all Go/source/schema/evidence checks Pass; cleanup complete.

#### Prior Failure Resolution

| Prior Failure                                                                                     | Previous Classification       | Current Resolution                                          | Evidence                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `DR-003` source/test blocker: two durable tests opened removed `tickets/in-progress/...` fixtures | Local Fix / durable test path | **Resolved / Pass locally at exact archived-checkout gate** | two literal-only correction; final archived paths; exact fixture SHA-256 values; focused 9/9 and full 111/111 Pass |
| Historical workflow run `30881048872`                                                             | Truthful Delivery Fail        | Preserved, not rewritten                                    | retained DR-003 checksum manifest Pass; no remote retry or release action in API/E2E                               |
| `API-REV-017` product/aggregate acceptance                                                        | Pass / 99%                    | Reconfirmed reusable                                        | every retained checksum Pass; no relevant product/authority byte change                                            |

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-018/`
- Prior result/confidence: `Pass / 99%`.
- Current result/confidence: **`Pass / 99%`**.
- New or remaining API/E2E failure IDs: none.
- Recommended recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable`, then Delivery.
- Remaining risks/untested scope: remote prequalification retry and release remain Delivery-owned; performance remains loaded-host observation; x64, Linux, Windows, `auto`, and desktop remain deferred. No v1.0.0 tag, release, or assets exist yet.

### API-REV-019 — Zero-profile Aggregate API Renewal authority is committed

- Triggering role/report/round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-044`; API/E2E round 19.
- Triggering scenario and criteria: `API-VOICE-015`; `R-024`, `AC-026`, `BEH-007`, `BEH-013`; remaining `CR-F-038` was source-resolved before this execution.
- Related revisions: `SR-018`, `ARCH-REV-019`, `IR-027`, `IR-028`, `IR-029`, `CRR-042`, `CRR-043`, `CRR-044`; prior accepted `API-REV-017` and `API-REV-018`.
- Reviewed source commit: `50b7e778c5c8b783f3089803b71636ea7fb2a513`.
- Reviewed test commit: `baf1e33f54446d2d1161afd38b88111e4086b76c`.
- Why recorded: current source correctly remains `aggregate-api-renewal-required`. The approved focused transition requires one immutable, committed zero-profile Aggregate API Renewal Record binding exact report subjects, unchanged Profile Closure, retained archive/profile evidence, current/prior aggregate identities, and the proposed Qualification Authority closure before a later policy/controller commit can seek `reuse-permitted`.
- Execution delta:
  - API-REV-016 and API-REV-017 checksum manifests passed completely.
  - Exact English/Chinese archives and qualification summaries matched retained size/SHA identities.
  - Current and prior Qualification Set 2, Branch Catalog Projection 2, and Projection Verification 2 were byte-identical to the accepted API-REV-017 identities.
  - Production source closure recomputed unchanged Profile Closure and changed Qualification Authority, with current decision exactly `aggregate-api-renewal-required`.
  - `npm run check:release-pipeline` passed `46/46` with no profile/runtime execution.
  - The canonical report contains one exact ordered current-subject projection; the strict Aggregate API Renewal Record was committed with that report and later passed independent real-Git schema, hash, lineage, closure, profile, and aggregate validation.
- Profile execution count: `0`.
- Durable API/E2E test coverage changes: none. No repository-resident test was added, updated, or removed by API/E2E.
- Durable non-test authority added: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/release/candidates/authority/v1.0.0-aggregate-api-renewal-v1.json`.
- Canonical API artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-019/`
- Prior result/confidence: `Pass / 99%`.
- Current result/confidence: **`Pass / 99%`**.
- New or remaining API/E2E failure IDs: none in the authorized Aggregate API Renewal scope.
- Recommended recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable` and review of the durable authority record before later policy/controller work.
- Remaining boundary: this Pass does not authorize archive recovery or candidate promotion. A separate reviewed policy/controller commit must accept the exact record commit and produce a new exact `reuse-permitted` Preliminary Source Admission. Recovery, promotion, tag, release, and publication remain unexecuted and fail closed.

### API-REV-020 — Reuse admission passes but default-branch workflow registration blocks recovery

- Triggering role/report/round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-046`; API/E2E round 20.
- Triggering scenario and criteria: `API-VOICE-016`; `R-022`, `R-023`, `R-024`; `AC-025`, `AC-026`; `BEH-007`, `BEH-013`.
- Related revisions: `SR-018`, `ARCH-REV-019`, `IR-030`, `CRR-046`, `API-REV-019`, `DR-006`.
- Reviewed source/artifact: source `2e743600ef67469f3fd1bf2c9078d53c2d053979`; artifact `ec0f726afd252448784855665a08d1de2ee0521c`; accepted record commit `448517cee89e6498c551bcc70aba65ec0bedf97e`.
- Why recorded: the required direct admission transition passes, but the first real managed-recovery operation proves the reviewed branch-only workflow cannot be dispatched because GitHub requires it in the default-branch workflow catalog. API/E2E stopped fail closed before a workflow run or archive build existed.
- Coverage decisions/durable test paths changed: none. Existing admission, recovery, candidate, and workflow boundary coverage remains valid. API/E2E added no repository-resident durable test code.
- Scenario delta:
  - `API-VOICE-016-A` Pass: exact record/policy/ancestry/closures/changed paths produce `reuse-permitted`.
  - `API-VOICE-016-B` Fail as `API-F-015`: default workflow catalog omits the reviewed recovery workflow and dispatch returns HTTP 404.
  - `API-VOICE-016-C` Not Tested: promotion correctly remained prohibited.
- Execution delta: all API-REV-019 checksums Pass; focused source closure 6/6 Pass; release pipeline 46/46 Pass; exact reviewed artifact pushed and remote-equal; recovery/promotion workflow contents readable on ticket branch; recovery dispatch exit 1 / HTTP 404; zero runs at reviewed head.

#### Prior Failure Resolution

| Prior Scenario / Failure Reference                                    | Previous Classification            | Current Resolution     | Evidence                                                                                               |
| --------------------------------------------------------------------- | ---------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| API-REV-019 pending renewed-policy transition                         | Intended later reviewed transition | Resolved / direct Pass | production admission evidence: 11/11 exact checks, both closures unchanged, decision `reuse-permitted` |
| Earlier API-REV-017 qualification and API-REV-019 aggregate authority | Pass / retained authority          | Reconfirmed exact      | API-REV-019 checksum manifest Pass; exact record/closure/archive authority remains unchanged           |

#### New Failure

- ID: `API-F-015`.
- Expected: GitHub creates one recovery workflow run at exact reviewed head `ec0f726...` and queues it for approved organization-managed Apple Silicon capacity.
- Observed: branch files exist at exact blob identities, but the default-branch Actions catalog contains only the older `Voice runtime qualified release`; `gh workflow run recover-qualified-voice-archives.yml --ref codex/voice-runtime-qualified-recovery ...` returns `HTTP 404: workflow ... not found on the default branch`. No run, build, Result, archive artifact, promotion, candidate, tag, release, or publication exists.
- Preliminary classification: `Design Impact` — reviewed API/E2E-before-Delivery ordering conflicts with GitHub's default-branch workflow registration prerequisite. No authorized API/E2E action can make the workflow dispatchable without integrating release infrastructure to main or introducing a forbidden fallback.

- Canonical artifacts updated:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-020/`
- Prior result/confidence: `Pass / 99%`.
- Current result/confidence: **`Fail / 78%`**.
- New failure ID: `API-F-015`.
- Recommended recipient: `code_reviewer` for focused failure-origin review, likely followed by `solution_designer` for release-stage ordering/design correction.
- Remaining proof after resolution: execute managed English/Chinese exact recovery, independently verify Result/raw evidence/archives, execute hosted 19-member promotion, and verify Candidate Promotion Record. Delivery pretag/tag/release/publication remains later and was not touched.
