class MlxWhisperRecognizer:
    def __init__(self, session):
        self.session = session
        self.model_path = str(session.resolve_directory(session.descriptor["model"]["root"]))
        self._mlx_whisper = None
    def prepare(self):
        import mlx.core as mx
        import mlx_whisper
        from mlx_whisper.transcribe import ModelHolder
        self._mlx_whisper = mlx_whisper
        ModelHolder.get_model(self.model_path, mx.float16)
    def transcribe(self, samples):
        import numpy as np
        audio = np.frombuffer(samples, dtype="<i2").astype(np.float32) / 32768.0
        result = self._mlx_whisper.transcribe(audio, path_or_hf_repo=self.model_path, language="en", temperature=0.0, task="transcribe", condition_on_previous_text=False, verbose=None)
        return result["text"], "en"
    def close(self):
        self._mlx_whisper = None
