# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `chinese-qualification-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, `cold-preparation-stability-study.md`, and their referenced evidence trees.
- Upstream revisions/reviews: `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-023`, `CRR-034`, `CRR-035`.
- Exact reviewed source: `32829080938911f0f46390a3fd2af823e105bd32`.
- Implementation artifact/upstream HEAD at handoff: `acdff904a64be4d9aa63d2a63588ecda045e4ed8`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-016 / 16`.
- Prior result: `API-REV-015 — Fail / 99%` at `API-F-013`, Chinese cold attempt 22 `READY_TIMEOUT`.
- Latest authoritative result: **`API-REV-016 — Fail / 99%` at `API-F-014` in `API-VOICE-012`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: exact changed-byte/authority decision -> clean exact-source setup -> focused/full repository checks -> actual-M1 Functional Preflight 2 -> exact input/corpus closure -> serial Chinese and English double construction -> verification/reproducibility/compliance -> full profiles -> Qualification Set 2 -> fail-closed stop before Branch Catalog Projection 2.
- Existing coverage decision: English-v2/Chinese-v2 authorities and `API-VOICE-013` remained valid under exact byte comparison; no prior profile evidence entered the current-source qualification.
- Durable API/E2E coverage changed: `No`.
- Reroute required: `Yes`; the final aggregate verifier diverges from the canonical Build Input Path 1 policy.
- Execution interruptions/setup notes:
  - An initial unified-exec qualification was externally terminated when the user interrupted a wait; it retained an `in-progress` ledger only and no terminal Summary/Assessment. That nonterminal infrastructure execution is preserved under `interrupted-execution/` and is not acceptance evidence. The user's explicit continue request authorized one clean workflow restart; no observed product failure was retried.
  - One setup attempt correctly rejected inherited `CPATH`, `LIBRARY_PATH`, and `SDKROOT` before native-environment creation or package construction. The corrected launcher removed those untrusted ambient overrides without source change; evidence is retained under `setup-attempt-1/`.
  - After the final Chinese production qualifier exited `0` with `functionalDecision: pass`, a temporary outer harness checked the obsolete field name `decision` and stopped before English. The exact Chinese result was preserved; execution resumed serially at English without rerunning Chinese. Evidence is under `harness-checkpoint-after-chinese-pass/`.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior observed: `No`.
- Approved persisted-data decision: `Not Affected`.
- User/desktop state: untouched; all source, input, corpus, package, and qualification roots were API/E2E-owned.
- Compatibility-only durable coverage added or retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario / Boundary                     | Requirements / Criteria                                                    | Actual Surface                                                     | Result                            | Evidence                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------- |
| `API-VOICE-001`                         | source integrity                                                           | clean exact source; focused/full suites                            | Pass                              | `api-rev-016/repository/`                                                       |
| `API-VOICE-002` / `013`                 | `AC-007`, `AC-009`, `AC-017`                                               | exact authority/durable-validator continuity                       | Pass / Reused                     | authority-impact JSON and full check                                            |
| current-host readiness                  | `AC-020`, `AC-023`                                                         | actual M1 Functional Preflight 2                                   | Pass / `loaded-host`              | preflight JSON/log                                                              |
| exact inputs/corpora                    | `AC-006`, `AC-007`, `AC-009`, `AC-017`                                     | source-bound recipes and 49/200 WAV validators                     | Pass                              | `api-rev-016/inputs/`                                                           |
| `API-VOICE-004` Chinese package/profile | `AC-003`, `AC-006`–`011`, `AC-017`, `AC-019`, `AC-020`, `AC-023`, `AC-024` | two network-denied builds, public package, real Fun-ASR, 30/30/200 | **Pass — 260/260**                | `chinese-darwin-arm64/`                                                         |
| prior `API-F-013`                       | cold preparation reliability                                               | 30 exact filesystem-cold starts plus Stage Evidence 1              | **Resolved / Pass**               | 30/30; p95 `2,144.220 ms`; zero deadline violation                              |
| `API-VOICE-003` English package/profile | `AC-003`, `AC-006`–`011`, `AC-017`, `AC-019`, `AC-020`, `AC-023`           | two network-denied builds, public package, real MLX, 30/30/100     | **Pass — 160/160**                | `english-darwin-arm64/`                                                         |
| `API-VOICE-011` compliance/privacy      | exact packages                                                             | generated notices/licenses and runtime evidence                    | Pass both                         | package compliance and Stage Evidence                                           |
| `API-VOICE-012` QSet 2 / projection 2   | `AC-006`, `AC-019`, `AC-021`, `AC-023`                                     | independent two-profile aggregate                                  | **Fail — `API-F-014`**            | QSet marks Chinese `qualification-verification-failed`; projection not produced |
| `API-VOICE-005`–`010`                   | non-current targets                                                        | none                                                               | Deferred / Outside Current Matrix | approved scope                                                                  |

## Repository Coverage Execution

| Command / Action                                                       | Result                                                                          | Evidence                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| exact prior/current authority and changed-source comparison            | Pass; current authority/contracts exact, prior profile reuse rejected           | `repository/API-VOICE-002-013-and-SR-014-authority-impact.json` |
| cold-preparation study checksums                                       | Pass, 6/6                                                                       | `repository/cold-preparation-study-checksums.log`               |
| focused CommonCrypto/diagnostic/stage-evidence coverage                | Pass, 28/28                                                                     | `repository/focused-cold-stability-diagnostics.log`             |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Pass: 109/109 Node; 7/7 Python plus compileall; all Go/source/schema/evidence   | `repository/npm-run-check.log`                                  |
| post-execution exact-source integrity                                  | Pass; exact HEAD, clean status, diff check                                      | `repository/post-execution-source-integrity.log`                |
| independent profile verifier probe                                     | English Pass; Chinese fails only at `verifyBuildBinding()` stale path predicate | `aggregate/API-VOICE-012-profile-verifier-probe.log`            |

## Validation Confidence Scorecard

Confidence measures certainty of the recorded **Fail**, not implementation acceptance.

| Category                                            | Post-Repository | Final | Evidence / Limitation                                                                        |
| --------------------------------------------------- | --------------: | ----: | -------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |             85% |  100% | both complete profiles directly pass; QSet aggregate directly fails                          |
| Changed-boundary execution directness               |             90% |  100% | exact packages, launchers, providers, corpora, and aggregate owner                           |
| Cross-boundary integration realism and mock gap     |             75% |  100% | actual M1, network-denied construction, relocated/read-only packages, real inference         |
| Environment/configuration/identity/fixture fidelity |             85% |  100% | exact source/tools/AC/purge/Seatbelt/recipes/49+200 corpora; loaded-host truthfully retained |
| Failure/edge/lifecycle/recovery evidence            |             80% |  100% | zero profile failures plus direct aggregate failure, complete lifecycle/recovery evidence    |
| User/browser/desktop                                |             N/A |   N/A | runtime-only; no UI claim                                                                    |
| Durable regression quality                          |             95% |   95% | strong accepted suites; stale aggregate path predicate lacks the required exact regression   |

- Overall post-repository confidence: `85%`.
- Overall final confidence: `99%` (simple average of applicable categories, rounded).
- Every critical acceptance criterion directly proven to pass: `No`; `API-VOICE-012` / QSet 2 fails.
- Any final applicable category below 90%: `No`.
- Default clean Pass target met: `No`; a critical aggregate verifier fails regardless of confidence.

## Broader Validation Decision And Execution

- Decision: `Required / Executed / Fail`.
- Selected mode: actual-host native packages, CLI/session, real providers/models, exact filesystem-cold procedure, resource, compliance, terminal evidence, and independent aggregate verification.
- Execution root: `/private/tmp/autobyteus-voice-api-e2e-r16-20260804-v3`.
- Exact source checkout: `/private/tmp/autobyteus-voice-api-e2e-r16-20260804-v2/repository` at `32829080938911f0f46390a3fd2af823e105bd32`, clean before and after execution.

### Actual M1 Environment

- Host: `MacBookPro18,4`, Apple M1 Max, 64 GiB, `darwin-arm64`.
- Functional Preflight 2: Pass on AC with Low Power Mode off, normal thermal/memory state, exact Node/Go/CMake/Xcode/SDK/clang++/ranlib/sed/tar identities, Seatbelt canaries, and exact purge capability.
- Performance classification: `loaded-host-observation`; idle samples `[71.89, 75.22, 76.33, 73.81, 73.30, 65.76]`, average `72.71833333333333%`, no task-owned competing process. Functional execution remains eligible; no controlled claim is made.

### Current Chinese Package

- Two canonical network-denied builds reproduced archive SHA-256 `84783c61b8a08e0e0848a4906139210868cf552ee0104d5179be7144be432cc3`.
- Package verification/compliance: Pass; `1,068,528,640` bytes compressed, `1,285,167,443` bytes extracted, 22 entries.
- Runtime: `260 started / 260 succeeded / 0 failed / 0 timed out / 0 excluded`; 30 cold, 30 warm preparation, 200 warm/quality.
- Quality: CER `0.05197568389057751` (`342/6580`) versus baseline `0.052127659574468084` (`343/6580`); Pass.
- Resource: `2,105,065,472` bytes peak <= `4,294,967,296` hard ceiling and <= `2,684,354,560` optimization target.
- Preparation evidence: 60/60 valid attempts, ten exact private records each, privacy/order/clock/window joins Pass.
- Relocation, offline, read-only/no-mutation, recovery, protocol/lifecycle, deadlines, license/privacy: Pass.
- Performance: `loaded-host-observation`; all p95 references pass.

### Current English Package

- Two canonical network-denied builds reproduced archive SHA-256 `9e4d1d5981ba9389f63bdf98094078a6152fbac05ff42d52c287138baafa46f8`.
- Package verification/compliance: Pass; `645,513,268` bytes compressed, `1,195,561,364` bytes extracted, 6,502 entries.
- Runtime: `160 started / 160 succeeded / 0 failed / 0 timed out / 0 excluded`; 30 cold, 30 warm preparation, 100 warm/quality.
- Quality: WER `0.07223942208462332`, equal to the trusted baseline across 49 exact WAVs; Pass.
- Resource: `1,770,749,952` bytes peak <= `2,684,354,560` hard ceiling.
- Relocation, offline, read-only/no-mutation, recovery, protocol/lifecycle, deadlines, license/privacy: Pass.
- Performance: `loaded-host-observation`; all p95 references pass.

### `API-F-014` — QSet Build Input Path Policy Divergence

- Expected: Qualification Set 2 independently consumes the same canonical Build Input Path 1 grammar used by materialization, package assembly, and mandatory package verification, then retains two functional Pass rows.
- Observed: the QSet owner writes `functionalDecision: fail`; English independently verifies Pass, while Chinese becomes `fail / qualification-verification-failed`.
- Direct cause: `release/evidence/bindings.mjs:131-142` uses obsolete `/^[A-Za-z0-9._/-]+$/`. The exact authenticated 3,152-file Chinese manifest contains ten legitimate paths using approved `()`, `[]`, or `+` routing syntax. They passed the canonical input/package validators but fail only this old predicate.
- Exact probe: `verifyProfileQualificationEvidence()` returns English Pass and Chinese `Preserved build-input manifest invalid.`
- Terminal result: Qualification Set command exits nonzero after durably writing the Fail artifact. Branch Catalog Projection 2 is not generated.
- No path rename/omission/projection/mutation, source workaround, retry, provider/model/threshold change, Catalog 3, tag, release, or publication occurred.
- Preliminary classification: `Local Fix`; the QSet/profile verifier should reuse the canonical Build Input Path 1 owner and retain an exact regression for these ten paths.

## Platform / Runtime And Desktop Decision

- Reached: both complete exact current-source darwin-arm64 packages and the QSet 2 failure boundary.
- Not reached: Branch Catalog Projection 2 because its mandatory QSet prerequisite failed.
- Other OS/architectures and `auto`: deferred and not claimed.
- Browser/Electron: `N/A`; no desktop application was launched or modified.
- Chinese resource result is limited to this exact package/host; it is not generalized to lower-memory, concurrent, x64, auto, or other targets.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- All checkout/input/corpus/build/evidence/session roots were API/E2E-owned. No command targeted `~/.autobyteus` or desktop installation state.
- No task-owned provider/build/qualification or owned `caffeinate` process remained after cleanup.

## Durable Coverage Changed

- Repository-resident durable coverage added, updated, or removed: `No`.
- Paths added/updated/removed: none.
- Proportional successful test-code review: `Not Applicable`; this is a focused failure-origin handoff.

## Evidence

- Repository: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/repository/`
- Environment: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/environment/`
- Inputs: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/inputs/`
- Chinese profile: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/chinese-darwin-arm64/`
- English profile: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/english-darwin-arm64/`
- Aggregate/finding: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/aggregate/`

## Cleanup

- Owned preflight `caffeinate` processes: terminated/reaped; no user process was stopped.
- Task-owned build/provider/qualification processes: none remained.
- Exact-source checkout and package/input roots: retained under `/private/tmp/autobyteus-voice-api-e2e-r16-20260804-v3` for focused review.
- User product state, unrelated processes, maintained-main, tags, releases, and publication: untouched.

## Preliminary Classification

- `API-F-014`: `Local Fix` in the aggregate/profile-verifier source. The approved canonical Build Input Path 1 behavior is clear and already directly passes materialization/package verification.
- `API-F-013`: resolved at the actual package boundary.
- Recommended recipient: Code Reviewer for focused failure-origin review and owner confirmation.

## Latest Authoritative Result

- Result: **`Fail`** under the current approved contract.
- Direct runtime result: **Chinese 260/260 Pass; English 160/160 Pass.**
- Aggregate result: **Qualification Set 2 Fail at `API-F-014`; Branch Catalog Projection 2 not produced.**
- Final confidence: `99%` in the recorded Fail.
- Default `95%` clean-Pass target met: `No`; a critical aggregate verifier fails.
- Broader validation: `Required / Executed / Fail`.
- Required next recipient: `code_reviewer` for focused `API-F-014` failure-origin review.
