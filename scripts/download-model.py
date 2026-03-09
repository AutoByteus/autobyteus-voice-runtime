#!/usr/bin/env python3
import json
import os
import shutil
import socket
import tarfile
import tempfile
from pathlib import Path


_ORIGINAL_GETADDRINFO = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    # Hugging Face downloads can stall on broken IPv6 paths from some developer machines.
    # Force IPv4 during release packaging so the runtime assets can still be produced deterministically.
    if family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return _ORIGINAL_GETADDRINFO(host, port, family, type, proto, flags)


socket.getaddrinfo = _ipv4_only_getaddrinfo


def load_metadata(metadata_path: Path) -> dict:
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def iter_unique_models(metadata: dict):
    seen: set[str] = set()
    for asset in metadata.get("assets", []):
        model = asset.get("model", {})
        file_name = model.get("fileName")
        if not file_name or file_name in seen:
            continue
        seen.add(file_name)
        yield model


def create_archive(source_dir: Path, output_path: Path) -> None:
    with tarfile.open(output_path, "w:gz") as archive:
        for child in sorted(source_dir.iterdir()):
            archive.add(child, arcname=child.name)


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    metadata_path = Path(os.environ.get("AUTOBYTEUS_VOICE_RUNTIME_METADATA_PATH", project_root / "metadata" / "runtime-assets.json"))
    dist_dir = Path(os.environ.get("AUTOBYTEUS_VOICE_RUNTIME_DIST_DIR", project_root / "dist"))

    metadata = load_metadata(metadata_path)
    dist_dir.mkdir(parents=True, exist_ok=True)

    try:
        from huggingface_hub import snapshot_download  # type: ignore
    except ImportError as error:
        raise SystemExit(f"Missing dependency: {error}. Install huggingface_hub before downloading models.")

    for model in iter_unique_models(metadata):
        repo_id = model["sourceRepo"]
        output_path = dist_dir / model["fileName"]
        allow_patterns = model.get("allowPatterns")
        revision = model.get("sourceRevision")

        with tempfile.TemporaryDirectory(prefix="voice-input-model-") as temp_dir_name:
            temp_dir = Path(temp_dir_name)
            download_dir = temp_dir / "model"
            print(f"Downloading {repo_id}...")
            snapshot_download(
                repo_id=repo_id,
                local_dir=download_dir,
                local_dir_use_symlinks=False,
                allow_patterns=allow_patterns,
                revision=revision,
            )

            shutil.rmtree(download_dir / ".cache", ignore_errors=True)
            create_archive(download_dir, output_path)
            print(f"Downloaded {repo_id} to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
