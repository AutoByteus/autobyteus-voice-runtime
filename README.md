# AutoByteus Voice Input Runtime

This repository builds independently executable, immutable Voice Input provider packages for a later desktop integration ticket. It does **not** install or activate a desktop runtime.

## Runtime boundary

Every catalog entry is a Provider Archive 1 canonical ZIP containing one language-profile package and one target-native Go launcher:

```text
<extracted-package>/bin/voice-provider[.exe] --session-config <absolute-config-path>
```

The public command has no provider, model, language, host, decoding, context, or fallback flags. The launcher derives its relocated package root, validates the strict session/config/control identity, creates a minimal private environment, and starts exactly the embedded Python or native worker plan. The worker emits Protocol 1 JSON lines only after binding identity; `inference-ready` follows full package verification and real recognizer construction.

The current release is **macOS Apple Silicon only**. Its sole current matrix is
`contracts/catalog/current-release-matrix-v1.json` and contains exactly:

- English / darwin-arm64: hermetic CPython + MLX Whisper Small FP16.
- Chinese / darwin-arm64: native Fun-ASR-Nano GGUF Q8.

`auto`, macOS Intel, Linux, and Windows are not supported, qualified,
cataloged, or published by this release. Generic target-capable implementation
source is retained only for a future reviewed matrix expansion. Catalog absence
means unsupported; it is never permission to infer or synthesize a package.

There is no Node provider, system Python, live package/model download, external media decoder, shell launcher, legacy protocol, or model fallback in the production tree.

## Local implementation checks

Node 22.23.1 and the pinned Go 1.26.5 toolchain are required.

```bash
npm ci --ignore-scripts
VOICE_GO=/absolute/path/to/locked/go/root/bin/go npm test
npm run check:python
VOICE_GO=/absolute/path/to/locked/go/root/bin/go npm run check:go
npm run check:js
```

These are source/unit/contract checks only. They do not replace actual-target package qualification.

## Package build and verification

Builders are offline/fail-closed. `--inputs` must be produced by
`build/materialize-release-inputs.mjs` from one of the two current recipes. The
materializer verifies SHA-addressed cache objects, exact clean Git trees, and
repository files before creating a fresh `SHA256SUMS.json`-closed tree plus
`input-provenance-v1.json`. Acquisition is separate and is never attempted by
the materializer or package builder.

- Python packages accept the repository-locked Python Build Standalone archive, the exact target wheelhouse in `build/python-wheel-locks/<target>.json`, model files, and notices. The builder extracts and materializes Python itself; an operator-supplied `python-root` or origin marker is not accepted.
- Native packages require clean Git worktrees at the exact Fun-ASR, llama.cpp, and utf8proc commits in the provider lock, plus exact model files and notices. Modified, untracked, ignored, or marker-only source trees fail.
- `VOICE_GO` must identify `bin/go[.exe]` inside the complete extracted official root. Every file and directory in that root must match the target's repository-owned full-root manifest under `build/go-toolchain-manifests/`; an exact front binary with missing, added, stale, or modified compiler/linker/standard-library siblings fails.
- All Go subprocesses derive `GOROOT` from that verified `VOICE_GO` root, disable environment configuration, external cache programs, and automatic toolchain selection, and set the target through one internal/Node/Go tuple map. Inherited `GOROOT`, `GOTOOLCHAIN`, `GOTOOLDIR`, `GOCACHEPROG`, `GOENV`, `GOFLAGS`, `GOEXPERIMENT`, target, CGO, or external-tool overrides are rejected rather than trusted.
- Every build report binds the repository lock set in addition to the closed external input manifest.
- Package assembly consumes a passing `darwin-arm64-preflight-v2.json` and creates one `native-build-environment-v1.json` owner. It rejects inherited compiler/linker/CMake/SDK selectors and flags before builder invocation; pins the exact preflight-authenticated Node, CMake, Apple compiler/linker/archive tools, Make, shell, tar, and SDK settings; supplies explicit CMake configuration; and records that environment digest in both build reports and the reproducibility proof.
- Configured executable aliases such as the standard Homebrew CMake and macOS tar symlinks are canonicalized once and retain their exact target-byte identity end to end. Preflight identifies execute-only `/usr/bin/sudo` without opening it by binding its root-owned mode/device/inode/size/timestamps and a successful `sudo -V` execution probe, then separately proves the exact noninteractive `/usr/sbin/purge` capability; either identity or capability drift blocks qualification.

```bash
node build/package-assembler.mjs \
  --profile english --target darwin-arm64 \
  --inputs /approved/inputs/english/darwin-arm64 \
  --output dist/voice-english-darwin-arm64-1.0.0.zip \
  --go /approved/go/bin/go --cmake /approved/cmake \
  --preflight /approved/darwin-arm64-preflight-v2.json \
  --source-commit "$(git rev-parse HEAD)" --version 1.0.0

node build/package-verifier.mjs \
  --archive dist/voice-english-darwin-arm64-1.0.0.zip \
  --build-report dist/voice-english-darwin-arm64-1.0.0.zip.build.json \
  --go /approved/go/bin/go --output dist/package-verification.json

# Rebuild the same package in an independent directory, then bind both
# byte-identical archives and build reports into the qualification input.
node build/verify-reproducibility.mjs \
  --first-archive dist/voice-english-darwin-arm64-1.0.0.zip \
  --first-report dist/voice-english-darwin-arm64-1.0.0.zip.build.json \
  --second-archive /independent-build/voice-english-darwin-arm64-1.0.0.zip \
  --second-report /independent-build/voice-english-darwin-arm64-1.0.0.zip.build.json \
  --output dist/reproducibility-proof-v1.json
```

`benchmark/darwin-arm64-runner-preflight.mjs` fail-closes objective M1 Max,
power, pressure, toolchain, Seatbelt, and noninteractive purge
prerequisites before counted work. It captures six CPU-idle samples once and
classifies them as `controlled` or `loaded-host` without blocking functional work. `benchmark/run-profile-qualification.mjs`
then owns the exact 30 filesystem-cold, 30 warm-preparation, and 100 warm-request
sets plus complete corpus, timing, RSS, relocation, no-mutation, and recovery
evidence. Qualification writes immutable functional Summary 2 first, then a non-gating
Performance Assessment 1 that content-binds that Summary. Qualification Set 2
binds both before the independently verified Branch Catalog Projection 2, with no release
tag, URL, maintained-main, or public status.

Product-facing Chinese `normalizedText` remains governed by
`autobyteus-simplified-zh-v1`. Quality comparison instead consumes retained raw
reference and raw hypothesis through the frozen, checksum-bound
`autobyteus-chinese-cer-selection-comparable-v1` scorer. Active Chinese v2 trust
recomputes all 200 historical rows to the unchanged 343/6580 baseline before any
candidate comparison; the unbound v1 baseline is not an active input.

The Current Release Matrix binds one exact Profile Resource Policy. English has
a 2.5 GiB hard process-tree RSS ceiling. Chinese has a 4.0 GiB hard ceiling and
a separate 2.5 GiB Assessment-only optimization target. Summary 2 owns the hard
result; Performance Assessment 1 records optimization status without changing a
passing functional decision. QSet, branch projection, and release evidence carry
the same policy digest instead of restating a global RSS literal.

Every trial is written to `qualification-attempts-v1.json` before provider
work starts and is atomically updated with its outcome. A timeout, process
loss, malformed frame, write failure, or other qualification failure retains
all prior and current attempts, partial raw/performance evidence, and a
non-pass `qualification-summary-v2.json`/Qualification Set 2 result. Workflow
uploads for each profile and the aggregate qualification audit run under
`always()`; no failed trial is retried, excluded, or relabeled as passing.

Delivery independently repeats qualification after integrating maintained
`main`, then builds the acyclic chain: Qualification Set 2 -> Release
Qualification Evidence 2 -> Catalog 3 -> Pre-Tag Release Manifest 2. Publication
uploads exactly the two archives, evidence, catalog, and manifest. Published
byte verification is a separate always-recorded result; a failed result may
delete only the GitHub Release object/assets while preserving the tag.

Qualification uses the repository-owned English-v2 and scoring-bound Chinese-v2
baselines. The
external audio tree must carry a byte-identical copy of the applicable manifest
in `release/evidence/qualification-corpora/`. On the M1 Max reference runner,
every filesystem-cold trial executes the pinned `sudo -n purge` procedure before
process start; the runner account must be pre-authorized for only that
noninteractive command. Raw cold-reset, cold-preparation, warm-preparation, and
warm-request sample sets are preserved and re-verified before release.

Do not tag or publish from ordinary implementation or review work.
