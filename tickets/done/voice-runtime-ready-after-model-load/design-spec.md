# Design Spec

## Solution And Approval Basis

- Current solution revision ID: `SR-003` (the `v0.3.1` release run published nothing: the workflow pins the retired `macos-14` image, DR-002). Earlier: SR-002 resolved code review CRR-001
- Approved requirements baseline / revision, who approved, and approval reference: `requirements-doc.md` at SR-003 (REQ-005/AC-006 revised to `v0.3.2`, REQ-006, AC-008, DEC-011…DEC-013) and SR-001, approved by the Solution Designer within the direction, founder informed (requirements doc, Document Status)
- Behavior-defining supplements and their approval references: None
- User approval of the design, when the direction requires it: `Not required` (the release itself needs the founder's word: DEC-007)
- Design status: `Ready`
- Canonical investigation-notes path: `tickets/in-progress/voice-runtime-ready-after-model-load/investigation-notes.md`
- Authorities read (design reading gate, 2026-11-26, after the skill update): `references/architecture-design.md`, `references/design-principles.md`, `templates/design-spec-template.md`, `templates/project-design-template.md`; project `DESIGN.md`: none existed (`v0.3.0` and `main`); **Created: `DESIGN.md`** at the repository root on this branch; `references/design-examples.md`: not used
- Project design-principle conflicts or discrepancies: None

## Current-State Read

`main()` in `runtime/voice_input_worker.py` builds the backend (`:174`) and writes `ready` at once (`:175-178`). The backend constructors store the model path only (`:82-85`, `:108-111`); MLX imports `mlx_whisper` inside the first transcription (`:87-93`) and `mlx_whisper.transcribe` then loads the model through its own cache (`mlx_whisper/transcribe.py:146-147`); faster-whisper builds `WhisperModel` inside the first transcription (`:113-123`). Near-silent audio is answered before any model use (`:35-50`, `:203-212`); its loudness is `audioop.rms` (`:49`), the module's only `audioop` use; `audioop` is imported at module level (`:3`), deprecated in Python 3.11/3.12 (an import warning when the worker runs as `__main__`) and removed in 3.13 (RT-011, FU-002). So the first non-silent request pays the import, the load and the first-run cost (RT-001…RT-005). The worker module imports no speech library at load time, and the tests run without them (`tests/test_voice_input_worker.py`). Today's caller waits for `ready` without a timeout and turns a worker exit before `ready` into an error with the stderr text (`voiceInputRuntimeService.ts:134-143,145-208` on the superrepo's `origin/personal`).

## Task Size And Architectural Risk (Mandatory)

- Task size: `Small`
- Size rationale and supporting evidence: one source file changes (`runtime/voice_input_worker.py`: a start step in `main`, a `load` per backend, the lazy loaders removed), its test file grows, the build script's default version moves to 0.3.1, and `DESIGN.md` is created. No new module, no new dependency.
- Architectural risk: `Low`
- Risk rationale and supporting evidence: the protocol's message shapes are unchanged; the timing of `ready` and the failure form before it change, and both were checked against the only existing caller (no `ready` timeout; exit before `ready` → its stderr shown) and with the real libraries (RT-006, RT-007). No persistence, security, concurrency or deployment surface changes; the release goes through the existing workflow, only on the founder's word.
- SR-003 (release workflow): one YAML file changes (runner labels, a `publish` dispatch input, a `release/**` push trigger, the publish job's condition) and the build script's default version. Still `Small` / `Low`: the bundles' contents and the publishing steps are unchanged, and AC-008 proves the workflow on GitHub before any tag.
- Escalation trigger: a caller found to time out on `ready`, a library behavior that differs on Linux or Windows, or any need to add a protocol message.

## Architecture Investigation Evidence

| Source / Command / Probe | Exact Path / Reference | Observation | Design Decision Supported | Remaining Uncertainty |
| --- | --- | --- | --- | --- |
| Code | `voice_input_worker.py:82-138,154-234` at `v0.3.0` | Lazy loads; early `ready` | Start step before `ready` | — |
| Code | `mlx_whisper/transcribe.py:48-62,146-147` (0.4.3) | `transcribe` loads through its own cache keyed by path, fp16 | The MLX warm-up transcription itself loads the model; no use of `ModelHolder` | — |
| Code | `mlx_whisper/audio.py:41-46` | Files decoded by the `ffmpeg` CLI | Warm up through a file | — |
| Code | `voiceInputRuntimeService.ts:104-208` (superrepo) | No `ready` timeout; stderr as failure text | Failure form | — |
| RT-003, RT-005 | `evidence/B3-*`, `evidence/B4-*` | Phase timings | Warm-up decision | — |
| RT-006, RT-007, RT-009 | `evidence/P1-*`, `P2-*`, `P3-*`, `P4-*` | The target shape on real libraries; failures; MLX load through the public call | Contract validated | Linux/Windows (DEC-006) |

## Intended Change

`serve` loads the backend's model and runs one transcription of a generated 1 s tone clip through the backend's real transcription call before it writes `ready`; a start that fails writes one reason line to stderr and exits 1 without `ready`. Nothing else in the protocol changes.

## Change Scope (Mandatory)

- In scope: UC-001…UC-003 in code; UC-004 at delivery (release on the founder's word). Files: `runtime/voice_input_worker.py` (start step; SR-002: the silence check's loudness computed with the standard library instead of `audioop`, identical results), `tests/test_voice_input_worker.py` (SR-002: a subprocess start-failure test), `scripts/build-runtime.sh` (default version), `DESIGN.md` (created).
- Derived consumers: the `ready` message keeps its shape; its meaning tightens (written only after a successful start). Readers: the desktop's `handleWorkerStdout` (resolves on `ready`, unchanged) and `handleWorkerExit` (rejects with stderr, unchanged); the 516 Voice Input package (designed for this meaning). No change needed in either.
- SR-003 (release workflow, DEC-011…DEC-013): `.github/workflows/release-voice-runtime.yml` (runner labels; build-only runs on push to `release/**` and on a dispatch with `publish` false; publish only for a `v*` tag or a dispatch with `publish` true); `scripts/build-runtime.sh` default version 0.3.1 → 0.3.2; `DESIGN.md` (Release section and design case DC-002). RELEASE.md's pre-tag step is the delivery engineer's (its document).
- Deliberately left alone: the Node 20 deprecation warnings of the `@v4` actions (warnings only); the `v0.3.1` tag (never moved, DEC-011); request handling and the silence rule itself (threshold 120, minimum 0.15 s: only how the loudness number is computed changes, RT-010), the `prepare` command, the launchers, the manifest generator, the release workflow, `main`'s v1.0 work.
- Follow-ups: FU-001. FU-002 (`audioop` removed in Python 3.13) is resolved by this ticket (DEC-010) for the worker's own import; whether the pinned speech libraries install on Python 3.13+ is not claimed.

## Relevant Behavior And Production-Path Map (Mandatory)

| Behavior ID | Kind | Approved Requirement / Intent And AC IDs | Approved Trigger Or Governing Contract | Relevant Existing Behavior And Evidence Reference | Approved Change Or Preserved Outcome | Target Production Path / Spine ID(s) |
| --- | --- | --- | --- | --- | --- | --- |
| BEH-001 | Contract | REQ-001, REQ-002; AC-001…AC-003 | `serve` | `ready` immediate; load in first request (RT-001…RT-005) | `ready` after load + warm-up | DS-001 |
| BEH-002 | Contract | REQ-004; AC-005 | Each request | Request loop `:180-232` | Preserved | DS-002 |
| BEH-003 | Contract | REQ-003; AC-004 | `serve` with a broken model or missing `ffmpeg` | `ready`, then per-request errors | No `ready`; stderr line; exit 1 | DS-001 |
| BEH-004 | Operational | REQ-005; AC-006 | Tag `v0.3.1` | Workflow | Unchanged workflow; founder's word | — (delivery) |

## Relevant Supplemental Task Artifacts

| Artifact Path | Purpose | Related Requirement / Acceptance-Criteria IDs | Relationship To This Design | Status / Approval Applicability |
| --- | --- | --- | --- | --- |
| `probes/drive_worker.py` | Drives any worker build and times `ready` and each clip | AC-002…AC-004 | The live check for the implementation and API/E2E | Evidence |
| `probes/prototype_worker.py` | Probe copy that validated the contract | REQ-001…REQ-003 | Shows the shape works; not the implementation (the design below is authoritative: it does not use `ModelHolder`) | Evidence |

## Task Design Health Assessment (Mandatory)

- Change posture: `Bug Fix`
- Current design issue found: `Yes` — a lifecycle step (loading) sits in the wrong place: inside the first request instead of the start.
- Structural triggers that fire, each with evidence and the response:
  - Data contract (Principle 17): the meaning of `ready` and the failure form cross a process boundary → Data Contract below, validated with the real libraries.
  - Behavior by absence (Principle 13): a missing model folder was left to MLX, which treats a missing path as a repository id (RT-007) → an explicit folder check with its own reason (DEC-008).
  - Empty indirection (Principle 13): the design adds no interface or wrapper; `Backend` gains one method its two implementations need.
  - Ruled out: Responsibility overload (the file grows from 238 to about 290 lines and keeps one concern: the worker process); Several kinds (both backends traced, RT-006/007).
- Deliberate deviations from a principle: None.
- Root cause classification: `Local Implementation Defect` (each backend's load is lazy, and `main` announces readiness without starting the backend).
- Refactor needed now: `No`
- Evidence: Current-State Read.
- Design response: give each backend a `load` step, run it before `ready`, remove the lazy loaders.
- Refactor rationale: the owners (worker `main`, the backend classes) are right; only the order is wrong.
- Intentional deferrals and residual risk: RSK-001 (Linux/Windows live runs), RSK-002 (memory held from start).

## Terminology

- **Start** (of the worker): from `serve` to `ready`: load the model and run the warm-up transcription.
- **Warm-up clip**: a 1 s, 440 Hz, 16 kHz mono 16-bit WAV the worker writes to a temporary folder for the start transcription.
- No project glossary found; the protocol words (`ready`, request, reply) are defined in `DESIGN.md`, The Worker Protocol.

## Section Fill Order

Followed.

## Legacy Removal Policy (Mandatory)

- Obsolete legacy paths in this scope: `MlxBackend._ensure_transcribe` and `FasterWhisperBackend._ensure_model` (lazy loading, replaced by `load`).
- Compatibility wrappers, dual paths, or legacy fallbacks this design keeps: `None`.

## Data Contract (Mandatory When The Change Stores Or Exchanges Data)

- Contract location: `DESIGN.md`, The Worker Protocol (created in this change); this section records the change and its validation.
- Shown to the user: in the Solution Designer's message of 2026-11-26 that reports this design (informational; no user decision needed).

| Record / Message | Stored Where, Or Boundary It Crosses | Field | Meaning | Written By | Read By |
| --- | --- | --- | --- | --- | --- |
| `ready` | stdout, worker → caller | `type` = `"ready"` | Unchanged | `main` | desktop `handleWorkerStdout` (`isReadyResponse`), 516 package |
| `ready` | same | `backendKind` | Unchanged | `main` | desktop types (logged/ignored), 516 package |
| `ready` (when) | same | — | **Changed:** written only after the model is loaded and the warm-up transcription returned | `main` | both callers: the first request after it pays no load |
| Start failure | stderr line + process exit | stderr line | `Voice Input worker could not start the <backend> backend: <reason>`; `<reason>` is `model folder not found: <path>` or `<ErrorClass>: <message>` with newlines collapsed | `main` | desktop `handleWorkerExit` (rejects with the trimmed stderr); 516 package |
| Start failure | process exit | exit code | `1` | `main` | both callers (exit before `ready`) |
| Request / reply | stdin / stdout | all | Unchanged | — | — |

- Identities and relationships: none (one worker, one model folder, one backend per process).
- Invariants and lifecycle: `serve` → start (load + warm-up) → `ready` → requests until stdin closes → exit 0. A failed start → stderr line → exit 1, never `ready`. `ready` is written at most once.
- One example per case:
  - Start succeeds: stdout `{"type": "ready", "backendKind": "mlx"}` after ~4.6–5.2 s (MLX, warm files); the next request `{"type":"transcribe-file","requestId":"r0","audioPath":"/…/en.wav","languageMode":"en"}` → `{"requestId": "r0", "ok": true, "text": "Please summarize the meeting notes and send them to the team.", "detectedLanguage": "en", "noSpeech": false, "error": null}` in ~0.3 s.
  - Missing model folder: stdout empty; stderr `Voice Input worker could not start the mlx backend: model folder not found: /…/whisper-small-mlx`; exit 1.
  - Missing `ffmpeg` (MLX): stdout empty; stderr `Voice Input worker could not start the mlx backend: FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`; exit 1.
  - Corrupt model (faster-whisper): stderr `Voice Input worker could not start the faster-whisper backend: RuntimeError: Unsupported model binary version. …`; exit 1.

### Data Contract Validation

- Walks: SCN-001 (desktop: spawn → await `ready`, no timeout → request → reply; 516: spawn early → "Getting ready" until `ready`) — every step finds what it needs; SCN-002 (first request after `ready`: no load) — RT-006; SCN-003 (failure: exit 1 → desktop rejects the dictation with the reason line) — RT-007 and `voiceInputRuntimeService.ts:134-143`; preserved request handling — unchanged code.
- Checks run against real dependencies: the probe prototype on the cloned MLX install and the isolated faster-whisper install (RT-006: `ready` 4.6–5.2 s / 3.1–3.5 s; first request 280–324 ms / 2.9–3.3 s), and on four broken inputs (RT-007: no `ready`, exit 1, reason line).
- Contract changes the validation caused: the explicit model-folder check (DEC-008); silencing the `urllib3` `NotOpenSSLWarning` so the failure text is the reason line (DEC-009); MLX's start loads through the warm-up transcription itself, not through `ModelHolder` (no reliance on mlx-whisper internals); rechecked: `ready` 3.8–4.3 s, first request 311–328 ms (RT-009).

## Persisted Data / State Transition Decision (Mandatory When Persisted Data May Be Affected)

- Decision: `Not Affected` (the worker stores nothing; the warm-up clip lives in a temporary folder removed after the start).

## Data-Flow Spine Inventory

| Spine ID | Scope | Related Behavior ID(s) | Start | End | Governing Owner | Why It Matters |
| --- | --- | --- | --- | --- | --- | --- |
| DS-001 | Primary End-to-End | BEH-001, BEH-003 | Caller spawns `serve` | `ready` on stdout, or stderr line + exit 1 | worker `main` | Truthful readiness |
| DS-002 | Primary End-to-End | BEH-002 | Caller writes a request | Reply on stdout | worker `main` (request loop) | Preserved |

## Primary Execution Spine(s)

- DS-001: `Caller (desktop VoiceInputRuntimeService / 516 package) → launcher (venv) → worker main: parse args → check model folder → build_backend → write warm-up clip → Backend.load(clip) [import library; load model; transcribe clip] → remove clip → emit ready → (request loop)`; on any start failure: `→ stderr reason line → exit 1`.
- DS-002: unchanged: `stdin line → parse → silence check → Backend.transcribe_file → emit reply`.

## Spine Narratives (Mandatory)

| Spine ID | Short Narrative | Main Domain Subject Nodes | Governing Owner | Key Off-Spine Concerns |
| --- | --- | --- | --- | --- |
| DS-001 | The worker starts its backend before announcing anything: it checks the model folder, lets the backend load its model and transcribe a generated tone clip through its real call, then writes `ready`; any failure on the way becomes one stderr line and exit 1 | worker start, backend, warm-up clip | worker `main` | warm-up clip writer, failure line |
| DS-002 | Unchanged | request, reply | `main` | silence check |

## Spine Actors / Main-Line Nodes

Worker `main`; `MlxBackend` / `FasterWhisperBackend`.

## Ownership Map

- Worker `main`: the start sequence (folder check, backend construction, warm-up clip, `load`, `ready` or failure line and exit code) and the request loop.
- Each backend: its library import, its loaded model, the warm-up and request transcription calls with its own settings.

## Thin Entry Facades / Public Wrappers (If Applicable)

N/A.

## Removal / Decommission Plan (Mandatory)

| Item To Remove / Decommission | Why It Becomes Unnecessary | Replaced By Which Owner / File / Structure | Notes |
| --- | --- | --- | --- |
| `MlxBackend._ensure_transcribe` (`:87-93`) | Loading moves to `load` | `MlxBackend.load` | `transcribe_file` uses what `load` stored |
| `FasterWhisperBackend._ensure_model` (`:113-123`) | Same | `FasterWhisperBackend.load` | Same |
| `import audioop` (`:3`) and `audioop.rms` (`:49` at `v0.3.0`) | Deprecated (3.11/3.12 import warning breaks REQ-003's one line) and removed in 3.13 (FU-002) | A small loudness function in the worker (`array` + `math`, widths 1–4) | Identical values (RT-010); SR-002 |

## Return Or Event Spine(s) (If Applicable)

N/A (synchronous stdin/stdout).

## Bounded Local / Internal Spines (If Applicable)

N/A (the request loop is unchanged).

## Off-Spine Concerns Around The Spine

| Off-Spine Concern | Related Spine ID(s) | Serves Which Owner | Responsibility | Why It Exists | Risk If Misplaced On Main Line |
| --- | --- | --- | --- | --- | --- |
| `write_warm_up_clip(path)` | DS-001 | `main` | Write the 1 s 440 Hz 16 kHz mono 16-bit WAV with `wave` (stdlib) | The warm-up input, no extra dependency | — |
| Failure line | DS-001 | `main` | Format `Voice Input worker could not start the <backend> backend: <reason>` on one line | REQ-003 | — |

## Ownership Boundaries

`main` calls `Backend.load` and `Backend.transcribe_file` only; it never imports a speech library. Each backend imports its library inside `load`.

## Boundary Encapsulation Map

| Authoritative Boundary | Internal Owned Mechanism(s) It Encapsulates | Upstream Callers That Must Use The Boundary | Forbidden Bypass Shape | If Boundary API Is Too Thin, Fix By |
| --- | --- | --- | --- | --- |
| `Backend` (`load`, `transcribe_file`) | Library import, model object, call settings | `main` | `main` importing `mlx_whisper`/`faster_whisper` or touching a model | Extend `Backend` |

## Dependency Rules

- `main` → `Backend`; backends → their speech library, imported inside `load`. The module imports only the standard library at import time (tests and `prepare` need no speech library).

## Interface Boundary Mapping

| Interface / API / Query / Command / Method | Subject Owned | Responsibility | Accepted Identity Shape(s) | Notes |
| --- | --- | --- | --- | --- |
| `Backend.load(warm_up_clip: str) -> None` | the backend's model | Import the library, load the model, transcribe the clip; raise on failure | path to a WAV file | New method on the existing base; both backends implement it (not a new interface) |
| `Backend.transcribe_file(audio_path, language_mode)` | one request | Unchanged signature; uses the loaded model | — | Called only after `load` |

## Interface Boundary Check

| Interface | Responsibility Is Singular? | Identity Shape Is Explicit? | Ambiguous Selector Risk | Corrective Action |
| --- | --- | --- | --- | --- |
| `Backend.load` | Yes | Yes | Low | — |

## Main Domain Subject Naming Check

| Node / Subject | Current / Proposed Name | Name Is Natural And Self-Descriptive? | Same Meaning And Name Everywhere It Appears? | Naming Drift Risk | Corrective Action |
| --- | --- | --- | --- | --- | --- |
| Start step | `Backend.load` | Yes | Yes | Low | — |
| `ready` | unchanged | Yes | Meaning now matches the word | Low | — |

## Existing Capability / Subsystem Reuse Check

| Need / Concern | Existing Capability Area / Subsystem | Decision | Why | If New, Why Existing Areas Are Not Right |
| --- | --- | --- | --- | --- |
| Warm-up input | `wave` (stdlib), as the tests already use | Reuse | No new dependency | — |
| Loading | each backend's existing library call | Reuse | MLX: `transcribe` loads through its own cache; faster-whisper: `WhisperModel` | — |

## Subsystem / Capability-Area Allocation

| Subsystem / Capability Area | Owns Which Concerns | Related Spine ID(s) | Governing Owner(s) Served | Decision | Notes |
| --- | --- | --- | --- | --- | --- |
| `runtime/` worker | start sequence, backends | DS-001, DS-002 | `main` | Extend | — |

## Draft File Responsibility Mapping

See Final File Responsibility Mapping.

## Reusable Owned Structures Check

N/A (no repeated structure).

## Shared Structure Tightness Check

N/A.

## Final File Responsibility Mapping

| File | Owning Subsystem / Capability Area | Owner / Boundary | Concrete Concern | Why This Is One File | Reuses Shared Structure? |
| --- | --- | --- | --- | --- | --- |
| `runtime/voice_input_worker.py` | worker | `main`, backends | The worker process: start, backends, request loop | Existing single-file worker; stays one concern | — |
| `tests/test_voice_input_worker.py` | tests | — | Unit tests with stand-in libraries | Existing | — |
| `scripts/build-runtime.sh` | build | — | Default `RUNTIME_VERSION` 0.3.0 → 0.3.1 (SR-003: → 0.3.2) | Existing | — |
| `.github/workflows/release-voice-runtime.yml` | release | workflow | SR-003: runners, build-only runs, publish condition | Existing single workflow; build-only and publishing share the same build and verify jobs, so what is proven before the tag is what the tag builds | — |
| `DESIGN.md` | project | — | Architecture, protocol, conventions | Created (project-documents rule) | — |

## Applied Patterns (If Any)

None beyond the existing per-backend classes.

## Target Subsystem / Folder / File Mapping

| Path | Kind | Owner / Boundary | Responsibility | Why It Belongs Here | Must Not Contain |
| --- | --- | --- | --- | --- | --- |
| `runtime/voice_input_worker.py` | File | worker | as above | existing | speech-library imports at module level |

## Folder Boundary Check

N/A (no folder change).

## Concrete Examples / Shape Guidance (Mandatory When Needed)

| Topic | Good Example | Bad / Avoided Shape | Why The Example Matters |
| --- | --- | --- | --- |
| MLX `load` | `from mlx_whisper import transcribe; self._transcribe = transcribe; self.transcribe_file(clip, "en")` (the first `transcribe` call loads the model into mlx-whisper's own cache; later calls reuse it) | `ModelHolder.get_model(path, mx.float16)`: relies on an internal class and must repeat `transcribe`'s dtype choice | Same effect through the public call |
| faster-whisper `load` | `self._model = WhisperModel(path, device="cpu", compute_type="int8")`; then `segments, _ = self._model.transcribe(clip, language="en", vad_filter=False, beam_size=1, condition_on_previous_text=False); list(segments)` | Warm-up through `transcribe_file` (`vad_filter=True`): voice detection drops the tone and the decoder never runs; or not consuming the generator (it is lazy) | The warm-up must really decode |
| `main` start | `try: check folder; backend = build_backend(...); with TemporaryDirectory() as d: clip = write_warm_up_clip(d); backend.load(clip)` / `except Exception as error: stderr line; return 1` → then `emit(ready)` | `emit(ready)` before `load`, or a traceback on stderr | The caller shows all of stderr |
| Warning filter | `warnings.filterwarnings("ignore", message="urllib3 v2 only supports OpenSSL")` before `load` | Silencing all warnings; or filtering our own module's warnings (SR-002: remove their cause instead) | Third-party noise only (RT-007); our own warnings are fixed at the source |
| Loudness (SR-002) | `samples = array.array({1:"b",2:"h",4:"i"}[width], payload)` (byteswap on big-endian hosts; width 3 decoded with `int.from_bytes(..., "little", signed=True)`), `rms = int(math.sqrt(sum(s*s for s in samples) / len(samples)))`, empty → 0 | Keeping `audioop`, or a numpy import (a dependency the worker module must not need at import) | Same numbers as `audioop.rms` (RT-010) |
| Start-failure test (SR-002) | `subprocess.run([sys.executable, str(MODULE_PATH), "serve", "--backend", "mlx", "--model-path", <missing>])`: stdout `""`, `stderr.strip().splitlines()` has exactly one line starting `Voice Input worker could not start the mlx backend:`, returncode 1 | Calling `main()` in-process (cannot see import-time warnings) | The check that would have caught CRR-001, at the earliest stage (CI) |

### Release workflow (SR-003)

| Topic | Good Example | Bad / Avoided Shape | Why The Example Matters |
| --- | --- | --- | --- |
| Triggers | `on: push: { branches: ["release/**"], tags: ["v*"] }`; `workflow_dispatch` inputs `runtime_version` (required, string) and `publish` (boolean, default `false`, "Publish a GitHub release for runtime_version") | A separate build-only workflow file (two copies of the build jobs drift apart) | The same jobs run before and at the tag (DEC-013) |
| Resolve job | tag push: version from the tag (unchanged); dispatch: from the input (unchanged); branch push: `runtime_version=0.0.0-ci.<first 12 of GITHUB_SHA>` and an empty `release_tag`; output `publish` = `true` for a tag push or a dispatch with `publish` true, else `false` | Deriving a version from a branch name (`release/0.3` → `release/0.3`) | The build script only prints the version; publishing reads the output |
| Publish job | `if: needs.resolve-release.outputs.publish == 'true'`, otherwise unchanged (`needs` all builds and verify) | Publishing from a branch push | No release or tag without the decision (DEC-007) |
| Runners | darwin arm64, darwin x64, linux x64: `ubuntu-latest`; win32 x64: `windows-latest` | `macos-14`, `macos-15`, `ubuntu-22.04`, `windows-2022` (pinned images retire, RT-012) | Packaging needs no Mac (RT-013); the Windows checkout supplies the launcher's CRLF line endings (RT-013) |
| Everything else | Matrix entries, `build-runtime.sh` call, artifact names, manifest generation, `softprops/action-gh-release@v2` step: unchanged | Changing asset names or the manifest | Callers and the 516 package read them |

## Backward-Compatibility Rejection Log (Mandatory)

| Candidate Compatibility Mechanism | Why It Was Considered | Rejection Decision | Clean-Cut Replacement / Removal Plan |
| --- | --- | --- | --- |
| Keep lazy loading as a fallback when `load` was skipped | "Safety" | Rejected | `load` always runs before the loop; lazy loaders removed |
| A flag to keep the old early `ready` | Old callers | Rejected (N/A): the only existing caller works with the new timing | — |

## Derived Layering (If Useful)

N/A.

## Change / Refactor Sequence

1. Tests first (they fail on `v0.3.0`): `main` writes `ready` only after `load` returned (a stand-in backend records the order); a failing `load` gives no `ready`, one stderr line, exit 1; a missing model folder gives `model folder not found: <path>`; MLX and faster-whisper `load` with stand-in `mlx_whisper` / `faster_whisper` modules (faster-whisper: `vad_filter=False`, generator consumed); the warm-up clip is a 1 s non-silent WAV and is removed afterwards; existing tests stay green.
2. Implement in `runtime/voice_input_worker.py`; remove the lazy loaders.
3. `scripts/build-runtime.sh`: default version 0.3.1.
4. Run `python3 -m unittest tests/test_voice_input_worker.py` and `node --test tests/*.test.mjs` (the workflow's own checks).
4a. SR-002: replace `audioop.rms` with the loudness function and drop `import audioop`; unit tests: the loudness function equals the known `audioop.rms` values of RT-010 (silence 0, threshold 119, quiet 52, full scale 32767 at width 2; widths 1 and 4), and the subprocess start-failure test (AC-007) runs under every Python the tests run on.
6. SR-003: change the workflow as "Release workflow (SR-003)" shows and the build script's default version to 0.3.2. Check it with `actionlint` when available (else a YAML parse) and the repository tests. Push the ticket branch and run the workflow from it by dispatch with `runtime_version` 0.3.2 and `publish` false (AC-008): four builds and verify green, publish skipped, no release or tag created; compare the four artifacts with the 0.3.0 bundles (entries, sizes, modes, the win32 CRLF). Delivery: merge to `release/0.3`; the push run must be green before tagging `v0.3.2`.
5. Live: build the darwin-arm64 bundle locally, install it into an isolated folder with the cloned model (or point `probes/drive_worker.py` at the worker with the cloned venv), and run AC-002…AC-004 (MLX on a clone, faster-whisper in an isolated install); compare the founder's install timestamps before and after.

## Key Tradeoffs

- Warm-up transcription (~0.4–0.6 s on MLX, ~2–3 s on faster-whisper CPU) before `ready`, in exchange for a first request with no first-run cost and a `ready` that proves decoding works.
- Memory (~850 MB on MLX) is held from the start instead of from the first request; callers decide when to start the worker.

## Risks

- RSK-001: Linux/Windows/Intel-Mac faster-whisper not run live (DEC-006).
- RSK-002: memory from start (accepted).
- RSK-003 (SR-003): `-latest` images change over time; a future image change shows on the next push to the release line, before a tag (DEC-013).
- A caller with a short `ready` timeout would now time out on a cold start (none exists: ASM-001).

## Guidance For Implementation

- Reproduction to start from: `probes/drive_worker.py <entrypoint> <backend> <model> <clip>` on the `v0.3.0` worker shows `ready` at ~0.1 s and the load inside the first clip (RT-001/002); the new unit tests in step 1 fail on `v0.3.0`.
- Keep the failure line on one line (collapse newlines in the error text).
- Measurements on the founder's machine only on APFS clones (`cp -c`) or isolated installs under a temporary folder; never write under `~/.autobyteus` (compare `stat` lists before and after).
