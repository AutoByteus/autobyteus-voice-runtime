#!/usr/bin/env python3
"""Extract a deterministic balanced FLEURS subset into shared PCM16 WAV files."""

import hashlib
import json
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path("/tmp/autobyteus-voice-backend-study-20260802")
SOURCE_ROOT = ROOT / "assets/fleurs"
OUTPUT_ROOT = ROOT / "corpus/fleurs-controlled-v1"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def choose(rows: list[dict], count: int) -> list[dict]:
    eligible = [row for row in rows if 3 <= row["num_samples"] / 16000 <= 15]
    by_gender = {}
    for row in eligible:
        by_gender.setdefault(row["gender"], []).append(row)
    selected = []
    groups = sorted(by_gender.items(), key=lambda value: value[0])
    quotas = [count // len(groups)] * len(groups)
    for index in range(count % len(groups)):
        quotas[index] += 1
    for (_, group), quota in zip(groups, quotas):
        group.sort(key=lambda value: value["id"])
        # Spread deterministically through the complete test split instead of using a prefix.
        indexes = [round(index * (len(group) - 1) / max(1, quota - 1)) for index in range(quota)]
        selected.extend(group[index] for index in indexes)
    return sorted(selected, key=lambda value: value["id"])


def extract(source: Path, language_mode: str, category: str, count: int) -> list[dict]:
    metadata = pq.read_table(
        source,
        columns=["id", "num_samples", "transcription", "raw_transcription", "gender", "language"],
    ).to_pylist()
    selected = choose(metadata, count)
    selected_ids = {row["id"] for row in selected}
    audio_rows = pq.read_table(source, columns=["id", "audio"]).to_pylist()
    audio_by_id = {row["id"]: row["audio"]["bytes"] for row in audio_rows if row["id"] in selected_ids}
    clips = []
    audio_dir = OUTPUT_ROOT / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    for row in selected:
        clip_id = f"fleurs-{language_mode}-{row['id']}"
        temporary = audio_dir / f".{clip_id}.source.wav"
        destination = audio_dir / f"{clip_id}.wav"
        temporary.write_bytes(audio_by_id[row["id"]])
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(temporary), "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(destination),
            ],
            check=True,
        )
        temporary.unlink()
        duration_ms = round(row["num_samples"] / 16)
        clips.append(
            {
                "id": clip_id,
                "category": category,
                "languageMode": language_mode,
                "path": f"audio/{destination.name}",
                "durationMs": duration_ms,
                "speakerId": f"fleurs-gender-{row['gender']}-unknown-speaker",
                "genderLabel": row["gender"],
                "reference": row["transcription"],
                "rawReference": row["raw_transcription"],
                "sha256": sha256(destination),
            }
        )
    return clips


def main() -> int:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    clips = []
    clips.extend(extract(SOURCE_ROOT / "cmn_hans_cn-test.parquet", "zh", "mandarin", 50))
    clips.extend(extract(SOURCE_ROOT / "en_us-test.parquet", "en", "english", 50))
    corpus = {
        "schemaVersion": 1,
        "corpusId": "fleurs-controlled-mandarin-english-v1",
        "version": "1",
        "license": {
            "spdx": "CC-BY-4.0",
            "licensedRealSpeech": True,
            "provenanceReference": "https://huggingface.co/datasets/google/fleurs",
            "paperReference": "https://arxiv.org/abs/2205.12446",
        },
        "selection": {
            "sourceSplit": "test",
            "countPerLanguage": 50,
            "durationRangeMs": [3000, 15000],
            "balance": "equal count per FLEURS gender label, deterministically spread by source id",
            "speakerIdentityLimitation": "FLEURS parquet does not expose speaker identity; gender labels are not speaker IDs.",
            "audioProjection": "identical mono 16 kHz PCM16 WAV supplied to every backend",
        },
        "clips": clips,
    }
    manifest = OUTPUT_ROOT / "corpus.json"
    manifest.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(manifest)
    print(f"clips={len(clips)} durationSeconds={sum(c['durationMs'] for c in clips) / 1000:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
