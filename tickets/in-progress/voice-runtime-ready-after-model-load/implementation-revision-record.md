# Implementation Revision Record

The current code and `implementation-handoff.md` remain authoritative.

## Revision Index

| Revision ID | Triggering Role / Report / Round | Finding IDs | Classification | Related Revision IDs | Result |
| --- | --- | --- | --- | --- | --- |
| IR-001 | Solution Designer / `handoff-architecture-design-complete.md` / initial | N/A | `Initial Baseline` | SR-001 | Implemented, self-checked (IMP-00…IMP-06), sent to API/E2E |

## Revision Entries

### IR-001 — The worker writes `ready` only after its backend can transcribe

- Triggering role, report path, and round: Solution Designer, `tickets/in-progress/voice-runtime-ready-after-model-load/handoff-architecture-design-complete.md`, initial.
- Triggering finding IDs: N/A
- Classification: `Initial Baseline`
- Prior authoritative result: N/A
- Current authoritative result: commit `050cca1` on `codex/voice-runtime-ready-after-model-load`; `serve` checks the model folder, loads the backend and runs one warm-up transcription of a generated 1 s tone before `ready`; a failed start writes one stderr line and exits 1; build default version 0.3.1.
- Related solution revision IDs: SR-001
- Related architecture-review revision IDs: N/A
- Related code-review revision IDs: N/A
- Related API/E2E revision IDs: N/A
- Related delivery revision IDs: N/A
- Why this baseline or implementation revision is recorded: initial implementation of the approved design.
- Approved behavior or requirement IDs affected: BEH-001…BEH-004; REQ-001…REQ-005; AC-001…AC-005 (AC-006 left to delivery).
- Implementation delta: `Backend.load`; MLX and faster-whisper `load`; `ModelFolderNotFoundError`, `write_warm_up_clip`, `start_backend`, `start_failure_line`; `main`'s `serve` branch; lazy loaders removed; new `WorkerStartTests` and `BackendLoadTests`; `RUNTIME_VERSION` default `0.3.1`.
- Changed files or areas: `runtime/voice_input_worker.py`, `tests/test_voice_input_worker.py`, `scripts/build-runtime.sh`.
- Local validation and result: IMP-00 new tests fail on the 0.3.0 worker; IMP-01 unit (12) and node (2) tests pass; IMP-02…IMP-05 live MLX and faster-whisper checks pass; IMP-06 founder install unchanged.
- Next recipient or routing: API/E2E (Small + Low, direct route).
- Remaining limitations or risks: RSK-001 (faster-whisper not live on Linux/Windows/Intel), RSK-002 (memory from start); bundle not built locally; FU-001 (MLX needs ffmpeg) unchanged.
