class FasterWhisperRecognizer:
    def __init__(self, session):
        self.session = session
        self.model_path = str(session.resolve_directory(session.descriptor["model"]["root"]))
        self._model = None
    def prepare(self):
        from faster_whisper import WhisperModel
        self._model = WhisperModel(self.model_path, device="cpu", compute_type="int8", cpu_threads=4, local_files_only=True)
    def transcribe(self, samples):
        import numpy as np
        audio = np.frombuffer(samples, dtype="<i2").astype(np.float32) / 32768.0
        segments, info = self._model.transcribe(audio, language="en", beam_size=5, condition_on_previous_text=False)
        return "".join(segment.text for segment in segments), info.language if info.language in ("en", "zh") else "unknown"
    def close(self):
        self._model = None
