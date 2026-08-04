# CRR-030 Failure-Origin Evidence — API-F-010

## Decision

- Failure origin: implementation-owned native C++ driver identity/composition defect.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Source under test: `eaa0855bf300ee7805048343d4d022a9b625af60` (`IR-020`).
- Trigger: `API-REV-013`, `API-F-010`, `API-VOICE-004`, affecting `AC-006`, `AC-017`, and `AC-019`.

## Supported Production Reachability

`MP-CR-024` establishes the independent operational trigger. The supported operator action is `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. The workflow selects the required `chinese/darwin-arm64` matrix entry, performs Functional Preflight 2, materializes exact closed inputs, creates the trusted native environment outside Seatbelt, and invokes the package assembler under the pinned deny-network Seatbelt profile. The Fun-ASR builder configures the exact C and C++ compilers and builds the locked native dependency graph. CMake then uses its configured `CMAKE_CXX_COMPILER` as the final C++ executable link driver. This is the normal current-release qualification path, not a test-created premise.

## Source Trace

1. `benchmark/darwin-arm64-runner-preflight.mjs:69-72` separately obtains `clang` and `clang++` from `xcrun`.
2. Lines 117-120 pass both paths through the generic `executableIdentity()` owner. That owner uses `canonicalExecutablePath()`, which resolves the Xcode `clang++ -> clang` alias and records only canonical `clang` plus its bytes.
3. `darwin-arm64-preflight-v2.schema.json:238-248` encodes C as generic identity, C++ as another generic identity, and only ranlib as an alias-sensitive specialized identity.
4. `build/trusted-native-environment.mjs:149-163` live-verifies both compilers generically; lines 209-229 copy the already-canonicalized C++ identity into `record.tools.cxxCompiler`.
5. `native-build-environment-v1.schema.json:35-47` likewise represents `cxxCompiler` only as generic `{path, sha256}`.
6. `build/native-tool-identities.mjs:125-143` preserves `invocationPath` only for `ranlib`; the closed `c++` entry therefore points to canonical `clang`.
7. `build/resolved-cmake-configuration.mjs:4-22` explicitly sets `CMAKE_CXX_COMPILER` to `record.tools.cxxCompiler.path`, and lines 25-55 require the resolved CMake cache to retain that canonical path.

## Direct Mechanism Evidence

- API-REV-013 directly proves `CR-F-029` resolved: fresh actual-M1 preflight captures exact `/usr/bin/sed`; the closed trusted environment executes both locked Metal transformations; the build compiles the native dependency graph.
- The final native link reaches the required C++ executable and fails with unresolved `std::__1`, `std::runtime_error`, `__cxa`, and `__gxx_personality_v0` symbol families; no archive is created.
- Both the exact preflight and native-environment records identify C and C++ as the same canonical Xcode `clang` path and SHA-256 `d5ba7be6de1bac17bfd018e1591711e69cb94d199a0ba763427c8b2d67c50697`.
- Actual Xcode `clang++` is a root-owned relative symlink to same-directory `clang`; the alias and target expose those identical bytes.
- With the exact SDK and identical source/arguments, the API-owned probe shows the `clang++` alias exits `0`, produces a runnable program, and prints `ready`, while canonical `clang` exits `1` with the same C++ runtime-symbol class seen in production.

## Classification And Prior-Review Gap

The approved contract requires exact authenticated Apple compiler identities and complete offline construction of the current Fun-ASR package. The correct C++ driver invocation is part of that existing toolchain contract; it does not change the provider, model, source, flags, threshold, matrix, runtime protocol, or release order. The defect is therefore bounded to implementation-owned executable-identity representation and CMake/tool-directory composition.

This was also a source-review readiness gap. After `CR-F-028` established that canonical target bytes can lose command-name semantics, current source visibly continued to treat Xcode `clang++` as a generic canonical identity and to pass that canonical path as `CMAKE_CXX_COMPILER`. Existing CMake tests use an ordinary `cxxCompiler.path` and assert the lossy value rather than proving a real alias-sensitive C++ link. Actual M1 execution confirmed the consequence, but the identity mismatch and missing production-shaped driver test were statically reviewable in CRR-027 and remained unchanged through CRR-029.

## Required Correction Boundary

- Preserve a strict authenticated Xcode `clang++` invocation identity separately from its canonical `clang` target path and target digest. Cross-bind it to the separately authenticated C compiler target/bytes.
- Require the exact `*.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang++ -> clang` relative-link topology and live-reverify alias, target, and bytes in both authorized consumers.
- Use the verified invocation path for the closed `c++` entry, explicit `CMAKE_CXX_COMPILER`, and resolved-CMake verification. Keep the C compiler on the canonical `clang` identity.
- Reuse or generalize the existing strict Xcode invocation-alias owner where that produces a tighter shared structure, but do not admit arbitrary symlinks or weaken command-specific topology.
- Add production-shaped coverage showing identical alias/target bytes with `clang++` link success and direct `clang` link failure, plus retargeted alias, changed target bytes, non-symlink topology, closed-directory drift, and resolved-CMake target-path drift negatives.
- Do not inject `-lc++`, change external flags, inherit ambient PATH, bypass Seatbelt, or alter locked native source. Those would compensate downstream for the lost driver identity rather than correct its owner.

After the fix passes source re-review, API/E2E must restart at canonical Chinese construction. It must then complete both current-source profiles before Qualification Set 2 and Branch Catalog Projection 2.
