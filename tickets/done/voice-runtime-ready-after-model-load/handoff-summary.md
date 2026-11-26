# Handoff Summary: voice-runtime-ready-after-model-load (autobyteus-655)

- Status (DR-003): released as **`v0.3.2`** on `release/0.3`, on the founder's word (DEC-007). `v0.3.1` (DR-002) is a tag without a release: its run could not build the darwin bundles on the retired `macos-14` runner, and nothing was published (DEC-011: fix forward). See the release record at the end of this summary.
- Classification: `task_size=Small`, `architectural_risk=Low`, direct route. Test-code review Not Required. Code review CRR-001 classified round 1's failure as Design Impact, which SR-002/IR-002 fixed. API/E2E API-REV-002 Pass, 95.5%.

## What Changed

- The 0.3.x worker writes `ready` only after its backend has loaded the model and run one warm-up transcription (`050cca1`). The first dictation after `ready` is fast: MLX 182–187 ms through the real desktop caller, against 23.4 s on 0.3.0.
- A failed start writes no `ready`, exactly one stderr line naming the backend and the cause, and exits 1. The desktop shows that line as the error (`050cca1`, `18f9e12`).
  - Covered: missing or corrupt model; MLX without `ffmpeg`.
  - The silence check no longer uses `audioop` (deprecated in 3.11, removed in 3.13). Its warning had added two stderr lines on the launcher's Python 3.11 (round 1's AC-004 failure), and the worker now imports on 3.13+ (FU-002 resolved).
- Protocol and `prepare` are unchanged. `scripts/build-runtime.sh` defaults to 0.3.1.
- New project docs: `DESIGN.md` and `TESTING.md` (ticket), `RELEASE.md` (delivery).

## Integration

- Base `v0.3.0` (a tag; it cannot advance). `release/0.3` did not exist; delivery created it from `v0.3.0` with the ticket merge (DEC-005). No rerun needed.

## Verification (audit of the evidence)

- AC-001, AC-007:
  - `API-01-unit-and-node-tests-r2.log`: `Ran 16 tests` `OK` on Python 3.9.6, 3.11.14 and 3.14.2; node `# pass 2`.
  - `API-02-verify-job-fresh-clone-r2.log`: the same from a clean clone.
- AC-002 (`API-03-mlx-bundle-caller-r2.jsonl`): the real darwin-arm64 bundle through the desktop's `VoiceInputRuntimeService`.
  - Two starts: the first request completes at 1325 and 1227 ms (it waits for `ready`); `en.wav` 187 and 182 ms with the correct text.
  - Contrast `API-03b`: v0.3.0 `ready` at 193 ms, then `en.wav` 23422 ms.
- AC-003 (`API-04-fw-bundle-caller-r2.jsonl`): faster-whisper first dictation 872 and 715 ms against later 718–738 ms, texts correct.
- AC-004 (`API-05-start-failures-caller-r2.jsonl`, `API-05b-…-r2.log`):
  - each caller error is one line (corrupt MLX, no ffmpeg, corrupt faster-whisper), with 0 worker processes left;
  - launcher 3.11, system 3.9 and Homebrew 3.14 all give exit 1, stdout 0, stderr 1.
- AC-005: silence and quiet noise give `noSpeech:true` in both bundles; reply shapes unchanged.
- Safety (API-06): the founder's install has 20070 entries before and after. Only `temp/` mtime changed, written by his own running app.
- Accepted unverified risk **DEC-006**: faster-whisper bundles for Linux, Windows and Intel Mac were not run. The same Python code and pinned library were proven on macOS arm64 CPU, plus the workflow's ubuntu unit tests.
- AC-006 (release): not done. It is the founder's decision. Its alternate, "without the founder's word: nothing tagged", holds.
- No user check is needed for the change itself.

## Release

- None yet. On the founder's word: tag `v0.3.1` on `release/0.3`, watch the workflow (5 assets, manifest naming 0.3.1), and repeat the AC-002 run on the released darwin-arm64 bundle (`RELEASE.md`).
- The desktop pins `v0.3.0`. 0.3.1 reaches users through the autobyteus-516 extension, which pins it.

## Follow-ups

- FU-001 (MLX needs `ffmpeg`) is open, for the Solution Designer to send. FU-002 is resolved here.

## Round 3 (DR-003): release workflow fix and `v0.3.2`

- The fix (`100e5a0`, SR-003, IR-003):
  - darwin arm64, darwin x64 and linux x64 bundles build on `ubuntu-latest`; win32 builds on `windows-latest` (DEC-012).
  - A push to `release/**`, or a dispatch without `publish`, builds and tests without publishing; only a `v*` tag or `publish=true` publishes (DEC-013).
- AC-008, audited:
  - Dispatched build-only run 45825122803 on `19f8ad2`: all four builds and verify succeeded, publish skipped, releases and tags unchanged (`API-08-dispatch-build-only.log`; GitHub shows `success`).
  - The bundles match v0.3.0's 7 entries and modes except the worker (`API-09-artifacts-vs-v0.3.0.jsonl`); worker sha256 `1249f8ee…` (win32 CRLF `fb587acf…`); the win32 `.cmd` keeps CRLF.
  - The second AC-008 run, the push of the merge to `release/0.3`, is in the release record below.
- AC-001…AC-005 and AC-007 still hold: `runtime/` and `tests/` are unchanged since `18f9e12`.
