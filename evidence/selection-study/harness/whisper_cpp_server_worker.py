#!/usr/bin/env python3
"""Persistent whisper.cpp server adapter for controlled backend experiments.

This is investigation-only code. It gives the shared JSON-lines harness the
same persistent-session shape used by the other candidates while exercising
the upstream whisper-server binary without changing its source.
"""

from __future__ import annotations

import argparse
import http.client
import json
import os
import resource
import signal
import socket
import subprocess
import sys
import time
import uuid
from pathlib import Path


def emit(value: dict) -> None:
    sys.stdout.write(json.dumps(value, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def free_loopback_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def server_rss_bytes(pid: int) -> int:
    try:
        value = subprocess.check_output(
            ["ps", "-o", "rss=", "-p", str(pid)], text=True
        ).strip()
        return int(value) * 1024 if value else 0
    except (subprocess.CalledProcessError, ValueError):
        return 0


def wait_until_ready(process: subprocess.Popen, port: int, timeout_s: float = 30.0) -> None:
    deadline = time.monotonic() + timeout_s
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"whisper-server exited during startup: {process.returncode}")
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
    raise TimeoutError(f"whisper-server did not become ready: {last_error}")


def multipart_body(audio_path: str) -> tuple[bytes, str]:
    boundary = f"----autobyteus-{uuid.uuid4().hex}"
    audio = Path(audio_path).read_bytes()
    name = Path(audio_path).name
    chunks = [
        f"--{boundary}\r\n".encode(),
        (
            f'Content-Disposition: form-data; name="file"; filename="{name}"\r\n'
            "Content-Type: audio/wav\r\n\r\n"
        ).encode(),
        audio,
        b"\r\n",
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="response_format"\r\n\r\n',
        b"json\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    return b"".join(chunks), boundary


def transcribe(port: int, audio_path: str) -> dict:
    body, boundary = multipart_body(audio_path)
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=120)
    connection.request(
        "POST",
        "/inference",
        body=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    response = connection.getresponse()
    payload = response.read()
    status = response.status
    connection.close()
    if status != 200:
        raise RuntimeError(f"whisper-server returned HTTP {status}: {payload[:500]!r}")
    return json.loads(payload)


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
    parser.add_argument("--language", choices=["en", "zh", "auto"], required=True)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--source-commit", required=True)
    args = parser.parse_args()

    port = free_loopback_port()
    command = [
        args.server,
        "--model",
        args.model,
        "--language",
        args.language,
        "--threads",
        str(args.threads),
        "--beam-size",
        str(args.beam_size),
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--no-language-probabilities",
    ]
    started = time.perf_counter_ns()
    server = subprocess.Popen(command, stdout=sys.stderr, stderr=sys.stderr)
    try:
        wait_until_ready(server, port)
        emit(
            {
                "type": "ready",
                "backend": "whisper.cpp",
                "sourceCommit": args.source_commit,
                "language": args.language,
                "beamSize": args.beam_size,
                "threads": args.threads,
                "modelLoadMs": round((time.perf_counter_ns() - started) / 1_000_000, 3),
                "serverPid": server.pid,
                "rssBytes": server_rss_bytes(server.pid),
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
                response = transcribe(port, request["audioPath"])
                emit(
                    {
                        "type": "result",
                        "requestId": request["requestId"],
                        "ok": True,
                        "text": response.get("text", "").strip(),
                        "transcribeMs": round(
                            (time.perf_counter_ns() - request_started) / 1_000_000, 3
                        ),
                        "serverRssBytes": server_rss_bytes(server.pid),
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
