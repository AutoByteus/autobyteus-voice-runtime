# Implementation Handoff

## Upstream Artifact Package

- Requirements doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental task artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/backend-selection-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/aggregate-results.json`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/SHA256SUMS.txt`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution revision record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design review report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture review revision record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Triggering historical review/evidence retained for reconciliation:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`

## Current Implementation Summary

The runtime-only worktree now contains a clean SR-006 implementation of the language-profile provider architecture authorized by `ARCH-REV-007`. The final tree replaces the withdrawn universal Node/sherpa provider with profile-specific hermetic CPython/MLX, CPython/faster-whisper, and native Fun-ASR provider packages. Every package is built around one fixed target-native Go `voice-provider[.exe]`, one embedded strict private launcher plan, Provider Archive 1 canonical ZIP construction/extraction, Catalog 3 identity, strict session/protocol/audio contracts, persistent recognizer ownership, deterministic transcript normalization, and fail-closed evidence/release qualification.

The approved backend-selection evidence is promoted as an immutable checksummed repository bundle. Exact corpus/package/source/baseline/results/reproducibility identities are required by the qualification and release pipeline. Prequalification occurs before tag creation; publication consumes and re-verifies the exact prequalified assets. No tag, publication, maintained-main reconciliation, desktop source, shared runtime checkout, or active-installation state was changed.

- Implementation cycle: `Rework after withdrawn design / clean replacement`
- Implementation revision record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Current implementation revision ID: `IR-002`
- Related solution revision IDs: `SR-004`, `SR-005`, `SR-006` (`SR-006` current authority; `SR-003` withdrawn)
- Related architecture-review revision IDs: `ARCH-REV-004`, `ARCH-REV-005`, `ARCH-REV-006`, `ARCH-REV-007` (`ARCH-REV-007` current Pass)
- Related code-review revision IDs: `CRR-001` (withdrawn-design findings used as historical defect evidence and reconciled in the replacement)
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Triggering finding IDs: resolved `AR-F-007`–`AR-F-010`; historical `CR-F-001`–`CR-F-006` reconciled
- Implementation source commits: `ce9d4b4553947b876c8783e18a621edfcac03555`, `402525786f3f556e355e8292611720c02c634332`
- Product iteration acceptance callback: `Not Required`

## Reviewed Behavior Implementation Trace

| Behavior ID | Approved Change / Preserved Outcome                                                                  | Implemented Production Path / Key Files                                                                                                                   | Result / Notes                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BEH-001`   | Publish an independently usable runtime without changing released desktop capture/cancellation.      | Runtime-only source under this worktree; `README.md`, build/qualification/release paths.                                                                  | No `autobyteus-web`, shared runtime checkout, desktop state, or superrepo source was edited.                                                                                                                                                                                                                    |
| `BEH-002`   | Separate process binding, model preparation, and real inference readiness; reuse one recognizer.     | `launcher/`; Python `bootstrap.py`, `protocol.py`, recognizer adapters; native `main.cpp`, `funasr_engine.cpp`; `benchmark/provider-process-session.mjs`. | `hello -> model-preparing -> inference-ready` is explicit; one prepared recognizer is reused for serialized requests until shutdown/failure.                                                                                                                                                                    |
| `BEH-003`   | Bound startup, request, shutdown, termination, and clean-next-start behavior without replay.         | `benchmark/provider-process-session.mjs`, `runtime-conformance.mjs`; worker state machines; Go POSIX `execve` and Windows Job/process-group supervision.  | 2 s hello, 30 s preparation/request, and 2 s graceful + 2 s forced termination are centralized. Failures settle once, terminate boundedly, and never replay audio.                                                                                                                                              |
| `BEH-004`   | Ship immutable, offline, self-contained profile packages.                                            | `build/`, `packaging/archive/`, `packaging/launcher/`, provider locks/builders, `contracts/package/`, `THIRD_PARTY_NOTICES.json`.                         | Locked contained hosts/workers/models/contracts/notices are closed by manifests and canonical archives. Live installs/downloads, system hosts, shell launchers, external decoders, and package mutation are rejected. Independent rebuild proof is mandatory.                                                   |
| `BEH-005`   | Preserve Whisper for English, select Fun-ASR for Chinese, and omit auto unless separately qualified. | Profile locks/builders; `contracts/catalog/required-profile-matrix-v1.json`; `release/evidence/candidate-history-v1.json`; catalog/evidence builders.     | English darwin-arm64 maps to MLX; other English targets to faster-whisper; Chinese targets to Fun-ASR. Rejected candidate history is digest-bound. Auto is not buildable/advertised without a new complete qualification.                                                                                       |
| `BEH-006`   | Produce deterministic local Simplified Chinese output while preserving Latin spans and raw evidence. | Python and C++ normalizers, canonical `twp-to-cn-v1.json`, normalization fixtures, JS scoring normalization.                                              | Runtime output and symmetric CER scoring share NFKC/T2S/punctuation/spacing semantics; raw and normalized strings remain distinct and are excluded from diagnostics.                                                                                                                                            |
| `BEH-007`   | Qualify from refreshed maintained main before immutable tagging/publication.                         | `.github/workflows/release-voice-runtime.yml`, `release/evidence/{assemble,verify}.mjs`, `release/verify-published-assets.mjs`.                           | Manual `prequalify` produces exact evidence before any tag; `publish` downloads/re-verifies that run and only then creates the tag. Historical tags are untouched. Delivery still owns actual integration/release.                                                                                              |
| `BEH-008`   | Record privacy-safe lifecycle/identity/timing/resource/recovery evidence.                            | `benchmark/provider-process-session.mjs`, qualification runner, conditions/audit inputs, release evidence schema/verifier.                                | Stderr and lifecycle diagnostics are bounded/redacted to stable categories and contain no audio path or transcript. Controlled raw qualification evidence separately retains required corpus references and raw/normalized recognition text; it contains no audio bytes and is digest-bound rather than logged. |
| `BEH-009`   | Expose one strict versioned catalog/archive/launcher/session/protocol authority.                     | `contracts/catalog`, `contracts/archive`, `contracts/launcher`, `contracts/startup`, `contracts/protocol`; Go launcher; Python/C++ binding.               | Public invocation is exactly `<launcher> --session-config <absolute-config-path>`. Unknown/legacy/private override fields, target/identity mismatch, path escape, protocol 0, and illegal transitions fail closed.                                                                                              |
| `BEH-010`   | Publish a host-neutral independently executable package identity.                                    | Catalog 3 builder/schema -> Provider Archive 1 -> fixed Go launcher -> embedded private plan -> contained provider worker.                                | Callers depend only on catalog/archive/public launcher/session/protocol. Python/C++/engine/model paths remain descriptor-owned package-private facts.                                                                                                                                                           |
| `BEH-011`   | Accept the declared local audio boundary without an external media tool.                             | `contracts/audio/pcm-wav-v1.md`, WAV fixtures, Python `audio.py`, native `audio.cpp`.                                                                     | All providers consume bounded PCM16 mono 16 kHz WAV directly, classify no-speech/malformed input, and do not copy/upload/delete/log request audio.                                                                                                                                                              |
| `BEH-012`   | Add no current recognition-context behavior.                                                         | Strict session/protocol schemas and invalid context fixtures; provider engine configurations.                                                             | Context/hotword fields are rejected; no hidden vocabulary, automatic extraction, fallback, or transcript rewriting is present.                                                                                                                                                                                  |

## Key Files Or Areas

- `contracts/`: Catalog 3, Provider Archive 1, package, launcher-plan, session, Protocol 1, Audio 1, normalization, and release-evidence authorities plus valid/invalid fixtures.
- `launcher/` and `packaging/launcher/compile-launcher.mjs`: fixed native public command, root/plan/config/control checks, minimal environment, POSIX/Windows lifecycle, pinned reproducible compilation, and build provenance.
- `packaging/archive/`: sole canonical ZIP builder, strict record parser, safe bounded staged extraction, manifest closure, and platform mode verifier.
- `providers/python/`, `providers/english-mlx/`, `providers/english-faster-whisper/`: common strict Python session/protocol/audio/normalization owners and profile-specific persistent recognizers.
- `providers/chinese-funasr/`: statically built native Fun-ASR/llama.cpp worker, strict session binding, WAV/features, persistent engine, and UTF8PROC/OpenCC-based normalization.
- `build/`: locked-input validation, profile builders, descriptor/manifest/archive assembly, extraction verification, and independent rebuild proof.
- `benchmark/`: exact-package reference client, runtime conformance, corpus rights/identity validation, normalized WER/CER scoring, RSS/timing runner, and evidence conditions.
- `evidence/selection-study/` and `release/evidence/candidate-history-v1.json`: complete promoted approved selection history with 191 verified checksum records.
- `release/` and `.github/workflows/release-voice-runtime.yml`: strict eight-package matrix, raw-evidence recomputation, pre-tag proof, catalog construction, and publication-byte verification.
- Removed production areas: withdrawn `runtime/*.cjs`, old `startup/`, `protocol/`, `metadata/`, `scripts/`, Node/sherpa/SenseVoice release inputs/notices, live bootstrap, and prior loose evidence paths.

## Important Assumptions

- Downstream qualification supplies complete manifest-closed approved build-input trees, licensed corpora/baselines, and content-addressed license/offline audit records; the implementation does not manufacture acceptance evidence.
- Go `1.26.5`, Python Build Standalone `20260718` / CPython `3.12.13`, the provider locks, exact source commits, model digests, and promoted wheel-resolution evidence are the reviewed immutable inputs.
- `auto` remains omitted. Advertising it requires separately reviewed and complete English-only, Chinese-only, and sparse-switch qualification rather than reuse of explicit-profile results.
- Delivery, not implementation, owns maintained-main refresh/reconciliation, final target qualification invocation when release is authorized, tag creation, and publication.

## Known Risks

- Complete MLX, faster-whisper, and Fun-ASR packages were not assembled because the approved host/model/input trees are not present in this implementation worktree. No exact-package model-quality, latency, RSS, installed-size, or no-network claim is made locally.
- The native Fun-ASR worker compiled twice byte-identically against the exact pinned llama.cpp and UTF8PROC revisions on darwin-arm64, but inference was not run without the 1.27 GB locked model payload and licensed corpus.
- Darwin x64, Linux x64, and Windows x64 launchers cross-compiled locally, but cross-build is not actual-target process/relocation/Job/WAV execution evidence.
- Formal corpus redistribution/consent, selected host/model/notices licenses, all-target package construction, M1 Max 30-cold/100-warm trials, and published-byte identity remain fail-closed downstream gates.
- Self-hosted workflow environments, Windows reparse/control-event behavior, target-native Python wheels, and non-Apple Fun-ASR performance remain material executable risks.

## Task Design Health Assessment Implementation Check

- Reviewed change posture: `Performance`, `Bug Fix`, `Behavior Change`, `Refactor`, and `Release Hardening`
- Reviewed root-cause classification: `Boundary Or Ownership Issue`, `Missing Invariant`, `Duplicated Policy Or Coordination`, `Shared Structure Looseness`, and `Legacy Or Compatibility Pressure`
- Reviewed refactor decision (`Refactor Needed Now`/`No Refactor Needed`/`Deferred`): `Refactor Needed Now`
- Implementation matched the reviewed assessment (`Yes`/`No`): `Yes`
- If challenged, routed as `Design Impact` (`Yes`/`No`/`N/A`): `N/A — implementation began only after the reopened evidence/design rounds reached ARCH-REV-007 Pass`
- Evidence / notes: The implementation establishes provider package, catalog entry, native launcher, worker session, archive, reference-client, and evidence/release owners directly. It does not retain the withdrawn universal provider as a wrapper or alternate path.

## Legacy / Compatibility Removal Check

- Backward-compatibility mechanisms introduced: `None`
- Legacy old-behavior retained in scope: `No`
- Dead/obsolete code, obsolete files, unused helpers/tests/flags/adapters, and dormant replaced paths removed in scope: `Yes`
- Shared structures remain tight (no one-for-all base or overlapping parallel shapes introduced): `Yes`
- Canonical shared design guidance was reapplied during implementation, and file-level design weaknesses were routed upstream when needed: `Yes`
- Changed source implementation files stayed within proactive size-pressure guardrails (`>500` avoided; `>220` assessed/acted on): `Yes`
- Notes: The largest implementation source is `benchmark/run-profile-qualification.mjs` at 490 effective non-empty lines. Larger greenfield owners were reviewed against their single responsibilities; archive, evidence, launcher, provider, and scoring concerns are split into dedicated files. The withdrawn source commits remain historical Git evidence only and have no production path in the final tree.

## Persisted Data Transition Check (When Applicable)

- Approved decision (`Not Affected`/`Directly Usable — No Migration`/`Discard or Rebuild`/`Migration Required`): `Not Affected`
- Design-spec decision reference: `design-spec.md` / `Persisted Data / State Transition Decision`
- Implementation follows the approved decision without an unapproved migration or version-specific runtime fallback: `Yes`
- Direct-use evidence or discard/rebuild result, when applicable: `N/A — runtime publishes immutable artifacts and has no supported user-state reader/writer`
- Migration implementation and focused checks, only when `Migration Required`: `N/A`
- Deviation from the reviewed transition decision: `None`

## Environment Or Dependency Notes

- Local source checks used Node `22.23.1`, npm `10.9.8`, system Python `3.9.6`, pinned Go `1.26.5`, CMake `4.3.3`, Apple Clang `17.0.0`, pinned llama.cpp commit `8086439a4cea94c71a5dfb8fe4ad1546aebd640f`, and UTF8PROC commit `a1b99daa2a3393884220264c927a48ba1251a9c6`. Production Python packages remain locked to Python Build Standalone `3.12.13`; that contained host was not executed locally.
- Native local compilation used the exact already-materialized source revisions from the approved backend study. It did not download or publish anything and did not use an actual model.
- Package builders intentionally reject incomplete/extra build inputs, build-only Python tooling, mismatched distribution versions, target mismatch, path leakage, oversized packages, and non-byte-identical independent rebuilds.

## Local Implementation Checks Run

- `PATH=/tmp/autobyteus-go1.26.5-v1/go/bin:$PATH VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` — passed: 18/18 Node source/unit/contract tests, 5/5 Python tests, Python compileall, all Go package tests, and source-size/legacy-residue guard.
- `go test -race ./launcher/internal ./packaging/archive` with pinned Go — passed.
- `go vet ./...` and `gofmt -l launcher packaging` — passed/clean.
- Prettier check across authored Markdown/YAML/JS/JSON — passed; generated canonical T2S bytes and promoted third-party evidence are intentionally not reformatted.
- Go launcher cross-build with `CGO_ENABLED=0`, trimpath, disabled VCS stamping/build ID — passed for darwin-arm64, darwin-x64, linux-x64, and win32-x64.
- Full native Fun-ASR compilation with `-Wall -Wextra -Werror` against exact pinned llama.cpp/UTF8PROC — passed twice; both darwin-arm64 binaries were byte-identical with SHA-256 `9aa1c5df7bba3e0e2fb8d1860173f38b48df4e8b6d5571a2c0ad64ae0657c415`, contained no repository/build/home paths, and produced exact no-stdout startup rejection (`65`, `VOICE_PROVIDER_STARTUP_REJECTED`) for invalid private argv.
- Promoted selection evidence: `shasum -a 256 -c evidence/selection-study/SHA256SUMS.txt` — 191/191 records passed.
- `npm audit --omit=optional --audit-level=high` — 0 vulnerabilities.
- `git diff --check`/source limit/legacy production residue review — passed for authored source; immutable promoted evidence/third-party license whitespace is excluded by `.gitattributes` without changing its checksummed bytes.

These are implementation-scoped checks only. They are not API/E2E, actual-target package acceptance, model-quality, license, delivery, or release sign-off.

## Frontend Rendered-Result Check (When Applicable)

`Not Applicable` — this is a runtime/build/contract/release-tooling change and does not affect a rendered frontend or user interaction surface.

## Downstream Coverage Hints / Suggested Scenarios

- Construct and independently rebuild all eight explicit profile/target archives from approved inputs; verify byte-identical archive/build-report proof, safe extraction, manifest closure/modes, package immutability, and catalog binding.
- On every advertised target, exercise fixed public argv rejection, paths with spaces/non-ASCII, relocation, sanitized/empty parent environment, unavailable system interpreters/shell/media tools, exact private argv, stdio/signal/exit propagation, and no orphaned process.
- Exercise valid, malformed, traversal/collision/duplicate/ZIP64/data-descriptor/extra-field/mode/reparse archive inputs and prove no partially trusted destination remains.
- Run actual MLX, faster-whisper, and Fun-ASR package startup, no-speech, malformed-audio/message, request timeout, forced termination, unexpected exit, clean next start, and package before/after snapshot scenarios.
- Validate licensed corpus uniqueness, provenance, per-clip consent, redistribution approval, baseline pairing, raw/index identities, symmetric normalization, exact English WER/Chinese CER gates, and all trial/failure/timeout counts.
- Run M1 Max 30 process-cold / 100 persistent-worker trials per selected package plus actual-target smoke elsewhere; enforce latency, RSS, extracted size, zero excluded failure, notice, and offline gates without threshold changes.
- Verify `prequalify` fails if the requested tag already exists, binds refreshed maintained main/source/runner/package bytes, and creates no tag; verify authorized `publish` consumes exactly that successful artifact before tag and asset publication.

## API / E2E / Executable Coverage Investigation And Execution Still Required

Yes. The API/E2E Engineer owns the coverage investigation artifact, durable broader coverage decisions, approved-input/environment setup, every-target exact-package execution, realistic licensed-corpus qualification, and executable evidence. Any repository-resident durable coverage changes made there must return through Code Reviewer before Delivery. Delivery then owns maintained-main refresh/integration evidence, durable documentation/no-impact, and any separately authorized tag/publication.
