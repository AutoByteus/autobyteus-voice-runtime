#!/usr/bin/env python3
"""Aggregate transcript accuracy and operational results from the controlled study."""

import argparse
import json
import re
import statistics
import unicodedata
from pathlib import Path

from jiwer import cer, wer
from opencc import OpenCC


T2S = OpenCC("t2s")


def normalize_english(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    value = re.sub(r"[^a-z0-9']+", " ", value)
    return " ".join(value.split())


def normalize_chinese(value: str) -> str:
    value = T2S.convert(unicodedata.normalize("NFKC", value)).lower()
    return "".join(character for character in value if "\u4e00" <= character <= "\u9fff" or character.isascii() and character.isalnum())


def normalize_chinese_raw_script(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    return "".join(character for character in value if "\u4e00" <= character <= "\u9fff" or character.isascii() and character.isalnum())


def mean(values: list[float]) -> float:
    return round(statistics.fmean(values), 6) if values else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    reports = []
    for raw_path in args.paths:
        path = Path(raw_path)
        raw = json.loads(path.read_text(encoding="utf-8"))
        samples = raw["warmSession"]["quality"]
        per_clip = []
        raw_chinese_pairs = []
        for sample in samples:
            reference = sample["reference"]
            hypothesis = sample["response"]["text"]
            if raw["language"] == "en":
                normalized_reference = normalize_english(reference)
                normalized_hypothesis = normalize_english(hypothesis)
                error_rate = wer(normalized_reference, normalized_hypothesis)
                metric = "WER"
            else:
                normalized_reference = normalize_chinese(reference)
                normalized_hypothesis = normalize_chinese(hypothesis)
                error_rate = cer(normalized_reference, normalized_hypothesis)
                metric = "CER-after-T2S"
                raw_chinese_pairs.append((normalize_chinese_raw_script(reference), normalize_chinese_raw_script(hypothesis)))
            per_clip.append(
                {
                    "id": sample["id"],
                    "reference": reference,
                    "hypothesis": hypothesis,
                    "normalizedReference": normalized_reference,
                    "normalizedHypothesis": normalized_hypothesis,
                    "errorRate": round(error_rate, 6),
                    "requestRoundTripMs": sample["response"]["requestRoundTripMs"],
                }
            )
        joined_reference = " ".join(value["normalizedReference"] for value in per_clip) if raw["language"] == "en" else "".join(value["normalizedReference"] for value in per_clip)
        joined_hypothesis = " ".join(value["normalizedHypothesis"] for value in per_clip) if raw["language"] == "en" else "".join(value["normalizedHypothesis"] for value in per_clip)
        corpus_error = wer(joined_reference, joined_hypothesis) if raw["language"] == "en" else cer(joined_reference, joined_hypothesis)
        raw_script_corpus_error = None
        if raw["language"] == "zh":
            raw_script_corpus_error = cer(
                "".join(value[0] for value in raw_chinese_pairs),
                "".join(value[1] for value in raw_chinese_pairs),
            )
        reports.append(
            {
                "source": str(path),
                "backend": raw["backend"],
                "language": raw["language"],
                "metric": metric,
                "clipCount": len(per_clip),
                "corpusErrorRate": round(corpus_error, 6),
                "rawScriptCorpusErrorRate": round(raw_script_corpus_error, 6) if raw_script_corpus_error is not None else None,
                "macroClipErrorRate": mean([value["errorRate"] for value in per_clip]),
                "emptyHypotheses": sum(not value["normalizedHypothesis"] for value in per_clip),
                "operational": raw["summaries"],
                "perClip": per_clip,
            }
        )
    output = {"schemaVersion": 1, "reports": reports}
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for report in reports:
        print(report["backend"], report["language"], report["metric"], report["corpusErrorRate"], "macro", report["macroClipErrorRate"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
