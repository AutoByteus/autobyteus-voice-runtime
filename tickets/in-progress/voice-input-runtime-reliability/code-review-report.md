# Code Review Report

## Review Round Meta

- Review Entry Point: `Implementation Review`
- Requirements Doc Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts Reviewed As Context:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
- Solution Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Relevant Solution Revision IDs: `SR-001`, `SR-002`, `SR-003`
- Design Review Report Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Relevant Architecture Review Revision IDs: `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`
- Implementation Handoff Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Relevant Implementation Revision IDs: `IR-001`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Current Code Review Revision ID: `CRR-001`
- Current Review Round: `1`
- Trigger: Implementation Engineer submitted runtime source commit `c24c03fde5784967b8d8394ec04de4d700584d47` and handoff commit `89348070ae36d3075d25fadd708ff596c6e5a76f` after `ARCH-REV-003 Pass`.
- Prior Review Round Reviewed: `N/A`
- Latest Authoritative Round: `1`
- Coverage Investigation Reviewed (failure-origin entry point): `N/A`
- Execution Coverage Report Reviewed (failure-origin entry point): `N/A`
- API/E2E Revision Record Reviewed (failure-origin entry point): `N/A`
- Relevant API/E2E Revision IDs: `N/A`
- Delivery Revision Record Reviewed (delivery re-entry only): `N/A`
- Relevant Delivery Revision IDs: `N/A`
- Failing Scenario IDs: `N/A — implementation review findings`
- Exact Failing Commands / Execution Mode:
  - `npm run check` — Pass, 13/13 tests.
  - `git diff --check 251eab80a1cfd6a6d4c4d2a1fdbe1c06c3923dde..c24c03fde5784967b8d8394ec04de4d700584d47` — Pass.
  - Targeted release-evidence probe — `assertReleaseEvidence()` accepted an `AC-016` `preserve` record with no performance object, no baseline identity, no failed-improvement evidence, and runner commit `0000000000000000000000000000000000000000`.
  - Targeted metric probe — `errorRate('軟體', '软件', mandarinUnits)` returned CER `1.0`, contradicting the approved same Simplified-normalization scoring rule.
- Failure Evidence Paths: Source lines cited below; no separate durable execution log was needed for these deterministic source findings.

## Review Scope

- Changed implementation and behavior reviewed: Clean-cut Python-to-bundled-Node provider replacement; Provider Session Configuration V1; protocol 1 worker/client lifecycle; verified package/model identity; sherpa recognizer, WAV/no-speech gate, transcript normalization; benchmark, model-selection, reproducible packaging, evidence, manifest-schema-3, release verification, and release workflow; legacy removal.
- Files / areas reviewed: Complete diff from deployed v0.3 base `251eab80a1cfd6a6d4c4d2a1fdbe1c06c3923dde` to implementation source commit `c24c03fde5784967b8d8394ec04de4d700584d47`, including `runtime/`, `benchmark/`, `scripts/`, `startup/`, `protocol/`, `metadata/`, tests, package metadata, notices/licenses, documentation, and `.github/workflows/release-voice-runtime.yml`.
- Explicit exclusions: Desktop/superrepo capture, installation, supervision, prewarming, UI, schema-2 cutover, and active-installation implementation; actual licensed-corpus selection, 30-cold/100-warm acceptance execution, all-target execution, formal license approval, maintained-main reconciliation, tagging, and publication remain downstream execution/delivery work. Exclusion from execution does not exclude review of whether source gates those operations correctly.

## Upstream Behavior And Production-Path Basis Confirmation

- Approved requirements basis understood: Yes. The current ticket must independently produce and prove one self-contained runtime provider, apply the approved model decision lanes, reconcile maintained `main`, and only then tag/publish. Desktop behavior remains outside current source scope.
- Design-spec behavior map verified against the implementation: Partially. The provider startup/identity/inference spine is present, but the current-client failure spine, benchmark/evidence authority, model-selection spine, and release ordering diverge from `DS-004`, `DS-011`, and `DS-012`.
- Design review report and round confirmed: `ARCH-REV-003`, round 3, `Pass` against `SR-003`.
- Behavior-basis status: `Confirmed`
- Changed or newly discovered behavior, if any: None. Findings concern implementation of already-approved contract and operational paths.
- Remaining material ambiguity, if any: None.

| Behavior ID | Current Status | Current Implementation Path And Lifecycle Evidence | Contradicting Or Newly Discovered Supported Behavior Evidence |
| --- | --- | --- | --- |
| `BEH-001`, `BEH-011` | Confirmed | No desktop/superrepo source was changed; capture and installation/cutover remain future-ticket subjects. | N/A |
| `BEH-002` | Confirmed | `voice-input-worker.cjs` emits verified `hello`, then `model-preparing`, then `inference-ready` after recognizer creation. | N/A |
| `BEH-003`, `BEH-004` | Contradicted in current-client failure lifecycle | `benchmark/providerClient.mjs` owns exact-provider client states and deadlines, but timeout/protocol/write failures do not consistently invalidate and boundedly terminate the session. | `AC-004`/`AC-005` and the runtime contract explicitly require current clients to reject pending work and perform bounded termination/recovery. See `CR-F-001`. |
| `BEH-005`, `BEH-012` | Confirmed in package construction; contradicted in proof authority | Runtime/model construction is self-contained and no Python production path remains. Release evidence does not bind all claimed proof to the exact baseline/candidate/release identities. | `AC-006`, `AC-017`, and the benchmark evidence contract require exact host/runtime/model/configuration identity. See `CR-F-002`. |
| `BEH-006` | Contradicted in decision/scoring implementation | SenseVoice and Whisper tagged configurations exist, but the approved candidate ordering/history and same Simplified-normalization metric are not enforced. | Benchmark Decision Rules 2, 5, and 7 plus the Normalization And Metrics section. See `CR-F-003` and `CR-F-004`. |
| `BEH-007` | Contradicted | A pushed `v*` tag starts the workflow; maintained-main ancestry/evidence checks occur later in `release-gate`. | Approved order is proof -> refreshed/reconciled main -> reachability -> tag/publication. See `CR-F-006`. |
| `BEH-008` | Contradicted in corpus/evidence acceptance | Runtime stderr is safe and capped; durable evidence is aggregate-only. The corpus runner does not enforce the schema's redistribution/consent facts before selection. | Approved corpus/privacy/provenance contract. See `CR-F-005`. |
| `BEH-009` | Confirmed for provider startup/worker; contradicted for client invalidation | One startup command, schema 1, protocol 1, and manifest 3 exist with strict pre-hello identity binding. The current client generic inbox/waiter path does not immediately reject every out-of-state/unknown/late message and boundedly terminate. | Runtime contract framing/lifecycle rules and `AC-005`. See `CR-F-001`. |
| `BEH-010` | Confirmed for current provider portion | One verified session feeds one recognizer and capability declares one in-flight request; desktop multi-window/idle ownership is correctly deferred. | N/A |

## Structural / Design Checks

| Check | Result | Evidence | Required Action |
| --- | --- | --- | --- |
| Task design health assessment is present, evidence-backed, and preserved by the implementation | Pass | Handoff preserves the approved boundary/ownership and clean-cut posture. | None. |
| Implementation matches approved behavior-defining supplemental artifacts | Fail | Current-client recovery, evidence identity, selection ordering/history, scoring normalization, corpus provenance, and tag ordering diverge from `benchmark-protocol.md` and `voice-runtime-contract.md`. | Resolve `CR-F-001`–`CR-F-006`. |
| Data-flow spine inventory clarity and preservation under shared principles | Fail | Provider spine is clear; failure/recovery and release-selection spines do not reach their required terminal states truthfully. | Make client failure terminal/owned and make evidence/tag stages fail closed in approved order. |
| Ownership boundary preservation and clarity | Fail | Production provider ownership is strong. `ProviderClient` has state but generic waiter/inbox machinery bypasses legal-state ownership; release verification trusts caller-authored gate booleans rather than owning evidence validation. | Strengthen the two existing owners; do not add caller throttles or alternate paths. |
| Off-spine concern clarity | Pass | Asset integrity, descriptors, recognizer, normalization, WAV inspection, metrics, build, and verification have clear subjects. | None. |
| Existing capability/subsystem reuse check | Pass | Existing runtime build/release area was replaced/extended rather than shadowed by a parallel provider. | None. |
| Reusable owned structures check | Fail | Approved thresholds are duplicated in `benchmark/metrics.mjs` and `scripts/assemble-release-evidence.mjs`; evidence identity/history is reduced to loose booleans. | Centralize lane evaluation and define one strict evidence subject carrying verifiable inputs/results. |
| Shared-structure/data-model tightness check | Fail | Release evidence can omit performance, baseline identity, descriptor/configuration digests, and failed-candidate history while passing `assertReleaseEvidence()`. | Tighten and strictly decode the evidence model; verify rather than trust derived booleans. |
| Repeated coordination ownership check | Fail | Quality thresholds are repeated and release selection is split between metadata lookup, assembler booleans, evidence assertion, manifest generation, and workflow without one complete decision invariant. | Put the approved decision and proof validation under one release-evidence owner. |
| Empty indirection check | Pass | Files own validation, transformation, orchestration, or public boundaries; no pass-through-only layer was found. | None. |
| Scope-appropriate separation of concerns and file responsibility clarity | Pass | Runtime/startup/protocol/benchmark/build/release concerns are well separated and files stay focused. | Preserve while fixing findings. |
| Ownership-driven dependency check | Pass | Worker depends inward on verified session/protocol/inference concerns; scripts consume runtime-owned contracts without desktop dependencies. | None. |
| Authoritative Boundary Rule check | Fail | Manifest/release callers can treat `assertReleaseEvidence()` as authoritative even though it accepts caller-authored gate summaries that are not tied to raw benchmark/package proof. | Make the verifier the sole decoded, recomputed evidence boundary. |
| File placement check | Pass | Folder placement matches the reviewed runtime-only mapping. | None. |
| Flat-vs-over-split layout judgment | Pass | The small repository's flat concern folders are readable; no artificial splitting was found. | None. |
| Interface/API/query/command/service-method boundary clarity | Pass | One fixed startup command/config, strict worker messages, and discriminated recognizer configs are clear. | Keep the public provider contract unchanged while fixing client/evidence internals. |
| Naming quality and naming-to-responsibility alignment check | Pass | Names such as `ProviderClient`, `VerifiedProviderSession`, `SherpaOfflineRecognizer`, and release-evidence scripts match their intended subjects. | None. |
| No unjustified duplication of code / repeated structures in changed scope | Fail | Model-quality thresholds are implemented twice. | Remove duplicated threshold policy. |
| Patch-on-patch complexity control | Pass | The implementation is a clean replacement, not layered compatibility patches. | None. |
| Dead/obsolete code cleanup completeness in changed scope | Pass | Python worker, requirements/bootstrap, shell/cmd launchers, schema-2/protocol-0 production paths, old build script, and obsolete tests were removed. | None. |
| Relevant test scenarios and assertions are clear and requirement-aligned | Fail | Tests pass, but the release-evidence test constructs a passing record with no raw performance/identity proof; timeout/invalidation, corpus-provenance, candidate-history, tag-ordering, and normalization-equivalence scenarios are absent. | Add focused tests with the source corrections. |
| Test fixtures/helpers are reasonably reusable and test structure remains coherent | Pass | `packageFixture.mjs` coherently serves provider tests; component/contract tests remain navigable. | None. |
| No stale, duplicated, or compatibility-only tests are retained in changed scope | Pass | Obsolete Python/schema-2 tests were removed and v0.3 remains benchmark-only. | None. |
| API/E2E readiness for the next workflow stage | Fail | API/E2E cannot rely on current failure recovery or release evidence to classify acceptance truthfully. | Rework and return through source review before API/E2E. |

## Source File Size And Structure Audit

Tests, fixtures, license texts, docs, and generated lockfile content are excluded from source limits. Every changed implementation-source file was checked. `protocol/voice-input-protocol-v1.schema.json` and the release workflow exceed the `>220` delta signal but not the `>500` effective-line hard limit; both remain coherent single contract/workflow subjects, so size alone does not require splitting.

| Source File | Effective Non-Empty Lines | `>500` Hard-Limit Check | `>220` Delta Check | SoC / Ownership Check | Placement Check | Preliminary Classification | Required Action |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `.github/workflows/release-voice-runtime.yml` | 207 | Pass | Signal: 251 | Coherent workflow; ordering defect in `CR-F-006` | Pass | Local Fix | Correct pre-tag sequence; no split required solely for size. |
| `benchmark/adapters/v0_3BaselineAdapter.mjs` | 57 | Pass | Pass: 63 | Identity proof incomplete (`CR-F-002`) | Pass | Local Fix | Bind/record exact historical baseline identity. |
| `benchmark/corpus-v1.schema.json` | 40 | Pass | Pass: 40 | Coherent schema | Pass | Pass | Enforce it in the runner/evidence boundary. |
| `benchmark/metrics.mjs` | 89 | Pass | Pass: 101 | Simplified-normalization defect and duplicated thresholds | Pass | Local Fix | Resolve `CR-F-004`; centralize thresholds. |
| `benchmark/providerClient.mjs` | 169 | Pass | Pass: 185 | Lifecycle ownership defect (`CR-F-001`) | Pass | Local Fix | Implement legal-state invalidation and bounded cleanup. |
| `benchmark/run-benchmark.mjs` | 161 | Pass | Pass: 172 | Evidence/corpus gaps (`CR-F-002`, `CR-F-005`) | Pass | Local Fix | Strictly validate/record approved proof. |
| `evidence/release-evidence.example.json` | 18 | Pass | Pass: 18 | Correctly blocked example; shape too weak | Pass | Local Fix | Update with tightened evidence schema. |
| `metadata/model-candidates.json` | 48 | Pass | Pass: 48 | Approved comparison inventory incomplete (`CR-F-003`) | Pass | Local Fix | Represent all approved/failed candidates and lane history. |
| `metadata/runtime-assets.json` | 88 | Pass | Pass: 103 | Coherent pinned target identity | Pass | Pass | None. |
| `metadata/runtime-manifest-v3.schema.json` | 94 | Pass | Pass: 94 | Coherent manifest subject | Pass | Pass | Keep aligned with tightened evidence. |
| `package.json` | 28 | Pass | Pass: 28 | Coherent exact dependency contract | Pass | Pass | None. |
| `protocol/voice-input-protocol-v1.schema.json` | 420 | Pass | Signal: 420 | Cohesive one-version public protocol schema | Pass | Pass | No split required; retain fixture parity. |
| `runtime/protocolV1.cjs` | 129 | Pass | Pass: 144 | Coherent protocol decoder/composer | Pass | Pass | None. |
| `runtime/providerAssetIntegrity.cjs` | 64 | Pass | Pass: 74 | Coherent asset/path concern | Pass | Pass | None. |
| `runtime/providerDescriptorsV1.cjs` | 82 | Pass | Pass: 95 | Tight discriminated descriptor decoding | Pass | Pass | None. |
| `runtime/providerSessionConfigV1.cjs` | 120 | Pass | Pass: 137 | Strong sole pre-hello boundary | Pass | Pass | None. |
| `runtime/providerStartupError.cjs` | 12 | Pass | Pass: 15 | Coherent safe-category error | Pass | Pass | None. |
| `runtime/sherpaOfflineRecognizer.cjs` | 68 | Pass | Pass: 74 | Coherent native adapter | Pass | Pass | None. |
| `runtime/transcriptNormalizer.cjs` | 63 | Pass | Pass: 71 | Coherent runtime normalization | Pass | Pass | None; benchmark scoring must reuse equivalent normalization. |
| `runtime/voice-input-worker.cjs` | 90 | Pass | Pass: 99 | Coherent worker loop | Pass | Pass | None. |
| `runtime/wavSpeechGate.cjs` | 66 | Pass | Pass: 71 | Coherent WAV/no-speech concern | Pass | Pass | Broader threshold evidence remains downstream. |
| `scripts/assemble-release-evidence.mjs` | 88 | Pass | Pass: 91 | Weak/duplicated release-decision authority | Pass | Local Fix | Resolve `CR-F-002`/`CR-F-003`. |
| `scripts/build-model.mjs` | 73 | Pass | Pass: 75 | Coherent model package construction | Pass | Pass | Extend only as needed for approved candidates. |
| `scripts/build-runtime.mjs` | 99 | Pass | Pass: 105 | Coherent runtime package construction | Pass | Pass | None. |
| `scripts/check-syntax.mjs` | 15 | Pass | Pass: 16 | Coherent source check | Pass | Pass | None. |
| `scripts/fetch-model-source.mjs` | 14 | Pass | Pass: 15 | Coherent exact fetch concern | Pass | Pass | None. |
| `scripts/file-utils.mjs` | 91 | Pass | Pass: 104 | Cohesive build-file utilities | Pass | Pass | None. |
| `scripts/generate-candidate-manifest.mjs` | 54 | Pass | Pass: 55 | Coherent candidate manifest construction | Pass | Pass | Bind resulting identity into evidence. |
| `scripts/generate-manifest.mjs` | 105 | Pass | Pass: 141 | Relies on weak evidence boundary | Pass | Local Fix | Resolve `CR-F-002`. |
| `scripts/normalization-proof.mjs` | 18 | Pass | Pass: 19 | Fixture set does not cover the approved full punctuation/ITN policy | Pass | Local Fix | Expand exact fixtures with the correction to `CR-F-004`. |
| `scripts/package-smoke.mjs` | 130 | Pass | Pass: 142 | Coherent packaged-provider smoke | Pass | Pass | Add client failure/recovery evidence after `CR-F-001`. |
| `scripts/prepare-smoke-fixtures.mjs` | 43 | Pass | Pass: 46 | Coherent deterministic fixture preparation | Pass | Pass | None. |
| `scripts/release-evidence.mjs` | 25 | Pass | Pass: 27 | Not an authoritative verifier (`CR-F-002`, `CR-F-003`, `CR-F-005`) | Pass | Local Fix | Strictly decode and verify complete evidence. |
| `scripts/verify-release.mjs` | 81 | Pass | Pass: 89 | Package verification is coherent but inherits weak evidence | Pass | Local Fix | Consume corrected authoritative evidence. |
| `scripts/verify-reproducibility.mjs` | 10 | Pass | Pass: 11 | Coherent proof check | Pass | Pass | None. |
| `startup/provider-session-config-v1.schema.json` | 84 | Pass | Pass: 84 | Cohesive startup contract | Pass | Pass | None. |

## Legacy / Backward-Compatibility Verdict

| Check | Result | Notes |
| --- | --- | --- |
| No backward-compatibility mechanisms in changed scope | Pass | Production accepts only session-config schema 1, protocol 1, manifest 3, and one selected model. |
| No legacy old-behavior retention in changed scope | Pass | Python, live bootstrap, shell/cmd launchers, and protocol 0 are absent from production. |
| Dead/obsolete code cleanup completeness in changed scope | Pass | All named in-scope legacy production files and stale tests were removed. |
| Approved persisted-data transition decision is followed without unnecessary migration work | Pass | Runtime-only repository artifacts do not read/mutate application persistence. |
| No version-specific dual reads/writes or request-time old-shape fallback exists | Pass | v0.3 adapter is isolated benchmark tooling and is not packaged/imported by production. |
| Approved transition mechanics match the reviewed design | Pass | Current persisted-data decision is `Not Affected`; future desktop cutover remains out of scope. |

## Dead / Obsolete / Legacy Items Requiring Removal

None.

## Docs-Impact Verdict

- Docs impact: `Yes`
- Why: Public provider startup/protocol/manifest/release workflow and benchmark evidence contracts are changed. The checked-in README is directionally updated, but final durable docs must reflect the corrected evidence and release sequence.
- Files or areas likely affected: `README.md`, release/benchmark operator instructions, schema/fixture publication notes, and workflow guidance.

## Material Premise Validation

### Upstream Design-Review Material-Premise Decisions

None. `ARCH-REV-003` recorded no material-premise decisions.

No new or reclassified premise is required. Each finding follows an explicit approved contract/operational path rather than a hypothetical scenario:

- `CR-F-001`: `AC-004`/`AC-005` explicitly govern supported worker hang, malformed output, write failure, timeout, and loss during current runtime-client execution.
- `CR-F-002`–`CR-F-005`: `benchmark-protocol.md` explicitly governs the maintainer-run benchmark/evidence path used to select a release model.
- `CR-F-006`: `BEH-007`/`AC-010`/`AC-017` explicitly govern the maintainer's tag/publication operation.

## Review Scorecard

- Overall score (`/10`): `8.7`
- Overall score (`/100`): `87`
- Score calculation note: Simple average rounded from the ten category scores. The result does not override the below-9.0 category failures.

| Priority | Category | Score | Why This Score | What Is Weak / Holding It Down | What Should Improve |
| --- | --- | ---: | --- | --- | --- |
| `1` | `Data-Flow Spine Inventory and Clarity` | 8.1 | Provider startup/inference and package construction are readable end to end. | Failure/recovery does not terminate at a clean failed/stopped state; release flow gates after tag creation. | Complete `DS-004`/`DS-011` failure and release sequencing. |
| `2` | `Ownership Clarity and Boundary Encapsulation` | 8.4 | Provider-session, protocol, inference, asset, and build ownership are strong. | `ProviderClient` does not authoritatively enforce its states; evidence verifier trusts externally asserted gates. | Strengthen those existing owners rather than adding alternate callers. |
| `3` | `API / Interface / Query / Command Clarity` | 9.2 | Sole startup command/config and protocol identities are explicit and discriminated. | Release-evidence input is materially under-specified. | Define a strict verifiable evidence contract. |
| `4` | `Separation of Concerns and File Placement` | 9.3 | Source is cleanly separated into runtime, contract, benchmark, and release concerns. | Minor release-decision policy duplication crosses metrics/assembly. | Centralize lane evaluation while retaining current placement. |
| `5` | `Shared-Structure / Data-Model Tightness and Reusable Owned Structures` | 8.0 | Provider and model descriptors are tight. | Evidence omits required identities/history and uses trusted booleans; thresholds are duplicated. | Tighten the evidence model and single-source the decision rules. |
| `6` | `Naming Quality and Local Readability` | 9.4 | Names and small files make the implementation easy to trace. | A generic `waiters`/`inbox` mechanism obscures legal protocol state. | Replace generic queuing with explicit expected-state/request ownership. |
| `7` | `API/E2E Readiness` | 7.4 | Local tests and darwin-arm64 smoke provide useful mechanics evidence. | Source cannot truthfully prove timeout recovery, candidate history, corpus approval, or publish gating. | Resolve all findings and add focused durable tests before API/E2E. |
| `8` | `Runtime Correctness And Behavioral Fidelity` | 7.7 | Verified startup, truthful readiness, normalization, and worker request flow are substantially correct. | Client failure lifecycle, benchmark scoring, evidence binding, candidate ordering, corpus gate, and tag order violate approved behavior. | Resolve `CR-F-001`–`CR-F-006`. |
| `9` | `No Backward-Compatibility / No Legacy Retention` | 9.8 | Clean cut is complete; v0.3 is benchmark-only. | No material weakness. | Preserve. |
| `10` | `Cleanup Completeness` | 9.6 | Obsolete production paths/tests are removed and worktree source was clean at handoff. | No material cleanup weakness. | Preserve; update artifacts/tests with the fix. |

## Findings

### `CR-F-001` — Current provider client does not own terminal failure and bounded cleanup (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-003`, `BEH-004`, `BEH-009`; `R-004`, `R-009`, `R-011`; `AC-004`, `AC-005`, `AC-011`, `AC-017`; runtime contract Worker Startup/Lifecycle, Framing Rules, and Client Deadline Contract.
- Supported initiating trigger/path: During the approved benchmark/package-smoke execution of the exact provider, the worker hangs, emits malformed/out-of-state/unknown/late output, loses its stdin/write path, or exceeds a startup/request deadline. `ProviderClient.start()`/`transcribeFile()` -> `waitFor()`/`onLine()` -> failure handling is the current target-production client path.
- Evidence:
  - `benchmark/providerClient.mjs:63-73` awaits hello/preparation/readiness without a `catch/finally` that invalidates and terminates the spawned process.
  - `benchmark/providerClient.mjs:83-88` returns the client to `inference-ready` after a request timeout because timeout does not set `failed`.
  - `benchmark/providerClient.mjs:119-145` queues any unmatched message generically instead of enforcing the legal message set/request identity for the current state.
  - `benchmark/providerClient.mjs:107-111,165-169` does not make every error use the bounded termination path; `fail()` sends one `SIGTERM` without awaiting escalation, and `terminate()` sends `SIGKILL` after one bound without awaiting the further bound.
  - `write()` does not observe callback/error settlement for the approved write-failure case.
- Material consequence: An explicitly supported timeout/protocol/write failure can leave a worker running or reusable after invalid state, and the next benchmark/package-smoke operation is not the required one clean restart. This also makes failure timing/evidence unreliable.
- Required action: Implement one explicit client state machine that validates legal message types/request IDs, rejects all pending work once, transitions to failed, and boundedly terminates on every startup/request/protocol/write failure. Use one absolute preparation deadline and await the complete graceful/forced termination policy. Add focused source tests for handshake/preparation/request timeout, malformed/out-of-state/unknown/duplicate/late response, write failure, process loss, and clean next-attempt restart.

### `CR-F-002` — Release evidence can pass without verifiable benchmark/package identity or results (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-005`–`BEH-009`, `BEH-012`; `R-005`–`R-011`, `R-014`; `AC-006`–`AC-011`, `AC-016`, `AC-017`; benchmark Evidence Output and Exact Packaged Invocation Contract.
- Supported initiating trigger/path: A maintainer runs the approved benchmark, assembles durable release evidence, commits it, and pushes the release operation. `run-benchmark.mjs` -> `assemble-release-evidence.mjs` -> `assertReleaseEvidence()` -> `generate-manifest.mjs` -> release workflow.
- Evidence:
  - `benchmark/adapters/v0_3BaselineAdapter.mjs:9-35` accepts an arbitrary prepared v0.3 tree/model path and backend without validating or recording shipped v0.3 host/runtime/model digests.
  - `benchmark/run-benchmark.mjs:25-40` records aggregates and candidate model identity but omits the baseline identity, exact redacted baseline invocation, candidate manifest/configuration/descriptor digests, and failed/timeout counts required by the approved evidence contract.
  - `scripts/assemble-release-evidence.mjs:19-68` reduces inputs to derived numbers/booleans and does not validate the 30-cold/100-warm counts or bind them to descriptor/configuration/package identities.
  - `scripts/release-evidence.mjs:10-26` trusts gate booleans and only regex-checks `runnerCommit`; it does not require benchmark/performance data, baseline identity, configuration/descriptor digests, or equality between runner/source proof and the exact release commit.
  - A targeted probe confirmed `assertReleaseEvidence()` accepts a `preserve` record with runner commit all zeros and no `performance`, baseline identity, or exact-provider proof.
- Material consequence: The release gate can publish an immutable manifest whose selection/performance claims were generated from a different or unidentifiable baseline/runtime/configuration, or from insufficient repetitions, despite all booleans being `true`.
- Required action: Define and strictly decode one evidence schema carrying the approved corpus, baseline identity, every candidate identity/result, exact redacted invocation, candidate/release manifest and session-config/descriptor digests, repetition/failure/timeout statistics, target proofs, license reference, and source/runner commit. Recompute/verify gates from those inputs and bind evidence to the exact release package/source identity; do not accept caller-authored gate booleans as proof. Remove duplicated quality thresholds between metrics and assembly. Add negative tests demonstrating missing/mismatched identities, counts, failures, or source commits block manifest generation.

### `CR-F-003` — Approved candidate ordering and unsuccessful-candidate history are not enforceable (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-005`, `BEH-006`, `BEH-012`; `R-006`; `AC-007`, `AC-009`, `AC-016`, `AC-017`; benchmark Decision Rules 2, 5, 6, and 7.
- Supported initiating trigger/path: A maintainer constructs model-selection evidence for release. The approved operational path requires SenseVoice improvement evaluation (with Paraformer control), preservation of unsuccessful candidates, and Whisper preservation only after no improvement candidate passes.
- Evidence:
  - `metadata/model-candidates.json` contains only SenseVoice and Whisper; the approved Paraformer-zh control has no candidate/failure record.
  - `benchmark/run-benchmark.mjs` compares one caller-selected candidate with v0.3 and produces no multi-candidate decision history.
  - `scripts/assemble-release-evidence.mjs:36-68` and `scripts/release-evidence.mjs:12-24` allow direct construction/acceptance of an `AC-016` `preserve` result without evidence that the improvement lane was run and failed.
  - The targeted evidence probe demonstrated that a preserve record with no unsuccessful-candidate history passes.
- Material consequence: Whisper can be selected without satisfying the approved precondition, and unsuccessful replacement/preservation evidence can be lost. `AC-007` and the `replace|preserve|blocked` decision are therefore not reproducible.
- Required action: Represent the complete approved candidate inventory and durable per-candidate outcome/failure reason. Require an improvement-lane decision record before accepting `AC-016`, preserve all unsuccessful results, and enforce exactly one final `replace`, `preserve`, or `blocked` decision. If Paraformer is infeasible before execution, record and verify the exact platform/resource/license failure rather than silently omitting it.

### `CR-F-004` — Benchmark scoring omits the approved Simplified-Chinese normalization (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-006`; `R-006`, `R-007`; `AC-007`–`AC-009`, `AC-016`; benchmark Normalization And Metrics.
- Supported initiating trigger/path: The maintainer runs the same-corpus v0.3 baseline/candidate benchmark; references or model hypotheses contain Traditional variants that the approved metric treats as equivalent after deterministic Traditional-to-Simplified conversion.
- Evidence: `benchmark/metrics.mjs:21-27` applies NFKC/punctuation removal/tokenization only. It never applies the same deterministic Traditional-to-Simplified conversion to both references and hypotheses. A targeted probe scored approved-equivalent `軟體` versus `软件` as CER `1.0`.
- Material consequence: Baseline/candidate Mandarin and mixed error rates can be biased by script representation rather than recognition, changing whether `AC-009` or `AC-016` passes.
- Required action: Reuse one metric-normalization owner that applies the approved Unicode and Simplified conversion symmetrically before Mandarin/mixed scoring while retaining pre/post-normalization recognition reporting. Add exact regression fixtures for Traditional/Simplified equivalence and the approved decimal, percentage, currency, date, punctuation, Han/Latin spacing, and English-span rules.

### `CR-F-005` — Corpus consent and redistribution contract is declared but not enforced (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-006`, `BEH-008`; `R-006`, `R-009`; `AC-007`, `AC-009`, `AC-011`, `AC-016`; benchmark Corpus Contract and Evidence Output.
- Supported initiating trigger/path: A maintainer supplies the versioned real-speech corpus to `run-benchmark.mjs` for release selection.
- Evidence:
  - `benchmark/corpus-v1.schema.json` requires `license.redistributionApproved`, non-empty `provenanceReference`, and per-clip non-empty `consentReference`.
  - `benchmark/run-benchmark.mjs:119-143` does not validate against that schema and checks only `licensedRealSpeech`, counts/diversity/durations/digests; it ignores redistribution approval and consent/provenance fields.
  - `scripts/release-evidence.mjs:17-21` also accepts only a boolean `licensedRealSpeech` plus counts, so the later gate cannot recover the missing proof.
- Material consequence: Unapproved or undocumented personal recordings can determine an immutable commercial release despite the explicit local-privacy/license contract.
- Required action: Strictly validate the corpus schema and per-clip consent/provenance facts before reading/scoring audio; carry a non-sensitive content-addressed corpus/provenance reference into release evidence; fail closed when redistribution/consent approval is absent. Add negative tests for each missing/false field without logging local paths, audio, or transcripts.

### `CR-F-006` — Maintained-main/evidence checks occur after the immutable tag exists (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-007`, `BEH-012`; `R-008`, `R-014`; `AC-010`, `AC-017`; design `DS-004` and Runtime-First Release Boundary.
- Supported initiating trigger/path: A maintainer pushes a supported `v*` tag to invoke `.github/workflows/release-voice-runtime.yml`.
- Evidence: `.github/workflows/release-voice-runtime.yml:19-21` triggers on tag push, while the release-only ancestry/evidence checks are in `release-gate` at lines `163-190`. The tag necessarily exists on the remote before those checks execute.
- Material consequence: A failed maintained-main, evidence, package, or license gate leaves a release tag that was created before qualification, contradicting the required immutable historical-tag order and potentially consuming the release version without assets.
- Required action: Move all qualification and ancestry checks to a pre-tag workflow/Delivery operation and create the immutable tag only after they pass, then publish from that exact commit. Preserve existing historical tags and add a workflow-level test/reviewable assertion that no release tag is created or pushed by an unqualified path.

## Classification

- Classification: `Local Fix`
- Rationale: The approved requirements, benchmark contract, runtime contract, and `ARCH-REV-003` design already define the correct behavior and ownership. Findings are bounded implementation/test/workflow defects; no requirement or design change is needed.

## Recommended Recipient

- `implementation_engineer`
- Routing note: Correct the implementation and artifacts under a new `IR-*` revision, then return the cumulative package for implementation source review. API/E2E must not begin from this result.

## Residual Risks

- The licensed real corpus, formal license approval, full 30-cold/100-warm reference run, RSS/size budgets, and actual all-target packages are still unexecuted downstream gates.
- Windows symlink/native/WAV behavior and every-target reproducibility remain material execution risks after source corrections.
- Maintained-main reconciliation, tag creation, publication, and published-digest verification remain Delivery-owned and must follow the corrected pre-tag order.
- Broader no-speech/noise thresholds and real acoustic/model quality remain executable evidence questions, not additional source findings in this round.

## Latest Authoritative Result

- Review Decision: `Fail`
- Review Entry Point: `Implementation Review`
- Material-Premise Gate: `Pass`
- Score Summary: `8.7/10 (87/100)`; categories `1`, `2`, `5`, `7`, and `8` are below the clean-pass target.
- Failure Origin (when applicable): `Implementation/source and release-workflow defects against explicit approved contracts`
- Recommended Recipient (when applicable): `implementation_engineer`
- Notes: The verified provider structure and legacy removal are strong, but current-client recovery and the benchmark/evidence/release path are not yet trustworthy enough to advance to API/E2E.
