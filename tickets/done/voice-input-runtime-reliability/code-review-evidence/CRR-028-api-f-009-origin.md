# CRR-028 Failure-Origin Evidence — API-F-009

## Decision

- Failure origin: implementation-owned native-build tool-closure defect.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Source under test: `2e9399b214adbfe9d0cc245b256c152b2c0de7e4` (`IR-019`).
- Trigger: `API-REV-012`, `API-F-009`, `API-VOICE-004`, affecting `AC-006`, `AC-017`, and `AC-019`.

## Supported Production Reachability

`MP-CR-023` establishes the independent operational trigger. The supported operator action is `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. The workflow reads the approved current matrix, selects `chinese/darwin-arm64`, performs Functional Preflight 2, materializes the exact closed Chinese inputs, creates the trusted native environment outside Seatbelt, and invokes `build/package-assembler.mjs` inside the pinned deny-network Seatbelt profile. The assembler runs the Fun-ASR native builder, which configures and builds the locked llama.cpp source. That source's normal Metal target executes two bare `sed` commands while producing `ggml-metal-embed.s`. Because the build environment intentionally replaces ambient `PATH` with the closed trusted-tool directory, every bare build command must be present in that authenticated closure. This is the supported current-release qualification path, not a test-created premise.

## Source Trace

1. The exact locked `ggml/src/ggml-metal/CMakeLists.txt` SHA-256 is `e0caad0073256a0cf9f445eb440cf935c569de81fac1af2127b6af5786b1c80d`; lines 45–46 invoke bare `sed` twice to generate the embedded Metal source.
2. `benchmark/darwin-arm64-runner-preflight.mjs:242-260` captures required command identities but omits `/usr/bin/sed`.
3. `contracts/qualification/darwin-arm64-preflight-v2.schema.json:343-401` closes `commandPaths` with `additionalProperties: false`; it neither requires nor permits `/usr/bin/sed`.
4. `build/trusted-native-environment.mjs:208-227` projects `make`, `sh`, and `tar` from preflight but no `sed` identity. Lines 144–162 consequently have no live `sed` verification.
5. `contracts/build/native-build-environment-v1.schema.json:17-45` likewise neither requires nor permits a `tools.sed` identity.
6. `build/native-tool-identities.mjs:129-142` materializes the sole closed trusted-tool directory without a `sed` entry.
7. `build/trusted-native-environment.mjs:176-198` sets `PATH` to only that directory, so the locked CMake command cannot resolve `sed` through any ambient system path.

## Direct Mechanism Evidence

- API-REV-012 directly proves `CR-F-028` resolved: the same canonical build preserves the authenticated ranlib alias, links `libggml-base.a`, and emits `Built target ggml-base`.
- At the next normal build step, the log records `Generate assembly for embedded Metal library`, then `/bin/sh: sed: command not found`, Make error `127`, package-assembler exit `1`, and no archive.
- The API-owned structured audit confirms that the closed directory contains exactly `node`, `cmake`, `cc`, `c++`, `ar`, `ranlib`, `ld`, `libtool`, `make`, `sh`, and `tar`, while both preflight and the native environment omit `sed`.
- The reviewer independently verified the retained locked source lines and digest.
- The actual host `/usr/bin/sed` is a root-owned regular executable at the exact API-recorded SHA-256 `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`; API/E2E correctly did not inject or use it because production had not authenticated it.

## Classification And Prior-Review Gap

The approved contract requires the exact current Chinese package to build offline from closed inputs under an authenticated Apple/native toolchain and deny-network Seatbelt. Adding the exact already-required command to the existing preflight/environment/tool-directory ownership does not alter provider, model, threshold, matrix, runtime protocol, evidence decisions, or release ordering. The origin is therefore a bounded implementation defect, not an environment, test, design, or requirement failure.

This was also a bounded source-review readiness gap. The current locked source visibly invoked bare `sed`, while the implementation visibly set a closed `PATH` whose source list and strict schemas omitted it. CRR-027 verified the corrected ranlib identity path but declared native-build readiness without tracing the exact locked build-command closure far enough to catch this deterministic mismatch. Actual execution was useful confirmation, but it was not required to discover the missing command dependency in source.

## Required Correction Boundary

- Capture exact `/usr/bin/sed` through Functional Preflight 2's existing canonical executable-identity owner and require it in the strict preflight schema.
- Project that identity into the strict native-build-environment record, live-revalidate it through the existing generic trusted executable assertion, and add only the authenticated `sed` entry to the closed trusted-tool directory.
- Keep `PATH` closed. Do not inherit, append, or generically expose `/usr/bin` or another ambient tool directory.
- Preserve the specialized Xcode ranlib alias handling, canonical generic identities such as `/usr/bin/tar -> /usr/bin/bsdtar`, Seatbelt, locked source bytes, and all current provider/model/matrix/threshold behavior.
- Add production-shaped coverage that runs or faithfully exercises the exact locked Metal embedding command with only the closed trusted `PATH`, plus missing/unbound/modified `sed` and trusted-directory drift negatives. The test must prove command closure, not merely that a schema accepts a new field.

After the correction passes source re-review, API/E2E must restart at canonical Chinese construction. It must then complete both current-source Chinese builds/verification/qualification and the required current-source English rerun before Qualification Set 2 and Branch Catalog Projection 2.
