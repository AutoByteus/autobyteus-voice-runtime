# API/E2E Revision Record

## Revision Index

| Revision ID | Triggering Role / Report / Round | Related Upstream Revision IDs | Prior Result / Confidence | Current Result / Confidence |
| --- | --- | --- | --- | --- |
| `API-REV-001` | Code Reviewer / `code-review-report.md` / `CRR-005` | `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005` | `N/A` | `Fail / 65%` |
| `API-REV-002` | Code Reviewer / `code-review-report.md` / `CRR-008` | `SR-007`, `ARCH-REV-008`, `IR-007`, `CRR-008` | `Fail / 65%` | `Blocked / 78%` |

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
