# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Release Ownership: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/release-pipeline-ownership.md`
- Solution Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-revision-record.md`
- Delivery Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md`
- Relevant Delivery Revision: `DR-007`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-021`
- Current Execution Round: `21`
- Trigger: DR-007 default-main bootstrap after CRR-047; exact dispatch ref `ec0f726afd252448784855665a08d1de2ee0521c`.
- Prior Round: `API-REV-020 — Fail / 78%`; `API-F-015` remained open.
- Latest Authoritative Round: **`API-REV-021 — Blocked / 80%`**.

## Investigation And Execution Basis

- Coverage investigation refreshed before execution: `Yes`.
- Plan followed: `Yes`; stopped at the first unavailable external dependency.
- Scenario: `API-VOICE-016`; `R-022`, `R-023`, `R-024`; `AC-025`, `AC-026`.
- API-F-015 recheck: `Resolved`; GitHub created exact run `31301948625` at reviewed head.
- New blocker: `API-B-001`; required runner group `voice-runtime-recovery` not found.
- Profile/provider/audio/corpus/performance execution count: `0`.
- Recovery build attempt count: `0`.
- Promotion count: `0`.

## Compatibility / Persisted Data

- Backward compatibility or legacy fallback introduced: `No`.
- Aggregate renewal authority: `Directly Usable — No Migration`; exact retained record passed.
- Recovery/candidate outputs: `Discard or Rebuild`; no partial output exists.
- User/application state: `Not Affected`.

## Changed Boundary And Evidence Matrix

| Scenario          | Boundary / Criteria                                                        | Mode                | Result      | Evidence                                                                                   |
| ----------------- | -------------------------------------------------------------------------- | ------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `API-VOICE-016-A` | Exact renewed admission; `R-024`, `AC-026`                                 | Real Git/CLI        | Pass        | `api-e2e-evidence/api-rev-021/repository/current-preliminary-source-admission.json`        |
| `API-VOICE-016-B` | Default registration and managed recovery; `R-022`, `R-023`, `AC-025`      | GitHub Actions      | **Blocked** | Run `31301948625`; `recovery/API-B-001-managed-runner-group-missing.json`; annotation JSON |
| `API-VOICE-016-C` | Hosted 19-member candidate promotion; `R-022`, `R-024`, `AC-025`, `AC-026` | GitHub-hosted Linux | Not Tested  | Correctly prohibited without passing recovery artifact; zero promotion runs                |

## Repository And Bootstrap Execution

| Order | Operation                                                                      | Result                                             | Evidence                                               |
| ----- | ------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------ |
| 1     | Verify `delivery-default-main-bootstrap-SHA256SUMS.txt`                        | Pass                                               | `bootstrap/delivery-bootstrap-checksums.log`           |
| 2     | Fetch and verify main `7385b65...`, exact two parents, ticket ref `ec0f726...` | Pass                                               | `bootstrap/exact-remote-bootstrap.json`                |
| 3     | Verify workflow IDs `330372978`/`330372979` active                             | Pass                                               | `bootstrap/workflow-catalog.json`                      |
| 4     | Verify all API-REV-019 and API-REV-020 checksums                               | Pass                                               | `repository/retained-api-checksums.log`                |
| 5     | Production Preliminary Source Admission recheck                                | Pass — decision `reuse-permitted`; all checks true | `repository/current-preliminary-source-admission.json` |

## Managed Recovery Execution

- Workflow: `Recover exact qualified voice archives`; ID `330372979`.
- Dispatch ref: `codex/voice-runtime-qualified-recovery` at exact head `ec0f726afd252448784855665a08d1de2ee0521c`.
- Input: runtime version `1.0.0`.
- Run: `31301948625`; attempt `1`; event `workflow_dispatch`.
- URL: `https://github.com/AutoByteus/autobyteus-voice-runtime/actions/runs/31301948625`.
- Dispatch result: the prior API-F-015 HTTP 404 is resolved; GitHub created the exact run.
- Job: `recover`, ID `93216043982`.
- Terminal result: `failure` in zero seconds with zero steps.
- GitHub annotation: **`Required runner group 'voice-runtime-recovery' not found`**.
- Runner identity: none (`runner_id: 0`, empty name, group ID `0`).
- Archive builds attempted: `0`.
- Artifacts: `0`.
- Recovery Result/raw evidence/archives: none.

One first local dispatch harness invocation was invalid and stopped before `gh workflow run` because its local JSON helper used a non-relative `require()` path. It created no remote run and is excluded. The corrected invocation above is the only recovery dispatch in this API revision.

## Promotion Boundary

- Promotion workflow ID `330372978` is active.
- Promotion dispatch: not attempted, as required by the Pass-only gate.
- Existing promotion runs for the ticket ref: `0`.
- Candidate/Promotion Record: none.

## Confidence Scorecard

| Category                                            | Post-Repository | Final | Evidence / Gap                                                        |
| --------------------------------------------------- | --------------: | ----: | --------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |             95% |   75% | Admission/dispatch pass; AC-025 recovery and promotion absent         |
| Changed-boundary execution directness               |             95% |   80% | Real zero-step run proves missing group directly                      |
| Cross-boundary integration realism and mock gap     |             85% |   50% | Managed runner/build/artifact and promotion never execute             |
| Environment/configuration/identity/fixture fidelity |            100% |  100% | Exact main/ref/workflows/authority plus direct missing-group evidence |
| Failure/edge/lifecycle/recovery evidence            |             90% |   75% | Direct no-runner failure; no recovery terminal evidence               |
| User-surface/browser/desktop-shell confidence       |             N/A |   N/A | No user surface in scope                                              |
| Durable regression coverage quality/relevance       |             98% |   98% | Valid reviewed coverage; no API/E2E test edit                         |

- Overall post-repository confidence: `93.8%`.
- Overall final confidence: `79.7%`, reported as `80%`.
- Default 95% target met: `No`.
- Applicable categories below 90%: requirement proof, changed-boundary directness, cross-boundary integration, recovery evidence.
- Critical acceptance criterion lacking proof: `AC-025`.

## Broader Validation Decision

- Decision: **`Blocked`**.
- Exact unavailable dependency: organization-managed GitHub runner group `voice-runtime-recovery`.
- Required group contents: approved macOS ARM64 runner with labels `self-hosted`, `macOS`, `ARM64`; Node `v22.23.1`; runner-owned exact `VOICE_INPUT_CACHE_ROOT`, `VOICE_GO`, and `VOICE_CMAKE` environment.
- Attempted alternatives: default-main registration and exact ticket-ref dispatch succeeded. No safe/project-approved emulation can prove the real target toolchain/archive boundary.
- Prohibited alternatives not used: personal/user workstation runner, local archive build, old heavy workflow, profile rerun, provider/model substitution, threshold change, Delivery build, release action.

## Durable Coverage Changed In The Codebase

- Added/updated/removed repository-resident durable API/E2E coverage: `No`.
- Test paths: `None`.
- Successful proportional test review: not applicable while Blocked.

## Evidence Artifacts

| Artifact                                                                            | Purpose                           |
| ----------------------------------------------------------------------------------- | --------------------------------- |
| `api-e2e-evidence/api-rev-021/bootstrap/exact-remote-bootstrap.json`                | Exact main parents and ticket ref |
| `api-e2e-evidence/api-rev-021/bootstrap/workflow-catalog.json`                      | Active workflow IDs               |
| `api-e2e-evidence/api-rev-021/repository/current-preliminary-source-admission.json` | Exact reuse admission             |
| `api-e2e-evidence/api-rev-021/recovery/dispatch.json`                               | Exact run identity                |
| `api-e2e-evidence/api-rev-021/recovery/job-annotations.json`                        | GitHub missing-group annotation   |
| `api-e2e-evidence/api-rev-021/recovery/API-B-001-managed-runner-group-missing.json` | Canonical blocker summary         |
| `api-e2e-evidence/api-rev-021/recovery/artifacts.json`                              | Zero recovery artifacts           |
| `api-e2e-evidence/api-rev-021/promotion/runs-before.json`                           | Zero promotion runs               |

## Cleanup And Safety

- Local processes/services/data: none.
- Remote run created: one immutable failed workflow run; retained as evidence.
- User/shared state changed: no.
- Personal runner, sudo, purge, microphone/audio: none.
- Tag/release/publication: none.

## Result Summary

| Result                 | Scenario                        | Summary                                                                            |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| Pass                   | `API-VOICE-016-A`               | Exact renewed authority remains `reuse-permitted`.                                 |
| Resolved prior failure | `API-F-015`                     | Default-main registration now permits exact workflow-run creation.                 |
| **Blocked**            | `API-VOICE-016-B` / `API-B-001` | Required organization-managed runner group is absent; zero steps/builds/artifacts. |
| Not Tested             | `API-VOICE-016-C`               | Promotion correctly stopped without recovery Pass.                                 |

## Recommended Recipient

User request for the exact missing external dependency. Per API/E2E workflow, no teammate handoff occurs while Blocked.

## Latest Authoritative Result

- Result: **Blocked**.
- Final validation confidence: **80%**.
- Default 95% target met: `No`.
- Broader validation: `Blocked — required organization-managed runner group absent`.
- Resume condition: an organization administrator provisions exact group `voice-runtime-recovery` with an approved macOS ARM64 runner and locked runner environment; then API/E2E opens a new revision and dispatches a new run once.
- No profile/audio/performance test, archive, candidate, tag, release, or publication occurred.
