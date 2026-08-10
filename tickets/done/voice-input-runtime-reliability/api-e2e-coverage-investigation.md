# API/E2E Coverage Investigation

## Investigation Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/on-demand-model-assets.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/current-platform-qualification.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/release-pipeline-ownership.md`
  - preserved backend-selection, English-v2, Chinese-v2, and cold-preparation studies and checksum bundles under the same ticket root
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md` (`SR-021`)
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md` (`ARCH-REV-021 Pass`)
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-handoff.md` (`IR-032`)
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md` (`CRR-049 Pass`)
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: historical only; no SR-021 Delivery execution is in scope
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-022`
- Current Investigation Round: `22`
- Trigger: Code Reviewer `CRR-049` against exact source commit `ad7c402d224690584e2da98ec71a73e8b6d4ca36` and reviewed artifact/HEAD `93c9a6e579d253cfc1e9b5b8f69f22e4f688df9c`.
- Prior Investigation Reviewed: `API-REV-021 — Blocked / 80%`; its missing managed-runner-group result is truthful history for the withdrawn model-contained recovery design, not current acceptance authority.
- Latest Authoritative Investigation: **`API-REV-022 — Fail / 84%`**. Repository/race/evidence checks pass and the English host is byte-identical across two builds, but exact source fails two mandatory production boundaries before model installation: Chinese host construction cannot load its builder, and the canonical host verifier rejects the real English extraction report.

## Current Requirement And Design Basis

SR-021 cleanly replaces model-contained packages and the managed recovery/candidate pipeline. The current product publishes two deterministic model-free Runtime Host Archive 2 files for `darwin-arm64`, one English and one Chinese. Each host contains the provider engine, public provider launcher, public model manager, Host Source Closure 1, exact Model Admission Root 1, compatibility requirement, schemas, and notices, but no model weights or fallback model path. An explicit `install-profile` request verifies the host before caller catalog/manifest/notice bytes, then downloads only the host-admitted immutable model revision, verifies exact size/SHA/tree, and atomically activates it. Provider startup binds Session Config 2 to the active immutable installation, holds a lifetime lease, re-verifies every subject, and performs inference offline.

API-REV-017/018 remains historical full product qualification for the exact English MLX Whisper Small FP16 and Chinese Fun-ASR-Nano GGUF Q8 inference subjects. It may be reused only if independent Profile Execution Closure 2 recomputation is exact and one retained approved clip per profile yields the same transcript through the new public host/activated-model path under network denial. A closure or smoke mismatch requires the applicable full 49/200 corpus and 30/30/100/resource renewal; API/E2E cannot label a mismatch packaging-only.

Current focused acceptance must directly prove `AC-028`–`AC-035`: both host archives built twice and equal, model-free inspection, complete Catalog 4/host-admission ordering, production-manifest installation, realistic resume/cancel/status/remove/concurrency/lease/filesystem behavior, relocated offline provider smoke, Profile Execution Closure 2, Focused Qualification Set 3, Branch Catalog Projection 3, and independently validated nine-asset release composition. GitHub Actions product testing, merge, tag, publication, desktop UI, other targets, other models, and user/shared application state are outside this API/E2E round.

## Changed Behavior Summary

| Behavior ID / Boundary                                            | Change Type             | Upstream Evidence                                  | Coverage Consequence                                                                                                      |
| ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `BEH-004`, `BEH-010` / host packaging                             | Changed                 | SR-021; `AC-028`                                   | Build each model-free host twice; inspect exact archive contents, closure/root, relocation, and no model payload.         |
| `BEH-005`, `BEH-009`, `BEH-014` / on-demand model lifecycle       | Added                   | `R-025`–`R-028`; `AC-029`–`AC-034`                 | Exercise public manager with production catalog/manifests plus loopback transfer and actual macOS lifecycle probes.       |
| `BEH-002`, `BEH-003`, `BEH-006`, `BEH-011` / inference behavior   | Preserved conditionally | API-REV-017/018; Profile Execution Closure 2       | Recompute exact closure and run one retained offline clip per profile; renew full profile qualification only on mismatch. |
| `BEH-007` / qualification ownership                               | Changed                 | user-approved API-RI-003; `R-022`–`R-024`          | All product proof runs locally. Historical managed GitHub recovery is not retried.                                        |
| `BEH-013` / release composition                                   | Changed                 | `R-029`; `AC-025`–`AC-027`, `AC-035`               | Locally compose and independently verify the exact nonpublishing nine-member release closure; no tag/publication.         |
| Catalog 3, Config 1, contained `model/`, recovery/candidate paths | Removed                 | implementation Legacy Removal Check; source guards | Reconfirm absence; never add compatibility coverage for the obsolete paths.                                               |

## Changed Surface And Boundary Classification

| Surface / Boundary                 | Affected? | Actual Changed Boundary                                                        | Repository Evidence Available               | Material Risk Not Exercised By That Evidence     | Candidate Broader Validation Mode |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------ | --------------------------------- |
| Domain / backend logic             | Yes       | Catalog admission, transfer/resume, Store 1, activation/removal/status/pruning | Go unit/race suites                         | Real CDN, filesystem and process interleavings   | CLI/lifecycle                     |
| API / transport / contract         | Yes       | Catalog 4, Manifest 1, installation events, Config 2, Protocol 1 continuity    | schema, Go, Node, Python tests              | Public executable composition and real bytes     | CLI/process                       |
| Frontend/browser/desktop           | No        | explicitly deferred                                                            | source guards                               | none claimed                                     | none                              |
| Authentication/session/permissions | No        | public immutable HTTPS assets; no private auth                                 | manifest policy tests                       | CDN redirect/range behavior                      | public HTTPS/loopback HTTP        |
| Process / lifecycle                | Yes       | signal cutoff, writer lock, lifetime lease, offline worker                     | race/unit tests                             | actual macOS SIGINT/SIGTERM and process overlap  | CLI/process/lifecycle             |
| Persisted-data transition          | Yes       | current Store 1 is rebuild-only; legacy v0.3 state is not read                 | current-schema unit tests and source guards | clean install/status/remove on real filesystem   | isolated temporary Store 1        |
| Worker / distributed coordination  | Yes       | manager/provider subprocesses and store locking                                | production-shaped tests                     | real public binaries and concurrent processes    | subprocess/lifecycle              |
| External integration               | Yes       | pinned Hugging Face downloads with redirect/range/resume                       | downloader fixtures                         | production model downloads and real CDN behavior | HTTPS + isolated store            |
| Release boundary                   | Yes       | host-only exact nine-asset composition                                         | release pipeline tests                      | real focused archive/evidence subjects           | local nonpublishing CLI           |

## Project Execution Discovery

- Assigned worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Project type/runtime: Node 22.23.1 orchestration and contracts; Go 1.26.5 launchers/model manager/store/archive tooling; contained Python 3.12/MLX English host; native C++ Fun-ASR/llama.cpp Chinese host; macOS Apple Silicon.
- Current actual host: MacBookPro18,4, Apple M1 Max, 64 GB, macOS 26.5, AC power, no reported thermal/performance/CPU-power warning.
- Exact Go roots available: `/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go` and the previously authenticated `/tmp/autobyteus-go1.26.5-v1/go/bin/go`.
- Native environment observation: Homebrew CMake 4.3.3 is installed; recipe authority expects exact authenticated build-environment identities and may fail closed if the current environment does not match.
- No applicable `AGENTS.md` was found. `README.md`, `package.json`, build recipes, contracts, and approved ticket artifacts are authoritative.
- No application user state, desktop process, GitHub workflow, tag, release, or publication will be touched.

| Instruction / Configuration Path                              | Authority / Purpose                        | Commands, Setup, Or Constraints Learned                                                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`                                                   | public install/provider/build contract     | `npm ci --ignore-scripts`; hydrate/materialize host-only inputs; network-denied host assembly; `install/status/remove-profile`; provider `--session-config`. |
| `package.json`                                                | repository checks                          | `npm run check`, `npm run check:release-pipeline`; no product install/inference in those commands.                                                           |
| `build/input-recipes/*-host-darwin-arm64-v2.json`             | exact host-only inputs/tool identities     | hydrate immutable external inputs, materialize current repository bytes, build each host twice.                                                              |
| `release/model-manifests/*.json`                              | exact production model bytes/CDN authority | English two files; Chinese three files; immutable commit URLs and exact size/SHA.                                                                            |
| `benchmark/sandbox/darwin-arm64-network-denied-v1.sb`         | deterministic build/offline boundary       | host construction and provider inference must not use network.                                                                                               |
| `benchmark-protocol.md` / `current-platform-qualification.md` | focused reuse gate                         | one production install and retained offline clip per profile; full requalification only if Execution Closure 2 is not exact.                                 |
| `.github/workflows/release-voice-runtime.yml`                 | Delivery-owned standard-hosted release     | inspect/contract-test only; do not dispatch or publish in API/E2E.                                                                                           |

| Component / Dependency    | Working Directory                                      | Start / Setup Command                                      | Runtime / Resource Notes                                        | Readiness Check                                  | Stop / Cleanup Method                                      |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| repository checks         | assigned worktree                                      | pinned `VOICE_GO=... npm run check[:release-pipeline]`     | no network product execution                                    | command exit/log                                 | none                                                       |
| host build inputs         | isolated `/private/tmp/autobyteus-voice-api-e2e-r22-*` | hydrate cache, materialize recipes                         | English host inputs hundreds of MB; Chinese source inputs small | recipe/hash verification                         | remove only r22-owned tree after durable evidence retained |
| production model store    | isolated r22 store per profile                         | extracted `voice-model-manager install-profile`            | English ~481 MB; Chinese ~1.276 GB; 288 GB currently free       | terminal event + status + inventory hashes       | public remove plus deletion of r22-owned root              |
| provider                  | relocated r22 extracted host                           | `voice-provider --session-config ...` under network denial | one retained WAV/profile; no microphone/UI                      | `hello`, `inference-ready`, transcript, shutdown | graceful shutdown/kill only owned process                  |
| loopback transfer fixture | localhost ephemeral port                               | temporary harness using exact manifest-shaped small files  | deterministic Range/validator/failure behavior                  | health probe/event ledger                        | terminate owned server and remove fixture root             |

| Data / Fixture / Identity Need       | Existing Project Mechanism Or Creation Method               | Environment / Data-Safety Notes                             | Cleanup / Retention                                             |
| ------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| historical API-REV-017/018 authority | committed checksum/evidence records                         | read-only                                                   | retain                                                          |
| retained approved clips              | prior corpus/evidence identity, copied to r22 isolated root | no user audio; approved fixture only                        | retain hash/results, remove temporary copy                      |
| production model bytes               | exact public manifest URLs                                  | isolated store; no credentials; large transfer once/profile | remove Store 1 after evidence unless needed for immediate rerun |
| loopback model fixtures              | generated deterministic bytes and manifests under r22 root  | never treated as production-model proof                     | remove after logs retained                                      |

## Persisted Data Transition Coverage Basis

- Approved decision: `Discard or Rebuild`.
- Design/implementation reference: SR-021 persisted-state decision and IR-032 Persisted Data Transition Check.
- Representative setup: empty isolated Store 1; interrupted authenticated partial; active current-schema installation; concurrent/busy provider lease; later writer cleanup.
- Required result: current schema installs/statuses/removes correctly and never reads or mutates legacy v0.3 desktop state. No migration, dual reader, or fallback is accepted.
- Upstream ambiguity/reroute: none.

## Existing Durable Coverage Inventory

| Path / Scenario                                                                                                                                                         | Current Assertion Or Intent                                          | Related Authority                     | Validity Decision                                 | Evidence                                                                                                  | Action                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `modelmanager/internal/catalog_validation_test.go`                                                                                                                      | exact complete ordered Catalog 4 and selected-row binding            | `AC-029`, `AC-031`                    | Still Valid                                       | CRR-049                                                                                                   | run under pinned Go                                                                              |
| `modelmanager/internal/downloader_test.go`                                                                                                                              | resume/restart/oversize/digest/capacity/redirect policy              | `AC-032`, `AC-034`                    | Still Valid                                       | CRR-049                                                                                                   | run; supplement with production CDN and loopback executable probe                                |
| `modelmanager/internal/events_test.go`                                                                                                                                  | operation phase/terminal/privacy contract                            | `AC-030`                              | Still Valid                                       | IR-032/CRR-049                                                                                            | run                                                                                              |
| `modelstore/{safefs,activation,prune}_test.go`                                                                                                                          | descriptor-relative no-follow safety, snapshots, leases, pruning     | `AC-030`–`AC-032`                     | Still Valid                                       | CRR-049 race/repetition                                                                                   | run race suites; supplement on actual macOS filesystem/processes                                 |
| `hostverify/verify_test.go`, `launcher/internal/*_test.go`                                                                                                              | host/config/activation/model/lease verification and closed execution | `AC-028`, `AC-031`, `AC-033`          | Still Valid                                       | CRR-049                                                                                                   | run; supplement with real relocated hosts                                                        |
| `tests/build/host-source-closure.test.mjs`, `tests/build/reproducibility.test.mjs`                                                                                      | content-derived host identity and archive reproducibility            | `AC-028`, `AC-035`                    | Needs Update                                      | repository checks passed but did not import the real Chinese builder or validate a real extraction report | retain existing assertions and add production-boundary regression coverage during the source fix |
| `tests/release/{catalog-v4,host-construction-result,host-release-contracts,prepublication-chain,release-source-admission-verifier,relevant-source-closure-v2}.test.mjs` | exact catalog/source/release/nine-member authority                   | `AC-025`–`AC-027`, `AC-035`           | Still Valid                                       | CRR-049 9/9                                                                                               | run; supplement with current focused evidence composition                                        |
| `tests/providers/*` and benchmark provider-process tests                                                                                                                | preserved Protocol 1, audio, normalization, session behavior         | `AC-002`–`AC-011`, `AC-031`, `AC-033` | Still Valid                                       | prior qualification + current source checks                                                               | run; real retained-clip smoke decides closure reuse                                              |
| historical API-REV-017/018 evidence                                                                                                                                     | full current provider/model quality/performance/lifecycle authority  | `AC-033`                              | Still Valid only as exact immutable closure input | checksums required                                                                                        | authenticate and compare; never relabel as current host execution                                |
| old recovery/candidate/self-hosted workflow coverage                                                                                                                    | superseded model-contained release behavior                          | SR-021 clean cut                      | Stale / Remove already implemented                | source guard / deleted paths                                                                              | confirm absence; no new coverage                                                                 |

## Stale Or Obsolete Coverage Decisions

No API/E2E-owned deletion is planned. Obsolete active Catalog 3, Config 1, contained-model, recovery/candidate, and self-hosted-runner coverage was already removed by implementation. Historical ticket/evidence records remain immutable history and are not executed as current behavior.

## Durable Coverage To Add / Update / Remove

- Add/update after failure-origin review: production-shaped regression coverage must load both real host builders and must run the Host Verification 2 projection against a real extractor report. The existing generic reproducibility/schema tests did not exercise either composition defect.
- API/E2E did not edit repository-resident tests in this failed round; the source owner should deliver the fixes and regressions together, then source review must pass before API/E2E resumes.
- Remove: none.
- Real host/CDN/model/process observations are run-specific and belong in retained API/E2E evidence rather than source tests containing gigabyte downloads or host-specific identities. If execution exposes a stable missing regression case, investigation will be updated before any durable edit and the result will return through Code Reviewer.

## Repository Coverage Execution Plan And Results

| Order | Command                                                                                                                                         | Working Directory / Configuration                                               | Boundary Or Scenario Proven               | Result                                                                           | Evidence / Output Path                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1     | `go test -race ./modelmanager/internal ./modelstore ./launcher/internal ./hostverify`; `go test -count=10 ./modelmanager/internal ./modelstore` | worktree; exact Go 1.26.5                                                       | CR-F-039–043 and runtime lifecycle owners | Pass                                                                             | `api-e2e-evidence/api-rev-022/repository/focused-go-{race,repeat-10}.log`                           |
| 2     | `VOICE_GO=... npm run check:release-pipeline`                                                                                                   | worktree; pinned Go                                                             | release/source/asset contracts            | Pass — 9/9                                                                       | `api-e2e-evidence/api-rev-022/repository/npm-run-check-release-pipeline.log`                        |
| 3     | `VOICE_GO=... npm run check`                                                                                                                    | worktree; pinned Go                                                             | complete affected repository regression   | Pass — 91/91 Node TAP, 7/7 Python plus compileall, all Go/source/evidence checks | `api-e2e-evidence/api-rev-022/repository/npm-run-check.log`                                         |
| 4     | six preserved checksum manifests and JSON parse audit                                                                                           | ticket/evidence roots                                                           | immutable reuse authority                 | Pass                                                                             | `api-e2e-evidence/api-rev-022/repository/preserved-authority-checksums.log`; `json-parse-audit.txt` |
| 5     | two canonical English builds with the same output basename; `verify-reproducibility.mjs`                                                        | clean detached source `ad7c402...`; exact M1/CMake 4.2.0/Xcode 26.1.1/Go 1.26.5 | actual host construction/reproducibility  | Pass — archive SHA `a2463fc...e53dc`; reports exact                              | `api-e2e-evidence/api-rev-022/host-build/english-host-reproducibility-proof-v2.json`                |
| 6     | canonical Chinese first build                                                                                                                   | same clean environment and exact source/inputs                                  | actual Chinese host construction          | **Fail — API-F-016**                                                             | `api-e2e-evidence/api-rev-022/host-build/API-F-016-chinese-host-construction.log`                   |
| 7     | canonical English host verifier against passing build report                                                                                    | exact English archive/build report and pinned Go                                | actual independent archive verification   | **Fail — API-F-017**                                                             | `api-e2e-evidence/api-rev-022/host-build/API-F-017-english-host-verification.log`                   |

## Post-Repository Confidence Scorecard

Scores after this round's repository execution:

| Confidence Category                                 | Score | What Supports The Score                                                             | Remaining Uncertainty                            | Additional Validation                  |
| --------------------------------------------------- | ----: | ----------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Requirement and acceptance-criteria proof           |   90% | exact current schemas/source guards and complete repository checks pass             | actual AC-028–035 artifacts remain pending       | focused live matrix                    |
| Changed-boundary execution directness               |   85% | current Catalog/Store/launcher owners pass race and repeated execution              | no actual host/install/provider execution yet    | real hosts/models/processes            |
| Cross-boundary integration realism and mock gap     |   75% | production-shaped fixtures and strict release contracts pass                        | CDN, archive, Store 1, provider chain unexecuted | production install and offline smoke   |
| Environment/configuration/identity/fixture fidelity |   90% | exact current M1/Node/Go plus all preserved authority checksums pass                | host materialization/model transfers pending     | authenticated inputs and manifests     |
| Failure/edge/lifecycle/recovery evidence            |   90% | focused race and ten-repeat suites plus full negative coverage pass                 | actual signals/filesystem/leases pending         | macOS interleavings + loopback fixture |
| User-surface/browser/desktop-shell confidence       |   N/A | desktop/UI explicitly deferred                                                      | none in runtime scope                            | none                                   |
| Durable regression coverage quality/relevance       |   98% | comprehensive current-schema tests pass under pinned full/race/repetition execution | real-boundary evidence intentionally external    | none; use temporary live evidence      |

- Overall post-repository confidence: `88.0%` across six applicable categories.
- Every critical acceptance criterion directly proven: `No`.
- Applicable categories below 90%: directness and cross-boundary integration realism.
- Default clean-confidence target met: `No`.
- Material residual risks: actual host construction, public transfer, activation/store/process behavior, offline provider binding, closure/evidence aggregation.

## Broader Validation Decision

- Decision: `Required`, then stopped fail closed at the first critical live prerequisite.
- Selected execution mode: local CLI + process/lifecycle + public HTTPS/loopback HTTP + isolated filesystem.
- Confidence gap: repository tests do not prove the real host/CDN/store/provider or whole-archive/evidence boundaries.
- Expected confidence: at least 95% with no applicable category below 90% if every critical scenario passes.
- Browser/desktop decision: not applicable; SR-021 is runtime-only and future desktop integration is a separate ticket.
- Observed fail condition: exact locked inputs/tool identities were available, but current production source failed host construction/verification. Model download, store mutation, provider execution, closure aggregation, and release composition were correctly not attempted.

## Live Environment And Fixture Plan

- Setup: one unique `/private/tmp/autobyteus-voice-api-e2e-r22-*` root with cache, materialized inputs, builds, extracted relocated hosts, stores, fixtures, logs, and generated evidence.
- Journeys:
  1. `API-VOICE-017`: repository/current-schema and legacy-removal gates.
  2. `API-VOICE-018`: English and Chinese deterministic double host build, equality, verification, model-free inspection, relocation.
  3. `API-VOICE-019`: complete Catalog 4/host-admission ordering and no-side-effect negatives.
  4. `API-VOICE-020`: one production-manifest install per profile, exact model inventory, duplicate install, authentic resume/restart observation.
  5. `API-VOICE-021`: actual macOS cancellation/status/remove/writer/lease/orphan interleavings plus loopback transfer failures.
  6. `API-VOICE-022`: relocated public provider start, retained clip transcript, restart/reuse and shutdown under network denial.
  7. `API-VOICE-023`: generate/independently verify both Profile Execution Closure 2 records and decide reuse versus full renewal.
  8. `API-VOICE-024`: generate/verify Focused Qualification Set 3, Branch Catalog Projection 3, and exact nonpublishing nine-asset composition.
- Evidence: canonical stdout/stderr logs, event ledgers, archive/build reports, store inventories, checksums, process/signal observations, closure/QSet/projection/verifier records.
- Cleanup: stop only r22-owned processes; use public remove where applicable; remove isolated large temporary stores/build roots only after retaining compact authoritative evidence and checksums.

## Temporary Executable Validation Plan

| Scenario ID         | Probe / Harness / Runtime Setup                             | Behavior Proven                                | Why Not Durable                                           |
| ------------------- | ----------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `API-VOICE-018`     | actual two-build/profile orchestration                      | deterministic host bytes and real native build | host/tool/input/run-specific                              |
| `API-VOICE-020`     | production public manifest install                          | real CDN/model bytes/store activation          | gigabyte/network-dependent                                |
| `API-VOICE-021`     | loopback range/failure server and subprocess signal overlap | transfer and macOS lifecycle realism           | ephemeral ports/timing/run evidence                       |
| `API-VOICE-022`     | relocated extracted hosts plus retained clips               | public offline inference composition           | depends on large installed assets and actual hardware     |
| `API-VOICE-023/024` | current evidence generators and independent verifiers       | exact current authority chain                  | outputs are release-admission evidence, not general tests |

## Not Tested / Deferred

| Boundary                             | Reason                                            | Risk                                           | Follow-Up                                           |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| full 49/200 and 30/30/100 repetition | conditional on Execution Closure 2                | none if exact closure + retained smoke pass    | run immediately if closure returns renewal-required |
| GitHub-hosted build/tag/publication  | Delivery-owned after API/E2E and test-code review | hosted tool/capacity/publication remains later | Delivery                                            |
| desktop/UI/microphone                | separate ticket                                   | runtime-to-UI integration unclaimed            | future desktop task                                 |
| x64/Linux/Windows/auto/other models  | explicitly deferred                               | no support claim                               | later platform tasks                                |

## Ambiguities Or Reroute Triggers

| Issue                                                                                                                | Classification | Evidence                             | Recommended Recipient                                                      |
| -------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `API-F-016`: `funasr-host.mjs` imports `cmakeConfigureArguments` from a module that does not export it               | Local Fix      | exact Chinese production build log   | `code_reviewer` for failure-origin confirmation, then implementation owner |
| `API-F-017`: extractor reports absolute destination as `hostRoot` while Host Verification 2 requires constant `host` | Local Fix      | exact English canonical verifier log | `code_reviewer` for failure-origin confirmation, then implementation owner |

## Investigation Decision

- Proceed To Further API/E2E Execution: `No`; stop fail closed until source rework and review.
- Repository-resident durable coverage will be added/updated/removed: `No` initially.
- Post-repository confidence: `88.0%`.
- Broader validation: `Required`.
- Reroute Required Before Further Execution: `Yes`.
- Recommended Recipient: `code_reviewer` for focused failure-origin review.
- Notes: no repository-resident durable coverage changed. This artifact supersedes the API-REV-021 managed-runner investigation as current truth while retaining that result in the revision record.
