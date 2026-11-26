# API/E2E Test Progress

- Execution coverage report: `api-e2e-execution-coverage-report.md`
- Planned cases: the coverage investigation's Planned Cases

| Time | Case ID | Event | Result | Note |
| --- | --- | --- | --- | --- |
| 2026-11-26 13:08 | API-06 | Started | | read-only stat list of the founder's install (before) |
| 2026-11-26 13:08 | API-01 | Started | | unit + node tests |
| 2026-11-26 13:08 | API-01 | Completed | Pass | Ran 12 OK; node pass 2 |
| 2026-11-26 13:08 | API-02 | Started | | verify job from a clean clone on Python 3.11 and 3.14 |
| 2026-11-26 13:08 | API-02 | Completed | Pass | node pass 2; Python 3.11 Ran 12 OK (runner line); 3.14 cannot import audioop: pre-existing since 0.3.0 -> follow-up |
| 2026-11-26 13:08 | API-03 | Started | | build darwin-arm64 and darwin-x64 bundles from the clean clone |
| 2026-11-26 13:09 | API-03 | Checkpoint | | run A (first install: launcher bootstrap + start) in background |
| 2026-11-26 13:11 | API-03 | Checkpoint | | run A pass: ready 85.5 s incl. bootstrap; first after ready 227 ms; next runs B1/B2 (normal start) and C (0.3.0 baseline, same caller) |
| 2026-11-26 13:12 | API-03 | Completed | Pass | A ready 85.5 s (incl. bootstrap), first 227 ms; B1/B2 ready 1.5/1.4 s, first 199/188 ms; 0.3.0 same caller: ready 193 ms, first 23,422 ms |
| 2026-11-26 13:12 | API-04 | Started | | faster-whisper darwin-x64 bundle first install + normal start (background) |
| 2026-11-26 13:15 | API-04 | Completed | Pass | fw A ready 28.2 s (incl. bootstrap) first 1805 vs later 856/1045; B1 ready 2.3 s first 1165 vs 1497/1236; API-04b: VAD load ~30 ms, first-vs-later differences are load noise in both modes |
| 2026-11-26 13:15 | API-05 | Started | | start failures through the real caller |
| 2026-11-26 13:16 | API-05 | Completed | Fail | no ready, exit 1, no process left, cause named; but on the launcher's Python 3.11 stderr = 3 lines (audioop DeprecationWarning + reason): caller error text not one line (AC-004/REQ-003). Python 3.9: 1 line |
| 2026-11-26 13:16 | API-06 | Completed | Pass | identical |
| 2026-11-26 13:17 | API-06 | Checkpoint | | correction of the row above: not byte-identical; only temp/ mtime changed, by the founder's own running app (its 0.3.0 worker); no command here touched the path |
| 2026-11-26 13:29 | round 2 | Checkpoint | | IR-002 (18f9e12): rerun API-05/05b first, then API-01/02/03B/04B/06 |
| 2026-11-26 13:29 | API-05 | Started | | round 2: start failures through the caller on the launcher's 3.11 |
| 2026-11-26 13:29 | API-05 | Completed | Pass | round 2: 3 failures, each 1 line in the caller's error, exit before ready, no process left |
| 2026-11-26 13:29 | API-05b | Started | | launcher 3.11 / system 3.9 / python3.14 line counts |
| 2026-11-26 13:29 | API-05b | Completed | Pass | 1 stderr line on 3.11 (launcher), 3.9, 3.14 |
| 2026-11-26 13:29 | API-01/API-02 | Started | | unit + node in the worktree; verify job in the clean clone at 18f9e12 |
| 2026-11-26 13:30 | API-01/API-02 | Completed | Pass | 16 OK on 3.9/3.11/3.14; node 2/2; clean clone same |
| 2026-11-26 13:30 | API-03/API-04 | Started | | round 2 normal starts through the caller, MLX and faster-whisper |
| 2026-11-26 13:30 | API-03/API-04 | Completed | Pass | round 2: MLX first 182-187 ms; fw first 715-872 vs later 718-738; silence+quiet noSpeech |
| 2026-11-26 13:30 | API-06 | Completed | Pass | see evidence: only temp/ mtime (founder's app) |
| 2026-11-26 13:31 | round 2 | Completed | Pass | reports written; cleanup next |
| 2026-11-26 14:01 | round 3 | Checkpoint | | IR-003 (100e5a0): API-07 reused IMP-12; API-08 dispatch; API-09 artifact comparison |
| 2026-11-26 14:01 | API-08 | Started | | push ticket branch + dispatch build-only |
| 2026-11-26 14:03 | API-08 | Completed | Pass | run 45825122803 success; 4 builds + verify green; publish skipped; ubuntu-26.04 / windows-2025-vs2026; releases and tags unchanged |
| 2026-11-26 14:03 | API-09 | Started | | artifact comparison vs v0.3.0 |
| 2026-11-26 14:04 | API-09 | Completed | Pass | 7 entries each; only the worker differs; modes same; win32 .cmd CRLF; workers = commit's |
| 2026-11-26 14:04 | round 3 | Completed | Pass | reports written |
