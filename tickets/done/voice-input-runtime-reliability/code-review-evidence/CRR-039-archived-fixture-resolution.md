# CRR-039 Archived Fixture Resolution Evidence

## Review Identity

- Entry point: `Implementation Review` after Delivery reroute
- Trigger: `DR-003`, finalized-main prequalification run `30881048872`
- Current base: `5531e83421dce859f9934c16e006c34cf5291cde` (`origin/main` at implementation start)
- Preserved finalized release-candidate merge: `a890d22031359f53d94c7c67bf183344fb35d904`
- Reviewed correction: `f5c14ed9e9ad835e33eec20033f625d61d1e0173`
- Implementation artifact commit/current HEAD: `b19f51f8e2ee2ca7ae659edf2c451a02b9a3ac4e`

## Supported Lifecycle And Failure

The governing Delivery lifecycle requires the completed ticket package to move from `tickets/in-progress/voice-input-runtime-reliability` to `tickets/done/voice-input-runtime-reliability` before finalized-main release qualification. The supported release operation then dispatches the checked-in `prequalify` workflow, whose profile jobs execute the repository's full `npm run check` gate before preflight, build, or qualification.

Run `30881048872` exercised that path on finalized-main `a890d220...`. Both profile jobs reached two durable tests that still opened historical fixtures under the pre-archive `tickets/in-progress/...` location and failed with `ENOENT`. The matrix job passed; package/profile work never began; aggregate failed consequentially; no tag, GitHub Release, or published asset was created.

## Correction Scope

Commit `f5c14ed...` changes exactly two literals:

1. `tests/release/build-input-path-contract.test.mjs` resolves the exact API-REV-016 Chinese manifest under `tickets/done/...`.
2. `tests/scoring/chinese-qualification.test.mjs` resolves the exact API-REV-014 Chinese raw results under `tickets/done/...`.

The existing fixture SHA-256 assertions and all path-policy/scoring assertions are unchanged. No `in-progress`/`done` fallback, lifecycle detection, fixture copy, compatibility branch, production source, runtime, provider/model, matrix, workflow, schema, contract, evidence, release behavior, or user state changes.

## Reviewer Verification

- Base ancestry: `5531e834...` is an ancestor of `f5c14ed...`.
- Finalized merge preservation: `a890d220...` is an ancestor of current base `5531e834...`.
- Commit scope: exactly two test files, `2` insertions and `2` deletions.
- Stale path search: no `tickets/in-progress/voice-input-runtime-reliability` reference remains under `tests/`.
- Archived manifest exists and hashes to `f7bfb8f17fdf52c76d036c082690bda5d488118f491add5793b9e6b6becc2478`.
- Archived raw results exist and hash to `5e1281146ebbd46e14ce21ddb1255a611502878e9eb8a4b7e37486a2c82f520f`.
- DR-003 evidence checksums: `failure-summary.md`, `run.json`, and `workflow.log` all Pass.
- Focused changed tests: `9/9` Pass.
- Full pinned-Go `npm run check`: `111/111` Node TAP, `7/7` Python plus compileall, all Go/source/schema/evidence checks Pass.
- Prettier and `git diff --check`: Pass.

## Conclusion

The DR-003 durable-test-path blocker is resolved cleanly. The tests now address the repository's actual archived immutable evidence without changing its bytes, expectations, or production behavior. Applicable API/E2E validation should confirm the archived-checkout source/test gate before Delivery refreshes, integrates, and decides whether to retry prequalification. Historical failure run `30881048872` remains truthful and immutable.
