# AutoByteus Voice Runtime

This repository builds the independently executable, local-only Voice Input
provider used by AutoByteus. Runtime contract `1.0.0` is a clean cut from the
historical Python/bootstrap implementation: production packages contain a pinned
Node host, a CommonJS protocol-v1 worker, exact sherpa-onnx native dependencies,
and one separately content-addressed model archive.

## Public provider boundary

Every client runs exactly:

```text
<runtimeRoot>/<hostExecutable> <runtimeRoot>/<entrypoint> --session-config <absolute-config-path>
```

The JSON file must conform to
`startup/provider-session-config-v1.schema.json`. Before the worker writes any
protocol stdout it validates strict arguments and schema, canonical root
containment, descriptor and inner-file digests, the running host and entrypoint,
native package identity, one model identity, capabilities, and language. The
resulting immutable verified session is the only input to `hello` and the
recognizer.

Canonical JSON-Lines protocol schema and fixtures live in `protocol/`. Runtime
manifest schema 3 lives in `metadata/runtime-manifest-v3.schema.json`.
Protocol 0, manifest schema 2, Python launchers, system/Electron hosts, live
package installation, and live model downloads are not production inputs.

## Repository layout

- `host/` and `metadata/runtime-assets.json`: pinned official Node host inputs.
- `runtime/`: session verifier, protocol endpoint, sherpa adapter, WAV gate, and
  deterministic transcript normalizer.
- `startup/` and `protocol/`: canonical schemas and valid/invalid fixtures.
- `metadata/model-candidates.json`: content-addressed SenseVoice improvement and
  hermetic Whisper preservation candidates; a release still selects exactly one.
- `benchmark/`: licensed-corpus contract, exact packaged-provider client,
  historical v0.3 benchmark-only adapter, metrics, and runner.
- `scripts/`: model/runtime construction, package smoke, evidence assembly,
  manifest generation, and release verification.
- `licenses/` and `THIRD_PARTY_NOTICES.md`: redistributed-input notices.

## Local checks

Node `22.23.1` is required for source checks so local behavior matches the pinned
host ABI.

```bash
npm ci --ignore-scripts
npm run check
node scripts/normalization-proof.mjs dist/normalization-proof.json
```

The unit suite includes an exact-command packaged fixture: copied host executable,
contained worker/dependencies/model descriptors, Provider Session Configuration
V1, handshake/readiness, transcription/no-speech, shutdown, and pre-hello failure
categories. It is implementation-scoped evidence, not the all-target release gate.

## Candidate construction

Builds resolve only exact lockfile inputs. They do not tag or publish.

```bash
node scripts/build-model.mjs sensevoice-small-int8-2024-07-17
node scripts/build-runtime.mjs "$(node -p process.platform)" "$(node -p process.arch)"
node scripts/generate-candidate-manifest.mjs "$(node -p process.platform)" "$(node -p process.arch)"
```

`AUTOBYTEUS_MODEL_SOURCE_ARCHIVE_PATH` and
`AUTOBYTEUS_NODE_ARCHIVE_PATH` may point at already-downloaded archives; their
pinned SHA-256 values are still mandatory. Runtime packages must be constructed on
the target operating system/architecture so the actual native package and bundled
host can be proven together.

## Fail-closed benchmark and release gate

A release requires all of the following; source feasibility alone never selects a
model:

- at least 120 licensed real clips / 15 minutes / three speakers / two
  environments under `benchmark/corpus-v1.schema.json`;
- the applicable `AC-009` improvement lane or `AC-016` preservation lane;
- required quality, normalization, latency, RSS, installed-size, reproducibility,
  notice/license, and redistribution-review gates;
- exact packaged handshake, readiness, English, Mandarin, no-speech, malformed
  input, process-loss recovery, and shutdown on darwin-arm64, darwin-x64,
  linux-x64, and win32-x64;
- one selected model only.

`benchmark/run-benchmark.mjs` produces privacy-safe aggregate evidence.
`scripts/assemble-release-evidence.mjs` produces publishable
`evidence/release-evidence.json` only when every gate passes. The checked-in
example is deliberately `blocked` and cannot authorize a manifest.

On a release tag, GitHub Actions rebuilds each target twice, checks byte identity,
executes the real packaged provider, verifies maintained-`main` ancestry, consumes
complete evidence, constructs manifest schema 3, and verifies every released
asset. A manual workflow dispatch performs candidate proof only and does not
publish.
