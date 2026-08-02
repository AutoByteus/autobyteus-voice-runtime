#!/usr/bin/env python3
"""Run repeatable cold, warm, and quality probes against disposable line workers."""

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
import uuid
from pathlib import Path


ROOT = Path("/tmp/autobyteus-voice-backend-study-20260802")
MLX_PYTHON = Path("/Users/normy/.autobyteus/extensions/voice-input/runtime/.venv/bin/python")
MLX_MODEL = Path("/Users/normy/.autobyteus/extensions/voice-input/models/whisper-small-mlx")
SHERPA_PACKAGE = Path(
    "/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/"
    "node_modules/sherpa-onnx-node"
)
SHERPA_MODEL = ROOT / "assets/sherpa-onnx-whisper-small"
PARAFORMER_MODEL = ROOT / "assets/sherpa-onnx-paraformer-zh-2024-03-09"
SENSEVOICE_MODEL = Path(
    "/tmp/autobyteus-sensevoice-sherpa-probe/"
    "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17"
)
FASTER_WHISPER_PYTHON = ROOT / "faster-whisper-venv/bin/python"
FASTER_WHISPER_MODEL = ROOT / "assets/faster-whisper-small"
WHISPER_CPP_ROOT = ROOT / "upstream/whisper.cpp"
WHISPER_CPP_SERVER = WHISPER_CPP_ROOT / "build/bin/whisper-server"
WHISPER_CPP_MODEL = WHISPER_CPP_ROOT / "models/ggml-small.bin"
WHISPER_CPP_COMMIT = "2ca53bb45e38748d07b310eeb36245a7157ac882"
LLAMA_CPP_ROOT = ROOT / "upstream/llama.cpp-latest"
LLAMA_CPP_SERVER = LLAMA_CPP_ROOT / "build/bin/llama-server"
LLAMA_CPP_COMMIT = "f5919bf458ef190468b5c329bb293f8a54a1e69c"
QWEN3_ASR_MODEL_ROOT = ROOT / "assets/qwen3-asr-0.6b-q8_0"


class Worker:
    def __init__(self, command: list[str], stderr_path: Path):
        stderr_path.parent.mkdir(parents=True, exist_ok=True)
        self.stderr_handle = stderr_path.open("a", encoding="utf-8")
        self.spawn_started_ns = time.perf_counter_ns()
        self.process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=self.stderr_handle,
            text=True,
            bufsize=1,
        )
        self.ready = self._read()
        self.ready["spawnToReadyMs"] = elapsed_ms(self.spawn_started_ns)
        self.ready["sampledRssBytes"] = resident_bytes(self.process.pid)

    def _read(self) -> dict:
        assert self.process.stdout is not None
        line = self.process.stdout.readline()
        if not line:
            returncode = self.process.poll()
            raise RuntimeError(f"Worker stopped before response (exit={returncode}).")
        return json.loads(line)

    def transcribe(self, clip: dict) -> dict:
        request_id = uuid.uuid4().hex
        request = {
            "type": "transcribe",
            "requestId": request_id,
            "audioPath": clip["absolutePath"],
            "languageMode": clip["languageMode"],
        }
        assert self.process.stdin is not None
        started_ns = time.perf_counter_ns()
        self.process.stdin.write(json.dumps(request, ensure_ascii=False) + "\n")
        self.process.stdin.flush()
        response = self._read()
        response["requestRoundTripMs"] = elapsed_ms(started_ns)
        response["sampledRssBytes"] = resident_bytes(self.process.pid)
        if response.get("requestId") != request_id:
            raise RuntimeError("Worker response identity mismatch.")
        if not response.get("ok"):
            raise RuntimeError(f"Worker transcription failed: {response}")
        return response

    def stop(self) -> dict:
        if self.process.poll() is not None:
            return {"type": "already-stopped", "exitCode": self.process.returncode}
        assert self.process.stdin is not None
        self.process.stdin.write('{"type":"shutdown"}\n')
        self.process.stdin.flush()
        response = self._read()
        self.process.wait(timeout=10)
        self.stderr_handle.close()
        return response


def elapsed_ms(start_ns: int) -> float:
    return round((time.perf_counter_ns() - start_ns) / 1_000_000, 3)


def resident_bytes(pid: int) -> int:
    """Return RSS for a worker and all descendants.

    Most candidate workers host inference in-process. Server-based candidate
    adapters deliberately own one child process, so process-tree RSS is the
    comparable product memory boundary for those lanes.
    """
    discovered = [pid]
    index = 0
    while index < len(discovered):
        parent = discovered[index]
        index += 1
        children = subprocess.run(
            ["pgrep", "-P", str(parent)],
            check=False,
            capture_output=True,
            text=True,
        ).stdout.split()
        discovered.extend(int(value) for value in children if int(value) not in discovered)
    total_kib = 0
    for process_id in discovered:
        output = subprocess.run(
            ["ps", "-o", "rss=", "-p", str(process_id)],
            check=False,
            capture_output=True,
            text=True,
        ).stdout.strip()
        if output:
            total_kib += int(output)
    return total_kib * 1024


def command_for(backend: str, language: str, threads: int) -> list[str]:
    if backend == "mlx-fp16":
        return [
            str(MLX_PYTHON),
            str(ROOT / "harness/mlx_whisper_worker.py"),
            "--model",
            str(MLX_MODEL),
        ]
    if backend == "sensevoice-int8":
        return [
            "node",
            str(ROOT / "harness/sherpa_sensevoice_worker.cjs"),
            "--sherpa-package",
            str(SHERPA_PACKAGE),
            "--model",
            str(SENSEVOICE_MODEL / "model.int8.onnx"),
            "--tokens",
            str(SENSEVOICE_MODEL / "tokens.txt"),
            "--language",
            language,
            "--threads",
            str(threads),
        ]
    if backend.startswith("faster-whisper-"):
        _, _, compute_type, beam = backend.split("-")
        return [
            str(FASTER_WHISPER_PYTHON),
            str(ROOT / "harness/faster_whisper_worker.py"),
            "--model",
            str(FASTER_WHISPER_MODEL),
            "--language",
            language,
            "--compute-type",
            compute_type,
            "--beam-size",
            beam.removeprefix("beam"),
            "--vad-filter",
            "true",
            "--threads",
            str(threads),
        ]
    if backend == "whisper-cpp-f16-beam5":
        return [
            sys.executable,
            str(ROOT / "harness/whisper_cpp_server_worker.py"),
            "--server",
            str(WHISPER_CPP_SERVER),
            "--model",
            str(WHISPER_CPP_MODEL),
            "--language",
            language,
            "--threads",
            str(threads),
            "--beam-size",
            "5",
            "--source-commit",
            WHISPER_CPP_COMMIT,
        ]
    if backend == "qwen3-asr-0.6b-q8":
        return [
            sys.executable,
            str(ROOT / "harness/qwen3_asr_llama_server_worker.py"),
            "--server",
            str(LLAMA_CPP_SERVER),
            "--model",
            str(QWEN3_ASR_MODEL_ROOT / "Qwen3-ASR-0.6B-Q8_0.gguf"),
            "--mmproj",
            str(QWEN3_ASR_MODEL_ROOT / "mmproj-Qwen3-ASR-0.6B-Q8_0.gguf"),
            "--source-commit",
            LLAMA_CPP_COMMIT,
            "--threads",
            str(threads),
            "--ctx-size",
            "4096",
        ]
    if backend in {"paraformer-int8", "paraformer-fp32"}:
        precision = "int8" if backend.endswith("int8") else "fp32"
        model = "model.int8.onnx" if precision == "int8" else "model.onnx"
        return [
            "node",
            str(ROOT / "harness/sherpa_paraformer_worker.cjs"),
            "--sherpa-package",
            str(SHERPA_PACKAGE),
            "--model",
            str(PARAFORMER_MODEL / model),
            "--tokens",
            str(PARAFORMER_MODEL / "tokens.txt"),
            "--precision",
            precision,
            "--threads",
            str(threads),
        ]
    if backend not in {"sherpa-int8", "sherpa-fp32"}:
        raise ValueError(f"Unsupported backend: {backend}")
    suffix = ".int8" if backend == "sherpa-int8" else ""
    precision = "int8" if suffix else "fp32"
    return [
        "node",
        str(ROOT / "harness/sherpa_whisper_worker.cjs"),
        "--sherpa-package",
        str(SHERPA_PACKAGE),
        "--encoder",
        str(SHERPA_MODEL / f"small-encoder{suffix}.onnx"),
        "--decoder",
        str(SHERPA_MODEL / f"small-decoder{suffix}.onnx"),
        "--tokens",
        str(SHERPA_MODEL / "small-tokens.txt"),
        "--language",
        language,
        "--precision",
        precision,
        "--threads",
        str(threads),
    ]


def summary(values: list[float]) -> dict:
    ordered = sorted(values)
    if not ordered:
        return {"count": 0}

    def percentile(p: float) -> float:
        rank = (len(ordered) - 1) * p
        lower = int(rank)
        upper = min(lower + 1, len(ordered) - 1)
        fraction = rank - lower
        return ordered[lower] + (ordered[upper] - ordered[lower]) * fraction

    return {
        "count": len(ordered),
        "min": round(ordered[0], 3),
        "median": round(statistics.median(ordered), 3),
        "p95": round(percentile(0.95), 3),
        "max": round(ordered[-1], 3),
        "mean": round(statistics.fmean(ordered), 3),
    }


def run(args: argparse.Namespace) -> dict:
    corpus = json.loads(Path(args.corpus).read_text(encoding="utf-8"))
    clips = []
    corpus_root = Path(args.corpus).parent
    for value in corpus["clips"]:
        if value["languageMode"] != args.language:
            continue
        clip = dict(value)
        clip["absolutePath"] = str((corpus_root / value["path"]).resolve())
        clips.append(clip)
    if not clips:
        raise RuntimeError(f"Corpus has no {args.language} clips.")
    cold_clip = min(clips, key=lambda value: abs(value["durationMs"] - 6000))
    stderr_path = Path(args.output).with_suffix(".stderr.log")
    command = command_for(args.backend, args.language, args.threads)
    cold_runs = []
    for index in range(args.cold_runs):
        worker = Worker(command, stderr_path)
        first = worker.transcribe(cold_clip)
        stopped = worker.stop()
        cold_runs.append({"index": index, "ready": worker.ready, "first": first, "shutdown": stopped})

    worker = Worker(command, stderr_path)
    warmup = worker.transcribe(cold_clip)
    quality = []
    for clip in clips:
        response = worker.transcribe(clip)
        quality.append(
            {
                "id": clip["id"],
                "category": clip["category"],
                "reference": clip["reference"],
                "durationMs": clip["durationMs"],
                "speakerId": clip["speakerId"],
                "response": response,
            }
        )
    performance = [worker.transcribe(cold_clip) for _ in range(args.warm_runs)]
    shutdown = worker.stop()
    report = {
        "schemaVersion": 1,
        "backend": args.backend,
        "language": args.language,
        "threads": args.threads if args.backend.startswith("sherpa") or args.backend.startswith("sensevoice") else None,
        "command": command,
        "corpusId": corpus["corpusId"],
        "coldClip": {key: cold_clip[key] for key in ["id", "durationMs", "reference"]},
        "coldRuns": cold_runs,
        "warmSession": {
            "ready": worker.ready,
            "warmup": warmup,
            "quality": quality,
            "performance": performance,
            "shutdown": shutdown,
        },
        "summaries": {
            "spawnToReadyMs": summary([value["ready"]["spawnToReadyMs"] for value in cold_runs]),
            "firstRequestMs": summary([value["first"]["requestRoundTripMs"] for value in cold_runs]),
            "coldEndToEndMs": summary(
                [value["ready"]["spawnToReadyMs"] + value["first"]["requestRoundTripMs"] for value in cold_runs]
            ),
            "warmRequestMs": summary([value["requestRoundTripMs"] for value in performance]),
            "maxSampledRssBytes": max(
                [value["ready"]["sampledRssBytes"] for value in cold_runs]
                + [value["first"]["sampledRssBytes"] for value in cold_runs]
                + [worker.ready["sampledRssBytes"]]
                + [value["response"]["sampledRssBytes"] for value in quality]
                + [value["sampledRssBytes"] for value in performance]
            ),
        },
    }
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", choices=["mlx-fp16", "sherpa-int8", "sherpa-fp32", "sensevoice-int8", "paraformer-int8", "paraformer-fp32", "faster-whisper-int8-beam1", "faster-whisper-int8-beam5", "faster-whisper-float32-beam5", "whisper-cpp-f16-beam5", "qwen3-asr-0.6b-q8"], required=True)
    parser.add_argument("--language", choices=["en", "zh", "auto"], required=True)
    parser.add_argument("--corpus", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--cold-runs", type=int, default=10)
    parser.add_argument("--warm-runs", type=int, default=30)
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    report = run(args)
    print(json.dumps(report["summaries"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
