#!/usr/bin/env python3
"""Persistent llama-server adapter for the Qwen3-ASR GGUF experiment."""

from __future__ import annotations

import argparse
import base64
import http.client
import json
import re
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path


def emit(value: dict) -> None:
    sys.stdout.write(json.dumps(value, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def free_loopback_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def process_rss_bytes(pid: int) -> int:
    try:
        value = subprocess.check_output(
            ["ps", "-o", "rss=", "-p", str(pid)], text=True
        ).strip()
        return int(value) * 1024 if value else 0
    except (subprocess.CalledProcessError, ValueError):
        return 0


def wait_until_ready(process: subprocess.Popen, port: int, timeout_s: float = 60.0) -> None:
    deadline = time.monotonic() + timeout_s
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"llama-server exited during startup: {process.returncode}")
        try:
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=1)
            connection.request("GET", "/health")
            response = connection.getresponse()
            response.read()
            connection.close()
            if response.status == 200:
                return
        except (ConnectionError, OSError, http.client.HTTPException) as error:
            last_error = error
        time.sleep(0.025)
    raise TimeoutError(f"llama-server did not become ready: {last_error}")


def normalize_native_response(value: str) -> str:
    """Strip Qwen3-ASR's native language/tag prefix without editing content."""
    if "<asr_text>" in value:
        return value.split("<asr_text>", 1)[1].strip()
    return re.sub(r"^language\s+\S+\s*", "", value.strip(), flags=re.IGNORECASE)


def transcribe(port: int, audio_path: str) -> tuple[str, dict]:
    audio = base64.b64encode(Path(audio_path).read_bytes()).decode("ascii")
    payload = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": audio, "format": "wav"},
                    }
                ],
            }
        ],
        "temperature": 0,
        "top_p": 1,
        "seed": 20260802,
        # Every voice-input request contains unrelated audio. Reusing an old
        # multimodal KV prefix is not a useful product optimization and caused
        # the long-session memory probe to retain a much larger high-water RSS.
        "cache_prompt": False,
        "max_tokens": 512,
        "stream": False,
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=120)
    connection.request(
        "POST",
        "/v1/chat/completions",
        body=body,
        headers={"Content-Type": "application/json"},
    )
    response = connection.getresponse()
    raw = response.read()
    status = response.status
    connection.close()
    if status != 200:
        raise RuntimeError(f"llama-server returned HTTP {status}: {raw[:500]!r}")
    parsed = json.loads(raw)
    content = parsed["choices"][0]["message"]["content"]
    return normalize_native_response(content), parsed.get("timings", {})


def stop_server(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    process.send_signal(signal.SIGTERM)
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--mmproj", required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--ctx-size", type=int, default=4096)
    args = parser.parse_args()

    port = free_loopback_port()
    command = [
        args.server,
        "--model",
        args.model,
        "--mmproj",
        args.mmproj,
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--threads",
        str(args.threads),
        "--threads-batch",
        str(args.threads),
        "--ctx-size",
        str(args.ctx_size),
        "--parallel",
        "1",
        "--gpu-layers",
        "999",
        "--flash-attn",
        "on",
        "--no-webui",
    ]
    started = time.perf_counter_ns()
    server = subprocess.Popen(command, stdout=sys.stderr, stderr=sys.stderr)
    try:
        wait_until_ready(server, port)
        emit(
            {
                "type": "ready",
                "backend": "llama.cpp/Qwen3-ASR",
                "sourceCommit": args.source_commit,
                "model": "Qwen3-ASR-0.6B-Q8_0",
                "threads": args.threads,
                "contextSize": args.ctx_size,
                "gpuLayers": 999,
                "flashAttention": True,
                "modelLoadMs": round((time.perf_counter_ns() - started) / 1_000_000, 3),
                "serverPid": server.pid,
                "rssBytes": process_rss_bytes(server.pid),
            }
        )

        for line in sys.stdin:
            request = json.loads(line)
            if request.get("type") == "shutdown":
                stop_server(server)
                emit({"type": "stopped"})
                return 0
            if request.get("type") != "transcribe":
                emit(
                    {
                        "type": "error",
                        "requestId": request.get("requestId"),
                        "ok": False,
                        "error": "unsupported",
                    }
                )
                continue
            request_started = time.perf_counter_ns()
            try:
                text, timings = transcribe(port, request["audioPath"])
                emit(
                    {
                        "type": "result",
                        "requestId": request["requestId"],
                        "ok": True,
                        "text": text,
                        "timings": timings,
                        "transcribeMs": round(
                            (time.perf_counter_ns() - request_started) / 1_000_000, 3
                        ),
                        "serverRssBytes": process_rss_bytes(server.pid),
                    }
                )
            except Exception as error:
                emit(
                    {
                        "type": "result",
                        "requestId": request["requestId"],
                        "ok": False,
                        "error": str(error),
                    }
                )
    finally:
        stop_server(server)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
