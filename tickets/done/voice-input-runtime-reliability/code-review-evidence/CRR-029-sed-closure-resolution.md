# CRR-029 Resolution Evidence — CR-F-029

## Result

- Source reviewed: `eaa0855bf300ee7805048343d4d022a9b625af60` (`IR-020`).
- Review decision: `Pass`.
- Finding `CR-F-029`: `Resolved`.
- Applicable premise: `MP-CR-023` remains `Confirmed`.

## Production-Path Trace

The independent supported trigger remains `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. Its current Chinese construction path is:

`current matrix -> Functional Preflight 2 -> exact /usr/bin/sed identity -> strict preflight -> trusted native environment -> strict environment record/preflight binding -> live identity verification -> closed trusted tool directory -> network-denied package assembler -> Fun-ASR/locked llama.cpp build -> two bare sed Metal transformations`.

The correction stays inside the approved authenticated toolchain/package-construction boundary. It does not change providers, models, inputs, thresholds, runtime protocol, qualification authority, matrix, or release ordering.

## Source Resolution

- `benchmark/darwin-arm64-runner-preflight.mjs` adds exact `/usr/bin/sed` to the existing canonical command-identity capture; no directory entitlement or ambient lookup is introduced.
- `darwin-arm64-preflight-v2.schema.json` requires and strictly types that exact command identity.
- `build/trusted-native-environment.mjs` projects `sed` from the passing preflight, requires it in the strict native-environment record, live-verifies it through the generic canonical `{path, sha256}` owner, and compares the complete record tool map back to the exact preflight.
- `native-build-environment-v1.schema.json` strictly requires the generic `tools.sed` identity.
- `build/native-tool-identities.mjs` adds exactly one `sed` entry to the closed trusted tool directory. `PATH` remains the single generated directory; no `/usr/bin` expansion or fallback exists.
- The specialized Xcode ranlib alias path remains isolated to `ranlib`; `/usr/bin/tar -> /usr/bin/bsdtar` and other generic tools retain canonical regular-file identity.
- Current preflight/native-environment records are per-run generated evidence and remain under `Discard or Rebuild`; there is no compatibility reader or dual schema path.

## Reviewer Execution

- `node --test tests/build/trusted-native-environment.test.mjs tests/build/trusted-native-sed-closure.test.mjs` — Pass, `9/9`, zero skips.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` — Pass: `78/78` top-level Node cases / `85/85` TAP tests, `7/7` Python plus compileall, all Go/source/schema/evidence checks, and exact English-v2 reproduction.
- Focused Prettier and `git diff --check` — Pass.
- Actual `/usr/bin/sed` SHA-256 independently matched `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`.

## Coverage Review

The focused production-shaped suite:

- creates a real passing preflight/native environment with the actual canonical `/usr/bin/sed` identity;
- materializes and verifies the exact 12-entry closed tool directory;
- runs the locked Metal rule's two bare `sed` transformations through only that closed `PATH` and checks exact output;
- rejects missing preflight identity, record/preflight mismatch, missing directory entry, extra unbound entry, modified executable bytes, and a `sed` link redirected to the authenticated tar target;
- retains the exact Seatbelt consumption test, ranlib alias tests, and tar canonicalization checks.

The source and focused coverage resolve the deterministic missing-command defect without weakening the closed environment. Actual canonical Chinese package construction remains the next API/E2E gate rather than a source-review claim.
