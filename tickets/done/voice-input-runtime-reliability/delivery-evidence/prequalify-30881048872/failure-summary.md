# v1.0.0 Prequalification Attempt 1 Failure Summary

- Workflow run: `30881048872`
- URL: https://github.com/AutoByteus/autobyteus-voice-runtime/actions/runs/30881048872
- Finalized main subject: `a890d22031359f53d94c7c67bf183344fb35d904`
- Result: `failure`; no tag, GitHub Release, or published asset was created.
- Runner: temporary repository-scoped `voice-m1-max-20260804`, GitHub Actions runner `2.336.0`, labels `self-hosted`, `macOS`, `ARM64`, `voice-m1-max`; removed after the failed run.
- Current release matrix: Pass.
- English and Chinese `Verify source and closed toolchain`: Fail because two durable tests still resolve retained evidence beneath `tickets/in-progress/voice-input-runtime-reliability/` after Delivery correctly archived the ticket beneath `tickets/done/voice-input-runtime-reliability/`.
- Exact failing owners: `tests/release/build-input-path-contract.test.mjs` and `tests/scoring/chinese-qualification.test.mjs`.
- Aggregate pre-tag: consequential Fail because no qualified artifacts existed.
- Classification: `Local Fix / durable test path`; route to `implementation_engineer`, then source/test review and affected validation before Delivery retries prequalification.
- Delivery action: fail closed; publication was not dispatched; ticket worktree/branches retained; unrelated maintained-main untracked files preserved.
