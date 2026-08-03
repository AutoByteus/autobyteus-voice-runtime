# API/E2E Revision Record

## Revision Index

| Revision ID | Triggering Role / Report / Round | Related Upstream Revision IDs | Prior Result / Confidence | Current Result / Confidence |
| --- | --- | --- | --- | --- |
| `API-REV-001` | Code Reviewer / `code-review-report.md` / `CRR-005` | `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005` | `N/A` | `Fail / 65%` |
| `API-REV-002` | Code Reviewer / `code-review-report.md` / `CRR-008` | `SR-007`, `ARCH-REV-008`, `IR-007`, `CRR-008` | `Fail / 65%` | `Blocked / 78%` |
| `API-REV-003` | Code Reviewer / `code-review-report.md` / `CRR-011` | `SR-008`, `SR-009`, `ARCH-REV-010`, `IR-010`, `CRR-011` | `Blocked / 78%` | `Fail / 79%` |
| `API-REV-004` | Code Reviewer / `code-review-report.md` / `CRR-013` | `SR-008`, `SR-009`, `ARCH-REV-010`, `IR-011`, `CRR-013` | `Fail / 79%` | `Blocked / 82%` |
| `API-REV-005` | Code Reviewer / `code-review-report.md` / `CRR-015` | `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-013`, `CRR-015` | `Blocked / 82%` | `Fail / 87%` |

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

| Prior Scenario / Failure Reference | Previous Classification | Current Resolution | Evidence |
| --- | --- | --- | --- |
| `API-VOICE-002` / API-REV-001 English final corpus repeated one operational identity | `Design Impact`; resolved upstream through `SR-007` | `Resolved / Pass` | `api-e2e-evidence/api-rev-002/repository/API-VOICE-002-corpus-identity-resolution.json`: 49/49 exact unique WAV identities, approved corpus/baseline digests, one-to-one trust, 70/969; supported reproduction and all six output comparisons pass |

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

| Prior Scenario / Failure Reference | Previous Classification | Current Resolution | Evidence |
| --- | --- | --- | --- |
| `API-REV-002` eight-target environment blocker | Blocked | Scope superseded prospectively, not retroactively: six non-arm64 rows are now Deferred / Outside Current Release Matrix; current pass requires only the two M1 packages | approved `current-platform-qualification.md` |
| `API-VOICE-002` / `API-VOICE-013` reuse authority | Passed boundary, reuse conditional on unchanged bytes | Confirmed unchanged and reusable | `api-e2e-evidence/api-rev-003/repository/API-VOICE-002-013-authority-reuse.json` |

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

| Prior Failure | Previous Classification | Current Resolution | Evidence |
| --- | --- | --- | --- |
| `API-F-001` / API-REV-003 actual healthy thermal output rejected | Local Fix / implementation defect | Resolved / Pass at the exact production boundary | `api-rev-004/environment/darwin-arm64-preflight-v1.json`: `thermalNormal=true`; CRR-013 source review |
| AC power and noninteractive purge absent | Environment prerequisites | Resolved | preflight `acConnected=true`; independent exact `/usr/bin/sudo -n /usr/sbin/purge` exit 0 |

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

| Prior Failure | Previous Classification | Current Resolution | Evidence |
| --- | --- | --- | --- |
| API-REV-004 sub-80% CPU-idle functional blocker | Environment Blocked under the superseded v1 gate | Resolved by approved Functional Preflight 2; no idle minimum blocks functionality | `api-rev-005/environment/darwin-arm64-preflight-v2.json`: Pass, `loaded-host`, `75.17166666666667%`; execution continued into inputs/build |
| `API-F-001` thermal parser | Resolved in API-REV-004 | Remains resolved | same preflight: `thermalNormal=true` |
| AC power and exact noninteractive purge capability | Previously resolved prerequisites | Reconfirmed Pass | same preflight: `acConnected=true`, `purge.nonInteractivePass=true` |

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
