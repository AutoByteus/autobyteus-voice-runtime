import importlib.util
import math
import struct
import tempfile
import unittest
import wave
from pathlib import Path
from types import ModuleType
from unittest import mock


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

    def test_prepare_model_install_downloads_into_model_directory(self) -> None:
        with tempfile.TemporaryDirectory(prefix="voice-input-worker-model-") as temp_dir_name:
            model_path = Path(temp_dir_name) / "model"

            def fake_snapshot_download(*, repo_id: str, local_dir: str, local_dir_use_symlinks: bool, revision=None):
                self.assertEqual(repo_id, "fixtures/model")
                self.assertEqual(local_dir, str(model_path))
                self.assertFalse(local_dir_use_symlinks)
                self.assertEqual(revision, "main")
                Path(local_dir).mkdir(parents=True, exist_ok=True)
                (Path(local_dir) / "weights.bin").write_text("fixture", encoding="utf-8")

            fake_hf_module = ModuleType("huggingface_hub")
            fake_hf_module.snapshot_download = fake_snapshot_download  # type: ignore[attr-defined]

            with mock.patch.dict("sys.modules", {"huggingface_hub": fake_hf_module}):
                voice_input_worker.prepare_model_install(str(model_path), "fixtures/model", "main")

            self.assertTrue((model_path / "weights.bin").exists())


if __name__ == "__main__":
    unittest.main()
