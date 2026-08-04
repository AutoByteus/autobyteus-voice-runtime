# CRR-031 Resolution Evidence — CR-F-030

## Result

- Source reviewed: `57efa584b34f2b9a5eaba012c01f7e05228dffed` (`IR-021`).
- Implementation artifact / current HEAD reviewed: `d5ba393aa95ce72843627cabc4b058b21128d3a7`.
- Review decision: `Pass`.
- Finding `CR-F-030`: `Resolved`.
- Applicable premise: `MP-CR-024` remains `Confirmed`.

## Production-Path Trace

The independent supported trigger remains `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. Its required current Chinese construction path is:

`current matrix -> Functional Preflight 2 -> authenticated clang and clang++ identities -> strict preflight -> trusted native environment -> exact preflight binding and live verification -> closed cc/c++ tool entries -> explicit/resolved CMake compiler configuration -> network-denied package assembler -> Fun-ASR/locked native build -> final C++ executable link`.

The correction stays inside the approved authenticated toolchain and package-construction boundary. It does not change providers, models, locked inputs, thresholds, runtime protocol, qualification authority, current matrix, or release ordering.

## Source Resolution

- `build/native-tool-identities.mjs` now owns the common internal mechanics for strict Xcode invocation aliases while exporting only command-specific `ranlib -> libtool` and `clang++ -> clang` capture/assertion boundaries. The C++ identity preserves its invocation path, exact relative link target, canonical target path, and target SHA-256.
- The C++ identity is cross-bound to the separately authenticated canonical C compiler. Live verification requires the same selected `*.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin` directory, exact `clang++ -> clang` topology, canonical target, and matching bytes. Retargeting, ordinary-file substitution, another directory, or byte drift fails closed.
- `benchmark/darwin-arm64-runner-preflight.mjs` captures canonical clang before capturing the specialized clang++ identity. `darwin-arm64-preflight-contract.mjs` revalidates that identity on every authorized preflight consumption.
- Both strict schemas encode the specialized C++ identity rather than treating it as a generic `{path, sha256}` executable.
- `build/trusted-native-environment.mjs` projects and binds the specialized identity to the exact preflight, excludes it from generic executable verification, and revalidates it against the canonical C compiler.
- The closed native tool directory retains canonical clang for `cc` and points `c++` to the verified clang++ invocation. `CMAKE_CXX_COMPILER` and the resolved CMake cache must use the verified invocation path; the canonical clang target is rejected there.
- Existing specialized ranlib identity, exact `/usr/bin/sed` closure, canonical `/usr/bin/tar -> /usr/bin/bsdtar`, cleared overrides, isolated `PATH`, empty external native flags, and Seatbelt boundaries remain unchanged.
- Current preflight/native-environment records are generated and byte-bound for each qualification run under the reviewed discard/rebuild transition. No old-shape compatibility reader, fallback, or dual path was added.

## Reviewer Execution

- `node --test tests/build/trusted-native-environment.test.mjs tests/build/trusted-native-cxx-driver.test.mjs tests/build/trusted-native-sed-closure.test.mjs` — Pass, `11/11`, zero skips.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` — Pass: `80/80` top-level Node cases / `87/87` TAP tests, `7/7` Python plus compileall, all Go/source/schema/evidence checks, and exact English-v2 reproduction.
- Verified Go-root `go test -race ./...`, `go vet ./...`, and `gofmt -l launcher packaging` — Pass.
- API-REV-013 checksum verification — Pass, `20/20`.
- Focused Prettier and `git diff --check` — Pass.
- Actual selected Xcode topology independently matched `clang++ -> clang`; both paths resolved to SHA-256 `d5ba7be6de1bac17bfd018e1591711e69cb94d199a0ba763427c8b2d67c50697`.

## Coverage Review

The focused production-shaped suite:

- compiles and runs a C++ standard-library program through the actual selected clang++ alias and proves the identical canonical clang target fails with the expected C++ runtime-symbol class;
- rejects alias retargeting, changed target bytes, non-symlink topology, and a non-XcodeDefault toolchain directory;
- proves native-environment creation and sandbox-safe consumption bind the specialized C++ identity to the same preflight and canonical C compiler;
- rejects a closed `c++` entry redirected to canonical clang and rejects resolved `CMAKE_CXX_COMPILER` drift to that target;
- retains the ranlib alias, authenticated sed pipeline, exact closed tool set, tar canonicalization, and no-override checks.

The source and focused coverage resolve the deterministic link-driver identity defect without compensating flags or widening executable authority. Actual canonical Chinese package construction remains the next API/E2E gate rather than a source-review claim.
