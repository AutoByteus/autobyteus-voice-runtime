# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced evidence in the solution worktree.
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff / Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `implementation-revision-record.md`
- Code Review Report / Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `code-review-revision-record.md`
- Delivery Revision Record: `N/A`
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID / Round: `API-REV-008 / 8`
- Trigger: user confirmed AC power after `CRR-019` Pass for `IR-015`, reviewed source `24a994a51256f0eef5840ecdc977febec71ea491`.
- Prior Round Reviewed: `API-REV-007 — Blocked / 86%` on AC power before package construction.
- Latest Authoritative Round: **`API-REV-008 — Fail / 93%` at `API-F-004` in `API-VOICE-003`.**

## Investigation And Execution Basis

- Investigation completed before final execution: `Yes`; round-8 source, authority, existing-coverage, environment, fixture, and execution decisions were recorded first.
- Investigation plan followed: `Yes`; repository checks, actual Functional Preflight 2, input/corpus validation, and canonical English construction ran in fail-closed order.
- Existing coverage decisions revised during execution: `No`. `API-VOICE-002` and durable `API-VOICE-013` remained reusable only after exact byte comparison; no durable coverage changed.
- Reroute required during execution: `Yes`; exact primary English construction found `API-F-004`, and downstream execution stopped.
- No threshold/path-policy relaxation, input mutation, alternate provider/model, unsandboxed qualification, release action, or fabricated Pass was used.

## Compatibility / Legacy Scope Check

- Invalid backward compatibility in approved scope: `No`.
- Compatibility-only or legacy-retention behavior observed: `No`.
- Approved persisted-data transition followed: `Yes — Not Affected`; execution used owned paths and did not touch product user state.
- Durable compatibility-only coverage added or retained: `No`.
- Upstream recipient: `code_reviewer` for failure-origin review, unrelated to compatibility.

## Changed Boundary And Evidence Matrix

| Scenario ID                                                 | Requirement / Acceptance Criteria             | Boundary / Mode                                                                             | Evidence Type       | Result                            | Evidence                                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `API-VOICE-001`                                             | reviewed source integrity                     | exact detached source; focused/full repository suites                                       | Durable + Temporary | Pass                              | `api-rev-008/repository/`                                                                                                                 |
| `API-VOICE-002`                                             | `AC-007`, `AC-009`, `AC-017`                  | exact English-v2 authority continuity and real 49-WAV corpus validation                     | Temporary           | Pass / Reused                     | source-reuse JSON; `inputs/corpus-validation.log`                                                                                         |
| shared `API-VOICE-003`/`004` preflight                      | `AC-003`, `AC-017`, `AC-020`                  | actual M1 Functional Preflight 2                                                            | Live                | Pass                              | `environment/darwin-arm64-preflight-v2.json`: AC/thermal/memory/tool/sandbox/purge Pass; `loaded-host`, `69.83666666666667%` average idle |
| shared closed inputs/corpora                                | `AC-006`, `AC-007`, `AC-009`, `AC-017`        | exact recipe materialization and production corpus validators                               | Live                | Pass                              | `inputs/materialization.log`; `inputs/corpus-validation.log`: English 49 and Chinese 200 unique WAVs                                      |
| `API-VOICE-003`                                             | `AC-006`, `AC-017`                            | exact English darwin-arm64 primary package construction inside pinned deny-network Seatbelt | Live                | **Fail — `API-F-004`**            | `english-darwin-arm64/API-F-004-package-manifest-path-policy-failure.json`                                                                |
| `API-VOICE-003` remaining package/repro/inference/30/30/100 | current-platform contract                     | second construction, package verification, launcher/model qualification                     | Live                | Not Tested after Fail             | primary archive absent                                                                                                                    |
| `API-VOICE-004`, `011`, `012`                               | Chinese, compliance, QSet/projection criteria | actual packages/aggregate                                                                   | Live                | Not Tested after Fail             | fail-closed ordering                                                                                                                      |
| `API-VOICE-005`–`010`                                       | non-current targets                           | none                                                                                        | N/A                 | Deferred / Outside Current Matrix | approved current-platform scope                                                                                                           |
| `API-VOICE-013`                                             | production corpus trust/derivation regression | unchanged repository test                                                                   | Durable             | Pass / Reused                     | exact relevant bytes unchanged; focused/full suites pass                                                                                  |

## Additional Repository Coverage Execution

| Order | Command                                                                                      | Configuration                                 | Boundary                          | Result                                                                                             | Evidence                                            |
| ----- | -------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1     | `npm ci --ignore-scripts`                                                                    | clean detached exact source                   | deterministic dependencies        | Pass                                                                                               | `repository/npm-ci.log`                             |
| 2     | focused archive-normalization/native-environment/functional-retention/trusted-baseline tests | Node 22.23.1                                  | prior corrections and authorities | Pass, 17 top-level / 24 TAP                                                                        | `repository/focused-build-functional-authority.log` |
| 3     | `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check`                       | authenticated official Go 1.26.5 darwin-arm64 | full affected repository          | Pass: 69 top-level / 76 TAP Node; 7/7 Python plus compileall; all Go/source/schema/evidence checks | `repository/npm-run-check.log`                      |

## Validation Confidence Scorecard

| Confidence Category                                        | Post-Repository | Final | Change / Evidence                                                           | Residual Uncertainty                                |
| ---------------------------------------------------------- | --------------: | ----: | --------------------------------------------------------------------------- | --------------------------------------------------- |
| Requirement and acceptance-criteria proof                  |             85% |   88% | exact critical package gate directly fails                                  | downstream package/runtime criteria unexecuted      |
| Changed-boundary execution directness                      |             85% |   96% | actual preflight, exact staging/manifest, production Go validator           | no archive/launcher inference                       |
| Cross-boundary integration realism and mock gap            |             75% |   92% | real locked inputs/toolchains reached final archive validation              | provider runtime/model not started                  |
| Environment, configuration, identity, and fixture fidelity |             85% |   98% | actual M1 on AC, authenticated tools/purge, exact inputs and 49/200 corpora | none material before failure                        |
| Failure, edge-case, lifecycle, and recovery evidence       |             78% |   84% | direct fail-closed behavior and cleanup                                     | runtime lifecycle/recovery/attempt retention absent |
| User-surface, browser, and desktop-shell confidence        |             N/A |   N/A | runtime-only                                                                | none                                                |
| Durable regression coverage quality and relevance          |             95% |   99% | focused and full suites pass; no API test code changed                      | large run-specific proof is executable evidence     |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `93%` (simple average of six applicable categories, rounded).
- Confidence gain: direct actual-host preflight, exact closed fixtures, and the real package-construction failure eliminated major environmental/mock uncertainty.
- Every critical acceptance criterion directly proven: `No`.
- Final applicable categories below 90%: requirement/AC proof; failure/lifecycle/recovery.
- Default `95%` Pass target met: `No`; a critical acceptance criterion fails regardless of score.

## Broader Validation Decision And Execution

- Decision/mode: `Required`; actual-host CLI, native package, lifecycle, worker, corpus, resource, compliance, and aggregation qualification.
- Executed until critical failure: clean exact source -> repository checks -> owned `caffeinate` -> Functional Preflight 2 -> exact input materialization/corpus validation -> trusted native environment outside Seatbelt -> primary English build inside pinned deny-network Seatbelt.
- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64. AC power confirmed. Low-power off, thermal/memory normal, exact purge capability and sandbox canaries passed.
- Performance environment: `loaded-host`; average idle `69.83666666666667%`. This is non-blocking for functionality and is not called controlled performance.
- Exact build result: the package assembler normalized/materialized the Python runtime and emitted a 19,003-record file manifest. Production Go archive validation rejected it with `manifest paths invalid or unsorted`; no archive was emitted.
- Focused observer probe on the isolated exact-source checkout found zero ordering inversions and zero case collisions, but exactly two archive-policy-invalid retained paths:
  - `host/python/lib/python3.12/site-packages/scipy/io/tests/data/Transparent Busy.ani`
  - `host/python/lib/python3.12/site-packages/torch/include/c10/util/C++17.h`
- The temporary observer added no behavior change, restored `build/package-assembler.mjs` to its exact original SHA-256, and left the detached source checkout clean.

| Step                                         | Expected                                                | Observed                                  | Result                |
| -------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- | --------------------- |
| Functional Preflight 2                       | functional Pass on connected M1; classify load honestly | Pass; `loaded-host`                       | Pass                  |
| exact English/Chinese inputs and corpora     | closed recipe identities; 49/200 unique WAVs            | exact materialization and validators pass | Pass                  |
| first English package construction           | canonical archive created inside Seatbelt               | final manifest rejected; archive absent   | **Fail / API-F-004**  |
| repeat/repro/profile/Chinese/QSet/projection | run only after first archive exists                     | correctly not started                     | Not Tested after Fail |

## Desktop Application Validation

- Browser/desktop approach: `N/A`; this is runtime-only and no Electron/UI behavior is claimed.
- Shell-specific behavior: native package construction via CLI/Seatbelt was directly executed.
- Effect on an already-running desktop application: `None`.

## Platform / Runtime Targets

- Host: macOS darwin-arm64, MacBookPro18,4, Apple M1 Max, 64 GiB.
- Tooling: Node 22.23.1, authenticated official Go 1.26.5 darwin-arm64, repository-bound CMake/Xcode/SDK/system identities.
- Current release matrix: English MLX Whisper Small FP16 and Chinese Fun-ASR-Nano GGUF Q8 on darwin-arm64 only.
- Other targets: deferred and not claimed.

## Lifecycle / Upgrade / Restart / Persisted-Data Checks

- Approved persisted-data decision: `Not Affected`.
- Representative existing user data: `N/A`; repository owns no supported product data reader/writer.
- User state mutation: none observed or performed.
- Runtime lifecycle/relocation/recovery: Not Tested after archive-construction Fail.
- Compatibility fallback: none used or observed.

## Durable Coverage Changed In The Codebase

- Repository-resident durable coverage added, updated, or removed: `No`.
- Paths added/updated/removed: none.
- Proportional test-code review: `Not Applicable`.

## Other Execution Artifacts

| Artifact                                                                                                | Purpose                                       | Retention |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------- |
| `api-e2e-evidence/api-rev-008/repository/`                                                              | source identity and repository checks         | Retained  |
| `api-e2e-evidence/api-rev-008/environment/darwin-arm64-preflight-v2.json`                               | actual-host functional/readiness authority    | Retained  |
| `api-e2e-evidence/api-rev-008/inputs/`                                                                  | exact materialization and 49/200 corpus proof | Retained  |
| `api-e2e-evidence/api-rev-008/english-darwin-arm64/build-primary.log`                                   | exact production failure                      | Retained  |
| `api-e2e-evidence/api-rev-008/english-darwin-arm64/API-F-004-package-manifest-path-policy-failure.json` | structured finding                            | Retained  |
| `api-e2e-evidence/api-rev-008/english-darwin-arm64/API-F-004-focused-manifest-analysis.json`            | invalid-path isolation                        | Retained  |

## Temporary Execution Methods / Scaffolding

| Method                                                                        | Why                                                                              | Result                                                                       | Cleanup                                                            |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| isolated source-checkout observer inserted immediately before Go archive call | capture the generated manifest after the production error had already reproduced | confirmed 19,003 sorted/collision-free records and exactly two invalid paths | production file restored to exact original SHA-256; checkout clean |
| owned `/usr/bin/caffeinate -dimsu`                                            | preserve functional host readiness                                               | preflight and construction attempt completed                                 | PID 48740 interrupted/reaped; absent                               |

## Dependencies Mocked Or Emulated

None. Locked runtime/model inputs, toolchains, corpora, and actual M1 host were used. The focused manifest observer captured production-generated data and did not emulate package behavior.

## Result Summary

| Result                | Scenario IDs                                           | Summary                                                                                                                |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Pass                  | `API-VOICE-001`, `002`, `013`; shared preflight/inputs | repository, authority, actual M1 preflight, exact inputs and corpora pass                                              |
| Fail                  | `API-VOICE-003` / `API-F-004`                          | exact primary English package cannot be archived because two retained dependency paths violate the package path policy |
| Not Tested after Fail | remaining `API-VOICE-003`, `004`, `011`, `012`         | no primary English archive; fail-closed stop                                                                           |
| Deferred              | `API-VOICE-005`–`010`                                  | outside approved current release matrix                                                                                |

## Cleanup Performed

| Resource                                 | Ownership       | Action                                          | Result                                           |
| ---------------------------------------- | --------------- | ----------------------------------------------- | ------------------------------------------------ |
| `caffeinate` PID 48740                   | API-REV-008     | interrupted/reaped                              | absent                                           |
| package/provider/qualification processes | API-REV-008     | process scan                                    | none present                                     |
| isolated exact-source checkout           | API-REV-008     | source restored after probe; retained for rerun | clean at exact `24a994a...`                      |
| user state / releases                    | user / Delivery | untouched                                       | no mutation, tag, publication, or release action |

## Preliminary Classification

- `Local Fix / implementation defect` in package assembly closure/path-policy integration.
- The exact runtime tree retains two non-runtime dependency files whose paths cannot satisfy the existing archive policy. The production owner then correctly fails closed.
- This is not an AC-power, sudo, host-load, corpus, provider/model, quality-threshold, design-policy-relaxation, or release issue.
- Recommended final owner after review: Implementation Engineer. Code Reviewer must first confirm failure origin.

## Recommended Recipient

`code_reviewer` for focused `API-F-004` failure-origin review, with the complete cumulative package and exact logs/manifest analysis.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final validation confidence: `93%`.
- Default `95%` confidence target met: `No`.
- Final applicable categories below 90%: requirement/AC proof; failure/lifecycle/recovery.
- Broader validation: `Required; executed until critical package-construction failure`.
- Critical acceptance criteria lacking direct proof: `AC-006`/`AC-017` fail at package construction; remaining English/Chinese package, inference, exact 30/30/100, lifecycle, compliance, Qualification Set 2, and Branch Catalog Projection 2 are not tested.
- Required next recipient: `code_reviewer` for focused failure-origin review.
