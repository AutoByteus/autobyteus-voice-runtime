# Design

How this project is built and the design rules a change here follows. Read it
before designing a solution, architecture or refactor, and during
implementation and review. It holds what is specific to this project; general
design practice is not repeated here.

It holds what every future change here follows. One ticket's decisions and
evidence stay in that ticket's documents.

This file describes the 0.3.x line (the Python worker). The v1.0 work on `main`
has a different architecture and keeps its own design notes.

## Architecture Overview

- **Release bundle** (`scripts/build-runtime.sh`, `metadata/runtime-assets.json`):
  one archive per platform and architecture holding the launcher, the worker and
  the backend's `requirements-*.txt`. No Python packages and no model are in the
  bundle. Darwin arm64 uses the MLX backend (`mlx-whisper`); darwin x64, linux x64
  and win32 x64 use `faster-whisper`.
- **Launcher** (`runtime/voice-input-worker.sh`, `.cmd`): finds a Python, creates
  `.venv` beside the bundle and pip-installs the backend's requirements on first
  start, then runs the worker with the same arguments.
- **Worker** (`runtime/voice_input_worker.py`): `prepare` downloads a model into a
  folder; `serve` starts one backend for one model folder and answers
  transcription requests over stdin/stdout. Each backend class owns its library
  and its loaded model.
- **Manifest** (`scripts/generate-manifest.mjs`): `voice-input-runtime-manifest.json`
  with each bundle's URL, checksum, backend, entrypoint and model source; the
  desktop app installs from it.
- **Release** (`.github/workflows/release-voice-runtime.yml`): a `v*` tag builds the
  four bundles, runs the tests, generates the manifest and publishes the GitHub
  release.

## The Worker Protocol

The contract between the worker and its callers (the desktop app's Voice Input
service and the Voice Input extension). Callers depend on it; change it only by
adding, never by renaming or removing.

- `serve --backend <mlx|faster-whisper> --model-path <folder>`.
- Start: the worker loads its model and runs one transcription of a short
  generated clip through the same call real requests use. Only then does it
  write `{"type":"ready","backendKind":"<backend>"}` on stdout. `ready` means
  the worker can transcribe now; the first request after it pays no load cost.
- A start that fails writes no `ready`, writes one line to stderr
  (`Voice Input worker could not start the <backend> backend: <reason>`) and
  exits with code 1. Callers show that line.
- Requests, one JSON object per stdin line:
  `{"type":"transcribe-file","requestId","audioPath","languageMode"}`; replies,
  one per line: `{"requestId","ok","text","detectedLanguage","noSpeech","error"}`.
  Near-silent audio is answered `noSpeech: true` without using the model. A
  request that fails is answered `ok: false` with the error; the worker keeps
  serving.

## Conventions

- Stdout carries protocol messages only; diagnostics go to stderr.
- Speech libraries are imported inside the backend that uses them, so the
  worker module imports without them (the tests and the `prepare` command need
  no speech library).
- Tests (`tests/`) use Python's `unittest` and Node's test runner, with stand-in
  modules for the speech libraries: the release workflow runs them on Linux
  without those libraries. Behavior that depends on a real library is proven
  with the real runtime outside CI.
- Library versions are pinned in `runtime/requirements-*.txt`; code may rely on
  the pinned version's public behavior.

## Design Cases

Each case records a design mistake found in this project and what it taught.
Read the cases before designing or reviewing a change of the same shape. New
cases are appended with the next `DC-` number.

### DC-001: One Python checked for the worker's stderr (autobyteus-655)

- **Problem:** a start failure had to write exactly one stderr line, because callers
  show all of stderr as the error. The design silenced one known library warning and
  was checked on Python 3.9 only. On Python 3.11, the launcher's first choice, the
  worker's own `import audioop` added a two-line `DeprecationWarning`.
- **How it was found:** API/E2E ran the worker through the bundle's launcher on the
  Python it bootstraps; the unit tests call `main()` in-process and cannot see
  import-time warnings.
- **Wrong assumption:** the interpreter used for the check stood for every
  interpreter the launcher can pick (`python3.11`, `3.10`, `3.9`, then any `python3`).
- **Fix:** remove the cause in our own code (the deprecated module), keep a filter
  only for third-party noise, and test start failures as a subprocess run the way the
  launcher runs the worker.
- **Lesson:** check stdout/stderr behavior as a separate process on the Pythons the
  launcher can pick; fix our own warnings at their source instead of filtering them.
