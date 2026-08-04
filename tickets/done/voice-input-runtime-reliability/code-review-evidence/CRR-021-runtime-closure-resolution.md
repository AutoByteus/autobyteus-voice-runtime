# CRR-021 Runtime-Closure Resolution Evidence

## Review Basis

- Authority: `SR-010`, `SR-011`, `ARCH-REV-012 Pass`
- Trigger: `IR-016` against `CRR-020` / `CR-F-024` / `API-REV-008` / `API-F-004`
- Prior source: `24a994a51256f0eef5840ecdc977febec71ea491`
- Correction source: `1d712683c70c338d8bf5074f27c8b0c9da47a8cb`
- Implementation-artifact commit: `71805d0a476458e38a5c19aafb51ded37838269b`

## Source And Ownership Review

- `build/python/runtime-closure.mjs` is the single Python runtime-closure owner. It contains the prior root/build pruning policy plus structural removal of installed-package `test`/`tests` suites and package-local `include` development trees.
- `build/python/materialize-runtime.mjs` delegates pruning to that owner, preserves locked wheel/distribution verification and relocatability checks, and exposes no alternate path.
- `numpy.testing` is retained because the rule matches only complete `test`/`tests` path segments; the focused test and exact materialization both confirm its presence.
- The canonical Go implementation in `packaging/archive/pathpolicy.go` and `packaging/archive/json.go` is unchanged. The added Go file is test-only and invokes the existing `ReadManifest()` owner.
- No literal exception or rename exists for `Transparent Busy.ani` or `C++17.h`; the exact observed paths are present only in the durable regression assertion/fixture.

## Reviewer Execution

1. `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go node --test tests/build/python-runtime-closure.test.mjs tests/build/python-archive-link-normalization.test.mjs`
   - Pass: `11/11` tests including all link-negative subcases.
   - The digest-bound API-REV-008 observation contains exactly `19,003` paths, removes `12,502`, retains `6,501`, removes both reported invalid paths, and is accepted by canonical Go `ReadManifest()`.
2. `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go node tooling/check-go.mjs`
   - Pass across launcher and archive packages.
3. `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check`
   - Pass: `71/71` top-level Node cases, `78/78` TAP tests, `7/7` Python tests plus compileall, all Go/source/schema checks, and exact English-v2 reproduction.
4. Independent fixture inspection:
   - gzip integrity: Pass
   - compressed SHA-256: `bc83abb478a6256cf2112116e66bb19dd310c855e2faffd67baf8e940119a580`
   - uncompressed SHA-256: `5ef013d56d3e2a71a4b20a533c94ae7beb12fdb1874d4e2b24f5861ee7355245`
   - line count: `19,003`
   - retained invalid paths after applying production predicate: `0`
5. Independent exact-input materialization using the retained API-REV-008 authenticated Python archive/wheelhouse and trusted native environment:
   - retained files: `6,476`
   - archive-policy-invalid paths: `0`
   - files beneath installed `test`/`tests`/`include` closure directories: `0`
   - retained `numpy.testing` files: `8`
   - isolated imports of `mlx_whisper`, `mlx.core`, `scipy`, and `numpy.testing`: Pass
6. `git diff --check`: Pass.

## Finding Resolution

- `CR-F-024`: Resolved in source.
- The exact prior failure mechanism is covered through the complete observed path set and the unchanged canonical Go validator.
- The correction is bounded to runtime closure; provider/model/input/threshold, Seatbelt, package grammar, session/protocol, qualification, and release ordering are unchanged.
- Full Provider Archive construction, verification, inference, and qualification remain API/E2E responsibilities and are not claimed here.
