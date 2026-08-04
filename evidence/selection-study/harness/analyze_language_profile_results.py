#!/usr/bin/env python3
"""Paired bootstrap comparison for already-scored monolingual ASR results."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path


def edit_distance(left: str, right: str) -> int:
    previous = list(range(len(right) + 1))
    for row, left_item in enumerate(left, start=1):
        current = [row]
        for column, right_item in enumerate(right, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[column] + 1,
                    previous[column - 1] + (left_item != right_item),
                )
            )
        previous = current
    return previous[-1]


def load_report(path: Path, language: str) -> dict:
    value = json.loads(path.read_text())
    matches = [report for report in value["reports"] if report["language"] == language]
    if len(matches) != 1:
        raise ValueError(f"Expected one {language} report in {path}, found {len(matches)}")
    return matches[0]


def units(value: str, language: str) -> list[str] | str:
    return value.split() if language == "en" else value


def paired_rows(left: dict, right: dict, language: str) -> list[dict]:
    rows = []
    if len(left["perClip"]) != len(right["perClip"]):
        raise ValueError("Paired reports do not contain the same row count")
    for index, (left_row, right_row) in enumerate(zip(left["perClip"], right["perClip"])):
        clip_id = left_row["id"]
        if clip_id != right_row["id"]:
            raise ValueError(f"Paired report order/ID mismatch at row {index}")
        if left_row["normalizedReference"] != right_row["normalizedReference"]:
            raise ValueError(f"Reference mismatch for {clip_id}")
        reference = units(left_row["normalizedReference"], language)
        rows.append(
            {
                "id": clip_id,
                "occurrence": index,
                "referenceUnits": len(reference),
                "leftErrors": edit_distance(reference, units(left_row["normalizedHypothesis"], language)),
                "rightErrors": edit_distance(reference, units(right_row["normalizedHypothesis"], language)),
            }
        )
    return rows


def rate(rows: list[dict], key: str) -> float:
    return sum(row[key] for row in rows) / sum(row["referenceUnits"] for row in rows)


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    index = (len(ordered) - 1) * quantile
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = index - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--left", type=Path, required=True)
    parser.add_argument("--right", type=Path, required=True)
    parser.add_argument("--language", choices=["en", "zh"], required=True)
    parser.add_argument("--iterations", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=20_260_802)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    left = load_report(args.left, args.language)
    right = load_report(args.right, args.language)
    rows = paired_rows(left, right, args.language)
    left_rate = rate(rows, "leftErrors")
    right_rate = rate(rows, "rightErrors")

    randomizer = random.Random(args.seed)
    differences = []
    left_wins = right_wins = ties = 0
    for _ in range(args.iterations):
        sample = [rows[randomizer.randrange(len(rows))] for _ in rows]
        difference = rate(sample, "leftErrors") - rate(sample, "rightErrors")
        differences.append(difference)
        if difference < 0:
            left_wins += 1
        elif difference > 0:
            right_wins += 1
        else:
            ties += 1

    output = {
        "schemaVersion": 1,
        "method": "paired nonparametric clip bootstrap; corpus-weighted edit rate within each resample",
        "seed": args.seed,
        "iterations": args.iterations,
        "language": args.language,
        "metric": "WER" if args.language == "en" else "CER-after-T2S",
        "clipCount": len(rows),
        "left": {"backend": left["backend"], "source": str(args.left), "errorRate": left_rate},
        "right": {"backend": right["backend"], "source": str(args.right), "errorRate": right_rate},
        "differenceLeftMinusRight": left_rate - right_rate,
        "difference95PercentBootstrapInterval": [
            percentile(differences, 0.025),
            percentile(differences, 0.975),
        ],
        "bootstrapOutcomeProbability": {
            "leftLowerError": left_wins / args.iterations,
            "rightLowerError": right_wins / args.iterations,
            "equal": ties / args.iterations,
        },
        "limitation": f"{len(rows)} FLEURS clips; this quantifies uncertainty for this locked sample, not all user speech.",
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
