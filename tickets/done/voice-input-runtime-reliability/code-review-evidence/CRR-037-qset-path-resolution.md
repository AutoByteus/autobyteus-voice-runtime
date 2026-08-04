# CRR-037 Qualification Set Path-Policy Resolution Evidence

## Review Identity

- Entry point: `Implementation Review`
- Trigger: `IR-024`, resolving `CR-F-034` / `API-F-014`
- Retained product source and runner commit: `32829080938911f0f46390a3fd2af823e105bd32`
- Reviewed verifier/test correction: `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`
- Implementation artifact commit: `3916b0646f5a5d487a066057d35f34a651a58f46`
- Retained API/E2E evidence commit: `34c45617284de7890fd7a398fb3c13d215bdb08c`

## Scope And Ownership

The correction commit changes exactly:

1. `release/evidence/bindings.mjs`
2. `tests/release/build-input-path-contract.test.mjs`

No package, builder, runner, matrix, schema, scoring, resource policy, provider, runtime, source input, profile artifact, archive, or retained API/E2E evidence byte changes between retained source `328290809...` and correction `5c8afe4...` outside those two verifier/test files and the separately committed ticket evidence.

`verifyBuildBinding()` retains its manifest schema-version, nonempty-list, lowercase SHA-256, safe-integer-size, and logical-mode checks. It now delegates the complete path set to the existing canonical Build Input Path 1 owner, `assertBuildInputPathSet()`. The obsolete aggregate-only `/^[A-Za-z0-9._/-]+$/` policy is absent; no replacement regex or alternate path authority was added.

## Focused Regression Evidence

- Exact API-REV-016 Chinese manifest SHA-256: `f7bfb8f17fdf52c76d036c082690bda5d488118f491add5793b9e6b6becc2478`.
- Exact record count: `3,152`.
- The regression requires the exact ten authenticated paths containing approved `()`, `[]`, or `+` syntax and passes them through the production aggregate binding.
- Negative coverage preserves traversal, exact-duplicate, case-collision, digest, non-integer-size, and invalid-mode rejection.
- Reviewer focused execution: `6/6` Pass.
- Reviewer full pinned-Go `npm run check`: `111/111` Node TAP, `7/7` Python plus compileall, all Go/source/schema/evidence checks Pass.
- `api-rev-016/SHA256SUMS.txt`: every listed file Pass.
- `git diff --check 34c456...5c8afe4`: Pass.

## Aggregate Composition Probe

The reviewer ran the corrected production `release/evidence/qualification-set.mjs` against the retained immutable API-REV-016 `qualifications` and `assets` directories with honest three-commit identity:

- `sourceCommit`: `32829080938911f0f46390a3fd2af823e105bd32`
- `runnerCommit`: `32829080938911f0f46390a3fd2af823e105bd32`
- `testCommit`: `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`

Result:

- English independent verification: `pass`
- Chinese independent verification: `pass`
- Qualification Set functional decision: `pass`
- Qualification Set performance assessment: `loaded-host-observation`
- Output: `/private/tmp/crr037-qualification-set-v2-20260804.json`
- Output SHA-256: `c5eaedef8b4790f0f267ac378eba033319091ebc3a4ef29ddd931c1f123b0003`

This probe validates the source correction and the CRR-036 evidence-reuse mechanics. It does not replace API/E2E's required durable aggregate rerun or independently verified Branch Catalog Projection 2.

## Conclusion

`CR-F-034` is resolved in source. The aggregate verifier now consumes the one canonical Build Input Path 1 authority, retains record-level integrity checks, accepts the exact immutable Chinese closure, and fails closed for unsafe paths and invalid records. The unchanged API-REV-016 profile evidence remains eligible for the previously approved aggregate-only recheck with source/runner `328290809...` and test commit `5c8afe4...`.
