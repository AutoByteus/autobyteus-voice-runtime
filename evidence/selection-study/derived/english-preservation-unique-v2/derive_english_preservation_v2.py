#!/usr/bin/env python3
"""Derive the unique English preservation corpus and baseline from locked SR-004 evidence.

This is a projection, not a new inference run. It removes duplicate counting without
altering the immutable source corpus/results. A repeated operational identity is
collapsed only when its projected corpus fields and normalized transcript/error
facts agree. The earliest executed occurrence is retained; the rule never looks at
recognition quality when choosing the survivor.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import unicodedata
from pathlib import Path

SOURCE_DIGESTS = {
    "evidence/backend-selection/corpus-manifests/fleurs-controlled-v1.json": "23fb64edbf1f307ec78e11ed0953030fa829e42a27bb1c7889dfed4a5d9b1f51",
    "evidence/backend-selection/results/controlled-mlx-fp16-en.json": "41130ffff80dcabb59c442116201a8ea965e01d1a64513e32a5bc6c1f012f3e3",
    "evidence/backend-selection/results/quality-mlx.json": "af259491e92344c9952c2d2d8e15adf23ad5576946e6165344843613202e86c0",
    "evidence/backend-selection/harness/analyze_results.py": "a2c322fd9c3fbf2cb5bba4425761429e7209d39a9eb3a2323ecfe14aaf3f0176",
}

OUTPUT_NAMES = {
    "corpus": "english-v2.corpus.json",
    "raw": "english-v2.promoted-result.json",
    "quality": "english-v2.promoted-quality.json",
    "baseline": "english-v2.baseline.json",
    "record": "english-v2.trusted-baseline-record.json",
    "authority": "authority.json",
}

RUNTIME_TARGETS = {
    "corpus": "release/evidence/qualification-corpora/english-v2.json",
    "raw": "evidence/selection-study/derived/english-preservation-unique-v2/controlled-mlx-fp16-en-unique-v2.json",
    "quality": "evidence/selection-study/derived/english-preservation-unique-v2/quality-mlx-en-unique-v2.json",
    "baseline": "release/evidence/baselines/english-v2.json",
    "record": "release/evidence/trusted-baselines-v1.json#profileId=english",
    "authority": "evidence/selection-study/derived/english-preservation-unique-v2/authority.json",
    "script": "evidence/selection-study/derived/english-preservation-unique-v2/derive_english_preservation_v2.py",
}


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def json_bytes(value) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def write_json(path: Path, value) -> str:
    data = json_bytes(value)
    path.write_bytes(data)
    return sha_bytes(data)


def normalize_english(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    value = re.sub(r"[^a-z0-9']+", " ", value)
    return " ".join(value.split())


def edit_distance(left: list[str], right: list[str]) -> int:
    previous = list(range(len(right) + 1))
    for left_index, left_unit in enumerate(left, 1):
        current = [left_index]
        for right_index, right_unit in enumerate(right, 1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[right_index] + 1,
                    previous[right_index - 1] + (left_unit != right_unit),
                )
            )
        previous = current
    return previous[-1]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--ticket-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="voice-input-runtime-reliability ticket root",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent,
    )
    args = parser.parse_args()
    ticket_root = args.ticket_root.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    sources = {}
    for relative, expected in SOURCE_DIGESTS.items():
        source = ticket_root / relative
        actual = sha_file(source)
        require(actual == expected, f"locked source digest mismatch: {relative}")
        sources[relative] = source

    source_manifest = read_json(
        sources["evidence/backend-selection/corpus-manifests/fleurs-controlled-v1.json"]
    )
    source_raw = read_json(
        sources["evidence/backend-selection/results/controlled-mlx-fp16-en.json"]
    )
    source_quality = read_json(
        sources["evidence/backend-selection/results/quality-mlx.json"]
    )
    english_rows = [
        (combined_index, row)
        for combined_index, row in enumerate(source_manifest["clips"])
        if row["languageMode"] == "en"
    ]
    raw_rows = source_raw["warmSession"]["quality"]
    quality_report = next(
        report for report in source_quality["reports"] if report["language"] == "en"
    )
    quality_rows = quality_report["perClip"]
    require(len(english_rows) == 50, "locked English source must contain 50 rows")
    require(len(raw_rows) == 50, "locked English raw result must contain 50 rows")
    require(len(quality_rows) == 50, "locked English quality result must contain 50 rows")

    retained = []
    duplicate_groups = []
    by_identity = {}
    for english_index, ((combined_index, row), raw, quality) in enumerate(
        zip(english_rows, raw_rows, quality_rows)
    ):
        require(row["id"] == raw["id"] == quality["id"], "source row order/identity mismatch")
        normalized_reference = normalize_english(raw["reference"])
        normalized_hypothesis = normalize_english(raw["response"]["text"])
        require(
            quality["normalizedReference"] == normalized_reference
            and quality["normalizedHypothesis"] == normalized_hypothesis,
            f"locked scorer normalization mismatch: {row['id']}",
        )
        reference_units = normalized_reference.split()
        hypothesis_units = normalized_hypothesis.split()
        errors = edit_distance(reference_units, hypothesis_units)
        require(
            abs(quality["errorRate"] - round(errors / len(reference_units), 6)) <= 0.000001,
            f"locked scorer error mismatch: {row['id']}",
        )
        projected = {
            "id": row["id"],
            "audioPath": row["path"],
            "audioSha256": row["sha256"],
            "reference": row["reference"],
            "consentReference": "FLEURS CC-BY-4.0 dataset record and locked source manifest",
        }
        identity = (projected["id"], projected["audioPath"], projected["audioSha256"])
        candidate = {
            "sourceEnglishIndex": english_index,
            "sourceCombinedIndex": combined_index,
            "projected": projected,
            "raw": raw,
            "quality": quality,
            "normalizedReference": normalized_reference,
            "normalizedHypothesis": normalized_hypothesis,
            "errors": errors,
            "units": len(reference_units),
        }
        if identity not in by_identity:
            by_identity[identity] = candidate
            retained.append(candidate)
            continue
        survivor = by_identity[identity]
        require(
            projected == survivor["projected"],
            f"duplicate identity has conflicting qualification fields: {row['id']}",
        )
        require(
            normalized_reference == survivor["normalizedReference"]
            and normalized_hypothesis == survivor["normalizedHypothesis"]
            and errors == survivor["errors"]
            and len(reference_units) == survivor["units"],
            f"duplicate identity has conflicting transcript/error facts: {row['id']}",
        )
        duplicate_groups.append(
            {
                "identity": {
                    "id": projected["id"],
                    "audioPath": projected["audioPath"],
                    "audioSha256": projected["audioSha256"],
                },
                "retainedSourceEnglishIndex": survivor["sourceEnglishIndex"],
                "retainedSourceCombinedIndex": survivor["sourceCombinedIndex"],
                "collapsedSourceEnglishIndex": english_index,
                "collapsedSourceCombinedIndex": combined_index,
                "normalizedTranscriptAndErrorFactsEqual": True,
            }
        )

    require(len(retained) == 49, "unique English projection must contain 49 identities")
    require(len(duplicate_groups) == 1, "expected exactly one English duplicate group")
    require(
        duplicate_groups[0]["identity"]["id"] == "fleurs-en-2009"
        and duplicate_groups[0]["identity"]["audioSha256"]
        == "d6b0b81a9bebf170ea3443b629cf2fa5a38ffcd6cbb2cbc99c50506ef8dc6fe7",
        "unexpected duplicate identity",
    )

    derivation_summary = {
        "derivationId": "english-preservation-stable-identity-collapse-v2",
        "kind": "immutable-source-projection",
        "rule": "Preserve locked source order; retain the first occurrence of each exact (id, path, audioSha256) identity; collapse a later occurrence only when projected corpus fields and normalized transcript/error facts agree; otherwise fail.",
        "selectionUsesRecognitionQuality": False,
        "sourceSampleCount": 50,
        "finalUniqueSampleCount": 49,
        "duplicateGroups": duplicate_groups,
    }

    corpus = {
        "schemaVersion": 1,
        "corpusId": "fleurs-english-preservation-unique-v2",
        "profileId": "english",
        "metric": "WER",
        "license": "CC-BY-4.0",
        "provenanceReference": RUNTIME_TARGETS["authority"],
        "redistributionApproved": True,
        "limitations": [
            "Derived without new inference from the immutable 50-row FLEURS control by exact operational-identity collapse; it contains 49 unique audio identities.",
            "The initial extractor selected one duplicated FLEURS source ID and wrote both rows to one path; source duration/gender metadata for that identity is ambiguous and is not claimed by this qualification corpus.",
            "FLEURS parquet does not expose speaker identity; gender labels are not speaker IDs, and the 49-identity projection makes no speaker or gender-balance claim.",
        ],
        "clips": [item["projected"] for item in retained],
    }
    corpus_path = output_dir / OUTPUT_NAMES["corpus"]
    corpus_sha = write_json(corpus_path, corpus)

    derived_raw = copy.deepcopy(source_raw)
    derived_raw["corpusId"] = corpus["corpusId"]
    derived_raw["warmSession"]["quality"] = [item["raw"] for item in retained]
    derived_raw["derivation"] = {
        **derivation_summary,
        "sourceManifestPath": "evidence/selection-study/corpus-manifests/fleurs-controlled-v1.json",
        "sourceManifestSha256": SOURCE_DIGESTS[
            "evidence/backend-selection/corpus-manifests/fleurs-controlled-v1.json"
        ],
        "sourceResultPath": "evidence/selection-study/results/controlled-mlx-fp16-en.json",
        "sourceResultSha256": SOURCE_DIGESTS[
            "evidence/backend-selection/results/controlled-mlx-fp16-en.json"
        ],
    }
    raw_path = output_dir / OUTPUT_NAMES["raw"]
    raw_sha = write_json(raw_path, derived_raw)

    total_errors = sum(item["errors"] for item in retained)
    total_units = sum(item["units"] for item in retained)
    baseline_value = total_errors / total_units
    per_clip = [item["quality"] for item in retained]
    derived_report = copy.deepcopy(quality_report)
    derived_report["source"] = RUNTIME_TARGETS["raw"]
    derived_report["clipCount"] = len(retained)
    derived_report["corpusErrorRate"] = round(baseline_value, 6)
    derived_report["macroClipErrorRate"] = round(
        sum(item["errorRate"] for item in per_clip) / len(per_clip), 6
    )
    derived_report["emptyHypotheses"] = sum(
        not item["normalizedHypothesis"] for item in per_clip
    )
    derived_report["perClip"] = per_clip
    derived_quality = {
        "schemaVersion": 1,
        "derivation": {
            **derivation_summary,
            "sourceQualityPath": "evidence/selection-study/results/quality-mlx.json",
            "sourceQualitySha256": SOURCE_DIGESTS[
                "evidence/backend-selection/results/quality-mlx.json"
            ],
            "scorerPath": "evidence/selection-study/harness/analyze_results.py",
            "scorerSha256": SOURCE_DIGESTS[
                "evidence/backend-selection/harness/analyze_results.py"
            ],
        },
        "reports": [derived_report],
    }
    quality_path = output_dir / OUTPUT_NAMES["quality"]
    quality_sha = write_json(quality_path, derived_quality)

    configuration = {
        "providerId": "autobyteus.voice.mlx-whisper-small",
        "modelId": "whisper-small-mlx-fp16",
        "engine": "mlx-whisper",
        "engineVersion": "0.4.3",
        "precision": "fp16",
        "language": "en",
        "temperature": 0,
        "conditionOnPreviousText": False,
        "promotedResultSha256": raw_sha,
    }
    configuration_digest = sha_bytes(
        (json.dumps(configuration, ensure_ascii=False, separators=(",", ":")) + "\n").encode(
            "utf-8"
        )
    )
    baseline = {
        "schemaVersion": 1,
        "baselineId": "english-promoted-baseline-unique-v2",
        "profileId": "english",
        "metric": "WER",
        "corpusManifestSha256": corpus_sha,
        "configurationDigest": configuration_digest,
        "providerId": configuration["providerId"],
        "modelId": configuration["modelId"],
        "value": baseline_value,
        "results": [
            {
                "clipId": item["projected"]["id"],
                "audioSha256": item["projected"]["audioSha256"],
                "errors": item["errors"],
                "units": item["units"],
            }
            for item in retained
        ],
    }
    baseline_path = output_dir / OUTPUT_NAMES["baseline"]
    baseline_sha = write_json(baseline_path, baseline)

    trusted_record = {
        "profileId": "english",
        "targets": ["darwin-arm64", "darwin-x64", "linux-x64", "win32-x64"],
        "baselineId": baseline["baselineId"],
        "evidencePath": RUNTIME_TARGETS["baseline"],
        "evidenceSha256": baseline_sha,
        "promotedResultPath": RUNTIME_TARGETS["raw"],
        "promotedResultSha256": raw_sha,
        "corpusManifestPath": RUNTIME_TARGETS["corpus"],
        "corpusManifestSha256": corpus_sha,
        "providerId": configuration["providerId"],
        "modelId": configuration["modelId"],
        "configurationDigest": configuration_digest,
        "metric": "WER",
        "sampleCount": len(retained),
        "value": baseline_value,
        "promotedQualityPath": RUNTIME_TARGETS["quality"],
        "promotedQualitySha256": quality_sha,
        "configuration": configuration,
    }
    record_path = output_dir / OUTPUT_NAMES["record"]
    record_sha = write_json(record_path, trusted_record)

    script_path = Path(__file__).resolve()
    source_authority = [
        {
            "role": role,
            "solutionPath": relative,
            "runtimePath": relative.replace("evidence/backend-selection/", "evidence/selection-study/"),
            "sha256": SOURCE_DIGESTS[relative],
        }
        for role, relative in [
            ("locked-corpus", "evidence/backend-selection/corpus-manifests/fleurs-controlled-v1.json"),
            ("locked-raw-result", "evidence/backend-selection/results/controlled-mlx-fp16-en.json"),
            ("locked-quality-analysis", "evidence/backend-selection/results/quality-mlx.json"),
            ("locked-scorer", "evidence/backend-selection/harness/analyze_results.py"),
        ]
    ]
    output_authority = {
        "corpus": {"solutionFile": OUTPUT_NAMES["corpus"], "runtimePath": RUNTIME_TARGETS["corpus"], "sha256": corpus_sha},
        "promotedResult": {"solutionFile": OUTPUT_NAMES["raw"], "runtimePath": RUNTIME_TARGETS["raw"], "sha256": raw_sha},
        "promotedQuality": {"solutionFile": OUTPUT_NAMES["quality"], "runtimePath": RUNTIME_TARGETS["quality"], "sha256": quality_sha},
        "baseline": {"solutionFile": OUTPUT_NAMES["baseline"], "runtimePath": RUNTIME_TARGETS["baseline"], "sha256": baseline_sha},
        "trustedBaselineRecord": {"solutionFile": OUTPUT_NAMES["record"], "runtimePath": RUNTIME_TARGETS["record"], "sha256": record_sha},
    }
    authority = {
        "schemaVersion": 1,
        "authorityId": "english-preservation-unique-v2",
        "status": "evidence-authorized-final-corpus-and-baseline",
        "profileId": "english",
        "decision": "preserve-whisper-small",
        "newInferencePerformed": False,
        "sourceAuthority": source_authority,
        "derivation": derivation_summary,
        "measurement": {
            "metric": "WER",
            "sampleCount": len(retained),
            "totalErrors": total_errors,
            "totalUnits": total_units,
            "value": baseline_value,
            "valuePercent": baseline_value * 100,
            "absoluteGatePercent": 8.0,
            "nonRegressionAllowanceAbsolutePercent": 0.5,
            "effectivePackageGatePercent": min(8.0, baseline_value * 100 + 0.5),
            "passesAbsoluteBaselineGate": baseline_value * 100 <= 8.0,
        },
        "outputs": output_authority,
        "derivationScript": {
            "solutionFile": script_path.name,
            "runtimePath": RUNTIME_TARGETS["script"],
            "sha256": sha_file(script_path),
        },
        "limitations": corpus["limitations"],
        "implementationDisposition": {
            "removeInvalidFinalAuthority": [
                "release/evidence/qualification-corpora/english-v1.json",
                "release/evidence/baselines/english-v1.json",
            ],
            "replaceEnglishTrustedBaselineRecordWith": OUTPUT_NAMES["record"],
            "preserveImmutableSourceEvidence": [item["runtimePath"] for item in source_authority],
            "requiredVerification": "Re-run this derivation from checksum-locked sources, byte-compare every output, validate the 49 real audio files, and assert one-to-one unique corpus/baseline identities before inference.",
        },
    }
    authority_path = output_dir / OUTPUT_NAMES["authority"]
    authority_sha = write_json(authority_path, authority)

    checksum_entries = []
    for path in sorted(output_dir.iterdir(), key=lambda item: item.name):
        if path.name == "SHA256SUMS.txt" or not path.is_file():
            continue
        checksum_entries.append(f"{sha_file(path)}  ./{path.name}")
    (output_dir / "SHA256SUMS.txt").write_text(
        "\n".join(checksum_entries) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "authoritySha256": authority_sha,
                "sampleCount": len(retained),
                "totalErrors": total_errors,
                "totalUnits": total_units,
                "wer": baseline_value,
                "werPercent": baseline_value * 100,
                "corpusSha256": corpus_sha,
                "baselineSha256": baseline_sha,
                "promotedResultSha256": raw_sha,
                "promotedQualitySha256": quality_sha,
                "trustedRecordSha256": record_sha,
                "configurationDigest": configuration_digest,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
