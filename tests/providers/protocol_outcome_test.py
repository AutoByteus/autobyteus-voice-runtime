import pathlib
import sys
import unittest
from types import SimpleNamespace
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "providers/python"))

from autobyteus_voice_provider.protocol import ProtocolWorker


class Recognizer:
    def __init__(self, result):
        self.result = result
        self.calls = 0

    def transcribe(self, samples):
        self.calls += 1
        return self.result


class Normalizer:
    def normalize(self, raw):
        return raw


class ProtocolOutcomeTest(unittest.TestCase):
    def worker(self, result):
        recognizer = Recognizer(result)
        worker = ProtocolWorker(SimpleNamespace(), recognizer, Normalizer())
        worker.state = "ready"
        frames = []
        worker.emit = frames.append
        return worker, recognizer, frames

    def test_empty_recognizer_result_for_speech_fails(self):
        for language in ("en", "zh"):
            worker, recognizer, frames = self.worker(("", language))
            audio = SimpleNamespace(no_speech=False, samples=b"speech", duration_ms=1000)
            with mock.patch("autobyteus_voice_provider.protocol.read_audio", return_value=audio):
                with self.assertRaisesRegex(RuntimeError, "empty-recognizer-result"):
                    worker.transcribe({"type":"transcribe-file", "protocolVersion":1, "requestId":"0198f0f0-7e65-7f72-9c3e-95b59eeb72b0", "audioPath":"/audio.wav"})
            self.assertEqual(recognizer.calls, 1)
            self.assertFalse(any(frame["type"] == "transcription-result" for frame in frames))

    def test_validator_no_speech_is_the_only_no_speech_outcome(self):
        worker, recognizer, frames = self.worker(("unexpected", "en"))
        audio = SimpleNamespace(no_speech=True, samples=b"", duration_ms=1000)
        with mock.patch("autobyteus_voice_provider.protocol.read_audio", return_value=audio):
            worker.transcribe({"type":"transcribe-file", "protocolVersion":1, "requestId":"0198f0f0-7e65-7f72-9c3e-95b59eeb72b0", "audioPath":"/audio.wav"})
        result = next(frame for frame in frames if frame["type"] == "transcription-result")
        self.assertEqual(result["outcome"], "no-speech")
        self.assertEqual(result["rawText"], "")
        self.assertEqual(recognizer.calls, 0)


if __name__ == "__main__":
    unittest.main()
