# API/E2E Execution Coverage Report

## Round

- Coverage investigation: `api-e2e-coverage-investigation.md`
- API/E2E revision record and current revision ID: `api-e2e-revision-record.md`, `API-REV-001`
- Test progress log: `api-e2e-test-progress.md`
- Round and trigger: round 1, implementation IR-001 on the direct route
- Prior round reviewed: N/A
- Deviations from the plan: API-03b (0.3.0 baseline through the same caller), API-04b (faster-whisper first-request
  probe) and API-05b (launcher vs system Python stderr) added to explain observations.
- Evidence folder: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load/tickets/in-progress/voice-runtime-ready-after-model-load/evidence/api-e2e/`

## Routing Classification

- Task size: `Small`; architectural risk: `Low`; input route: `Direct Low-Risk`
- Successful-output route would be `Delivery`; this round's result is `Fail` → failure-origin review.
- Proportional test-code review decision: `Not Applicable` (no durable test change; result Fail)

## Tested Builds And Environments

| Env ID | Commit Tested | Platform | Runtime / Build | Settings That Matter |
| --- | --- | --- | --- | --- |
| ENV-1 | `050cca1` (worktree head `21d4260`, docs only after it) | macOS 26 arm64 | system Python 3.9.6, Homebrew 3.11.14 and 3.14.2, Node 22.23.1 | repository tests |
| ENV-2 | bundles built by `scripts/build-runtime.sh` from a clean clone at `050cca1` (darwin-arm64 sha256 `87fe9b59…`, darwin-x64 `f0ab4fa5…`; worker byte-identical to `050cca1`) | macOS 26 arm64 | launcher-bootstrapped `.venv` on Python 3.11.15 (`~/.local/bin/python3.11`, first on the login PATH), mlx-whisper 0.4.3 / faster-whisper 1.2.1; models APFS-cloned from `/tmp/ab655` | extension roots under `/tmp/ab655-api`; `HOME=/tmp/ab655-api/home`; `HF_HUB_OFFLINE=1` |
| ENV-3 | as ENV-2 | as ENV-2 | the desktop's `voiceInputRuntimeService.ts` (superrepo, last changed `7c08c09a1a`) bundled with esbuild; only `getLoginShellPath` stubbed (the user's login PATH, or `/usr/bin:/bin`) | `probes/build.mjs`, `probes/drive.mjs`, `probes/shellEnvStub.ts` |

## Cases

| Case ID | Criteria | Boundary / Surface | Command Or Steps | Env | Result | Evidence Files | Look For | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-01 | AC-001, AC-004 (unit), AC-005 | unit + node tests | `/usr/bin/python3 -m unittest -v tests/test_voice_input_worker.py`; `node --test tests/*.test.mjs` | ENV-1 | Pass | `API-01-unit-and-node-tests.log` | `Ran 12 tests` `OK`; `# pass 2` `# fail 0` | |
| API-02 | CI gate | the workflow's verify job from a clean clone | clean clone at `050cca1`; `node --test`; `python3.11 -m unittest`; `python3.14 -m unittest` | ENV-1 | Pass | `API-02-verify-job-fresh-clone.log` | 3.11: `Ran 12 tests` `OK`; 3.14: `ModuleNotFoundError: No module named 'audioop'` | The runner (ubuntu-latest, Python 3.12) is covered by 3.11. The 3.14 failure is the worker's `import audioop` (since v0.3.0): FU-002 |
| API-03 | AC-002, AC-005, REQ-001/002, QR-001 | real darwin-arm64 bundle, first install and normal starts, real desktop caller | `probes/drive.mjs` on `/tmp/ab655-api/ext-mlx`: silence (its reply arrives right after `ready`), `en.wav`, `en2.wav`, `en.wav` | ENV-2/3 | Pass | `API-03-bundle-build.log`, `API-03-mlx-bundle-caller.jsonl` | A (first install, launcher bootstrap): silence `"tookMs":85498`, then `en.wav` `"tookMs":227` "Please summarize the meeting notes and send them to the team."; B1: `1502` then `199`; B2: `1376` then `188`; later requests 178–211 ms | One B run first failed in my driver (a stray clip argument, ENOENT before any worker started; recorded in the file) |
| API-03b | contrast | v0.3.0 bundle, same venv, model and caller | `drive.mjs` on `/tmp/ab655-api/ext-mlx-030` | ENV-2/3 | Pass (baseline) | `API-03b-mlx-0.3.0-baseline-same-caller.jsonl` | silence `"tookMs":193`, then `en.wav` `"tookMs":23422` | 0.3.0 says `ready` at once and the first dictation pays the load (cold cloned files) |
| API-04 | AC-003, AC-005 | real darwin-x64 (faster-whisper) bundle on this arm64 Mac, first install and a normal start, real caller | `drive.mjs` on `/tmp/ab655-api/ext-fw` | ENV-2/3 | Pass | `API-04-fw-bundle-caller.jsonl`, `API-04b-fw-vad-first-cost.jsonl`, `API-04b-fw_vad_first_cost.py` | A: silence `28209`, `en.wav` `1805`, later `856`, `1045`; B1: `2284`, `1165`, later `1497`, `1236`; texts correct | In A the first was slower than the later ones. API-04b (4 rounds, fresh processes, CPU load 11–14): the first request's extra work is the VAD model load (`get_vad_model`, `vad_filter=True` only in requests), `vadLoadMs` 29–36; first-vs-later order is noise in both modes (first slowest in 2/4 rounds without preload, 3/4 with). Requests vary 0.7–4.7 s with load |
| API-05 | AC-004, REQ-003 | start failures through the real caller and bundles | `drive.mjs` with a corrupt MLX model; MLX with `AB655_LOGIN_PATH=/usr/bin:/bin`; a corrupt faster-whisper model | ENV-2/3 | **Fail** | `API-05-start-failures-caller.jsonl`, `API-05b-launcher-stderr-lines.log` | caller `error`: `"/tmp/ab655-api/ext-mlx/runtime/voice_input_worker.py:3: DeprecationWarning: 'audioop' is deprecated and slated for removal in Python 3.13\n  import audioop\nVoice Input worker could not start the mlx backend: FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'"`; launcher (Py 3.11): `exit 1, stdout lines 0, stderr lines 3`; same worker on Py 3.9: `stderr lines 1` | Holds: no `ready`, exit 1, no worker left (`worker processes left … 0`), cause named on the last line. Fails: "one stderr line" — the launcher's Python (3.10–3.12 warn about `audioop`) adds two warning lines, and the caller shows them to the user |
| API-06 | safety | the founder's install | read-only `stat` list before API-01 and after API-05; `diff` | ENV-1 | Pass | `API-06-founder-install-unchanged.txt` | 20070 entries; only `…/voice-input/temp` mtime changed (13:07:40 → 13:15:20) | The founder's own app was running its 0.3.0 worker (pid in the file) and writes each dictation clip to `temp/`; nothing here named `~/.autobyteus` |

## Acceptance-Criteria Proof

| AC | Critical | Proven By | Result | Notes |
| --- | --- | --- | --- | --- |
| AC-001 | Yes | API-01, API-02 | Proven | |
| AC-002 | Yes | API-03 (+ API-03b contrast) | Proven | first after `ready` 188–227 ms (< 1,000 ms; target ~0.3 s), texts correct |
| AC-003 | Yes | API-04, API-04b | Proven | first within the noise of later ones; residual first-time cost: the VAD model load, ~30 ms (observation below) |
| AC-004 | Yes | API-01 (unit), API-05, API-05b | **Not Proven (Fail)** | one stderr line only on Python 3.9; on the Python the launcher picks when present (3.11 here; 3.10–3.12 the same) the caller shows three lines |
| AC-005 | Yes | API-01, API-03, API-04 | Proven | silence `noSpeech:true`; reply shapes through the caller; `prepare` untouched (unit) |
| AC-006 | Yes | — | Not Tested here | delivery, on the founder's word |

## Validation Confidence Scorecard

| Category | Post-Repository | Final | Supports | Residual |
| --- | --- | --- | --- | --- |
| Requirement and AC proof | 80% | 70% | API-01…API-05 | AC-004 fails on the real path |
| Changed-boundary directness | 75% | 95% | real bundles, real caller | — |
| Integration realism | 70% | 95% | launcher bootstrap, real libraries, real caller code | login-PATH lookup stubbed (the user's real login PATH supplied) |
| Environment fidelity | 70% | 92% | fresh venv on the launcher's Python, APFS-cloned models | one machine; faster-whisper only on macOS arm64 (RSK-001) |
| Failure and lifecycle | 75% | 70% | three start failures through the caller, no leftover processes | the failure text is not one line |
| User surface | N/A | N/A | no UI in this repository; the caller's error text is covered under failure | — |
| Durable regression coverage | 85% | 80% | unit tests cover start order and failures | they run on one Python and cannot see interpreter warnings |

- Overall final confidence: 84% (simple average of the six applicable categories)
- Every critical AC directly proven: `No` (AC-004)
- Result: `Fail`

## Broader Validation Decision

- Decision: `Required` (executed): the real bundle and the unchanged desktop caller are what users run; the
  implementation ran the worker file on a cloned 3.9 venv only.
- Execution mode: `Lifecycle` (real bundle first install and starts), `Other` (the desktop caller's code in Node).

## Durable Coverage Changed In The Codebase

- None (repository tests unchanged). `TESTING.md` created at the repository root (no testing guideline existed).

## Dependencies Mocked Or Emulated

| Dependency | Method | Why | Limitation |
| --- | --- | --- | --- |
| Electron's login-shell PATH lookup | `shellEnvStub.ts` returns the PATH read once from `/bin/zsh -lc` (the same script), or `/usr/bin:/bin` | the caller runs in Node, not in Electron | the PATH is the user's real login PATH |
| Model download (`prepare`) | models APFS-cloned from the ticket fixtures | unchanged code; 0.5 GB downloads | `prepare` not exercised live |

## Temporary Methods And Cleanup

| Item | Owned | Cleanup | Result |
| --- | --- | --- | --- |
| `/tmp/ab655-api` (clean clone, bundles, extension roots with bootstrapped venvs, caller bundle, HOME) | Yes | kept for the rerun after the fix; removed at the end of validation | Kept (no process running: `pgrep -f /tmp/ab655-api` empty) |
| `/tmp/ab655` implementation fixtures | No (implementation's) | untouched | — |

## Preliminary Classification (On `Fail`)

- `Local Fix`, implementation-owned. REQ-003 and AC-004 are unambiguous ("one-line reason to stderr"; "one stderr line"),
  and DEC-009's own reason ("a failure's stderr is the reason line") covers this warning; its text ("silences exactly
  that warning class … other warnings stay") was written from Python 3.9 runs, where `audioop` does not warn, so the
  Solution Designer may want to widen DEC-009's wording. A bounded fix: keep the `audioop` DeprecationWarning off
  stderr before the import (it is raised at module import, line 3, before `start_backend`'s filter), or stop using
  `audioop` (FU-002, which also fixes Python 3.13+). Retest: API-05/API-05b on the launcher's Python and on 3.9.

## Observations (non-blocking)

- faster-whisper's VAD model (`silero_vad_v6.onnx`) loads on the first request (~30 ms), not in the warm-up
  (`vad_filter=False`, chosen so the tone reaches the decoder). Below the transcription noise; a call to
  `faster_whisper.vad.get_vad_model()` in `load` would move it before `ready`.
- `ready` with the launcher's first-install bootstrap: 85.5 s (MLX) and 28.2 s (faster-whisper) — mostly pip; callers
  wait without a timeout (ASM-001).

## Latest Authoritative Result

- Result: `Fail`
- Criteria not proven: AC-004 (AC-006 is delivery's)
- Preliminary classification and recommended owner: `Local Fix`, implementation engineer (via failure-origin review)
- Next recipient: code reviewer (failure-origin review), per the handoff rules
- Follow-ups added: FU-002 (Python 3.13+: `audioop` removed; launcher Python choice)
