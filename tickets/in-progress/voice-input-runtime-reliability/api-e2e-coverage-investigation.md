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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/current-platform-qualification.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `N/A`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-004`
- Current Investigation Round: `4`
- Trigger: `CRR-013` Pass for `IR-011` at reviewed source commit `23d766873fa1be357c657fab8203913fec09e65b` against `SR-008` / `SR-009` and `ARCH-REV-010`.
- Prior Investigation Reviewed: `API-REV-003 — Fail / 79%` at `API-F-001`; repository and unchanged authority coverage passed, but the actual M1 thermal parser rejected healthy `pmset` output before package construction.
- Latest Authoritative Investigation: `API-REV-004 — Blocked / 82%`. `API-F-001` is directly resolved and AC/purge readiness passes, but the production preflight did not reach the required six-sample `>=80%` average CPU-idle condition within 15 minutes.

## Current Requirement And Design Basis

The current release and API/E2E acceptance scope is exactly two packages on the actual MacBookPro18,4 Apple M1 Max / 64 GB host: English `darwin-arm64` using MLX Whisper Small FP16 and Chinese `darwin-arm64` using Fun-ASR-Nano GGUF Q8. English/Chinese `darwin-x64`, `linux-x64`, and `win32-x64` are explicitly `Deferred / Outside Current Release Matrix`; they are not passed, cataloged, published, advertised, or counted in this round's confidence denominator.

Both packages must be materialized from repository recipes and SHA-addressed cache objects/exact clean Git checkouts, built twice under the reviewed network-denied path, verified byte-identical, relocated, run from read-only state without package mutation, and exercised through their public launcher/session/Protocol 1 boundaries. The run must retain all started attempts, execute real English 49-clip and Chinese 200-clip inference, prove quality/non-regression and Simplified Chinese normalization, cover lifecycle/recovery/termination/no-orphan cases including one injected retained failure, and generate privacy-safe evidence.

The actual M1 preflight is a critical gate. It must authenticate exact Node, Go, CMake, Apple clang/Xcode/SDK, Seatbelt, system-tool, and cache-procedure identities; establish AC power/low-power/thermal/memory/quiescence requirements; and successfully execute `/usr/bin/sudo -n /usr/sbin/purge`. Each package then requires exactly 30 filesystem-cold trials, 30 warm-preparation trials, and 100 persistent-worker warm requests, with all started trials counted and the approved latency/RSS/size thresholds unchanged.

After both profiles pass, API/E2E must create Qualification Set 1, then deterministically create Branch Catalog Projection 1 with exactly two local archive entries/assets and independently verify it. API/E2E must not generate Catalog 3, tag, publish, claim maintained-main reachability, or perform release actions. Delivery alone owns integration refresh, integrated rerun, final release proof, tagging, publication, and published-byte verification.

Persisted user/desktop data is `Not Affected`. This runtime-only work must not touch `~/.autobyteus`, desktop installation state, shared product state, or `autobyteus-web`.

## Changed Behavior Summary

| Behavior ID / Boundary | Change Type | Upstream Evidence | Coverage Consequence |
| --- | --- | --- | --- |
| Current qualification/release matrix | Changed | `current-platform-qualification.md`; `SR-008`/`SR-009`; `ARCH-REV-010` | Qualify exactly English and Chinese `darwin-arm64`; classify six former target rows as deferred, not failed or passed. |
| Closed input provisioning | Added | `build/input-recipes/*-darwin-arm64-v1.json`; `build/materialize-release-inputs.mjs` | Use only recipe-declared cache objects/exact checkouts; no hand-assembled hidden build tree. |
| Trusted native build identity | Changed | `IR-008`–`IR-010`; `CRR-011` | Run actual preflight and bind the same canonical Go/CMake/tar/tool identities through package assembly. |
| Filesystem-cold evidence | Changed | `current-platform-qualification.md`; `AC-020` | Exact successful `sudo -n purge` is mandatory before and during 30 counted cold trials; no warm proxy. |
| Failure evidence retention | Added | `IR-008`; `IR-009`; `CRR-011` | Inject one contract-defined failure and prove atomic partial/raw/index/performance/summary artifacts retain every started attempt without retry. |
| Compliance/offline evidence | Changed | repository license policy/generator, Seatbelt owner | Generate exact-package compliance and network-denial evidence; reject unknown/missing/non-redistributable inputs. |
| Branch-only aggregation | Added | `current-platform-qualification.md`; Branch Catalog Projection 1 contracts | Produce QSet 1 and independently verified two-entry branch projection without release identity/publication. |
| English-v2 authority | Preserved | `SR-007`; `API-REV-002`; `CRR-011` | Reuse `API-VOICE-002` only because the exact authority/corpus/baseline/validator bytes are unchanged. |
| Durable production-validator coverage | Preserved | `API-VOICE-013`; accepted by `CRR-011` | Reuse the accepted durable regression only because its test and production-owner bytes are unchanged. |
| Actual M1 thermal-state parsing | Changed | `IR-011`; `CRR-013`; `CR-F-020` | Re-run the production preflight first. The reviewed parser accepts only the captured exact healthy three-line state, classifies explicit warnings, and fails closed on unknown input. |
| v0.3/bootstrap/protocol-0 and withdrawn provider paths | Removed | clean-cut design and removal guards | Do not restore compatibility tests, wrappers, or fallback providers. |

## Changed Surface And Boundary Classification

| Surface / Boundary | Affected? | Actual Changed Boundary | Repository Evidence Available | Material Risk Not Exercised By That Evidence | Candidate Broader Validation Mode |
| --- | --- | --- | --- | --- | --- |
| Domain / backend logic | Yes | adapters, WAV validation, normalization, scoring, qualification gates | Node/Python/Go suites | real model load/inference, quality, RSS/latency | CLI/lifecycle |
| API / transport / contract | Yes | launcher/session config, Protocol 1, package/archive/evidence schemas | strict schema and unit coverage | full launcher-to-private-worker exchange | CLI/process |
| Frontend component / state | No | runtime-only | N/A | N/A | None |
| Browser integration / user journey | No | runtime-only | N/A | N/A | None |
| Authentication / session / permissions | Yes | package-session identity and host purge capability | session/preflight tests | actual noninteractive purge permission | actual host preflight |
| Desktop renderer / web-equivalent UI | No | explicitly outside scope | N/A | N/A | None |
| Desktop shell / Electron-specific integration | No | explicitly outside scope | N/A | N/A | None |
| Process / lifecycle | Yes | native launcher, recognizer worker, teardown/recovery | mocked lifecycle and launcher tests | actual model process tree, relocation, no-orphan | lifecycle/CLI |
| Persisted-data transition | No | `Not Affected` | scope/source guards | accidental user-state mutation | pre/post scope audit |
| Worker / queue / distributed coordination | Yes | one local persistent recognizer and serialized requests | state-machine tests | recognizer reuse and 100-request process behavior | worker/lifecycle |
| External integration | Yes | locked models, Python/native inputs, corpus, toolchain, host | digest/recipe/compliance tests | actual construction, inference, offline and resource proof | actual-target qualification |

## Project Execution Discovery

- Assigned worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime`
- Reviewed source commit: `23d766873fa1be357c657fab8203913fec09e65b`; current worktree documentation HEAD may be later, so package execution will use an owned clean checkout at the reviewed source commit while ticket evidence remains in the assigned worktree.
- Stack: Node.js 22.23.1 orchestration, Python packaged providers and source checks, pinned official Go 1.26.5 launcher/archive tooling, CMake/C++20 native Fun-ASR, canonical ZIP packages.
- No repository `AGENTS.md` exists. `README.md`, `package.json`, input recipes, benchmark protocol, and workflow agree on the exact command sequence.
- Required secrets: `N/A`. Required local capabilities/assets are exact tool roots, cache objects/checkouts, corpora, and noninteractive purge permission; no secret values will be recorded.

| Instruction / Configuration Path | Authority / Purpose | Commands, Setup, Or Constraints Learned |
| --- | --- | --- |
| `README.md`, `package.json` | local and package command authority | `npm ci --ignore-scripts`, `npm run check`, preflight, materialize, build/verify/repro, profile qualification, QSet/projection; no publish. |
| `build/input-recipes/*-darwin-arm64-v1.json` | closed input authority | every object/check-out/source/license byte is recipe-owned and verified before materialization. |
| `build/materialize-release-inputs.mjs` | deterministic materializer | consumes only SHA cache objects and exact clean checkouts; emits `SHA256SUMS.json` and `input-provenance-v1.json`. |
| `benchmark/darwin-arm64-runner-preflight.mjs` | current-host gate | exact host/tool/power/quiescence and `/usr/bin/sudo -n /usr/sbin/purge` capability. |
| `benchmark/run-profile-qualification.mjs` | full executable profile harness | public archive/package, real corpus, quality, lifecycle, relocation/offline/read-only/no-mutation, 30/30/100 and failure retention. |
| `release/evidence/qualification-set.mjs` and branch projection owners | branch aggregation authority | exact two-entry QSet/projection generation and independent verification; no release identity. |
| `.github/workflows/release-voice-runtime.yml` | canonical command ordering | preflight -> materialize -> two sandboxed builds -> verify/repro -> compliance -> conditions -> profile qualification -> branch evidence. |

| Component / Dependency | Working Directory | Setup / Execution | Readiness Check | Cleanup Method |
| --- | --- | --- | --- | --- |
| Repository checks | assigned worktree | `npm ci --ignore-scripts`; exact `VOICE_GO=... npm run check` | all 57 Node, 7 Python, Go/source/schema/evidence checks | suite-owned temps |
| Clean reviewed-source checkout | owned API/E2E temp root | checkout exact `23d7668...`; `npm ci --ignore-scripts` | clean tree and exact commit | repository safe removal owner after evidence retention |
| M1 preflight | actual MacBookPro18,4 host | owned `caffeinate`; exact Go and CMake paths; preflight CLI | passing preflight JSON, including purge capability and six quiescence samples | stop only owned `caffeinate` |
| Closed inputs | owned cache/materialized roots | fill recipe-declared cache objects/checkouts; materializer CLI | exact sizes/digests/clean revisions and generated closure/provenance | remove only owned materialized/cache copies |
| Exact corpora | owned corpus root | byte-copy repository manifests and exact 49/200 referenced WAVs | validator/digest/uniqueness/baseline binding | remove owned corpus copy; never mutate preserved study data |
| Package/qualification | owned output roots | Seatbelt network-denied double builds, verifiers, compliance, conditions, profile runner | exact archives, real results, complete attempt counts, Pass evidence | kill only owned child trees; retain evidence |

## Persisted Data Transition Coverage Basis

- Approved decision: `Not Affected`.
- Evidence: implementation handoff `Persisted Data Transition Check` and design transition section state no supported user-data reader/writer exists in this repository.
- Planned proof: run from owned paths with controlled HOME/session roots; compare that `~/.autobyteus` and desktop/shared state are not used or mutated; package snapshot checks prove package immutability.
- Migration scenarios: `N/A`.
- Upstream ambiguity: none.

## Existing Durable Coverage Inventory

| Path / Scenario | Current Assertion Or Intent | Related Basis | Validity Decision | Evidence | Action |
| --- | --- | --- | --- | --- | --- |
| `tests/build/*`, `tests/contracts/*`, Go launcher/archive tests | closed input, archive, launcher, schema and trusted environment rules | `AC-002`, `AC-006`, `AC-013`, `AC-017`, `AC-020` | Still Valid | `CRR-011` full suite and focused production tests pass | Retain; supplement with actual packages. |
| preflight/native-environment tests plus `tests/release/darwin-thermal-state.test.mjs` | exact host/tool/quiescence/purge identity, canonical build entry, and fail-closed thermal parsing | `AC-003`, `AC-017`, `AC-020`; `API-F-001` | Still Valid | accepted under `CRR-013`; captured healthy fixture is byte-identical to API-REV-003 evidence | Retain; run actual host preflight. |
| `tests/providers/*.py`, protocol/conformance/lifecycle tests | audio/session/protocol/outcome/failure semantics | `AC-002`–`AC-006`, `AC-013`, `AC-017` | Still Valid | 7/7 Python and related Node/Go coverage passed in review | Retain; supplement with real providers. |
| `tests/scoring/normalization.test.mjs` | symmetric scoring and Chinese normalization | `AC-008`, `AC-009` | Still Valid | current scorer authority | Retain; verify real Chinese outputs. |
| performance/failure/qualification tests | exact 30/30/100, all-started-attempt retention, pass-only aggregation | `AC-003`, `AC-007`, `AC-017`, `AC-020` | Still Valid | `CRR-011` accepted current owners | Retain; populate real M1 evidence. |
| `tests/release/trusted-baseline.test.mjs` (`API-VOICE-013`) | production corpus validation and English-v2 trust/derivation drift rejection | `AC-007`, `AC-009`, `AC-017`; `SR-007` | Still Valid — Reusable | exact base-to-reviewed-source diff is empty and worktree bytes match source | No change; retain. |
| `release/evidence/qualification-corpora/english-v2.json` and baseline | sole final 49-WAV English authority | `API-VOICE-002`; `SR-007` | Still Valid — Reusable | `API-VOICE-002` passed previously; exact relevant bytes unchanged | Reuse authority result; real package still runs all 49. |
| current QSet/branch projection tests | reject incomplete, non-pass, drifted, or release-bearing branch evidence | current-platform contract | Still Valid | accepted full source review | Retain; execute real two-package aggregation. |
| removed v0.3/bootstrap/protocol-0 tests | obsolete system-Python/bootstrap/schema-2 behavior | clean-cut removal | Stale / Remove | current source guards reject legacy paths | Keep removed; do not replace for compatibility. |

Exact reuse evidence: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-004/repository/API-VOICE-002-013-authority-reuse.json`. It records an empty `b7342bc..23d7668` diff over the relevant authority/validator/test set, matching working-tree/source SHA-256 values, and no API/E2E-owned durable coverage change in this round.

## Stale Or Obsolete Coverage Decisions

| Path / Scenario | Obsolete Assertion | Why Obsolete | Replacement Coverage | Decision |
| --- | --- | --- | --- | --- |
| deleted v0.3 worker/build/manifest tests | system Python/bootstrap/protocol 0/schema 2 is supported | current contracts require self-contained Provider Archive 1 and Protocol 1 | current package/session/launcher/archive/qualification suites | Keep removed; no compatibility-only coverage. |

## Durable Coverage To Add

None. Run-specific package/corpus/performance/qualification evidence is intentionally not repository test code.

## Durable Coverage To Update

None. `API-VOICE-013` is unchanged and was accepted by `CRR-011`; IR-011's new thermal parser coverage is upstream implementation coverage accepted by `CRR-013`, not an API/E2E-owned durable change.

## Durable Coverage To Remove

None.

## Repository Coverage Execution Plan And Results

| Order | Command / Action | Configuration | Boundary / Scenario | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| 0 | exact authority/test byte comparison | `b7342bc...23d7668` plus working-tree SHA-256 | `API-VOICE-002`/`013` reuse validity | Pass | `api-e2e-evidence/api-rev-004/repository/API-VOICE-002-013-authority-reuse.json` |
| 1 | `npm ci --ignore-scripts` | assigned worktree, Node 22.23.1 | dependency closure | Pass | `api-e2e-evidence/api-rev-004/repository/npm-ci.log` |
| 2 | focused thermal/trusted-baseline tests, then exact-Go `npm run check` | official verified darwin-arm64 Go 1.26.5 root | `API-VOICE-001`, `API-F-001` resolution, reusable `013`, full regression | Pass | focused 9/9; full 60/60 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks in API-REV-004 repository logs |
| 3 | actual M1 production preflight with owned `caffeinate` | AC connected; exact purge exits 0; exact Go/CMake/system identities | mandatory prerequisite and direct `API-F-001` resolution | Blocked | thermalNormal=true directly resolves API-F-001; six final idle samples were 73.94, 71.42, 69.93, 66.30, 67.73, 68.51 (computed average 69.638%, required >=80%). See `environment/API-VOICE-003-004-quiescence-block.json`. |
| 4 | recipe cache verification and deterministic materialization | exact clean reviewed-source checkout | closed English/Chinese inputs | Not executed after Blocked | fail-closed preflight gate |
| 5 | two Seatbelt builds per profile plus package/repro verifier | network denied | byte-identical exact packages | Not executed after Blocked | fail-closed preflight gate |
| 6 | compliance + conditions + full English profile | exact 49 WAV; 30/30/100 | `API-VOICE-003`, part of `011` | Not executed after Blocked | fail-closed preflight gate |
| 7 | compliance + conditions + full Chinese profile | exact 200 WAV; 30/30/100 | `API-VOICE-004`, part of `011` | Not executed after Blocked | fail-closed preflight gate |
| 8 | contract-defined injected retained failure | no retry | failure-evidence integrity | Not executed after Blocked | fail-closed preflight gate |
| 9 | QSet 1 -> Branch Catalog Projection 1 -> independent verification | exactly two local archives | `API-VOICE-012` | Not executed after Blocked | no passing profile inputs |

## Post-Repository Confidence Scorecard (Mandatory)

| Confidence Category | Score | What Supports The Score | Remaining Uncertainty | Additional Validation |
| --- | --- | --- | --- | --- |
| Confidence Category | Score | What Supports The Score | Remaining Uncertainty | Additional Validation |
| --- | --- | --- | --- | --- |
| Requirement and acceptance-criteria proof | 82% | current matrix/source/authority/thermal/compliance/evidence owners pass current repository coverage | critical actual-package criteria remain unexecuted | passing preflight and full matrix |
| Changed-boundary execution directness | 82% | real production authority and current thermal owner execute; actual readiness probes pass | no final package/model process executes | production preflight and packages |
| Cross-boundary integration realism and mock gap | 75% | launcher/archive/provider boundaries have durable coverage | native private host/model/package integration remains absent | full qualification |
| Environment, configuration, identity, and fixture fidelity | 85% | exact Node/official Go; actual M1 now on AC; exact noninteractive purge exits 0 | complete production preflight and input closure still pending | preflight/materialization |
| Failure, edge-case, lifecycle, and recovery evidence | 75% | durable lifecycle/failure-retention suites pass | real package lifecycle/injected failure absent | full qualification |
| User-surface, browser, and desktop-shell confidence | N/A | runtime-only; no UI/desktop boundary | none in scope | none |
| Durable regression coverage quality and relevance | 95% | focused 9/9; full 60/60 Node, 7/7 Python, all Go/source/schema/evidence | run-specific native evidence cannot be durable | retain current coverage |

- Overall post-repository confidence: `82%` (simple average of six applicable categories, rounded).
- Every critical acceptance criterion directly proven: `No`.
- Any applicable category below `90%`: `Yes` — every applicable category except durable regression coverage.
- Default clean-confidence target met: `No`.
- Material residual risks: production preflight, native builds, real inference/quality/lifecycle, exact samples/resources, compliance, and aggregate evidence.

## Broader Validation Decision (Mandatory)

- Decision: `Blocked` after the required actual-host mode executed its full 15-minute quiescence window.
- Selected execution mode: actual-host `CLI`, `Lifecycle`, `Worker`, and native package qualification.
- Confidence gap addressed: repository coverage cannot prove real model construction/inference, package relocation/offline/read-only behavior, M1 performance/RSS/size, exact corpus quality, or aggregate byte integrity.
- Why this materially improves confidence: it executes the public release subject on the only current supported platform with the exact providers, models, corpora, thresholds, and trial counts.
- Expected confidence after validation: at least `95%`, with no applicable category below `90%`, only if every current critical gate passes.
- Browser decision: `N/A`; no browser or desktop UI is in scope.
- Exact unavailable condition: sustained host quiescence. AC power, low-power-off, corrected thermal parsing, normal memory pressure, owned `caffeinate`, and exact purge capability all passed. The final six samples averaged 69.638% idle instead of the required >=80%. Major observed consumers included Docker Desktop's virtualization VM, Docker renderer, WindowServer, WeChat media, and AutoByteus renderers. API/E2E does not own or stop those processes. Resume after the user quits Docker/VM and other CPU-heavy applications.

## Desktop Application Validation Decision

- Desktop framework/shell: `N/A` for this runtime-only ticket.
- Web-equivalent behavior: none.
- Shell-specific behavior: native package launcher/process lifecycle, exercised through CLI/package qualification rather than Electron.
- Effect on any running desktop application: none; no desktop launch or desktop state mutation.

## Live Environment And Fixture Plan

- Startup order: create owned clean checkout/cache/corpus/output roots -> repository checks -> start owned `caffeinate` -> actual preflight -> materialize inputs -> double build/verify/repro -> generate compliance/conditions -> English qualification -> Chinese qualification -> injected failure -> QSet/projection/independent verification.
- Environment: actual MacBookPro18,4 M1 Max / 64 GB, exact Node/Go/CMake/Xcode/SDK and system identities, AC power, low-power off, passing thermal/memory/quiescence conditions, Seatbelt network denial, noninteractive exact purge permission.
- Fixtures: repository byte-identical English-v2 and Chinese-v1 manifests, exact 49/200 referenced WAVs, locked baselines, recipe materialized models/runtime/tool sources.
- Sessions: fresh package/session roots and request IDs; no product auth or user HOME dependency.
- Evidence: commands/statuses, preflight, input closure/provenance, archives/build/repro, protocol/raw/quality/performance/attempts, snapshots, compliance/privacy/offline, QSet/projection/verification.
- Cleanup: stop only owned processes; remove only API/E2E-created checkouts/caches/corpus/extract/session/build roots through safe repository cleanup owners; retain canonical evidence. Preserved study assets and upstream worktree changes remain untouched.

## Temporary Executable Validation Plan

| Scenario | Probe / Runtime Setup | Behavior Proven | Why Not Durable Test Code |
| --- | --- | --- | --- |
| `API-VOICE-001` | exact full repository check | source/contract regression | durable suites already own it |
| `API-VOICE-002` | unchanged-authority digest/reproduction reuse plus real 49-clip run | English authority continuity and real package quality | licensed run bytes/evidence are instance-specific |
| `API-VOICE-003` | English double build/full M1 qualification | exact English package | large generated native evidence |
| `API-VOICE-004` | Chinese double build/full M1 qualification | exact Chinese package | large generated native evidence |
| `API-VOICE-011` | exact package compliance/privacy/offline audit | current two-package legal/evidence completeness | archive-instance-specific |
| `API-VOICE-012` | QSet/projection/independent verification | exact current matrix aggregation | branch/archive-instance-specific |
| `API-VOICE-013` | accepted unchanged durable test | production validator regression | already durable; no new change |

## Not Tested / Infeasible / Deferred

| Behavior / Boundary | Reason | Risk | Follow-Up |
| --- | --- | --- | --- |
| `API-VOICE-005`–`010`: English/Chinese on darwin-x64/linux-x64/win32-x64 | explicitly outside current release matrix | no current-release risk claim; those targets are unsupported | future separately reviewed target-expansion tasks with actual-target qualification |
| `auto` profile | no independent qualification | none for exact current matrix | keep omitted |
| desktop microphone/UI/supervision | runtime-only scope | none claimed for runtime package qualification | separate desktop task |
| maintained-main refresh, integrated rerun, Catalog 3, tag/publication/published-byte proof | Delivery-owned | release is not final from API evidence alone | Delivery after review-passed API/E2E |

## Ambiguities Or Reroute Triggers

| Issue | Classification | Evidence | Recipient |
| --- | --- | --- | --- |
| mandatory current package fails provider/model/quality/resource/license gate | Design Impact unless bounded implementation defect | exact failed command/artifact; no fallback or threshold relaxation allowed | `code_reviewer` for failure-origin review |
| harness/fixture/environment owner defects despite approved behavior | Local Fix candidate | focused reproduction and diff | `code_reviewer` |
| required host capability or exact external byte unavailable | Blocked dependency | readiness/preflight/materializer failure evidence | user, per Blocked workflow |

## Investigation Decision

- Proceed To API/E2E Execution: `No further execution in this round`; the production preflight completed as Blocked.
- Repository-Resident Durable Coverage Will Be Added / Updated / Removed: `No`.
- Post-repository confidence: `82%`.
- Broader validation decision: `Blocked`.
- Reroute Required Before Validation Execution: `No teammate reroute`; user action is required to quiet user-owned applications.
- Recommended Recipient: `User request`, per Blocked workflow.
- Notes: `API-F-001` is directly resolved (`thermalNormal=true`). AC and purge pass. `API-VOICE-002` and `API-VOICE-013` remain reusable only for their unchanged boundary. Six non-arm64 scenarios remain deferred/outside matrix. No package or release action ran.
