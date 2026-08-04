# CRR-026 Failure-Origin Evidence — API-F-008

## Decision

- Failure origin: implementation-owned source/packaging defect.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Source under test: `8680c6a9693f3b55021c9317e0163281c946ca96`.
- Trigger: `API-REV-011`, `API-F-008`, `API-VOICE-004`, affecting `AC-006`, `AC-017`, and `AC-019`.

## Supported Production Reachability

`MP-CR-022` establishes the independent operational trigger. The supported operator action is the repository's `workflow_dispatch` with `operation=prequalify` in `.github/workflows/release-voice-runtime.yml`. The workflow selects the current two-entry matrix, performs Functional Preflight 2, materializes the exact Chinese closed inputs, creates the trusted native environment outside Seatbelt, and runs `build/package-assembler.mjs` inside the pinned deny-network Seatbelt profile. The Chinese builder configures CMake and then runs its native build. CMake therefore invokes the configured `CMAKE_RANLIB` while creating the required static library. This is the normal current-release qualification path, not a synthetic or downstream-only premise.

## Source Trace

1. `benchmark/darwin-arm64-runner-preflight.mjs:70` obtains the Apple `ranlib` command with `xcrun --find ranlib`.
2. `benchmark/darwin-arm64-runner-preflight.mjs:117,257-263` passes that result through the generic `executableIdentity()` owner.
3. `build/native-tool-identities.mjs:5-10` resolves every executable through `fs.realpath()`, so the Xcode `ranlib -> libtool` alias is replaced by its canonical target path before the identity is persisted.
4. `build/trusted-native-environment.mjs:205-224` copies the already-canonicalized preflight identity into `record.tools.ranlib`; its current identity verifier requires `identity.path` itself to be canonical.
5. `build/resolved-cmake-configuration.mjs:4-22` sets `CMAKE_RANLIB` to `record.tools.ranlib.path`, and lines `25-54` require the resulting cache to preserve that same value.
6. The API-REV-011 native-environment record consequently identifies both `ranlib` and `libtool` as the same canonical `.../usr/bin/libtool` path and SHA-256.

## Direct Mechanism Evidence

- The actual Xcode command selected by `xcrun --find ranlib` is `/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ranlib`.
- That path is a relative symlink to `libtool`; both paths expose target SHA-256 `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`.
- The API-owned focused probe invokes the alias and canonical target with the same ranlib-style archive argument: the alias exits `0`; the target exits `1` with `no output file specified`.
- The reviewer independently reconfirmed the actual `xcrun` result, `ranlib -> libtool` topology, canonical target, and equal target SHA-256 on the same host.
- The canonical Chinese build passed all 3,149 input records and reached `5%` / `Linking CXX static library libggml-base.a`; the configured canonical `libtool` then produced the same error and no archive.

## Classification And Prior-Review Gap

The approved contract requires exact authenticated Apple tool identities and complete offline construction of the current Fun-ASR package. It does not require aliases to be erased, and preserving a verified command's invocation semantics needs no provider, model, threshold, matrix, package, or release-order change. The defect is therefore bounded to the implementation's executable-identity representation and CMake composition.

This was also a bounded source-review gap. The source visibly used one canonical-target-only `{path, sha256}` shape for commands whose invocation name can be semantically significant. Existing CMake coverage constructs `ranlib` as an ordinary regular file and therefore proves only path forwarding, not an authenticated alias-sensitive invocation. Actual host execution was necessary to prove Apple's concrete behavior, but source review should have required production-shaped alias coverage before declaring native construction ready.

## Required Correction Boundary

- Preserve the authenticated invocation path/alias identity separately from the resolved target path and target-byte digest where command-name semantics apply.
- For `ranlib`, pass the verified alias path to `CMAKE_RANLIB`; live verification must prove the alias remains contained in the authenticated Xcode toolchain, still resolves to the expected target, and that the target bytes remain exact.
- Keep canonical target identities for byte authentication and drift detection. Do not replace them with path trust alone.
- Keep resolved-CMake verification aligned with the authenticated invocation path.
- Add production-shaped regression coverage in which an alias and its identical target have different argv[0]/basename behavior, plus retargeted-alias, changed-target-byte, unexpected-link-topology, and resolved-CMake-drift negatives.
- Preserve correct existing handling for other symlinked tools, including `/usr/bin/tar -> bsdtar`; do not weaken the closed tool environment or introduce a system fallback/override.

After the fix passes source re-review, API/E2E must restart at canonical Chinese construction, then complete the remaining current-source Chinese and English qualifications before Qualification Set 2 and Branch Catalog Projection 2.
