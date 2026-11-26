import array
import contextlib
import importlib.util
import io
import json
import math
import random
import struct
import subprocess
import sys
import tempfile
import unittest
import warnings
import wave
from pathlib import Path
from types import ModuleType
from typing import Optional
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


def run_serve(backend_kind: str, model_path: str, stdin_text: str = "") -> tuple[int, list[dict], str]:
    """Runs `main()` as `serve`; returns the exit code, the stdout messages and the stderr text."""
    stdout, stderr = io.StringIO(), io.StringIO()
    argv = ["voice_input_worker.py", "serve", "--backend", backend_kind, "--model-path", model_path]
    with mock.patch.object(sys, "argv", argv), mock.patch.object(sys, "stdin", io.StringIO(stdin_text)), \
            contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        code = voice_input_worker.main()
    messages = [json.loads(line) for line in stdout.getvalue().splitlines() if line.strip()]
    return code, messages, stderr.getvalue()


class RecordingBackend(voice_input_worker.Backend):
    """A stand-in backend: records the start's order and the warm-up clip it was given."""

    def __init__(self, events: list, fail_with: Optional[Exception] = None, warn: Optional[str] = None):
        self.events = events
        self.fail_with = fail_with
        self.warn = warn
        self.clip_path: Optional[str] = None
        self.clip_facts: dict = {}

    def load(self, warm_up_clip: str) -> None:
        self.events.append("load")
        self.clip_path = warm_up_clip
        with wave.open(warm_up_clip, "rb") as wav_file:
            self.clip_facts = {
                "channels": wav_file.getnchannels(), "width": wav_file.getsampwidth(),
                "rate": wav_file.getframerate(), "frames": wav_file.getnframes(),
            }
        self.clip_facts["silent"] = voice_input_worker.is_probable_no_speech(warm_up_clip)
        if self.warn:
            warnings.warn(self.warn)
        if self.fail_with:
            raise self.fail_with

    def transcribe_file(self, audio_path: str, language_mode):
        self.events.append(("transcribe", audio_path, language_mode))
        return voice_input_worker.TranscriptionResult(text="hello", detected_language="en")


class WorkerStartTests(unittest.TestCase):
    """`serve` writes `ready` only after the backend loaded and transcribed the warm-up clip (AC-001, AC-004)."""

    def setUp(self) -> None:
        self._temp = tempfile.TemporaryDirectory(prefix="voice-input-worker-start-")
        self.model_path = str(Path(self._temp.name) / "model")
        Path(self.model_path).mkdir()

    def tearDown(self) -> None:
        self._temp.cleanup()

    def serve_with(self, backend: RecordingBackend, stdin_text: str = "", backend_kind: str = "mlx"):
        def build(kind: str, model_path: str):
            backend.events.append(("build", kind, model_path))
            return backend
        original_emit = voice_input_worker.emit

        def recording_emit(payload):
            backend.events.append(("emit", payload.get("type") or payload.get("requestId")))
            original_emit(payload)

        with mock.patch.object(voice_input_worker, "build_backend", build), \
                mock.patch.object(voice_input_worker, "emit", recording_emit):
            return run_serve(backend_kind, self.model_path, stdin_text)

    def test_writes_ready_only_after_load_returned(self) -> None:
        events: list = []
        backend = RecordingBackend(events)
        code, messages, stderr = self.serve_with(backend)
        self.assertEqual(code, 0)
        self.assertEqual(messages, [{"type": "ready", "backendKind": "mlx"}])
        self.assertEqual(events, [("build", "mlx", self.model_path), "load", ("emit", "ready")])
        self.assertEqual(stderr, "")

    def test_warm_up_clip_is_a_one_second_non_silent_wav_removed_after_the_start(self) -> None:
        backend = RecordingBackend([])
        self.serve_with(backend)
        self.assertEqual(backend.clip_facts, {"channels": 1, "width": 2, "rate": 16000, "frames": 16000, "silent": False})
        self.assertIsNotNone(backend.clip_path)
        self.assertFalse(Path(backend.clip_path).exists())

    def test_failed_load_writes_no_ready_one_stderr_line_and_exits_1(self) -> None:
        events: list = []
        backend = RecordingBackend(events, fail_with=RuntimeError("Unsupported model binary version.\nSecond line"))
        code, messages, stderr = self.serve_with(backend, stdin_text='{"type":"transcribe-file","requestId":"r0"}\n',
                                                 backend_kind="faster-whisper")
        self.assertEqual(code, 1)
        self.assertEqual(messages, [])
        self.assertEqual(stderr, "Voice Input worker could not start the faster-whisper backend: "
                                 "RuntimeError: Unsupported model binary version. Second line\n")
        self.assertNotIn(("emit", "ready"), events)
        self.assertFalse(Path(backend.clip_path).exists())

    def test_missing_model_folder_is_a_start_failure_with_its_own_reason(self) -> None:
        missing = str(Path(self._temp.name) / "missing-model")
        events: list = []
        backend = RecordingBackend(events)

        def build(kind: str, model_path: str):
            events.append("build")
            return backend
        with mock.patch.object(voice_input_worker, "build_backend", build):
            code, messages, stderr = run_serve("mlx", missing)
        self.assertEqual(code, 1)
        self.assertEqual(messages, [])
        self.assertEqual(stderr, f"Voice Input worker could not start the mlx backend: model folder not found: {missing}\n")
        self.assertEqual(events, [])

    def test_known_urllib3_openssl_warning_stays_off_stderr(self) -> None:
        backend = RecordingBackend([], warn="urllib3 v2 only supports OpenSSL 1.1.1+, currently the 'ssl' module is compiled with 'LibreSSL 2.8.3'.")
        with warnings.catch_warnings():
            warnings.simplefilter("default")
            code, _, stderr = self.serve_with(backend)
        self.assertEqual(code, 0)
        self.assertEqual(stderr, "")

    def test_serves_requests_after_ready_with_unchanged_replies(self) -> None:
        silence = Path(self._temp.name) / "silence.wav"
        write_wav(silence, [0] * 3200)
        tone = Path(self._temp.name) / "tone.wav"
        write_wav(tone, [int(10000 * math.sin((index / 16000.0) * 2.0 * math.pi * 440.0)) for index in range(8000)])
        requests = "\n".join(json.dumps(request) for request in [
            {"type": "transcribe-file", "requestId": "r0", "audioPath": str(silence), "languageMode": "en"},
            {"type": "transcribe-file", "requestId": "r1", "audioPath": str(tone), "languageMode": "auto"},
            {"type": "ping", "requestId": "r2"},
        ]) + "\n"
        code, messages, _ = self.serve_with(RecordingBackend([]), stdin_text=requests)
        self.assertEqual(code, 0)
        self.assertEqual(messages, [
            {"type": "ready", "backendKind": "mlx"},
            {"requestId": "r0", "ok": True, "text": "", "detectedLanguage": None, "noSpeech": True, "error": None},
            {"requestId": "r1", "ok": True, "text": "hello", "detectedLanguage": "en", "noSpeech": False, "error": None},
            {"requestId": "r2", "ok": False, "text": "", "detectedLanguage": None, "noSpeech": False,
             "error": "Unsupported request type: ping"},
        ])


class BackendLoadTests(unittest.TestCase):
    """Each backend's `load` imports its library, loads the model and really transcribes the clip (stand-in libraries)."""

    def test_mlx_load_transcribes_the_clip_through_the_public_call_and_requests_reuse_it(self) -> None:
        calls: list = []

        def fake_transcribe(audio_path, **kwargs):
            calls.append((audio_path, kwargs))
            return {"text": " hi ", "language": "en"}

        fake_mlx = ModuleType("mlx_whisper")
        fake_mlx.transcribe = fake_transcribe  # type: ignore[attr-defined]
        backend = voice_input_worker.MlxBackend("/models/whisper-small-mlx")
        with mock.patch.dict("sys.modules", {"mlx_whisper": fake_mlx}):
            backend.load("/tmp/warm-up.wav")
        self.assertEqual(calls, [("/tmp/warm-up.wav", {"path_or_hf_repo": "/models/whisper-small-mlx", "language": "en"})])
        # Requests use what `load` imported: no library import after the start.
        with mock.patch.dict("sys.modules", {"mlx_whisper": None}):
            result = backend.transcribe_file("/tmp/request.wav", None)
        self.assertEqual(result, voice_input_worker.TranscriptionResult(text="hi", detected_language="en"))
        self.assertEqual(calls[-1], ("/tmp/request.wav", {"path_or_hf_repo": "/models/whisper-small-mlx"}))

    def test_faster_whisper_load_builds_the_model_and_decodes_the_clip_without_voice_detection(self) -> None:
        constructed: list = []
        transcribed: list = []
        consumed: list = []

        class FakeWhisperModel:
            def __init__(self, model_path, **kwargs):
                constructed.append((model_path, kwargs))

            def transcribe(self, audio_path, **kwargs):
                transcribed.append((audio_path, kwargs))

                def segments():
                    consumed.append(audio_path)
                    yield type("Segment", (), {"text": " hi "})()
                return segments(), type("Info", (), {"language": "en"})()

        fake_fw = ModuleType("faster_whisper")
        fake_fw.WhisperModel = FakeWhisperModel  # type: ignore[attr-defined]
        backend = voice_input_worker.FasterWhisperBackend("/models/faster-whisper-small")
        with mock.patch.dict("sys.modules", {"faster_whisper": fake_fw}):
            backend.load("/tmp/warm-up.wav")
        self.assertEqual(constructed, [("/models/faster-whisper-small", {"device": "cpu", "compute_type": "int8"})])
        self.assertEqual(transcribed, [("/tmp/warm-up.wav", {
            "language": "en", "vad_filter": False, "beam_size": 1, "condition_on_previous_text": False,
        })])
        self.assertEqual(consumed, ["/tmp/warm-up.wav"])
        with mock.patch.dict("sys.modules", {"faster_whisper": None}):
            result = backend.transcribe_file("/tmp/request.wav", "en")
        self.assertEqual(result, voice_input_worker.TranscriptionResult(text="hi", detected_language="en"))
        self.assertEqual(transcribed[-1][1]["vad_filter"], True)
        self.assertEqual(len(constructed), 1)


def rt010_cases() -> list:
    """The synthetic PCM cases of RT-010 (probes/rms_equivalence.py), generated in the same order with the same seed."""
    random.seed(7)
    cases = []
    for width, low, high in [(1, -128, 127), (2, -32768, 32767), (4, -2**31, 2**31 - 1)]:
        code = {1: "b", 2: "h", 4: "i"}[width]
        for name, values in [
            ("silence", [0] * 4000), ("quiet", [random.randint(-90, 90) for _ in range(4000)]),
            ("threshold", [119, -119, 120, -120] * 1000), ("full-scale", [high, low] * 2000),
            ("random", [random.randint(low, high) for _ in range(4000)]),
        ]:
            samples = array.array(code, values)
            if sys.byteorder == "big":
                samples.byteswap()
            cases.append((f"{name}-w{width}", samples.tobytes(), width))
    return cases


def pcm24(values: list) -> bytes:
    return b"".join(value.to_bytes(3, "little", signed=True) for value in values)


class LoudnessTests(unittest.TestCase):
    """`pcm_rms` gives the values `audioop.rms` gave (RT-010, evidence/P5-rms-equivalence.txt), without `audioop`."""

    RT010_VALUES = {
        "silence-w1": 0, "quiet-w1": 52, "threshold-w1": 119, "full-scale-w1": 127, "random-w1": 73,
        "silence-w2": 0, "quiet-w2": 52, "threshold-w2": 119, "full-scale-w2": 32767, "random-w2": 18698,
        "silence-w4": 0, "quiet-w4": 51, "threshold-w4": 119, "full-scale-w4": 2147483647, "random-w4": 1231625032,
    }

    def test_equals_the_audioop_values_of_rt010(self) -> None:
        results = {name: voice_input_worker.pcm_rms(payload, width) for name, payload, width in rt010_cases()}
        self.assertEqual(results, self.RT010_VALUES)

    def test_three_byte_samples(self) -> None:
        self.assertEqual(voice_input_worker.pcm_rms(pcm24([119, -119, 120, -120] * 10), 3), 119)
        self.assertEqual(voice_input_worker.pcm_rms(pcm24([8388607, -8388608] * 10), 3), 8388607)

    def test_empty_payload_is_zero_and_a_partial_trailing_sample_is_ignored(self) -> None:
        self.assertEqual(voice_input_worker.pcm_rms(b"", 2), 0)
        self.assertEqual(voice_input_worker.pcm_rms(b"\x10", 2), 0)
        self.assertEqual(voice_input_worker.pcm_rms(struct.pack("<hh", 300, -300) + b"\x10", 2), 300)


class StartFailureProcessTests(unittest.TestCase):
    """AC-007: the worker file run as the launcher runs it; import-time output counts too."""

    def test_missing_model_folder_gives_no_stdout_one_stderr_line_and_exit_1(self) -> None:
        with tempfile.TemporaryDirectory(prefix="voice-input-worker-process-") as temp_dir_name:
            missing = str(Path(temp_dir_name) / "no-such-model")
            completed = subprocess.run(
                [sys.executable, str(MODULE_PATH), "serve", "--backend", "mlx", "--model-path", missing],
                stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=60,
            )
        self.assertEqual(completed.stdout, "")
        lines = completed.stderr.strip().splitlines()
        self.assertEqual(len(lines), 1, completed.stderr)
        self.assertTrue(lines[0].startswith("Voice Input worker could not start the mlx backend:"), lines[0])
        self.assertEqual(completed.returncode, 1)


if __name__ == "__main__":
    unittest.main()
