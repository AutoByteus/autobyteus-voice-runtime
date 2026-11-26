# Handoff — Architecture Design Complete (autobyteus-655, SR-001)

## Result

- Classification: `Architecture Design Complete`; `task_size` `Small`, `architectural_risk` `Low` (design spec).
- Route: direct implementation (`/implementation_engineer`), per the handoff rule for Small/Medium and Low.

## Request And Direction

- Project Task `autobyteus-655` (project `project_a1377344-25db-482a-97cc-ecfdb0fb495a`), requested by `/project_task_manager` for the autobyteus-516 Solution Designer: prerequisite PRE-001 of autobyteus-516.
- Direction: the voice runtime's worker sends `ready` only when it can transcribe, for both backends; protocol otherwise unchanged; released as 0.3.1 from the 0.3.0 line; the founder's word before tagging or publishing. The founder's words relayed in the Task: "whatever is more reasonable architecture-wise … you will decide".
- Constraints: voice runtime repository only (no desktop or superrepo change); never touch the founder's installed runtime or models (APFS clones or isolated folders under a temporary folder; compare `stat` lists before and after); follow the repository's own tests; do not break 0.3.x callers.

## What To Build (the design spec is authoritative)

- `runtime/voice_input_worker.py`:
  - `serve` checks the model folder exists, builds the backend, writes a 1 s 440 Hz 16 kHz mono WAV into a temporary folder, and calls the new `Backend.load(clip)`; only then does it write the unchanged `ready` message.
  - MLX `load`: import `mlx_whisper.transcribe` and transcribe the clip through it; its first call loads the model into mlx-whisper's own cache.
  - faster-whisper `load`: construct `WhisperModel(cpu, int8)` and transcribe the clip with `vad_filter=False`, consuming the generator.
  - Any start failure: no `ready`; one stderr line `Voice Input worker could not start the <backend> backend: <reason>`; exit 1. The `urllib3` `NotOpenSSLWarning` is silenced (that warning only).
  - The lazy loaders are removed.
- Tests: `tests/test_voice_input_worker.py` with stand-in libraries (change sequence step 1); they fail on `v0.3.0`.
- `scripts/build-runtime.sh`: default version 0.3.1.
- `DESIGN.md` at the repository root: created by the Solution Designer (already committed on the branch); keep it in step with the code.

## Evidence

- Contract validated with the real libraries through a probe prototype. The design spec's shape differs: it does not use `ModelHolder` (RT-009).
  - MLX (clone of the founder's install): `ready` after 3.8–5.2 s; first request after it 280–328 ms, against 1.8–2.7 s on 0.3.0 with warm files and ~25–30 s cold.
  - faster-whisper (isolated install): `ready` after 3.1–3.5 s; first request 2.9–3.3 s, same as later ones.
  - Four broken inputs: no `ready`, exit 1, reason line.
- Probes for your live checks: `probes/drive_worker.py` (drive any worker build and time `ready` and each clip), clips `probes/en.wav` and `probes/en2.wav`. The founder-install `stat` lists are in `evidence/`.

## Approval Basis

- Requirements `Approved` by the Solution Designer within the direction, founder informed. Design approval not required. Release (DEC-007): founder's word needed before tagging.

## Package

`/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load/tickets/in-progress/voice-runtime-ready-after-model-load/`: `requirements-doc.md`, `investigation-notes.md`, `design-spec.md`, `solution-revision-record.md`, `follow-ups.md` (FU-001, not sent yet), `probes/`, `evidence/`.

## Workspace

- Repository `/Users/normy/autobyteus_org/autobyteus-voice-runtime` (`github.com/AutoByteus/autobyteus-voice-runtime`).
- Worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`, branch `codex/voice-runtime-ready-after-model-load`, base tag `v0.3.0` (`251eab8`).
- Finalization target: a maintenance branch `release/0.3`, created from `v0.3.0` at delivery; `v0.3.1` is tagged there only on the founder's word (DEC-005, DEC-007). `main` is not touched.
- The repository has no `TESTING.md` or `RELEASE.md`; under the team rules API/E2E and delivery create them when they first need them.

## Open Risks

- RSK-001: Linux, Windows and Intel-Mac faster-whisper bundles are not run live; covered by the same Python code on macOS arm64 CPU and the workflow's ubuntu unit tests (DEC-006).
- RSK-002: the loaded model's memory (~850 MB on MLX) is held from start; callers choose when to start.

## Handoff Route Record

- Rules read 2026-11-26; matching rule: Architecture Design Complete, Small/Medium and Low → `/implementation_engineer`.
