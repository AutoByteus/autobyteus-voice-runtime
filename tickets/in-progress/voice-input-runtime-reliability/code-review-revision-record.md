# Code Review Revision Record

The latest `code-review-report.md` remains authoritative. This record retains the concise chronological history of completed code-review results.

## Revision Index

| Revision ID | Canonical Review Report | Entry Point / Trigger | Prior Result | Current Result | Affected Finding IDs |
| --- | --- | --- | --- | --- | --- |
| `CRR-001` | `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md` | Implementation Review round 1 / `IR-001` | `N/A` | `Fail — Local Fix` | `CR-F-001`–`CR-F-006` |
| `CRR-002` | `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md` | Implementation Review round 2 / replacement `IR-002` against `SR-006` | `Fail — withdrawn-design Local Fix` | `Fail — Local Fix` | Historical `CR-F-001`–`CR-F-006`; new `CR-F-007`–`CR-F-013` |

## Revision Entries

### CRR-001 — Initial runtime-provider source review finds client and release-proof gaps

- Canonical review report updated: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Review entry point and round: `Implementation Review`, round `1`
- Triggering role, report path, and finding or scenario IDs: Implementation Engineer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; initial `IR-001`; new findings `CR-F-001`–`CR-F-006`
- Relevant solution revision IDs: `SR-001`, `SR-002`, `SR-003`
- Relevant architecture-review revision IDs: `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`
- Relevant implementation revision IDs: `IR-001`
- Relevant API/E2E revision IDs: `N/A`
- Relevant delivery revision IDs: `N/A`
- Prior authoritative result: `N/A`
- Current authoritative result: `Fail — Local Fix -> implementation_engineer`
- What changed in the review result and why: Established the initial source-review baseline. The clean provider startup/identity boundary, discriminated recognizer, file responsibilities, package construction, and legacy removal are sound. Review found six implementation-owned gaps: non-terminal/unbounded provider-client failures; release evidence not bound to verifiable benchmark/package/source identities; unenforced candidate ordering/history; incorrect Simplified-normalization scoring; unenforced corpus consent/redistribution; and post-tag ancestry/evidence gates.

#### Prior Finding Resolution

None.

- New or remaining finding IDs: `CR-F-001`, `CR-F-002`, `CR-F-003`, `CR-F-004`, `CR-F-005`, `CR-F-006`
- Material score or classification changes: Initial score `8.7/10`; `Local Fix`. API/E2E readiness is below the pass threshold.
- Recommended recipient: `implementation_engineer`
- Remaining risks or uncertainty: Licensed-corpus execution, full performance/resource runs, all-target packages, formal licenses, maintained-main integration, and publication remain downstream gates after source rework.

### CRR-002 — Replacement profile-package implementation requires bounded source corrections

- Canonical review report updated: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Review entry point and round: `Implementation Review`, round `2`
- Triggering role, report path, and finding or scenario IDs: Implementation Engineer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `IR-002`; new findings `CR-F-007`–`CR-F-013`
- Relevant solution revision IDs: `SR-004`, `SR-005`, `SR-006` (`SR-003` withdrawn)
- Relevant architecture-review revision IDs: `ARCH-REV-004`–`ARCH-REV-007`; current `ARCH-REV-007 Pass`
- Relevant implementation revision IDs: `IR-002`
- Relevant API/E2E revision IDs: `N/A`
- Relevant delivery revision IDs: `N/A`
- Prior authoritative result: `CRR-001 Fail — Local Fix`, historically against withdrawn `SR-003` / `IR-001`; not authority for the replacement source
- Current authoritative result: `Fail — Local Fix -> implementation_engineer`
- What changed in the review result and why: Independently re-reviewed the clean SR-006 replacement rather than carrying forward the withdrawn scorecard. The heterogeneous provider architecture, native launcher/archive boundary, strict schemas, bounded session lifecycle, promoted selection history, corpus-rights closure, pre-tag workflow shape, legacy removal, and local checks are materially stronger. Seven current implementation defects remain: non-streaming UTF-8 decoding, native normalization divergence, reversed maintained-main ancestry, untrusted baseline identity, self-attested materialized build inputs/toolchain, unsupported cold/warm percentile claims, and recognizer-empty/no-speech conflation.

#### Prior Finding Resolution

| Finding ID | Prior Status | Current Status | Related Revision References | Verification Evidence |
| --- | --- | --- | --- | --- |
| `CR-F-001` | Open against withdrawn `IR-001` | Obsolete with withdrawn design; defect invariant reimplemented, current UTF-8 issue tracked separately as `CR-F-007` | `SR-004`, `IR-002`, `CRR-002` | Removed `providerClient.mjs`; `ProviderProcessSession` now owns explicit state, fail-once rejection, bounded graceful/forced termination, and clean-next-start tests. |
| `CR-F-002` | Open against withdrawn evidence model | Obsolete with withdrawn design; replacement evidence model independently reviewed, current baseline/input authority gaps tracked as `CR-F-010` and `CR-F-011` | `SR-004`–`SR-006`, `IR-002`, `CRR-002` | Release evidence now carries raw package/corpus/result/source identities and recomputes gates, but the newly reviewed external baseline/materialized-input trust boundaries remain insufficient. |
| `CR-F-003` | Open against withdrawn candidate inventory | Obsolete with withdrawn design; invariant reconciled | `SR-004`, `IR-002` | `release/evidence/candidate-history-v1.json` preserves selected, rejected, and future lanes by exact digest, including Paraformer, SenseVoice, faster-whisper, whisper.cpp, Qwen3-ASR, and Fun-ASR. |
| `CR-F-004` | Open against withdrawn scoring normalizer | Obsolete with withdrawn design; JS/Python symmetric T2S scoring implemented, current native runtime parity defect tracked separately as `CR-F-008` | `SR-004`, `IR-002`, `CRR-002` | Canonical JS/Python scoring/fixtures implement symmetric T2S; C++ `han-spacing` divergence is a distinct replacement-source defect. |
| `CR-F-005` | Open against withdrawn corpus gate | Obsolete with withdrawn design; invariant reconciled | `SR-004`, `IR-002` | Strict corpus schema, redistribution approval, per-clip consent/provenance, uniqueness, and content binding now fail closed in qualification/reverification. |
| `CR-F-006` | Open against withdrawn tag-trigger workflow | Obsolete with withdrawn design; prequalify-before-tag shape implemented, current ancestry-direction defect tracked separately as `CR-F-009` | `SR-004`–`SR-006`, `IR-002`, `CRR-002` | Workflow is manual prequalify/publish and has no tag trigger; the replacement's main-reachability proof is nevertheless reversed. |

- New or remaining finding IDs: `CR-F-007`, `CR-F-008`, `CR-F-009`, `CR-F-010`, `CR-F-011`, `CR-F-012`, `CR-F-013`
- Material score or classification changes: replacement implementation score `8.6/10`; `Local Fix`; API/E2E readiness remains below the pass threshold.
- Recommended recipient: `implementation_engineer`
- Remaining risks or uncertainty: after source corrections, all eight actual packages, licensed corpus, M1 Max 30/100 performance/RSS/size, formal licenses/notices, Windows and every-target execution, maintained-main integration, pre-tag proof, and publication remain fail-closed downstream gates.
