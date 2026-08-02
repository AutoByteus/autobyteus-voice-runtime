# Code Review Report

## Review Round Meta

- Review Entry Point: `Implementation Review`
- Requirements Doc Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts Reviewed As Context: `benchmark-protocol.md`, `backend-selection-study.md`, `evidence/backend-selection/aggregate-results.json`, `evidence/backend-selection/SHA256SUMS.txt`, and `voice-runtime-contract.md`
- Solution Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Relevant Solution Revision IDs: `SR-004`, `SR-005`, `SR-006`; `SR-003` is withdrawn history only
- Design Review Report Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Relevant Architecture Review Revision IDs: `ARCH-REV-004` through `ARCH-REV-007`; current result `ARCH-REV-007 Pass`
- Implementation Handoff Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Relevant Implementation Revision IDs: `IR-002`; `IR-001` is withdrawn-design history only
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Current Code Review Revision ID: `CRR-002`
- Current Review Round: `2`
- Trigger: Implementation Engineer handoff for replacement source commits `ce9d4b4553947b876c8783e18a621edfcac03555` and `402525786f3f556e355e8292611720c02c634332`, artifact commit `966d73197ce0197ba2e891f3483d820c1b9eb1df`
- Prior Review Round Reviewed: `CRR-001` against withdrawn `SR-003` / `IR-001`
- Latest Authoritative Round: `CRR-002`
- Coverage Investigation / Execution / API/E2E / Delivery Revision Inputs: `N/A`
- Failing Scenario IDs / Failure Evidence Paths: `N/A — source review`

## Review Scope

- Changed implementation and behavior reviewed: the clean replacement of the withdrawn universal Node/sherpa provider with Catalog 3 profile packages, native Go launcher, Provider Archive 1, Python/MLX and Python/faster-whisper English workers, native Fun-ASR Chinese worker, strict session/protocol/audio/normalization contracts, exact-package qualification, release evidence, and pre-tag publication workflow.
- Files / areas reviewed: current requirements/design/contract/evidence chain; full replacement diff from the withdrawn implementation to `4025257`; production providers, launcher, archive, package builders, benchmark/reference client, qualification and release-evidence code, workflow, locks, tests, removal state, and implementation handoff/revision evidence.
- Explicit exclusions: desktop/superrepo/shared-runtime integration, persisted desktop state, optional `auto`, actual eight-package execution, licensed-corpus results, M1 Max resource/latency results, formal license approval, maintained-main integration, tag, and publication. These remain downstream gates, not claimed implementation evidence.

## Upstream Behavior And Production-Path Basis Confirmation

- Approved requirements basis understood: `requirements.md`, the user-approved `benchmark-protocol.md`, and the SR-006 runtime contract define the intended runtime-only package, qualification, and release behavior.
- Design-spec behavior map verified against the implementation: the primary package/worker, build/qualification/release, and failure-lifecycle spines are present with the reviewed owners and without desktop or legacy runtime paths. The contradictions below are implementation defects within those established spines, not missing behavior authority.
- Design review report and round confirmed: `ARCH-REV-007 Pass` against `SR-006`.
- Behavior-basis status: `Confirmed`
- Changed or newly discovered behavior: None.
- Remaining material ambiguity: None. All findings are reachable from an explicit runtime contract or supported operator workflow.

| Behavior ID | Current Status | Current Implementation Path And Lifecycle Evidence | Contradicting Or Newly Discovered Supported Behavior Evidence |
| --- | --- | --- | --- |
| `BEH-002`, `BEH-003` | Confirmed | Native launcher -> bound worker -> truthful preparation/ready -> serialized persistent recognizer -> bounded session termination. | None. |
| `BEH-004`, `BEH-010`, `BEH-011` | Confirmed | Catalog/archive -> verified extraction -> native launcher -> contained Python/native worker -> fixed PCM WAV validation. | None; exact-input implementation defects are findings within the confirmed path. |
| `BEH-005`, `BEH-006`, `BEH-012` | Confirmed | Profile/target selects MLX, faster-whisper, or Fun-ASR; normalization is local; no context-term/request-time backend control exists. | None; native-normalizer and no-speech defects are within this path. |
| `BEH-007`, `BEH-008`, `BEH-009` | Confirmed | Operator-dispatched prequalification builds packages, executes the public protocol, assembles/verifies evidence, then a separate publish operation tags exact qualified bytes. | None; lineage, baseline, and measurement defects are within this path. |

## Structural / Design Checks

| Check | Result | Evidence | Required Action |
| --- | --- | --- | --- |
| Task design health assessment is present, evidence-backed, and preserved by the implementation | Pass | SR-006/ARCH-REV-007 and the promoted 191-record selection bundle define a coherent runtime-only target; the final tree follows it. | Preserve. |
| Implementation matches approved behavior-defining supplemental artifacts | Fail | UTF-8 framing, native normalization, no-speech ownership, exact input/baseline binding, preparation measurement, and maintained-main reachability diverge from `benchmark-protocol.md` and `voice-runtime-contract.md`. | Resolve `CR-F-007`–`CR-F-013`. |
| Data-flow spine inventory clarity and preservation under shared principles | Pass | Catalog/archive/package/session and build/qualification/release paths are direct and traceable. | Preserve the spines while fixing their local gates. |
| Ownership boundary preservation and clarity | Fail | Package builders accept self-attested materialized inputs, and qualification accepts a self-declared baseline without a repository-owned expected identity. | Make the existing lock/evidence owners authoritative (`CR-F-010`, `CR-F-011`). |
| Off-spine concern clarity | Pass | Selection-study evidence, scoring, archive mechanics, and release proof remain outside worker inference. | Preserve. |
| Existing capability/subsystem reuse check | Pass | Python providers share one session/audio/protocol/normalizer core; Go owns launcher/archive; JS owns qualification/reference-client policy. | Preserve. |
| Reusable owned structures check | Fail | The shared fixtures exist, but native normalization is not exercised against them; baseline/input identities lack a reusable trusted lock shape. | Add native fixture conformance and trusted baseline/input identities. |
| Shared-structure/data-model tightness check | Fail | Public protocol/catalog shapes are tight, but baseline and build-input provenance shapes can validate their own untrusted claims. | Tighten the existing evidence/lock models. |
| Repeated coordination ownership check | Pass | One reference session, one package assembler, one release verifier, and one archive owner coordinate their concerns. | Preserve. |
| Empty indirection check | Pass | Reviewed boundaries perform validation, transformation, or ownership work. | Preserve. |
| Scope-appropriate separation of concerns and file responsibility clarity | Pass | Provider, launcher, archive, build, qualification, evidence, and release folders each have coherent subjects. | Preserve. |
| Ownership-driven dependency check | Pass | No desktop dependency, engine leakage through public APIs, or unjustified dependency cycle was found. | Preserve. |
| Authoritative Boundary Rule check | Pass | Callers consume catalog/package/session owners rather than reaching through them to private engine internals. | Preserve. |
| File placement check | Pass | Changed files reside under their owning runtime, contract, build, benchmark, evidence, or release concern. | Preserve. |
| Flat-vs-over-split layout judgment | Pass | The layout is navigable and not artificially fragmented; large orchestrators retain one named subject. | Preserve; optional extraction can accompany fixes where it strengthens ownership. |
| Interface/API/query/command/service-method boundary clarity | Fail | Public package/protocol APIs are clear, but baseline and materialized-build-input acceptance interfaces omit trusted expected identities. | Resolve `CR-F-010`, `CR-F-011`. |
| Naming quality and naming-to-responsibility alignment check | Pass | Names consistently expose package/profile/target/session/evidence subjects. | Preserve. |
| No unjustified duplication of code / repeated structures in changed scope | Pass | Repeated provider mechanics are shared where coherent; evidence-only experimental variants are intentionally preserved as study records. | Preserve. |
| Patch-on-patch complexity control | Pass | The withdrawn production tree is replaced rather than wrapped or extended with fallback paths. | Preserve. |
| Dead/obsolete code cleanup completeness in changed scope | Pass | Universal Node/sherpa production, old schemas/build/release scripts, protocol 0, and live bootstrap paths are absent. | Preserve. |
| Relevant test scenarios and assertions are clear and requirement-aligned | Fail | Tests cover schemas, lifecycle, Python normalization, scoring, launcher, archive, and release order, but miss split UTF-8 frames, native fixture parity, empty recognizer semantics, trusted baseline/input rejection, cache-state proof, and correct ancestry direction. | Add focused deterministic tests with the fixes. |
| Test fixtures/helpers are reasonably reusable and test structure remains coherent | Pass | Protocol/startup/archive/audio/normalization fixtures and small test helpers are reusable and well named. | Reuse them for the missing native and negative cases. |
| No stale, duplicated, or compatibility-only tests are retained in changed scope | Pass | Withdrawn implementation tests were removed; current tests target the replacement contracts. | Preserve. |
| API/E2E readiness for the next workflow stage | Fail | Current source can corrupt non-ASCII results and can produce false normalization, baseline, input-provenance, performance, and release-lineage proof. | Fix and return for source review before API/E2E. |

## Source File Size And Structure Audit

Effective lines count non-empty lines. Tests, fixtures, schemas, generated evidence, and raw result files are excluded from size thresholds.

| Source File | Effective Non-Empty Lines | `>500` Hard-Limit Check | `>220` Delta Check | SoC / Ownership Check | Placement Check | Preliminary Classification | Required Action |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `benchmark/run-profile-qualification.mjs` | 490 | Pass | Triggered | One qualification subject, but cold/warm and baseline gates are incomplete. | Pass | `Local Fix` (`CR-F-010`, `CR-F-012`) | Correct the existing qualification owner; extract only if the fix improves policy ownership. |
| `release/evidence/verify.mjs` | 442 | Pass | Triggered | Cohesive evidence verifier; baseline and lineage recomputation are under-bound. | Pass | `Local Fix` (`CR-F-009`, `CR-F-010`) | Correct the verifier. |
| `benchmark/provider-process-session.mjs` | 355 | Pass | Triggered | Cohesive reference session; byte decoding is not stream-safe. | Pass | `Local Fix` (`CR-F-007`) | Add a streaming decoder and boundary tests. |
| `evidence/selection-study/harness/run_controlled_study.py` | 338 | Pass | Triggered | Evidence-only controlled-study orchestrator; coherent and not a production runtime path. | Pass | Pass | None. |
| `build/package-assembler.mjs` | 320 | Pass | Triggered | Cohesive package assembly owner; consumes under-authoritative builder inputs. | Pass | Related to `CR-F-011` | Preserve ownership and tighten inputs. |
| `providers/chinese-funasr/src/session.cpp` | 249 | Pass | Triggered | Cohesive native session binding/verification owner. | Pass | Pass | None. |
| `providers/python/autobyteus_voice_provider/session.py` | 248 | Pass | Triggered | Cohesive Python session owner; result semantics participate in `CR-F-013`. | Pass | `Local Fix` (`CR-F-013`) | Correct empty-recognizer outcome semantics. |
| `evidence/selection-study/harness/funasr-cli-upstream-original.cpp` | 239 | Pass | Triggered | Preserved evidence variant; intentional study provenance. | Pass | Pass | None. |
| `evidence/selection-study/harness/funasr-cli-static-hotword-experiment.cpp` | 239 | Pass | Triggered | Preserved evidence variant; intentional study provenance. | Pass | Pass | None. |
| `evidence/selection-study/harness/funasr-cli-static-hotword-experiment-v2.cpp` | 239 | Pass | Triggered | Preserved evidence variant; intentional study provenance. | Pass | Pass | None. |
| `packaging/archive/safeextract.go` | 230 | Pass | Triggered | Cohesive bounded safe-extraction owner. | Pass | Pass | None. |
| `providers/chinese-funasr/src/normalization.cpp` | 163 | Pass | Not triggered | Cohesive native normalizer, but output diverges from the governing fixture. | Pass | `Local Fix` (`CR-F-008`) | Correct and execute native fixture conformance. |
| `build/profile-builders/common.mjs`; `build/profile-builders/funasr.mjs`; `packaging/launcher/compile-launcher.mjs` | 187 / 135 / 162 | Pass | Not triggered | Correctly placed input/toolchain owners, but accepted identities are self-attested or version-only. | Pass | `Local Fix` (`CR-F-011`) | Bind materialized inputs to repository-owned locked bytes/digests. |

## Legacy / Backward-Compatibility Verdict

| Check | Result | Notes |
| --- | --- | --- |
| No backward-compatibility mechanisms in changed scope | Pass | Catalog 3, Provider Archive 1, Session 1, and Protocol 1 are clean current-only contracts. |
| No legacy old-behavior retention in changed scope | Pass | No production Node/sherpa, protocol 0, schema-2, live bootstrap, or alternate launcher remains. |
| Dead/obsolete code cleanup completeness in changed scope | Pass | Old production trees and obsolete tests are removed; withdrawn commits/artifacts remain history only. |
| Approved persisted-data transition decision is followed without unnecessary migration work | Pass | Runtime-only package state is directly usable; desktop persisted state is outside scope and untouched. |
| No version-specific dual reads/writes or request-time old-shape fallback exists | Pass | No dual production path or runtime fallback was found. |
| Approved transition mechanics match the reviewed design | Pass | Clean replacement is implemented without migration machinery. |

## Dead / Obsolete / Legacy Items Requiring Removal

None.

## Docs-Impact Verdict

- Docs impact: `Yes`
- Why: build-input preparation, locked baseline authority, performance measurement procedure, and maintained-main release proof must accurately describe the corrected fail-closed mechanics.
- Files or areas likely affected: `README.md`, build-input operator documentation, benchmark/qualification instructions, and `.github/workflows/release-voice-runtime.yml` guidance.

## Material Premise Validation

### Upstream Design-Review Material-Premise Decisions

None. `ARCH-REV-007` recorded no material-premise decisions; its supported package, lifecycle, qualification, and release triggers remain applicable.

### `MP-CR-001` — UTF-8 protocol frames may cross stdout chunk boundaries

- Origin: `New`
- Related approved requirement or established contract: Protocol 1 UTF-8 JSON-lines framing; `AC-009`, `AC-013`, `AC-017`.
- Relevant behavior ID(s): `BEH-006`, `BEH-009`
- Initiating basis kind: `Contract`
- Independent product-supported initiating trigger or applicable governing contract: exact Python/native provider packages emit supported non-ASCII transcript text through Protocol 1 UTF-8 JSON-lines stdout.
- Support evidence: Node stream `data` chunks have no UTF-8 code-point or line alignment guarantee; Chinese output is an ordinary supported protocol result.
- Forward path: actual package worker stdout -> Node `data` chunks -> `ProviderProcessSession.consume()` -> Protocol 1 decoder -> qualification/raw evidence.
- Lifecycle preconditions and material consequence: a multibyte code point split between chunks is independently decoded twice and becomes replacement characters, corrupting transcript and quality evidence.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-007`; bounded streaming-decoder fix and regression test.

### `MP-CR-002` — Native Chinese recognition must execute the shared normalization fixture semantics

- Origin: `New`
- Related approved requirement or established contract: `BEH-006`, `AC-008`, `AC-009`; `contracts/normalization/fixtures-v1.json`.
- Relevant behavior ID(s): `BEH-006`
- Initiating basis kind: `Contract`
- Independent product-supported initiating trigger or applicable governing contract: every Fun-ASR raw result is required to pass the canonical Chinese normalizer; the `han-spacing` fixture fixes the required punctuation/spacing output.
- Support evidence: Chinese recognizer results normally contain Han text, punctuation, and whitespace; no optional user action or speculative failure is needed.
- Forward path: supported Chinese request -> Fun-ASR raw text -> `Normalizer::apply()` -> protocol result and scoring.
- Lifecycle preconditions and material consequence: whitespace immediately after converted Chinese punctuation is retained, violating the exact fixture and changing user/evidence text.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-008`; local native-normalizer correction and fixture execution.

### `MP-CR-003` — A maintainer can dispatch qualification/publication from an unmerged branch

- Origin: `New`
- Related approved requirement or established contract: `BEH-007`, `R-008`, `R-014`, `AC-010`, `AC-017`.
- Relevant behavior ID(s): `BEH-007`
- Initiating basis kind: `Operational`
- Independent product-supported initiating trigger or applicable governing contract: `.github/workflows/release-voice-runtime.yml` exposes `workflow_dispatch`, including branch/ref selection, to the maintainer.
- Support evidence: the workflow uses the selected run's `GITHUB_SHA` as the source/tag commit.
- Forward path: maintainer dispatches branch -> build/prequalify -> aggregate evidence -> publish recheck -> tag `GITHUB_SHA`.
- Lifecycle preconditions and material consequence: if the branch contains refreshed `origin/main` but is not merged into it, the current reversed ancestry check passes and the unmerged commit can be tagged, contradicting maintained-main reachability.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-009`; correct ancestry/identity proof before tag.

### `MP-CR-004` — Qualification consumes operator-supplied baseline evidence

- Origin: `New`
- Related approved requirement or established contract: `BEH-005`, `AC-009`; exact locked baseline in `benchmark-protocol.md` and SR-006.
- Relevant behavior ID(s): `BEH-005`, `BEH-007`
- Initiating basis kind: `Operational`
- Independent product-supported initiating trigger or applicable governing contract: the supported workflow supplies `$VOICE_CORPUS_ROOT/<profile>/baseline-evidence.json` to every qualification.
- Support evidence: this file is outside the repository and is the normal qualification input, not a synthetic test-only path.
- Forward path: operator corpus root -> `validateBaseline()` -> qualification summary -> release evidence verifier -> release decision.
- Lifecycle preconditions and material consequence: a self-consistent but unapproved baseline can declare its own provider/model/configuration and per-clip error counts, making the non-regression gate compare against fabricated or wrong evidence.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-010`; bind the baseline to repository-owned selected evidence.

### `MP-CR-005` — Self-hosted runners supply persistent materialized build inputs and toolchains

- Origin: `New`
- Related approved requirement or established contract: `BEH-004`, `R-005`, `R-014`, `AC-006`, `AC-017`.
- Relevant behavior ID(s): `BEH-004`, `BEH-010`
- Initiating basis kind: `Operational`
- Independent product-supported initiating trigger or applicable governing contract: the supported release workflow reads `$VOICE_BUILD_INPUT_ROOT`, `$VOICE_GO`, and `$VOICE_CMAKE` from self-hosted runners.
- Support evidence: exact offline materialized inputs are the normal package-construction source.
- Forward path: runner input roots/toolchain -> profile builder/native compiler/launcher compiler -> package manifest/build report -> qualification/release.
- Lifecycle preconditions and material consequence: self-authored manifests/origin markers or version strings can attest patched bytes as the expected revision, producing reproducible packages that are not built from reviewed locked inputs.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-011`; repository-owned byte/tree identities must authenticate the materialized inputs and executing toolchain.

### `MP-CR-006` — The qualification runner is the governing source of cold/warm preparation evidence

- Origin: `New`
- Related approved requirement or established contract: `AC-003`; M1 Max protocol in `benchmark-protocol.md`.
- Relevant behavior ID(s): `BEH-002`, `BEH-007`
- Initiating basis kind: `Operational`
- Independent product-supported initiating trigger or applicable governing contract: the supported M1 Max matrix runs `run-profile-qualification.mjs --cold-count 30 --warm-count 100` and consumes its emitted percentile fields.
- Support evidence: no separate downstream owner re-executes or reconstructs preparation samples.
- Forward path: maintainer prequalification -> runner process loop -> summary percentiles -> release verifier thresholds.
- Lifecycle preconditions and material consequence: cache state is only a free-form environment string, while `warmPreparation` contains one sample; the emitted p95 labels cannot prove the specified filesystem-cold/warm-cache preparation gates.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-012`; enforce and evidence the states/sample sets being claimed.

### `MP-CR-007` — A valid speech request may produce an empty recognizer result

- Origin: `New`
- Related approved requirement or established contract: Audio Contract 1 and Protocol 1: the audio validator owns deterministic no-speech; no-speech is not a fabricated empty transcript or model failure. `AC-009` treats empty speech output as a blocker.
- Relevant behavior ID(s): `BEH-005`, `BEH-009`, `BEH-011`
- Initiating basis kind: `Contract`
- Independent product-supported initiating trigger or applicable governing contract: a supported valid WAV passes the audio speech gate and is submitted to the selected recognizer; recognizers may return an empty string for unrecognized speech.
- Support evidence: this is the exact declared request/engine result boundary; the governing contract distinguishes validator-owned no-speech from an empty recognizer result.
- Forward path: valid speech WAV -> audio validator reports speech -> MLX/faster/Fun-ASR recognizer -> empty raw result -> protocol outcome selection.
- Lifecycle preconditions and material consequence: both implementations currently label the model's empty result as successful `no-speech`, hiding a recognition failure and misreporting the user's supported request.
- Reachability: `Reachable`
- Review consequence / proportionate response: `CR-F-013`; use the audio gate decision as the sole no-speech authority and handle unexpected empty recognition fail-closed.

## Review Scorecard

- Overall score (`/10`): `8.6`
- Overall score (`/100`): `86`
- Score calculation note: Simple average of the ten categories. It does not override the below-9.0 category failures.

| Priority | Category | Score | Why This Score | What Is Weak / Holding It Down | What Should Improve |
| --- | --- | ---: | --- | --- | --- |
| `1` | `Data-Flow Spine Inventory and Clarity` | 9.2 | Package, worker, qualification, and release spines are direct and match SR-006. | Several gates on those spines are behaviorally incorrect. | Correct gates without adding alternate paths. |
| `2` | `Ownership Clarity and Boundary Encapsulation` | 8.6 | Launcher/archive/provider ownership is strong and engine-private. | Baseline and build-input truth is delegated to self-attested external shapes. | Make existing lock/evidence owners authoritative. |
| `3` | `API / Interface / Query / Command Clarity` | 9.1 | Catalog, launcher plan, session config, and Protocol 1 are strict and discriminated. | Baseline/materialized-input acceptance contracts lack trusted expected identity. | Tighten those two operational interfaces. |
| `4` | `Separation of Concerns and File Placement` | 9.0 | Runtime, build, benchmark, release, and evidence concerns are cleanly placed. | Large qualification/verifier owners concentrate several gates, though still one subject each. | Keep corrections cohesive; extract policy only where it improves authority. |
| `5` | `Shared-Structure / Data-Model Tightness and Reusable Owned Structures` | 8.3 | Shared protocol/audio/normalization fixtures and Python core are well chosen. | Native fixture parity is unproved; baseline/input provenance models can authenticate themselves. | Add native conformance and trusted identity records. |
| `6` | `Naming Quality and Local Readability` | 9.0 | Naming is consistent and paths expose ownership. | Dense C++/qualification code makes some local invariants easy to miss. | Add focused tests and keep fix logic explicit. |
| `7` | `API/E2E Readiness` | 6.8 | Local checks prove syntax, schemas, lifecycle basics, deterministic build mechanics, and cleanup. | Seven source-level blockers can invalidate actual transcript and release evidence. | Resolve `CR-F-007`–`CR-F-013`, then re-review. |
| `8` | `Runtime Correctness And Behavioral Fidelity` | 6.5 | Core architecture and clean-cut profile selection are faithful. | UTF-8 corruption, native normalization, no-speech semantics, exact input/baseline binding, preparation evidence, and main lineage violate governing contracts. | Correct all findings and add negative/conformance proof. |
| `9` | `No Backward-Compatibility / No Legacy Retention` | 9.8 | The withdrawn production implementation is removed without fallback or dual reads. | No material weakness. | Preserve. |
| `10` | `Cleanup Completeness` | 9.7 | Obsolete source/tests are removed; pre-review worktree and implementation checks were clean. | Review artifacts now require the normal handoff commit later. | Preserve source cleanup. |

## Findings

### `CR-F-007` — Reference client corrupts UTF-8 split across stdout chunks (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-006`, `BEH-009`; Protocol 1 UTF-8 JSON-lines; `AC-009`, `AC-013`, `AC-017`; `MP-CR-001`.
- Supported path: exact Python/native package emits a Chinese result -> OS/Node splits stdout arbitrarily -> `ProviderProcessSession.consume()` decodes -> qualification/result evidence.
- Evidence: `benchmark/provider-process-session.mjs:164-166` calls `chunk.toString("utf8")` independently for every chunk. An in-memory source probe split the three UTF-8 bytes for `请` across two `consume()` calls; the accepted result became `���` while the session remained valid. Existing tests emit each full frame in one buffer.
- Material consequence: supported non-ASCII transcripts and their quality evidence can be corrupted by an ordinary pipe boundary.
- Required action: use a stateful streaming UTF-8 decoder, finish/validate it on stream termination, preserve the frame-size bound, and add deterministic tests that split multibyte text and line delimiters at every relevant byte boundary.

### `CR-F-008` — Native Fun-ASR normalizer violates the governing Han-spacing fixture (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-006`; `AC-008`, `AC-009`; Transcript Normalization V1; `MP-CR-002`.
- Supported path: Chinese request -> Fun-ASR raw text -> native `Normalizer::apply()` -> Protocol 1 normalized text and qualification evidence.
- Evidence: `providers/chinese-funasr/src/normalization.cpp:162-176` records whitespace and inserts it before a non-Han token unless that token is punctuation. After converting `,` to `，`, the next Han token is not punctuation and the preceding output token is punctuation, so raw `你 好 , 世 界 !` becomes `你好， 世界！`, not the required `你好，世界！`. Python and JS explicitly remove whitespace after Chinese punctuation; no C++ fixture test executes the native implementation.
- Material consequence: the selected Chinese production package returns contract-nonconformant user text and scores a different normalization from its reference implementation.
- Required action: implement the exact punctuation/spacing invariant in C++, compile a native conformance test against every shared fixture, and keep runtime/scoring results byte-equal.

### `CR-F-009` — Maintained-main reachability proof uses the ancestry direction backwards (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-007`; `R-008`, `R-014`; `AC-010`, `AC-017`; `MP-CR-003`.
- Supported path: maintainer dispatches prequalify/publish on a selected ref -> source commit is qualified -> release verifier approves -> workflow tags `GITHUB_SHA`.
- Evidence: `release/evidence/assemble.mjs:91-95` and `release/evidence/verify.mjs:172-180` run `git merge-base --is-ancestor <maintained-main-commit> <source-commit>`. That only proves the branch was refreshed from main. It does not prove the release commit is reachable from maintained main. The dispatch workflow can therefore qualify and tag an unmerged descendant of `origin/main`.
- Material consequence: a release can pass while its commit is absent from the maintained source line, directly contradicting AC-010.
- Required action: prove the release/source commit is an ancestor of (or identical to) the freshly fetched maintained-main commit, bind publication to that verified integrated commit, and add a workflow/unit case that rejects an unmerged descendant while accepting equality/integrated ancestry.

### `CR-F-010` — Locked quality baseline is not bound to approved promoted evidence (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-005`, `BEH-007`; `AC-009`, `AC-017`; exact baseline/evidence contract; `MP-CR-004`.
- Supported path: workflow supplies `$VOICE_CORPUS_ROOT/<profile>/baseline-evidence.json` -> qualification compares results -> release verifier recomputes -> release decision.
- Evidence: `benchmark/run-profile-qualification.mjs:402-427` validates only self-declared schema/profile/metric/corpus/config format, result pairing, and self-consistent aggregate. `release/evidence/verify.mjs:261-313` compares the copied file to fields derived from that same file and recomputes its declared integer counts. No repository-owned expected baseline digest/provider/model/configuration binds it to `candidate-history-v1.json` or promoted selection evidence; even the Chinese `0.052128` check does not authenticate how the per-clip baseline was produced.
- Material consequence: a self-consistent fabricated or wrong-provider baseline can satisfy non-regression and paired-uncertainty gates.
- Required action: add a trusted per-profile baseline identity/digest/configuration binding owned by the promoted selection/release contract, verify the external file against it before use, and add wrong-digest/provider/model/configuration/per-clip-count negative tests.

### `CR-F-011` — Materialized build inputs are closed by self-attestation rather than locked bytes (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-004`, `BEH-010`; `R-005`, `R-014`; `AC-006`, `AC-017`; exact locked-input contract; `MP-CR-005`.
- Supported path: self-hosted runner inputs/toolchains -> package builders/launcher compiler -> reproducible archive/build report -> release qualification.
- Evidence:
  - `build/locked-inputs.mjs:16-58` proves only that an external `SHA256SUMS.json` closes its own tree.
  - `build/profile-builders/common.mjs:56-70` lets `python-root-origin.json` state the expected archive digest and its own current tree digest; lines `141-165` validate installed dependencies only by name/version even though promoted faster-whisper resolution evidence records wheel hashes.
  - `build/profile-builders/funasr.mjs:21-34` trusts `SOURCE_COMMIT` text inside each supplied source tree; a regenerated external manifest can close patched sources with the expected marker.
  - `packaging/launcher/compile-launcher.mjs:21-29` authenticates the executing Go compiler only by `go version`; the locked archive digest is copied into provenance without proving the binary came from those bytes.
- Material consequence: patched/stale upstream runtime, dependency, native source, or toolchain bytes can build twice identically and still be mislabeled as the reviewed locked inputs.
- Required action: bind each materialized tree/wheel/source archive/toolchain to repository-owned expected byte or canonical tree digests (including promoted target resolution hashes), verify those identities before build, and add tampered-tree/version-preserving negative tests.

### `CR-F-012` — Preparation evidence does not establish the claimed cold/warm cache percentiles (`High`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-002`, `BEH-007`; `AC-003`; M1 Max qualification protocol; `MP-CR-006`.
- Supported path: M1 Max prequalification invokes 30 cold and 100 warm trials -> summary percentiles -> release threshold verifier.
- Evidence: `benchmark/run-profile-qualification.mjs:140-161` starts 30 processes but performs no cache reset or cache-state verification before labeling their preparation values `coldPreparation`. `benchmark/prepare-conditions.mjs:26-32,73-77` records only a free-form `VOICE_FILESYSTEM_CACHE_PROCEDURE` string. `run-profile-qualification.mjs:280-283` reports `warmPreparation` from exactly one process-start sample while presenting it as a p95.
- Material consequence: AC-003 may pass without measuring filesystem-cold preparation or a meaningful warm-cache preparation percentile.
- Required action: make the runner/operator protocol execute and evidence the approved cache-state procedure, collect the sample set needed for each claimed percentile, bind those raw samples into release verification, and add gate tests for absent/unexecuted procedures and insufficient counts. Do not relax thresholds.

### `CR-F-013` — Workers misclassify an empty recognizer result as validator-approved no-speech (`Medium`, `Local Fix`)

- Affected approved behavior/contracts: `BEH-005`, `BEH-009`, `BEH-011`; Audio Contract 1 and Protocol 1; `AC-009`; `MP-CR-007`.
- Supported path: valid speech WAV passes the deterministic audio gate -> selected recognizer returns empty -> worker chooses Protocol 1 outcome.
- Evidence: `providers/python/autobyteus_voice_provider/protocol.py:63-75` and `providers/chinese-funasr/src/main.cpp:81-97` select `outcome: "no-speech"` from `not raw` / `raw.empty()` rather than from `audio.no_speech`. The contract explicitly makes the audio validator the no-speech authority and forbids fabricating no-speech from an empty recognizer result or model failure.
- Material consequence: a supported speech request can be reported as successful silence, hiding recognition failure from callers and operational evidence.
- Required action: let only `audio.no_speech` produce no-speech; handle an unexpected empty recognizer result fail-closed under the existing safe failure contract, and test validator-silence versus speech-with-empty-model-output for both Python and native workers.

## Classification

- Classification: `Local Fix`
- Rationale: SR-006 and the runtime/benchmark contracts already define the correct behavior and owners. Each finding is a bounded implementation, test, packaging, or workflow correction; no product or architecture change is required.

## Recommended Recipient

- `implementation_engineer`
- Routing note: correct under a new `IR-*` revision, preserve the cumulative package and history, then return for implementation source review. API/E2E must not begin from `CRR-002`.

## Residual Risks

- Exact construction and actual-target execution of all eight required packages remain mandatory after source fixes.
- Licensed corpus, consent/redistribution evidence, M1 Max 30/100 latency/RSS/size, and formal notice/license approval remain fail-closed executable gates.
- Windows launcher/archive/process behavior, non-Apple faster-whisper, and every-target Fun-ASR feasibility remain unexecuted risks.
- Maintained-main reconciliation, pre-tag qualification on the integrated commit, tag/publication, and published-byte equality remain Delivery-owned.
- `auto` remains correctly omitted unless separately qualified.

## Latest Authoritative Result

- Review Decision: `Fail`
- Review Entry Point: `Implementation Review`
- Material-Premise Gate: `Pass`
- Score Summary: `8.6/10 (86/100)`; categories `2`, `5`, `7`, and `8` are below the clean-pass target.
- Failure Origin: implementation, packaging, qualification, and release-workflow defects against explicit approved contracts.
- Recommended Recipient: `implementation_engineer`
- Notes: The replacement architecture, clean cut, launcher/archive boundaries, and local checks are strong. The source cannot advance because ordinary protocol/runtime paths can corrupt or misclassify results and the current qualification/release path can approve untrusted or incorrectly measured evidence.
