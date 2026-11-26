# API/E2E Coverage Investigation

The plan. Results, confidence and the broader-validation decision are in `api-e2e-execution-coverage-report.md`.

## Investigation Meta

- Requirements Doc: `requirements-doc.md` (SR-001)
- Investigation Notes: `investigation-notes.md`
- Solution Revision Record: `solution-revision-record.md`
- Design Spec: `design-spec.md` (SR-001, Small / Low)
- Supplemental Task Artifacts: `probes/drive_worker.py`, investigation evidence `evidence/B*`, `evidence/P*`, `follow-ups.md` (FU-001), project `DESIGN.md`
- Design Review Report / Architecture Review Revision Record: `N/A — not applicable` (direct route)
- Implementation Handoff: `implementation-handoff.md` (IR-001)
- Implementation Revision Record: `implementation-revision-record.md`
- Code Review Report / Revision Record: `N/A — not applicable` (direct low-risk route)
- API/E2E Revision Record: `api-e2e-revision-record.md`
- Current API/E2E Revision ID: `API-REV-003`
- Current Investigation Round: 3 (worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-release-runner`, branch `codex/voice-runtime-release-runner`, base `origin/release/0.3` `8d154d9`)
- Round 3 trigger: implementation IR-003 (SR-003: DEC-011…DEC-013, REQ-006, AC-008) after delivery DR-002 (the v0.3.1 tag run cancelled both darwin builds: retired `macos-14`)
- Trigger: implementation IR-002 (SR-002: DEC-009 revised, DEC-010 and AC-007 added) answering CRR-001 / API-REV-001 (AC-004 Fail)
- Prior Investigation Reviewed: round 1 (API-REV-001)

Repository `autobyteus-voice-runtime`, worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`,
branch `codex/voice-runtime-ready-after-model-load`, code under test `050cca1` (head `21d4260`), base tag `v0.3.0` (`251eab8`).

## Current Requirement And Design Basis

`serve` checks the model folder, loads the backend and transcribes a generated 1 s tone WAV through the real call
before it writes the unchanged `{"type":"ready","backendKind":…}` (REQ-001). The first transcription after `ready` has
no first-time cost: on MLX well under a second for a ~3 s clip, on faster-whisper within the range of later ones
(REQ-002). A failed start writes no `ready`, one stderr line naming the backend and the cause, and exits 1 (REQ-003).
Everything else in the protocol and `prepare` is unchanged (REQ-004). 0.3.1 is released only on the founder's word
(REQ-005, AC-006: delivery). The desktop caller (`autobyteus-web/electron/extensions/voice-input/voiceInputRuntimeService.ts`
on the superrepo's `personal` line) is unchanged: it awaits `ready` with no timeout and turns a worker exit before
`ready` into an error with the stderr text.

## Supported Scenarios And Real Usage

- Designer scenarios covered: SCN-001, SCN-002, SCN-003 (SCN-004 is delivery's, AC-006).
- Added from the implemented behavior, each with its real trigger:
  - First install of the 0.3.1 bundle: the desktop extracts the platform bundle; the launcher (`bin/voice-input-worker`)
    picks a Python from the login PATH (`python3.11` first), creates `.venv`, installs the pinned requirements, then
    execs the worker. The implementation ran the worker file directly on a cloned 3.9 venv, never through the bundle.
  - The desktop caller's own path: `VoiceInputRuntimeService.transcribe` → `ensureWorkerReady` (spawn with the login
    PATH, await `ready`) → request → reply; a start failure reaches the user as the `error` of the transcription
    result.
- Contrived / not tested: none recorded.

## Changed Behavior Summary

| Behavior / Boundary | Change Type | Upstream Evidence | Coverage Consequence |
| --- | --- | --- | --- |
| BEH-001 `ready` after load + warm-up | Changed | REQ-001/002 | unit (rerun); real bundle + real caller on MLX and faster-whisper |
| BEH-002 request/reply protocol | Preserved | REQ-004 | unit; caller replies (shapes, silence) |
| BEH-003 failed start: no `ready`, one stderr line, exit 1 | Changed | REQ-003 | unit; through the real caller (its error text) for a corrupt model and MLX without `ffmpeg` |
| Build script default 0.3.1 | Changed | REQ-005 | node tests; bundle built by the script |

## Changed Surface And Boundary Classification

| Surface / Boundary | Affected? | Actual Changed Boundary | Repository Evidence | Material Risk Not Exercised | Candidate Broader Validation |
| --- | --- | --- | --- | --- | --- |
| Worker logic | Yes | `start_backend`, backends' `load`, `main` | unit with stand-in libraries | real libraries in a fresh venv | live |
| Process protocol (stdout/stderr/exit) | Yes | when `ready` is written; start failure form | unit; implementation live runs on the worker file | the bundle launcher in front of it; the caller reading it | real bundle + real caller |
| Packaging / launcher | No code change (version default) | bundle content | node tests | first-install bootstrap with the new worker | fresh bundle install |
| Desktop caller | No change | reads `ready`, stderr, exit | none with 0.3.1 | caller behavior with a slower `ready` and the new failure line | real caller code |
| Persisted data, UI, network services | No | — | — | — | — |

## Project Execution Discovery

- Testing guideline: `None found` in this repository. Created at the end of this round: `TESTING.md` (repository root), from what this validation established.
- Instructions read: `README.md`, `DESIGN.md`, `.github/workflows/release-voice-runtime.yml` (verify job: `node --test tests/*.test.mjs`, `python3 -m unittest tests/test_voice_input_worker.py` on `ubuntu-latest`; build job: `scripts/build-runtime.sh <platform> <arch>`), `scripts/build-runtime.sh`, `runtime/voice-input-worker.sh`, `metadata/runtime-assets.json`, the implementation handoff's fixtures.
- Changed build-input paths: `scripts/build-runtime.sh` (default version only) — the release build reads it. Fresh-start case: the verify job's commands from a clean clone (API-02).
- Secrets: none needed (models are local; pip downloads public packages).
- Safety constraints (requirements, handoff): never write under `~/.autobyteus` (read-only checks only); measure on APFS clones or isolated folders; no desktop or superrepo change; nothing tagged or published.

| Component / Dependency | Setup | Notes | Cleanup |
| --- | --- | --- | --- |
| Bundles | `AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR=/tmp/ab655-api/dist scripts/build-runtime.sh darwin arm64` (and `darwin x64`) | `.work/` and `dist/` are gitignored | `.work/` removed |
| Extension roots | `/tmp/ab655-api/ext-{mlx,fw,…}`: bundle extracted to `runtime/`, model folders APFS-cloned (`cp -c`) from `/tmp/ab655` fixtures, `installation.json` as the desktop writes it | the launcher bootstraps `runtime/.venv` itself (pip, network) | `/tmp/ab655-api` removed |
| Desktop caller | the superrepo's `voiceInputRuntimeService.ts` bundled with the repository's esbuild into `/tmp/ab655-api/caller/` (outside both repositories); `utils/shellEnv` replaced by a stub returning a given PATH (the user's login PATH, read once read-only, or `/usr/bin:/bin`) | the only emulated part: Electron's login-shell PATH lookup; `HOME` points at a temp folder so the caller's logger cannot write under `~/.autobyteus` | removed with `/tmp/ab655-api` |

## Existing Durable Coverage Inventory

| Path / Test | Intent | Decision | Action |
| --- | --- | --- | --- |
| `tests/test_voice_input_worker.py` (12 tests incl. new `WorkerStartTests`, `BackendLoadTests`) | AC-001, AC-004, AC-005 | Still Valid | Rerun (cheap), also on the runner's Python line |
| `tests/build-runtime.test.mjs`, `tests/generate-manifest.test.mjs` | packaging | Still Valid | Rerun |
| `probes/drive_worker.py` | live timing | Still Valid (ticket probe) | reuse for direct worker runs if needed |

## Planned Cases

| Case ID | Criteria | Boundary / Surface | Kind | Planned Command Or Steps | Why |
| --- | --- | --- | --- | --- | --- |
| API-01 | AC-001, AC-004, AC-005 | unit + node tests | Existing Test | `python3 -m unittest -v tests/test_voice_input_worker.py`; `node --test tests/*.test.mjs` | own run on the commit under test |
| API-02 | AC-001…AC-005 (CI gate) | the release workflow's verify job from a clean clone, on the runner's Python line (3.11 here; ubuntu-latest has 3.12) | Existing Test | `git clone --no-local`, checkout `050cca1`; `node --test tests/*.test.mjs`; `python3.11 -m unittest tests/test_voice_input_worker.py` | fresh start; the CI Python is not 3.9 |
| API-03 | AC-002, AC-005, REQ-001/002 | real darwin-arm64 bundle, first install (launcher bootstrap), real desktop caller | Temporary Probe | build bundle; extension root; caller: silence → `ready` time; `en.wav`, `en2.wav`, `en.wav` → first-after-ready and later times; texts | the shipped entry point and the unchanged caller |
| API-04 | AC-003, AC-005 | real darwin-x64 bundle (faster-whisper), first install, real caller | Temporary Probe | as API-03 with `backendKind: faster-whisper` | faster-whisper through the shipped path |
| API-05 | AC-004 | failed starts through the real caller | Temporary Probe | caller against (a) a corrupt MLX model, (b) MLX with PATH `/usr/bin:/bin` (no ffmpeg), (c) a corrupt faster-whisper model: the transcription result's `error` is the worker's one line; no worker left running | "today's caller would show that text" |
| API-06 | safety | the founder's install | Temporary Probe | read-only `stat` list of `~/.autobyteus/extensions/voice-input` before and after; `cmp` | constraint |

- Test progress log needed: `Yes`

## Durable Coverage To Add / Update / Remove

None planned: the repository's durable tests already cover AC-001/004/005 with stand-in libraries; the live cases need
models, ffmpeg and a desktop caller from another repository, so they stay ticket probes (kept in `probes/`).

## Not Tested / Infeasible / Deferred

| Behavior | Reason | Risk | User-only? | Follow-up |
| --- | --- | --- | --- | --- |
| faster-whisper on Linux / Windows / Intel Mac | no such machines (DEC-006, RSK-001) | Low (pure Python, same library) | No | — |
| The packaged desktop app's own Voice Input UI with 0.3.1 | the desktop installs from the published manifest URL only (`AUTOBYTEUS_VOICE_INPUT_MANIFEST_URL` is not passed to an isolated instance); no release exists before the founder's word | Low: the caller code itself is exercised (API-03…05) | No | AC-006 after the tag |
| `prepare` (model download) | unchanged code; downloads ~0.5 GB | — | No | — |

## Ambiguities Or Reroute Triggers

None.

## Round 2 Rerun Plan

- Validated before: code `050cca1`. Now: code `18f9e12` (head `1a20726`). `git diff --name-only 050cca1 18f9e12`: `runtime/voice_input_worker.py` (`audioop` → `pcm_rms` in the silence check; an indentation fix), `tests/test_voice_input_worker.py` (AC-007 subprocess test, `pcm_rms` cases), `DESIGN.md`, ticket documents. Launcher, requirements, build script, `load` and `start_backend` unchanged.
- New criterion AC-007 (SR-002): proven by the repository's subprocess test (API-01/API-02 on 3.9, 3.11, 3.14) and live by API-05/05b on the launcher's 3.11 and on 3.9.

| Case | Decision | Reason |
| --- | --- | --- |
| API-05, API-05b (prior failure) | Rerun first | the failure under test; on the launcher's Python 3.11 through the real caller, and the worker file on 3.9 and 3.14 |
| API-01, API-02 | Rerun | worker and tests changed; now on Python 3.9, 3.11 and 3.14 |
| API-03 (normal starts B), API-04 (B) | Rerun with bundles rebuilt from `18f9e12` | the silence check changed: silence, a near-silent noise clip (±90) and speech through the caller |
| API-03 run A, API-04 run A (first install) | Still valid | launcher and requirements unchanged; the worker file is not part of the bootstrap |
| API-03b, API-04b | Still valid | 0.3.0 baseline; the VAD probe exercises `load`/`transcribe_file`, unchanged |
| API-06 | Rerun | safety, per round |

The rebuilt bundle is extracted over each test extension root's `runtime/`, keeping the `.venv` the launcher bootstrapped in round 1 (same requirements; a real reinstall would bootstrap an identical one).

## Round 3 Rerun Plan (AC-008)

- Validated before: code `18f9e12`. Now: code `100e5a0`. `git diff --name-only 18f9e12 100e5a0` outside tickets: `.github/workflows/release-voice-runtime.yml`, `scripts/build-runtime.sh` (default 0.3.2), `DESIGN.md`, `RELEASE.md`, `TESTING.md`. `runtime/` and `tests/` unchanged, so API-01…API-06 (API-REV-002) still hold.
- Surface: the release workflow on GitHub (the real runner images and GitHub's evaluation of the `publish` input and the job `if:`), which no local run can prove.
- Safety: no tag, no release, no push to `release/0.3` (delivery's); only the ticket branch is pushed. The ticket branch's own workflow file triggers on `release/**` and `v*` only, so its push starts nothing; `main` holds a workflow at the same path, so `gh workflow run --ref <ticket branch>` runs the ticket branch's file.

| Case ID | Criteria | Surface | Kind | Planned Command Or Steps | Why |
| --- | --- | --- | --- | --- | --- |
| API-07 | REQ-006 (resolve logic, lint) | workflow file | Reused | IMP-12 (actionlint 1.7.11 clean; the resolve step rendered and run for five event cases) | ran on `100e5a0`, the commit under test |
| API-08 | AC-008 | GitHub Actions, build-only dispatch from the ticket branch | Journey | push `codex/voice-runtime-release-runner`; `gh workflow run release-voice-runtime.yml --ref codex/voice-runtime-release-runner -f runtime_version=0.3.2 -f publish=false`; job conclusions; each job's runner image from its log; releases and remote tags before and after | the only proof of GitHub's input/`if:` evaluation and the current images |
| API-09 | AC-008 (bundle content) | the run's four artifacts vs the v0.3.0 release bundles | Journey | `gh run download`; `gh release download v0.3.0`; compare tar entries, sizes and modes; win32 launcher line endings | "same entries, sizes and modes except the changed worker and its version; win32 keeps CRLF" |

- The alternate "a failing build fails the run, still without publishing": a job-level `if:` without a status function implies `success()`, so `publish-release` is skipped when a needed job fails; the v0.3.1 tag run shows it on GitHub (builds cancelled, publish skipped). Recorded from that run; no failing build is forced.
- The push of the merge to `release/0.3` (AC-008's second run) is delivery's.

## Investigation Decision

- Proceed To API/E2E Execution: `Yes`
- Durable coverage changes: `No`
- Reroute Required: `No`
