#!/usr/bin/env python3
import argparse
import audioop
import json
import sys
import traceback
import wave
from dataclasses import dataclass
from typing import Any, Optional


def normalize_language_mode(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    lowered = value.strip().lower()
    if lowered == "auto":
        return None
    if lowered in {"en", "zh"}:
        return lowered
    return None


def is_probable_no_speech(audio_path: str) -> bool:
    with wave.open(audio_path, "rb") as wav_file:
        frame_count = wav_file.getnframes()
        sample_rate = wav_file.getframerate() or 16000
        sample_width = wav_file.getsampwidth()
        payload = wav_file.readframes(frame_count)

    if frame_count == 0 or not payload:
      return True

    duration_seconds = frame_count / float(sample_rate)
    if duration_seconds < 0.15:
        return True

    rms = audioop.rms(payload, sample_width)
    return rms < 120


@dataclass
class TranscriptionResult:
    text: str
    detected_language: Optional[str]


class Backend:
    def transcribe_file(self, audio_path: str, language_mode: Optional[str]) -> TranscriptionResult:
        raise NotImplementedError


class MlxBackend(Backend):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self._transcribe = None

    def _ensure_transcribe(self):
        if self._transcribe is not None:
            return self._transcribe
        from mlx_whisper import transcribe  # type: ignore

        self._transcribe = transcribe
        return self._transcribe

    def transcribe_file(self, audio_path: str, language_mode: Optional[str]) -> TranscriptionResult:
        transcribe = self._ensure_transcribe()
        kwargs: dict[str, Any] = {
            "path_or_hf_repo": self.model_path,
        }
        if language_mode:
            kwargs["language"] = language_mode
        result = transcribe(audio_path, **kwargs)
        text = str(result.get("text", "")).strip()
        detected_language = result.get("language")
        return TranscriptionResult(text=text, detected_language=detected_language)


class FasterWhisperBackend(Backend):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self._model = None

    def _ensure_model(self):
        if self._model is not None:
            return self._model
        from faster_whisper import WhisperModel  # type: ignore

        self._model = WhisperModel(
            self.model_path,
            device="cpu",
            compute_type="int8",
        )
        return self._model

    def transcribe_file(self, audio_path: str, language_mode: Optional[str]) -> TranscriptionResult:
        model = self._ensure_model()
        segments, info = model.transcribe(
            audio_path,
            language=language_mode,
            vad_filter=True,
            beam_size=1,
            condition_on_previous_text=False,
        )
        parts = [segment.text.strip() for segment in segments if segment.text and segment.text.strip()]
        return TranscriptionResult(
            text=" ".join(parts).strip(),
            detected_language=getattr(info, "language", None),
        )


def build_backend(kind: str, model_path: str) -> Backend:
    if kind == "mlx":
        return MlxBackend(model_path)
    if kind == "faster-whisper":
        return FasterWhisperBackend(model_path)
    raise ValueError(f"Unsupported backend kind: {kind}")


def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()


def main() -> int:
    parser = argparse.ArgumentParser(description="AutoByteus Voice Input worker")
    parser.add_argument("--backend", choices=["mlx", "faster-whisper"], required=True)
    parser.add_argument("--model-path", required=True)
    args = parser.parse_args()

    backend = build_backend(args.backend, args.model_path)
    emit({
        "type": "ready",
        "backendKind": args.backend,
    })

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        request_id: str | None = None
        try:
            payload = json.loads(line)
            request_id = payload.get("requestId")
            if payload.get("type") != "transcribe-file":
                emit({
                    "requestId": request_id,
                    "ok": False,
                    "text": "",
                    "detectedLanguage": None,
                    "noSpeech": False,
                    "error": f"Unsupported request type: {payload.get('type')}",
                })
                continue

            audio_path = payload["audioPath"]
            language_mode = normalize_language_mode(payload.get("languageMode"))

            if is_probable_no_speech(audio_path):
                emit({
                    "requestId": request_id,
                    "ok": True,
                    "text": "",
                    "detectedLanguage": None,
                    "noSpeech": True,
                    "error": None,
                })
                continue

            result = backend.transcribe_file(audio_path, language_mode)
            emit({
                "requestId": request_id,
                "ok": True,
                "text": result.text,
                "detectedLanguage": result.detected_language,
                "noSpeech": False,
                "error": None,
            })
        except Exception as error:  # pragma: no cover - exercised through integration
            emit({
                "requestId": request_id,
                "ok": False,
                "text": "",
                "detectedLanguage": None,
                "noSpeech": False,
                "error": f"{error.__class__.__name__}: {error}",
            })
            traceback.print_exc(file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
