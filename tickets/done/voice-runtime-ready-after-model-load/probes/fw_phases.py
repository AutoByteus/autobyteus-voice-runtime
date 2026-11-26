"""Time faster-whisper phases with the worker's own settings: import, WhisperModel load
(cpu, int8), an optional warm-up transcription of a 1 s tone WAV file (vad off, so it
decodes), then real clips with the worker's request settings.
Usage: python fw_phases.py <model_path> <warmup:yes|no> <clip> [<clip>...]"""
import json, math, struct, sys, tempfile, time, wave
from pathlib import Path
t = time.monotonic
model_path, warm = sys.argv[1], sys.argv[2] == "yes"
clips = sys.argv[3:]
out = {}
s = t(); from faster_whisper import WhisperModel; out["importMs"] = round((t()-s)*1000)
s = t(); model = WhisperModel(model_path, device="cpu", compute_type="int8"); out["loadMs"] = round((t()-s)*1000)
def run(path, vad):
    segs, info = model.transcribe(path, language="en", vad_filter=vad, beam_size=1, condition_on_previous_text=False)
    return " ".join(x.text.strip() for x in segs if x.text and x.text.strip()).strip()
if warm:
    tone = Path(tempfile.mkdtemp()) / "tone.wav"
    with wave.open(str(tone), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
        w.writeframes(b"".join(struct.pack("<h", int(8000*math.sin(2*math.pi*440*i/16000))) for i in range(16000)))
    s = t(); run(str(tone), False); out["warmupMs"] = round((t()-s)*1000)
for c in clips:
    s = t(); text = run(c, True); out[c.rsplit("/",1)[-1]] = [round((t()-s)*1000), text]
print(json.dumps(out))
