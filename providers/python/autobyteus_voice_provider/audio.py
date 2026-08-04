import struct
import wave
from dataclasses import dataclass
from pathlib import Path

MIN_FRAMES = 2400
MAX_FRAMES = 480000
SILENCE_PEAK = 64

class InvalidAudio(ValueError):
    pass

@dataclass(frozen=True)
class AudioInput:
    samples: bytes
    duration_ms: int
    no_speech: bool

def read_audio(audio_path: str) -> AudioInput:
    path = Path(audio_path)
    if not path.is_absolute() or not path.is_file() or path.is_symlink():
        raise InvalidAudio("invalid-audio-path")
    try:
        with wave.open(str(path), "rb") as reader:
            if (reader.getnchannels(), reader.getsampwidth(), reader.getframerate(), reader.getcomptype()) != (1, 2, 16000, "NONE"):
                raise InvalidAudio("invalid-audio-format")
            frames = reader.getnframes()
            if not MIN_FRAMES <= frames <= MAX_FRAMES:
                raise InvalidAudio("invalid-audio-duration")
            samples = reader.readframes(frames)
            if len(samples) != frames * 2 or reader.readframes(1):
                raise InvalidAudio("truncated-audio")
        declared = struct.unpack_from("<I", path.read_bytes(), 4)[0]
        if declared + 8 != path.stat().st_size:
            raise InvalidAudio("invalid-riff-size")
    except (wave.Error, EOFError, OSError, struct.error) as error:
        if isinstance(error, InvalidAudio):
            raise
        raise InvalidAudio("malformed-wave") from error
    peak = max((abs(item[0]) for item in struct.iter_unpack("<h", samples)), default=0)
    return AudioInput(samples, round(frames * 1000 / 16000), peak <= SILENCE_PEAK)
