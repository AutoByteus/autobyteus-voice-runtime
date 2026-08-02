# API/E2E Coverage Investigation

## Investigation Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/backend-selection-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/aggregate-results.json`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/backend-selection/SHA256SUMS.txt`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/english-preservation-correction.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/english-preservation-v2/`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record (delivery re-entry only): `N/A`
- Relevant Delivery Revision IDs: `N/A`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-002`
- Current Investigation Round: `2`
- Trigger: `CRR-008` Pass for implementation revision `IR-007` against `SR-007` / `ARCH-REV-008`.
- Prior Investigation Reviewed: `Round 1 / API-REV-001 — Fail at API-VOICE-002, 65% confidence`
- Latest Authoritative Investigation: `Round 2 — API-VOICE-002 and API-VOICE-013 Pass; API-VOICE-003 through API-VOICE-012 Blocked by exact environment dependencies`

## Current Requirement And Design Basis

The release subject is a complete, immutable, independently executable provider package, not a source checkout, one-shot candidate CLI, mocked recognizer, Electron process, system interpreter, or cross-compiled launcher. Catalog 3 requires eight explicit profile/target packages: English uses MLX Whisper Small FP16 on `darwin-arm64` and faster-whisper Small INT8 on `darwin-x64`, `linux-x64`, and `win32-x64`; Chinese uses Fun-ASR-Nano GGUF Q8 on all four targets. `auto` is optional and must remain omitted unless independently qualified.

Each archive must be constructed from SHA-closed locked inputs, rebuilt byte-identically, safely extracted through Provider Archive 1, moved under a spaces/non-ASCII root, invoked only as `<packageLauncher> --session-config <absolute-config-path>`, and executed on its advertised target. The package must bind exact identity before `hello`, verify its complete payload and construct the real recognizer before `inference-ready`, reuse one recognizer for serialized requests, accept the exact PCM WAV contract without external media tooling, recover cleanly from lifecycle/protocol/audio/process failures, preserve privacy-safe diagnostics, remain offline/read-only, and stay within the approved size/RSS/deadline gates.

Quality evidence is fail-closed. `SR-007` replaces only the invalid duplicated final English-v1 authority with the deterministic 49-unique `english-v2` corpus/baseline; it performs no new inference and changes no provider, model, target, or threshold. The corrected baseline is 70 errors / 969 words = `7.223942208462332%` WER, so the unchanged English non-regression gate is `<=7.723942208462332%` (and remains within the unchanged absolute `<=8.0%` gate). Chinese must run all 200 corrected unique FLEURS clips, remain `<=7.0%` CER and within `0.5` absolute point of the locked `5.213%` Fun-ASR baseline, with deterministic Simplified output and no hidden failures. Corpus provenance, consent/redistribution fields, duplicate ID/path/audio-hash rejection, complete selected/unsuccessful candidate history, notices, licenses, raw results, target identity, and reproducibility proofs must remain recomputable.

On the exact MacBookPro18,4 M1 Max/64 GB reference host, both `darwin-arm64` packages require 30 filesystem-cold process trials, 30 warm-cache preparation trials, and 100 persistent-worker warm requests with zero excluded failures. Handshake p95 is `<=1 s` (hard `2 s`), cold preparation p95 `<=20 s`, warm preparation p95 `<=10 s`, warm request p95 `<=10 s` (hard `30 s`), cold start-to-result p95 `<=25 s`, loaded RSS `<=2.5 GiB`, and extracted package size `<=1.25 GiB`.

Maintained-main refresh/integration, release-commit reachability after refresh, pre-tag execution, tag/publication, and published-byte equality remain Delivery-owned. API/E2E may prove the source mechanisms and pre-integration evidence but must not tag or publish. Persisted user/desktop data is `Not Affected`; this run must not touch `~/.autobyteus`, the desktop install state, historical tags, shared checkout, or `autobyteus-web`.

## Changed Behavior Summary

| Behavior ID / Boundary | Change Type | Upstream Evidence | Coverage Consequence |
| --- | --- | --- | --- |
| `BEH-001` runtime-only release | Changed | Requirements scope; SR-006; ARCH-REV-007 | Validate only the runtime repository/package boundary; no desktop execution or mutation. |
| `BEH-002` truthful readiness and recognizer reuse | Changed | `R-002`, `R-010`; `AC-002`, `AC-003` | Real packaged recognizers, lifecycle frames, and one-process repeated requests are required; mocks are insufficient. |
| `BEH-003` bounded lifecycle/recovery | Changed | `R-004`, `R-010`; `AC-004`, `AC-005` | Execute deadline, malformed response/message/audio, write/loss, shutdown/force, no-replay, no-orphan, and clean-next-start paths. |
| `BEH-004` hermetic immutable packaging | Changed | `R-005`, `R-014`; `AC-006`, `AC-017` | Build/rebuild all eight from closed inputs; verify archive, full manifest, modes, relocation, offline/no-system-host, no write/growth. |
| `BEH-005` profile/provider selection | Changed | `R-006`; `AC-007`, `AC-009`, `AC-017` | Execute the exact MLX, faster-whisper, and Fun-ASR assets on every advertised target; no substitution/fallback. |
| `BEH-006` Chinese normalization | Added | `R-007`; `AC-008`, `AC-009` | Prove native runtime fixtures and real Chinese raw/normalized results, including Latin-span preservation and no translation. |
| `BEH-007` maintained-main release lineage | Changed | `R-008`, `R-014`; `AC-010` | Validate fail-closed evidence/reachability mechanisms only; integrated refresh/tag/publication remain Delivery-owned. |
| `BEH-008` privacy-safe diagnostics | Added | `R-009`; `AC-011` | Inspect real package failure/metrics artifacts for identities/stages/resources and absence of paths/audio/transcripts. |
| `BEH-009` strict versioned contracts | Changed | `R-011`; `AC-013` | Execute schema/session/protocol/launcher negatives and reject protocol 0, context, request language/provider/model, extra argv, and inferred extraction. |
| `BEH-010` independently executable package | Added | `R-005`, `R-011`; `AC-006`, `AC-013`, `AC-017` | Use extracted fixed launchers only; target-native launcher/private-host/process behavior must be direct evidence. |
| `BEH-011` contained audio boundary | Changed | `R-005`, `R-011`; `AC-006`, `AC-017` | Run exact valid/no-speech/malformed audio using contained code with external media tools unavailable. |
| `BEH-012` no context terms | Preserved | Approved out-of-scope decision | Keep schema/source guards; do not add a context/hotword test path that normalizes forbidden behavior. |
| v0.3 bootstrap/protocol 0 and withdrawn Node/sherpa path | Removed | Clean-cut design/removal policy; IR-002; CRR-005 | Legacy tests are deleted and must not be restored or protected by compatibility coverage. |
| English final qualification authority | Corrected | `SR-007`; `ARCH-REV-008`; `IR-006`/`IR-007`; `CRR-008` | Recheck the exact 49 retained WAVs through the real validator first; compare exact approved output digests and one-to-one baseline binding. Do not infer resolution from source tests alone. |

## Changed Surface And Boundary Classification

| Surface / Boundary | Affected? | Actual Changed Boundary | Repository Evidence Available | Material Risk Not Exercised By That Evidence | Candidate Broader Validation Mode |
| --- | --- | --- | --- | --- | --- |
| Domain / backend logic | Yes | Recognizer adapters, WAV validation, normalization, scoring, qualification gates | Node/Python/Go unit and fixture tests | Real model construction/inference, quality, RSS, size | CLI / lifecycle |
| API / transport / contract | Yes | JSON-Lines Protocol 1, session config, Catalog 3, Archive 1, descriptor/manifest | Strict schemas/fixtures and mocked session state machine | Native launcher to real worker, real stdout/stderr/exit propagation | CLI / process |
| Frontend component / state | No | No frontend is in scope | N/A | N/A | None |
| Browser integration / user journey | No | No web application is in scope | N/A | N/A | None |
| Authentication / session / permissions | No | No product auth; only package-session identity | Session identity tests | N/A as an auth surface | None |
| Desktop renderer / web-equivalent UI | No | Explicitly deferred | N/A | N/A | None |
| Desktop shell / Electron-specific integration | No | Explicitly deferred | N/A | N/A | None |
| Process / lifecycle | Yes | Native launcher, private worker, reference client, bounded teardown/recovery | Go launcher tests and mocked Node lifecycle tests | Target-native POSIX/Windows semantics and actual long-lived recognizers | Lifecycle / CLI |
| Persisted-data transition | No | Decision is `Not Affected` | Repository scope/removal guards | Accidental user/shared-state mutation | Snapshot/scope audit |
| Worker / queue / distributed coordination | Yes | One local recognizer process, serialized requests, one in flight | State-machine tests | Real model reuse, busy/duplicate/loss/orphan behavior | Worker / lifecycle |
| External integration | Yes | Locked Go/Python/native/model/corpus inputs, target hosts, license rights | Digest/lock/schema tests and selected-study bundle | Exact target roots/input availability, actual platform execution, offline/rights proof | Target-host package qualification |

## Project Execution Discovery

- Assigned task worktree / workspace: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime`
- Project type and runtime stack: Node.js 22.23.1 orchestration/qualification, Python 3.12 packaged provider plus Python 3.9 local source checks, pinned Go 1.26.5 launcher/archive, CMake/C++20 native Fun-ASR, canonical ZIP packages.
- Conflicting, missing, or unclear project instructions: No `AGENTS.md` exists in the repository. README and manifests agree that local checks are not package qualification. The workflow requires externally provisioned `VOICE_BUILD_INPUT_ROOT`, `VOICE_CORPUS_ROOT`, `VOICE_EVIDENCE_ROOT`, per-target official Go roots, target hosts, and approved audit files; it does not create them. The round-2 re-probe after `API-VOICE-002` passed found those variables unset and GitHub reports zero registered self-hosted runners.
- Required environment variables or secrets available: `Partial`. GitHub CLI auth is available, but the required `VOICE_*` build/evidence roots are not configured. No secret values are recorded.

| Instruction / Configuration Path | Authority / Purpose | Commands, Setup, Or Constraints Learned |
| --- | --- | --- |
| `README.md` | Authoritative local/package instructions | Node 22.23.1; `npm ci --ignore-scripts`; pinned complete Go root; `npm test`, `check:python`, `check:go`, `check:js`; package assembler/verifier/repro/qualification commands; no tag/publish. |
| `package.json` | Script authority | `npm run check`; `build:package`; `verify:package`; `qualify:profile`; `qualify:release`. |
| `build/locked-inputs.json` and `.mjs` | Locked host/tool identities | Go 1.26.5 four-target complete-root manifests; PBS 3.12.13; package/RSS limits; inherited Go overrides rejected. |
| `build/python-wheel-locks/*.json` and provider locks | Exact per-target provider inputs | Target wheelhouse/model/native source revisions and model digests must match exactly. |
| `benchmark/run-profile-qualification.mjs` | Exact-package qualification harness | Enforces actual `process.platform/arch`, repro proof, corpus/baseline/audits, extraction/relocation, 30/30/100 samples when requested, quality/RSS/no-mutation/recovery. |
| `benchmark/prepare-conditions.mjs` and cache procedures | Conditions authority | Requires approved license/offline audits plus power/background-load declarations; darwin-arm64 cold trials require the pinned noninteractive `sudo -n purge` procedure. |
| `.github/workflows/release-voice-runtime.yml` | Target matrix/reference execution shape | Eight self-hosted target/profile jobs; exact M1 Max 30/100 lane; separate prequalify/publish; publish is out of current scope. |
| `release/evidence/baselines/` and `qualification-corpora/` | Trusted baseline/corpus identity | External audio manifest must byte-match the repository copy; baseline digests/profile/model/corpus identity are repository-owned. |

| Component / Dependency | Working Directory | Start / Setup Command | Runtime / Resource Notes | Readiness Check | Stop / Cleanup Method |
| --- | --- | --- | --- | --- | --- |
| Repository checks | Assigned worktree | `npm ci --ignore-scripts`; `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Existing arm64 Go root is 259 MiB and locked | All Node/Python/Go checks pass without skip | Tests own temp cleanup |
| M1 Max package lane | Assigned worktree plus isolated API/E2E temp root | Assemble twice, verify, prove reproducibility, prepare conditions, qualify profile | Current host is exact MacBookPro18,4 M1 Max/64 GB, macOS 26.5.2, arm64; 295 GiB available | Verifier + real `hello`/`inference-ready` | Use repository cleanup owners; retain only evidence |
| Native input/build lane | Isolated temp input roots | Materialize SHA-closed source/model/notice input, then assembler with CMake 4.3.3 | Existing study has locked Fun-ASR and llama.cpp source/model bytes; a clean locked utf8proc tree/input manifest still must be established | Input closure/source commit checks | Clean only API/E2E-created roots |
| Linux x64 lane | Target host or isolated Linux x64 execution environment | Same workflow commands on actual target | Current Docker server is Linux arm64; emulation alone will be labeled as such and cannot substitute for the required actual x64 host without upstream acceptance | `process.platform=linux`, `arch=x64`, exact target launcher/worker | Stop/remove only API/E2E-created container/processes |
| Windows x64 lane | Actual Windows x64 host | Same workflow commands using Windows root/paths | No actual Windows runner is currently registered/visible | `process.platform=win32`, `arch=x64`; Job/reparse/PE/read-only probes | Stop only API/E2E-created jobs/processes |
| GitHub Actions self-hosted matrix | `AutoByteus/autobyteus-voice-runtime` | Prequalify workflow only if required runners/inputs are provisioned; never publish | Query currently returns no registered self-hosted runners; no reviewed-branch run exists | Eight build-and-qualify jobs complete with artifacts | Workflow-owned cleanup; retain artifacts |

| Data / Fixture / Identity Need | Existing Project Mechanism Or Creation Method | Environment / Data-Safety Notes | Cleanup / Retention |
| --- | --- | --- | --- |
| English 49-clip exact final corpus | Repository `release/evidence/qualification-corpora/english-v2.json` plus the 49 referenced preserved study WAVs under `/private/tmp/autobyteus-voice-backend-study-20260802/corpus/fleurs-controlled-v1/audio` | Stage only the exact referenced WAVs, validate manifest byte identity, all digests, 49/49 unique IDs/paths/audio hashes, and one-to-one baseline binding; do not copy audio into Git | Retain only result/index/digest evidence; clean the owned staging root |
| Chinese 200-clip exact corpus | Repository manifest plus preserved study WAVs under `/private/tmp/autobyteus-voice-backend-study-20260802/corpus/fleurs-zh-profile-v2` | Same; CC BY 4.0 provenance/consent/redistribution fields must validate | Retain only evidence; external audio remains external |
| Selected-study evidence | 192-file, ~10 MiB repository-promoted bundle, checksum index | Ticket and repository copies are byte-identical at investigation time | Durable and read-only |
| Models and candidate source | Preserved backend-study model/source trees plus provider locks | Never treat study one-shot binaries/packages as final package acceptance | Build only in isolated roots; retain digests/reports |
| Build notices/audits | `THIRD_PARTY_NOTICES.json`, `licenses/`, per-package approved audit JSON required by conditions | Approval cannot be invented by API/E2E; source inventory can be mechanically audited, legal uncertainty fails closed | Retain audit/evidence files |

## Persisted Data Transition Coverage Basis

- Approved decision: `Not Affected`
- Design-spec and implementation-handoff references: design `Persisted Data / State Transition Decision`; implementation handoff `Design And Transition Checks`.
- Representative existing-data setup and required behavior: None. This repository has no supported user-state reader/writer.
- Evidence planned: pre/post scope checks show no change to `~/.autobyteus`, desktop installation state, historical tags, shared checkout, or `autobyteus-web`; package mutation snapshots cover generated runtime state.
- Migration-specific completion/recovery scenarios: `N/A`
- Upstream ambiguity or reroute required: `No`

## Existing Durable Coverage Inventory

| Path / Scenario | Current Assertion Or Intent | Related Requirement / Acceptance Criteria / Design | Validity Decision | Evidence | Action |
| --- | --- | --- | --- | --- | --- |
| `tests/benchmark/provider-process-session.test.mjs` | Mocked happy lifecycle, malformed/timeout/write failure, single escalation, byte-split UTF-8, truncated stream | `AC-002`, `AC-004`, `AC-005`; `DS-002`, `DS-005` | Still Valid | Assertions match Protocol 1 and bounded fail-once cleanup | Retain; pair with real package conformance. |
| `tests/contracts/schemas.test.mjs` and contract fixtures | Exact valid/invalid schema shapes and unknown-field rejection | `AC-008`, `AC-013`, `AC-017`; `BEH-009`, `BEH-012` | Still Valid | Current SR-006 schemas/fixtures, including legacy/context/request override negatives | Retain. |
| `tests/contracts/launcher-build.test.mjs` | Pinned deterministic launcher build/public-argv rejection | `AC-006`, `AC-013`, `AC-017`; `DS-008` | Still Valid | Executes native local launcher build but not all platform semantics | Retain; actual packages/targets are broader evidence. |
| `tests/build/locked-inputs.test.mjs` | Four-target mapping, full Go-root binding, override/source/wheel/input rejection | `AC-006`, `AC-017`; CR-F-011/014 | Still Valid | IR-005/CRR-005 resolution coverage is exact and current | Retain and run with official root. |
| `tests/build/reproducibility.test.mjs` | Repro proof rejects non-identical archives/reports | `AC-006`, `AC-017` | Still Valid | Current proof contract | Retain; execute real double builds. |
| `tests/build/file-utils.test.mjs` | Removes verified read-only trees | Lifecycle/cleanup | Still Valid | Supports safe owned cleanup | Retain. |
| `tests/providers/audio_and_normalization_test.py` | Exact WAV/no-speech negatives and Python normalization fixtures | `AC-006`, `AC-008`, `AC-017` | Still Valid | Current Audio 1/normalization authority | Retain; real packages supplement. |
| `tests/providers/session_binding_test.py` | Pre-hello exact binding/full manifest/unknown nested field/scratch cleanup | `AC-002`, `AC-006`, `AC-013` | Still Valid | Matches current Python worker boundary | Retain. |
| `tests/providers/protocol_outcome_test.py` | Empty recognizer result is terminal; only validator no-speech emits no-speech | `AC-005`, `AC-009`, `AC-017` | Still Valid | Prevents hidden empty-output success | Retain. |
| `tests/scoring/normalization.test.mjs` | Golden cross-host normalization and symmetric Chinese scoring | `AC-008`, `AC-009` | Still Valid | Matches approved corrected scorer | Retain; native real result remains required. |
| `tests/release/performance-evidence.test.mjs` | 30 cold resets/30 warm preparation/100 warm request raw evidence is required | `AC-003`, `AC-007`, `AC-017` | Still Valid | Exact current sample contract | Retain; populate with real M1 evidence. |
| `tests/release/qualification-gates.test.mjs` | Rejects declarative pass, preserves failed candidate history, pre-tag-before-tag ordering | `AC-007`, `AC-010`, `AC-017` | Still Valid | Current evidence/release design | Retain. |
| `tests/release/trusted-baseline.test.mjs` | Wrong digest/provider/model/config/sample set fails; English-v2 trust/authority replacement, 49-identity corpus/baseline alignment, real corpus-validator uniqueness, immutable-source drift, and all-six reproduction drift reject | `AC-007`, `AC-009`, `AC-017`; `SR-007` | Still Valid — updated | `API-VOICE-013` now drives a deterministic English-v2-shaped 49-file fixture through production `validateCorpus()` and rejects duplicate ID, path, and audio-hash identities. The focused file passes 6/6 and the full repository check passes 39/39 Node plus 7/7 Python and all Go/source/evidence checks. Exact licensed WAV proof remains the separate passing `API-VOICE-002` evidence. | Retain; route the durable test diff for proportional review after the completed API/E2E result. |
| `tests/release/main-reachability.test.mjs` | Descendant direction is rejected; equality/integrated reachability accepted | `AC-010` | Still Valid | Mechanism is current; integrated branch proof remains Delivery-owned | Retain; do not claim final integration. |
| `benchmark/run-profile-qualification.mjs` + conformance/scoring/cache helpers | Existing durable full-package lifecycle/quality/performance/relocation/offline/no-mutation/recovery harness | `AC-002`–`AC-009`, `AC-011`, `AC-013`, `AC-017` | Still Valid | Reads only public package contract and emits raw evidence | Execute unchanged on all exact packages/targets. |
| `.github/workflows/release-voice-runtime.yml` prequalify matrix | Eight target/profile jobs and aggregate evidence before tag | `AC-006`–`AC-010`, `AC-017` | Still Valid | Matches matrix and separation of prequalify/publish | Use only prequalify if environment becomes available; publish remains out of scope. |
| `release/evidence/qualification-corpora/english-v2.json` and `release/evidence/baselines/english-v2.json` | Sole final English qualification corpus and promoted comparison baseline | `AC-007`, `AC-009`, `AC-017`; `SR-007` | Still Valid | `API-VOICE-002` passed against the exact 49 referenced WAVs: corpus/baseline approved digests match, 49/49 IDs/paths/audio hashes are unique, all WAV digests match, the baseline is one-to-one and trusted, totals are 70/969, six solution/runtime outputs are byte-identical, and supported reproduction/checksum checks pass. | Retain; continue with API-VOICE-013 and package matrix. |
| Deleted v0.3 `tests/test_voice_input_worker.py`, build/manifest tests | Asserted system Python/bootstrap/protocol 0/schema 2 | Clean-cut removal | Stale / Remove | Removed in IR-002; current artifacts reject these paths | Keep removed; no replacement solely for legacy compatibility. |

## Stale Or Obsolete Coverage Decisions

| Path / Scenario | Obsolete Assertion | Why It Is Obsolete | Upstream Evidence | Replacement Coverage | No-Replacement Rationale |
| --- | --- | --- | --- | --- | --- |
| Deleted `tests/test_voice_input_worker.py` | Runtime may choose backend/language and lazily load through system Python | Protocol 0/bootstrap path is explicitly removed | SR-006 clean-cut policy; `BEH-002`, `BEH-004`, `BEH-005`, `BEH-009` | Current schemas, package/session tests, and exact-package qualification | No legacy wrapper is allowed. |
| Deleted `tests/build-runtime.test.mjs` / `tests/generate-manifest.test.mjs` | Lightweight archive/schema-2 metadata is the release subject | Archive did not contain a self-executable provider | `AC-006`, `AC-013`, `AC-017`; Provider Archive 1 | Canonical archive Go tests, package verifier, real qualification | Obsolete build product must remain absent. |

## Durable Coverage To Add

| Scenario ID | Behavior / Boundary | Requirement / Acceptance Criteria / Design Evidence | Planned Artifact / Path | Why Durable Coverage Is Needed |
| --- | --- | --- | --- | --- |
| `API-VOICE-013` | Repository-owned final qualification corpus structure must reach the production `validateCorpus()` filesystem/audio boundary; promoted corpus/baseline identities remain unique and mutually aligned before inference | `AC-007`, `AC-009`, `AC-017`; benchmark Corpus Contract; SR-007 implementation disposition item 7 | Updated `tests/release/trusted-baseline.test.mjs` with a deterministic temporary audio fixture derived from the checked-in English-v2 manifest, using the production validator; retained the existing exact checked-in corpus/baseline one-to-one assertions | Completed. The fixture proves the production filesystem/audio validator and all three duplicate identity rejections without checking large licensed WAVs into Git; passing `API-VOICE-002` separately proves the exact 49 licensed WAV bytes. |

## Durable Coverage To Update

Completed: `tests/release/trusted-baseline.test.mjs` under `API-VOICE-013`, added only after the mandatory round-2 `API-VOICE-002` prerequisite passed.

## Durable Coverage To Remove

None. Previously stale v0.3 coverage is already removed and remains intentionally absent.

## Repository Coverage Execution Plan And Results

| Order | Command | Working Directory / Configuration | Boundary Or Scenario Proven | Result | Evidence / Output Path |
| --- | --- | --- | --- | --- | --- |
| 0 | Pre-execution artifact/digest/test inventory | Assigned worktree plus reviewed SR-007 package | Establish current authority and test-validity decisions before execution | Pass | This investigation round; v2 corpus/baseline/authority digests match reviewed values |
| 1 | Stage the exact 49 WAVs referenced by `english-v2.json`; run production `validateCorpus()`, `loadTrustedBaseline()`, one-to-one alignment, source/output checksum and supported reproduction checks | Owned isolated root `/private/tmp/autobyteus-voice-api-e2e-r2-20260802`; reviewed worktree; preserved study audio | Mandatory `API-VOICE-002` recheck | Pass | `api-e2e-evidence/api-rev-002/repository/API-VOICE-002-corpus-identity-resolution.json`; exact 49 WAVs; 49/49 unique identities; 70/969; approved digests; six outputs byte-identical; checksum/reproduction logs |
| 2 | `npm ci --ignore-scripts`; focused API-VOICE-013; `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Assigned worktree; Node 22.23.1; exact official darwin-arm64 Go root | Current source/unit/contract baseline and durable real-validator regression | Pass | `api-e2e-evidence/api-rev-002/repository/npm-ci.log`; focused 6/6; full 39/39 Node, 7/7 Python, all Go/source/evidence checks |
| 3 | Supported environment/input/target readiness probe, official Go-root verification, GitHub runner query, and pinned cold-procedure probe | Assigned worktree; local M1 Max; GitHub repository; preserved study assets | Determine whether exact package construction/qualification can start without substitution or invented approvals | Blocked | `api-e2e-evidence/api-rev-002/environment/API-VOICE-003-012-readiness.json`: no `VOICE_*` roots, no complete eight-target closed input trees or approved audits, zero self-hosted runners, only local darwin-arm64 target, Linux Docker is arm64, no Windows target, and `sudo -n purge` unavailable; both existing Darwin Go roots authenticate exactly |
| 4 | Exact package assembler/verifier/double-build and `run-profile-qualification.mjs` | Exact inputs/hosts/conditions required by README and workflow | `API-VOICE-003`–`API-VOICE-010` | Blocked before construction | Required inputs/hosts/audits/cold procedure are unavailable; partial preserved study assets cannot be substituted for a `SHA256SUMS.json`-closed approved release input |
| 5 | Notice/license/privacy audit, release evidence/catalog assembly and strict verifier without tag/publication | Complete qualified matrix and approved per-package audits | `API-VOICE-011`–`API-VOICE-012` completeness, recomputation, reproducibility integrity | Blocked | No approved license/offline audit files and no eight-package qualification matrix exist; no release action attempted |

## Post-Repository Confidence Scorecard (Mandatory)

| Confidence Category | Score | What Supports The Score | Remaining Uncertainty | Additional Validation That Could Improve It |
| --- | --- | --- | --- | --- |
| Requirement and acceptance-criteria proof | 75% | Prior English failure is directly resolved; current source/unit/contract checks pass | All package/target/resource/license/release gates remain unexecuted | Full package matrix |
| Changed-boundary execution directness | 75% | Exact 49-WAV production corpus validation and supported authority reproduction passed | No exact final package/private recognizer has executed | Exact packages |
| Cross-boundary integration realism and mock gap | 75% | Real corpus files, trust owner, Go build, and repository boundaries executed | Launcher/private host/model/target integration remains unrun | All eight target packages |
| Environment, configuration, identity, and fixture fidelity | 75% | Exact M1 Max, Node, official Go root, reviewed bytes, and retained English audio used | Build-input closure and actual non-arm64 targets still require re-probe/execution | Exact staging/build/target execution |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | Full durable lifecycle/failure suites pass | Real package process tree/conformance remains unrun | Actual package conformance |
| User-surface, browser, and desktop-shell confidence | N/A | Runtime-only ticket; no UI/desktop scope | None for this ticket | None |
| Durable regression coverage quality and relevance | 95% | `API-VOICE-013` now invokes the production validator and rejects all three duplicate identity dimensions; exact corpus/baseline and six-output authority assertions also pass | Run-specific exact package evidence cannot reasonably be durable | Preserve and route proportional test review |

- Overall post-repository confidence: `78%`; prior authoritative confidence remains `65% Fail`, not current acceptance.
- Calculation method: Simple average of applicable numeric categories after execution; browser/desktop is `N/A` because explicitly out of scope.
- Every critical acceptance criterion directly proven: `No`
- Any applicable category below `90%`: `Yes` — all non-durable categories remain 75% until exact-package execution.
- Default clean-confidence target of `95%` met: `No`
- Material residual risks: The prior `API-VOICE-002` failure is directly resolved. All eight package builds/target runs, quality/non-regression, M1 performance, actual Linux/Windows behavior, notices/licenses, and release evidence remain blocked until the exact dependencies are provisioned.

## Broader Validation Decision (Mandatory)

- Decision: `Blocked` after the required CLI/lifecycle/actual-target mode was selected and safely preflighted.
- Selected execution mode: `CLI`, `Lifecycle`, `Worker`, and actual target-host package qualification.
- Specific confidence gap or residual risk addressed: repository tests do not execute final private hosts/models, target-native launcher/process semantics, actual corpora, M1 sample counts/resources, package mutation/offline/relocation, target platform behavior, or release evidence.
- Why the selected mode can materially improve confidence: it invokes the actual public release subject and is the only approved evidence surface for critical `AC-003`, `AC-006`, `AC-009`, and `AC-017` gates.
- Expected confidence after the selected validation: `>=95%` only if every critical package/target/quality/resource/license/evidence gate directly passes and no category is below `90%`.
- Browser-specific decision and rationale: `Not applicable`; no web/desktop behavior exists in scope.
- Execution outcome superseding the broader plan: `Blocked`. Round 1's `Fail` is resolved historical evidence, but the required exact package matrix cannot start from partial study assets or fabricated approvals. Resume when the exact dependency package below is provisioned.

## Desktop Application Validation Decision

- Desktop framework / shell: `N/A`
- Relevant README or development instructions: runtime README explicitly defers desktop integration.
- Web-equivalent behavior: None.
- Shell-specific or lifecycle behavior: Native package launcher/process lifecycle only; this is CLI/runtime, not Electron.
- Chosen validation approach: actual package CLI and process instrumentation.
- Effect on any already-running desktop application: `None`; desktop and `~/.autobyteus` are not touched.
- Behavior not directly proven and confidence consequence: Desktop consumption is out of scope and does not reduce current-ticket confidence.

## Live Environment And Fixture Plan

- Startup order and commands: verify toolchains/inputs -> assemble exact archive twice -> package verifier -> reproducibility verifier -> validate corpus/baseline/audits/conditions -> extract/relocate -> start fixed launcher -> real lifecycle/inference/recovery -> aggregate evidence.
- Environment choices: exact Node 22.23.1, official complete Go 1.26.5 root for each target, repository-locked CMake/native/Python/model inputs, sanitized parent environment/PATH, network-disabled qualification, M1 Max power/background-load declaration, pinned cold-cache procedure.
- Health/readiness checks: package verifier success, `hello`, `model-preparing`, then `inference-ready` after real recognizer creation.
- Seed data / fixtures: repository-pinned 49-unique English-v2 and 200-unique Chinese FLEURS manifests/audio plus Audio 1 no-speech/malformed fixtures.
- Test identities/session state: fresh UUID/session config per process, exact build-report identities, no product auth.
- Requirement-linked journeys: scenario matrix below.
- Evidence to capture: commands/exit status, build reports/input manifests/archive hashes/repro proofs, raw protocol/results, conformance, performance/RSS, corpus/quality/paired uncertainty, snapshots, audits, target/OS/hardware, aggregate catalog/release verification.
- Owned resources to clean up: only API/E2E-created build/extract/session/container roots and processes; retained evidence remains under the ticket evidence directory.

## Temporary Executable Validation Plan

| Scenario ID | Probe / Harness / Runtime Setup | Behavior Proven | Why This Should Not Remain As Durable Coverage |
| --- | --- | --- | --- |
| `API-VOICE-001` | Existing `npm run check` with official Go root | Reviewed source/unit/contract baseline | Existing durable tests already own it. |
| `API-VOICE-002` | Checksum/JSON/corpus/rights validators | Promoted study/corpus integrity | Evidence execution, not new runtime behavior. |
| `API-VOICE-003` | English `darwin-arm64` exact double build + 30/30/100 qualification | MLX package quality/performance/lifecycle/offline/relocation | Generated qualification evidence is run-specific and large. |
| `API-VOICE-004` | Chinese `darwin-arm64` exact double build + 30/30/100 + 200-clip qualification | Fun-ASR quality/performance/native normalization/lifecycle | Same. |
| `API-VOICE-005` | English `darwin-x64` exact package/actual-target qualification | faster-whisper x64 package and target behavior | Same. |
| `API-VOICE-006` | Chinese `darwin-x64` exact package/actual-target qualification | Fun-ASR x64 package and target behavior | Same. |
| `API-VOICE-007` | English `linux-x64` exact package/actual-target qualification | faster-whisper Linux package and target behavior | Same. |
| `API-VOICE-008` | Chinese `linux-x64` exact package/actual-target qualification | Fun-ASR Linux package and target behavior | Same. |
| `API-VOICE-009` | English `win32-x64` exact package/actual-target qualification | faster-whisper Windows package/launcher/job/mode behavior | Same. |
| `API-VOICE-010` | Chinese `win32-x64` exact package/actual-target qualification | Fun-ASR Windows package/launcher/job/mode behavior | Same. |
| `API-VOICE-011` | Notice/license/corpus provenance and privacy audit over exact packages/evidence | `AC-007`, `AC-008`, `AC-011`, `AC-017` | Audit evidence is release-instance specific. |
| `API-VOICE-012` | Catalog/evidence assembly and strict verification without release action | Eight-package completeness/reproducibility/recomputation integrity | Existing durable release verifier owns logic; this is exact-byte evidence. |

## Not Tested / Infeasible / Deferred

| Behavior / Boundary | Reason | Risk | Required Follow-Up Or Escalation |
| --- | --- | --- | --- |
| Optional `auto` | Not advertised and no independent qualification exists | None for required release matrix | Keep omitted; future separately approved work. |
| Maintained-main refresh/integration, pre-tag/tag/publication/published-byte equality | Delivery-owned by explicit handoff | Release cannot be finalized from API/E2E evidence alone | Delivery after review-passed API/E2E. |
| Desktop microphone/UI/install/supervision | Explicitly out of scope | None for runtime ticket | Separate future ticket. |
| `API-VOICE-003`–`API-VOICE-010` exact package/target lanes | The corrected English prerequisite passed, but complete SHA-closed per-target inputs, approved audits, actual darwin-x64/linux-x64/win32-x64 hosts, and M1 noninteractive purge are unavailable; GitHub reports zero self-hosted runners | Critical `AC-003`, `AC-006`, `AC-009`, and `AC-017` package/target proof remains missing | Provision the documented `VOICE_BUILD_INPUT_ROOT`, `VOICE_CORPUS_ROOT`, `VOICE_EVIDENCE_ROOT`, exact target runners/Go roots, and M1 `sudo -n purge`; then open the next API/E2E revision at API-VOICE-003 without rerunning resolved API-VOICE-002 unless bytes change. |
| `API-VOICE-011`–`API-VOICE-012` audit/aggregate proof | No approved per-package license audits or per-target offline audits exist, and no complete qualification matrix can be aggregated | Notice/license/privacy and recomputable release-evidence acceptance remain unproven | Supply authoritative audit files bound to exact notice inventories; never self-approve or invent them. |

## Ambiguities Or Reroute Triggers

| Issue | Classification | Evidence | Recommended Recipient |
| --- | --- | --- | --- |
| A required exact package cannot build/run or misses quality/resource/size/license gates | Design Impact unless code reviewer determines a bounded implementation defect | Requirements explicitly forbid fallback/provider substitution/threshold relaxation | `code_reviewer` for failure-origin review, then likely `solution_designer` |
| Qualification harness or repository fixture fails despite approved behavior | Local Fix candidate | Exact failing command/diff will identify owner | `code_reviewer` for origin decision |
| Required host/input/audit remains unavailable after safe setup | Blocked execution dependency, not a product Pass/Fail | Environment attempt log | User request; no teammate routing while Blocked |
| `API-VOICE-002` exact 49-WAV recheck still fails | Failure-origin review required; do not ad hoc edit evidence | `SR-007` fixes exact output authority and `CRR-008` passes source; a direct mismatch would contradict the reviewed basis or expose a bounded implementation/evidence defect | `code_reviewer` for focused failure-origin review |

## Investigation Decision

- Proceed To API/E2E Execution: `No further execution until exact dependencies are provisioned; API-VOICE-002 and API-VOICE-013 passed`
- Repository-Resident Durable Coverage Will Be Added / Updated / Removed: `Yes — API-VOICE-013 updated tests/release/trusted-baseline.test.mjs and passes`
- Post-repository confidence: `78%`; prior result `65% Fail`
- Broader validation decision: `Blocked`
- Reroute Required Before Validation Execution: `No`
- Recommended Recipient If Reroute Required: `N/A at investigation time`
- Notes: Preserve `API-REV-001` as failed history. `API-VOICE-002` now directly passes and API-VOICE-013 closes the durable validator gap. The exact package matrix remains Blocked, not failed or passed. Ask the user to provision the documented closed inputs, approved audits, target runners, and M1 purge access, or explicitly revise the acceptance scope upstream; do not relax thresholds, substitute providers, add fallback, tag, or publish.
