# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and referenced evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-021`, `CRR-030`, `CRR-031`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-014 / 14`.
- Reviewed source: `57efa584b34f2b9a5eaba012c01f7e05228dffed`.
- Prior result: `API-REV-013 — Fail / 98%` at `API-F-010` during final Chinese C++ linkage.
- Latest authoritative result: **`API-REV-014 — Fail / 99%` at `API-F-011` and `API-F-012` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: exact changed-byte/authority decision -> clean exact-source setup -> focused/full repository checks -> actual-M1 Functional Preflight 2 -> current-source materialization/corpus validation -> two canonical Chinese network-denied builds -> verification/reproducibility/compliance -> complete packaged Chinese qualification -> focused quality-contract and resource analysis -> fail-closed stop/cleanup.
- Existing coverage decision: English-v2 authority and API-VOICE-013 bytes remain unchanged/reusable. No prior profile evidence can be substituted into a current-source QSet.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`. The corrected C++ identity and complete package/runtime behavior pass, but the approved Chinese functional decision fails quality non-regression and RSS gates.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; all execution used API/E2E-owned roots and did not target product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario / Boundary                        | Requirements / Criteria                 | Actual Surface                                                                       | Result                                  | Evidence                                               |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------ |
| `API-VOICE-001`                            | source integrity                        | clean detached exact source; focused/full suites                                     | Pass                                    | `api-rev-014/repository/`                              |
| `API-VOICE-002` / `013`                    | `AC-007`, `AC-009`, `AC-017`            | exact authority/validator changed-byte continuity                                    | Pass / Reused                           | authority-impact JSON and full check                   |
| current-host readiness                     | `AC-020`                                | actual M1 Functional Preflight 2                                                     | Functional Pass / loaded-host           | exact preflight JSON/log                               |
| exact inputs/corpora                       | `AC-006`, `AC-007`, `AC-009`, `AC-017`  | source-bound recipes and 49/200 WAV validators                                       | Pass                                    | `api-rev-014/inputs/`                                  |
| `API-F-010` / C++ link                     | `AC-006`, `AC-017`, `AC-019`            | authenticated `clang++ -> clang` identity through real CMake/link/archive            | Pass / Resolved                         | two complete Chinese archives                          |
| Chinese construction                       | `AC-006`, `AC-017`, `AC-019`            | two Seatbelt network-denied builds, verifier, reproducibility                        | Pass                                    | byte-identical SHA-256 `aa785afb...98327`              |
| Chinese runtime functionality              | `AC-003`, `AC-008`, `AC-011`, `AC-017`  | public relocated package, real model, 30/30/200 attempts, lifecycle/recovery/offline | Pass                                    | 260/260 successes; conformance and Summary evidence    |
| Chinese quality non-regression             | `AC-007`, `AC-009`, `AC-017`, `AC-023`  | 200 real WAVs and promoted baseline                                                  | **Fail — `API-F-011`**                  | CER and scoring-contract analysis                      |
| Chinese process-tree RSS                   | `AC-003`, `AC-017`, `AC-023`            | actual persistent packaged provider                                                  | **Fail — `API-F-012`**                  | 3,949,543,424 B versus 2,684,354,560 B limit           |
| `API-VOICE-011` Chinese compliance/privacy | package-specific audit                  | exact current archive                                                                | Pass                                    | package-compliance-v1 and offline/no-mutation evidence |
| current-source `API-VOICE-003`             | complete English current-source subject | serial matrix                                                                        | Not Tested after mandatory Chinese Fail | fail-closed stop                                       |
| `API-VOICE-012`                            | QSet 2 / projection 2                   | exact two-profile aggregate                                                          | Not Tested after mandatory profile Fail | two passing summaries required                         |
| `API-VOICE-005`–`010`                      | non-current targets                     | none                                                                                 | Deferred / Outside Current Matrix       | approved scope                                         |

## Repository Coverage Execution

| Command / Action                                                       | Result                                                                                             | Evidence                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| exact prior/current authority and changed-source comparison            | English-v2 authority/API-VOICE-013 unchanged; only strict C++ identity source delta applies        | `repository/API-VOICE-002-013-authority-impact.json` |
| `npm ci --ignore-scripts`                                              | Pass; 8 packages, zero vulnerabilities                                                             | `repository/npm-ci.log`                              |
| focused strict native identity tests                                   | Pass, 11/11, zero skips                                                                            | focused repository log                               |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Pass: 80 top-level / 87 TAP Node; 7/7 Python plus compileall; all Go/source/schema/evidence checks | `repository/npm-run-check.log`                       |

## Validation Confidence Scorecard

| Category                                   | Post-Repository | Final | Evidence / Limitation                                                                                                                     |
| ------------------------------------------ | --------------: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement/acceptance proof               |             85% |   95% | complete Chinese package/runtime subject directly passes or fails each gate; current-source English/aggregate stopped after critical fail |
| Changed-boundary directness                |             90% |  100% | corrected C++ identity reached real final link and two archives; full package/model/scorer/resource owners executed                       |
| Cross-boundary realism                     |             75% |  100% | actual M1, network-denied builds, relocated public package, 200 real WAVs, persistent worker                                              |
| Environment/configuration/fixture fidelity |             90% |  100% | exact source/toolchain/AC/purge/Seatbelt/input/corpus identities                                                                          |
| Failure/lifecycle/recovery                 |             80% |  100% | 260/260 successes, zero deadline violations, complete conformance/recovery/no-mutation, retained formal failure                           |
| User/browser/desktop                       |             N/A |   N/A | runtime-only; no UI claim                                                                                                                 |
| Durable regression quality                 |             95% |  100% | focused/full suites pass; reusable authority directly checked; no API/E2E durable edits                                                   |

- Overall post-repository confidence: `86%`.
- Overall final confidence: `99%`.
- Critical criteria fully proven: `No`; Chinese quality non-regression and RSS gates fail under the approved contract.
- Default clean Pass target met: `No`; confidence describes failure directness and cannot override critical criteria.

## Broader Validation Execution

### Authority And Current-Source Decision

- Exact English-v2 corpus, baseline, derivation, authority, supported reproduction owner, production validator, and API-VOICE-013 test bytes are unchanged and reusable.
- Provider/archive runtime is unchanged. The reviewed source delta is the strict specialized C++ invocation identity.
- Prior English profile evidence remains historical and cannot enter a current-source QSet. A new English run was not started after the mandatory Chinese Summary failed.

### Actual M1 Environment

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, `darwin-arm64`.
- Functional Preflight 2: Pass on AC with low-power off, owned `caffeinate`, normal thermal/memory state, exact Node/Go/CMake/Xcode/SDK/clang++/ranlib/sed/tar identities, Seatbelt canaries, and exact `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `loaded-host-observation`; idle samples `76.43, 77.86, 75.73, 78.52, 72.18, 74.80`, average `75.92%`, no task-owned competing process.
- Loaded-host classification did not block functional execution and is not represented as controlled performance.

### Chinese Package And `API-F-010` Resolution

- Both canonical network-denied builds completed through the corrected C++ link.
- Both archives are byte-identical at SHA-256 `aa785afb487b6a13cc22f2f14096b4c85c3c4c78f35e5e83b30631e11d398327`.
- Archive: `1,068,524,718` bytes compressed, `1,285,163,526` bytes extracted, 21 entries. The extracted size is below the `1,342,177,280`-byte gate.
- Package verification, reproducibility, relocation, compliance, offline execution, and no-mutation checks pass.
- This directly resolves `API-F-010`; prior input-path, ranlib, and sed corrections remain resolved.

### Chinese Runtime Functionality

- Executed 30 filesystem-cold process trials, 30 separate warm-preparation trials, and 200 persistent warm/quality requests; the first 100 warm requests are performance-counted and all 200 corpus items are quality-counted.
- Attempts: `260 started / 260 succeeded / 0 failed / 0 timed out / 0 excluded`.
- Hard-deadline violations: `0`.
- All 200 WAV files returned successful transcripts; empty/no-speech and failed quality counts are both `0`.
- Runtime conformance passes malformed/no-speech/request-timeout/unexpected-exit/forced-termination/clean-next-start/no-replay cases.
- Relocation, offline operation, no package mutation, recovery, license/compliance, and privacy evidence pass.

### Performance Observation

| Metric           | Sample Count |      p95 | Reference | Met                              |
| ---------------- | -----------: | -------: | --------: | -------------------------------- |
| handshake        |           30 |   624 ms |  1,000 ms | Yes                              |
| cold preparation |           30 | 10.851 s |      20 s | Yes                              |
| warm preparation |           30 | 10.326 s |      10 s | No — non-blocking reference miss |
| cold result      |           30 | 14.875 s |      25 s | Yes                              |
| warm request     |          100 |   748 ms |      10 s | Yes                              |

Performance Assessment 1 correctly records `loaded-host-observation`. The warm-preparation reference miss does not determine the functional result.

### `API-F-011` — Quality Evidence/Scoring Contract

- Current packaged result: `418 / 6,586`, CER `6.3468%`; it passes the absolute `7%` ceiling.
- Stored promoted baseline: `343 / 6,580`, CER `5.2128%`.
- Reported difference: `+1.1340` absolute points, paired 95% interval `[+0.7026, +1.6452]`, which fails the approved `+0.5`-point non-regression gate.
- Focused comparison finds 196/200 current raw transcripts are byte-identical to promoted result bytes. Those identical transcripts change from 334 baseline errors to 410 current errors, adding 76 errors solely under the different scoring contract. The four actually changed transcripts improve from 9 to 8 errors.
- Promoted selection scoring used NFKC + OpenCC `t2s` and retained only Han/ASCII alphanumeric units. Current qualification uses production `twp-to-cn` phrase/character conversion and removes only a narrow punctuation set, retaining other punctuation and changing some lexical forms.
- Preliminary classification: `Design Impact / evidence-authority and scoring-contract mismatch`, subject to focused origin review. No baseline/scorer/transcript was rewritten.

### `API-F-012` — Blocking RSS Budget

- Observed peak provider process-tree RSS: `3,949,543,424` bytes (`3.678 GiB`).
- Approved gate: `2,684,354,560` bytes (`2.5 GiB`). The result exceeds the gate by `1,265,188,864` bytes.
- The exact package nevertheless completes all 260 attempts successfully on the 64-GiB M1; the peak is about `5.75%` of host memory.
- The user explicitly prioritizes functionality and accepts the observed memory on this host. That direction is material design input, but API/E2E cannot silently change the current blocking requirement.
- Preliminary classification: `Design Impact or runtime-resource implementation issue`, subject to focused origin review.

## Platform / Runtime And Desktop Decision

- Current target reached: complete Chinese darwin-arm64 package and runtime qualification on the actual M1 Max.
- Current-source English: not started after mandatory Chinese functional Fail.
- Other OS/architectures and `auto`: deferred and not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- All checkout/input/corpus/build/evidence/session roots were API/E2E-owned. No command targeted `~/.autobyteus` or desktop installation state.
- Owned qualification/provider processes exited. Owned `caffeinate` was interrupted and reaped; no task-owned process remained.

## Durable Coverage Changed

None added, updated, or removed. This is a failure-origin review handoff, not a successful test-code review handoff.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/environment/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-014/chinese-darwin-arm64/`
- Functional Summary: `qualification-summary-v2.json`.
- Attempts and results: `qualification-attempts-v1.json`, `raw-results.json`, `result-index.json`.
- Lifecycle and performance: `runtime-conformance-v1.json`, `performance-samples-v1.json`, `performance-assessment-v1.json`.
- Findings: `API-F-011-chinese-quality-nonregression-failure.json`, `API-F-011-chinese-quality-contract-analysis.json`, `API-F-012-chinese-rss-gate-failure.json`.

## Cleanup

- Owned `caffeinate`: stopped and reaped.
- Task-owned build/provider/qualification processes: none present.
- Exact-source checkout and large package/input roots: retained under `/private/tmp/autobyteus-voice-api-e2e-r14-20260803` for focused review/reproduction.
- User product state, unrelated processes, tags, releases, maintained-main, and publication: untouched.

## Preliminary Classification

- `API-F-011`: `Design Impact / evidence-authority and scoring-contract mismatch`; focused review must decide the one canonical baseline/runtime scoring contract rather than weakening the threshold or rewriting evidence.
- `API-F-012`: `Design Impact or runtime-resource implementation issue`; the selected persistent packaged provider exceeds the budget assumed from isolated observations, while the user accepts the actual 3.678-GiB result on the 64-GiB M1.
- Recommended recipient: Code Reviewer for focused failure-origin review. Likely reset owner is Solution Designer unless review identifies a bounded implementation defect.

## Latest Authoritative Result

- Result: **`Fail`** under the current approved contract.
- Runtime functionality result: **Pass — 260/260 Chinese attempts succeeded, including all 200 corpus files.**
- Final confidence: `99%`.
- Default clean Pass target met: `No`; quality non-regression and RSS are currently blocking.
- Broader validation: `Required / Executed / Fail`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed resolution: current-source English full qualification, then Qualification Set 2 and independently verified Branch Catalog Projection 2. Delivery-only integration/release work remains later.
