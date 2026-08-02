#!/usr/bin/env python3
"""Run the official Fun-ASR-Nano GGUF CLI over a corpus for quality evidence.

This deliberately uses concurrent isolated CLI processes to shorten the candidate
screening pass. The captured durations are therefore not accepted as performance
evidence; latency and RSS are measured separately under an isolated invocation.
"""

import argparse
import concurrent.futures
import json
import subprocess
import time
from pathlib import Path


ROOT = Path("/tmp/autobyteus-voice-backend-study-20260802")
BIN = ROOT / "build/funasr-llamacpp/bin/llama-funasr-cli"
MODELS = ROOT / "assets/funasr-nano-gguf"


def run_clip(corpus_root: Path, clip: dict, binary: Path, backend: str) -> dict:
    audio = (corpus_root / clip["path"]).resolve()
    command = [
        str(binary),
        "--enc", str(MODELS / "funasr-encoder-f16.gguf"),
        "-m", str(MODELS / "qwen3-0.6b-q8_0.gguf"),
        "-a", str(audio),
        "--chunk", "15",
    ]
    started = time.perf_counter_ns()
    completed = subprocess.run(command, text=True, capture_output=True, timeout=180)
    elapsed_ms = round((time.perf_counter_ns() - started) / 1_000_000, 3)
    if completed.returncode != 0:
        raise RuntimeError(f"{clip['id']} failed ({completed.returncode}): {completed.stderr[-2000:]}")
    return {
        "id": clip["id"],
        "category": clip["category"],
        "reference": clip["reference"],
        "durationMs": clip["durationMs"],
        "speakerId": clip["speakerId"],
        "response": {
            "type": "result",
            "requestId": clip["id"],
            "ok": True,
            "text": completed.stdout.strip(),
            "backend": backend,
            "requestRoundTripMs": elapsed_ms,
            "candidateScreeningUnderContention": True,
            "stderrTail": completed.stderr[-1000:],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", required=True)
    parser.add_argument("--language", choices=["en", "zh", "auto"], required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--binary", default=str(BIN))
    parser.add_argument("--backend", default="funasr-nano-gguf-q8")
    args = parser.parse_args()

    corpus_path = Path(args.corpus)
    corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
    clips = [clip for clip in corpus["clips"] if clip["languageMode"] == args.language]
    completed_by_id = {}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        prior = json.loads(output.read_text(encoding="utf-8"))
        completed_by_id = {sample["id"]: sample for sample in prior.get("warmSession", {}).get("quality", [])}

    def save() -> None:
        quality = [completed_by_id[c["id"]] for c in clips if c["id"] in completed_by_id]
        report = {
            "schemaVersion": 1,
            "backend": args.backend,
            "language": args.language,
            "command": [str(Path(args.binary)), "--enc", str(MODELS / "funasr-encoder-f16.gguf"), "-m", str(MODELS / "qwen3-0.6b-q8_0.gguf"), "-a", "<clip>", "--chunk", "15"],
            "corpusId": corpus["corpusId"],
            "screeningExecution": {"concurrentWorkers": args.workers, "performanceAuthority": "Rejected — quality screening only"},
            "warmSession": {"quality": quality, "performance": []},
            "summaries": {},
        }
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    remaining = [clip for clip in clips if clip["id"] not in completed_by_id]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(run_clip, corpus_path.parent, clip, Path(args.binary), args.backend): clip for clip in remaining}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            completed_by_id[result["id"]] = result
            save()
            print(f"{len(completed_by_id)}/{len(clips)} {result['id']} {result['response']['requestRoundTripMs']} ms", flush=True)
    save()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
