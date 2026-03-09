import importlib.util
import math
import struct
import tempfile
import unittest
import wave
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODULE_PATH = PROJECT_ROOT / "runtime" / "voice_input_worker.py"
MODULE_SPEC = importlib.util.spec_from_file_location("voice_input_worker", MODULE_PATH)
voice_input_worker = importlib.util.module_from_spec(MODULE_SPEC)
assert MODULE_SPEC and MODULE_SPEC.loader
MODULE_SPEC.loader.exec_module(voice_input_worker)


def write_wav(file_path: Path, samples: list[int], sample_rate: int = 16000) -> None:
    payload = b"".join(struct.pack("<h", sample) for sample in samples)
    with wave.open(str(file_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(payload)


class VoiceInputWorkerTests(unittest.TestCase):
    def test_normalize_language_mode(self) -> None:
        self.assertIsNone(voice_input_worker.normalize_language_mode(None))
        self.assertIsNone(voice_input_worker.normalize_language_mode("auto"))
        self.assertEqual(voice_input_worker.normalize_language_mode("en"), "en")
        self.assertEqual(voice_input_worker.normalize_language_mode("zh"), "zh")
        self.assertIsNone(voice_input_worker.normalize_language_mode("de"))

    def test_is_probable_no_speech_detects_silence(self) -> None:
        with tempfile.TemporaryDirectory(prefix="voice-input-worker-") as temp_dir_name:
            audio_path = Path(temp_dir_name) / "silence.wav"
            write_wav(audio_path, [0] * 3200)
            self.assertTrue(voice_input_worker.is_probable_no_speech(str(audio_path)))

    def test_is_probable_no_speech_accepts_non_silent_audio(self) -> None:
        with tempfile.TemporaryDirectory(prefix="voice-input-worker-") as temp_dir_name:
            audio_path = Path(temp_dir_name) / "tone.wav"
            samples = [
                int(10000 * math.sin((index / 16000.0) * 2.0 * math.pi * 440.0))
                for index in range(3200)
            ]
            write_wav(audio_path, samples)
            self.assertFalse(voice_input_worker.is_probable_no_speech(str(audio_path)))


if __name__ == "__main__":
    unittest.main()
