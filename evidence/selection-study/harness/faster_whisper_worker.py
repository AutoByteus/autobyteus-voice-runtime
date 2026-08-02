#!/usr/bin/env python3
"""Disposable persistent faster-whisper worker for controlled candidate evidence."""

from __future__ import annotations

import argparse
import json
import resource
import sys
import time


def rss_bytes() -> int:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss


def emit(value: dict) -> None:
    sys.stdout.write(json.dumps(value, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--language", choices=["en", "zh", "auto"], required=True)
    parser.add_argument("--compute-type", choices=["int8", "float32"], required=True)
    parser.add_argument("--beam-size", type=int, choices=[1, 5], required=True)
    parser.add_argument("--vad-filter", choices=["true", "false"], required=True)
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()

    import_started = time.perf_counter_ns()
    import ctranslate2
    from faster_whisper import WhisperModel

    import_ms = (time.perf_counter_ns() - import_started) / 1_000_000
    load_started = time.perf_counter_ns()
    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type=args.compute_type,
        cpu_threads=args.threads,
        num_workers=1,
        local_files_only=True,
    )
    load_ms = (time.perf_counter_ns() - load_started) / 1_000_000
    emit(
        {
            "type": "ready",
            "backend": "faster-whisper",
            "fasterWhisperVersion": "1.2.1",
            "ctranslate2Version": ctranslate2.__version__,
            "computeType": args.compute_type,
            "beamSize": args.beam_size,
            "vadFilter": args.vad_filter == "true",
            "threads": args.threads,
            "importMs": round(import_ms, 3),
            "modelLoadMs": round(load_ms, 3),
            "rssBytes": rss_bytes(),
        }
    )

    for line in sys.stdin:
        request = json.loads(line)
        if request.get("type") == "shutdown":
            emit({"type": "stopped"})
            return 0
        if request.get("type") != "transcribe":
            emit({"type": "error", "requestId": request.get("requestId"), "ok": False, "error": "unsupported"})
            continue
        started = time.perf_counter_ns()
        segments, info = model.transcribe(
            request["audioPath"],
            language=None if args.language == "auto" else args.language,
            task="transcribe",
            beam_size=args.beam_size,
            condition_on_previous_text=False,
            vad_filter=args.vad_filter == "true",
            temperature=0,
        )
        text = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
        emit(
            {
                "type": "result",
                "requestId": request["requestId"],
                "ok": True,
                "text": text,
                "detectedLanguage": getattr(info, "language", None),
                "transcribeMs": round((time.perf_counter_ns() - started) / 1_000_000, 3),
                "rssBytes": rss_bytes(),
            }
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
