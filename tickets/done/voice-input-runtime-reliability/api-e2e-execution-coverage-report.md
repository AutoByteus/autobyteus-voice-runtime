# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts: `on-demand-model-assets.md`, `benchmark-protocol.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, `release-pipeline-ownership.md`, and preserved backend/English/Chinese/cold-preparation authority bundles.
- Solution / Architecture: `SR-021`; `ARCH-REV-021 Pass`.
- Implementation: `IR-033`; source `4db8bf26708309440c83ec56973250f77e9f1619`; artifact `bd70e942dd6ed3b49d7db5221dfe13f14b44032f`.
- Code Review: `CRR-051 Pass / 9.5`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`.
- API/E2E Revision: `API-REV-023`.
- Prior Result: `API-REV-022 — Fail / 84%` (`API-F-016`, `API-F-017`).
- Latest Authoritative Result: **`API-REV-023 — Fail / 84%`** (`API-F-018`).

## Investigation And Execution Basis

- Mandatory investigation refreshed before execution: `Yes`.
- Prior failures rechecked first: `Yes`.
- Retained API-REV-022 archive relabeled: `No`; current evidence rematerialized against source `4db8bf2...`.
- Repository-resident durable API/E2E coverage changed by API/E2E: `No`.
- Broader validation decision: `Required`; started at exact production host construction and stopped at the critical first-profile failure.

## Compatibility / Legacy Scope Check

- Approved persisted-data decision: `Discard or Rebuild`.
- Legacy compatibility in scope: `No`.
- Legacy/user Store 1 touched: `No`.
- Model-contained packages, Config 1, Catalog 3, managed recovery, and self-hosted runner paths remain outside current source and were not revived.

## Scenario Matrix

| Scenario        | Requirement / Boundary                                                   | Execution                                                                        | Result               | Evidence                                                                              |
| --------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `API-VOICE-017` | current repository and legacy guards                                     | focused composition, archive race, release pipeline, full pinned gate            | Pass                 | `api-e2e-evidence/api-rev-023/repository/`                                            |
| `API-VOICE-018` | `AC-028` two deterministic model-free hosts and independent verification | current inputs/closures, then first canonical Chinese build under network denial | **Fail / API-F-018** | `host-build/API-F-018-chinese-host-input-closure-failure.json`; `build-chinese-a.log` |
| `API-VOICE-019` | `AC-029` production Catalog 4/CDN install                                | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |
| `API-VOICE-020` | `AC-030`–`AC-032`, `AC-034` lifecycle/resume/cancel/status/remove/lease  | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |
| `API-VOICE-021` | `AC-031`, `AC-033` relocated offline retained-clip providers             | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |
| `API-VOICE-022` | Profile Execution Closure 2 reuse decision                               | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |
| `API-VOICE-023` | Focused Qualification Set 3 and Branch Catalog Projection 3              | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |
| `API-VOICE-024` | `AC-035` exact nonpublishing nine-member composition                     | prohibited after critical construction failure                                   | Not Tested           | fail-closed stop                                                                      |

## Repository Coverage Execution

| Command / Mode                                                                                                   | Result    | Direct Evidence                                                             |
| ---------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go node --test tests/build/host-builder-composition.test.mjs` | Pass, 2/2 | both builder module graphs load; real small archive projects logical `host` |
| `VOICE_GO=... go test -race ./packaging/archive`                                                                 | Pass      | direct logical-root/non-disclosure archive regression under race detector   |
| `VOICE_GO=... npm run check:release-pipeline`                                                                    | Pass, 9/9 | current release contracts and clean-cut source guards                       |
| `VOICE_GO=... npm run check`                                                                                     | Pass      | 93/93 Node TAP, 7/7 Python plus compileall, all Go/source/evidence checks   |

The first focused invocation omitted required `VOICE_GO`, failed only its environment assertion, and is retained as `focused-host-builder-composition-attempt-1-invalid.*`. The exact corrected invocation above is authoritative.

## Environment And Input Evidence

- Host: MacBookPro18,4 / Apple M1 Max / 64 GB / macOS 26.5 / AC power.
- Node: 22.23.1. Go: official locked 1.26.5 darwin/arm64. CMake: official 4.2.0.
- Retained environment record SHA-256: `1ffed2538d3d65c1fbb62d319e7d66d27b840652eca8cb524ae876a68467bf2a`, byte-identical to API-REV-022.
- Current English materialized tree: `9ac5940e086bc8c962573e27efc06c554817e332ce326e34ceaee7b7ce5ec1cc`; Host Source Closure 1: `61ffa719c21f334bf3174a52e109140aea543dbf2bea46f5ecbd34af4b44014c`.
- Current Chinese materialized tree: `4097a48395123ee15b486ecf6d65d69dfc7b75e5c03cbb90c5e9783e19f422bf`; Host Source Closure 1: `68977e18233b2a157f4c7c2eb9085bd83e9a91657119b30fa82f5786368b6762`.
- Network boundary: checked-in macOS deny-network Seatbelt profile.
- Model bytes downloaded: `0`.

## Broader Validation Execution

The canonical current-source Chinese build was invoked as:

```text
/usr/bin/sandbox-exec -f benchmark/sandbox/darwin-arm64-network-denied-v1.sb \
  node build/host-package-assembler.mjs \
  --profile chinese --target darwin-arm64 \
  --inputs /private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2/inputs-r23-v1/chinese \
  --output /private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2/builds-r23-v1/chinese-a/voice-host-chinese-darwin-arm64-1.0.0.zip \
  --go /tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go \
  --build-environment /private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2/evidence/host-build-environment-v2.json \
  --expected-host-source-closure 68977e18233b2a157f4c7c2eb9085bd83e9a91657119b30fa82f5786368b6762 \
  --source-commit 4db8bf26708309440c83ec56973250f77e9f1619 --version 1.0.0
```

Expected: the builder accepts the complete authenticated input manifest, consumes profile-native inputs, leaves the two `host-authority/*` inputs for the outer assembler, and proceeds to CMake/archive construction.

Observed: the corrected module loads, but `assertHostInputClosure()` rejects `host-authority/model-admission-root-v1.json` as having no consumer. The outer assembler is the later intended consumer. Exit is nonzero before CMake; no Chinese archive exists.

## Prior Failure Resolution

| Prior Failure                                                        | Resolution                                                       | Current Evidence                                                                                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `API-F-016` — invalid Chinese builder import                         | **Resolved at exact boundary**                                   | production builder loads and reaches input-consumer closure; focused real-builder test Pass                                   |
| `API-F-017` — extractor disclosed absolute destination as `hostRoot` | **Resolved in direct regression; full-host recheck not reached** | real small canonical archive extraction and archive race coverage project exact logical `host` without destination disclosure |

## New Failure

- ID: `API-F-018`.
- Acceptance/scenario: `AC-028`; `API-VOICE-018`.
- Preliminary classification: `Local Fix`.
- Source boundary: `build/profile-builders/funasr-host.mjs` / `build/profile-builders/host-common.mjs` complete-input consumer ownership versus `build/host-package-assembler.mjs` outer authority staging.
- Why source review is required: the newly added durable test proves module instantiation, not canonical full-manifest builder execution; the correct owner must preserve fail-closed unused-input detection while recognizing inputs intentionally consumed by the outer assembler.

## Validation Confidence Scorecard

| Category                                            | Score | Evidence / Gap                                                                                                             |
| --------------------------------------------------- | ----: | -------------------------------------------------------------------------------------------------------------------------- |
| requirement and AC proof                            |   80% | repository evidence is strong, but critical `AC-028` fails and downstream ACs remain unexecuted                            |
| changed-boundary execution directness               |   95% | exact production assembler, authenticated real inputs, and network-denied host environment directly expose the defect      |
| cross-boundary integration realism / mock gap       |   75% | the first real builder/outer-assembler boundary fails; later boundaries are unavailable                                    |
| environment/configuration/identity/fixture fidelity |   98% | exact current source, official locked tools, byte-identical environment record, current input/closure identities, AC power |
| failure/edge/lifecycle/recovery evidence            |   75% | repository race/lifecycle coverage passes, but real lifecycle journeys cannot start                                        |
| user/browser/desktop confidence                     |   N/A | explicitly out of current runtime-only scope                                                                               |
| durable regression coverage quality/relevance       |   82% | new coverage resolves prior defects but misses the complete production manifest ownership path                             |

Overall confidence: **`84%`** (simple average of applicable categories, rounded). A critical criterion fails, so confidence cannot produce Pass.

## Durable Coverage Changed In The Codebase

- Added by IR-033, not API/E2E: `tests/build/host-builder-composition.test.mjs`.
- Updated by IR-033, not API/E2E: `packaging/archive/canonicalzip_test.go`.
- Added, updated, or removed by API/E2E in API-REV-023: `None`.
- Current validity decision: the Go logical-root coverage remains valid; the Node production-composition coverage `Needs Update` to include a complete authenticated Chinese input manifest and outer-consumer ownership.

## Cleanup And Safety

- Build subprocess exited naturally; no owned process remains.
- No Chinese archive was created.
- Current-source English build was not started after the critical Chinese failure; API-REV-022 English evidence remains historical and was not relabeled.
- No model store, provider, user application state, desktop process, GitHub workflow, merge, tag, release, or publication was touched.
- The isolated API/E2E root remains retained and process-free for a bounded rerun after source correction.

## Recommended Recipient

`code_reviewer` for focused failure-origin review of `API-F-018`, not successful proportional test-code review.

## Latest Authoritative Result

- Result: **`Fail`**.
- Confidence: **`84%`**.
- Broader validation: `Required and executed until critical prerequisite failure`.
- New failure: `API-F-018` (`Local Fix`, preliminary).
- Prior failures: `API-F-016` resolved; `API-F-017` directly resolved but full packaged-host recheck remains downstream.
- Resume point after reviewed correction: first canonical Chinese build, Chinese double-build equality and independent verification, then current-source English double build/verification and remaining ordered scenarios.
