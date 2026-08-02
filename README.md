# AutoByteus Voice Input Runtime

This repository builds independently executable, immutable Voice Input provider packages for a later desktop integration ticket. It does **not** install or activate a desktop runtime.

## Runtime boundary

Every catalog entry is a Provider Archive 1 canonical ZIP containing one language-profile package and one target-native Go launcher:

```text
<extracted-package>/bin/voice-provider[.exe] --session-config <absolute-config-path>
```

The public command has no provider, model, language, host, decoding, context, or fallback flags. The launcher derives its relocated package root, validates the strict session/config/control identity, creates a minimal private environment, and starts exactly the embedded Python or native worker plan. The worker emits Protocol 1 JSON lines only after binding identity; `inference-ready` follows full package verification and real recognizer construction.

Approved packages are:

- English / darwin-arm64: hermetic CPython + MLX Whisper Small FP16.
- English / darwin-x64, linux-x64, win32-x64: hermetic CPython + faster-whisper Small INT8.
- Chinese / all four targets: native Fun-ASR-Nano GGUF Q8.
- Auto: omitted unless all separate qualification gates pass.

There is no Node provider, system Python, live package/model download, external media decoder, shell launcher, legacy protocol, or model fallback in the production tree.

## Local implementation checks

Node 22.23.1 and the pinned Go 1.26.5 toolchain are required.

```bash
npm ci --ignore-scripts
VOICE_GO=/absolute/path/to/go npm test
npm run check:python
VOICE_GO=/absolute/path/to/go PATH="$(dirname "$VOICE_GO"):$PATH" npm run check:go
npm run check:js
```

These are source/unit/contract checks only. They do not replace actual-target package qualification.

## Package build and verification

Builders are offline/fail-closed. `--inputs` must be a complete `SHA256SUMS.json`-closed tree containing the exact profile/target host, model, transitive notice inventory, and source inputs described by the provider lock.

```bash
node build/package-assembler.mjs \
  --profile english --target darwin-arm64 \
  --inputs /approved/inputs/english/darwin-arm64 \
  --output dist/voice-english-darwin-arm64-1.0.0.zip \
  --go /approved/go/bin/go --cmake /approved/cmake \
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

`benchmark/run-profile-qualification.mjs` requires that reproducibility proof and owns exact-package corpus, timing, RSS, relocation, no-mutation, and recovery evidence. `release/catalog-builder.mjs` and `release/qualify-release.mjs` recompute the complete eight-package release matrix. The manual workflow has separate `prequalify` and `publish` operations; publication re-verifies a successful pre-tag artifact before creating a tag.

Do not tag or publish from ordinary implementation or review work.
