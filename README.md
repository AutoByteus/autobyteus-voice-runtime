# AutoByteus Voice Input Runtime

This repository builds two relocatable **runtime host** archives for macOS Apple
Silicon. A host contains the public launcher, model manager, provider engine,
and pinned runtime dependencies. Model weights are separate, on-demand assets;
they are never bundled in the host archive.

The current matrix is `contracts/catalog/current-release-matrix-v2.json`:

- English: MLX Whisper Small FP16.
- Chinese: native Fun-ASR-Nano GGUF Q8.

`auto`, macOS Intel, Linux, Windows, and alternate providers or models are not
supported by this release.

## Install a model profile

Extract the matching host archive without changing its contents. The public
tools are under the extracted `host/bin` directory. Use the release Catalog 4
file to install a profile into an application-owned absolute directory:

```bash
HOST=/absolute/path/to/extracted/host
STORE=/absolute/path/to/application/voice-models
CATALOG=/absolute/path/to/voice-runtime-catalog-v4.json

"$HOST/bin/voice-model-manager" install-profile \
  --profile english --catalog "$CATALOG" --install-root "$STORE"
```

Use `--profile chinese` with the Chinese host. Installation verifies the host
before reading caller-supplied catalog data or contacting the network. It then
validates the catalog, model manifest, compatibility requirement, notices, and
every downloaded file before atomically activating the new installation.
Interrupted downloads use the authenticated partial-download record when the
server still presents the same strong validator. Inference never uses the
network.

The model manager writes canonical JSON Lines progress events to stdout. It has
three operations:

```bash
"$HOST/bin/voice-model-manager" status-profile \
  --profile english --install-root "$STORE"

"$HOST/bin/voice-model-manager" remove-profile \
  --profile english --install-root "$STORE"
```

Removal refuses to delete an installation while a provider process holds its
lifetime lease.

## Start the provider

The caller reads the active pointer and activation record in its installation
store, then writes an absolute `provider-session-config-v2.json` conforming to
`contracts/startup/provider-session-config-v2.schema.json`. That configuration
binds the selected installation and all expected host, model, and compatibility
identities.

```bash
"$HOST/bin/voice-provider" \
  --session-config /absolute/path/to/provider-session-config-v2.json
```

There is one public provider command and no provider, model, language, context,
or fallback flags. The launcher re-verifies the relocated host, snapshots the
active pointer, acquires the installation lease, verifies every model byte, and
rechecks the snapshot before starting the worker with a minimal environment.
It does not use ambient Python, `PYTHONPATH`, the current directory, a system
media decoder, or a fallback model.

Provider stdin/stdout use Protocol 1 canonical JSON Lines. The caller waits for
`hello`, sends `transcribe-file` requests referencing caller-supplied PCM WAV
files, reads one terminal `transcription-result` or `request-error` per request,
and finishes with `shutdown`.

## Build and verify hosts

Node 22.23.1 and the repository-pinned Go 1.26.5 root are required. External
host build inputs are hydrated separately from the network-denied deterministic
assembly step and are authenticated by Host Build Provenance 2.

```bash
npm ci --ignore-scripts

node build/hydrate-host-input-cache.mjs \
  --english build/input-recipes/english-host-darwin-arm64-v2.json \
  --chinese build/input-recipes/chinese-host-darwin-arm64-v2.json \
  --cache /absolute/cache

node build/materialize-release-inputs.mjs \
  --recipe build/input-recipes/english-host-darwin-arm64-v2.json \
  --cache /absolute/cache --repository "$PWD" \
  --destination /absolute/inputs/english \
  --source-commit "$(git rev-parse HEAD)"

node build/host-build-environment.mjs --cmake /absolute/cmake \
  --runner-label focused-darwin-arm64 \
  --output /absolute/host-build-environment-v2.json

VOICE_GO=/absolute/locked/go/bin/go /usr/bin/sandbox-exec \
  -f benchmark/sandbox/darwin-arm64-network-denied-v1.sb \
  "$(command -v node)" build/host-package-assembler.mjs \
  --profile english --target darwin-arm64 \
  --inputs /absolute/inputs/english \
  --output dist/voice-host-english-darwin-arm64-1.0.0.zip \
  --go "$VOICE_GO" \
  --build-environment /absolute/host-build-environment-v2.json \
  --expected-host-source-closure <focused-host-source-closure-sha256> \
  --source-commit "$(git rev-parse HEAD)" --version 1.0.0

VOICE_GO=/absolute/locked/go/bin/go node build/host-package-verifier.mjs \
  --archive dist/voice-host-english-darwin-arm64-1.0.0.zip \
  --go "$VOICE_GO" --output dist/host-verification-v2.json
```

The release workflow performs these builds in its pinned network-denied build
boundary. It publishes exactly nine assets: two host archives, two model
manifests, Catalog 4, `THIRD_PARTY_NOTICES.json`, Pre-Tag Release Manifest 4,
Release Qualification Evidence 4, and `release-SHA256SUMS.txt`. Model Admission
Root 1 is contained in each host archive; it is not a separate published asset.
The release never publishes model weights.

## Implementation checks

```bash
VOICE_GO=/absolute/locked/go/bin/go npm run check
VOICE_GO=/absolute/locked/go/bin/go npm run check:release-pipeline
```

These are source, unit, and contract checks. They do not perform API/E2E model
installation, run providers, execute the qualification corpora, tag, or publish.
