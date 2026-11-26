"""Compare audioop.rms with a stdlib RMS (array + math) on real and synthetic PCM, widths 1, 2, 4.
Run with a Python that still has audioop (3.9-3.12)."""
import array, audioop, math, random, sys, wave

def stdlib_rms(payload: bytes, width: int) -> int:
    samples = array.array({1: "b", 2: "h", 4: "i"}[width], payload[: len(payload) - len(payload) % width])
    if sys.byteorder == "big":
        samples.byteswap()
    if not samples:
        return 0
    return int(math.sqrt(sum(s * s for s in samples) / len(samples)))

cases = []
for f in sys.argv[1:]:
    with wave.open(f, "rb") as w:
        cases.append((f.rsplit("/", 1)[-1], w.readframes(w.getnframes()), w.getsampwidth()))
random.seed(7)
for width, lo, hi in [(1, -128, 127), (2, -32768, 32767), (4, -2**31, 2**31 - 1)]:
    code = {1: "b", 2: "h", 4: "i"}[width]
    for name, vals in [("silence", [0] * 4000), ("quiet", [random.randint(-90, 90) for _ in range(4000)]),
                       ("threshold", [119, -119, 120, -120] * 1000), ("full-scale", [hi, lo] * 2000),
                       ("random", [random.randint(lo, hi) for _ in range(4000)])]:
        cases.append((f"{name}-w{width}", array.array(code, vals).tobytes(), width))
mismatch = 0
for name, payload, width in cases:
    a, b = audioop.rms(payload, width), stdlib_rms(payload, width)
    mismatch += a != b
    print(f"{name:18} width={width} audioop={a:>11} stdlib={b:>11} {'OK' if a == b else 'MISMATCH'}  noSpeech(<120): {a < 120}/{b < 120}")
print("mismatches:", mismatch, "of", len(cases))
