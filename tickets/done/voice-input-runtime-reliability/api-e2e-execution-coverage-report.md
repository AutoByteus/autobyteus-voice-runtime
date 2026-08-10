# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `requirements.md`, `investigation-notes.md`, `design-spec.md`, and still-relevant SR-021 supplements under `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/`.
- Solution / Architecture: `SR-021`; `ARCH-REV-021 Pass`.
- Implementation: `IR-034`; source `97f3007c2a62e5f48acd5fcc8c26d1e38b099850`; artifact `2a4b2ef7eab573388390274b47e1de197fe02d3e`.
- Code Review: `CRR-053 Pass / 9.6`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`.
- API/E2E Revision: `API-REV-024`.
- Prior Result: `API-REV-023 — Fail / 84%` (`API-F-018`).
- Latest Authoritative Result: **`API-REV-024 — Fail / 84%`** (`API-F-019`).

## Investigation And Execution Basis

- Mandatory investigation refreshed before execution: `Yes`.
- Prior failure rechecked first: `Yes`.
- Prior host/input evidence relabeled: `No`; both profile inputs and Host Source Closure 1 records were regenerated for current source.
- Repository-resident durable coverage changed by API/E2E: `No`.
- Broader validation: `Required`; executed through exact current-source Chinese native construction and stopped at its critical compile failure.

## Scenario Matrix

| Scenario        | Requirement / Boundary                                          | Result                            | Evidence                                                                                  |
| --------------- | --------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `API-VOICE-017` | current source, ownership, verifier, release, and legacy guards | Pass                              | `api-e2e-evidence/api-rev-024/repository/`                                                |
| `API-VOICE-018` | `AC-028` two deterministic model-free hosts and verification    | **Fail / API-F-019**              | `host-build/API-F-019-chinese-native-session-compile-failure.json`; `build-chinese-a.log` |
| `API-VOICE-019` | `AC-029` production Catalog 4/CDN install                       | Not Tested after critical failure | fail-closed stop                                                                          |
| `API-VOICE-020` | `AC-030`–`AC-032`, `AC-034` lifecycle/interleavings             | Not Tested after critical failure | fail-closed stop                                                                          |
| `API-VOICE-021` | `AC-031`, `AC-033` relocated offline retained-clip provider     | Not Tested after critical failure | fail-closed stop                                                                          |
| `API-VOICE-022` | Profile Execution Closure 2 reuse decision                      | Not Tested after critical failure | fail-closed stop                                                                          |
| `API-VOICE-023` | Focused Qualification Set 3 / Branch Catalog Projection 3       | Not Tested after critical failure | fail-closed stop                                                                          |
| `API-VOICE-024` | `AC-035` nonpublishing nine-member composition                  | Not Tested after critical failure | fail-closed stop                                                                          |

## Repository Coverage Execution

| Command                                                                  | Result    | Evidence                                                                  |
| ------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------- |
| `VOICE_GO=... node --test tests/build/host-builder-composition.test.mjs` | Pass, 3/3 | real builders, exact full-manifest ownership, logical verifier root       |
| `VOICE_GO=... go test -race ./packaging/archive ./hostverify`            | Pass      | archive/verifier concurrency regression                                   |
| `VOICE_GO=... go vet ./packaging/archive ./hostverify`                   | Pass      | focused static validation                                                 |
| `VOICE_GO=... npm run check:release-pipeline`                            | Pass, 9/9 | current release and clean-cut contracts                                   |
| `VOICE_GO=... npm run check`                                             | Pass      | 93/93 Node TAP, 7/7 Python plus compileall, all Go/source/evidence checks |

## Environment And Input Evidence

- Host: MacBookPro18,4 / Apple M1 Max / 64 GB / macOS 26.5 / AC power.
- Exact tools: Node 22.23.1; official locked Go 1.26.5 darwin/arm64; official CMake 4.2.0; retained Xcode/SDK/native identities.
- Retained environment record SHA-256: `1ffed2538d3d65c1fbb62d319e7d66d27b840652eca8cb524ae876a68467bf2a`, byte-identical to API-REV-023.
- Current Host Source Closure 1: English `d7cfe1ffad1c385492ae6e41283de598b4381b332c435cc2ee215c8b93768134`; Chinese `571191f217d16369b126edfd6944d622207cd32dc8aefedff0e8b9fb4d40de02`.
- Construction network boundary: checked-in macOS deny-network Seatbelt profile.
- Model bytes downloaded: `0`.

## Broader Validation Execution

The canonical first Chinese build used the exact network-denied production assembler, current 3,151-row materialized input subject, current closure, official locked tools, and source `97f3007...`.

Expected: exact input ownership passes, the complete Chinese `voice-provider-worker` compiles, and construction proceeds to archive generation.

Observed: input ownership passes and CMake runs for approximately 164 seconds. Apple Clang rejects `providers/chinese-funasr/src/session.cpp` at three digest comparisons:

- line 44: descriptor SHA `std::string` compared directly with `expected.at("descriptorSha256")` JSON;
- line 45: activation SHA `std::string` compared directly with `config.at("activationSha256")` JSON;
- line 52: model-file SHA `std::string` compared directly with `record.at("sha256")` JSON.

No Chinese archive is created. The second Chinese build, English builds, and independent packaged-host verification are not authorized after this critical failure.

## Prior Failure Resolution

| Prior Failure                                                   | Resolution                                                            | Current Direct Evidence                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `API-F-018` — inner builder rejects outer-owned authority input | **Resolved**                                                          | exact complete Chinese manifest passes ownership and construction reaches native CMake |
| `API-F-016` — invalid Chinese builder import                    | remains resolved                                                      | production builder executes through ownership and native build                         |
| `API-F-017` — invalid public verification root                  | direct regression remains resolved; packaged-host recheck not reached | focused real archive extraction and race checks Pass                                   |

## New Failure

- ID: `API-F-019`.
- Scenario / criterion: `API-VOICE-018`; `AC-028`.
- Preliminary classification: `Local Fix`.
- Source boundary: `providers/chinese-funasr/src/session.cpp` full native translation set.
- Coverage gap: repository checks compile selected Chinese integrity/preparation components but do not compile the complete production `voice-provider-worker`; an exact native-build guard is required or must be explicitly incorporated into the current durable composition suite.
- Required constraint: correct typed extraction without relaxing digest validation, provider/runtime protocol, model identity, or fail-closed behavior.

## Confidence Scorecard

| Category                                    | Score | Basis / Gap                                                                                                     |
| ------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------- |
| requirement and AC proof                    |   80% | critical `AC-028` still fails; downstream ACs unavailable                                                       |
| changed-boundary directness                 |   98% | exact authenticated production CMake/Clang build directly exposes the source defect                             |
| cross-boundary integration realism          |   75% | ownership now crosses correctly, but the full native provider boundary fails                                    |
| environment/configuration/identity fidelity |   98% | exact source, current inputs/closures, official tools, AC power, network denial                                 |
| failure/lifecycle/recovery evidence         |   75% | repository race/lifecycle proof passes; real lifecycle cannot start                                             |
| user/browser/desktop confidence             |   N/A | runtime-only scope; desktop explicitly deferred                                                                 |
| durable regression coverage quality         |   78% | exact ownership coverage is strong, but the complete native translation set is not compiled by repository gates |

Overall confidence: **`84%`** (simple average, rounded). The critical failure independently prevents Pass.

## Durable Coverage Changed In The Codebase

- Added/updated by IR-034, not API/E2E: `tests/build/host-builder-composition.test.mjs`, `tests/fixtures/host-input-ownership/api-rev-023-english-paths.txt.gz`, and `tests/fixtures/host-input-ownership/api-rev-023-chinese-paths.txt.gz`.
- Added, updated, or removed by API/E2E: `None`.
- Current decision: ownership coverage remains valid; complete native Chinese provider compilation coverage `Needs Update`.

## Cleanup And Safety

- Build subprocess exited naturally; no owned process remains.
- No current-source host archive was created.
- No model store, provider, user application state, desktop process, workflow, merge, tag, release, or publication was touched.
- The isolated API/E2E root remains process-free and retained for a bounded rerun.

## Recommended Recipient

`code_reviewer` for focused failure-origin review of `API-F-019`, not successful proportional test-code review.

## Latest Authoritative Result

- Result: **`Fail`**.
- Confidence: **`84%`**.
- New failure: `API-F-019` (`Local Fix`, preliminary).
- Prior failures: `API-F-018` resolved; `API-F-016` remains resolved; `API-F-017` direct regression remains resolved.
- Resume after reviewed correction: first canonical Chinese build, Chinese double-build equality and independent verification, then current-source English double-build/verification and later ordered scenarios.
