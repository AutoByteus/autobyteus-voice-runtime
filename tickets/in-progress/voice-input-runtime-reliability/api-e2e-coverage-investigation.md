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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/chinese-qualification-correction.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/chinese-qualification-v2/`
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
- Current API/E2E Revision ID: `API-REV-015`
- Current Investigation Round: `15`
- Trigger: `CRR-033` Pass for `IR-022` at exact source commit `af008705488a029b95007e25c7c00484387d3ffe` against `SR-012` / `ARCH-REV-013` after focused failure-origin review `CRR-032`.
- Prior Investigation Reviewed: `API-REV-014 — Fail / 99%`; exact Chinese package/runtime functionality passed 260/260, while incomparable scoring authority (`API-F-011`) and the unsupported global 2.5-GiB RSS gate (`API-F-012`) failed the formal Summary.
- Latest Authoritative Investigation: **`API-REV-015 — Fail / 99%`**. `SR-012` / `ARCH-REV-013` / `IR-022` / `CRR-033` install the corrected Chinese v2 scorer/trust and exact profile resource policy. Exact-source checks, controlled actual-M1 preflight, closed inputs, two byte-identical Chinese builds, package verification, reproducibility, and compliance passed. The exact packaged Chinese profile then failed `API-F-013`: cold attempt 22 emitted `hello` but did not emit `inference-ready` within the hard 30,000-ms preparation deadline. The ledger and Summary consistently retain `21 succeeded / 1 failed / 1 timed out`; API/E2E stopped before English, QSet 2, or Branch Catalog Projection 2.

## Current Requirement And Design Basis

The current release and API/E2E acceptance scope is exactly two packages on the actual MacBookPro18,4 Apple M1 Max / 64 GB host: English `darwin-arm64` using MLX Whisper Small FP16 and Chinese `darwin-arm64` using Fun-ASR-Nano GGUF Q8. English/Chinese `darwin-x64`, `linux-x64`, and `win32-x64` are explicitly `Deferred / Outside Current Release Matrix`; they are not passed, cataloged, published, advertised, or counted in this round's confidence denominator.

Both packages must be materialized from repository recipes and SHA-addressed cache objects/exact clean Git checkouts, built twice under the reviewed network-denied path, verified byte-identical, relocated, run from read-only state without package mutation, and exercised through their public launcher/session/Protocol 1 boundaries. The run must retain all started attempts, execute real English 49-clip and Chinese 200-clip inference, prove quality/non-regression and Simplified Chinese normalization, cover lifecycle/recovery/termination/no-orphan cases including one injected retained failure, and generate privacy-safe evidence.

Functional Preflight 2 is a critical gate. It authenticates exact Node, Go, CMake, Apple clang/Xcode/SDK, Seatbelt, system-tool, and cache-procedure identities; requires AC power, low-power-off, normal thermal/memory state, owned `caffeinate`, sandbox canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge`; and captures six idle samples once. CPU idle now classifies evidence as `controlled` or `loaded-host` and cannot block functional execution. Each package still requires exactly 30 filesystem-cold trials, 30 warm-preparation trials, and 100 persistent-worker warm requests with every attempt retained. Hard deadlines, exact counts, quality/non-regression, profile-policy RSS/size, package/runtime/lifecycle/compliance/privacy gates remain functional blockers. English hard RSS is 2.5 GiB; Chinese hard RSS is 4.0 GiB, while Chinese 2.5 GiB is Assessment-only optimization evidence. Reference p95 comparisons are independently reported by Performance Assessment 1 and cannot change functional Pass.

After both profiles pass, API/E2E must create Qualification Set 2, then deterministically create Branch Catalog Projection 2 with exactly two local archive entries/assets and independently verify it. Summary 2 owns the functional decision; Performance Assessment 1 owns `controlled-pass|controlled-miss|loaded-host-observation`; QSet 2 binds both without reverse authority. API/E2E must not generate Catalog 3, tag, publish, claim maintained-main reachability, or perform release actions. Delivery alone owns integration refresh, integrated rerun, final release proof, tagging, publication, and published-byte verification.

Persisted user/desktop data is `Not Affected`. This runtime-only work must not touch `~/.autobyteus`, desktop installation state, shared product state, or `autobyteus-web`.

## Changed Behavior Summary

| Behavior ID / Boundary                                 | Change Type                        | Upstream Evidence                                                                    | Coverage Consequence                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current qualification/release matrix                   | Changed                            | `current-platform-qualification.md`; `SR-008`/`SR-009`; `ARCH-REV-010`               | Qualify exactly English and Chinese `darwin-arm64`; classify six former target rows as deferred, not failed or passed.                                                                                                                                      |
| Closed input provisioning                              | Added                              | `build/input-recipes/*-darwin-arm64-v1.json`; `build/materialize-release-inputs.mjs` | Use only recipe-declared cache objects/exact checkouts; no hand-assembled hidden build tree.                                                                                                                                                                |
| Trusted native build identity                          | Changed                            | `IR-008`–`IR-010`; `CRR-011`                                                         | Run actual preflight and bind the same canonical Go/CMake/tar/tool identities through package assembly.                                                                                                                                                     |
| Filesystem-cold evidence                               | Changed                            | `current-platform-qualification.md`; `AC-020`                                        | Exact successful `sudo -n purge` is mandatory before and during 30 counted cold trials; no warm proxy.                                                                                                                                                      |
| Failure evidence retention                             | Added                              | `IR-008`; `IR-009`; `CRR-011`                                                        | Inject one contract-defined failure and prove atomic partial/raw/index/performance/summary artifacts retain every started attempt without retry.                                                                                                            |
| Compliance/offline evidence                            | Changed                            | repository license policy/generator, Seatbelt owner                                  | Generate exact-package compliance and network-denial evidence; reject unknown/missing/non-redistributable inputs.                                                                                                                                           |
| Branch-only aggregation                                | Changed                            | `SR-010`/`SR-011`; Branch Catalog Projection 2 contracts                             | Produce QSet 2 and independently verified two-entry projection 2 without release identity/publication; bind functional summaries and independent assessments one-way.                                                                                       |
| English-v2 authority                                   | Preserved                          | `SR-007`; `API-REV-002`; `CRR-011`                                                   | Reuse `API-VOICE-002` only because the exact authority/corpus/baseline/validator bytes are unchanged.                                                                                                                                                       |
| Durable production-validator coverage                  | Preserved                          | `API-VOICE-013`; accepted by `CRR-011`                                               | Reuse the accepted durable regression only because its test and production-owner bytes are unchanged.                                                                                                                                                       |
| Actual M1 thermal-state parsing                        | Changed                            | `IR-011`; `CRR-013`; `CR-F-020`                                                      | Re-run the production preflight first. The reviewed parser accepts only the captured exact healthy three-line state, classifies explicit warnings, and fails closed on unknown input.                                                                       |
| Functional/performance separation                      | Changed                            | `SR-010`/`SR-011`; `ARCH-REV-012`; `IR-012`/`IR-013`; `CRR-015`                      | Execute Functional Preflight 2 on the loaded host; preserve all 30/30/100 observations; require functional gates while classifying performance independently.                                                                                               |
| Terminal evidence consistency                          | Changed                            | `IR-013`; `CR-F-021`; `CRR-015`                                                      | Verify real profile/QSet terminal decisions, ledger/Summary consistency, retained non-pass behavior if any gate fails, and one-way Summary -> Assessment -> QSet identity.                                                                                  |
| Seatbelt package-entry composition                     | Changed                            | `IR-014`; `CR-F-022`; `CRR-017`; `API-F-002`                                         | Recheck the exact English production construction first: full authorization outside Seatbelt, then both complete builds inside the unchanged profile with sandbox-safe consumption and no transitive sudo launch.                                           |
| Locked Python archive normalization                    | Changed                            | `IR-015`; `CR-F-023`; `CRR-019`; `API-F-003`                                         | Recheck the exact archive through complete package construction, launcher/runtime relocation, and reproducibility after safe nine-link normalization and console-wrapper/RECORD removal.                                                                    |
| Python runtime closure before package path policy      | Changed                            | `IR-016`; `CR-F-024`; `CRR-020`; `CRR-021`; `API-F-004`                              | Recheck the exact full package boundary. The new structural closure removes installed dependency test/test suites and package-local development include trees while retaining required public runtime APIs; the canonical Go path policy remains unchanged. |
| Public launcher to contained Python worker             | Changed                            | `IR-017`; `CR-F-025`; `CRR-022`; `CRR-023`; `API-F-005`                              | Recheck the exact compiled, relocated public launcher under Seatbelt. The reviewed bootstrap supplies one validated package-owned import root while retaining `-I -B -X utf8`, closed environment, no PYTHONPATH/CWD/system fallback, and one launcher.     |
| Terminal profile evidence archive projection           | Changed                            | `IR-017`; `CR-F-026`; `CRR-022`; `CRR-023`; `API-F-006`                              | Recheck production-shaped terminal evidence. Summary 2 now projects exactly five archive fields; a failed attempt must retain matching ledger/Summary plus verified Assessment before pass-only rejection.                                                  |
| Shared Build Input Path 1 contract                     | Changed                            | `IR-018`; `CR-F-027`; `CRR-024`; `CRR-025`; `API-F-007`                              | Recheck materialization and verification through one owner. All 3,149 current Chinese records, including the ten routing paths, must pass without rename, omission, projection, or mutation.                                                                |
| Trusted Apple ranlib command identity                  | Corrected and directly passed      | `IR-019`; `CRR-026`; `CRR-027`; `API-REV-011`; `API-F-008`; `API-REV-012`            | Exact production construction preserved the authenticated `ranlib -> libtool` invocation and successfully built `libggml-base.a`; prior `API-F-008` is resolved at the real boundary.                                                                       |
| Closed native build-tool completeness                  | Corrected and directly passed      | `IR-020`; `CRR-028`; `CRR-029`; `API-REV-012`; `API-F-009`; `API-REV-013`            | Exact `/usr/bin/sed` was captured, bound, live-reverified, exposed in the closed PATH, and executed both locked Metal transformations. Prior `API-F-009` is resolved at the canonical production boundary.                                                  |
| Authenticated Xcode C++ driver invocation              | Corrected and directly passed      | `IR-021`; `CRR-030`; `CRR-031`; `API-REV-013`; `API-F-010`; `API-REV-014`            | Exact construction preserved `clang++ -> clang` semantics through resolved CMake and final linkage; two byte-identical verified Chinese archives directly resolve `API-F-010`.                                                                              |
| Chinese qualification scorer/trust authority           | Corrected; direct recheck required | `SR-012`; `IR-022`; `CRR-033`; `API-F-011`; `API-VOICE-004`                          | Rebuild and run exact Chinese v2 subject. Candidate and baseline must bind the same raw/raw scorer/map/trust identities; retained API-REV-014 re-score is source evidence only.                                                                             |
| Profile-specific resource policy                       | Corrected; direct recheck required | `SR-012`; `IR-022`; `CRR-033`; `API-F-012`; `AC-003`, `AC-017`, `AC-023`             | Rebuild both profiles. Summary must enforce English <=2.5 GiB and Chinese <=4.0 GiB; Assessment must record Chinese 2.5-GiB optimization without changing functional authority.                                                                             |
| v0.3/bootstrap/protocol-0 and withdrawn provider paths | Removed                            | clean-cut design and removal guards                                                  | Do not restore compatibility tests, wrappers, or fallback providers.                                                                                                                                                                                        |

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
- Reviewed source commit: `af008705488a029b95007e25c7c00484387d3ffe`; package execution will use an owned clean detached checkout at that exact commit while ticket evidence remains in the assigned worktree.
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

| Component / Dependency         | Working Directory                 | Setup / Execution                                                                             | Readiness Check                                                                       | Cleanup Method                                                              |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Repository checks              | owned clean exact-source checkout | `npm ci --ignore-scripts`; focused strict native identity; exact `VOICE_GO=... npm run check` | 95/95 Node TAP, 7 Python, all Go/source/schema/evidence checks                        | suite-owned temps                                                           |
| Clean reviewed-source checkout | owned API/E2E temp root           | checkout exact `af008705...`; `npm ci --ignore-scripts`                                       | clean tree and exact commit                                                           | retain owned root for correction rerun                                      |
| M1 preflight                   | actual MacBookPro18,4 host        | owned `caffeinate`; exact Go and CMake paths; preflight CLI                                   | passing v2 JSON, purge capability, six CPU-idle samples, `loaded-host` classification | stop only owned `caffeinate`                                                |
| Closed inputs                  | owned cache/materialized roots    | fill recipe-declared cache objects/checkouts; materializer CLI                                | exact sizes/digests/clean revisions and generated closure/provenance                  | retain owned materialized/cache copies for correction rerun                 |
| Exact corpora                  | owned corpus root                 | byte-copy repository manifests and exact 49/200 referenced WAVs                               | validator/digest/uniqueness/baseline binding                                          | retain owned corpus copy; never mutate preserved study data                 |
| Package/qualification          | owned output roots                | Seatbelt network-denied double builds, verifiers, compliance, conditions, profile runner      | Chinese archives and 260-attempt evidence retained; Summary 2 Fail                    | stop fail-closed; retain owned evidence and exact source for reviewed rerun |

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
| scoring/normalization/resource-policy/trusted-baseline tests                          | product normalization, raw/raw Chinese v2 scorer, exact profile RSS policy, trust closure         | `AC-003`, `AC-007`–`009`, `AC-017`, `AC-023`     | Still Valid            | CRR-033 focused 29/29 and full 95/95 Node Pass                                               | Retain; execute both real packages.                     |
| performance/failure/qualification tests                                               | exact 30/30/100, all-started-attempt retention, pass-only aggregation                             | `AC-003`, `AC-007`, `AC-017`, `AC-020`           | Still Valid            | `CRR-011` accepted current owners                                                            | Retain; populate real M1 evidence.                      |
| `tests/release/trusted-baseline.test.mjs` (`API-VOICE-013`)                           | production corpus validation and English-v2 trust/derivation drift rejection                      | `AC-007`, `AC-009`, `AC-017`; `SR-007`           | Still Valid — Reusable | exact base-to-reviewed-source diff is empty and worktree bytes match source                  | No change; retain.                                      |
| `release/evidence/qualification-corpora/english-v2.json` and baseline                 | sole final 49-WAV English authority                                                               | `API-VOICE-002`; `SR-007`                        | Still Valid — Reusable | `API-VOICE-002` passed previously; exact relevant bytes unchanged                            | Reuse authority result; real package still runs all 49. |
| current QSet/branch projection tests                                                  | reject incomplete, non-pass, drifted, or release-bearing branch evidence                          | current-platform contract                        | Still Valid            | accepted full source review                                                                  | Retain; execute real two-package aggregation.           |
| removed v0.3/bootstrap/protocol-0 tests                                               | obsolete system-Python/bootstrap/schema-2 behavior                                                | clean-cut removal                                | Stale / Remove         | current source guards reject legacy paths                                                    | Keep removed; do not replace for compatibility.         |

Round-15 reuse decision: English-v2 authority and API-VOICE-013 remain reusable only after exact changed-byte validation. Chinese-v2 derivation/trust/scorer/resource-policy source evidence is new current authority and must be rechecked. API-REV-014 runtime artifacts remain immutable historical direct evidence but cannot enter a current-source QSet because scorer/policy/source identities changed. Both current-source profiles must rebuild and fully qualify. No API/E2E-owned durable coverage change is planned.

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

| Order | Command / Action                                                               | Boundary / Scenario                                                                  | Result                                                                      | Evidence                      |
| ----- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| 0     | exact source/authority/contract impact comparison                              | `API-F-011`, `API-F-012`, English reuse, active Chinese v2 absence of legacy/default | Pass                                                                        | `api-rev-015/repository/`     |
| 1     | `npm ci --ignore-scripts`; focused scoring/policy/trust; exact-Go full check   | `API-VOICE-001`, durable authority and policy regressions                            | Pass — 29/29 focused; 95/95 Node; 7/7 Python; all Go/source/schema/evidence | focused/full logs             |
| 2     | fresh Functional Preflight 2                                                   | actual M1, AC/toolchain/Seatbelt/purge, truthful load                                | Pass / controlled — 81.0317% idle, no task-owned competitor                 | `api-rev-015/environment/`    |
| 3     | exact current-source materialization and 49/200 corpus validation              | source-bound closed inputs and scorer-bound corpora                                  | Pass                                                                        | `api-rev-015/inputs/`         |
| 4     | Chinese double build/verify/repro/compliance/full profile                      | direct `API-F-011` / `012` recheck; 30/30/200                                        | **Fail — `API-F-013` at cold attempt 22 `READY_TIMEOUT`**                   | Chinese evidence              |
| 5     | English double build/verify/repro/compliance/full profile                      | current-source 49 WAV; 30/30/100                                                     | Not Tested after mandatory Chinese Fail                                     | fail-closed stop              |
| 6     | Qualification Set 2 -> Branch Catalog Projection 2 -> independent verification | exact two same-source passing profiles                                               | Not Tested after mandatory Chinese Fail                                     | two passing profiles required |

## Post-Repository Confidence Scorecard (Mandatory)

| Confidence Category                                        | Score | What Supports The Score                                    | Remaining Uncertainty                                 | Additional Validation |
| ---------------------------------------------------------- | ----: | ---------------------------------------------------------- | ----------------------------------------------------- | --------------------- |
| Requirement and acceptance-criteria proof                  |   85% | SR-012 authority and CRR-033 source Pass                   | no current-source packages/results                    | full matrix           |
| Changed-boundary execution directness                      |   90% | focused 29/29 scorer/policy/trust tests                    | real Summary/Assessment/QSet not generated            | actual packages       |
| Cross-boundary integration realism and mock gap            |   75% | prior exact packages prove harness reachability            | new scorer/policy identities not exercised end to end | full qualification    |
| Environment, configuration, identity, and fixture fidelity |   85% | actual M1/assets available                                 | fresh preflight/materialization pending               | host setup            |
| Failure, edge-case, lifecycle, and recovery evidence       |   80% | prior lifecycle direct evidence and current durable checks | both new current-source profiles pending              | full profiles         |
| User-surface, browser, and desktop-shell confidence        |   N/A | runtime-only                                               | none                                                  | none                  |
| Durable regression coverage quality and relevance          |   95% | CRR-033 focused 29/29, full 95/95 Node and 7/7 Python      | API execution pending                                 | re-execute            |

- Overall pre-execution confidence: `85%`.
- Every critical acceptance criterion directly proven: `No`.
- Default clean-confidence target met: `No`.

## Broader Validation Decision (Mandatory)

- Decision: **`Required / Executed / Fail`**.
- Selected mode: actual-host native package, CLI, lifecycle, persistent worker, real corpus, resource, compliance, QSet, and projection validation.
- Evidence gained: direct controlled-host proof of exact-source construction, archive reproducibility, package/compliance validity, corrected Chinese resource-policy propagation, 21 successful cold packaged-provider starts, and one retained hard readiness timeout. The timeout prevents current-source Chinese quality completion, English execution, and aggregate identity closure.
- Browser decision: `N/A`; runtime-only.
- Scope constraint: Chinese 4.0-GiB support evidence applies only to this exact darwin-arm64 package and governed M1 Max/64-GiB host; no lower-memory, concurrent, x64, auto, or other-target claim.

## Execution Outcome And New Reroute Trigger

- `API-F-012` is directly resolved at the current package boundary: peak process-tree RSS was `3,944,415,232` bytes, below the exact Chinese hard ceiling `4,294,967,296`; Performance Assessment independently records the `2,684,354,560`-byte optimization miss without changing the hard result.
- `API-F-011` scorer/map/baseline identities propagate through current Summary evidence, but 200-WAV non-regression was not requalified because execution stopped before warm quality attempts.
- `API-F-013` is new. Cold attempts 1–21 succeeded. Successful preparation times rose to `21,018`, `21,070`, `23,316`, `26,989`, and `29,460` ms for the last five successes. Attempt 22 emitted a valid `hello` in `943.551` ms but failed `READY_TIMEOUT` before `inference-ready`; total cold-attempt wall time was `34,884.236` ms.
- The production ledger and Summary both finalize `fail / timeout`; Assessment binds that Summary as `controlled-miss`. No attempt was excluded or retried.
- Post-failure observation remained on AC with no thermal/performance warning, 93% system-wide memory free, and 81.8% idle in the snapshot. This does not override the directly observed hard timeout.
- Preliminary classification: `Unclear` between bounded packaged-provider/runtime reliability and a design-level cold-start deadline/stability issue. `code_reviewer` must perform focused failure-origin review before owner selection.

## Desktop Application Validation Decision

- Desktop framework/shell: `N/A` for this runtime-only ticket.
- Web-equivalent behavior: none.
- Shell-specific behavior: native package launcher/process lifecycle, exercised through CLI/package qualification rather than Electron.
- Effect on any running desktop application: none; no desktop launch or desktop-state mutation.

## Live Environment And Fixture Plan

- Order: exact-source checkout/authority comparison -> focused/full checks -> owned `caffeinate` -> fresh preflight -> current-source materialization/corpora -> Chinese double build/full profile -> English double build/full profile -> QSet 2 -> projection 2 -> independent verification -> cleanup.
- Host: actual MacBookPro18,4 M1 Max / 64 GiB; exact Node/Go/CMake/Xcode/SDK/system identities; AC, low-power off, thermal/memory gates, Seatbelt, exact purge.
- Fixtures: exact English-v2 49 WAVs and Chinese-v2 200 WAVs; scorer/map/trust/profile-policy digests; recipe-owned cache/checkouts.
- No product user state, tag, publication, maintained-main, concurrent-provider, deferred target, or release action.

## Temporary Executable Validation Plan

| Scenario                | Executable Surface                            | Intended Proof                                                                   | Why Temporary                    |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| `API-VOICE-001`         | focused/full exact-source checks              | source/authority/policy regression                                               | durable suites own assertions    |
| `API-VOICE-002` / `013` | exact changed-byte authority validation       | English authority continuity                                                     | unchanged durable owner          |
| `API-VOICE-004` / `011` | two Chinese builds and full actual-M1 profile | raw/raw scorer, 4.0-GiB hard and 2.5-GiB optimization policy, runtime/compliance | generated package evidence       |
| `API-VOICE-003` / `011` | two English builds and full actual-M1 profile | exact English 2.5-GiB policy and full runtime/compliance                         | generated package evidence       |
| `API-VOICE-012`         | QSet 2 and projection 2                       | same-source two-profile aggregate closure                                        | branch/archive-instance-specific |

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

- Proceed To API/E2E Execution: `Completed — API-REV-015 stopped fail closed at API-F-013`.
- Repository-Resident Durable Coverage Will Be Added / Updated / Removed: `No`.
- Current pre-execution confidence: `85%`.
- Broader validation: `Required / Executed / Fail`.
- Prior completed result: `API-REV-014 — Fail / 99%`; current round: **`API-REV-015 — Fail / 99%`**.
- Reroute Required After Execution: `Yes — API-F-013 to code_reviewer for focused failure-origin review`.
- Stop conditions: any package, scorer/trust, hard profile RSS, quality, lifecycle, compliance, evidence-edge, QSet, or projection failure. No threshold/scorer/policy substitution, warm proxy, fallback, tag, publication, or release action.
- Recommended Recipient After Completion: `code_reviewer` for focused `API-F-013` failure-origin review.
