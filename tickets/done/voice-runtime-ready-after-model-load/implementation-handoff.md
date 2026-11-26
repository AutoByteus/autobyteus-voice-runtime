# Implementation Handoff

Ticket: autobyteus-655, voice runtime fix released as 0.3.2 (SR-003), truthful `ready`.
Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`, branch `codex/voice-runtime-ready-after-model-load`, base tag `v0.3.0` (`251eab8`). Code commits: `050cca1` (IR-001), `18f9e12` (IR-002, SR-002). IR-003 (SR-003): worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-release-runner`, branch `codex/voice-runtime-release-runner`, base `origin/release/0.3` (`8d154d9`), code commit `100e5a0`.

## Upstream Artifact Package

- Upstream review applicability and handoff-rule result: `Small` + `Low`; independent architecture review not selected; Solution Designer sent the package directly (SR-001).
- Requirements doc: `tickets/in-progress/voice-runtime-ready-after-model-load/requirements-doc.md`
- Investigation notes: `tickets/in-progress/voice-runtime-ready-after-model-load/investigation-notes.md`
- Solution revision record: `tickets/in-progress/voice-runtime-ready-after-model-load/solution-revision-record.md`
- Design spec (required on every route): `tickets/in-progress/voice-runtime-ready-after-model-load/design-spec.md`
- Supplemental task artifacts: `probes/drive_worker.py`; investigation evidence `evidence/B*`, `evidence/P*`; `follow-ups.md` (FU-001); project `DESIGN.md` (created by the Solution Designer, already describes the new start contract).
- Design review report: `N/A — not applicable`
- Architecture review revision record: `N/A — not applicable`
- Triggering rework report, revision record, or evidence: IR-003: SR-003 (`handoff-architecture-design-complete.md`, SR-003 section; design spec "Release workflow (SR-003)"), from delivery DR-002 (`delivery-revision-record.md`, `release-deployment-report.md`: the `v0.3.1` run cancelled both darwin builds on the retired `macos-14` image; nothing published). Earlier, IR-002: SR-002 (`handoff-architecture-design-complete.md`, SR-002 section; `solution-revision-record.md`), from code review `code-review-report.md` CRR-001 (Design Impact on DEC-009) after API/E2E `api-e2e-execution-coverage-report.md` API-REV-001 (Fail: AC-004, API-05/05b). RMS equivalence: `evidence/P5-rms-equivalence.txt` (RT-010).

## Current Implementation Summary

`serve` now starts its backend before it announces readiness. `start_backend` checks that the model folder exists, builds the backend and calls the new `Backend.load(warm_up_clip)` on a generated 1 s 440 Hz 16 kHz mono 16-bit WAV in a temporary folder that is removed afterwards. Only when `load` returns does `main` write the unchanged `{"type":"ready","backendKind":...}`. MLX `load` imports `mlx_whisper.transcribe` and runs one transcription of the clip through the same call requests use (that call loads the model into mlx-whisper's own cache). faster-whisper `load` builds `WhisperModel(path, device="cpu", compute_type="int8")` and transcribes the clip with `vad_filter=False`, consuming the segment generator. Any start failure writes no `ready`, writes one stderr line `Voice Input worker could not start the <backend> backend: <reason>` (newlines in the reason collapsed; a missing folder reads `model folder not found: <path>`; other errors `<ExceptionClass>: <message>`) and exits 1. The lazy loaders (`_ensure_transcribe`, `_ensure_model`) are gone. The request loop is unchanged. `scripts/build-runtime.sh` defaults to version `0.3.1`.

IR-002 (SR-002, DEC-010): the worker no longer imports `audioop`. On the launcher's Python 3.11 its import printed a two-line `DeprecationWarning`, so a failed start wrote three stderr lines. Python 3.13+ removed the module, so the worker could not even start there. The silence check's loudness is now `pcm_rms(payload, sample_width)`, a standard-library RMS: `array` for widths 1, 2 and 4 (byteswapped on big-endian hosts), `int.from_bytes` for width 3; a trailing partial sample is ignored and an empty payload gives 0. It returns the values `audioop.rms` gave (RT-010). The `urllib3` filter stays. A subprocess test (AC-007) runs the worker file with `sys.executable` the way the launcher does and checks the whole stderr.

IR-003 (SR-003, DEC-011…DEC-013): `.github/workflows/release-voice-runtime.yml` changes as the design's "Release workflow (SR-003)" table shows:
- **Triggers:** the workflow also runs on a push to `release/**`. `workflow_dispatch` gains a boolean `publish` input (default `false`).
- **Resolve step:**
  - A tag push keeps its version and tag and publishes.
  - A dispatch takes `runtime_version` as before and publishes only when `publish` is `true`. Any other value, including an empty one, counts as `false`.
  - A branch push builds version `0.0.0-ci.<first 12 of the SHA>` with an empty `release_tag` and does not publish.
  - The step writes its three outputs in one grouped redirect, which keeps actionlint/shellcheck clean.
- **Publish job:** `if: needs.resolve-release.outputs.publish == 'true'`, otherwise unchanged.
- **Runners:** the darwin arm64, darwin x64 and linux x64 bundles build on `ubuntu-latest`, win32 x64 on `windows-latest`.
- **Unchanged:** the matrix entries, the build call, artifact names, manifest generation and the release step.

`scripts/build-runtime.sh` defaults to `0.3.2`. The worker and its tests are unchanged.

- Implementation cycle: `Rework`
- Implementation revision record: `tickets/in-progress/voice-runtime-ready-after-model-load/implementation-revision-record.md`
- Current implementation revision ID: `IR-003` (earlier IR-002, baseline IR-001)
- Related solution revision IDs: `SR-001`, `SR-002`, `SR-003`
- Related architecture-review revision IDs: `N/A`
- Related code-review revision IDs: `CRR-001`
- Related API/E2E revision IDs: `API-REV-001`, `API-REV-002`
- Related delivery revision IDs: `DR-001`, `DR-002`
- Triggering finding IDs: DR-002 (v0.3.1 darwin builds cancelled, retired `macos-14`; IR-003); CRR-001 (AC-004: three stderr lines on Python 3.11; API-05/05b)

## Routing Classification (Mandatory)

- Task size (`Small`/`Medium`/`Large`): `Small`
- Architecture risk (`Low`/`High`): `Low`
- Design classification section / evidence reference: `design-spec.md` → Task Size And Architectural Risk
- Classification confirmed or changed: `Confirmed`
- Evidence and rationale for confirmation or change: IR-003 changes one workflow file (+30/−6) and the default version; bundle contents and the publishing steps are unchanged; AC-008 proves the workflow on GitHub before any tag. IR-002 replaces one library call with a 17-line function and adds tests (worker +23/−4, tests +61); no protocol, caller or dependency change. IR-001: three files changed (worker +68/−12, build script 1 line, tests +199); the protocol only gains a stricter meaning of `ready` and a start-failure form that today's callers already handle (process exit + stderr); no persistence, security, concurrency or caller change.
- Selected route (`Direct API/E2E`/`Code Review`/`Solution Designer`): `Direct API/E2E`
- Lightweight implementation self-review completed for the direct route: `Yes` — re-read the diff against DESIGN.md's protocol and conventions: stdout carries only `ready` and replies (no library output before `ready` in IMP-02/03); speech libraries still imported only inside the backends (worker imports and the tests run without them); `prepare` untouched; no wrapper or fallback added; dead lazy loaders removed; the warm-up folder is removed on success and failure (unit test + IMP-06); worker file 238 non-empty lines. IR-002: re-read against DC-001 (fix our own warnings at the source, filter only third-party noise); `pcm_rms` imports nothing beyond the standard library, so the module still imports without speech libraries; the new process test does not read source text; worker file 253 non-empty lines.
- New design impact or escalation trigger: `None`

## Reviewed Behavior Implementation Trace

| Behavior ID | Approved Change / Preserved Outcome | Implemented Production Path / Key Files | Result / Notes |
| --- | --- | --- | --- |
| BEH-001 | `ready` only after load + warm-up transcription | `runtime/voice_input_worker.py`: `main` → `start_backend` → `write_warm_up_clip` → `MlxWhisperBackend.load` / `FasterWhisperBackend.load` → `ready` | Done. Live MLX `ready` at 6.1 s / 5.6 s (0.3.0: 0.09 s), first transcription after it 752 / 366 ms; faster-whisper `ready` at 6.7 s, first 3,856 ms within later 2,893–4,043 ms (IMP-02, IMP-03) |
| BEH-002 | Requests and reply shapes preserved | request loop in `main` unchanged; backends' `transcribe_file` use the loaded library/model; `is_probable_no_speech` → `pcm_rms` (IR-002) | Preserved. Unit tests + live: silence `noSpeech:true`, unsupported type `ok:false`, missing audio `ok:false` and the worker keeps serving (IMP-01, IMP-05). After IR-002, `pcm_rms` equals the 15 RT-010 values. Live: silence and near-silent noise give `noSpeech:true` and speech is transcribed on both backends (IMP-08, IMP-09) |
| BEH-003 | Failed start: no `ready`, one stderr line, exit 1 | `ModelFolderNotFoundError`, `start_failure_line`, `main` `except` branch; no `audioop` import (IR-002) | Done. Live: missing folder (both backends), corrupt MLX and faster-whisper models, MLX without ffmpeg → exit 1, 0 stdout lines, 1 stderr line (IMP-04, IMP-10). AC-007 process test: one line on Python 3.9, 3.11 and 3.14 (IMP-08). It fails on the IR-001 worker under 3.11 with `3 != 1`, the CRR-001 failure (IMP-07) |
| BEH-004 | Release the fix as `v0.3.2` (SR-003; `v0.3.1` is never moved) through a workflow that runs on current images and is proven build-only before the tag (REQ-005, REQ-006) | `.github/workflows/release-voice-runtime.yml` (triggers, `resolve-release` outputs incl. `publish`, `publish-release` `if`, runner labels); `scripts/build-runtime.sh` default `0.3.2` | Done locally: actionlint finds nothing; the resolve step simulated for tag push, branch push and three dispatches gives the expected version, tag and `publish` values; four bundles build locally at 0.3.2 (IMP-12). AC-008 (build-only run on GitHub) is API/E2E's; tagging `v0.3.2` and AC-006 are delivery's |

- Changes stayed within the requirements doc's Scope Guardrail: `Yes`

## Key Files Or Areas

- `runtime/voice_input_worker.py` — `pcm_rms` and `ARRAY_TYPECODES` replace `audioop.rms` (IR-002); `Backend.load`, both backends' `load`, `ModelFolderNotFoundError`, `write_warm_up_clip`, `start_backend`, `start_failure_line`, `serve` branch of `main`; lazy loaders removed.
- `tests/test_voice_input_worker.py` — `LoudnessTests` (RT-010 values regenerated with the probe's seed, width 3, empty and partial payloads) and `StartFailureProcessTests` (AC-007) (IR-002); `WorkerStartTests` (ready after load, warm-up clip shape and removal, failed load, missing folder, urllib3 warning kept off stderr, requests after ready) and `BackendLoadTests` (MLX and faster-whisper `load` against stand-in libraries).
- `scripts/build-runtime.sh` — `RUNTIME_VERSION` default `0.3.1`.

## Important Assumptions

- The release workflow sets the manifest version from the tag; `scripts/generate-manifest.mjs:14` still defaults to `0.3.0` and the design leaves it alone. A local manifest built without the tag/variable would say 0.3.0; the tagged release names 0.3.1 (AC-006, delivery).
- The urllib3 "only supports OpenSSL" warning filter (design DEC-009) is applied in `start_backend` before `load`, so the start's single stderr line is the reason line (system Python 3.9 + LibreSSL).

## Known Risks

- IR-003: the workflow is checked only locally (actionlint, YAML parse, the resolve step rendered and run with bash). GitHub's evaluation of `inputs.publish` (a boolean rendered as `true`/`false`) and the `if:` string comparison are proven only by AC-008's dispatch.
- RSK-003: `-latest` images change over time. With DEC-013 an image change shows up on the next push to `release/**`, before a tag.
- The resolve step inlines `${{ inputs.runtime_version }}` in bash. This is pre-existing and outside the SR-003 table. Only repository writers can dispatch, so I left it unchanged. If wanted later, it could be passed through `env`.
- A win32 bundle built on macOS or Linux would carry LF launcher line endings. Only the `windows-latest` checkout gives CRLF (RT-013), so the local build in IMP-12 is not a check of win32 line endings. AC-008 compares that.

- `TESTING.md` (Setup) still says the worker imports `audioop`. After IR-002 that sentence is out of date. TESTING.md belongs to API/E2E, so I left it unchanged.
- The isolated venvs used for the live checks run Python 3.9.6, so live runs of the worker file do not exercise 3.11. Python 3.11 and 3.14 are covered by the unit and process tests (IMP-08). The launcher's 3.11 path through the real bundle is API/E2E's retest of API-05/05b.

- RSK-001: faster-whisper not run live on Linux, Windows or Intel Mac; live run here is macOS arm64 CPU (DEC-006).
- RSK-002: the model is held in memory from start rather than from first request (accepted).
- MLX first-after-ready timing varied between runs (752 ms, 366 ms; both under the 1,000 ms bound of AC-002; target ~0.3 s). The second request in the first run was also 694 ms, so the variance is machine load, not a missing warm-up.

## Task Design Health Assessment Implementation Check

- Reviewed change posture: `Bug Fix`
- Reviewed root-cause classification: `Local Implementation Defect`
- Reviewed refactor decision (`Refactor Needed Now`/`No Refactor Needed`/`Deferred`): `No Refactor Needed`
- Implementation matched the reviewed assessment (`Yes`/`No`): `Yes`
- If challenged, routed as `Design Impact` (`Yes`/`No`/`N/A`): `N/A`
- Evidence / notes: owners unchanged (worker `main`, the backend classes); only the order of load and `ready` changed. IMP-00 shows the new tests fail on the 0.3.0 worker (4 failures, 2 errors) and IMP-01 shows them pass.

## Legacy / Compatibility Removal Check

- Backward-compatibility mechanisms introduced: `None`
- Legacy old-behavior retained in scope: `No`
- Dead code in the touched files and modules removed (Core Principle 7): `Yes` (`_ensure_transcribe`, `_ensure_model`)
- Dead code found elsewhere, added to `follow-ups.md`: None
- Shared structures remain tight: `Yes` (`Backend` gains one method both implementations need)
- Canonical shared design guidance was reapplied during implementation: `Yes`
- Deviations from a design principle decided during implementation: `None`
- Changed source implementation files stayed within proactive size-pressure guardrails: `Yes` (worker 238 non-empty lines; +68/−12)
- Notes: —

## Persisted Data Transition Check (When Applicable)

- Approved decision: `Not Affected`
- Design-spec decision reference: `design-spec.md` → Persisted Data / State Transition Decision
- Implementation follows the approved decision: `Yes`
- Direct-use evidence or discard/rebuild result: the warm-up clip lives in a `tempfile.TemporaryDirectory` removed after the start; none left after the live runs (IMP-06).
- Migration implementation and focused checks: N/A
- Deviation from the reviewed transition decision: `None`

## Environment Or Dependency Notes

- Unit tests: `/usr/bin/python3` 3.9.6 (no `X | None` annotations, no backslashes in f-string expressions — both fixed during implementation).
- Live fixtures (all outside `~/.autobyteus`): MLX python `/tmp/ab655/cow/runtime/.venv` and model `/tmp/ab655/cow/models/whisper-small-mlx` (APFS clones of the founder's install); faster-whisper venv `/tmp/ab655/fw/venv` (faster-whisper 1.2.1) and model `/tmp/ab655/fw/models/faster-whisper-small`; corrupt models `/tmp/ab655/broken/{mlx-corrupt,fw-corrupt}`; clips `/tmp/ab655/clips/en.wav`, `en2.wav`; `HOME=/tmp/ab655/home`, `HF_HUB_OFFLINE=1`. Entry scripts `/tmp/ab655/impl/{mlx,fw}-entry.sh` exec those pythons on this worktree's `runtime/voice_input_worker.py`.
- MLX needs `ffmpeg` on PATH (`/opt/homebrew/bin/ffmpeg` here); FU-001 covers removing that dependency.
- The darwin-arm64 bundle was not built and installed for these checks; the worker file was run directly with the cloned venv, as the design allows. The bundle path is covered by AC-006 after the tag.

## Checks Run

Evidence folder: `tickets/in-progress/voice-runtime-ready-after-model-load/evidence/implementation/`.

| Check ID | Command Or Steps | Commit Tested | Environment | Code It Exercises | Behavior / Criteria IDs | Result (`Pass`/`Fail`) | Evidence Files | Look For |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IMP-00 | `python3 -m unittest tests/test_voice_input_worker.py` with the 0.3.0 worker and the new tests | `c550116` + new tests | macOS, Python 3.9.6 | worker as at v0.3.0 | AC-001, AC-004 (reproduction) | Fail (expected) | `IMP-00-reproduction.log` | `FAILED (failures=4, errors=2)` |
| IMP-01 | `python3 -m unittest -v tests/test_voice_input_worker.py`; `node --test tests/*.test.mjs` | `050cca1` | macOS, Python 3.9.6, Node; stand-in speech libraries | worker, build script/manifest tests | AC-001, AC-004, AC-005 | Pass | `IMP-01-unit-and-node-tests.log` | `Ran 12 tests` / `OK`; `# pass 2` `# fail 0` |
| IMP-02 | `python3 probes/drive_worker.py /tmp/ab655/impl/mlx-entry.sh mlx <clone model> en.wav en2.wav silence.wav` (2 runs) | `050cca1` | macOS arm64, APFS-clone venv + model, ffmpeg on PATH | MLX `load`, `start_backend`, request loop | AC-002, AC-005 | Pass | `IMP-02-live-mlx.jsonl` | `ready` `atMs` 6118 / 5639; first `tookMs` 752 / 366; texts correct; silence `noSpeech:true` |
| IMP-03 | `python3 probes/drive_worker.py /tmp/ab655/impl/fw-entry.sh faster-whisper <isolated model> en.wav en2.wav en.wav silence.wav` | `050cca1` | macOS arm64 CPU int8, isolated venv | faster-whisper `load`, request loop | AC-003, AC-005 | Pass | `IMP-03-live-faster-whisper.jsonl` | `ready` `atMs` 6691; `tookMs` 3856, 4043, 2893; texts correct |
| IMP-04 | `failure_cases.sh` (in the evidence file): missing folder ×2 backends, corrupt mlx/fw models, MLX with `PATH=/usr/bin:/bin` | `050cca1` | as IMP-02/03 | `start_backend`, `start_failure_line`, `main` | AC-004 | Pass | `IMP-04-live-start-failures.log` | every case `exit: 1`, `stdout lines: 0`, `stderr lines: 1`, e.g. `could not start the mlx backend: FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'` |
| IMP-05 | `requests_live.py` (in the evidence file) after `ready`, both backends: unsupported type, missing audio, real clip | `050cca1` | as IMP-02/03 | request loop after the new start | AC-005 | Pass | `IMP-05-live-request-replies.log` | `Unsupported request type: unknown-request` `ok:false`; missing file `ok:false`; next clip `ok:true`; `code: 0` |
| IMP-06 | read-only `find … -exec stat -f '%m %z %N'` of `~/.autobyteus/extensions/voice-input` before IMP-02 and after IMP-05; `cmp` | `050cca1` | macOS | — (safety) | constraint | Pass | `IMP-06-founder-install-unchanged.txt` | `cmp: IDENTICAL`, 20070 entries; 0 leftover warm-up folders |
| IMP-07 | the new IR-002 tests in a copy holding the IR-001 worker (`050cca1`), on 3.9, 3.11, 3.14 | `050cca1` worker + IR-002 tests | macOS; Python 3.9.6, 3.11.15, 3.14.2 | old worker's `audioop` import | AC-004, AC-007 (reproduction) | Fail (expected) | `IMP-07-reproduction-sr002.log` | 3.11: `AssertionError: 3 != 1 : …DeprecationWarning: 'audioop' is deprecated`; 3.14: `No module named 'audioop'` |
| IMP-08 | `<python> -m unittest -v tests/test_voice_input_worker.py` for 3.9, 3.11, 3.14; `node --test tests/*.test.mjs` | `18f9e12` | macOS; Python 3.9.6, 3.11.15, 3.14.2; Node | worker incl. `pcm_rms`, process start failure | AC-001, AC-004, AC-005, AC-007 | Pass | `IMP-08-unit-and-node-tests-sr002.log` | `Ran 16 tests` / `OK` ×3; `# pass 2` `# fail 0` |
| IMP-09 | `drive_worker.py` MLX (clone) and faster-whisper (isolated): en.wav, silence.wav, quiet.wav (random ±90), en2.wav | `18f9e12` | as IMP-02/03 (Python 3.9.6 venvs) | `is_probable_no_speech`/`pcm_rms` with real audio, start | AC-002, AC-003, AC-005 | Pass | `IMP-09-live-silence-and-replies-sr002.jsonl` | silence and quiet `noSpeech:true`; texts correct; MLX ready 3316 ms, first 199 ms |
| IMP-10 | `failure_cases.sh` (as IMP-04) | `18f9e12` | as IMP-04 | start failures | AC-004 | Pass | `IMP-10-live-start-failures-sr002.log` | 5 × `exit: 1`, `stdout lines: 0`, `stderr lines: 1` |
| IMP-11 | read-only `stat` list before IMP-09 / after IMP-10; `diff` | `18f9e12` | macOS | — (safety) | constraint | Pass | `IMP-11-founder-install-unchanged-sr002.txt` | only `voice-input/temp` mtime differs (the founder's running app worker, pid 22112, as RT-008); 20,070 entries otherwise identical |
| IMP-12 | `actionlint` on the workflow; YAML parse; `resolve_cases.sh` (renders the resolve step's expressions for each trigger and runs it); unit tests on 3.9/3.11/3.14; `node --test`; `scripts/build-runtime.sh` ×4 without a version variable | `100e5a0` | macOS; actionlint 1.7.11; Python 3.9.6/3.11.15/3.14.2; Node | workflow triggers/resolve/publish condition/runners; build script default | AC-008 (local part), REQ-006 | Pass | `IMP-12-workflow-lint-and-tests-sr003.log` | `no findings`; `push to release/0.3` → `runtime_version=0.0.0-ci.8d154d9a1b2c`, `release_tag=`, `publish=false`; `dispatch 0.3.2 publish=false` → `publish=false`; tag → `publish=true`; `Ran 16 tests` `OK` ×3; `# pass 2`; `Runtime version: 0.3.2` ×4 |

- IMP-01…IMP-06 ran on `050cca1`. IR-002 changed only the loudness function and the import line. IMP-08…IMP-10 rerun the checks that code reaches. IMP-05's request replies (unsupported type, missing file) do not reach `pcm_rms` and were not rerun.
- Not run (IR-003), and why: the workflow on GitHub. AC-008 is API/E2E's: push the ticket branch, then dispatch with `runtime_version` 0.3.2 and `publish` false. I pushed nothing. The worker checks IMP-01…IMP-11 still hold: the worker and its tests did not change.
- Not run (IR-001/IR-002), and why: the real bundle on the launcher's Python 3.11 through the desktop caller (API/E2E's retest of API-05/05b, fixtures in `/tmp/ab655-api`); building and installing the darwin-arm64 bundle (covered on the released bundle by AC-006 after the founder's word); faster-whisper live on Linux/Windows/Intel (RSK-001); the desktop app or 516 extension against the new worker (no desktop change in scope; API/E2E decides on caller-level checks).

## Frontend Rendered-Result Check (When Applicable)

`Not Applicable` — the change is in the worker process; no rendered UI changes.

## Downstream Coverage Hints / Suggested Scenarios

- Reuse IMP-01…IMP-05 unless the worker changes; the fixtures under `/tmp/ab655` are still in place.
- A caller-level look: today's caller shows the stderr line when the worker exits before `ready` (AC-004 "today's caller would show that text").
- Start timing: `ready` took 5.6–6.7 s here for whisper-small (the design's prototype saw 3.8–4.3 s, RT-009; this machine was loaded). The desktop caller awaits `ready` with no timeout (investigation-notes line 39), so no caller change follows; the 516 extension's own wait, if any, is worth a read.

## API / E2E / Executable Coverage Investigation And Execution Still Required

- IR-003, AC-008: push `codex/voice-runtime-release-runner`, then dispatch "Voice Runtime Release" from it with `runtime_version` 0.3.2 and `publish` false. Expected: the four build jobs and verify are green, publish is skipped, and no release or tag is created. Compare the four artifacts with the `v0.3.0` bundles: entries, sizes and modes, and win32 keeps CRLF.

- AC-002…AC-005 executable validation and sign-off at the API/E2E boundary (implementation runs above are self-checks).
- AC-006 (tag `v0.3.1`, workflow, release assets, AC-002 on the released bundle) is delivery's, only on the founder's word.
