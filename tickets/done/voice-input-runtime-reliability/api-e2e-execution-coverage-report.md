# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts: `on-demand-model-assets.md`, `benchmark-protocol.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, `release-pipeline-ownership.md`, and the preserved backend/English/Chinese/cold-preparation evidence bundles under the requirements ticket root.
- Solution Revision Record: `solution-revision-record.md` (`SR-021`)
- Design Review / Architecture Record: `design-review-report.md`; `architecture-review-revision-record.md` (`ARCH-REV-021 Pass`)
- Implementation Handoff / Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-handoff.md`; `implementation-revision-record.md` (`IR-032`)
- Code Review Report / Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `code-review-revision-record.md` (`CRR-049 Pass`)
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-022`
- Current Execution Round: `22`
- Trigger: `CRR-049` against source `ad7c402d224690584e2da98ec71a73e8b6d4ca36`, reviewed artifact `93c9a6e579d253cfc1e9b5b8f69f22e4f688df9c`.
- Prior Round Reviewed: `API-REV-021 — Blocked / 80%` under the superseded managed model-contained recovery design.
- Latest Authoritative Round: **`API-REV-022 — Fail / 84%`**.

## Investigation And Execution Basis

- Investigation completed before durable coverage changes or final execution: `Yes`.
- Investigation plan followed: `Yes`; execution stopped at the critical actual-host construction/verification prerequisite as required.
- Existing coverage decisions revised during execution: `Yes`. Generic reproducibility/schema coverage remains useful but is now `Needs Update` because it did not load the real Chinese builder or validate a real Go extraction-report projection.
- Reroute required during execution: `Yes`, after `API-F-016` and `API-F-017`.
- Repository-resident durable API/E2E coverage changed: `No`.

## Compatibility / Legacy Scope Check

- Upstream backward compatibility in scope: `No`.
- Compatibility-only behavior observed: `No`.
- Persisted-state decision: `Discard or Rebuild`; no legacy v0.3 state was read or modified.
- Old Catalog 3, Config 1, contained-model, managed recovery/candidate, and self-hosted runner paths remain absent under repository source guards.

## Changed Boundary And Evidence Matrix

| Scenario ID     | Behavior / Criteria                                                | Execution Surface                                                       | Evidence Type       | Result     | Evidence                                                       |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------- | ---------- | -------------------------------------------------------------- |
| `API-VOICE-017` | current-schema repository and legacy removal; `R-025`–`R-029`      | pinned Go/Node/Python repository checks                                 | Durable execution   | Pass       | `api-e2e-evidence/api-rev-022/repository/`                     |
| `API-VOICE-018` | double host construction/equality/verification; `AC-028`, `AC-035` | clean detached actual M1 build, network-denied assembler, real verifier | Live/temporary      | **Fail**   | `host-build/API-VOICE-018-host-build-result.json`              |
| `API-VOICE-019` | complete Catalog 4/host admission before side effects              | public binaries                                                         | Live                | Not Tested | critical host prerequisite failed                              |
| `API-VOICE-020` | production-manifest English/Chinese download, resume, activation   | public HTTPS + isolated Store 1                                         | Live                | Not Tested | critical host prerequisite failed; zero model bytes downloaded |
| `API-VOICE-021` | macOS signal/status/remove/writer/lease/filesystem interleavings   | CLI/process/lifecycle                                                   | Live                | Not Tested | critical host prerequisite failed                              |
| `API-VOICE-022` | relocated offline retained-clip provider smoke                     | public provider under network denial                                    | Live                | Not Tested | critical host prerequisite failed; zero providers launched     |
| `API-VOICE-023` | Profile Execution Closure 2                                        | generator + independent verifier                                        | Temporary authority | Not Tested | requires two verified hosts and smoke results                  |
| `API-VOICE-024` | QSet 3, Projection 3, exact nine assets                            | local nonpublishing release tools                                       | Temporary authority | Not Tested | requires passing profiles/closures                             |

## Repository Coverage Execution

| Order | Command                                                                               | Result                                                                           | Evidence                                                               |
| ----- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | `go test -race ./modelmanager/internal ./modelstore ./launcher/internal ./hostverify` | Pass                                                                             | `repository/focused-go-race.log`                                       |
| 2     | `go test -count=10 ./modelmanager/internal ./modelstore`                              | Pass                                                                             | `repository/focused-go-repeat-10.log`                                  |
| 3     | `VOICE_GO=... npm run check:release-pipeline`                                         | Pass — 9/9                                                                       | `repository/npm-run-check-release-pipeline.log`                        |
| 4     | `VOICE_GO=... npm run check`                                                          | Pass — 91/91 Node TAP, 7/7 Python plus compileall, all Go/source/evidence checks | `repository/npm-run-check.log`                                         |
| 5     | six preserved checksum manifests and JSON parse audit                                 | Pass                                                                             | `repository/preserved-authority-checksums.log`; `json-parse-audit.txt` |

## Validation Confidence Scorecard

| Confidence Category                                 | Post-Repository | Final | Change | Final Evidence / Residual                                                                                             |
| --------------------------------------------------- | --------------: | ----: | -----: | --------------------------------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |             90% |   80% |    -10 | AC-028 actual host prerequisite fails; AC-029–035 live path cannot proceed.                                           |
| Changed-boundary execution directness               |             85% |   90% |     +5 | Actual M1 production commands directly exposed both defects.                                                          |
| Cross-boundary integration realism and mock gap     |             75% |   65% |    -10 | English build crosses real packaging, but verification fails and Chinese/model/provider chain is absent.              |
| Environment/configuration/identity/fixture fidelity |             90% |   98% |     +8 | Exact source, M1 Max, Node 22.23.1, Go 1.26.5, CMake 4.2.0, Xcode/SDK 26.1.1/26.1, authenticated recipes/inputs.      |
| Failure/edge/lifecycle/recovery evidence            |             90% |   90% |      0 | Repository race/negative evidence is strong; live lifecycle was correctly not entered.                                |
| User-surface/browser/desktop-shell confidence       |             N/A |   N/A |      — | runtime-only; desktop deferred.                                                                                       |
| Durable regression coverage quality/relevance       |             98% |   80% |    -18 | Existing suites passed while missing both production composition defects; specific regression additions are required. |

- Overall post-repository confidence: `88.0%`.
- Overall final confidence: `83.8%`, reported as **`84%`**.
- Calculation: simple average across six applicable categories.
- Critical acceptance criteria directly proven: `No`; `AC-028` fails.
- Applicable categories below 90%: requirements proof, cross-boundary integration realism, and durable regression relevance.
- Default 95% target met: `No`.

## Broader Validation Execution

- Mode: local actual-M1 host construction and independent archive verification.
- Setup root: `/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2`.
- Clean source worktree: exact detached `ad7c402d224690584e2da98ec71a73e8b6d4ca36`.
- Tools: Node `v22.23.1`; authenticated Go `1.26.5`; official CMake `4.2.0`; Xcode `26.1.1 (17B100)`; macOS SDK `26.1`; Apple M1 Max / 64 GB; 285+ GiB observed free disk.
- Inputs: exact v2 English/Chinese host recipes hydrated from immutable HTTPS/Git revisions and materialized from clean reviewed source. No model weight was part of the host inputs.

| Step                                    | Expected                                                      | Observed                                                                                                                         | Result                 |
| --------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| English double construction             | identical archive and reports                                 | identical 207,492,896-byte archive SHA `a2463fc5fedcf2c7e96924d4f5df69045b70ca7b5983dad094a40fe9504e53dc`; exact report equality | Pass                   |
| Chinese first construction              | builder loads and reaches native configuration                | ESM link failure: requested `cmakeConfigureArguments` is absent from `host-build-environment.mjs` exports                        | **Fail / API-F-016**   |
| English canonical verification          | verified extraction produces schema-valid Host Verification 2 | Go extractor reports absolute temporary destination in `hostRoot`; schema requires constant `host`                               | **Fail / API-F-017**   |
| Production model/install/provider chain | begins only after both host construction/verification pass    | not entered                                                                                                                      | Not Tested as required |

One earlier verifier invocation followed the README example and omitted the now-required `--build-report`; it failed before verification and is excluded from acceptance. The corrected production command then exposed API-F-017. Delivery documentation must later synchronize the example, but that documentation issue is not the critical source failure classification.

## Platform / Runtime Targets

- OS/platform: macOS 26.5, `darwin-arm64`.
- Hardware: MacBookPro18,4, Apple M1 Max, 64 GB.
- Power/thermal observation: AC power, charged, no recorded thermal/performance/CPU-power warning.
- Browser/desktop: not applicable.

## Lifecycle / Persisted-Data Checks

- Approved decision: `Discard or Rebuild`.
- Representative Store 1 execution: not started because public verified hosts are a prerequisite.
- Legacy state touched: `No`.
- Compatibility fallback observed: `No`.

## Durable Coverage Changed In The Codebase

- Added/updated/removed by API/E2E: `No`.
- Required source-fix regression coverage: load both real host builders; run the real Host Verification 2 projection against a production-shaped extractor report.
- Proportional successful-test review: not applicable because this is a Fail routed for failure-origin review.

## Other Execution Artifacts

| Artifact                                                                             | Purpose                                                               | Retention                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------- |
| `api-e2e-evidence/api-rev-022/repository/`                                           | exact repository/race/checksum evidence                               | durable                                         |
| `api-e2e-evidence/api-rev-022/environment/host-build-environment-v2.json`            | actual authenticated M1 build environment                             | durable                                         |
| `api-e2e-evidence/api-rev-022/host-build/english-host-reproducibility-proof-v2.json` | exact passing English double-build authority                          | durable                                         |
| `api-e2e-evidence/api-rev-022/host-build/API-F-016-*`                                | Chinese production-builder failure                                    | durable                                         |
| `api-e2e-evidence/api-rev-022/host-build/API-F-017-*`                                | English production-verifier failure                                   | durable                                         |
| `/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2`                              | authenticated 2.0-GiB cache/inputs/English archives for bounded rerun | temporarily retained; isolated and process-free |

## Cleanup Performed

| Resource                                         | Cleanup / Retention                                                                       | Result                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------- |
| model manager/provider/network fixture processes | never started                                                                             | none present                |
| build subprocesses                               | exited naturally                                                                          | process scan empty          |
| application/user/legacy store                    | never touched                                                                             | unchanged                   |
| isolated r22 root                                | retained for exact bounded rework rerun to avoid re-downloading authenticated host inputs | 2.0 GiB, no running process |

## Preliminary Classification

- `API-F-016`: `Local Fix` — production Chinese builder imports `cmakeConfigureArguments` from `build/host-build-environment.mjs`, but the symbol is exported by `build/trusted-native-environment.mjs` / `build/resolved-cmake-configuration.mjs`, not by the imported module.
- `API-F-017`: `Local Fix` — the real Go extractor exposes an absolute destination as `VerificationReport.hostRoot`; the strict Host Verification 2 schema and public subject require the canonical root label `host`.
- Both failures are source integration defects missed by the passing repository suites and prior source review. Code Reviewer must confirm origin and route the bounded source/test rework.

## Recommended Recipient

`code_reviewer` for focused failure-origin review of API-F-016/API-F-017. After implementation and source re-review, API/E2E should resume at Chinese double construction and English/Chinese independent verification, reusing the authenticated r22 environment only if all relevant identities remain exact.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final validation confidence: **`84%`**.
- Default 95% target met: `No`.
- Applicable category below 90%: requirements proof, cross-boundary integration realism, durable regression relevance.
- Broader validation decision: `Required and executed until critical prerequisite failure`.
- Critical criteria lacking direct proof: `AC-028` fails; `AC-029`–`AC-035` remain not tested downstream of it.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Notes: zero production model bytes downloaded, zero providers launched, zero GitHub workflows/tags/releases/publications, zero user/shared-state changes.
