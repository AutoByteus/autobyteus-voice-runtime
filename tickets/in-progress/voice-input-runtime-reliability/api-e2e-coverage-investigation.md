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
- Current API/E2E Revision ID: `API-REV-010`
- Current Investigation Round: `10`
- Trigger: `CRR-023` Pass for `IR-017` at reviewed source commit `e133c4a7a73a5531c726ecb04461acb641461667` against `SR-010` / `SR-011`, `ARCH-REV-012`, and focused failure-origin review `CRR-022`.
- Prior Investigation Reviewed: `API-REV-009 — Fail / 95%`; exact English construction/reproducibility passed, but public Python-worker startup failed `API-F-005` and terminal Summary evidence failed `API-F-006`.
- Latest Authoritative Investigation: `API-REV-010 — Fail / 97%`. Exact source/repository checks, Functional Preflight 2, source-bound inputs/corpora, two English builds, package verification/reproducibility, and the complete real English qualification passed. `API-F-005` and `API-F-006` are directly resolved. The first canonical Chinese construction then failed `API-F-007` because the generated closed-input manifest contains ten exact llama.cpp UI paths outside the production input-record allowlist. The stop was fail-closed before native Chinese build/archive creation.

## Current Requirement And Design Basis

The current release and API/E2E acceptance scope is exactly two packages on the actual MacBookPro18,4 Apple M1 Max / 64 GB host: English `darwin-arm64` using MLX Whisper Small FP16 and Chinese `darwin-arm64` using Fun-ASR-Nano GGUF Q8. English/Chinese `darwin-x64`, `linux-x64`, and `win32-x64` are explicitly `Deferred / Outside Current Release Matrix`; they are not passed, cataloged, published, advertised, or counted in this round's confidence denominator.

Both packages must be materialized from repository recipes and SHA-addressed cache objects/exact clean Git checkouts, built twice under the reviewed network-denied path, verified byte-identical, relocated, run from read-only state without package mutation, and exercised through their public launcher/session/Protocol 1 boundaries. The run must retain all started attempts, execute real English 49-clip and Chinese 200-clip inference, prove quality/non-regression and Simplified Chinese normalization, cover lifecycle/recovery/termination/no-orphan cases including one injected retained failure, and generate privacy-safe evidence.

Functional Preflight 2 is a critical gate. It authenticates exact Node, Go, CMake, Apple clang/Xcode/SDK, Seatbelt, system-tool, and cache-procedure identities; requires AC power, low-power-off, normal thermal/memory state, owned `caffeinate`, sandbox canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge`; and captures six idle samples once. CPU idle now classifies evidence as `controlled` or `loaded-host` and cannot block functional execution. Each package still requires exactly 30 filesystem-cold trials, 30 warm-preparation trials, and 100 persistent-worker warm requests with every attempt retained. Hard deadlines, exact counts, quality/non-regression, RSS/size, package/runtime/lifecycle/compliance/privacy gates remain functional blockers. Reference p95 comparisons are independently reported by Performance Assessment 1 and cannot change functional Pass.

After both profiles pass, API/E2E must create Qualification Set 2, then deterministically create Branch Catalog Projection 2 with exactly two local archive entries/assets and independently verify it. Summary 2 owns the functional decision; Performance Assessment 1 owns `controlled-pass|controlled-miss|loaded-host-observation`; QSet 2 binds both without reverse authority. API/E2E must not generate Catalog 3, tag, publish, claim maintained-main reachability, or perform release actions. Delivery alone owns integration refresh, integrated rerun, final release proof, tagging, publication, and published-byte verification.

Persisted user/desktop data is `Not Affected`. This runtime-only work must not touch `~/.autobyteus`, desktop installation state, shared product state, or `autobyteus-web`.

## Changed Behavior Summary

| Behavior ID / Boundary                                 | Change Type             | Upstream Evidence                                                                    | Coverage Consequence                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current qualification/release matrix                   | Changed                 | `current-platform-qualification.md`; `SR-008`/`SR-009`; `ARCH-REV-010`               | Qualify exactly English and Chinese `darwin-arm64`; classify six former target rows as deferred, not failed or passed.                                                                                                                                      |
| Closed input provisioning                              | Added                   | `build/input-recipes/*-darwin-arm64-v1.json`; `build/materialize-release-inputs.mjs` | Use only recipe-declared cache objects/exact checkouts; no hand-assembled hidden build tree.                                                                                                                                                                |
| Trusted native build identity                          | Changed                 | `IR-008`–`IR-010`; `CRR-011`                                                         | Run actual preflight and bind the same canonical Go/CMake/tar/tool identities through package assembly.                                                                                                                                                     |
| Filesystem-cold evidence                               | Changed                 | `current-platform-qualification.md`; `AC-020`                                        | Exact successful `sudo -n purge` is mandatory before and during 30 counted cold trials; no warm proxy.                                                                                                                                                      |
| Failure evidence retention                             | Added                   | `IR-008`; `IR-009`; `CRR-011`                                                        | Inject one contract-defined failure and prove atomic partial/raw/index/performance/summary artifacts retain every started attempt without retry.                                                                                                            |
| Compliance/offline evidence                            | Changed                 | repository license policy/generator, Seatbelt owner                                  | Generate exact-package compliance and network-denial evidence; reject unknown/missing/non-redistributable inputs.                                                                                                                                           |
| Branch-only aggregation                                | Changed                 | `SR-010`/`SR-011`; Branch Catalog Projection 2 contracts                             | Produce QSet 2 and independently verified two-entry projection 2 without release identity/publication; bind functional summaries and independent assessments one-way.                                                                                       |
| English-v2 authority                                   | Preserved               | `SR-007`; `API-REV-002`; `CRR-011`                                                   | Reuse `API-VOICE-002` only because the exact authority/corpus/baseline/validator bytes are unchanged.                                                                                                                                                       |
| Durable production-validator coverage                  | Preserved               | `API-VOICE-013`; accepted by `CRR-011`                                               | Reuse the accepted durable regression only because its test and production-owner bytes are unchanged.                                                                                                                                                       |
| Actual M1 thermal-state parsing                        | Changed                 | `IR-011`; `CRR-013`; `CR-F-020`                                                      | Re-run the production preflight first. The reviewed parser accepts only the captured exact healthy three-line state, classifies explicit warnings, and fails closed on unknown input.                                                                       |
| Functional/performance separation                      | Changed                 | `SR-010`/`SR-011`; `ARCH-REV-012`; `IR-012`/`IR-013`; `CRR-015`                      | Execute Functional Preflight 2 on the loaded host; preserve all 30/30/100 observations; require functional gates while classifying performance independently.                                                                                               |
| Terminal evidence consistency                          | Changed                 | `IR-013`; `CR-F-021`; `CRR-015`                                                      | Verify real profile/QSet terminal decisions, ledger/Summary consistency, retained non-pass behavior if any gate fails, and one-way Summary -> Assessment -> QSet identity.                                                                                  |
| Seatbelt package-entry composition                     | Changed                 | `IR-014`; `CR-F-022`; `CRR-017`; `API-F-002`                                         | Recheck the exact English production construction first: full authorization outside Seatbelt, then both complete builds inside the unchanged profile with sandbox-safe consumption and no transitive sudo launch.                                           |
| Locked Python archive normalization                    | Changed                 | `IR-015`; `CR-F-023`; `CRR-019`; `API-F-003`                                         | Recheck the exact archive through complete package construction, launcher/runtime relocation, and reproducibility after safe nine-link normalization and console-wrapper/RECORD removal.                                                                    |
| Python runtime closure before package path policy      | Changed                 | `IR-016`; `CR-F-024`; `CRR-020`; `CRR-021`; `API-F-004`                              | Recheck the exact full package boundary. The new structural closure removes installed dependency test/test suites and package-local development include trees while retaining required public runtime APIs; the canonical Go path policy remains unchanged. |
| Public launcher to contained Python worker             | Changed                 | `IR-017`; `CR-F-025`; `CRR-022`; `CRR-023`; `API-F-005`                              | Recheck the exact compiled, relocated public launcher under Seatbelt. The reviewed bootstrap supplies one validated package-owned import root while retaining `-I -B -X utf8`, closed environment, no PYTHONPATH/CWD/system fallback, and one launcher.     |
| Terminal profile evidence archive projection           | Changed                 | `IR-017`; `CR-F-026`; `CRR-022`; `CRR-023`; `API-F-006`                              | Recheck production-shaped terminal evidence. Summary 2 now projects exactly five archive fields; a failed attempt must retain matching ledger/Summary plus verified Assessment before pass-only rejection.                                                  |
| Chinese closed-input manifest record paths             | Newly failed at runtime | `API-REV-010`; `API-F-007`; `AC-006`, `AC-017`, `AC-019`                             | Exact materialization closes the tree but emits ten clean llama.cpp UI paths outside the downstream record allowlist; the first canonical Chinese build fails before native compilation/archive creation.                                                   |
| v0.3/bootstrap/protocol-0 and withdrawn provider paths | Removed                 | clean-cut design and removal guards                                                  | Do not restore compatibility tests, wrappers, or fallback providers.                                                                                                                                                                                        |

## Changed Surface And Boundary Classification

| Surface / Boundary                            | Affected? | Actual Changed Boundary                                               | Repository Evidence Available       | Material Risk Not Exercised By That Evidence               | Candidate Broader Validation Mode |
| --------------------------------------------- | --------- | --------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Domain / backend logic                        | Yes       | adapters, WAV validation, normalization, scoring, qualification gates | Node/Python/Go suites               | real model load/inference, quality, RSS/latency            | CLI/lifecycle                     |
| API / transport / contract                    | Yes       | launcher/session config, Protocol 1, package/archive/evidence schemas | strict schema and unit coverage     | full launcher-to-private-worker exchange                   | CLI/process                       |
| Frontend component / state                    | No        | runtime-only                                                          | N/A                                 | N/A                                                        | None                              |
| Browser integration / user journey            | No        | runtime-only                                                          | N/A                                 | N/A                                                        | None                              |
| Authentication / session / permissions        | Yes       | package-session identity and host purge capability                    | session/preflight tests             | actual noninteractive purge permission                     | actual host preflight             |
| Desktop renderer / web-equivalent UI          | No        | explicitly outside scope                                              | N/A                                 | N/A                                                        | None                              |
| Desktop shell / Electron-specific integration | No        | explicitly outside scope                                              | N/A                                 | N/A                                                        | None                              |
| Process / lifecycle                           | Yes       | native launcher, recognizer worker, teardown/recovery                 | mocked lifecycle and launcher tests | actual model process tree, relocation, no-orphan           | lifecycle/CLI                     |
| Persisted-data transition                     | No        | `Not Affected`                                                        | scope/source guards                 | accidental user-state mutation                             | pre/post scope audit              |
| Worker / queue / distributed coordination     | Yes       | one local persistent recognizer and serialized requests               | state-machine tests                 | recognizer reuse and 100-request process behavior          | worker/lifecycle                  |
| External integration                          | Yes       | locked models, Python/native inputs, corpus, toolchain, host          | digest/recipe/compliance tests      | actual construction, inference, offline and resource proof | actual-target qualification       |

## Project Execution Discovery

- Assigned worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime`
- Reviewed source commit: `e133c4a7a73a5531c726ecb04461acb641461667`; current worktree documentation HEAD is later, so package execution will use an owned clean checkout at the reviewed source commit while ticket evidence remains in the assigned worktree.
- Stack: Node.js 22.23.1 orchestration, Python packaged providers and source checks, pinned official Go 1.26.5 launcher/archive tooling, CMake/C++20 native Fun-ASR, canonical ZIP packages.
- No repository `AGENTS.md` exists. `README.md`, `package.json`, input recipes, benchmark protocol, and workflow agree on the exact command sequence.
- Required secrets: `N/A`. Required local capabilities/assets are exact tool roots, cache objects/checkouts, corpora, and noninteractive purge permission; no secret values will be recorded.

| Instruction / Configuration Path                                      | Authority / Purpose                 | Commands, Setup, Or Constraints Learned                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`, `package.json`                                           | local and package command authority | `npm ci --ignore-scripts`, `npm run check`, preflight, materialize, build/verify/repro, profile qualification, QSet/projection; no publish. |
| `build/input-recipes/*-darwin-arm64-v1.json`                          | closed input authority              | every object/check-out/source/license byte is recipe-owned and verified before materialization.                                             |
| `build/materialize-release-inputs.mjs`                                | deterministic materializer          | consumes only SHA cache objects and exact clean checkouts; emits `SHA256SUMS.json` and `input-provenance-v1.json`.                          |
| `benchmark/darwin-arm64-runner-preflight.mjs`                         | Functional Preflight 2              | exact host/tool/power/thermal/memory/sandbox/purge gates plus non-gating CPU-load classification.                                           |
| `benchmark/run-profile-qualification.mjs`                             | full executable profile harness     | public archive/package, real corpus, quality, lifecycle, relocation/offline/read-only/no-mutation, 30/30/100 and failure retention.         |
| `release/evidence/qualification-set.mjs` and branch projection owners | branch aggregation authority        | exact two-entry QSet/projection generation and independent verification; no release identity.                                               |
| `.github/workflows/release-voice-runtime.yml`                         | canonical command ordering          | preflight -> materialize -> two sandboxed builds -> verify/repro -> compliance -> conditions -> profile qualification -> branch evidence.   |

| Component / Dependency         | Working Directory              | Setup / Execution                                                                        | Readiness Check                                                                      | Cleanup Method                                                                                             |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Repository checks              | assigned worktree              | `npm ci --ignore-scripts`; exact `VOICE_GO=... npm run check`                            | 72 top-level / 79 TAP Node, 7 Python, all Go/source/schema/evidence checks           | suite-owned temps                                                                                          |
| Clean reviewed-source checkout | owned API/E2E temp root        | checkout exact `e133c4a7...`; `npm ci --ignore-scripts`                                  | clean tree and exact commit                                                          | retain owned root for correction rerun                                                                     |
| M1 preflight                   | actual MacBookPro18,4 host     | owned `caffeinate`; exact Go and CMake paths; preflight CLI                              | passing v2 JSON, purge capability, six CPU-idle samples, `controlled` classification | stop only owned `caffeinate`                                                                               |
| Closed inputs                  | owned cache/materialized roots | fill recipe-declared cache objects/checkouts; materializer CLI                           | exact sizes/digests/clean revisions and generated closure/provenance                 | retain owned materialized/cache copies for correction rerun                                                |
| Exact corpora                  | owned corpus root              | byte-copy repository manifests and exact 49/200 referenced WAVs                          | validator/digest/uniqueness/baseline binding                                         | retain owned corpus copy; never mutate preserved study data                                                |
| Package/qualification          | owned output roots             | Seatbelt network-denied double builds, verifiers, compliance, conditions, profile runner | exact archives, real results, complete attempt counts, Pass evidence                 | English complete Pass; first Chinese construction failed before archive creation; retain evidence and stop |

## Persisted Data Transition Coverage Basis

- Approved decision: `Not Affected`.
- Evidence: implementation handoff `Persisted Data Transition Check` and design transition section state no supported user-data reader/writer exists in this repository.
- Executed proof: all qualification/checkouts/inputs/corpora/output/session roots were API/E2E-owned; English pre/post package snapshots prove no mutation; no command targeted `~/.autobyteus`; cleanup evidence confirms the unrelated installed user worker remained untouched.
- Migration scenarios: `N/A`.
- Upstream ambiguity: none.

## Existing Durable Coverage Inventory

| Path / Scenario                                                                       | Current Assertion Or Intent                                                                       | Related Basis                                    | Validity Decision      | Evidence                                                                                     | Action                                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `tests/build/*`, `tests/contracts/*`, Go launcher/archive tests                       | closed input, archive, launcher, schema and trusted environment rules                             | `AC-002`, `AC-006`, `AC-013`, `AC-017`, `AC-020` | Still Valid            | `CRR-011` full suite and focused production tests pass                                       | Retain; supplement with actual packages.                |
| preflight/native-environment tests plus `tests/release/darwin-thermal-state.test.mjs` | exact host/tool/quiescence/purge identity, canonical build entry, and fail-closed thermal parsing | `AC-003`, `AC-017`, `AC-020`; `API-F-001`        | Still Valid            | accepted under `CRR-013`; captured healthy fixture is byte-identical to API-REV-003 evidence | Retain; run actual host preflight.                      |
| `tests/providers/*.py`, protocol/conformance/lifecycle tests                          | audio/session/protocol/outcome/failure semantics                                                  | `AC-002`–`AC-006`, `AC-013`, `AC-017`            | Still Valid            | 7/7 Python and related Node/Go coverage passed in review                                     | Retain; supplement with real providers.                 |
| `tests/scoring/normalization.test.mjs`                                                | symmetric scoring and Chinese normalization                                                       | `AC-008`, `AC-009`                               | Still Valid            | current scorer authority                                                                     | Retain; verify real Chinese outputs.                    |
| performance/failure/qualification tests                                               | exact 30/30/100, all-started-attempt retention, pass-only aggregation                             | `AC-003`, `AC-007`, `AC-017`, `AC-020`           | Still Valid            | `CRR-011` accepted current owners                                                            | Retain; populate real M1 evidence.                      |
| `tests/release/trusted-baseline.test.mjs` (`API-VOICE-013`)                           | production corpus validation and English-v2 trust/derivation drift rejection                      | `AC-007`, `AC-009`, `AC-017`; `SR-007`           | Still Valid — Reusable | exact base-to-reviewed-source diff is empty and worktree bytes match source                  | No change; retain.                                      |
| `release/evidence/qualification-corpora/english-v2.json` and baseline                 | sole final 49-WAV English authority                                                               | `API-VOICE-002`; `SR-007`                        | Still Valid — Reusable | `API-VOICE-002` passed previously; exact relevant bytes unchanged                            | Reuse authority result; real package still runs all 49. |
| current QSet/branch projection tests                                                  | reject incomplete, non-pass, drifted, or release-bearing branch evidence                          | current-platform contract                        | Still Valid            | accepted full source review                                                                  | Retain; execute real two-package aggregation.           |
| removed v0.3/bootstrap/protocol-0 tests                                               | obsolete system-Python/bootstrap/schema-2 behavior                                                | clean-cut removal                                | Stale / Remove         | current source guards reject legacy paths                                                    | Keep removed; do not replace for compatibility.         |

Round-10 reuse decision: exact source and `API-VOICE-002`/`API-VOICE-013` authority/test bytes remained unchanged at the reviewed source commit and were reused. No API/E2E-owned durable coverage changed.

## Stale Or Obsolete Coverage Decisions

| Path / Scenario                          | Obsolete Assertion                                       | Why Obsolete                                                               | Replacement Coverage                                          | Decision                                      |
| ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| deleted v0.3 worker/build/manifest tests | system Python/bootstrap/protocol 0/schema 2 is supported | current contracts require self-contained Provider Archive 1 and Protocol 1 | current package/session/launcher/archive/qualification suites | Keep removed; no compatibility-only coverage. |

## Durable Coverage To Add

None. Run-specific package/corpus/performance/qualification evidence is intentionally not repository test code.

## Durable Coverage To Update

None. `API-VOICE-013` is unchanged and was accepted by `CRR-011`; current functional/performance and retention coverage is upstream implementation coverage accepted by `CRR-015`, not an API/E2E-owned durable change.

## Durable Coverage To Remove

None.

## Repository Coverage Execution Plan And Results

| Order | Command / Action                                                                     | Configuration                                                                | Boundary / Scenario                                                         | Result                                                         | Evidence                                                 |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 0     | exact source/authority/test byte comparison and current repository checks            | reviewed `e133c4a7`                                                          | `API-VOICE-001`/`002`/`013`, launcher/evidence fixes, and prior corrections | Pass: focused 4/4; full 72 top-level / 79 TAP and 7 Python     | `api-e2e-evidence/api-rev-010/repository/`               |
| 1     | Functional Preflight 2 with owned `caffeinate`                                       | exact actual M1, Go/CMake/system identities, AC/thermal/memory/sandbox/purge | host readiness and load classification                                      | Pass; `controlled`, average idle `80.63166666666666%`          | fresh preflight v2 JSON/log                              |
| 2     | deterministic rematerialization and exact corpus revalidation                        | owned clean exact `e133c4a7` checkout                                        | source-bound closed inputs and 49/200 identities                            | Pass for materialization and both corpus validators            | `api-rev-010/inputs/`                                    |
| 3     | outside authorization -> two English Seatbelt builds -> verification/reproducibility | exact current workflow                                                       | current package and prior API-F-004 continuity                              | Pass; two byte-identical archives and verifier Pass            | English package/repro evidence                           |
| 4     | compliance/conditions/full English profile                                           | exact 49 WAV; exact 30/30/100                                                | direct API-F-005/API-F-006 resolution; remaining API-VOICE-003/011          | Pass; 160/160 attempts, 49/49 quality, lifecycle and resources | Summary 2, Assessment 1, raw/lifecycle/resource evidence |
| 5     | Chinese package/reproducibility and full profile                                     | exact 200 WAV; exact 30/30/100                                               | API-VOICE-004/011                                                           | **Fail at first construction: `API-F-007`**                    | Chinese build log and focused manifest analysis          |
| 6     | verify retained terminal evidence if any profile gate fails                          | no retry/rewrite                                                             | terminal evidence consistency                                               | Not applicable; failure preceded profile-attempt creation      | structured pre-profile package failure                   |
| 7     | Qualification Set 2 -> Branch Catalog Projection 2 -> independent verification       | exactly two local archives                                                   | API-VOICE-012                                                               | Not Tested after required Chinese package failed               | no complete two-profile subject                          |

## Post-Repository Confidence Scorecard (Mandatory)

| Confidence Category                                        | Score | What Supports The Score                                                                        | Remaining Uncertainty                                | Additional Validation     |
| ---------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| Requirement and acceptance-criteria proof                  | 85%   | current functional/performance authority, matrix, evidence, package and compliance owners pass | exact packages/real corpora/resources unexecuted     | full two-package proof    |
| Changed-boundary execution directness                      | 85%   | production authority and current v2 evidence owners execute in focused/full suites             | no final package/model process yet                   | actual preflight/packages |
| Cross-boundary integration realism and mock gap            | 75%   | launcher/archive/provider boundaries have durable coverage                                     | native private host/model/package integration absent | full qualification        |
| Environment, configuration, identity, and fixture fidelity | 85%   | actual M1, exact Node/Go/CMake, AC and purge available                                         | v2 preflight and closed inputs pending               | preflight/materialization |
| Failure, edge-case, lifecycle, and recovery evidence       | 78%   | durable lifecycle/failure retention and post-attempt gate tests pass                           | real package lifecycle/recovery absent               | full qualification        |
| User-surface, browser, and desktop-shell confidence        | N/A   | runtime-only                                                                                   | none                                                 | none                      |
| Durable regression coverage quality and relevance          | 95%   | focused 4/4; full 72 top-level / 79 TAP Node, 7/7 Python, all Go/source/schema/evidence        | run-specific native evidence is not durable          | retain current coverage   |

- Overall post-repository confidence: `84%` (simple average of six applicable categories, rounded).
- Every critical acceptance criterion directly proven: `No`.
- Any applicable category below `90%`: `Yes` — every applicable category except durable regression coverage.
- Default clean-confidence target met: `No`.
- Material residual risks: Functional Preflight 2, exact closed inputs/builds, real inference/quality/lifecycle, exact 30/30/100/resources, compliance, terminal evidence consistency, QSet 2, and projection 2.

## Broader Validation Decision (Mandatory)

- Decision: `Required / Executed until the critical first Chinese construction failure`.
- Selected execution mode: actual-host `CLI`, `Lifecycle`, `Worker`, and native package qualification.
- Confidence gap addressed: repository coverage cannot prove real model construction/inference, package relocation/offline/read-only behavior, M1 performance/RSS/size, exact corpus quality, or aggregate byte integrity.
- Why this materially improves confidence: it executes the public release subject on the only current supported platform with the exact providers, models, corpora, thresholds, and trial counts.
- Evidence gain: actual M1 English is now directly qualified end to end with controlled performance; the exact Chinese production entry directly exposes a deterministic closed-input/path-policy mismatch.
- Browser decision: `N/A`; no browser or desktop UI is in scope.
- Loaded-host rule: sub-80% CPU idle is not a functional blocker. It must be recorded as `loaded-host-observation` and cannot be called controlled performance. AC/thermal/memory/tool/sandbox/purge blockers remain exact.

## Desktop Application Validation Decision

- Desktop framework/shell: `N/A` for this runtime-only ticket.
- Web-equivalent behavior: none.
- Shell-specific behavior: native package launcher/process lifecycle, exercised through CLI/package qualification rather than Electron.
- Effect on any running desktop application: none; no desktop launch or desktop state mutation.

## Live Environment And Fixture Plan

- Executed order: owned clean checkout/cache/corpus/output roots -> repository checks -> owned `caffeinate` -> actual preflight -> input materialization/corpus validation -> English double build/verify/repro -> compliance/conditions -> complete English qualification -> first Chinese construction -> fail-closed stop.
- Environment: actual MacBookPro18,4 M1 Max / 64 GB, exact Node/Go/CMake/Xcode/SDK and system identities, AC power, low-power off, passing thermal/memory conditions, Seatbelt network denial, noninteractive exact purge permission. CPU load is observed/classified, not functionally gated.
- Fixtures: repository byte-identical English-v2 and Chinese-v1 manifests, exact 49/200 referenced WAVs, locked baselines, recipe materialized models/runtime/tool sources.
- Sessions: fresh package/session roots and request IDs; no product auth or user HOME dependency.
- Evidence: commands/statuses, preflight, input closure/provenance, English archive/build/repro/protocol/raw/quality/performance/attempts/snapshots/compliance/offline records, and exact Chinese failure/manifest analysis. QSet/projection evidence was not produced after the two-profile subject failed.
- Cleanup: owned `caffeinate` was interrupted and reaped; no task-owned qualification/provider process remains. The owned exact-source/input/output roots are retained for the correction rerun. Preserved study assets, unrelated user voice worker, user product state, tags, releases, and upstream worktree changes remain untouched.

## Temporary Executable Validation Plan

| Scenario        | Probe / Runtime Setup                                               | Behavior Proven                                          | Why Not Durable Test Code                         |
| --------------- | ------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `API-VOICE-001` | exact full repository check                                         | source/contract regression                               | durable suites already own it                     |
| `API-VOICE-002` | unchanged-authority digest/reproduction reuse plus real 49-clip run | English authority continuity and real package quality    | licensed run bytes/evidence are instance-specific |
| `API-VOICE-003` | English double build/full M1 qualification                          | exact English package                                    | large generated native evidence                   |
| `API-VOICE-004` | first Chinese production build plus manifest audit                  | exact closed-input construction failure                  | large generated input/build evidence              |
| `API-VOICE-011` | exact package compliance/privacy/offline audit                      | English Pass; Chinese incomplete after construction Fail | archive-instance-specific                         |
| `API-VOICE-012` | QSet 2/projection 2/independent verification                        | Not Tested after incomplete two-package matrix           | branch/archive-instance-specific                  |
| `API-VOICE-013` | accepted unchanged durable test                                     | production validator regression                          | already durable; no new change                    |

## Not Tested / Infeasible / Deferred

| Behavior / Boundary                                                                        | Reason                                    | Risk                                                         | Follow-Up                                                                          |
| ------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `API-VOICE-005`–`010`: English/Chinese on darwin-x64/linux-x64/win32-x64                   | explicitly outside current release matrix | no current-release risk claim; those targets are unsupported | future separately reviewed target-expansion tasks with actual-target qualification |
| `auto` profile                                                                             | no independent qualification              | none for exact current matrix                                | keep omitted                                                                       |
| desktop microphone/UI/supervision                                                          | runtime-only scope                        | none claimed for runtime package qualification               | separate desktop task                                                              |
| maintained-main refresh, integrated rerun, Catalog 3, tag/publication/published-byte proof | Delivery-owned                            | release is not final from API evidence alone                 | Delivery after review-passed API/E2E                                               |

## Ambiguities Or Reroute Triggers

| Issue                                                                                                  | Classification                                     | Evidence                                                                   | Recipient                                 |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| mandatory current package fails provider/model/quality/resource/license gate                           | Design Impact unless bounded implementation defect | exact failed command/artifact; no fallback or threshold relaxation allowed | `code_reviewer` for failure-origin review |
| harness/fixture/environment owner defects despite approved behavior                                    | Local Fix candidate                                | focused reproduction and diff                                              | `code_reviewer`                           |
| required host capability or exact external byte unavailable                                            | Blocked dependency                                 | readiness/preflight/materializer failure evidence                          | user, per Blocked workflow                |
| functional Summary/ledger/QSet decisions diverge, or loaded-host observations are relabeled controlled | Local Fix or Design Impact                         | exact retained v2 evidence                                                 | `code_reviewer` for failure origin        |

## Investigation Decision

- Proceed To API/E2E Execution: `Completed for this round; stopped fail-closed at API-F-007`.
- Repository-Resident Durable Coverage Will Be Added / Updated / Removed: `No`.
- Post-repository confidence: `84%`.
- Broader validation decision: `Required`.
- Prior completed result: `API-REV-009 — Fail / 95%`.
- Reroute Required Before Further Execution: `Yes`; the Chinese closed-input manifest and production record-path policy are inconsistent at the exact package boundary.
- Recommended Recipient: `code_reviewer` for focused failure-origin review; preliminary correction owner is Implementation Engineer.
- Notes: `API-F-005` and `API-F-006` are directly resolved by the complete English Pass. `API-F-007` is deterministic and not a host, user permission, corpus, provider/model, threshold, or performance failure. No manifest edit, path-policy relaxation, source-tree mutation, fallback, retry, or release action was used.
