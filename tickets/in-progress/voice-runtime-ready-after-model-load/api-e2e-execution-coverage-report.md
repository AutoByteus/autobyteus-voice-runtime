# API/E2E Execution Coverage Report

## Round

- Coverage investigation: `api-e2e-coverage-investigation.md` (round 2 rerun plan included)
- API/E2E revision record and current revision ID: `api-e2e-revision-record.md`, `API-REV-003`
- Test progress log: `api-e2e-test-progress.md`
- Round and trigger: round 3, implementation IR-003 (SR-003: release workflow on current runners, build-only runs; DEC-011…DEC-013, REQ-006, AC-008) after delivery DR-002 (the v0.3.1 tag run cancelled both darwin builds on the retired `macos-14`); worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-release-runner`, branch `codex/voice-runtime-release-runner`. Round 2, implementation IR-002 (SR-002: `audioop` removed, DEC-009 revised, DEC-010, AC-007) answering CRR-001 / API-REV-001 (AC-004 Fail)
- Prior round reviewed: round 2 (API-REV-002, Pass); round 1 (API-REV-001, Fail on AC-004)
- Deviations from the plan: none in rounds 2 and 3
- Evidence folder: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load/tickets/in-progress/voice-runtime-ready-after-model-load/evidence/api-e2e/` (round-2 files end in `-r2`; round 3: `API-08-*`, `API-09-*`)

## Routing Classification

- Task size: `Small`; architectural risk: `Low`; input route: `Direct Low-Risk`; successful-output route: `Delivery`
- Proportional test-code review decision: `Not Required — direct low-risk route` (API/E2E changed no durable tests)

## Tested Builds And Environments

| Env ID | Commit Tested | Platform | Runtime / Build | Settings That Matter |
| --- | --- | --- | --- | --- |
| ENV-1 | round 2: code `18f9e12` (head `1a20726`); round 1: `050cca1` | macOS 26 arm64 | system Python 3.9.6, Homebrew 3.11.14 and 3.14.2, Node 22.23.1 | repository tests |
| ENV-2 | bundles built by `scripts/build-runtime.sh` from a clean clone; round 2 at `18f9e12` (worker sha256 `1249f8ee…` in every test root = the commit's file; no `import audioop`) | macOS 26 arm64 | `.venv` bootstrapped by the launcher in round 1 on Python 3.11.15 (`~/.local/bin/python3.11`, first on the login PATH); mlx-whisper 0.4.3 / faster-whisper 1.2.1; models APFS-cloned from `/tmp/ab655` | extension roots under `/tmp/ab655-api`; round 2 extracted the rebuilt bundle over `runtime/` and kept `.venv` (requirements unchanged); `HOME=/tmp/ab655-api/home`; `HF_HUB_OFFLINE=1` |
| ENV-4 | round 3: workflow fix `100e5a0`, branch head `19f8ad2` | GitHub Actions | `ubuntu-latest` = `ubuntu-26.04` (20261116) for resolve, verify and the darwin/linux builds; `windows-latest` = `windows-2025-vs2026` (20261116) for win32 | dispatched with `runtime_version=0.3.2`, `publish=false`; only the ticket branch pushed; no tag, no release |
| ENV-3 | as ENV-2 | as ENV-2 | the desktop's `voiceInputRuntimeService.ts` (superrepo, last changed `7c08c09a1a`) bundled with esbuild; only `getLoginShellPath` stubbed (the user's login PATH, or `/usr/bin:/bin`) | `probes/build.mjs`, `probes/drive.mjs`, `probes/shellEnvStub.ts` |

## Cases

| Case ID | Criteria | Boundary / Surface | Command Or Steps | Env | Result | Evidence Files | Look For | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-01 | AC-001, AC-004, AC-005, AC-007 | unit (incl. the AC-007 subprocess test) + node tests | `<python> -m unittest -v tests/test_voice_input_worker.py` for `/usr/bin/python3`, `python3.11`, `python3.14`; `node --test tests/*.test.mjs` | ENV-1 (`18f9e12`) | Pass | `API-01-unit-and-node-tests-r2.log` (round 1: `API-01-unit-and-node-tests.log`) | three times `Ran 16 tests` `OK`; `# pass 2` `# fail 0` | AC-007's test runs `[sys.executable, voice_input_worker.py, serve, --backend, mlx, --model-path, <missing>]` and checks stdout, stderr lines and exit code |
| API-02 | CI gate | the workflow's verify job from a clean clone | clean clone at `18f9e12`, `git clean -fdx`; `node --test tests/*.test.mjs`; `python3.11` and `python3.14 -m unittest tests/test_voice_input_worker.py` | ENV-1 | Pass | `API-02-verify-job-fresh-clone-r2.log` (round 1: `API-02-verify-job-fresh-clone.log`) | `# pass 2`; 3.11 and 3.14 `Ran 16 tests` `OK` | Round 1's 3.14 import failure (FU-002) is gone: `audioop` removed (DEC-010) |
| API-03 | AC-002, AC-005, REQ-001/002, QR-001 | real darwin-arm64 bundle through the real desktop caller | `probes/drive.mjs` on `/tmp/ab655-api/ext-mlx`; run A (round 1): first install with the launcher's bootstrap; round 2: two normal starts with silence, quiet noise (±90, rms 52), `en.wav`, `en2.wav`, `en.wav` | ENV-2/3 | Pass | `API-03-mlx-bundle-caller-r2.jsonl`, `API-03-bundle-build-r2.log`; round 1: `API-03-mlx-bundle-caller.jsonl`, `API-03-bundle-build.log` | round 2 B1: silence `1325` (≈ `ready`), quiet `noSpeech true` `2`, `en.wav` `187`, later `177`, `183`; B2: `1227`, `2`, `182`, `174`, `183`; round 1 A: silence `85498` (bootstrap included), `en.wav` `227` | Run A still valid in round 2: launcher and requirements unchanged, and the worker file is not part of the bootstrap. Texts correct |
| API-03b | contrast | v0.3.0 bundle through the same caller | `drive.mjs` on `/tmp/ab655-api/ext-mlx-030` | ENV-2/3 | Pass (baseline) | `API-03b-mlx-0.3.0-baseline-same-caller.jsonl` | silence `193`, then `en.wav` `23422` | 0.3.0 says `ready` at once; the first dictation pays the load |
| API-04 | AC-003, AC-005 | real darwin-x64 (faster-whisper) bundle on this arm64 Mac through the real caller | as API-03 on `/tmp/ab655-api/ext-fw` | ENV-2/3 | Pass | `API-04-fw-bundle-caller-r2.jsonl`; round 1: `API-04-fw-bundle-caller.jsonl`, `API-04b-fw-vad-first-cost.jsonl`, `API-04b-fw_vad_first_cost.py` | round 2 B1: silence `1959`, quiet `noSpeech true`, `en.wav` `872`, later `718`, `723`; B2: `1174`, `715`, `733`, `738`; round 1 A (first install): `28209`, `1805`, `856`, `1045` | First-vs-later differences are machine-load noise (API-04b: 4 rounds of fresh processes; the only first-request work left is the VAD model load, 29–36 ms) |
| API-05 | AC-004, AC-007, REQ-003 | start failures through the real caller and bundles, on the launcher's Python 3.11 | `drive.mjs` with a corrupt MLX model; MLX with `AB655_LOGIN_PATH=/usr/bin:/bin`; a corrupt faster-whisper model | ENV-2/3 | Pass (round 1: Fail) | `API-05-start-failures-caller-r2.jsonl` (round 1: `API-05-start-failures-caller.jsonl`) | each caller `error` is 1 line: `"Voice Input worker could not start the mlx backend: FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'"`, `…mlx backend: RuntimeError: [load_safetensors] Invalid json header length…`, `…faster-whisper backend: RuntimeError: Unsupported model binary version…`; `worker processes left … 0` | Round 1 failed: the `audioop` DeprecationWarning added two lines on 3.11 |
| API-05b | AC-004, AC-007 | the bundle's launcher, and the worker file on other Pythons | missing model folder: `<ext>/runtime/bin/voice-input-worker` (3.11.15); `/usr/bin/python3` (3.9.6); `/opt/homebrew/bin/python3.14` | ENV-2 | Pass (round 1: Fail) | `API-05b-launcher-stderr-lines-r2.log` (round 1: `API-05b-launcher-stderr-lines.log`) | `== launcher-py3.11: exit 1, stdout lines 0, stderr lines 1`; the same for `system-py3.9` and `homebrew-py3.14` | |
| API-07 | REQ-006 (workflow logic) | workflow file | Reused: IMP-12 (actionlint 1.7.11 clean; the resolve step rendered and run for tag push, `release/0.3` push, dispatch with `publish` false/true/empty) | — | Pass | (implementation) | (implementation) | Ran on `100e5a0`, the commit under test |
| API-08 | AC-008, REQ-006 | the release workflow on GitHub | `git push origin HEAD:refs/heads/codex/voice-runtime-release-runner` (started no run: the branch's workflow triggers on `release/**` and `v*` only); `gh workflow run release-voice-runtime.yml -R AutoByteus/autobyteus-voice-runtime --ref codex/voice-runtime-release-runner -f runtime_version=0.3.2 -f publish=false` → run 45825122803; job conclusions; each job's image from its log; releases and remote tags before/after | ENV-4 | Pass | `API-08-dispatch-build-only.log` | `workflow_dispatch codex/voice-runtime-release-runner 19f8ad25… completed success`; `Build darwin arm64 success` … `Verify Runtime Packaging success`; `Publish Voice Runtime Release skipped`; `Image: ubuntu-26.04`, `Image: windows-2025-vs2026`; `Runtime version: 0.3.2` in each build; verify `Ran 16 tests` `OK`; releases after = before (v0.3.0, v0.2.0, v0.1.1); tags after = before | Alternate "a failing build publishes nothing": a job `if:` without a status function implies `success()`; the v0.3.1 tag run 45823708736 shows it on GitHub (darwin builds cancelled, publish skipped). Annotation: actions/checkout@v4 and upload-artifact@v4 target Node 20 and run on Node 24 (deprecation notice, not a failure) |
| API-09 | AC-008 (bundles) | the run's four artifacts vs the v0.3.0 release bundles | `gh run download 45825122803`; `gh release download v0.3.0 -p 'voice-input-runtime-*.tar.gz'`; `python3 -I API-09-compare_bundles.py <v030> <run>`; worker sha256 vs the commit's | — | Pass | `API-09-artifacts-vs-v0.3.0.jsonl`, `API-09-compare_bundles.py` | each bundle `entries 7`, `sameEntryNames true`, the only difference `voice_input_worker.py` (7632 → 10911 bytes; win32 7870 → 11224), modes unchanged (launcher `0o755`, win32 `.cmd` `0o644`, win32 worker `0o755` as in v0.3.0); win32 `bin/voice-input-worker.cmd` `"crlf": true`; unix launchers LF only; workers `1249f8ee…` = the commit's (win32 `fb587acf…` = the commit's with CRLF) | |
| API-06 | safety | the founder's install | read-only `stat` list; round-1 "before" list vs after each round | ENV-1 | Pass | `API-06-founder-install-unchanged-r2.txt`, `API-06-founder-install-unchanged.txt` | 20070 entries; only `…/voice-input/temp` mtime differs | The founder's own app runs its 0.3.0 worker (process line in the files) and writes each dictation clip to `temp/`; no command here named `~/.autobyteus` |

## Acceptance-Criteria Proof

| AC | Critical | Proven By | Result | Notes |
| --- | --- | --- | --- | --- |
| AC-001 | Yes | API-01, API-02 | Proven | |
| AC-002 | Yes | API-03 (+ API-03b) | Proven | first dictation after `ready` 182–227 ms (< 1,000 ms; target ~0.3 s); `ready` after the load (1.2–1.5 s warm; 85.5 s with the first-install bootstrap) |
| AC-003 | Yes | API-04, API-04b | Proven | first within the noise of later ones |
| AC-004 | Yes | API-01, API-05, API-05b | Proven | one stderr line, no `ready`, exit 1 on 3.9, the launcher's 3.11 and 3.14; the caller shows that one line |
| AC-005 | Yes | API-01, API-03, API-04 | Proven | silence and quiet noise `noSpeech:true`; reply shapes through the caller; `prepare` unchanged (unit) |
| AC-007 | Yes | API-01, API-02 (subprocess test on 3.9, 3.11, 3.14), API-05, API-05b, API-03/04 (silence, quiet noise, speech) | Proven | |
| AC-008 | Yes | API-08, API-09 (+ API-07) | Proven (ticket-branch dispatch) | the push of the merge to `release/0.3` (AC-008's second run) is delivery's |
| AC-006 | Yes | — | Not Tested here | delivery, on the founder's word (tag, workflow, the AC-002 run on the released bundle) |

## Validation Confidence Scorecard

| Category | Post-Repository | Final | Supports | Residual |
| --- | --- | --- | --- | --- |
| Requirement and AC proof | 85% | 96% | AC-001…AC-005, AC-007 directly | AC-006 is delivery's |
| Changed-boundary directness | 85% | 96% | real bundles through the unchanged desktop caller | — |
| Integration realism | 80% | 95% | launcher-bootstrapped venv, real libraries, real caller code | login-PATH lookup stubbed with the user's real login PATH |
| Environment fidelity | 80% | 95% | the launcher's Python 3.11 plus 3.9 and 3.14; APFS-cloned real models | one machine; faster-whisper only on macOS arm64 (RSK-001, DEC-006) |
| Failure and lifecycle | 85% | 96% | three start failures through the caller, a missing folder on three Pythons, no leftover processes | — |
| User surface | N/A | N/A | no UI here; the caller's error text is covered above | — |
| Durable regression coverage | 90% | 95% | the subprocess test sees what callers see, on any Python CI runs | CI runs one Python |

- Overall final confidence: 95.5% (simple average of the six applicable categories; round 3 adds AC-008 at the same scores: the workflow ran on GitHub itself, the only surface that proves it)
- Every critical AC directly proven (AC-006 is delivery's, after the founder's word): `Yes`
- Any final category below 90%: `No`
- 95% target met: `Yes`

## Broader Validation Decision

- Decision: `Required` (executed): real bundles through the desktop's unchanged `VoiceInputRuntimeService`, on the
  Python the launcher bootstraps.
- Execution mode: `Lifecycle` (bundle first install and starts) and `Other` (the desktop caller's code in Node).

## Compatibility / Legacy Scope Check

- No compatibility path: `audioop` removed, not shimmed; `pcm_rms` gives the same values (P5, unit).

## Durable Coverage Changed In The Codebase

- Repository tests: none changed by API/E2E (the implementation added the AC-007 subprocess test).
- `TESTING.md` (created in round 1, `1ce4ab6`; updated in round 2): Setup and layers no longer mention `audioop`; worker
  tests on 3.9, 3.11 and the newest Python.

## Dependencies Mocked Or Emulated

| Dependency | Method | Why | Limitation |
| --- | --- | --- | --- |
| Electron's login-shell PATH lookup | `shellEnvStub.ts` returns the PATH read once with the caller's own zsh script, or `/usr/bin:/bin` | the caller runs in Node | — |
| Model download (`prepare`) | models APFS-cloned from the ticket fixtures | unchanged code; 0.5 GB downloads | `prepare` not exercised live |

## Temporary Methods And Cleanup

| Item | Owned | Cleanup | Result |
| --- | --- | --- | --- |
| `/tmp/ab655-api` (clean clone, bundles, extension roots with venvs, caller bundle, HOME) | Yes | removed after round 2 | Done |
| Round 3: the pushed ticket branch `codex/voice-runtime-release-runner`; run 45825122803 and its artifacts on GitHub; `/tmp/ab655-api9*` | Yes | branch kept for delivery's merge (delivery deletes it at cleanup); local downloads removed | Done |
| `/tmp/ab655` implementation fixtures | No | untouched | — |
| Worker processes | Yes | `stopWorkerIfRunning` per run; `pgrep -f /tmp/ab655-api` = 0 | Done |

## Observations (non-blocking)

- faster-whisper's VAD model loads on the first request (~30 ms), not in the warm-up (`vad_filter=False`). Below the
  noise; calling `faster_whisper.vad.get_vad_model()` in `load` would move it before `ready`.
- `ready` with the launcher's first-install bootstrap: 85.5 s (MLX), 28.2 s (faster-whisper), mostly pip; callers
  wait without a timeout (ASM-001).

## Latest Authoritative Result

- Result: `Pass`
- Criteria not proven or user-only: none (AC-006 is delivery's, on the founder's word)
- Next recipient: delivery engineer (direct low-risk route): merge to `release/0.3` (its push runs the build-only workflow: AC-008's second run), then AC-006 (tag `v0.3.2`)
- Follow-ups: FU-001 (MLX needs ffmpeg) open; FU-002 resolved in this ticket (SR-002)
