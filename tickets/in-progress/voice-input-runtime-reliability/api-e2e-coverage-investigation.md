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
- API/E2E Revision Record (created after the first completed result): `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md` (not yet created)
- Current API/E2E Revision ID: `N/A`
- Current Investigation Round: `1`
- Trigger: `CRR-005` Pass for implementation revision `IR-005` against `SR-006` / `ARCH-REV-007`.
- Prior Investigation Reviewed: `None`
- Latest Authoritative Investigation: `Round 1 — post-repository Fail at API-VOICE-002`

## Current Requirement And Design Basis

The release subject is a complete, immutable, independently executable provider package, not a source checkout, one-shot candidate CLI, mocked recognizer, Electron process, system interpreter, or cross-compiled launcher. Catalog 3 requires eight explicit profile/target packages: English uses MLX Whisper Small FP16 on `darwin-arm64` and faster-whisper Small INT8 on `darwin-x64`, `linux-x64`, and `win32-x64`; Chinese uses Fun-ASR-Nano GGUF Q8 on all four targets. `auto` is optional and must remain omitted unless independently qualified.

Each archive must be constructed from SHA-closed locked inputs, rebuilt byte-identically, safely extracted through Provider Archive 1, moved under a spaces/non-ASCII root, invoked only as `<packageLauncher> --session-config <absolute-config-path>`, and executed on its advertised target. The package must bind exact identity before `hello`, verify its complete payload and construct the real recognizer before `inference-ready`, reuse one recognizer for serialized requests, accept the exact PCM WAV contract without external media tooling, recover cleanly from lifecycle/protocol/audio/process failures, preserve privacy-safe diagnostics, remain offline/read-only, and stay within the approved size/RSS/deadline gates.

Quality evidence is fail-closed. English WER must be `<=8.0%` and no more than `0.5` absolute point worse than its locked profile baseline on identical unique audio. Chinese must run all 200 corrected unique FLEURS clips, remain `<=7.0%` CER and within `0.5` absolute point of the locked `5.213%` Fun-ASR baseline, with deterministic Simplified output and no hidden failures. Corpus provenance, consent/redistribution fields, duplicate ID/path/audio-hash rejection, complete selected/unsuccessful candidate history, notices, licenses, raw results, target identity, and reproducibility proofs must remain recomputable.

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
- Conflicting, missing, or unclear project instructions: No `AGENTS.md` exists in the repository. README and manifests agree that local checks are not package qualification. The workflow requires externally provisioned `VOICE_BUILD_INPUT_ROOT`, `VOICE_CORPUS_ROOT`, `VOICE_EVIDENCE_ROOT`, per-target official Go roots, target hosts, and approved audit files; it does not create them. At investigation time those variables are unset, no release workflow has run for the reviewed branch, and the repository-visible GitHub runner query returned no registered self-hosted runners.
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
| English 50-clip exact corpus | Repository manifest plus preserved study WAVs under `/private/tmp/autobyteus-voice-backend-study-20260802/corpus/fleurs-controlled-v1` | Validate manifest byte identity, hashes, unique IDs/paths/audio; do not copy audio into Git | Retain only result/index/digest evidence |
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
| `tests/release/trusted-baseline.test.mjs` | Wrong digest/provider/model/config/sample set fails | `AC-007`, `AC-009` | Still Valid | Current promoted baselines | Retain. |
| `tests/release/main-reachability.test.mjs` | Descendant direction is rejected; equality/integrated reachability accepted | `AC-010` | Still Valid | Mechanism is current; integrated branch proof remains Delivery-owned | Retain; do not claim final integration. |
| `benchmark/run-profile-qualification.mjs` + conformance/scoring/cache helpers | Existing durable full-package lifecycle/quality/performance/relocation/offline/no-mutation/recovery harness | `AC-002`–`AC-009`, `AC-011`, `AC-013`, `AC-017` | Still Valid | Reads only public package contract and emits raw evidence | Execute unchanged on all exact packages/targets. |
| `.github/workflows/release-voice-runtime.yml` prequalify matrix | Eight target/profile jobs and aggregate evidence before tag | `AC-006`–`AC-010`, `AC-017` | Still Valid | Matches matrix and separation of prequalify/publish | Use only prequalify if environment becomes available; publish remains out of scope. |
| `release/evidence/qualification-corpora/english-v1.json` and `release/evidence/baselines/english-v1.json` | Final English qualification corpus and promoted comparison baseline | `AC-007`, `AC-009`, `AC-017` | Needs Update | Direct `validateCorpus()` execution found 50 rows but only 49 unique IDs, paths, and audio hashes; the baseline repeats the same identity | Route for an evidence-authorized unique English corpus/baseline correction. Do not drop/replace a row ad hoc. |
| Deleted v0.3 `tests/test_voice_input_worker.py`, build/manifest tests | Asserted system Python/bootstrap/protocol 0/schema 2 | Clean-cut removal | Stale / Remove | Removed in IR-002; current artifacts reject these paths | Keep removed; no replacement solely for legacy compatibility. |

## Stale Or Obsolete Coverage Decisions

| Path / Scenario | Obsolete Assertion | Why It Is Obsolete | Upstream Evidence | Replacement Coverage | No-Replacement Rationale |
| --- | --- | --- | --- | --- | --- |
| Deleted `tests/test_voice_input_worker.py` | Runtime may choose backend/language and lazily load through system Python | Protocol 0/bootstrap path is explicitly removed | SR-006 clean-cut policy; `BEH-002`, `BEH-004`, `BEH-005`, `BEH-009` | Current schemas, package/session tests, and exact-package qualification | No legacy wrapper is allowed. |
| Deleted `tests/build-runtime.test.mjs` / `tests/generate-manifest.test.mjs` | Lightweight archive/schema-2 metadata is the release subject | Archive did not contain a self-executable provider | `AC-006`, `AC-013`, `AC-017`; Provider Archive 1 | Canonical archive Go tests, package verifier, real qualification | Obsolete build product must remain absent. |

## Durable Coverage To Add

| Scenario ID | Behavior / Boundary | Requirement / Acceptance Criteria / Design Evidence | Planned Artifact / Path | Why Durable Coverage Is Needed |
| --- | --- | --- | --- | --- |
| `API-VOICE-013` | Repository-owned final qualification corpora and promoted baselines must be unique and mutually aligned before packaging | `AC-007`, `AC-009`, `AC-017`; benchmark Corpus Contract | Proposed focused release/corpus test after the upstream evidence correction | The existing suite validates corpus code and baseline trust separately but never passes the checked-in qualification corpus through `validateCorpus()`. That gap allowed a known duplicate initial-control row to be promoted as final qualification evidence. Do not add a knowingly failing durable test before the evidence owner supplies the corrected unique corpus/baseline. |

## Durable Coverage To Update

None initially.

## Durable Coverage To Remove

None. Previously stale v0.3 coverage is already removed and remains intentionally absent.

## Repository Coverage Execution Plan And Results

| Order | Command | Working Directory / Configuration | Boundary Or Scenario Proven | Result | Evidence / Output Path |
| --- | --- | --- | --- | --- | --- |
| 1 | `npm ci --ignore-scripts` | Assigned worktree; Node 22.23.1 | Locked JS test environment | Pass | `api-e2e-evidence/repository/npm-ci.log` |
| 2 | `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Assigned worktree; exact official darwin-arm64 root | Full JS/Python/Go/source/unit/contract baseline: 34/34 Node, 7/7 Python, all Go/source checks | Pass | `api-e2e-evidence/repository/npm-run-check.log` |
| 3a | `(cd evidence/selection-study && shasum -a 256 -c SHA256SUMS.txt)` | Assigned worktree | All 191 checksum-indexed promoted-study files | Pass | `api-e2e-evidence/repository/selection-study-checksums.log` |
| 3b | Direct `validateCorpus()` over the repository-owned English/Chinese qualification manifests and exact preserved audio | Isolated corpus root `/private/tmp/autobyteus-voice-api-e2e-20260802/corpora` | `AC-007` final-corpus uniqueness and identity closure | Fail | `api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json`; English 50 rows/49 unique, Chinese 200/200 unique |
| 4 | Exact package assembler/verifier/reproducibility commands | Isolated API/E2E build roots | Real build/package/archive/launcher path | Not run after critical fail | Blocked by invalid English final corpus/baseline authority, not by package environment |
| 5 | `benchmark/run-profile-qualification.mjs` for eight packages on their advertised targets | Exact hosts, corpora, approved conditions | `API-VOICE-003`–`API-VOICE-010` | Not run after critical fail | Harness rejects the English corpus before inference; continuing cannot produce a complete release result |
| 6 | Release evidence/catalog assembly and verifier without tag/publication | Isolated aggregate evidence root | Complete matrix, recomputation, notice/license, reproducibility integrity | Not run after critical fail | Complete eight-package qualification is impossible with failing `AC-007` input |

## Post-Repository Confidence Scorecard (Mandatory)

| Confidence Category | Score | What Supports The Score | Remaining Uncertainty | Additional Validation That Could Improve It |
| --- | --- | --- | --- | --- |
| Requirement and acceptance-criteria proof | 50% | Repository checks pass, selection evidence is intact, and Chinese final corpus directly validates | Critical `AC-007` fails for English; all package/target/resource gates remain unexecuted | Correct unique English evidence, then all package gates |
| Changed-boundary execution directness | 50% | Exact repository code and real corpus validator/audio identities were executed | No reviewed package/recognizer executed because its mandatory corpus input fails first | Correct corpus then exact-package qualification |
| Cross-boundary integration realism and mock gap | 50% | Unit/contract checks cover owners and the real corpus boundary exposed the defect | Launcher/private host/model/target boundaries remain unrun | All eight target packages |
| Environment, configuration, identity, and fixture fidelity | 75% | Exact M1 Max host, Node, official Go root, promoted study bytes, repository manifests, and preserved audio were used | Per-target build inputs/hosts/audits remain incomplete; English identity is invalid by design | Correct identity plus provision target environments |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | 34 Node, 7 Python, and Go checks cover bounded mocked/unit failure paths | No real package process tree/conformance run | Actual package conformance |
| User-surface, browser, and desktop-shell confidence | N/A | Runtime-only ticket; no UI/desktop scope | None for this ticket | None |
| Durable regression coverage quality and relevance | 90% | The existing repository suite is current and passed completely | No durable test validates checked-in final corpora through `validateCorpus()`, so the duplicate escaped | Add API-VOICE-013 with corrected evidence |

- Overall post-repository confidence: `65%`
- Calculation method: Simple average of applicable categories after execution; browser/desktop is `N/A` because explicitly out of scope.
- Every critical acceptance criterion directly proven: `No`
- Any applicable category below `90%`: `Yes` — requirement proof, directness, integration realism, environment fidelity, and lifecycle/recovery.
- Default clean-confidence target of `95%` met: `No`
- Material residual risks: `AC-007` is directly failing. All eight package builds/target runs, quality/non-regression, M1 performance, actual Linux/Windows behavior, notices/licenses, and release evidence remain open because continuing after the critical input failure cannot produce a releasable result.

## Broader Validation Decision (Mandatory)

- Decision: `Required`
- Selected execution mode: `CLI`, `Lifecycle`, `Worker`, and actual target-host package qualification.
- Specific confidence gap or residual risk addressed: repository tests do not execute final private hosts/models, target-native launcher/process semantics, actual corpora, M1 sample counts/resources, package mutation/offline/relocation, target platform behavior, or release evidence.
- Why the selected mode can materially improve confidence: it invokes the actual public release subject and is the only approved evidence surface for critical `AC-003`, `AC-006`, `AC-009`, and `AC-017` gates.
- Expected confidence after the selected validation: `>=95%` only if every critical package/target/quality/resource/license/evidence gate directly passes and no category is below `90%`.
- Browser-specific decision and rationale: `Not applicable`; no web/desktop behavior exists in scope.
- Execution outcome superseding the broader plan: `Fail`, not `Blocked`. Direct evidence proves the authoritative English final corpus/baseline violates `AC-007`; environment provisioning cannot repair evidence authority.

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
- Seed data / fixtures: repository-pinned 50 English and 200 Chinese FLEURS manifests/audio plus Audio 1 no-speech/malformed fixtures.
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
| Actual target lanes lacking hosts/inputs | Broader execution stopped at an earlier critical acceptance failure | Critical `AC-017` remains unproven | Reattempt only after corrected English corpus/baseline passes review; then provision exact hosts/inputs. |

## Ambiguities Or Reroute Triggers

| Issue | Classification | Evidence | Recommended Recipient |
| --- | --- | --- | --- |
| A required exact package cannot build/run or misses quality/resource/size/license gates | Design Impact unless code reviewer determines a bounded implementation defect | Requirements explicitly forbid fallback/provider substitution/threshold relaxation | `code_reviewer` for failure-origin review, then likely `solution_designer` |
| Qualification harness or repository fixture fails despite approved behavior | Local Fix candidate | Exact failing command/diff will identify owner | `code_reviewer` for origin decision |
| Required host/input/audit remains unavailable after safe setup | Blocked execution dependency, not a product Pass/Fail | Environment attempt log | User request; no teammate routing while Blocked |
| `API-VOICE-002`: final English corpus/baseline repeats one ID/path/audio identity | Design Impact preliminary | Requirements and benchmark disclose the initial 50-row/49-unique limitation and require the final corpus to be unique; implementation nevertheless promotes that initial control as final release evidence | `code_reviewer` for focused failure-origin review, likely then `solution_designer` for evidence-authorized corpus/baseline correction |

## Investigation Decision

- Proceed To API/E2E Execution: `No — stopped after completed repository-stage Fail`
- Repository-Resident Durable Coverage Will Be Added / Updated / Removed: `No in this failed round`
- Post-repository confidence: `65%`
- Broader validation decision: `Required`
- Reroute Required Before Validation Execution: `Yes — critical acceptance failure found during repository-stage execution`
- Recommended Recipient If Reroute Required: `code_reviewer` for focused failure-origin review
- Notes: Do not drop the duplicate, select a replacement clip, recompute a baseline, relax the uniqueness gate, or run partial package acceptance ad hoc. The final English corpus/baseline authority must be corrected upstream and then re-reviewed before API/E2E resumes with the same scenario IDs.
