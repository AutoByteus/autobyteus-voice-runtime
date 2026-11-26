"""One fresh process: the 0.3.1 worker's faster-whisper start (model + its warm-up), then three timed requests as the
worker makes them (vad_filter=True). With argv[3] == 'preload-vad', get_vad_model() is called after the warm-up.
Usage: python fw_vad_first_cost.py <model> <clip> <plain|preload-vad>"""
import json, sys, tempfile, time
sys.path.insert(0, "/tmp/ab655-api/ext-fw/runtime")
import voice_input_worker as w
model_path, clip, mode = sys.argv[1:4]
t0 = time.monotonic()
backend = w.start_backend("faster-whisper", model_path)
ready_ms = round((time.monotonic() - t0) * 1000)
vad_ms = None
if mode == "preload-vad":
    from faster_whisper.vad import get_vad_model
    t = time.monotonic(); get_vad_model(); vad_ms = round((time.monotonic() - t) * 1000)
took = []
for _ in range(3):
    t = time.monotonic(); r = backend.transcribe_file(clip, "en"); took.append(round((time.monotonic() - t) * 1000))
print(json.dumps({"mode": mode, "readyMs": ready_ms, "vadLoadMs": vad_ms, "requestsMs": took, "text": r.text}))
