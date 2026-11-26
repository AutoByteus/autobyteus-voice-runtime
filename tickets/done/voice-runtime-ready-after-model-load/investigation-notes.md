# Investigation Notes

## Investigation Meta

- Package identifier: `voice-runtime-ready-after-model-load` (Project Task `autobyteus-655`)
- Request / ticket: autobyteus-655, prerequisite PRE-001 of autobyteus-516
- Workspace root: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load` (repository `/Users/normy/autobyteus_org/autobyteus-voice-runtime`, `github.com/AutoByteus/autobyteus-voice-runtime`)
- Repository mode: `Git`
- Task worktree / branch: same path, `codex/voice-runtime-ready-after-model-load`
- Resolved base remote / branch / revision: tag `v0.3.0` = `251eab8` (fetched 2026-11-26). `origin/main` is 150 commits ahead and holds unreleased v1.0.0 work, so it is not the base (Task direction)
- Finalization target remote / branch: the 0.3.x maintenance line, which does not exist yet as a branch (only the tag): `origin/release/0.3` created from `v0.3.0` at delivery (DEC-005)
- Bootstrap result: worktree created from `v0.3.0`; ticket folder `tickets/in-progress/voice-runtime-ready-after-model-load/` (the repository's convention on `main`: `tickets/done/voice-input-runtime-reliability/`)
- Bootstrap blocker: None
- Current solution revision ID: `SR-002`
- Authorities read (requirements reading gate, 2026-11-26, after the skill update): `SKILL.md`, `references/requirements-engineering.md`, `references/ticket-scope.md`, `references/project-documents.md`, `references/finding-the-cause.md`, `references/handoff.md`; `templates/requirements-doc-template.md`
- Project documents at `v0.3.0`: `README.md` only; no `AGENTS.md`, `DESIGN.md`, `TESTING.md` or `RELEASE.md` (`git ls-tree -r --name-only v0.3.0`)
- Investigation status: Complete for requirements; architecture facts below

## Initial Request And Clarifications

- Request (Task autobyteus-655, from `/project_task_manager` on the 516 Solution Designer's request): make the worker send `ready` only when it can transcribe, for both backends; keep the protocol otherwise unchanged; release 0.3.1 from the 0.3.0 line on the founder's word.
- Founder's direction (relayed in the Task, his words in the 516 SD's conversation, 2026-11-26): "whatever is more reasonable architecture-wise … you will decide".
- Constraints: no desktop or superrepo change; never touch the founder's installed runtime or models (clone or isolated folder); do not break existing 0.3.x callers; follow the repository's own guidelines; ask the founder before tagging or publishing.

## Product And Domain Understanding

- Product area: the downloadable Voice Input runtime (a Python worker) that the desktop app's Voice Input extension starts and talks to over stdin/stdout.
- Actors: the desktop app's `VoiceInputRuntimeService` (today's caller, `autobyteus-web/electron/extensions/voice-input/voiceInputRuntimeService.ts` on `origin/personal`); the autobyteus-516 Voice Input extension package (future caller, pins 0.3.1); the user dictating.
- Protocol (v0.3.0): `serve --backend <mlx|faster-whisper> --model-path <dir>`; the worker writes `{"type":"ready","backendKind":…}`, then answers each `{"type":"transcribe-file","requestId","audioPath","languageMode"}` with `{"requestId","ok","text","detectedLanguage","noSpeech","error"}`.

## Source Log

| Date | Source Type | Exact Source / Command / Query | Why Consulted | Relevant Finding | Follow-Up |
| --- | --- | --- | --- | --- | --- |
| 2026-11-26 | Code | `git show v0.3.0:runtime/voice_input_worker.py` | The worker | `ready` at `:174-178` right after `build_backend` (constructors store the path only, `:82-85`, `:108-111`); MLX imports `mlx_whisper` lazily `:87-93`; faster-whisper builds `WhisperModel` lazily `:113-123`; silence answered before any model use `:35-50`, `:203-212`; any request exception becomes an `ok:false` reply `:223-232` | — |
| 2026-11-26 | Code | `git show v0.3.0:tests/test_voice_input_worker.py` | Test style | stdlib `unittest`, module loaded from file, fakes via `sys.modules` patching | New tests follow it |
| 2026-11-26 | Code | `git show v0.3.0:.github/workflows/release-voice-runtime.yml` | Release lane | A `v*` tag push (or dispatch) builds 4 bundles (darwin arm64/x64, linux x64, win32 x64), runs `node --test tests/*.test.mjs` and `python3 -m unittest tests/test_voice_input_worker.py` on ubuntu, generates `voice-input-runtime-manifest.json`, publishes a GitHub release with `target_commitish: ${{ github.sha }}` | DEC-005 |
| 2026-11-26 | Code | `scripts/build-runtime.sh`, `runtime/voice-input-worker.sh`, `metadata/runtime-assets.json`, `runtime/requirements-*.txt` at `v0.3.0` | Artifact | A bundle holds scripts only; the launcher creates `.venv` and pip-installs `mlx-whisper==0.4.3` or `faster-whisper==1.2.1` on first start; darwin arm64 = MLX (`whisper-small-mlx`), the other three = faster-whisper (`faster-whisper-small`); `RUNTIME_VERSION` default `0.3.0` (`build-runtime.sh:12`), overridden by the workflow | — |
| 2026-11-26 | Code | `origin/personal:autobyteus-web/electron/extensions/voice-input/voiceInputRuntimeService.ts:104-208` | Today's caller | Spawns the worker lazily on the first request, awaits `ready` with **no timeout**, then writes the request; ignores unknown lines; on exit before `ready` rejects with the worker's trimmed stderr (`:134-143`) | Compatibility basis |
| 2026-11-26 | Code | `origin/personal:…/voiceInputRuntimeSupport.ts:201-215` | Worker environment | The desktop gives the worker the login-shell PATH | ffmpeg availability |
| 2026-11-26 | Code | founder's install, cloned: `.venv/lib/python3.9/site-packages/mlx_whisper/{transcribe.py:48-62,146-147, load_models.py:14-45, audio.py:24-60}` | MLX load API | `transcribe` takes its model from `ModelHolder.get_model(path, dtype)` (float16 by default), cached by path; `load_model` reads `weights.safetensors` and `mx.eval`s parameters; `load_audio` shells out to the `ffmpeg` CLI on PATH | DEC-001/002, FU-001 |
| 2026-11-26 | Doc | 516 `requirements-doc.md` (PRE-001, REQ-012), `probes/contract-probe/README.md` | Upstream need | ~30 s first dictation; silence warm-up loads nothing; tone warm-up then 0.25 s; ~846 MB held warm | — |
| 2026-11-26 | Command | `cp -c -R` of `~/.autobyteus/extensions/voice-input/{runtime,models}` to `/tmp/ab655/cow`; `stat` of all 20,070 entries before (`evidence/founder-install-before.txt`) | Isolation | APFS clone; the founder's files are compared after the measurements | — |

## Relevant Existing Behavior And Supported Product Paths

| Behavior ID | Kind | Supported Trigger Or Governing Contract | Current Supported Product Behavior Path / Lifecycle | Current Outcome / Invariants | Evidence | Confidence / Unknown |
| --- | --- | --- | --- | --- | --- | --- |
| BEH-001 | Contract | A caller starts `serve` | Worker writes `ready` immediately; the model loads inside the first non-silent transcription | `ready` does not mean "can transcribe"; first dictation pays the load (cold ~25–30 s, warm 1.8–2.7 s); later ~0.2–0.3 s | RT-001, RT-002; worker `:174-178` | Reproduced |
| BEH-002 | Contract | A caller sends a request | Request/response shape; silence → `noSpeech:true` without model; errors → `ok:false` reply | Unchanged by this ticket | worker `:180-232` | Read |
| BEH-003 | Contract | Model cannot load (corrupt/missing files, missing package) | Today: `ready` is still sent; each transcription fails with `ok:false` and the exception text | Caller sees per-request errors | worker `:223-232` | Read |
| BEH-004 | Operational | Release of a version | Tag `v*` → workflow → GitHub release with 4 bundles + manifest | — | workflow | Read |

## Relevant Codebase And Technical Facts

| Path / Component / Contract | Current Responsibility Or Behavior | Requirement Implication | Architecture Question / Design Implication |
| --- | --- | --- | --- |
| `runtime/voice_input_worker.py` `main` (`:154-234`) | Parse args, build backend, emit `ready`, request loop | REQ-001…REQ-004 | Where the load and warm-up run, and what happens on failure |
| `MlxBackend` (`:82-105`) | Lazy import; `transcribe(path_or_hf_repo=…)` loads through `ModelHolder` | REQ-001 | Load through the same `ModelHolder` with float16 so `transcribe` reuses it |
| `FasterWhisperBackend` (`:108-138`) | Lazy `WhisperModel(cpu, int8)` | REQ-001 | Build at start |
| `Backend` base (`:59-61`) | One method | — | Gains a "become ready" step |
| `tests/test_voice_input_worker.py` | Unit tests, no speech libraries in CI | REQ-001…REQ-004 tests | Fakes for both libraries |
| Desktop caller (superrepo, not changed) | No timeout on `ready`; exit before `ready` → stderr text as the error | REQ-003 failure form | Exit non-zero with a one-line reason on stderr |

## Structural And Payload Surface Inventory

- Payload: none.
- Structural: one Python file and its tests; the wire protocol's message shapes unchanged; only the timing of `ready` and the failure form before `ready` change.

## Runtime, Probe, Or Reproduction Findings

All runs on the founder's Mac (Apple M-series, macOS) against an APFS clone or isolated install under `/tmp/ab655`, with `HOME=/tmp/ab655/home` and `HF_HUB_OFFLINE=1`; probes in `probes/`, raw output in `evidence/`.

| ID | Method / Command | Scenario | Observation | Established | Requirement Implication | Artifact / Evidence Path |
| --- | --- | --- | --- | --- | --- | --- |
| RT-001 | `probes/drive_worker.py` on the cloned 0.3.0 worker, PATH without Homebrew (cold files) | 0.3.0 cold start | `ready` after 533 ms; the first request spent 25.7 s loading, then failed `FileNotFoundError: 'ffmpeg'` | Reproduced | BEH-001; FU-001 | `evidence/B1-baseline-0.3.0-mlx.jsonl` |
| RT-002 | same, PATH with `/opt/homebrew/bin` (as the desktop gives), twice | 0.3.0 warm files | `ready` after 86–98 ms; first transcription 2,737 / 1,805 ms; second 314 / 222 ms; texts correct | Measured | BEH-001 | `evidence/B2-baseline-0.3.0-mlx-run{1,2}.jsonl` |
| RT-003 | `probes/mlx_phases.py` with the cloned venv | MLX phases, warm files | import 1,198–2,779 ms; `ModelHolder` load fp16 189–310 ms; without warm-up first clip 564–598 ms, second 242–250 ms; with a 1 s tone warm-up (435–621 ms) first clip 302–337 ms, second 232–330 ms; texts correct | Measured | REQ-001 feasibility (MLX); DEC-001 | `evidence/B3-mlx-phases.jsonl` |
| RT-004 | `mlx_whisper/audio.py:41-46` | Audio decoding | File decoding runs the `ffmpeg` CLI from PATH | Read (and RT-001) | DEC-002, FU-001 | — |
| RT-005 | `probes/fw_phases.py` in an isolated venv (`faster-whisper==1.2.1`, `Systran/faster-whisper-small`) under `/tmp/ab655/fw` | faster-whisper phases on Apple Silicon CPU | import 15,925 ms cold, then 438–576 ms; `WhisperModel` (cpu, int8) 1,346–1,488 ms; without warm-up first clip 4,392–5,369 ms, second 3,950–4,288 ms; with a 1 s tone WAV warm-up (2,422–3,401 ms, vad off) first clip 3,911–4,133 ms, second 3,185–5,031 ms; texts correct. Every faster-whisper transcription costs 3–5 s on this CPU; only the load and first-run cost are first-time costs | Measured | REQ-001/002 feasibility; the "well under a second" outcome holds for MLX only (DEC-003) | `evidence/B4-fw-phases.jsonl`, `evidence/fw-setup.log` |

| RT-006 | `probes/prototype_worker.py` (a probe copy of the 0.3.0 worker that loads and warms up on a 1 s 440 Hz WAV before `ready`; not the implementation) via `probes/prototype-entry.sh` + `drive_worker.py`, real libraries | Contract validation, both backends | MLX: `ready` at 5,222 / 4,647 ms; first transcription after `ready` 280 / 324 ms, later 258–430 ms. faster-whisper: `ready` at 3,051 / 3,459 ms; first 2,866 / 3,271 ms, later 2,335–3,234 ms. Texts correct | Measured | REQ-001/002 met by the shape | `evidence/P1-prototype-mlx-run{1,2}.jsonl`, `evidence/P2-prototype-fw-run{1,2}.jsonl` |
| RT-007 | same prototype, broken inputs | Start-up failures | All four (MLX missing folder, MLX corrupt weights, MLX without `ffmpeg`, faster-whisper corrupt `model.bin`): no `ready`, exit 1, reason line on stderr. MLX missing folder reads `HFValidationError: Repo id must be…` (mlx treats a missing path as a repo id, `load_models.py:18-20`); MLX stderr also carries a 2-line `urllib3` `NotOpenSSLWarning` from importing `huggingface_hub` on the system Python 3.9 (present in 0.3.0's stderr too) | Reproduced | REQ-003; DEC-008, DEC-009 | `evidence/P3-failure-*.jsonl` |
| RT-009 | same prototype with MLX loading only through the warm-up `transcribe` call (no `ModelHolder`) | Design premise (public call only) | `ready` at 3,846 / 4,321 ms; first transcription 311 / 328 ms, second 330 / 416 ms; texts correct | Measured | Design: MLX `load` uses the public call | `evidence/P4-prototype-mlx-transcribe-only-run{1,2}.jsonl` |
| RT-010 | `probes/rms_equivalence.py` on system Python 3.9 (still has `audioop`) | Replacing `audioop.rms` (SR-002) | Standard-library RMS (`array` + `math`) equals `audioop.rms` on both real clips and 15 synthetic cases (silence, quiet noise, the 119/120 threshold, full scale, random) at widths 1, 2 and 4: 0 of 17 differ; every `< 120` (no speech) answer identical | Measured | DEC-010; silence answers preserved | `evidence/P5-rms-equivalence.txt` |
| RT-011 | Code review CRR-001, API/E2E API-05/05b (their evidence) | Start failure through the bundle's launcher on Python 3.11.15 | 3 stderr lines: `voice_input_worker.py:3: DeprecationWarning: 'audioop' is deprecated…` + `import audioop` + the reason line; 1 line on Python 3.9. `find_python` prefers 3.11 (`voice-input-worker.sh:9-21`). Unit tests run `main()` in-process and cannot see import warnings | Reproduced (by API/E2E) | DEC-009 revised, DEC-010, AC-007 | `evidence/api-e2e/API-05b-launcher-stderr-lines.log` |
| RT-012 | Delivery DR-002 (run 45823708736, `gh run view`, checked by the Solution Designer 2026-11-26); `.github/workflows/release-voice-runtime.yml` on `release/0.3` | The `v0.3.1` tag run | Linux, win32 and verify succeeded; both darwin builds cancelled in 1 s: `The configuration 'macos-14-arm64-us-default' is not supported` (the matrix pins `runner: macos-14`, retired 2026-11-02); publish skipped; `gh release view v0.3.1` → not found; tag `v0.3.1` → `b1e14ab`. Nothing ran the workflow before the tag: it triggers only on `v*` tags and on a dispatch, which publishes. Node 20 deprecation warnings only | Run log, read | DEC-011…DEC-013 |
| RT-013 | `scripts/build-runtime.sh`; the published `v0.3.0` bundles (`gh release download v0.3.0`, `tar -tvzf`, `file`) | What building a bundle needs | The script copies the worker, `run_pip_ipv4.py`, both requirement files and the launcher, sets the launcher's mode 755, and runs `tar` (plus `node` to read `metadata/runtime-assets.json`). Both darwin bundles (built on `macos-14`) have exactly the linux bundle's entries, sizes (worker 7632, launcher 1846) and modes. The win32 bundle (built on `windows-2022`) has CRLF line endings in every text file (`voice-input-worker.cmd` 1936 bytes, `CRLF line terminators`; worker 7870); the repository has no `.gitattributes`, so the Windows checkout supplies them | Measured | DEC-012 |
| RT-008 | `stat` of the founder's 20,070 install entries before and after | Isolation | Identical except `voice-input/temp` mtime 12:10:35 → 12:46:11, written by the app's own running worker (pid 22112, started 2026-11-25 21:07) during a dictation; folder empty | Measured | Constraint kept | `evidence/founder-install-{before,after}.txt` |

- Temporary diagnostics: None in the repository.
- Reproduction for implementation to start from: `probes/drive_worker.py <entrypoint> <backend> <model> <clips…>` prints `ready` time and per-clip times; on 0.3.0 `ready` arrives in ~0.1 s and the first clip pays the load.

## Stakeholder And User Evidence

| Source / Actor | Need, Problem, Or Constraint | Evidence Strength | Requirement Implication | Open Question |
| --- | --- | --- | --- | --- |
| Founder (via Task) | Fix readiness in the runtime | Direct (relayed) | Scope | — |
| autobyteus-516 | Honest "Getting ready", no ~30 s first dictation | Approved REQ-012 there | REQ-001, QR-001 | — |

## External Contracts, Standards, And Dependencies

| Contract / Dependency | Version / Authority | Relevant Behavior Or Constraint | Evidence | Unknown / Risk |
| --- | --- | --- | --- | --- |
| `mlx-whisper` | 0.4.3 (pinned) | `ModelHolder` cache by path; fp16 default; ffmpeg for files | RT-003/004 | — |
| `faster-whisper` | 1.2.1 (pinned) | `WhisperModel(path, device="cpu", compute_type="int8")`; transcribe returns a lazy generator | worker; RT-005 (pending) | — |
| Desktop caller | `origin/personal` | No `ready` timeout; stderr as failure text | Source Log | — |

## Persisted Data And State Facts

- Not affected: the worker keeps no state; models and the venv are read only.

## Product Design Request Context

- Not stated.

## Supplemental Artifact Inventory

| Artifact Path | Owner | Purpose | Scope | Related Requirement / AC IDs | Status | Approval Applicability / State |
| --- | --- | --- | --- | --- | --- | --- |
| `probes/drive_worker.py` | Solution Designer | Drive any worker build over its protocol and time `ready` and each clip | Investigation, validation | REQ-001…REQ-003 | Current | Evidence |
| `probes/mlx_phases.py`, `probes/fw_phases.py` | Solution Designer | Phase timings per backend | Investigation | REQ-001 | Current | Evidence |
| `evidence/` | Solution Designer | Raw probe output, founder-install timestamp list | Investigation | — | Current | Evidence |

## Assumptions, Unknowns, And Risks

| ID | Type | Description | Why It Matters | Resolution / Owner | Status |
| --- | --- | --- | --- | --- | --- |
| RSK-001 | Risk | Linux and Windows faster-whisper bundles cannot be run live here | AC coverage | Same Python code and library on macOS (RT-005) plus the workflow's unit tests on ubuntu (DEC-006) | Accepted |
| RSK-002 | Risk | Memory (~850 MB) is now held from worker start | Callers that start the worker early | Today's caller starts it at the first dictation (no change); 516 starts it on purpose and unloads after idle | Accepted |

## Architecture Investigation Findings

(Added in the design phase.)

## Requirement Implications

- The fix is entirely inside the worker: load (and exercise) the model before `ready`, fail before `ready` when that is impossible.
- A tone warm-up through a WAV file proves file decoding as well as the model, and halves the first transcription on MLX (RT-003).

## Notes For Architecture Design

- Scenario IDs: SCN-001…SCN-004 (requirements doc).
- Preserve message shapes and request handling exactly.
