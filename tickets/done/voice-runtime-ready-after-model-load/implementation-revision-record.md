# Implementation Revision Record

The current code and `implementation-handoff.md` remain authoritative.

## Revision Index

| Revision ID | Triggering Role / Report / Round | Finding IDs | Classification | Related Revision IDs | Result |
| --- | --- | --- | --- | --- | --- |
| IR-001 | Solution Designer / `handoff-architecture-design-complete.md` / initial | N/A | `Initial Baseline` | SR-001 | Implemented, self-checked (IMP-00…IMP-06), sent to API/E2E |
| IR-002 | Solution Designer / `handoff-architecture-design-complete.md` SR-002 section / round 2 | CRR-001 | `Design Impact` (resolved by SR-002) | SR-002, CRR-001, API-REV-001 | Implemented, self-checked (IMP-07…IMP-11), sent to API/E2E |

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

### IR-002 — Loudness without `audioop`; a failed start writes one stderr line on every Python

- Triggering role, report path, and round: Solution Designer, `handoff-architecture-design-complete.md` (SR-002 section), round 2. SR-002 answers code review `code-review-report.md` CRR-001 (Design Impact on DEC-009), which followed API/E2E `api-e2e-execution-coverage-report.md` API-REV-001 (Fail: AC-004, API-05/05b).
- Triggering finding IDs: CRR-001.
- Classification: `Design Impact`, resolved upstream by SR-002 (DEC-010); this round implements it.
- Prior authoritative result: IR-001 (`050cca1`). On the launcher's Python 3.11 a failed start wrote three stderr lines: the `audioop` `DeprecationWarning` (two lines) and then the reason line. On Python 3.13+ the worker did not import at all.
- Current authoritative result: `18f9e12`; `import audioop` removed; `pcm_rms` returns the RMS `audioop.rms` gave; a failed start writes exactly one stderr line on Python 3.9, 3.11 and 3.14.
- Related solution revision IDs: SR-002
- Related architecture-review revision IDs: N/A
- Related code-review revision IDs: CRR-001
- Related API/E2E revision IDs: API-REV-001
- Related delivery revision IDs: N/A
- Why this baseline or implementation revision is recorded: implement DEC-010 and AC-007.
- Approved behavior or requirement IDs affected: BEH-002 (silence answers preserved), BEH-003; REQ-003, REQ-004; AC-004, AC-005, AC-007.
- Implementation delta: `import audioop` → `import array`; new `ARRAY_TYPECODES` and `pcm_rms(payload, sample_width)` (widths 1, 2 and 4 via `array`, byteswapped on big-endian hosts; width 3 via `int.from_bytes`; a partial trailing sample is ignored; empty → 0). `is_probable_no_speech` calls it, and an indentation slip there is corrected. Tests: `LoudnessTests` (the 15 RT-010 synthetic values regenerated with the probe's seed and order, width 3, empty and partial payloads); `StartFailureProcessTests` (AC-007: `sys.executable voice_input_worker.py serve --backend mlx --model-path <missing>` → stdout `""`, one stderr line with the expected prefix, exit 1).
- Changed files or areas: `runtime/voice_input_worker.py`, `tests/test_voice_input_worker.py`.
- Local validation and result:
  - IMP-07: the new tests on the IR-001 worker fail. On 3.11 the process test fails with `3 != 1`, the CRR-001 failure. On 3.14 the module does not import.
  - IMP-08: 16 tests pass on 3.9, 3.11 and 3.14, and the node tests pass.
  - IMP-09: live on both backends, silence and near-silent noise give `noSpeech:true` and the clips are transcribed correctly.
  - IMP-10: all five live start failures write one stderr line and exit 1.
  - IMP-11: in the founder's install, only the `temp/` mtime changed, from the app's own running worker.
- Next recipient or routing: API/E2E (Small + Low, direct route). It retests API-05/05b on the launcher's Python 3.11.
- Remaining limitations or risks: the live venvs here are Python 3.9; the launcher's 3.11 path is proven by the process test, and the real bundle is API/E2E's. `TESTING.md` Setup still mentions `audioop` (API/E2E's document). RSK-001, RSK-002 and FU-001 are unchanged.
