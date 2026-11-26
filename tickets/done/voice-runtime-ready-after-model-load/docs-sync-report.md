# Docs Sync Report

## Scope

- Ticket: `voice-runtime-ready-after-model-load` (autobyteus-655): the 0.3.x worker writes `ready` only after its backend can transcribe, and a failed start writes one stderr line. `task_size` `Small`, `architectural_risk` `Low`, direct route.
- Trigger: API/E2E handoff after API-REV-002 (Pass, 95.5%).
- Bootstrap base reference: tag `v0.3.0` (`251eab8`). The finalization target `release/0.3` does not exist yet and is created from `v0.3.0` at finalization (DEC-005).
- Integrated base reference used for docs sync: `v0.3.0`. A tag cannot advance, so the branch is current.
- Post-integration verification reference: no new base commits, so no rerun (see `release-deployment-report.md`).

## Why Docs Were Updated

- Summary: the ticket created `DESIGN.md` (worker start contract: `ready` only after load and warm-up; one stderr line and exit 1 on a failed start) and `TESTING.md` (layers, Pythons, live bundle checks). Delivery checked both against the final code and created `RELEASE.md`, which the repository lacked: the `release/0.3` maintenance branch, the founder's decision, the tag-driven workflow, and the 5 assets of a complete release.
- Why this should live in long-lived project docs: the 0.3.x line now has its own branch beside `main`'s v1.0 work. The next 0.3.x fix needs to know where it goes and how it is released.

## Long-Lived Docs Reviewed

| Doc Path | Why It Was Reviewed | Result | Notes |
| --- | --- | --- | --- |
| `DESIGN.md` | Created by this ticket (SR) | No change | Matches `voice_input_worker.py` at `18f9e12`: `ready` after `start_backend`, `start_failure_line`, no `audioop` |
| `TESTING.md` | Created and updated by this ticket (`1ce4ab6`, `4212a2a`) | No change | Commands match what API/E2E ran (API-01/02/03…05) |
| `RELEASE.md` | Missing | Created | See below |
| `README.md` | Overview and scripts | No change | Describes packaging and the manifest, not `ready` timing; still accurate |

## Docs Updated

| Doc Path | Type Of Update | What Changed | Why |
| --- | --- | --- | --- |
| `RELEASE.md` | Created | Finalization target `release/0.3` (never `main`); secret scan before the first push (public repository); cross-OS file names; founder's word for every release; tag → `release-voice-runtime.yml` (the tagged commit's workflow, version from the tag); 5 assets; callers pin a tag; recovery and rollback | The repository had no release guide. Steps not yet run are marked *(not yet run)* |

## Durable Design / Runtime Knowledge Promoted

| Topic | What Future Readers Need To Understand | Source Ticket Artifact(s) | Target Long-Lived Doc |
| --- | --- | --- | --- |
| 0.3.x maintenance line | Fixes go to `release/0.3`, tagged there | `requirements-doc.md` DEC-005, DEC-007 | `RELEASE.md` |
| How a runtime release reaches users | Callers pin a tag. The desktop pins `v0.3.0`; the autobyteus-516 extension pins 0.3.1 | `investigation-notes.md`; superrepo `extensionCatalog.ts` | `RELEASE.md` |

## Removed / Replaced Components Recorded

| Old Component / Path / Concept | What Replaced It | Where The New Truth Is Documented |
| --- | --- | --- |
| `audioop.rms` in the silence check | standard-library RMS (`pcm_rms`) | `DESIGN.md` |
| Lazy model load on the first request | Load and warm-up transcription before `ready` | `DESIGN.md` |

## Delivery Continuation

- Result: `Pass`
- Next delivery action: finalize into `release/0.3`. No tag without the founder's word (DEC-007).
- Notes: `scripts/generate-manifest.mjs` still defaults to `0.3.0`, while `scripts/build-runtime.sh` defaults to `0.3.1`. The design leaves this alone because the workflow sets the version from the tag. `RELEASE.md` says the defaults are not used in a release.

## Round 3 (DR-003): the release workflow fix

- Trigger: API/E2E handoff after API-REV-003 (AC-008 Pass, 95.5%), following DR-002's blocked `v0.3.1` run. Base `origin/release/0.3` `8d154d9`, already current.
- Changed by the ticket: `.github/workflows/release-voice-runtime.yml` (`100e5a0`: `-latest` runners, build-only on `release/**` pushes and on a dispatch without `publish`, publish gated). `DESIGN.md` (Solution Designer: Release section, design case DC-002) and `TESTING.md` (API/E2E `83539d8`: the build-only release run as a test layer, required before merging a workflow change) checked against the workflow: accurate.
- `RELEASE.md` (delivery, its owner): rewritten to standing rules.
  - Checks Before Tagging: tag only a commit whose `release/**` build-only run succeeded, with no commit between that run and the tag.
  - Watching: the new runners; the run is listed under `main`'s workflow name; the manifest's `runtimeVersion` and `sha256` checks.
  - Recovery: a tag whose run published nothing stays; a retired runner is our failure and needs a fix plus the next patch.
  - `workflow_dispatch` with `publish=true` only republishes a tag after a platform failure.
  - Removed: references to this ticket and other tickets, dates, and the *(not yet run)* markers. The release this round cuts confirms the steps; corrections, if any, are in the release record.
