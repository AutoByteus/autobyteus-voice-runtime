# Delivery / Release / Deployment Report

## Release / Publication / Deployment Scope

autobyteus-655: truthful `ready` for the 0.3.x Voice Input runtime, planned as 0.3.1. Repository `AutoByteus/autobyteus-voice-runtime` (public).
- Classification: `task_size` `Small`, `architectural_risk` `Low`, direct route.
- Finalization target: new maintenance branch `release/0.3` from `v0.3.0` (DEC-005).
- Release `v0.3.1`: only on the founder's word (DEC-007, AC-006). Not given, so not tagged.

## Project Release Guide

- Release guide path and revision: `Created: RELEASE.md` (repository root, in this ticket's final commit). The repository had none; this delivery used the generic steps and wrote what it used.
- Deviations from the guide and why: `None`.
- Proposed guide fixes: `None`. The release steps are marked *(not yet run)* until the first 0.3.x release confirms them.

## Handoff Summary

- Handoff summary artifact: `handoff-summary.md`
- Handoff summary status: `Updated`
- Delivery revision record: `delivery-revision-record.md`
- Current delivery revision ID: `DR-001`

## Initial Delivery Integration Refresh

- Bootstrap base reference: tag `v0.3.0` (`251eab8`)
- Latest tracked remote base reference checked: `refs/tags/v0.3.0` = `251eab8` (`git ls-remote`, 2026-11-26). `origin/release/*` does not exist.
- Base advanced since bootstrap or previous refresh: `No` (a tag)
- New base commits integrated into the ticket branch: `No`
- Local checkpoint commit result: `Completed`. The code reviewer's untracked `code-review-report.md` and `code-review-revision-record.md` (CRR-001) were committed as found.
- Integration method: `Already current`
- Integration result: `Completed`
- Post-integration executable checks rerun: `No`
- Post-integration verification result: `Passed` (the validated state is the final state)
- No-rerun rationale: the base is an immutable tag, and API/E2E ran on `18f9e12`, the final code. Delivery's own edits are documentation (`RELEASE.md`, ticket files).
- Delivery edits started only after integrated state was current: `Yes`
- Handoff state current with latest tracked remote base: `Yes`

## Verification

- Evidence judged: `Sufficient`.
- Evidence relied on: execution report API-REV-002 (final 95.5%; every critical AC directly proven except AC-006, which is delivery's) and the files below, opened and checked.

| Acceptance-Criteria ID | Cases And Files Checked | What You Saw | Judgement |
| --- | --- | --- | --- |
| AC-001 | API-01/02 `API-01-unit-and-node-tests-r2.log`, `API-02-verify-job-fresh-clone-r2.log` | `Ran 16 tests` `OK` on 3.9.6, 3.11.14 and 3.14.2; node `# pass 2 # fail 0`; the same from a clean clone | Proven |
| AC-002 | API-03 `API-03-mlx-bundle-caller-r2.jsonl`; API-03b | First request 1325/1227 ms (waits for `ready`); `en.wav` 187/182 ms, "Please summarize the meeting notes and send them to the team."; 0.3.0 contrast: 193 ms, then 23422 ms | Proven |
| AC-003 | API-04 `API-04-fw-bundle-caller-r2.jsonl` | First `en.wav` 872/715 ms vs later 718–738 ms; texts correct | Proven |
| AC-004 | API-05 `API-05-start-failures-caller-r2.jsonl`; API-05b `API-05b-launcher-stderr-lines-r2.log` | One-line caller errors for corrupt MLX, no ffmpeg and corrupt faster-whisper; `worker processes left … 0`; `exit 1, stdout lines 0, stderr lines 1` on 3.11, 3.9 and 3.14 | Proven |
| AC-005 | API-01, API-03, API-04 | Silence and quiet noise `noSpeech:true`; reply shapes unchanged | Proven |
| AC-007 | API-01/02 (subprocess test), API-05/05b | As above | Proven |
| AC-006 | — | Release on the founder's word | Not done: awaiting the founder's decision. The "nothing tagged" alternate holds |
| Safety | API-06 `API-06-founder-install-unchanged-r2.txt` | `entries before: 20070, now: 20070`; only `temp/` mtime (the founder's running app) | Holds |

- Accepted unverified risk: **DEC-006**. faster-whisper bundles for Linux, Windows and Intel Mac were not run; the decision covers exactly that.
- More evidence requested: `None`.
- User check needed: `No` for the change. The release is the founder's decision (DEC-007), not a check.

## Release Decision

- Decision: `No release` for now. `v0.3.1` is ready to tag on `release/0.3` on the founder's word.
- Decided by: DEC-007 ("ask the founder after validation, before tagging") and the API/E2E handoff ("only on the founder's word"). No word has been given.

## Docs Sync Result

- Docs sync artifact: `docs-sync-report.md`
- Docs sync result: `Updated` (`RELEASE.md` created; `DESIGN.md` and `TESTING.md`, created by the ticket, checked)

## Ticket State Transition

- Ticket moved to `tickets/done/<ticket-name>`: `Yes`
- Archived ticket path: `tickets/done/voice-runtime-ready-after-model-load/`

## Version / Tag / Release Commit

No tag. `scripts/build-runtime.sh` defaults to `0.3.1` (the ticket's change). The workflow takes the version from the tag.

## Release / Publication / Deployment

- Applicable: `No` (awaiting the founder's word)
- Release/publication/deployment result: `Not required` now. Available on request, as `RELEASE.md` "Cutting The Release" describes.

## Escalation / Reroute

None.

## Release Notes Summary

- Release notes status: `Not required`. The workflow uses GitHub's generated notes.

## Environment Or Persisted-Data Transition Notes

- Delivery action required: `None`. The runtime stores no data; the founder's install was not touched (API-06).

## Rollback Criteria

Nothing is released. After a release: callers pin a tag, so going back means pinning `v0.3.0` again.

## Finalization Record

- Pre-push checks:
  - cross-OS file names (no `< > : " | ? * \`, trailing dot or space, device names; paths ≤ 200): pass;
  - `gitleaks git --log-opts="v0.3.0..HEAD" --redact .`: no leaks (12 commits).
- Ticket branch: `codex/voice-runtime-ready-after-model-load` at `1c1723b` (archive commit, after the as-found commit `39716ac`), pushed as a new branch.
- Finalization target: `origin/release/0.3` did not exist (`git ls-remote`). It was created locally from `v0.3.0` (`251eab8`).
- Merge: `git merge --no-ff` of the ticket branch → `a0a3ca8`; its tree is identical to the verified head. `main` untouched.
- Push: `release/0.3` pushed as a new branch (`a0a3ca8`). A branch push starts no workflow (the release workflow runs on `v*` tags); `gh run list` showed no new run. No `v0.3.1` tag exists.
- Repository finalization status: `Completed`. This record follows as a `docs(delivery)` commit on `release/0.3`.

## Post-Finalization Cleanup

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`.
- Right after this record is pushed:
  - remove and prune the worktree;
  - delete the local `codex/voice-runtime-ready-after-model-load` and `release/0.3` branches (both on the remote);
  - keep `origin/codex/voice-runtime-ready-after-model-load`.
- API/E2E's temporary fixtures under `/tmp/ab655*` are outside the repository and not this delivery's; they are left in place.
- The user's checkout `/Users/normy/autobyteus_org/autobyteus-voice-runtime` is on `main`, not the target branch `release/0.3`, so it is not updated (left untouched).

## Final Status

- Verification complete (from the evidence): `Yes` (AC-006 is the release, pending the founder)
- Repository finalization complete: `Yes`
- Applicable release/deployment/rollout complete or not required: `Not required` until the founder's word
- Applicable safe cleanup complete or not required: right after this record is pushed (above)
- Unresolved blocker: `None`
- Successful terminal package eligible for return: `Yes`

## Release Round DR-002: `v0.3.1` (Release Requested) — Blocked

- Request: the founder, 2026-11-26, relayed by the Solution Designer: "Of course publish without any doubts" (`handoff-release-requested.md` in the Solution Designer's receipts for autobyteus-655). Stable patch `v0.3.1` from `release/0.3`.
- Release guide: `RELEASE.md` on `release/0.3` (`b1e14ab`), "Cutting The Release". No checks before tagging beyond the ticket's (none listed).
- Tag: `origin/release/0.3` fetched and still `b1e14ab`. Annotated tag `v0.3.1` (`0699d62`) → `b1e14ab`, pushed 2026-11-26.
- Pipeline: run 45823708736 (https://github.com/AutoByteus/autobyteus-voice-runtime/actions/runs/45823708736), event `push`, ref `v0.3.1`, sha `b1e14ab`. GitHub shows it under `main`'s name for the same file path ("Voice runtime host release"); `main`'s file has only `workflow_dispatch`, and the jobs are the tagged 0.3 workflow's.
  - Resolve Voice Runtime Release Metadata: success. Build linux x64: success. Build win32 x64: success. Verify Runtime Packaging: success.
  - Build darwin arm64: **cancelled**. Build darwin x64: **cancelled**. Both ended within a second, with no runner and no steps.
  - Publish Voice Runtime Release: **skipped** (it needs every build).

| Failed Run And Job | Classification | Log Lines That Show The Cause | Action | Result |
| --- | --- | --- | --- | --- |
| 45823708736 / Build darwin arm64, Build darwin x64 | **Ours** (workflow configuration; the same commit fails again) | Annotation on both jobs: `The configuration 'macos-14-arm64-us-default' is not supported`. The workflow pins `runner: macos-14` (`.github/workflows/release-voice-runtime.yml:50,53`); GitHub retired the macOS 14 image on 2026-11-02 (https://github.blog/changelog/2026-10-01-github-actions-macos-14-runner-image-retirement) | No rerun (the log settles it). Handed to the Solution Designer as a new change (release request) | Blocked |

- Published artifacts: **none**. No GitHub release `v0.3.1` exists and no assets were published. This is not a partial release; the tag exists without a release.
- The tag `v0.3.1` stays as it is (never move or delete a pushed tag).
- Also in the run, warnings only: actions/checkout@v4 and upload-artifact@v4 target Node.js 20, forced to Node.js 24.
- Decision needed before the next release round (founder / Solution Designer):
  - (a) Fix the workflow's macOS runner on `release/0.3` and tag `v0.3.2` (RELEASE.md Recovery: fix forward). The autobyteus-516 extension pins 0.3.1 and would need 0.3.2.
  - (b) After the fix, run the workflow by `workflow_dispatch` from `release/0.3` with `runtime_version` 0.3.1. It publishes under the existing tag `v0.3.1`, with assets built from the fixed commit; the worker code is identical to the tag's, but the source differs from the tag's commit.
- Stage that let it through: nothing before the tag runs the release workflow, and the 0.3 workflow has no build-only mode (`workflow_dispatch` publishes). A retired runner label shows only on GitHub's runners. Proposed for the fix: a build-only option, plus a pre-tag build-only run in RELEASE.md. API/E2E should confirm that no local check can reproduce runner availability (Release Failures rule) before the release guide takes that check.
- AC-002 on the released bundle: not run (nothing published).
- Cleanup: not done. The worktree and local `release/0.3` are kept for the next round.
- Status: **Blocked**. Recipient: Solution Designer (a new change for a release request).
