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
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/cold-preparation-stability-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/evidence/cold-preparation-stability/`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `N/A`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-017`
- Current Investigation Round: `17`
- Trigger: `CRR-037` Pass for bounded `IR-024` / `CR-F-034` / `API-F-014`; retained product source/runner commit `32829080938911f0f46390a3fd2af823e105bd32`, corrected verifier/test commit `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`, implementation artifact HEAD `3916b0646f5a5d487a066057d35f34a651a58f46`.
- Prior Investigation Reviewed: `API-REV-016 — Fail / 99%`; both immutable profiles passed completely, while QSet 2 rejected ten canonical Chinese Build Input Path 1 routes through the aggregate verifier's obsolete local regex.
- Latest Authoritative Investigation: **`API-REV-017 — Pass / 99%`.** Exact retained profile/assets bytes revalidated; the canonical Build Input Path 1 regression passed 6/6; Qualification Set 2 passed with unchanged product `sourceCommit`/`runnerCommit` and exact corrected `testCommit`; Branch Catalog Projection 2 was generated with exactly two current-matrix entries/assets and independently verified Pass. `API-F-014` is resolved.

## API-REV-017 Aggregate-Only Recheck Pre-Execution Refresh

- Prior failure first: `API-F-014` / `API-VOICE-012` / `AC-006`, `AC-019`, `AC-021`, `AC-023`.
- Correction validity: `verifyBuildBinding()` now delegates the complete manifest path set to canonical `assertBuildInputPathSet()` while retaining schema, nonempty, digest, safe-size, and mode validation. The obsolete local path regex is removed; no substitute grammar was added.
- Exact reuse decision: API-REV-016 English and Chinese qualification directories plus the two archive assets are reusable only if every retained checksum passes and exact relevant-byte/scope review confirms no profile-affecting change. Their embedded `sourceCommit` and `runnerCommit` remain `32829080938911f0f46390a3fd2af823e105bd32`; they must not be relabeled or rewritten.
- New aggregate identity: QSet 2 must record `testCommit` as `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`.
- Execution scope: regenerate QSet 2, generate Branch Catalog Projection 2, independently verify projection bytes and recomputed identities. Do not rerun profiles unless retained bytes or authority changed.
- Durable coverage decision: no API/E2E-owned repository-resident coverage will be added, updated, or removed. The upstream two-file correction and its 6/6 focused regression were source-reviewed at `CRR-037`; this round executes production aggregation only.
- Fail-closed stop: any checksum, identity, QSet, asset, matrix, projection, or independent-verification mismatch is a new Fail. Catalog 3, tag, publication, and release remain prohibited and Delivery-owned.

## Current Requirement And Design Basis

The current release and API/E2E acceptance scope is exactly two packages on the actual MacBookPro18,4 Apple M1 Max / 64 GB host: English `darwin-arm64` using MLX Whisper Small FP16 and Chinese `darwin-arm64` using Fun-ASR-Nano GGUF Q8. English/Chinese `darwin-x64`, `linux-x64`, and `win32-x64` are explicitly `Deferred / Outside Current Release Matrix`; they are not passed, cataloged, published, advertised, or counted in this round's confidence denominator.

Both packages must be materialized from repository recipes and SHA-addressed cache objects/exact clean Git checkouts, built twice under the reviewed network-denied path, verified byte-identical, relocated, run from read-only state without package mutation, and exercised through their public launcher/session/Protocol 1 boundaries. The run must retain all started attempts, execute real English 49-clip and Chinese 200-clip inference, prove quality/non-regression and Simplified Chinese normalization, cover lifecycle/recovery/termination/no-orphan cases including one injected retained failure, and generate privacy-safe evidence.

For Chinese on darwin-arm64, complete manifest integrity remains mandatory before recognizer construction. The current implementation must hash every package file through the one Apple CommonCrypto fixed-1-MiB owner and must fail closed on tamper/open/read/final/closure error; the superseded whole-file implementation and any fallback are invalid. Every Chinese preparation attempt must retain the exact ten private LF-framed stage records, one pre-spawn qualification clock, receipt times and RSS collection windows on that clock, inclusive interval-derived Stage Evidence 1, and a complete-session maximum RSS that remains the sole hard resource value. Private diagnostics never change Protocol 1, retry, worker control, or deadline behavior. Successful preparation with missing/malformed/out-of-order/privacy-unsafe or temporally unavailable stage evidence fails qualification.

Functional Preflight 2 is a critical gate. It authenticates exact Node, Go, CMake, Apple clang/Xcode/SDK, Seatbelt, system-tool, and cache-procedure identities; requires AC power, low-power-off, normal thermal/memory state, owned `caffeinate`, sandbox canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge`; and captures six idle samples once. CPU idle now classifies evidence as `controlled` or `loaded-host` and cannot block functional execution. Each package still requires exactly 30 filesystem-cold trials, 30 warm-preparation trials, and 100 persistent-worker warm requests with every attempt retained. Hard deadlines, exact counts, quality/non-regression, profile-policy RSS/size, package/runtime/lifecycle/compliance/privacy gates remain functional blockers. English hard RSS is 2.5 GiB; Chinese hard RSS is 4.0 GiB, while Chinese 2.5 GiB is Assessment-only optimization evidence. Reference p95 comparisons are independently reported by Performance Assessment 1 and cannot change functional Pass.

After both profiles pass, API/E2E must create Qualification Set 2, then deterministically create Branch Catalog Projection 2 with exactly two local archive entries/assets and independently verify it. Summary 2 owns the functional decision; Performance Assessment 1 owns `controlled-pass|controlled-miss|loaded-host-observation`; QSet 2 binds both without reverse authority. API/E2E must not generate Catalog 3, tag, publish, claim maintained-main reachability, or perform release actions. Delivery alone owns integration refresh, integrated rerun, final release proof, tagging, publication, and published-byte verification.

Persisted user/desktop data is `Not Affected`. This runtime-only work must not touch `~/.autobyteus`, desktop installation state, shared product state, or `autobyteus-web`.

## Changed Behavior Summary

| Behavior ID / Boundary                                 | Change Type                        | Upstream Evidence                                                                    | Coverage Consequence                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current qualification/release matrix                   | Changed                            | `current-platform-qualification.md`; `SR-008`/`SR-009`; `ARCH-REV-010`               | Qualify exactly English and Chinese `darwin-arm64`; classify six former target rows as deferred, not failed or passed.                                                                                                                                       |
| Closed input provisioning                              | Added                              | `build/input-recipes/*-darwin-arm64-v1.json`; `build/materialize-release-inputs.mjs` | Use only recipe-declared cache objects/exact checkouts; no hand-assembled hidden build tree.                                                                                                                                                                 |
| Trusted native build identity                          | Changed                            | `IR-008`–`IR-010`; `CRR-011`                                                         | Run actual preflight and bind the same canonical Go/CMake/tar/tool identities through package assembly.                                                                                                                                                      |
| Filesystem-cold evidence                               | Changed                            | `current-platform-qualification.md`; `AC-020`                                        | Exact successful `sudo -n purge` is mandatory before and during 30 counted cold trials; no warm proxy.                                                                                                                                                       |
| Failure evidence retention                             | Added                              | `IR-008`; `IR-009`; `CRR-011`                                                        | Inject one contract-defined failure and prove atomic partial/raw/index/performance/summary artifacts retain every started attempt without retry.                                                                                                             |
| Compliance/offline evidence                            | Changed                            | repository license policy/generator, Seatbelt owner                                  | Generate exact-package compliance and network-denial evidence; reject unknown/missing/non-redistributable inputs.                                                                                                                                            |
| Branch-only aggregation                                | Changed                            | `SR-010`/`SR-011`; Branch Catalog Projection 2 contracts                             | Produce QSet 2 and independently verified two-entry projection 2 without release identity/publication; bind functional summaries and independent assessments one-way.                                                                                        |
| English-v2 authority                                   | Preserved                          | `SR-007`; `API-REV-002`; `CRR-011`                                                   | Reuse `API-VOICE-002` only because the exact authority/corpus/baseline/validator bytes are unchanged.                                                                                                                                                        |
| Durable production-validator coverage                  | Preserved                          | `API-VOICE-013`; accepted by `CRR-011`                                               | Reuse the accepted durable regression only because its test and production-owner bytes are unchanged.                                                                                                                                                        |
| Actual M1 thermal-state parsing                        | Changed                            | `IR-011`; `CRR-013`; `CR-F-020`                                                      | Re-run the production preflight first. The reviewed parser accepts only the captured exact healthy three-line state, classifies explicit warnings, and fails closed on unknown input.                                                                        |
| Functional/performance separation                      | Changed                            | `SR-010`/`SR-011`; `ARCH-REV-012`; `IR-012`/`IR-013`; `CRR-015`                      | Execute Functional Preflight 2 on the loaded host; preserve all 30/30/100 observations; require functional gates while classifying performance independently.                                                                                                |
| Terminal evidence consistency                          | Changed                            | `IR-013`; `CR-F-021`; `CRR-015`                                                      | Verify real profile/QSet terminal decisions, ledger/Summary consistency, retained non-pass behavior if any gate fails, and one-way Summary -> Assessment -> QSet identity.                                                                                   |
| Seatbelt package-entry composition                     | Changed                            | `IR-014`; `CR-F-022`; `CRR-017`; `API-F-002`                                         | Recheck the exact English production construction first: full authorization outside Seatbelt, then both complete builds inside the unchanged profile with sandbox-safe consumption and no transitive sudo launch.                                            |
| Locked Python archive normalization                    | Changed                            | `IR-015`; `CR-F-023`; `CRR-019`; `API-F-003`                                         | Recheck the exact archive through complete package construction, launcher/runtime relocation, and reproducibility after safe nine-link normalization and console-wrapper/RECORD removal.                                                                     |
| Python runtime closure before package path policy      | Changed                            | `IR-016`; `CR-F-024`; `CRR-020`; `CRR-021`; `API-F-004`                              | Recheck the exact full package boundary. The new structural closure removes installed dependency test/test suites and package-local development include trees while retaining required public runtime APIs; the canonical Go path policy remains unchanged.  |
| Public launcher to contained Python worker             | Changed                            | `IR-017`; `CR-F-025`; `CRR-022`; `CRR-023`; `API-F-005`                              | Recheck the exact compiled, relocated public launcher under Seatbelt. The reviewed bootstrap supplies one validated package-owned import root while retaining `-I -B -X utf8`, closed environment, no PYTHONPATH/CWD/system fallback, and one launcher.      |
| Terminal profile evidence archive projection           | Changed                            | `IR-017`; `CR-F-026`; `CRR-022`; `CRR-023`; `API-F-006`                              | Recheck production-shaped terminal evidence. Summary 2 now projects exactly five archive fields; a failed attempt must retain matching ledger/Summary plus verified Assessment before pass-only rejection.                                                   |
| Shared Build Input Path 1 contract                     | Changed                            | `IR-018`; `CR-F-027`; `CRR-024`; `CRR-025`; `API-F-007`                              | Recheck materialization and verification through one owner. All 3,149 current Chinese records, including the ten routing paths, must pass without rename, omission, projection, or mutation.                                                                 |
| Trusted Apple ranlib command identity                  | Corrected and directly passed      | `IR-019`; `CRR-026`; `CRR-027`; `API-REV-011`; `API-F-008`; `API-REV-012`            | Exact production construction preserved the authenticated `ranlib -> libtool` invocation and successfully built `libggml-base.a`; prior `API-F-008` is resolved at the real boundary.                                                                        |
| Closed native build-tool completeness                  | Corrected and directly passed      | `IR-020`; `CRR-028`; `CRR-029`; `API-REV-012`; `API-F-009`; `API-REV-013`            | Exact `/usr/bin/sed` was captured, bound, live-reverified, exposed in the closed PATH, and executed both locked Metal transformations. Prior `API-F-009` is resolved at the canonical production boundary.                                                   |
| Authenticated Xcode C++ driver invocation              | Corrected and directly passed      | `IR-021`; `CRR-030`; `CRR-031`; `API-REV-013`; `API-F-010`; `API-REV-014`            | Exact construction preserved `clang++ -> clang` semantics through resolved CMake and final linkage; two byte-identical verified Chinese archives directly resolve `API-F-010`.                                                                               |
| Chinese qualification scorer/trust authority           | Corrected; direct recheck required | `SR-012`; `IR-022`; `CRR-033`; `API-F-011`; `API-VOICE-004`                          | Rebuild and run exact Chinese v2 subject. Candidate and baseline must bind the same raw/raw scorer/map/trust identities; retained API-REV-014 re-score is source evidence only.                                                                              |
| Profile-specific resource policy                       | Corrected; direct recheck required | `SR-012`; `IR-022`; `CRR-033`; `API-F-012`; `AC-003`, `AC-017`, `AC-023`             | Rebuild both profiles. Summary must enforce English <=2.5 GiB and Chinese <=4.0 GiB; Assessment must record Chinese 2.5-GiB optimization without changing functional authority.                                                                              |
| Chinese bounded package integrity                      | Corrected; direct recheck required | `SR-013`; `IR-023`; `CRR-035`; `API-F-013`; `R-021`, `AC-024`                        | Rebuild the exact current package and prove all 30 cold plus 30 warm preparations use complete fail-closed manifest verification while remaining within the unchanged 30-second deadline. No old whole-file path or unproved fallback may enter the archive. |
| Preparation Diagnostics / Stage Evidence 1             | Added; direct recheck required     | `SR-014`; `ARCH-REV-015`; `IR-023`; `CRR-035`; `AC-024`                              | Verify exact ten-record byte/LF framing, stage order/durations, one qualification receipt/RSS clock, inclusive overlap/sample IDs, successful-stage coverage, privacy, raw evidence digests, and forward propagation through Summary/Assessment/QSet.        |
| v0.3/bootstrap/protocol-0 and withdrawn provider paths | Removed                            | clean-cut design and removal guards                                                  | Do not restore compatibility tests, wrappers, or fallback providers.                                                                                                                                                                                         |

## Changed Surface And Boundary Classification

| Surface / Boundary                             | Affected? | Actual Changed Boundary                                                                | Repository Evidence Available         | Material Risk Not Exercised By That Evidence                                            | Candidate Broader Validation Mode |
| ---------------------------------------------- | --------- | -------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- |
| Domain / backend logic                         | Yes       | adapters, WAV validation, normalization, scoring, qualification gates                  | Node/Python/Go suites                 | real model load/inference, quality, RSS/latency                                         | CLI/lifecycle                     |
| API / transport / contract                     | Yes       | launcher/session config, Protocol 1, package/archive/evidence schemas                  | strict schema and unit coverage       | full launcher-to-private-worker exchange                                                | CLI/process                       |
| Frontend component / state                     | No        | runtime-only                                                                           | N/A                                   | N/A                                                                                     | None                              |
| Browser integration / user journey             | No        | runtime-only                                                                           | N/A                                   | N/A                                                                                     | None                              |
| Authentication / session / permissions         | Yes       | package-session identity and host purge capability                                     | session/preflight tests               | actual noninteractive purge permission                                                  | actual host preflight             |
| Desktop renderer / web-equivalent UI           | No        | explicitly outside scope                                                               | N/A                                   | N/A                                                                                     | None                              |
| Desktop shell / Electron-specific integration  | No        | explicitly outside scope                                                               | N/A                                   | N/A                                                                                     | None                              |
| Process / lifecycle                            | Yes       | native launcher, recognizer worker, teardown/recovery                                  | mocked lifecycle and launcher tests   | actual model process tree, relocation, no-orphan                                        | lifecycle/CLI                     |
| Private preparation diagnostics / RSS timeline | Yes       | Chinese stderr byte framing, stage order, receipt/RSS windows, inclusive temporal join | focused framing/clock/window fixtures | exact packaged 30 cold and 30 warm preparation records and downstream evidence bindings | actual-target qualification       |
| Persisted-data transition                      | No        | `Not Affected`                                                                         | scope/source guards                   | accidental user-state mutation                                                          | pre/post scope audit              |
| Worker / queue / distributed coordination      | Yes       | one local persistent recognizer and serialized requests                                | state-machine tests                   | recognizer reuse and 100-request process behavior                                       | worker/lifecycle                  |
| External integration                           | Yes       | locked models, Python/native inputs, corpus, toolchain, host                           | digest/recipe/compliance tests        | actual construction, inference, offline and resource proof                              | actual-target qualification       |

## Project Execution Discovery

- Assigned worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime`
- Reviewed source commit: `32829080938911f0f46390a3fd2af823e105bd32`; package execution will use an owned clean detached checkout at that exact commit while ticket evidence remains in the assigned worktree.
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

| Component / Dependency         | Working Directory                 | Setup / Execution                                                                                               | Readiness Check                                                                       | Cleanup Method                                                         |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Repository checks              | owned clean exact-source checkout | `npm ci --ignore-scripts`; focused cold-stability/diagnostic/runtime checks; exact `VOICE_GO=... npm run check` | 109/109 Node TAP, 7 Python, all Go/source/schema/evidence checks                      | suite-owned temps                                                      |
| Clean reviewed-source checkout | owned API/E2E temp root           | checkout exact `328290809...`; `npm ci --ignore-scripts`                                                        | clean tree and exact commit                                                           | retain owned root for correction rerun                                 |
| M1 preflight                   | actual MacBookPro18,4 host        | owned `caffeinate`; exact Go and CMake paths; preflight CLI                                                     | passing v2 JSON, purge capability, six CPU-idle samples, `loaded-host` classification | stop only owned `caffeinate`                                           |
| Closed inputs                  | owned cache/materialized roots    | fill recipe-declared cache objects/checkouts; materializer CLI                                                  | exact sizes/digests/clean revisions and generated closure/provenance                  | retain owned materialized/cache copies for correction rerun            |
| Exact corpora                  | owned corpus root                 | byte-copy repository manifests and exact 49/200 referenced WAVs                                                 | validator/digest/uniqueness/baseline binding                                          | retain owned corpus copy; never mutate preserved study data            |
| Package/qualification          | owned output roots                | Seatbelt network-denied double builds, verifiers, compliance, conditions, profile runner                        | both profiles fully Pass; Chinese stage evidence complete; Summary/Assessment valid   | stop fail-closed on first gate; retain owned evidence and exact source |

## Persisted Data Transition Coverage Basis

- Approved decision: `Not Affected`.
- Evidence: implementation handoff `Persisted Data Transition Check` and design transition section state no supported user-data reader/writer exists in this repository.
- Executed proof: all qualification/checkouts/inputs/corpora/output/session roots were API/E2E-owned; English pre/post package snapshots prove no mutation; no command targeted `~/.autobyteus`; cleanup evidence confirms the unrelated installed user worker remained untouched.
- Migration scenarios: `N/A`.
- Upstream ambiguity: none.

## Existing Durable Coverage Inventory

| Path / Scenario                                                                       | Current Assertion Or Intent                                                                                                   | Related Basis                                    | Validity Decision      | Evidence                                                                                           | Action                                                  |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `tests/build/*`, `tests/contracts/*`, Go launcher/archive tests                       | closed input, archive, launcher, schema and trusted environment rules                                                         | `AC-002`, `AC-006`, `AC-013`, `AC-017`, `AC-020` | Still Valid            | `CRR-011` full suite and focused production tests pass                                             | Retain; supplement with actual packages.                |
| preflight/native-environment tests plus `tests/release/darwin-thermal-state.test.mjs` | exact host/tool/quiescence/purge identity, canonical build entry, and fail-closed thermal parsing                             | `AC-003`, `AC-017`, `AC-020`; `API-F-001`        | Still Valid            | accepted under `CRR-013`; captured healthy fixture is byte-identical to API-REV-003 evidence       | Retain; run actual host preflight.                      |
| `tests/providers/*.py`, protocol/conformance/lifecycle tests                          | audio/session/protocol/outcome/failure semantics                                                                              | `AC-002`–`AC-006`, `AC-013`, `AC-017`            | Still Valid            | 7/7 Python and related Node/Go coverage passed in review                                           | Retain; supplement with real providers.                 |
| preparation diagnostics/session/RSS/runtime tests                                     | CommonCrypto integrity, private framing/order/privacy, shared qualification clock, interval joins, stage-evidence propagation | `R-021`; `AC-024`; `API-F-013`                   | Still Valid            | CRR-035 cold-stability 6/6, focused 28/28, production-shaped 100/100, and native worker build Pass | Retain; supplement with the complete canonical profile. |
| scoring/normalization/resource-policy/trusted-baseline tests                          | product normalization, raw/raw Chinese v2 scorer, exact profile RSS policy, trust closure                                     | `AC-003`, `AC-007`–`009`, `AC-017`, `AC-023`     | Still Valid            | CRR-033 focused 29/29 and full 95/95 Node Pass                                                     | Retain; execute both real packages.                     |
| performance/failure/qualification tests                                               | exact 30/30/100, all-started-attempt retention, pass-only aggregation                                                         | `AC-003`, `AC-007`, `AC-017`, `AC-020`           | Still Valid            | `CRR-011` accepted current owners                                                                  | Retain; populate real M1 evidence.                      |
| `tests/release/trusted-baseline.test.mjs` (`API-VOICE-013`)                           | production corpus validation and English-v2 trust/derivation drift rejection                                                  | `AC-007`, `AC-009`, `AC-017`; `SR-007`           | Still Valid — Reusable | exact base-to-reviewed-source diff is empty and worktree bytes match source                        | No change; retain.                                      |
| `release/evidence/qualification-corpora/english-v2.json` and baseline                 | sole final 49-WAV English authority                                                                                           | `API-VOICE-002`; `SR-007`                        | Still Valid — Reusable | `API-VOICE-002` passed previously; exact relevant bytes unchanged                                  | Reuse authority result; real package still runs all 49. |
| current QSet/branch projection tests                                                  | reject incomplete, non-pass, drifted, or release-bearing branch evidence                                                      | current-platform contract                        | Still Valid            | accepted full source review                                                                        | Retain; execute real two-package aggregation.           |
| removed v0.3/bootstrap/protocol-0 tests                                               | obsolete system-Python/bootstrap/schema-2 behavior                                                                            | clean-cut removal                                | Stale / Remove         | current source guards reject legacy paths                                                          | Keep removed; do not replace for compatibility.         |

Round-16 historical decision: no API-REV-015 profile subject could enter the changed-source QSet, so both exact source `3282908...` profiles were rebuilt and fully qualified in API-REV-016. Round-17 reuse decision: those immutable API-REV-016 subjects are directly reusable because CRR-037 and API/E2E exact scope/checksum validation found no profile-relevant byte or authority change; only the separate aggregate verifier/test commit changed. No API/E2E-owned durable coverage change is planned.

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

| Order | Command / Action                                                                                                             | Boundary / Scenario                                                   | Result                                                                     | Evidence                                          |
| ----: | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
|     0 | refresh investigation and exact CRR-037 scope/reuse decision                                                                 | `API-F-014`; `API-VOICE-012`                                          | Pass; aggregate-only execution authorized, profiles not relabeled or rerun | pre-execution refresh above                       |
|     1 | validate every API-REV-016 checksum, exact correction scope, retained qualification copies, and archive/companion identities | unchanged profile/asset authority                                     | Pass                                                                       | `api-rev-017/repository/`                         |
|     2 | `node --test tests/release/build-input-path-contract.test.mjs`                                                               | canonical Build Input Path 1 and exact retained 3,152-record manifest | Pass, 6/6                                                                  | focused log                                       |
|     3 | production Qualification Set 2 with source/runner `3282908...` and test `5c8afe4...`                                         | prior `API-F-014`; exact two-profile aggregate                        | **Pass**; both profile rows Pass; functional decision Pass                 | `api-rev-017/aggregate/qualification-set-v2.json` |
|     4 | production Branch Catalog Projection 2                                                                                       | exact release-neutral two-entry/two-asset projection                  | **Pass**                                                                   | `branch-catalog-projection-v2.json`               |
|     5 | separately implemented projection verifier                                                                                   | matrix/QSet/entries/assets and byte equality                          | **Pass**; `failureCategory: null`                                          | `branch-catalog-projection-verification-v2.json`  |

## Post-Repository And Final Confidence Scorecard (Mandatory)

| Confidence Category                                        | Post-Repository | Final | Supporting Evidence / Remaining Uncertainty                                                   |
| ---------------------------------------------------------- | --------------: | ----: | --------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof                  |             99% |  100% | both complete profiles, passing QSet, and verified projection directly close current scope    |
| Changed-boundary execution directness                      |            100% |  100% | exact production verifier, composer, projection, and independent verifier                     |
| Cross-boundary integration realism and mock gap            |             99% |  100% | real archives, qualification directories, matrix, asset set, and projection composed together |
| Environment, configuration, identity, and fixture fidelity |             99% |   99% | every retained checksum and identity exact; performance remains loaded-host observational     |
| Failure, edge-case, lifecycle, and recovery evidence       |            100% |  100% | prior failure rechecked first; full API-REV-016 lifecycle evidence remains content-bound      |
| User-surface, browser, and desktop-shell confidence        |             N/A |   N/A | runtime-only; no UI claim                                                                     |
| Durable regression coverage quality and relevance          |             99% |   99% | canonical owner and exact/negative 6/6 coverage; no API-owned durable edit                    |

- Overall post-repository confidence: `99%`.
- Overall final confidence: `99%`, rounded down to preserve the loaded-host performance limitation.
- Every critical acceptance criterion in current scope directly proven: `Yes`.
- Default clean-confidence target met: `Yes`; no applicable category is below `90%`.

## Broader Validation Decision (Mandatory)

- Decision: **`Required / Executed / Pass`**.
- Selected mode: production aggregate composition over immutable real package/profile evidence, followed by release-neutral branch projection and independently implemented byte-level verification.
- Confidence result: `API-F-014` is directly resolved; QSet 2 is functional Pass, Branch Catalog Projection 2 has exactly two current-matrix entries/assets, and independent verification is Pass.
- Browser decision: `N/A`; runtime-only.
- Performance constraint: both profile assessments remain `loaded-host-observation`, not controlled certification. All p95 reference comparisons passed and functional acceptance is unaffected.

## API-REV-017 Execution Outcome And Prior-Failure Recheck

- Retained API-REV-016 evidence checksum validation: every listed byte Pass.
- Changed-byte result: `34c4561... -> 5c8afe4...` changes only `release/evidence/bindings.mjs` and `tests/release/build-input-path-contract.test.mjs`; no later non-ticket production byte changed.
- Retained profile identity: Chinese source/runner `3282908...`, 260/260 Pass, archive `84783c61...2cc3`; English source/runner `3282908...`, 160/160 Pass, archive `9e4d1d59...46f8`. Profiles were neither rerun nor relabeled.
- Focused correction check: 6/6 Pass. The exact Chinese 3,152-record manifest and all ten approved `()`, `[]`, and `+` paths pass canonical `assertBuildInputPathSet()`; unsafe, duplicate, ASCII-case collision, digest, size, and mode failures remain fail closed.
- QSet 2: `functionalDecision: pass`, `performanceAssessment: loaded-host-observation`, `sourceCommit = runnerCommit = 3282908...`, `testCommit = 5c8afe4...`; SHA-256 `c5eaedef...0003`, byte-identical to the CRR-037 production probe.
- Branch Catalog Projection 2: two entries and two exact archives; projection SHA-256 `bcc3b1c2...eddd`; asset-set SHA-256 `47d79c0f...ae05`.
- Independent verifier: `decision: pass`, `failureCategory: null`; recomputed matrix, QSet, entries, asset set, and projection bytes.
- `API-F-014` / `CR-F-034`: **Resolved / Pass** at the exact production aggregate boundary.
- No new failure, workaround, input mutation, retry, threshold/provider/model change, Catalog 3, tag, publication, or release action.

## Desktop Application Validation Decision

- Desktop framework/shell: `N/A` for this runtime-only ticket.
- Web-equivalent behavior: none.
- Native public-package lifecycle: already directly proven and retained from API-REV-016.
- Effect on any running desktop application: none.

## Live Environment And Fixture Plan

- Executed inputs: immutable `/private/tmp/autobyteus-voice-api-e2e-r16-20260804-v3/output/{qualifications,assets}`.
- Execution wrote only `api-e2e-evidence/api-rev-017/`; it did not start a provider, rebuild an archive, invoke purge, modify user state, or require process cleanup.
- Retained profile source/runner identity remained exact; the new QSet records only the reviewed verifier/test commit separately.

## Temporary Executable Validation Plan

| Scenario        | Executable Surface                          | Proof                                                                                               | Result |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| `API-VOICE-012` | corrected production QSet composer/verifier | canonical path authority accepts exact preserved inputs and independently revalidates both profiles | Pass   |
| `API-VOICE-012` | production Branch Catalog Projection 2      | exact two-entry/two-asset release-neutral branch projection                                         | Pass   |
| `API-VOICE-012` | independent projection verifier             | recomputed matrix/QSet/entries/assets and byte identity                                             | Pass   |

## Not Tested / Infeasible / Deferred

| Behavior / Boundary                                                                        | Reason                                     | Risk                                                             | Follow-Up                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------- |
| English/Chinese darwin-x64, linux-x64, win32-x64; `auto`                                   | approved outside current release matrix    | no current-release support claim                                 | future separately reviewed target-expansion tasks |
| controlled-performance certification                                                       | actual accepted run classified loaded-host | functional Pass is proven; performance evidence is observational | optional future controlled-host qualification     |
| desktop microphone/UI/supervision                                                          | runtime-only scope                         | none claimed                                                     | separate desktop task                             |
| maintained-main refresh, integrated rerun, Catalog 3, tag/publication/published-byte proof | Delivery-owned                             | release is not final from API evidence alone                     | Delivery after review-passed API/E2E              |

## Ambiguities Or Reroute Triggers

None active. Any downstream integrated-state checksum, QSet, projection, archive, profile, or publication mismatch must remain fail closed and be routed from Delivery with exact evidence.

## Investigation Decision

- Proceed To API/E2E Execution: `Completed — Pass`.
- Repository-Resident Durable API/E2E Coverage Added / Updated / Removed: `No`.
- Current final confidence: `99%`.
- Broader validation: `Required / Executed / Pass`.
- Prior result: `API-REV-016 — Fail / 99%`; current result: **`API-REV-017 — Pass / 99%`**.
- Open API/E2E failures: none; `API-F-014` is resolved.
- Recommended recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable`, then Delivery.
- Release state: not released; Delivery owns integrated-state refresh, documentation sync, repeated qualification, Catalog 3, tag, publication, and published-byte equality.
