# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `chinese-qualification-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced evidence trees.
- Upstream revisions/reviews: `SR-012`, `ARCH-REV-013`, `IR-022`, `CRR-032`, `CRR-033`.
- Exact reviewed source: `af008705488a029b95007e25c7c00484387d3ffe`.
- Implementation artifact/current upstream HEAD: `e01763aaebd7024e5c8ffa14fe878fed202f7b0e`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-015 / 15`.
- Prior result: `API-REV-014 — Fail / 99%` at `API-F-011` and `API-F-012` after 260/260 Chinese runtime attempts succeeded.
- Latest authoritative result: **`API-REV-015 — Fail / 99%` at `API-F-013` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: exact changed-byte/authority decision -> clean exact-source setup -> focused/full repository checks -> actual-M1 Functional Preflight 2 -> current-source input/corpus closure -> two canonical Chinese network-denied builds -> verification/reproducibility/compliance -> full-profile attempt -> fail-closed stop/cleanup.
- Material deviation: the Chinese profile failed during the cold phase, so its later warm/quality/lifecycle checks, current-source English, Qualification Set 2, and Branch Catalog Projection 2 were correctly not started.
- Existing coverage decision: English-v2 authority and `API-VOICE-013` remain valid under exact byte comparison. Prior profile evidence cannot be substituted into a current-source QSet.
- Durable API/E2E coverage changed: `No`.
- Reroute required: `Yes`; the actual controlled-host package exceeded a hard readiness deadline.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior observed: `No`.
- Approved persisted-data decision: `Not Affected`.
- User/desktop state: untouched; all source, input, corpus, package, and qualification roots were API/E2E-owned.
- Compatibility-only durable coverage added or retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario / Boundary                                 | Requirements / Criteria                                    | Actual Surface                                                         | Result                                          | Evidence                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `API-VOICE-001`                                     | source integrity                                           | clean detached exact source; focused/full suites                       | Pass                                            | `api-rev-015/repository/`                                                              |
| `API-VOICE-002` / `013`                             | `AC-007`, `AC-009`, `AC-017`                               | exact English authority and durable-validator continuity               | Pass / Reused                                   | authority-impact JSON and full check                                                   |
| current-host readiness                              | `AC-020`                                                   | actual M1 Functional Preflight 2                                       | Pass / controlled                               | preflight JSON/log                                                                     |
| exact inputs/corpora                                | `AC-006`, `AC-007`, `AC-009`, `AC-017`                     | source-bound recipes and exact 49/200 WAV validators                   | Pass                                            | `api-rev-015/inputs/`                                                                  |
| current Chinese construction                        | `AC-006`, `AC-017`, `AC-019`                               | two Seatbelt network-denied builds, verifier, reproducibility          | Pass                                            | archive SHA-256 `e867796b...66c0`                                                      |
| current Chinese resource policy / prior `API-F-012` | `AC-003`, `AC-017`, `AC-023`                               | real packaged provider process tree and Summary/Assessment policy join | Pass / Resolved                                 | `3,944,415,232` B <= `4,294,967,296` B; 2.5-GiB optimization miss remains non-blocking |
| Chinese cold-start stability / `API-F-013`          | `AC-003`, `AC-008`, `AC-011`, `AC-017`, `AC-020`, `AC-023` | fresh public packaged process after exact filesystem-cold procedure    | **Fail — timeout**                              | 22 started; 21 succeeded; attempt 22 `READY_TIMEOUT`                                   |
| corrected Chinese quality / prior `API-F-011`       | `AC-007`, `AC-009`, `AC-017`, `AC-023`                     | current v2 scorer/map/baseline identity and 200-WAV inference          | Identity propagation Pass; execution incomplete | stopped before warm/quality phase                                                      |
| `API-VOICE-011` Chinese package compliance          | package-specific audit                                     | exact current archive                                                  | Pass                                            | `package-compliance-v1.json`                                                           |
| current-source `API-VOICE-003`                      | complete English subject                                   | serial current matrix                                                  | Not Tested after mandatory Chinese Fail         | fail-closed stop                                                                       |
| `API-VOICE-012`                                     | QSet 2 / projection 2                                      | exact two-profile aggregate                                            | Not Tested after mandatory Chinese Fail         | two passing summaries required                                                         |
| `API-VOICE-005`–`010`                               | non-current targets                                        | none                                                                   | Deferred / Outside Current Matrix               | approved scope                                                                         |

## Repository Coverage Execution

| Command / Action                                                       | Result                                                                                                        | Evidence                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| exact prior/current authority and changed-source comparison            | Pass; English-v2 reusable, Chinese v2 active, global RSS literal/default absent, prior profile reuse rejected | `repository/API-VOICE-002-013-and-SR-012-authority-impact.json` |
| `npm ci --ignore-scripts`                                              | Pass; 8 packages, zero vulnerabilities                                                                        | `repository/npm-ci.log`                                         |
| focused scoring/policy/trust/retention suite                           | Pass, 29/29                                                                                                   | `repository/focused-scoring-policy-trust-retention.log`         |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Pass: 95/95 Node TAP; 7/7 Python plus compileall; all Go/source/schema/evidence checks                        | `repository/npm-run-check.log`                                  |
| post-execution exact-source integrity                                  | Pass; exact HEAD, clean status, diff check                                                                    | `repository/post-execution-source-integrity.log`                |

## Validation Confidence Scorecard

Confidence measures the certainty of the recorded **Fail**, not implementation acceptance.

| Category                                            | Post-Repository | Final | Evidence / Limitation                                                                                                                     |
| --------------------------------------------------- | --------------: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |             85% |   95% | critical Chinese cold-start gate directly fails; later Chinese, English, and aggregate criteria stopped as required                       |
| Changed-boundary execution directness               |             90% |  100% | exact reviewed package, public launcher, filesystem-cold procedure, real model process                                                    |
| Cross-boundary integration realism and mock gap     |             75% |  100% | actual M1, network-denied construction, relocated/read-only package setup, real provider process                                          |
| Environment/configuration/identity/fixture fidelity |             85% |  100% | exact source, tools, AC, purge, Seatbelt, input recipes, and 49/200 corpus identities                                                     |
| Failure/edge/lifecycle/recovery evidence            |             80% |  100% | real hard timeout, bounded termination, ledger/Summary/Assessment retention, and post-failure cleanup; later lifecycle gates not accepted |
| User/browser/desktop                                |             N/A |   N/A | runtime-only; no UI claim                                                                                                                 |
| Durable regression quality                          |             95% |  100% | focused/full valid suites pass; no API/E2E-owned durable edit                                                                             |

- Overall post-repository confidence: `85%`.
- Overall final confidence: `99%` (simple average of applicable rounded category scores).
- Every critical acceptance criterion directly proven to pass: `No`.
- Any final applicable category below 90%: `No`.
- Default clean Pass target met: `No`; one hard deadline violation prevents Pass regardless of confidence.
- Confidence-limiting residual risk: focused review must determine whether the progressive cold-start slowdown is a bounded runtime implementation defect or a design-level deadline/stability issue.

## Broader Validation Decision And Execution

- Decision: `Required / Executed / Fail`.
- Selected mode: actual-host native package, CLI/session, real provider/model, exact filesystem-cold procedure, resource, compliance, and terminal evidence.
- No browser/Electron execution: runtime-only and no desktop claim.
- Execution root: `/private/tmp/autobyteus-voice-api-e2e-r15-20260804-v1`.
- Exact source checkout: `/private/tmp/autobyteus-voice-api-e2e-r15-20260804-v1/repository` at `af008705488a029b95007e25c7c00484387d3ffe`, clean before and after execution.

### Actual M1 Environment

- Host: `MacBookPro18,4`, Apple M1 Max, 64 GiB, `darwin-arm64`.
- Functional Preflight 2: Pass on AC with Low Power Mode off, normal thermal/memory state, exact Node/Go/CMake/Xcode/SDK/clang++/ranlib/sed/tar identities, Seatbelt canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `controlled`; CPU-idle samples `[72.31, 79.23, 82.38, 85.29, 84.10, 82.88]`, average `81.03166666666668%`, no task-owned competing process.
- Post-failure observation: AC remained connected, no thermal/performance warning was recorded, memory-pressure output reported 93% free, and the CPU snapshot was 81.8% idle. These observations do not override the hard timeout.

### Current Chinese Package

- Two canonical builds ran wholly inside the pinned network-denied Seatbelt profile after one preflight-bound trusted environment was created outside Seatbelt.
- Reproducibility: Pass; both archive SHA-256 values are `e867796b0b362f27e3800f593ffac1201e710d3f2b87af883cd1437660ad66c0`.
- Package verification: Pass; `1,068,524,833` bytes compressed, `1,285,163,754` bytes extracted, 21 entries, descriptor/schema/modes/read-only checks Pass.
- Compliance: Pass for the exact archive and provenance.
- Initial relocation/offline setup passed. Full no-mutation, recovery, runtime-conformance, and quality evidence were not reached after the cold timeout and are not claimed.

### Prior Finding Rechecks

- `API-F-012` is directly resolved. Summary binds `voice-runtime-profile-resource-policy-v1` SHA-256 `d2711077...744` and the exact Chinese row: hard ceiling `4,294,967,296` B; optimization target `2,684,354,560` B. Observed peak was `3,944,415,232` B, so the hard gate passes. Assessment independently and non-blockingly records the 2.5-GiB optimization miss.
- `API-F-011` source identity correction is present: scorer `autobyteus-chinese-cer-selection-comparable-v1`, scorer SHA-256 `7ca1743c...af5`, map SHA-256 `f4b8969d...369`, and baseline `chinese-promoted-baseline-v2`. The 200-WAV candidate recheck did not run because the preceding hard timeout stopped the profile; no quality Pass is claimed.

### `API-F-013` — Cold Preparation Timeout

- Expected: exactly 30 filesystem-cold process trials with zero failures/timeouts; after a valid `hello`, the package must emit `inference-ready` within the immutable 30,000-ms preparation deadline.
- Observed: attempts 1–21 succeeded. The last five successful preparation measurements rose through `21,018.183`, `21,069.625`, `23,315.952`, `26,989.164`, and `29,460.149` ms.
- Attempt 22 (`sequence: 21`, `cold index: 21`) emitted a valid hello in `943.551` ms but never reached `inference-ready` before `READY_TIMEOUT`; total attempt wall time was `34,884.236` ms.
- Terminal result: ledger and Summary both finalize `fail / timeout`, with `22 started / 21 succeeded / 1 failed / 1 timed out / 0 excluded`; Performance Assessment binds the failed Summary as `controlled-miss` and records one hard-deadline violation.
- Runner exit: nonzero (`1`). No retry, timeout relaxation, warm proxy, transcript exclusion, provider/model substitution, or threshold change occurred.
- Preliminary classification: `Unclear`. This is a direct packaged-provider cold-start reliability failure under a controlled actual-M1 run; focused source/runtime failure-origin review must select the owner.

## Platform / Runtime And Desktop Decision

- Reached: exact current-source Chinese darwin-arm64 construction and 21 successful cold packaged starts before one timeout.
- Not reached: remaining 8 cold trials, 30 warm-preparation trials, 200 warm/quality requests, full lifecycle/recovery/no-mutation gates, current-source English, QSet 2, and projection 2.
- Other OS/architectures and `auto`: deferred and not claimed.
- Browser/Electron: `N/A`; no desktop application was launched or modified.
- Chinese 4.0-GiB result is limited to this exact supported darwin-arm64 package/host and is not generalized to lower-memory, concurrent, x64, auto, or other targets.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- All checkout/input/corpus/build/evidence/session roots were API/E2E-owned. No command targeted `~/.autobyteus` or desktop installation state.
- The failed provider was boundedly terminated by the production qualification owner. No task-owned provider/build/qualification process remained after cleanup.

## Durable Coverage Changed

- Repository-resident durable coverage added, updated, or removed: `No`.
- Paths added/updated/removed: none.
- Proportional successful test-code review: `Not Applicable`; this is a focused failure-origin handoff.

## Evidence

- Repository: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-015/repository/`
- Environment: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-015/environment/`
- Inputs: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-015/inputs/`
- Chinese package/profile: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-015/chinese-darwin-arm64/`
- Finding: `API-F-013-chinese-cold-preparation-timeout.json`.
- Terminal evidence: `qualification-attempts-v1.json`, `qualification-summary-v2.json`, `performance-assessment-v1.json`, and `run-profile-qualification.log`.

## Cleanup

- Owned preflight `caffeinate`: no longer present at cleanup; no user process was stopped.
- Task-owned build/provider/qualification processes: none remained.
- Exact-source checkout and package/input roots: retained under `/private/tmp/autobyteus-voice-api-e2e-r15-20260804-v1` for focused review/reproduction.
- User product state, unrelated processes, maintained-main, tags, releases, and publication: untouched.

## Preliminary Classification

- `API-F-013`: `Unclear` between a bounded packaged-provider/runtime reliability defect and a design-level cold-start deadline/stability issue.
- `API-F-012`: resolved at the actual current package boundary.
- `API-F-011`: corrected identities observed, but its full 200-WAV execution recheck remains incomplete because `API-F-013` stopped the run first.
- Recommended recipient: Code Reviewer for focused failure-origin review.

## Latest Authoritative Result

- Result: **`Fail`** under the current approved contract.
- Direct runtime result: **21/22 current-source Chinese cold attempts succeeded; attempt 22 failed the hard readiness deadline.**
- Final confidence: `99%` in the recorded Fail.
- Default `95%` clean-Pass target met: `No`; a critical hard deadline fails.
- Broader validation: `Required / Executed / Fail`.
- Required next recipient: `code_reviewer` for focused `API-F-013` failure-origin review.
- Remaining after reviewed resolution: complete current-source Chinese, current-source English, Qualification Set 2, and independently verified Branch Catalog Projection 2. Delivery-only integration/release work remains later.
