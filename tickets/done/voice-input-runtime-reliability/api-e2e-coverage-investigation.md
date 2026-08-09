# API/E2E Coverage Investigation

## Investigation Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts:
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/release-pipeline-ownership.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/benchmark-protocol.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/current-platform-qualification.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/voice-runtime-contract.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/backend-selection-study.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/english-preservation-correction.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/chinese-qualification-correction.md`
  - `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/cold-preparation-stability-study.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md`
- Relevant Delivery Revision: `DR-007`; `DR-006` remains the prior stage gate.
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-021`
- Current Investigation Round: `21`
- Trigger: Delivery Engineer `DR-007` after Code Reviewer `CRR-047`; default-main bootstrap merge `7385b65e397e6f1b17495720281fe0b2e39de99b`; exact remote dispatch ref preserved at reviewed artifact `ec0f726afd252448784855665a08d1de2ee0521c`.
- Prior Investigation Reviewed: `API-REV-020 — Fail / 78%`; `API-F-015` is truthful history and must be rechecked, not relabeled.
- Latest Authoritative Investigation: **`API-REV-021 — Blocked / 80%`**. API-F-015 is resolved because exact dispatch now creates a run, but GitHub immediately fails the zero-step job because required organization-managed runner group `voice-runtime-recovery` does not exist.

## Current Requirement And Design Basis

`R-022`, `R-023`, `R-024`, `AC-025`, and `AC-026` authorize only a no-requalification recovery/promotion sequence. Preliminary Source Admission must remain exact `reuse-permitted`. The recovery workflow must execute at exact reviewed ticket ref `ec0f726...` on the approved organization-managed Apple Silicon runner, check out exact qualified source `32829080938911f0f46390a3fd2af823e105bd32`, and build English then Chinese at most once each from accepted locked inputs/toolchain. Pass requires both recovered archives to equal the API-REV-017 whole-file sizes and SHA-256 identities, with truthful raw evidence -> checksum manifest -> Result ordering.

Only after recovery Pass may the separately registered hosted Linux promotion workflow retrieve that exact immutable artifact, assemble exactly 19 candidate members, independently verify every authority/binding, and emit Candidate Promotion Record 1. This round must not execute providers, audio/corpora, profile quality, lifecycle, performance, 30/30/100 trials, Delivery pretag/publish, a tag, release, or publication. It must not register or use the user's computer as a production runner.

DR-007 is a narrow, user-authorized default-main workflow-registration bootstrap. It does not change the reviewed recovery controller, accepted source, Profile Closure, Qualification Authority, API-REV-017 evidence, or exact remote dispatch ref.

## Prior Failure Recheck

| Failure                         | Prior Expected / Observed                                                                                    | Current Upstream Change                                                     | Required Recheck                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `API-F-015` / `API-VOICE-016-B` | Expected recovery run creation; GitHub returned HTTP 404 because workflow was absent default main; zero runs | DR-007 merged exact reviewed artifact to main and registered both workflows | **Resolved**: exact dispatch created run `31301948625` at `ec0f726...`; API-REV-020 remains historical Fail |

## Changed Behavior And Boundary Summary

| Boundary                              | Change / Preservation              | Coverage Consequence                                                                           |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Default-main workflow registration    | Changed only by DR-007 bootstrap   | Recheck actual workflow catalog and retry the previously rejected dispatch                     |
| Preliminary Source Admission          | Preserved exact reviewed authority | Revalidate `reuse-permitted` before dispatch                                                   |
| Managed exact archive recovery        | Still unexecuted                   | Real organization-managed workflow and artifact verification required                          |
| Hosted candidate promotion            | Still unexecuted                   | Conditional on exact recovery Pass; exact 19-member and Promotion Record verification required |
| Profile/runtime/package qualification | Preserved API-REV-017 authority    | Identity/checksum revalidation only; zero profile/provider/audio/performance execution         |
| Delivery release/publication          | Preserved later owner              | Explicitly not executed                                                                        |

## Changed Surface And Boundary Classification

| Surface / Boundary               | Affected? | Actual Boundary                                                        | Repository Evidence             | Remaining Material Risk           | Broader Mode              |
| -------------------------------- | --------- | ---------------------------------------------------------------------- | ------------------------------- | --------------------------------- | ------------------------- |
| Runtime/provider/domain          | No        | No byte change                                                         | Retained API-REV-017            | None in authorized round          | None                      |
| Release API/contracts            | Yes       | Recovery Result, candidate, Promotion Record                           | 46/46 release pipeline          | Actual artifacts absent           | GitHub Actions + verifier |
| Authentication/permissions       | Yes       | Workflow dispatch/artifact read                                        | Active registration evidence    | Managed runner/group availability | GitHub CLI/API            |
| Process/lifecycle                | Yes       | Two sequential builds and terminal evidence                            | Production-shaped tests         | Real build/evidence behavior      | Managed workflow          |
| Persisted data                   | Yes       | Renewal record direct-use; generated artifacts rebuild-only            | API-REV-019/020 exact authority | Actual new artifacts              | Git/CLI                   |
| Distributed/external integration | Yes       | Default-main workflow registration, managed recovery, hosted promotion | DR-007 and static tests         | Queue/capacity/artifact transport | GitHub Actions            |
| Frontend/browser/desktop/audio   | No        | Outside scope                                                          | N/A                             | None claimed                      | None                      |

## Project Execution Discovery

- Assigned worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Local HEAD: Delivery audit commit `8637072cc0b901b2d2f3af6cd701392f06b38e90`; this audit commit is intentionally not the dispatch ref.
- Exact remote ticket ref: `origin/codex/voice-runtime-qualified-recovery @ ec0f726afd252448784855665a08d1de2ee0521c`.
- Default main after bootstrap: `origin/main @ 7385b65e397e6f1b17495720281fe0b2e39de99b`, exact merge parents `fd83e8681dfd4e98afdfa46cb691d31400565d70` and `ec0f726...`.
- Recovery workflow ID: `330372979`; promotion workflow ID: `330372978`; both reported active.
- Recovery runner requirements: group `voice-runtime-recovery`, labels `self-hosted`, `macOS`, `ARM64`; Node `v22.23.1`; runner-owned `VOICE_INPUT_CACHE_ROOT`, `VOICE_GO`, `VOICE_CMAKE`.
- GitHub auth can dispatch and read repository runs/artifacts. Organization runner administration is neither required nor authorized.
- No applicable `AGENTS.md` was found previously; reviewed artifacts, workflow files, `package.json`, and controllers remain authoritative.

| Instruction / Path                                        | Authority / Constraint                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `delivery-default-main-bootstrap-SHA256SUMS.txt`          | Authenticate corrected bootstrap check and workflow registration; explicitly exclude invalid attempt 1 from acceptance |
| `.github/workflows/recover-qualified-voice-archives.yml`  | Dispatch at exact ticket ref; managed Apple Silicon only; no qualification                                             |
| `.github/workflows/promote-qualified-voice-candidate.yml` | Hosted Linux only; exact recovery run/artifact/head and approval commit; 19 members                                    |
| `release/source-closure.mjs`                              | Singular admission owner; no override                                                                                  |
| `release/recover-qualified-voice-archives.mjs`            | Truthful sequential recovery/evidence owner                                                                            |
| `release/qualified-release-candidate.mjs`                 | Candidate assembly/verification and Promotion Record owner                                                             |
| `release/recovery-authority.mjs`                          | Exact qualified source, API-REV-017 archive/profile/aggregate identities                                               |

## Persisted Data Transition Coverage Basis

- Aggregate Renewal Record: `Directly Usable — No Migration`; exact record commit/path/blob/content remains required.
- Recovery/candidate artifacts: `Discard or Rebuild`; accept only a complete immutable workflow artifact, never repair partial output.
- User/application state: `Not Affected`.

## Existing Durable Coverage Inventory

| Path / Scenario                                      | Validity                        | Action                                                            |
| ---------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| `tests/release/relevant-source-closure.test.mjs`     | Still Valid                     | Reuse DR-007 corrected 46/46 result plus direct admission recheck |
| `tests/release/qualified-archive-recovery.test.mjs`  | Still Valid                     | No edit; real recovery remains required                           |
| `tests/release/qualified-release-candidate.test.mjs` | Still Valid                     | No edit; real hosted promotion remains required                   |
| `tests/release/release-workflow-boundary.test.mjs`   | Still Valid                     | No edit; registration/dispatch/artifact path gets live validation |
| API-REV-017/019/020 checksum evidence                | Still Valid only at exact bytes | Verify before accepting reuse                                     |

- Durable coverage to add/update/remove: `None planned`.
- Stale coverage to remove: `None`.
- Temporary probes are appropriate for run/artifact IDs and remote observations because those are execution-instance facts.

## Repository And Broader Execution Plan

| Order | Operation                                                                                                            | Boundary                                       | Result                                                                  | Evidence Path                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 1     | Verify DR-007 checksum manifest, exact main parents, exact remote ticket ref, active workflow IDs                    | Bootstrap integrity and API-F-015 prerequisite | Pass                                                                    | `api-e2e-evidence/api-rev-021/bootstrap/`              |
| 2     | Revalidate API-REV-019/020 checksums and production admission                                                        | Exact retained authority and `reuse-permitted` | Pass                                                                    | `repository/`                                          |
| 3     | Dispatch recovery workflow `330372979` once at exact `ec0f726...` with runtime `1.0.0`                               | API-F-015 direct recheck                       | Pass — run `31301948625` created at exact reviewed head                 | `recovery/dispatch.json`                               |
| 4     | Monitor terminal run; download exact artifact; verify workflow/ref/run/artifact, raw evidence, Result, both archives | `R-022`, `R-023`, `AC-025`                     | **Blocked — required runner group not found; 0 steps/builds/artifacts** | `recovery/API-B-001-managed-runner-group-missing.json` |
| 5     | Dispatch promotion workflow `330372978` at exact `ec0f726...` only after recovery Pass                               | Pass-only hosted promotion                     | Not Tested — correctly prohibited                                       | `promotion/runs-before.json`                           |
| 6     | Monitor/download/independently verify exact 19-member candidate and Promotion Record                                 | `R-022`, `R-024`, `AC-025`, `AC-026`           | Not Tested — no passing recovery artifact                               | N/A                                                    |

## Confidence And Broader Validation Decision

- Post-repository confidence scorecard:

| Category                                            | Score | Evidence / Remaining Gap                                                                     |
| --------------------------------------------------- | ----: | -------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |   95% | Exact admission/bootstrap authority passes; actual AC-025 artifacts still absent             |
| Changed-boundary execution directness               |   95% | Real Git and GitHub catalog/identities are direct; recovery/promotion still need execution   |
| Cross-boundary integration realism and mock gap     |   85% | Default registration is real, but managed runner/build/artifact/hosted promotion remain live |
| Environment/configuration/identity/fixture fidelity |  100% | Exact main parents, ticket ref, workflows, retained checksums, and authority                 |
| Failure/edge/lifecycle/recovery evidence            |   90% | API-F-015 prerequisite resolved; recovery terminal evidence not yet created                  |
| User-surface/browser/desktop-shell confidence       |   N/A | No user surface in scope                                                                     |
| Durable regression coverage quality/relevance       |   98% | DR-007 corrected 46/46, source-reviewed coverage, no API/E2E test edit                       |

- Overall post-repository confidence: `93.8%`.
- Critical acceptance criterion directly proven: `No`; actual AC-025 recovery/promotion remains pending.
- Applicable category below 90%: cross-boundary integration realism (`85%`).
- Broader validation: `Required`.
- Mode: GitHub Actions API/CLI plus independent local artifact verification.
- Pass threshold: overall at least 95%, no applicable category below 90%, exact direct proof for recovery and promotion.
- Fail closed on: non-reuse admission, workflow/ref drift, runner/input/toolchain/capacity failure, non-Pass/partial recovery, archive mismatch, artifact mismatch/expiry, candidate member/authority drift, or promotion error.
- Blocked rule: if a correctly dispatched recovery remains unable to run because approved organization-managed capacity or required runner-owned inputs are unavailable, preserve evidence and ask the user for that exact external dependency; never substitute a personal runner.

### Final Confidence After Broader Attempt

| Category                                            | Final | Evidence / Remaining Gap                                                                     |
| --------------------------------------------------- | ----: | -------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |   75% | Exact admission/dispatch pass; AC-025 recovery and promotion remain unexecuted               |
| Changed-boundary execution directness               |   80% | Real workflow run directly exposes the missing group; no recovery steps execute              |
| Cross-boundary integration realism and mock gap     |   50% | Managed runner/build/artifact and hosted promotion boundaries remain absent                  |
| Environment/configuration/identity/fixture fidelity |  100% | Main/ref/workflow/admission/retained evidence exact; missing group itself is directly proven |
| Failure/edge/lifecycle/recovery evidence            |   75% | Zero-step failure and no-artifact state are direct; recovery Result/raw evidence absent      |
| User-surface/browser/desktop-shell confidence       |   N/A | No user surface in scope                                                                     |
| Durable regression coverage quality/relevance       |   98% | Existing focused coverage remains valid; no API/E2E test edit                                |

- Overall final confidence: `79.7%`, reported as `80%`.
- Default 95% target met: `No`.
- Critical acceptance criteria directly proven: `No`; AC-025 remains blocked.
- Broader validation result: `Blocked`.
- Exact unavailable dependency: organization-managed runner group `voice-runtime-recovery` with a macOS ARM64 runner, Node `v22.23.1`, and runner-owned `VOICE_INPUT_CACHE_ROOT`, `VOICE_GO`, `VOICE_CMAKE` locked environment.

## Temporary Executable Scenarios

| Scenario          | Purpose                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `API-VOICE-016-A` | Reconfirm exact `reuse-permitted` admission                                               |
| `API-VOICE-016-B` | Resolve or retain API-F-015 through real managed recovery and exact artifact verification |
| `API-VOICE-016-C` | Prove hosted exact 19-member candidate promotion and durable Promotion Record             |

## Deferred / Prohibited

- Provider/profile/corpus/quality/lifecycle/performance/30/30/100 rerun: prohibited; retained API-REV-017 authority only.
- Local or personal recovery runner: prohibited.
- x64/Linux/Windows/auto/desktop: deferred and unclaimed.
- Delivery pretag, tag, release, publication, published-byte verification: later Delivery-owned scope; not executed here.

## Investigation Decision

- Proceed To Further API/E2E Execution: `No`; blocked before the first recovery step.
- Repository-Resident Durable Coverage Added / Updated / Removed: `No`.
- Broader Validation: `Blocked`.
- Reroute Required: `No teammate handoff while Blocked`; ask the user for the exact external dependency.
- Resume Condition: an organization administrator provisions exact runner group `voice-runtime-recovery` with an approved macOS ARM64 runner and the locked runner-owned environment. Then open a new API revision and dispatch a new recovery run once.
- Notes: API-F-015 is resolved in this round, but API-B-001 prevents recovery. No personal runner, profile/audio/performance run, archive, promotion, tag, release, or publication occurred.
