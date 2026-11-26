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
- Current API/E2E Revision ID: `API-REV-001`
- Current Investigation Round: 1
- Trigger: implementation IR-001, direct route

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

## Investigation Decision

- Proceed To API/E2E Execution: `Yes`
- Durable coverage changes: `No`
- Reroute Required: `No`
