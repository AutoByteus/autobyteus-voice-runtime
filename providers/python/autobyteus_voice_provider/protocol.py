import json
import sys
import time
import uuid
from .audio import InvalidAudio, read_audio
from .exact_json import ContractError

MAX_LINE = 1024 * 1024

class ProtocolWorker:
    def __init__(self, session, recognizer, normalizer):
        self.session, self.recognizer, self.normalizer = session, recognizer, normalizer
        self.state, self.used_ids = "bootstrap", set()

    def emit(self, value):
        data = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(data.encode()) > MAX_LINE:
            raise ContractError("outbound-frame-too-large")
        sys.stdout.write(data + "\n")
        sys.stdout.flush()

    def run(self):
        self.emit({"type":"hello","protocolVersion":1,"sessionId":self.session.session_id,"packageId":self.session.package_id,"providerId":self.session.provider_id,"modelId":self.session.model_id,"profileId":self.session.profile_id,"languageMode":self.session.language_mode,"target":{"platform":self.session.target[0],"architecture":self.session.target[1]},"capabilityDigest":self.session.capability_digest})
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"model-preparing"})
        self.state = "preparing"
        try:
            from .session import verify_complete_manifest
            verify_complete_manifest(self.session)
            self.recognizer.prepare()
        except Exception:
            self.emit({"type":"lifecycle","protocolVersion":1,"state":"failed","code":"MODEL_PREPARATION_FAILED"})
            return 1
        self.ready()
        for raw_line in sys.stdin.buffer:
            if len(raw_line) > MAX_LINE or not raw_line.endswith(b"\n"):
                return self.fail("PROTOCOL_INVALID")
            try:
                frame = json.loads(raw_line.decode("utf-8"))
                action = frame.get("type") if isinstance(frame, dict) else None
                if action == "transcribe-file":
                    self.transcribe(frame)
                elif action == "shutdown":
                    return self.shutdown(frame)
                else:
                    return self.fail("PROTOCOL_INVALID")
            except InvalidAudio:
                request_id = frame.get("requestId") if isinstance(frame, dict) else None
                self.emit({"type":"request-error","protocolVersion":1,"requestId":request_id,"code":"INVALID_AUDIO","retryable":False})
                self.ready()
            except (ContractError, UnicodeError, json.JSONDecodeError, KeyError, TypeError, ValueError):
                return self.fail("PROTOCOL_INVALID")
            except Exception:
                return self.fail("INFERENCE_FAILED")
        return self.fail("PROTOCOL_INVALID")

    def transcribe(self, frame):
        if set(frame) != {"type","protocolVersion","requestId","audioPath"} or frame["protocolVersion"] != 1 or self.state != "ready" or not _uuid(frame["requestId"]) or frame["requestId"] in self.used_ids or not isinstance(frame["audioPath"], str):
            raise ContractError("invalid-transcribe")
        request_id = frame["requestId"]
        self.used_ids.add(request_id)
        self.state = "busy"
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"transcribing","requestId":request_id})
        audio = read_audio(frame["audioPath"])
        started = time.monotonic_ns()
        if audio.no_speech:
            raw, detected = "", "unknown"
        else:
            raw, detected = self.recognizer.transcribe(audio.samples)
            if not isinstance(raw, str) or detected not in ("en", "zh", "unknown"):
                raise RuntimeError("invalid-engine-result")
        inference_ms = (time.monotonic_ns() - started) / 1_000_000
        normalize_started = time.monotonic_ns()
        normalized = self.normalizer.normalize(raw) if raw else ""
        normalization_ms = (time.monotonic_ns() - normalize_started) / 1_000_000
        self.emit({"type":"transcription-result","protocolVersion":1,"requestId":request_id,"outcome":"no-speech" if not raw else "transcript","rawText":raw,"normalizedText":normalized,"detectedLanguage":detected,"metrics":{"audioDurationMs":audio.duration_ms,"inferenceMs":inference_ms,"normalizationMs":normalization_ms}})
        self.ready()

    def ready(self):
        self.state = "ready"
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"inference-ready"})

    def shutdown(self, frame):
        if set(frame) != {"type","protocolVersion","requestId"} or frame["protocolVersion"] != 1 or self.state != "ready" or not _uuid(frame["requestId"]) or frame["requestId"] in self.used_ids:
            raise ContractError("invalid-shutdown")
        self.state = "shutting-down"
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"shutting-down"})
        self.recognizer.close()
        self.emit({"type":"shutdown-ack","protocolVersion":1,"requestId":frame["requestId"]})
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"stopped"})
        self.state = "stopped"
        return 0

    def fail(self, code):
        self.state = "failed"
        self.emit({"type":"lifecycle","protocolVersion":1,"state":"failed","code":code})
        return 1

def _uuid(value):
    try:
        return isinstance(value, str) and str(uuid.UUID(value)) == value.lower()
    except ValueError:
        return False
