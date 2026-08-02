# API/E2E Revision Record

## Revision Index

| Revision ID | Triggering Role / Report / Round | Related Upstream Revision IDs | Prior Result / Confidence | Current Result / Confidence |
| --- | --- | --- | --- | --- |
| `API-REV-001` | Code Reviewer / `code-review-report.md` / `CRR-005` | `SR-006`, `ARCH-REV-007`, `IR-005`, `CRR-005` | `N/A` | `Fail / 65%` |

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
