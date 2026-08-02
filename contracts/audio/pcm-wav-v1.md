# Audio Contract 1

Accepted input is one ordinary absolute local RIFF/WAVE file containing signed
PCM 16-bit little-endian, one channel, 16,000 Hz, 150–30,000 ms. RIFF/chunk sizes
must be exact; malformed, truncated, duplicate data, unsupported chunks after
data, and inconsistent trailing bytes fail. The provider reads but never copies,
deletes, logs, or uploads the file. Deterministic RMS below 0.0005 produces the
successful `no-speech` outcome. No decoder, resampler, or external media tool is
part of this contract.
