# CRR-027 Resolution Evidence — CR-F-028

## Result

- Source reviewed: `2e9399b214adbfe9d0cc245b256c152b2c0de7e4` (`IR-019`).
- Review decision: `Pass`.
- Finding `CR-F-028`: `Resolved`.
- Applicable premise: `MP-CR-022` remains `Confirmed`.

## Production-Path Trace

The supported operator trigger remains `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. Its current Chinese path is:

`current matrix -> Functional Preflight 2 -> authenticated ranlib alias plus libtool target -> trusted native environment -> closed trusted tool directory -> network-denied package assembler -> Fun-ASR CMake configure -> CMAKE_RANLIB=<verified alias> -> resolved-cache verification -> native build`.

The correction stays inside the approved authenticated-toolchain/package-construction boundary. It does not change providers, models, inputs, thresholds, runtime protocol, evidence decisions, matrix, or release order.

## Source Resolution

- `build/native-tool-identities.mjs` retains the generic canonical regular-file identity owner and adds one specialized Xcode-ranlib identity with `invocationPath`, exact relative `linkTarget: libtool`, canonical `targetPath`, and `targetSha256`.
- Capture authenticates the separately discovered libtool first, then requires `ranlib` to be a symbolic alias.
- Live verification requires:
  - an absolute, parent-canonical `ranlib` invocation path;
  - `*.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ranlib` topology;
  - exact relative target `libtool` in the same directory;
  - realpath equality with the separately authenticated libtool identity;
  - exact target-byte digest.
- `benchmark/darwin-arm64-runner-preflight.mjs` captures the specialized alias after capturing libtool; `darwin-arm64-preflight-contract.mjs` revalidates it for both ordinary and sandboxed consumers.
- `build/trusted-native-environment.mjs` preserves the specialized record, revalidates it, and creates the closed `ranlib` tool entry against the invocation alias. Other tools still use canonical identities.
- `build/resolved-cmake-configuration.mjs` supplies and verifies the exact `ranlib.invocationPath`; the canonical libtool target is no longer accepted as `CMAKE_RANLIB`.
- Both strict schemas declare the specialized shape. Generated preflight/native-environment candidates remain under the approved `Discard or Rebuild` transition; historical API evidence is not rewritten.
- Repository search finds no remaining `ranlib.path` consumer.

## Reviewer Execution

- `node --test tests/build/trusted-native-environment.test.mjs` — Pass, `8/8`, zero skips.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` — Pass: `77/77` top-level Node cases / `84/84` TAP tests, `7/7` Python plus compileall, all Go/source/schema/evidence checks, and exact English-v2 reproduction.
- Focused Prettier and `git diff --check` — Pass.
- Actual-host bounded probe using the current production identity functions:
  - invocation: `/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ranlib`;
  - target: sibling `libtool`;
  - target SHA-256: `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`;
  - alias archive indexing: exit `0`;
  - direct target with the same ranlib-style archive argument: exit `1`, `no output file specified`;
  - `/usr/bin/tar` remains canonically identified as `/usr/bin/bsdtar`.

## Coverage Review

The focused suite proves:

- alias success and direct-target failure;
- exact preflight/native-environment propagation;
- trusted directory binding to the alias;
- explicit CMake alias selection;
- rejection of alias retargeting, target-byte drift, regular-file replacement, trusted-directory drift, and resolved-CMake target-path drift;
- continued generic canonicalization for `tar`.

The source and focused coverage resolve the implementation defect without a fallback or arbitrary-symlink allowance. Actual canonical Chinese construction remains the next API/E2E gate rather than a source-review claim.
