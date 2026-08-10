# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `requirements.md`, `investigation-notes.md`, `design-spec.md`, and SR-021 supplements under `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/`.
- Solution / Architecture: `SR-021`; `ARCH-REV-021 Pass`.
- Implementation: `IR-035`; source `b88c230663eb96e0def8c869b095ea858b0ff50b`; reviewed artifact `5a2ec1b95536e8490d00e0359ff75e74f199d8f0`.
- Code Review: `CRR-055 Pass / 9.7`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`.
- API/E2E Revision: `API-REV-025`.
- Prior Result: `API-REV-024 — Fail / 84%` (`API-F-019`).
- Latest Authoritative Result: **`API-REV-025 — Pass / 97%`**.

## Investigation And Execution Basis

- Mandatory coverage investigation refreshed before execution: `Yes`.
- Prior failure rechecked first: `Yes`; the actual Chinese production build, link, archive, and verification boundary resolves `API-F-019`.
- Prior package/profile evidence relabeled: `No`. Both host profiles were materialized and built twice from current source. Historical corpus/performance evidence remains historical and is reused only through exact Profile Execution Closure 2 plus current retained-clip smoke.
- Repository-resident durable coverage changed by API/E2E: `No`.
- Broader validation: `Required — Completed`; actual M1 host builds, public model installs, Store 1 lifecycle, relocated offline providers, focused aggregate authority, and exact local nonpublishing release composition executed.

## Scenario Matrix

| Scenario        | Requirement / Boundary                                                                                     | Result                          | Direct Evidence                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `API-VOICE-017` | current source, complete worker compilation, archive/race/release/legacy guards                            | Pass                            | `api-e2e-evidence/api-rev-025/repository/`                                                                                             |
| `API-VOICE-018` | `AC-028`: two deterministic model-free Runtime Host Archive 2 packages and independent verification        | Pass                            | `host-build/*-host-reproducibility-proof-v2.json`; `*-host-verification-v2.json`                                                       |
| `API-VOICE-019` | `AC-029`, `AC-034`: strict Catalog 4 authority and production immutable model installs                     | Pass                            | `install/invalid-catalog-before-network.*`; `*-installed-store-verification.json`; `*-install-event-verification.json`                 |
| `API-VOICE-020` | `AC-030`–`AC-032`, `AC-034`: signal/resume/status/remove/lease/store lifecycle                             | Pass                            | `install/english-cancel-resume-verification.json`; `english-remove-after-resume-verification.json`; `runtime/*-offline-lifecycle.json` |
| `API-VOICE-021` | `AC-031`, `AC-033`: relocated activated providers, network denial, retained real-audio output, no mutation | Pass                            | `runtime/*-offline-retained-clip-smoke.json`; `post-runtime-no-mutation-verification.json`                                             |
| `API-VOICE-022` | Profile Execution Closure 2 reuse decision                                                                 | Pass / reuse-permitted for both | `aggregate/*-profile-execution-closure-v2.json`; `profile-closure-and-aggregate-verification.json`                                     |
| `API-VOICE-023` | Focused Qualification Set 3 and independently verified Branch Catalog Projection 3                         | Pass                            | `aggregate/focused-qualification-set-v3.json`; `branch-catalog-projection-verification-v3.json`                                        |
| `API-VOICE-024` | `AC-035`: exact nonpublishing nine-asset release composition and seal                                      | Pass                            | `release-composition/exact-nine-asset-composition-verification.json`; `prepublication-seal-v1.json`                                    |

## Repository Coverage Execution

| Command                                                                  | Result    | Evidence                                                                  |
| ------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------- |
| `node --test tests/build/chinese-worker-native-compile.test.mjs`         | Pass, 1/1 | complete declared Apple-native C/C++ worker translation set               |
| `VOICE_GO=... node --test tests/build/host-builder-composition.test.mjs` | Pass      | real English/Chinese builder and verifier composition                     |
| `VOICE_GO=... go test -race ./packaging/archive ./hostverify`            | Pass      | archive/verifier race boundary                                            |
| `VOICE_GO=... npm run check:release-pipeline`                            | Pass, 9/9 | Catalog, release-source, prepublication, and clean-cut release contracts  |
| `VOICE_GO=... npm run check`                                             | Pass      | 94/94 Node TAP, 7/7 Python plus compileall, all Go/source/evidence checks |

## Environment And Input Evidence

- Host: `MacBookPro18,4`, Apple M1 Max, 64 GB, macOS 26.5.2, AC power.
- Exact tools: Node `22.23.1`; official locked Go `1.26.5` darwin/arm64; official CMake `4.2.0`; authenticated Xcode `26.1.1`, SDK `26.1`, compilers, linker, ranlib alias, sed, tar, and closed build environment.
- Environment record SHA-256: `1ffed2538d3d65c1fbb62d319e7d66d27b840652eca8cb524ae876a68467bf2a`.
- English materialized input: 48 records; tree SHA-256 `9ac5940e9fb0d3040701247079530cb66294e360e15c6f7232d076c113ec1cc`; Host Source Closure 1 `d7cfe1ffad1c385492ae6e41283de598b4381b332c435cc2ee215c8b93768134`.
- Chinese materialized input: 3,151 records; tree SHA-256 `d532c9de1aa8d87b9c63354d29638376565d134ef5e2f169a0ab582d5db46cac`; Host Source Closure 1 `705cb2a11ac9c1566344abf519a581747402a6ebc9336f45e1cc414deb4ec5f4`.
- Host construction ran inside the checked-in deny-network macOS Seatbelt profile. Model bytes downloaded during host build: `0`; product tests run during host build: `0`; providers launched during host build: `0`.
- All model/store work used isolated roots below `/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2`; no user/shared installation root was used.

## Host Construction And Verification

| Profile | Archive SHA-256 / Size                                                                 | Double-Build Result            | Independent Verification                                                       |
| ------- | -------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| English | `7149be2ebb28ae49e0e88df006e7de9446e9697c1e0b7ada91a82d77405fcbee` / 207,493,128 bytes | archive and build report equal | Pass; 6,503 entries; `modelPayloadAbsent: true`; relocated logical root `host` |
| Chinese | `d08bb4775ae1cc599679f3f2675ac81297ed5e6956aabe5c81ff45c2818dcea3` / 9,662,381 bytes   | archive and build report equal | Pass; 22 entries; `modelPayloadAbsent: true`; relocated logical root `host`    |

The Chinese build compiles and links the complete production `voice-provider-worker`, directly resolving `API-F-019`. Both host archives contain runtime/code, the host authority, schemas, and notices only. They do not contain model weights. The release model-manifest JSON files are small immutable locator/integrity records, not weights.

## Production Install And Store Lifecycle

- Exact production Catalog 4 SHA-256: `c6930ab21fc202947259d51fb9c8751758604dc2dc3f5559271bcb2e2256a41f`.
- A descriptor-digest mutation is rejected as `catalog-invalid` with exit `5` before network or Store 1 creation.
- English production install streams two exact immutable files totaling `481,307,858` bytes; Chinese streams three exact immutable files totaling `1,275,804,800` bytes. Per-file sizes/SHA-256, manifest SHA-256, tree SHA-256, admission root, compatibility pair, activation, active pointer, permissions, and no-symlink rules all pass.
- Repeat install produces `already-installed` with zero download events for both profiles.
- Actual SIGTERM before commit produces one `cancelled` terminal event and exit `143`; the partial is retained and the next install resumes the weight at byte `66,392,996`, verifies exact final bytes, and commits atomically.
- Removal after the resumed install returns `removed`, leaves no active pointer or model files, and subsequent status is `not-installed`.
- While each real provider holds its lifetime shared lease, `remove-profile` fails with `profile-in-use`, status remains `active`, and the active-pointer digest remains identical before/during/after. Both providers then shut down cleanly.
- Repository race and contract fixtures retain direct coverage for the remaining concurrent-writer, failure, capacity, redirect, oversize, digest, pointer-linearization, and bounded snapshot cases in `AC-030`/`AC-032`.

## Relocated Offline Provider Evidence

Both independently verified hosts were extracted under paths containing spaces and non-ASCII characters. Each public launcher consumed its activated model through Session Config 2 under the checked-in network-denied Seatbelt profile.

| Profile | Lifecycle Ready | Retained Clip                                    | Exact Historical Output |                  Inference |
| ------- | --------------: | ------------------------------------------------ | ----------------------- | -------------------------: |
| English |        4,596 ms | `fleurs-en-1660`, SHA-256 `646dc6c5...b8e8`      | Pass                    | 1,350 ms for 11.52 s audio |
| Chinese |       14,836 ms | `fleurs-zh-1660-r235`, SHA-256 `f24a0329...f865` | Pass                    |    555 ms for 9.60 s audio |

Post-run verification confirms both host closures, activation/pointer identities, and all read-only model files remained exact. No inference-time download occurred.

One preliminary English startup probe overlapped the two heavy model transfers and crossed the hello deadline. It is retained only as a non-authoritative loaded-setup observation and is excluded from acceptance. The canonical isolated run passed the unchanged hard deadlines; no retry, timeout, provider/model, or threshold was relaxed.

## Execution Closure And Aggregate Authority

- English Profile Execution Closure 2: `reuse-permitted`; inference core, path-neutral configuration, exact model identity, trusted output, and named adapter exclusions all equal the immutable API-REV-017/018 subjects.
- Chinese Profile Execution Closure 2: `reuse-permitted` on the same five decision dimensions.
- Focused Qualification Set 3: `pass`, source `b88c230...`, exact two profiles, SHA-256 `61ecbebdd734a8d4bec3e701350aaa5e4bb41af3642acae9f00cc716dea9ccc1`.
- Branch Catalog Projection 3: `pass`, SHA-256 `240b909f1e64c106a6e65e4572cd756816777dd8114f33b5235a5edd00aa691f`; independent verification `pass`.
- Because Profile Execution Closure 2 and both current public-host retained-clip smokes pass, `AC-033` authorizes reuse of the immutable API-REV-017/018 49/200 corpus, 30/30/100, quality, resource, and lifecycle qualification. That historical evidence is not relabeled as current package execution.

## Exact Nonpublishing Release Composition

The local composition path assembled the current focused archives and authority into exactly these nine prospective assets:

1. `voice-host-english-darwin-arm64-1.0.0.zip`
2. `voice-host-chinese-darwin-arm64-1.0.0.zip`
3. `voice-model-english-whisper-small-mlx-fp16-v1.json`
4. `voice-model-chinese-fun-asr-nano-gguf-q8-v1.json`
5. `voice-runtime-catalog-v4.json`
6. `release-qualification-evidence-v4.json`
7. `pretag-release-manifest-v4.json`
8. `THIRD_PARTY_NOTICES.json`
9. `release-SHA256SUMS.txt`

The checksum manifest covers the exact eight preceding non-checksum assets and Prepublication Seal 1 passes. The composition downloaded zero model weights and ran zero product tests. This was local and nonpublishing: no final-main claim, tag, release, upload, or published-byte verification was performed; those remain Delivery-owned.

## Prior Failure Resolution

| Prior Failure                                                   | Resolution                                   | Direct Evidence                                                                      |
| --------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `API-F-019` — Chinese worker digest comparisons fail to compile | **Resolved**                                 | complete production CMake compile/link, two equal archives, Host Verification 2 Pass |
| `API-F-018` — inner builder rejects outer authority input       | remains resolved                             | current exact 3,151-row ownership and both builds Pass                               |
| `API-F-016` — invalid Chinese builder import                    | remains resolved                             | real builder performs the full native build                                          |
| `API-F-017` — invalid extraction logical root                   | **Fully resolved at packaged-host boundary** | both actual archives extract and verify with logical `host` and private destination  |

## Confidence Scorecard

| Category                                            | Score | Basis / Residual                                                                                                                                    |
| --------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| requirement and acceptance-criteria proof           |   98% | all critical current-platform AC-028–AC-035 boundaries are direct or use the explicitly approved AC-033 closure rule                                |
| changed-boundary execution directness               |   98% | exact current source, real archives, real public binaries, real public model bytes, and real retained audio                                         |
| cross-boundary integration realism and mock gap     |   97% | build -> verify -> Catalog -> install -> activate -> offline provider -> aggregate chain is real; remaining release publication is separately owned |
| environment/configuration/identity/fixture fidelity |   98% | exact M1/official toolchain/source/input/catalog/manifest/audio identities and network denial                                                       |
| failure/edge/lifecycle/recovery evidence            |   96% | invalid pre-network authority, cancel/resume, idempotence, remove, lease, status, cleanup, race fixtures, and no mutation                           |
| user/browser/desktop confidence                     |   N/A | runtime-only task; desktop integration is explicitly deferred                                                                                       |
| durable regression coverage quality and relevance   |   96% | full checked-in gate plus exact complete worker compile/ownership/race/release coverage; API/E2E needed no durable edit                             |

Overall confidence: **`97%`** (simple average, rounded). No applicable category is below `96%`, and no critical current-platform criterion is missing.

## Durable Coverage Changed In The Codebase

- Added/updated upstream and already source-reviewed in IR-035/CRR-055: `tests/build/chinese-worker-native-compile.test.mjs` and its authenticated fixture.
- Added, updated, or removed by API/E2E in API-REV-025: **None**.
- Current validity: all relevant durable coverage is `Still Valid`; the new complete-worker compile guard is directly corroborated by the actual linked archive.
- Proportional API/E2E test-code review requested: `Not Applicable` unless Code Reviewer identifies an execution-artifact issue; no repository-resident durable coverage changed.

## Cleanup And Safety

- No owned `voice-provider`, `voice-model-manager`, download, or harness process remains.
- No user/shared Store 1, desktop process, application data, GitHub workflow, merge, tag, release, or publication was touched.
- Isolated downloads, stores, archives, and temporary harnesses remain below `/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2` as reproducible local evidence; they are not product/repository state.
- Full raw install streams are retained in gzip form; compact independent verification records are repository-visible under `api-e2e-evidence/api-rev-025/`.

## Residual Scope

- Delivery still owns maintained-main integration, standard-hosted host-only build equality, tag/release/publication, and downloaded-byte verification.
- macOS x64, Linux, Windows, `auto`, and desktop UI integration remain explicitly deferred and are not generalized from this M1 result.
- The current Pass supports the exact darwin-arm64 English and Chinese host/model pairs only.

## Recommended Recipient

`code_reviewer` for the required proportional API/E2E test-code review. Expected disposition: `Not Applicable`, because API/E2E changed no repository-resident durable coverage.

## Latest Authoritative Result

- Result: **`Pass`**.
- Confidence: **`97%`**.
- Broader validation: **`Required — Completed`**.
- Prior failure: `API-F-019` resolved; `API-F-016` through `API-F-018` remain resolved.
- Durable API/E2E coverage changes: `None`.
