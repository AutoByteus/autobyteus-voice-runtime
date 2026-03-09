# AutoByteus Voice Runtime

This project packages the downloadable `Voice Input` runtime used by the desktop app.

## Responsibilities

- package platform-specific Voice Input worker bundles
- fetch the selected bilingual model assets for release
- generate the runtime manifest consumed by `autobyteus-web`
- publish versioned runtime assets under this repository's own `v*` release lane

## Intended Output

Each runtime release should publish:

- one runtime worker bundle per supported platform and architecture
- one or more model archives for the selected bilingual backends
- one `voice-input-runtime-manifest.json` file with checksums, URLs, backends, and entrypoints

## Suggested Directory Shape

```text
autobyteus-voice-runtime/
  .github/workflows/
  runtime/
  scripts/
  dist/
  metadata/
  tests/
```

## Local Scripts

- `scripts/build-runtime.sh <platform> <arch>`
  - packages the launcher, worker, and backend requirements for one platform asset
  - writes the runtime bundle into `dist/`
- `scripts/download-model.py`
  - downloads the configured Hugging Face model repos into `dist/`
  - packages each model repo as a tarball consumed by the desktop installer
- `scripts/generate-manifest.mjs`
  - computes SHA-256 checksums
  - emits the schema v2 manifest with GitHub release asset URLs

## Current Status

This repository now owns the v2 app-facing runtime release contract:

- macOS Apple Silicon uses an MLX-backed worker (`mlx-whisper`)
- macOS x64, Linux x64, and Windows x64 use `faster-whisper`
- release assets remain GitHub-release-hosted and installable by the Electron extension manager

The remaining proof point is end-to-end validation from the desktop app against a real published runtime release.
