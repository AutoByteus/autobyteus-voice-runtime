#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="${AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR:-$PROJECT_ROOT/dist}"
METADATA_PATH="${AUTOBYTEUS_VOICE_RUNTIME_METADATA_PATH:-$PROJECT_ROOT/metadata/runtime-assets.json}"
WORK_DIR="$PROJECT_ROOT/.work"

PLATFORM="${1:-}"
ARCH="${2:-}"
RUNTIME_VERSION="${AUTOBYTEUS_VOICE_RUNTIME_VERSION:-0.3.0}"

if [[ -z "$PLATFORM" || -z "$ARCH" ]]; then
  echo "Usage: build-runtime.sh <platform> <arch>" >&2
  exit 1
fi

mkdir -p "$DIST_DIR" "$WORK_DIR"

read_asset_json() {
  node - "$METADATA_PATH" "$PLATFORM" "$ARCH" <<'NODE'
const fs = require('fs')

const metadataPath = process.argv[2]
const platform = process.argv[3]
const arch = process.argv[4]
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
const asset = metadata.assets.find((entry) => entry.platform === platform && entry.arch === arch)

if (!asset) {
  console.error(`No runtime asset metadata for ${platform}/${arch}`)
  process.exit(1)
}

process.stdout.write(JSON.stringify(asset))
NODE
}

ASSET_JSON="$(read_asset_json)"
OUTPUT_FILE_NAME="$(node -e "const asset = JSON.parse(process.argv[1]); process.stdout.write(asset.fileName)" "$ASSET_JSON")"
ENTRYPOINT="$(node -e "const asset = JSON.parse(process.argv[1]); process.stdout.write(asset.entrypoint)" "$ASSET_JSON")"
BUILD_DIR="$WORK_DIR/runtime-${PLATFORM}-${ARCH}"
STAGING_DIR="$BUILD_DIR/staging"

rm -rf "$BUILD_DIR"
mkdir -p "$STAGING_DIR/bin"

cp "$PROJECT_ROOT/runtime/voice_input_worker.py" "$STAGING_DIR/voice_input_worker.py"
cp "$PROJECT_ROOT/runtime/run_pip_ipv4.py" "$STAGING_DIR/run_pip_ipv4.py"
cp "$PROJECT_ROOT/runtime/requirements-mlx.txt" "$STAGING_DIR/requirements-mlx.txt"
cp "$PROJECT_ROOT/runtime/requirements-faster-whisper.txt" "$STAGING_DIR/requirements-faster-whisper.txt"

case "$ENTRYPOINT" in
  *.cmd)
    cp "$PROJECT_ROOT/runtime/voice-input-worker.cmd" "$STAGING_DIR/$ENTRYPOINT"
    ;;
  *)
    cp "$PROJECT_ROOT/runtime/voice-input-worker.sh" "$STAGING_DIR/$ENTRYPOINT"
    chmod 755 "$STAGING_DIR/$ENTRYPOINT"
    ;;
esac

echo "Packaging voice runtime"
echo "Platform: $PLATFORM"
echo "Arch: $ARCH"
echo "Runtime version: $RUNTIME_VERSION"
echo "Entrypoint: $ENTRYPOINT"

COPYFILE_DISABLE=1 tar -czf "$DIST_DIR/$OUTPUT_FILE_NAME" -C "$STAGING_DIR" .

echo "Runtime bundle written to:"
echo "  $DIST_DIR/$OUTPUT_FILE_NAME"
