# Testing

How the 0.3.x Voice Input runtime is tested: which layers exist and what each proves, how to run them, the
environments and data they need, and the rules every test run follows. Read it before planning or running
validation. A ticket's results and evidence belong in that ticket's validation report.

## Setup

- From the repository root. Node (any current LTS) for the packaging tests; a Python 3.9–3.12 for the worker tests
  (the speech libraries are not needed: the tests use stand-in libraries).
- Python versions matter. The worker imports `audioop`, which Python 3.13 removed and 3.11–3.12 warn about. The
  launcher picks `python3.11`, `python3.10`, `python3.9`, then `python3`, from the PATH it is given, so a real install
  runs on whichever of those the machine has first. macOS's system Python is 3.9; the release workflow's tests run on
  `ubuntu-latest`'s `python3`.

## Test Layers

| Layer | What it proves | Command |
| --- | --- | --- |
| Worker unit tests | `serve`/`prepare` logic, the protocol's messages, start order and start failures, with stand-in speech libraries | `python3 -m unittest -v tests/test_voice_input_worker.py` (also with each Python a real install can pick: `/usr/bin/python3` (3.9), `python3.11`) |
| Packaging tests | `build-runtime.sh` bundle contents, the manifest generator | `node --test tests/*.test.mjs` |
| Live worker | the worker file with the real speech library and a real model, timed over its protocol | `python3 <ticket>/probes/drive_worker.py <entry> <backend> <model folder> <clip>…` with an entry script that runs a venv's Python on `runtime/voice_input_worker.py` |
| Real bundle | what users install: the bundle built by `scripts/build-runtime.sh`, extracted into a test-owned extension folder, its launcher bootstrapping `.venv` itself (network: pip) | build with `AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR=<tmp>/dist scripts/build-runtime.sh <platform> <arch>`, then drive it through the desktop caller (next row) |
| Desktop caller | the unchanged desktop service (`autobyteus-web/electron/extensions/voice-input/voiceInputRuntimeService.ts` in the workspace superrepo) against a real install: `ready`, replies, and a start failure's stderr as the user's error | bundle that file with the superrepo's esbuild into a temp folder, with `electron/utils/shellEnv` replaced by a stub returning a given PATH (see `tickets/*/probes/build.mjs`, `drive.mjs`, `shellEnvStub.ts` of autobyteus-655); write the extension folder's `installation.json` as the desktop does; run `node drive.mjs <extension folder> <label> <clips>…` with `HOME=<temp>` |

There are no gated suites in the repository: live and bundle runs are ticket probes, because they need models,
`ffmpeg` and the desktop's code from another repository.

## Fresh-Start Build

The release runner checks out the tag and runs the workflow's jobs; nothing is installed beforehand.

- How: a clean clone (`git clone --no-local <worktree> <tmp>`, check out the commit), then the verify job's commands
  (`node --test tests/*.test.mjs`; `python3 -m unittest tests/test_voice_input_worker.py`, with a Python close to the
  runner's) and the build job's command (`scripts/build-runtime.sh <platform> <arch>` with
  `AUTOBYTEUS_VOICE_RUNTIME_VERSION`).
- Build-input paths: `scripts/`, `runtime/`, `metadata/`, `tests/`, `.github/workflows/`.

## Choosing The Layer

- Worker logic or protocol: unit tests, then the live worker on each backend you can run (MLX on Apple Silicon,
  faster-whisper on any Mac's CPU).
- Anything a caller reads (stdout messages, stderr, exit codes, start time): also the real bundle through the
  desktop caller, on the Python the launcher picks. A run of the worker file on another Python does not prove it
  (autobyteus-655: Python 3.9 gave one stderr line, the launcher's 3.11 gave three).
- Launcher or packaging: the real bundle's first install (fresh `.venv`).
- Stand-in libraries do not prove the real ones; the worker file run directly does not prove the launcher.

## Environments, Credentials And Data

- Never a test target: the founder's install `~/.autobyteus/extensions/voice-input` and anything under
  `~/.autobyteus`. Read it only (e.g. a `stat` list before and after, to show it is unchanged); the founder's app may
  be running and dictating at the same time, which changes its `temp/` folder.
- Models and venvs: APFS clones (`cp -c`) of an existing install into a test-owned folder, or a fresh bundle
  install; `HF_HUB_OFFLINE=1` so a missing model never triggers a download.
- MLX needs `ffmpeg` on PATH (Homebrew's here); a test of a missing `ffmpeg` passes `PATH=/usr/bin:/bin`.
- No credentials are needed; pip and model downloads use public sources.

## Rules

- Test a bundle built from the commit under test, never an installed release.
- Stop every worker you started and check none is left (`pgrep -f <test folder>`).
- Tag or publish nothing without the founder's word.

## Evidence

In the ticket's `evidence/` folder; JSON lines from the probes, logs with a header (command, commit, environment,
date). Never commit a model, a venv or a bundle.
