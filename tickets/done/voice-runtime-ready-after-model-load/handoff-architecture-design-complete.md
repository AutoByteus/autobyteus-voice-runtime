# Handoff — Architecture Design Complete (autobyteus-655, SR-003)

## Result

- Classification: `Architecture Design Complete`; `task_size` `Small`, `architectural_risk` `Low` (design spec).
- Route: direct implementation (`/implementation_engineer`), per the handoff rule for Small/Medium and Low.

## SR-003 (after delivery DR-002): the release workflow

- **What happened:** on the founder's word ("Of course publish without any doubts"), delivery pushed tag `v0.3.1` (`b1e14ab`). Run 45823708736 cancelled both darwin builds: the workflow pins `runs-on: macos-14`, which GitHub retired on 2026-11-02. Publishing was skipped, so there is no release. Nothing had run the workflow before the tag (RT-012).
- **Decisions:**
  - DEC-011: release the fix as `v0.3.2`. `v0.3.1` stays as it is: never moved, no release.
  - DEC-012: the darwin and linux bundles build on `ubuntu-latest`, win32 on `windows-latest`. Packaging is copy plus `tar`; the 0.3.0 darwin bundles equal the linux bundle, and the win32 launcher's CRLF comes from the Windows checkout (RT-013).
  - DEC-013: build-only runs on every push to `release/**` and on a dispatch with `publish` false; publishing only for a `v*` tag or a dispatch with `publish` true.
- **To do (design spec: "Release workflow (SR-003)" and Change Sequence step 6):**
  1. Change `.github/workflows/release-voice-runtime.yml`: triggers, resolve outputs (`publish`; branch-push version `0.0.0-ci.<sha12>`), the publish job's `if`, the runner labels. Nothing else changes.
  2. Change `scripts/build-runtime.sh`'s default version to 0.3.2.
  3. Lint or parse the YAML; run the repository tests.
- **Proof (AC-008, API/E2E):** push the ticket branch, then dispatch the workflow from it with `runtime_version` 0.3.2 and `publish` false. Expected: four builds and verify green, publish skipped, no release or tag created. Compare the artifacts with the `v0.3.0` bundles: entries, sizes and modes; win32 keeps CRLF.
- **Delivery afterwards:**
  - merge into `release/0.3` and wait for that push run to be green;
  - tag `v0.3.2` and run AC-006;
  - add the pre-tag step to RELEASE.md (its document).
- **Unchanged:** the worker and its validation (API-REV-002, DR-001). `DESIGN.md` gains the Release update and DC-002.

## SR-002 (after code review CRR-001): what changes for implementation

- **Cause:** DEC-009 was checked on Python 3.9 only. On the launcher's Python 3.11 the worker's own `import audioop` prints a 2-line `DeprecationWarning`, so a failed start writes 3 stderr lines (AC-004 failed, API-05/05b). `audioop` is also gone in Python 3.13 (FU-002).
- **Decision (DEC-010):** remove `audioop`, instead of filtering its warning. Its only use is the silence check's loudness (`audioop.rms`); a standard-library version (`array` + `math`) gives identical numbers on real recordings and edge cases (RT-010, `evidence/P5-rms-equivalence.txt`: 0 of 17 differ, widths 1/2/4, threshold 119/120). The `urllib3` filter stays (third-party noise only).
- **To do (design spec, Change Sequence 4a and Concrete Examples):**
  1. Replace `audioop.rms` with a loudness function (widths 1–4; width 3 via `int.from_bytes`; empty → 0) and drop `import audioop`.
  2. Unit-test the function against the RT-010 values.
  3. Add a subprocess test (AC-007) that runs `voice_input_worker.py serve --backend mlx --model-path <missing>` with `sys.executable`, exactly as the launcher does. It asserts no stdout, exactly one stderr line starting `Voice Input worker could not start the mlx backend:`, and exit 1. It is the local check that would have caught CRR-001.
- **Retest afterwards (API/E2E):** API-05 and API-05b on the launcher's Python 3.11 and on 3.9 (fixtures kept in `/tmp/ab655-api`); silence answers unchanged.
- **Also:** `DESIGN.md` gains design case DC-001; FU-002 is marked resolved in this ticket.

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
- SR-003 worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-release-runner`, branch `codex/voice-runtime-release-runner`, base `origin/release/0.3` at `8d154d9`; finalization target `release/0.3`. (SR-001/002 worked in `voice-runtime-ready-after-model-load`, removed at DR-001.)
- Earlier: worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`, branch `codex/voice-runtime-ready-after-model-load`, base tag `v0.3.0` (`251eab8`).
- Finalization target: a maintenance branch `release/0.3`, created from `v0.3.0` at delivery; `v0.3.1` is tagged there only on the founder's word (DEC-005, DEC-007). `main` is not touched.
- The repository has no `TESTING.md` or `RELEASE.md`; under the team rules API/E2E and delivery create them when they first need them.

## Open Risks

- RSK-001: Linux, Windows and Intel-Mac faster-whisper bundles are not run live; covered by the same Python code on macOS arm64 CPU and the workflow's ubuntu unit tests (DEC-006).
- RSK-002: the loaded model's memory (~850 MB on MLX) is held from start; callers choose when to start.

## Handoff Route Record

- SR-001: rules read 2026-11-26; matching rule: Architecture Design Complete, Small/Medium and Low → `/implementation_engineer`.
- SR-002: after code review CRR-001 (Design Impact on DEC-009), same rule → `/implementation_engineer`.
- SR-003: after delivery DR-002 (blocked release), Small/Low, same rule → `/implementation_engineer`.
