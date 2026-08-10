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
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md` (`SR-024`; preserved SR-021 product basis)
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md` (`ARCH-REV-024 Pass`)
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-handoff.md` (`IR-037`)
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md` (`CRR-058 Pass`)
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md` (`DR-008 Blocked — Design Impact`; API/E2E now returns reviewed `R` before Delivery re-entry)
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-026`
- Current Investigation Round: `26`
- Trigger: Code Reviewer `CRR-058` against focused source `F=b88c230663eb96e0def8c869b095ea858b0ff50b`, admitted source `D=3e8474213f79b26cc7a68c4dd42d2994ebf2d42d`, and reviewed implementation artifact `f9e4cff7ea44c303bb7fd94cff07f4345d51c77d`.
- Prior Investigation Reviewed: `API-REV-025 — Pass / 97%`; its exact five aggregate authority subjects and checksum bundle are the immutable inputs for this zero-profile round.
- Latest Authoritative Investigation: **`API-REV-026 — Pass / 98%`**. Production Admission 4 returns `reuse-permitted`; the sole controller created exact direct-child `R=71f8e7823d876b9c0914bfc7b90b143d851d4875`, and independent verification proves its six-add shape and protected bytes.

## API-REV-026 Zero-Profile Coverage Delta

- Scope classification: repository/release authority only. No runtime, provider, model manager, Store 1, corpus, performance, host archive, browser, desktop, user-state, or external-service execution is justified.
- Exact retained inputs: the five checksum-bound API-REV-025 subjects—Focused Qualification Set 3, Branch Catalog Projection 3, its independent verification, and English/Chinese Profile Execution Closure 2—remain `Still Valid` only if their exact bytes match API-REV-025 `SHA256SUMS.txt`.
- Source/closure decision: from a clean checkout at exactly `D=3e847421...`, run the production Admission 4 assembler over `F..D`, Policy 3, Matrix 2, and the retained equal English/Chinese Host Source Closure 1 identities. Require `218` classified paths, changed-path digest `191b58b2a7ea1ad79e6b06b134bd525380ff88beff45a46fae46e0ee47b3f56d`, both closure equalities, and `reuse-permitted`.
- Promotion decision: invoke only `release/promote-release-authority.mjs`; require it to start from clean `HEAD==D`, find all protected paths absent, validate Admission 4 and API checksums, and stage exactly the fixed six additions under `release/admission/`.
- Commit decision: create one single-parent direct child `R` of `D` containing only those six additions. Independently verify `parent(R)=D`, exact add-only `D..R` shape, ordinary-file modes, protected byte identities, and zero profile/product execution counters.
- Durable coverage inventory:
  - `tests/release/relevant-source-closure-v3.test.mjs`, `tests/release/release-source-admission-verifier.test.mjs`, `tests/release/release-admission-fixture.mjs`, and `tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json`: `Still Valid`; CRR-058 directly confirms their exact/prefix/rename/fail-closed decisions.
  - API-REV-025 aggregate authority files: `Still Valid / Reuse Exact Bytes`; do not regenerate or relabel them.
  - Fixed six `release/admission/` files: `Add Repository-Resident Durable Non-Test Authority`; these are production inputs, not test coverage, and must return through Code Review after commit.
  - API/E2E repository-resident test changes: `None Planned`.
- Broader validation decision: `Required`, limited to the real Git Admission 4/promotion/commit/independent-verification boundary. Expected product/profile execution counts are all zero.
- Stop rule: any subject checksum, Policy 3, closure, ancestry, changed-path, staged-shape, parent, mode, or protected-byte mismatch stops before commit or immediately records a truthful failure. No host/profile rerun, merge, workflow, tag, publication, fallback, or manual file copying outside the promotion owner is permitted.

### API-REV-026 Execution Update

- Exact API-REV-025 authority reuse passed: all `175` checksum rows verify; the five focused subjects keep their original identities and are not regenerated or relabeled.
- Clean-checkout repository proof passed: `npm ci --ignore-scripts`, followed by `npm run check:release-pipeline` at exact `D`, passed `19/19`.
- Production Release Source Admission 4 passed with Policy 3 identity `c7cd2e5e...1e676`, exact `218` changed paths (`25` release-pipeline-only and `193` documentation-record-only), changed-path digest `191b58b2...3f56d`, equal English/Chinese retained Host Source Closures, verified ancestry, and decision `reuse-permitted`. An independent implementation recomputed the Git inventory, classifications, canonical digest, policy identity, five authority identities, and closure equalities.
- The sole promotion controller began from clean `HEAD==D`, validated the checksum/admission authority, and staged exactly the fixed six protected additions. Commit `R=71f8e7823d876b9c0914bfc7b90b143d851d4875` has exactly one parent `D`, only six ordinary `100644` added blobs, and a clean post-commit worktree. Every promoted blob is byte-identical to its admitted source.
- Required counters are all zero: `profileExecutionCount`, `providerLaunchCount`, `modelDownloadCount`, `corpusAttemptCount`, and `performanceTrialCount`. Host builds, release dispatch, tags, publications, and user/desktop-state mutations are also zero.
- Durable coverage decision after execution: API/E2E added, updated, and removed no repository-resident test coverage. The exact six `release/admission/` additions are durable non-test production authority and therefore require full Code Review of `R` before Delivery.
- Final broader-validation decision: `Required — Completed`. Final confidence is `98%`; every applicable scorecard category is at least `97%`. API-REV-025 remains the current product/runtime qualification and is unchanged.

## API-REV-025 Recheck And Coverage Delta

- `API-F-019` recheck: rerun the exact canonical Chinese Runtime Host Archive 2 construction from source `b88c230...`; require the complete production worker to compile and link, then build a second archive and require exact archive/report equality before independent Host Verification 2.
- Prior-resolution preservation: retain complete-manifest one-owner classification (`API-F-018`), the real Chinese builder import boundary (`API-F-016`), and logical verification-root projection (`API-F-017`) under focused repository and actual packaged-host checks.
- Retained environment decision: `Reusable after identity recheck`. The isolated API-REV-024 cache, official CMake 4.2.0, official Go 1.26.5, Xcode/SDK/tool identities, and ownership remain eligible only if their exact authenticated identities still match.
- Retained materialized inputs/host artifacts: `Do Not Relabel`. IR-035 changes Chinese production source and its exact input recipe binding. The Chinese input must be rematerialized. English will be rebuilt or reused only after exact Host Source Closure/input/tool/archive impact proves that current authority permits it; no prior archive will be labeled current merely because source review passed.
- Durable coverage decisions:
  - `tests/build/chinese-worker-native-compile.test.mjs` plus `tests/fixtures/chinese-worker-native-headers-v1/*`: `Still Valid / Added Upstream`; exact Apple-native compile guard for the complete CMake translation set, authenticated external fixture, and current Xcode/SDK identities. It deliberately does not prove link/archive/runtime.
  - `tests/build/host-builder-composition.test.mjs` and exact input-ownership fixtures: `Still Valid`; retain one-owner complete-manifest and builder/verifier composition coverage.
  - `packaging/archive/canonicalzip_test.go`: `Still Valid`; logical `host` projection/non-disclosure remains unchanged.
  - API/E2E plans no repository-resident durable coverage edit unless actual execution exposes a new stable coverage gap.
- Ordered execution: revalidate environment and current materialization; run focused/full repository gates; build Chinese twice and independently verify; establish current-source English archive authority and independently verify; only after every host prerequisite passes continue production Catalog/model install, Store 1 lifecycle, relocated offline retained-clip providers, Profile Execution Closure 2, QSet 3, Projection 3, and exact nonpublishing nine-member composition.
- Stop rule: any critical construction, verification, production installation, provider, or closure mismatch stops downstream aggregation without retry relaxation, provider/model substitution, fallback, or release action.

### API-REV-025 Execution Update

- `API-F-019` is resolved directly: the canonical Chinese build compiles and links the complete production worker, and two independent builds produce the same archive and build report. Chinese archive SHA-256 is `d08bb4775ae1cc599679f3f2675ac81297ed5e6956aabe5c81ff45c2818dcea3`; English archive SHA-256 is `7149be2ebb28ae49e0e88df006e7de9446e9697c1e0b7ada91a82d77405fcbee`. Both Host Verification 2 records Pass with `modelPayloadAbsent: true`.
- The build and nonpublishing composition paths downloaded zero model bytes, ran zero product tests, and launched zero providers. Host packages contain runtime/code only. The two small model-manifest JSON assets are locators and integrity/admission records, not model weights.
- Production Catalog 4 SHA-256 `c6930ab21fc202947259d51fb9c8751758604dc2dc3f5559271bcb2e2256a41f` was rejected before network/store mutation when invalid, then used for one real public immutable model install per profile in isolated Store 1 roots. English installed `481,307,858` bytes and Chinese installed `1,275,804,800` bytes with exact per-file, manifest, tree, activation, pointer, and read-only checks.
- Actual lifecycle proof covers cancellation with retained partials, range resume from the retained weight offset, duplicate-install no-download behavior, clean removal/status, provider lifetime-lease removal rejection, active status during the lease, atomic-pointer stability, clean shutdown, and post-run host/store non-mutation. Repository race/fixture coverage retains the remaining bounded concurrent/failure cases required by `AC-030` and `AC-032`.
- Both relocated providers start and transcribe their retained approved real FLEURS clip under the checked-in deny-network Seatbelt profile with exact historical transcripts. Independent Profile Execution Closure 2 returns `reuse-permitted` for English and Chinese, so `AC-033` authorizes reuse of immutable API-REV-017/018 49/200 and 30/30/100 qualification rather than rerunning it.
- Focused Qualification Set 3 Passes for exact source `b88c230...`; Branch Catalog Projection 3 is independently verified. A local, nonpublishing prepublication composition contains exactly nine assets, covers the eight non-checksum assets in `release-SHA256SUMS.txt`, and passes Prepublication Seal 1. No tag, publication, release, merge, desktop, or user/shared application state was touched.
- One preliminary English startup probe was intentionally excluded from acceptance: it overlapped heavy model transfers and crossed the hello deadline. The canonical isolated rerun under the exact hard deadlines passed; no retry, timeout, provider/model, or threshold was relaxed.
- Durable coverage decision after execution: all relevant current durable scenarios remain valid. IR-035's complete Apple-native translation-set compile guard is directly corroborated by the real archive build. API/E2E added, updated, and removed **no** repository-resident durable coverage.
- Final broader-validation decision: `Required — Completed`. Final confidence is `97%`; every applicable scorecard category is at least `96%` and every critical current-platform criterion has direct or explicitly authorized closure-reuse evidence.

## API-REV-024 Recheck And Coverage Delta

- `API-F-018` recheck: execute the first canonical Chinese construction from exact current source and a freshly materialized complete 3,151-row input subject; require the outer assembler to classify every path exactly once before builder/native/staging work.
- Prior-resolution preservation: keep the real Chinese builder import boundary (`API-F-016`) and logical verification-root projection (`API-F-017`) under focused repository and packaged-host checks.
- Retained environment decision: `Reusable after identity recheck`. API-REV-023 cache objects, official CMake 4.2.0, official Go 1.26.5, Xcode/SDK/tool identities, and isolated ownership are unchanged.
- Retained materialized inputs/host artifacts: `Do Not Relabel`. IR-034 adds `build/profile-builders/host-input-ownership.mjs` to Host Source Closure 1 and changes the source commit, so both profiles will be rematerialized and rebuilt under source `97f3007...`.
- Durable coverage decisions:
  - `tests/build/host-builder-composition.test.mjs`: `Still Valid / Updated Upstream`; it covers exact API-REV-023 48-row English and 3,151-row Chinese path subjects plus ownership negatives and the prior builder/verifier compositions.
  - `tests/fixtures/host-input-ownership/api-rev-023-{english,chinese}-paths.txt.gz`: `Still Valid / Added Upstream`; exact immutable production-manifest path fixtures.
  - `packaging/archive/canonicalzip_test.go`: `Still Valid`; logical `host` projection/non-disclosure remains unchanged.
  - API/E2E plans no durable coverage edit unless actual execution exposes a new distinct boundary.
- Ordered execution: revalidate environment and current materialization; run focused/full repository gates; build Chinese twice and independently verify; build English twice and independently verify; only after all host prerequisites pass continue production Catalog/model install, Store 1 lifecycle, relocated offline retained-clip providers, Profile Execution Closure 2, QSet 3, Projection 3, and exact nonpublishing nine-member composition.
- Stop rule: any critical construction, verification, production installation, provider, or closure mismatch stops downstream aggregation without threshold/provider/model substitution.

### API-REV-024 Execution Update

- Environment/input proof: retained build-environment SHA-256 remains exact at `1ffed2538d3d65c1fbb62d319e7d66d27b840652eca8cb524ae876a68467bf2a`; Go 1.26.5, Node 22.23.1, CMake 4.2.0, AC power, and capacity recheck Pass. Both current profile inputs materialize against source `97f3007...`; current Host Source Closure 1 values are `d7cfe1ff...68134` for English and `571191f2...de02` for Chinese.
- Repository proof: focused ownership/builder/verifier 3/3 Pass; targeted archive/hostverify race and vet Pass; release pipeline 9/9 Pass; full gate 93/93 Node TAP, 7/7 Python plus compileall, and all Go/source/evidence checks Pass.
- `API-F-018`: resolved at the exact production boundary. The complete 3,151-row Chinese manifest passes one-owner classification and the build reaches authenticated CMake compilation.
- `API-F-019`: new `Local Fix`. `providers/chinese-funasr/src/session.cpp` fails to compile at lines 44, 45, and 52 because `sha256_file_incremental_apple()` returns `std::string` while the right operands remain `nlohmann::json` values. The already-validated JSON digests are not extracted as strings before comparison.
- Coverage consequence: current durable tests compile CommonCrypto/preparation components and validate source/contracts, but do not compile the complete `voice-provider-worker` translation set. The full native provider build needs direct durable coverage or an equivalent exact build guard.
- Stop/cleanup: the first Chinese build exits during native compilation and creates no archive. Second Chinese build, English construction, packaged-host verification, model downloads, Store 1, providers, Profile Execution Closure 2, QSet 3, Projection 3, and release composition are Not Tested after the critical `AC-028` failure.

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

| Path / Scenario                                                                                                                                                         | Current Assertion Or Intent                                                  | Related Authority                     | Validity Decision                                 | Evidence                                                                                           | Action                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `modelmanager/internal/catalog_validation_test.go`                                                                                                                      | exact complete ordered Catalog 4 and selected-row binding                    | `AC-029`, `AC-031`                    | Still Valid                                       | CRR-049                                                                                            | run under pinned Go                                                                 |
| `modelmanager/internal/downloader_test.go`                                                                                                                              | resume/restart/oversize/digest/capacity/redirect policy                      | `AC-032`, `AC-034`                    | Still Valid                                       | CRR-049                                                                                            | run; supplement with production CDN and loopback executable probe                   |
| `modelmanager/internal/events_test.go`                                                                                                                                  | operation phase/terminal/privacy contract                                    | `AC-030`                              | Still Valid                                       | IR-032/CRR-049                                                                                     | run                                                                                 |
| `modelstore/{safefs,activation,prune}_test.go`                                                                                                                          | descriptor-relative no-follow safety, snapshots, leases, pruning             | `AC-030`–`AC-032`                     | Still Valid                                       | CRR-049 race/repetition                                                                            | run race suites; supplement on actual macOS filesystem/processes                    |
| `hostverify/verify_test.go`, `launcher/internal/*_test.go`                                                                                                              | host/config/activation/model/lease verification and closed execution         | `AC-028`, `AC-031`, `AC-033`          | Still Valid                                       | CRR-049                                                                                            | run; supplement with real relocated hosts                                           |
| `tests/build/host-source-closure.test.mjs`, `tests/build/reproducibility.test.mjs`                                                                                      | content-derived host identity and archive reproducibility                    | `AC-028`, `AC-035`                    | Still Valid                                       | API-REV-023 current closures derive and repository gates Pass                                      | retain                                                                              |
| `tests/build/host-builder-composition.test.mjs`, `tests/fixtures/host-input-ownership/api-rev-023-{english,chinese}-paths.txt.gz`                                       | real builders/verifier plus exact complete-manifest one-owner classification | `AC-028`                              | Still Valid / Updated Upstream                    | CRR-053 focused 3/3 over exact 48-row English and 3,151-row Chinese subjects plus negatives        | rerun focused/full gates and both real package constructions                        |
| `tests/build/chinese-preparation-runtime.test.mjs` and current source/go guards                                                                                         | selected Chinese preparation, integrity, and source-policy components        | `AC-028`, `AC-033`                    | Needs Update                                      | repository gates Pass, but the real complete `voice-provider-worker` fails compiling `session.cpp` | add exact full native translation-set compilation coverage during source correction |
| `packaging/archive/canonicalzip_test.go`                                                                                                                                | logical verification root and private destination non-disclosure             | `AC-028`                              | Still Valid / Updated Upstream                    | targeted archive race and full gate Pass                                                           | retain; rerun packaged-host verification after construction fix                     |
| `tests/release/{catalog-v4,host-construction-result,host-release-contracts,prepublication-chain,release-source-admission-verifier,relevant-source-closure-v2}.test.mjs` | exact catalog/source/release/nine-member authority                           | `AC-025`–`AC-027`, `AC-035`           | Still Valid                                       | CRR-049 9/9                                                                                        | run; supplement with current focused evidence composition                           |
| `tests/providers/*` and benchmark provider-process tests                                                                                                                | preserved Protocol 1, audio, normalization, session behavior                 | `AC-002`–`AC-011`, `AC-031`, `AC-033` | Still Valid                                       | prior qualification + current source checks                                                        | run; real retained-clip smoke decides closure reuse                                 |
| historical API-REV-017/018 evidence                                                                                                                                     | full current provider/model quality/performance/lifecycle authority          | `AC-033`                              | Still Valid only as exact immutable closure input | checksums required                                                                                 | authenticate and compare; never relabel as current host execution                   |
| old recovery/candidate/self-hosted workflow coverage                                                                                                                    | superseded model-contained release behavior                                  | SR-021 clean cut                      | Stale / Remove already implemented                | source guard / deleted paths                                                                       | confirm absence; no new coverage                                                    |

## Stale Or Obsolete Coverage Decisions

No API/E2E-owned deletion is planned. Obsolete active Catalog 3, Config 1, contained-model, recovery/candidate, and self-hosted-runner coverage was already removed by implementation. Historical ticket/evidence records remain immutable history and are not executed as current behavior.

## Durable Coverage To Add / Update / Remove

- Added upstream and source-reviewed: `tests/build/chinese-worker-native-compile.test.mjs` plus its authenticated eleven-member fixture closes the complete Chinese translation-set compile gap exposed by `API-F-019` while preserving the distinction between compilation and actual link/archive/runtime proof.
- Previously added upstream builder ownership/import and Host Verification 2 regression coverage remains valid for `API-F-016` through `API-F-018`.
- API/E2E plans no repository-resident durable coverage edit in API-REV-025 unless actual execution exposes a new stable regression case.
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

| Issue                                                                                      | Classification           | Evidence                                                       | Recommended Recipient                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `API-F-016` through `API-F-018`                                                            | Resolved                 | CRR-051/053 and API-REV-023/024 focused/live evidence          | None unless the actual packaged-host recheck regresses                 |
| `API-F-019`: complete Chinese worker did not compile due to string/JSON digest comparisons | Local Fix / source fixed | CRR-055 compile guard plus exact source/fixture/recipe binding | API/E2E actual construction recheck; Code Reviewer only on new failure |
| Later actual link/archive/install/provider/closure mismatch, if observed                   | Undetermined             | must be classified from exact API-REV-025 runtime evidence     | Code Reviewer for failure-origin review                                |

## Investigation Decision

- Proceed To Further API/E2E Execution: `Yes`; CRR-055 authorizes the exact Chinese construction recheck and conditional downstream sequence.
- Repository-resident durable coverage will be added/updated/removed: `No` planned by API/E2E; IR-035's upstream compile coverage has already passed full source review.
- Pre-execution confidence: `88.0%`; compilation evidence is strong but critical live host/install/provider/authority boundaries remain unproven.
- Broader validation: `Required`.
- Reroute Required Before Further Execution: `No`.
- Recommended Recipient: none before execution; route any new concrete failure through `code_reviewer`, or a completed Pass through proportional test-code review.
- Notes: no API/E2E-owned durable coverage changed. Do not infer link/archive/runtime success from CRR-055's compile-only result.
