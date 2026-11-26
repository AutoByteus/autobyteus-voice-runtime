"""Drive a voice-input worker over its stdin/stdout protocol and time each step.
Usage: python3 drive_worker.py <entrypoint> <backend> <model_path> <clip> [<clip> ...]
Prints one JSON line per event: ready (ms since spawn), each transcription (ms), exit."""
import json, subprocess, sys, time, threading

entry, backend, model = sys.argv[1:4]
clips = sys.argv[4:]
t0 = time.monotonic()
ms = lambda: round((time.monotonic() - t0) * 1000)
p = subprocess.Popen([entry, "serve", "--backend", backend, "--model-path", model],
                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
err = []
threading.Thread(target=lambda: err.extend(p.stderr), daemon=True).start()

def read_msg():
    line = p.stdout.readline()
    return json.loads(line) if line else None

msg = read_msg()
print(json.dumps({"event": "first-message", "atMs": ms(), "message": msg}), flush=True)
if msg is None:
    p.wait(timeout=60)
    print(json.dumps({"event": "exit", "code": p.returncode, "stderr": "".join(err)}), flush=True)
    sys.exit(0)
for i, clip in enumerate(clips):
    start = ms()
    p.stdin.write(json.dumps({"type": "transcribe-file", "requestId": f"r{i}", "audioPath": clip, "languageMode": "en"}) + "\n")
    p.stdin.flush()
    reply = read_msg()
    print(json.dumps({"event": "transcription", "clip": clip.rsplit("/", 1)[-1], "tookMs": ms() - start, "reply": reply}), flush=True)
p.stdin.close()
p.wait(timeout=60)
print(json.dumps({"event": "exit", "code": p.returncode, "stderrTail": "".join(err)[-300:]}), flush=True)
