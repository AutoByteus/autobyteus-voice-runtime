#!/usr/bin/env python3
"""Build a deterministic, audio-deduplicated Simplified-Mandarin FLEURS corpus."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def evenly_spaced(values: list[dict], count: int) -> list[dict]:
    if len(values) < count:
        raise ValueError(f"Need {count} rows, found {len(values)}")
    indexes = [round(index * (len(values) - 1) / max(1, count - 1)) for index in range(count)]
    if len(set(indexes)) != count:
        raise ValueError("Deterministic spacing selected a duplicate row index")
    return [values[index] for index in indexes]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--count", type=int, default=200)
    parser.add_argument("--ffmpeg", default="/opt/homebrew/bin/ffmpeg")
    args = parser.parse_args()

    table = pq.read_table(
        args.source,
        columns=["id", "num_samples", "transcription", "raw_transcription", "gender", "audio"],
    ).to_pylist()
    seen_source_audio: set[str] = set()
    groups: dict[int, list[dict]] = {}
    for row_index, row in enumerate(table):
        duration_ms = round(row["num_samples"] / 16)
        if not 3000 <= duration_ms <= 15000:
            continue
        source_audio = row["audio"]["bytes"]
        source_audio_sha = sha256_bytes(source_audio)
        if source_audio_sha in seen_source_audio:
            continue
        seen_source_audio.add(source_audio_sha)
        groups.setdefault(row["gender"], []).append(
            {
                "rowIndex": row_index,
                "sourceId": row["id"],
                "durationMs": duration_ms,
                "reference": row["transcription"],
                "rawReference": row["raw_transcription"],
                "gender": row["gender"],
                "sourceAudio": source_audio,
                "sourceAudioSha256": source_audio_sha,
            }
        )

    ordered_groups = sorted(groups.items())
    quotas = [args.count // len(ordered_groups)] * len(ordered_groups)
    for index in range(args.count % len(ordered_groups)):
        quotas[index] += 1

    selected = []
    for (_, rows), quota in zip(ordered_groups, quotas):
        rows.sort(key=lambda value: (value["sourceId"], value["rowIndex"]))
        selected.extend(evenly_spaced(rows, quota))
    selected.sort(key=lambda value: (value["sourceId"], value["rowIndex"]))

    audio_root = args.output_root / "audio"
    audio_root.mkdir(parents=True, exist_ok=True)
    clips = []
    converted_hashes: set[str] = set()
    for row in selected:
        clip_id = f"fleurs-zh-{row['sourceId']}-r{row['rowIndex']}"
        source_path = audio_root / f".{clip_id}.source"
        destination = audio_root / f"{clip_id}.wav"
        source_path.write_bytes(row["sourceAudio"])
        subprocess.run(
            [
                args.ffmpeg,
                "-nostdin",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(source_path),
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                str(destination),
            ],
            check=True,
        )
        source_path.unlink()
        converted_hash = sha256_file(destination)
        if converted_hash in converted_hashes:
            raise ValueError(f"Converted duplicate audio: {clip_id}")
        converted_hashes.add(converted_hash)
        clips.append(
            {
                "id": clip_id,
                "category": "mandarin",
                "languageMode": "zh",
                "path": f"audio/{destination.name}",
                "durationMs": row["durationMs"],
                "speakerId": f"fleurs-gender-{row['gender']}-unknown-speaker",
                "genderLabel": row["gender"],
                "sourceRowIndex": row["rowIndex"],
                "sourceId": row["sourceId"],
                "reference": row["reference"],
                "rawReference": row["rawReference"],
                "sourceAudioSha256": row["sourceAudioSha256"],
                "sha256": converted_hash,
            }
        )

    corpus = {
        "schemaVersion": 1,
        "corpusId": "fleurs-simplified-mandarin-profile-v2",
        "version": "2",
        "license": {
            "spdx": "CC-BY-4.0",
            "licensedRealSpeech": True,
            "provenanceReference": "https://huggingface.co/datasets/google/fleurs",
            "paperReference": "https://arxiv.org/abs/2205.12446",
        },
        "selection": {
            "sourceSplit": "test",
            "count": args.count,
            "durationRangeMs": [3000, 15000],
            "balance": "equal count per FLEURS gender label, deterministically spread by source ID and parquet row index",
            "deduplication": "source encoded-audio SHA-256 before selection and converted PCM16 WAV SHA-256 after extraction",
            "speakerIdentityLimitation": "FLEURS parquet does not expose speaker identity; gender labels are not speaker IDs.",
            "sourceParquetSha256": sha256_file(args.source),
            "audioProjection": "mono 16 kHz PCM16 WAV supplied identically to every candidate",
        },
        "clips": clips,
    }
    manifest = args.output_root / "corpus.json"
    manifest.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n")
    print(manifest)
    print(f"clips={len(clips)} uniqueAudio={len(converted_hashes)} durationSeconds={sum(c['durationMs'] for c in clips) / 1000:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
