"""Time the MLX phases separately: import, ModelHolder load (fp16, as transcribe uses),
an optional warm-up inference on a short tone, then real transcriptions.
Usage: python mlx_phases.py <model_path> <warmup:yes|no> <clip> [<clip>...]"""
import json, sys, time
t = time.monotonic
model_path, warm = sys.argv[1], sys.argv[2] == "yes"
clips = sys.argv[3:]
out = {}
s = t(); import mlx.core as mx; from mlx_whisper import transcribe; from mlx_whisper.transcribe import ModelHolder; out["importMs"] = round((t()-s)*1000)
s = t(); ModelHolder.get_model(model_path, mx.float16); out["loadMs"] = round((t()-s)*1000)
if warm:
    import numpy as np
    tone = (0.1 * np.sin(2 * np.pi * 440 * np.arange(16000) / 16000)).astype(np.float32)
    s = t(); transcribe(tone, path_or_hf_repo=model_path, language="en"); out["warmupMs"] = round((t()-s)*1000)
for c in clips:
    s = t(); r = transcribe(c, path_or_hf_repo=model_path, language="en"); out[c.rsplit("/",1)[-1]] = [round((t()-s)*1000), r["text"].strip()]
print(json.dumps(out))
