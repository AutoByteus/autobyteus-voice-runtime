#!/usr/bin/env python3
"""Disposable packaged MLX Whisper relocation proof worker used only by the backend study."""

import argparse
import json
import os
import resource
import sys
import time
import wave

import numpy as np


PROCESS_STARTED_NS = time.perf_counter_ns()


def elapsed_ms(start_ns: int) -> float:
    return round((time.perf_counter_ns() - start_ns) / 1_000_000, 3)


def max_rss_bytes() -> int:
    # macOS reports ru_maxrss in bytes; Linux reports KiB.
    value = int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    return value if sys.platform == "darwin" else value * 1024


def emit(value: dict) -> None:
    sys.stdout.write(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")
    sys.stdout.flush()



def read_mono_pcm16_16khz_wav(path: str) -> np.ndarray:
    """Decode the product boundary format without an external ffmpeg process."""
    with wave.open(path, "rb") as stream:
        channels = stream.getnchannels()
        sample_width = stream.getsampwidth()
        sample_rate = stream.getframerate()
        compression = stream.getcomptype()
        frames = stream.readframes(stream.getnframes())
    if (channels, sample_width, sample_rate, compression) != (1, 2, 16000, "NONE"):
        raise ValueError(
            "Expected mono PCM16LE 16000 Hz WAV; got "
            f"channels={channels}, sampleWidth={sample_width}, sampleRate={sample_rate}, compression={compression}"
        )
    return np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    args = parser.parse_args()

    import_started_ns = time.perf_counter_ns()
    import mlx.core as mx
    from mlx_whisper import transcribe
    from mlx_whisper.transcribe import ModelHolder

    import_ms = elapsed_ms(import_started_ns)
    model_started_ns = time.perf_counter_ns()
    ModelHolder.get_model(args.model, mx.float16)
    model_load_ms = elapsed_ms(model_started_ns)
    emit(
        {
            "type": "ready",
            "backend": "mlx-whisper-fp16",
            "pid": os.getpid(),
            "importMs": import_ms,
            "modelLoadMs": model_load_ms,
            "workerReadyMs": elapsed_ms(PROCESS_STARTED_NS),
            "maxRssBytes": max_rss_bytes(),
        }
    )

    for raw_line in sys.stdin:
        raw_line = raw_line.strip()
        if not raw_line:
            continue
        request = json.loads(raw_line)
        if request.get("type") == "shutdown":
            emit({"type": "shutdown-complete", "maxRssBytes": max_rss_bytes()})
            return 0
        request_started_ns = time.perf_counter_ns()
        try:
            language_mode = request["languageMode"]
            kwargs = {
                "path_or_hf_repo": args.model,
                "temperature": 0.0,
                "condition_on_previous_text": False,
                "verbose": None,
                "task": "transcribe",
            }
            if language_mode != "auto":
                kwargs["language"] = language_mode
            audio = read_mono_pcm16_16khz_wav(request["audioPath"])
            result = transcribe(audio, **kwargs)
            emit(
                {
                    "type": "result",
                    "requestId": request["requestId"],
                    "ok": True,
                    "text": str(result.get("text", "")).strip(),
                    "detectedLanguage": result.get("language"),
                    "transcribeMs": elapsed_ms(request_started_ns),
                    "maxRssBytes": max_rss_bytes(),
                }
            )
        except Exception as error:
            emit(
                {
                    "type": "result",
                    "requestId": request.get("requestId"),
                    "ok": False,
                    "error": f"{error.__class__.__name__}: {error}",
                    "transcribeMs": elapsed_ms(request_started_ns),
                    "maxRssBytes": max_rss_bytes(),
                }
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
