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
