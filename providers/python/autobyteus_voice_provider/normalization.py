from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

SPACE = re.compile(r"\s+")
HAN_SPACE = re.compile(r"(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])")
BEFORE_PUNCT = re.compile(r"\s+([,，.!！？?。])")
AFTER_ZH_PUNCT = re.compile(r"([，。！？])\s+")
END = object()


def _trie(dictionary: dict[str, str]) -> dict:
    root: dict = {}
    for source, replacement in dictionary.items():
        node = root
        for character in source:
            node = node.setdefault(character, {})
        node[END] = replacement
    return root


def _match(value: str, offset: int, trie: dict):
    node = trie
    best = None
    for index in range(offset, len(value)):
        node = node.get(value[index])
        if node is None:
            break
        if END in node:
            best = index + 1, node[END]
    return best


def _convert(value: str, trie: dict) -> str:
    output = []
    offset = 0
    while offset < len(value):
        matched = _match(value, offset, trie)
        if matched:
            offset, replacement = matched
            output.append(replacement)
        else:
            output.append(value[offset])
            offset += 1
    return "".join(output)


def _segments(value: str, trie: dict) -> list[str]:
    result = []
    unmatched = []
    offset = 0
    while offset < len(value):
        matched = _match(value, offset, trie)
        if matched:
            if unmatched:
                result.append("".join(unmatched))
                unmatched = []
            end, _ = matched
            result.append(value[offset:end])
            offset = end
        else:
            unmatched.append(value[offset])
            offset += 1
    if unmatched:
        result.append("".join(unmatched))
    return result


def _dictionary(value) -> dict[str, str]:
    if not isinstance(value, dict) or any(
        not isinstance(source, str)
        or not source
        or not isinstance(replacement, str)
        for source, replacement in value.items()
    ):
        raise ValueError("normalization-data-invalid")
    return value


class TranscriptNormalizer:
    def __init__(self, profile_id: str, mapping_path: Path | None = None):
        self.profile_id = profile_id
        self.normalizer = None
        self.segmenter = None
        self.stages = []
        if profile_id in ("chinese", "auto"):
            if mapping_path is None or not mapping_path.is_file():
                raise ValueError("normalization-data-missing")
            value = json.loads(mapping_path.read_text("utf-8"))
            expected = {"schemaVersion", "source", "normalization", "segmentation", "conversionStages"}
            source = value.get("source") if isinstance(value, dict) else None
            stages = value.get("conversionStages") if isinstance(value, dict) else None
            if (
                not isinstance(value, dict)
                or set(value) != expected
                or value["schemaVersion"] != 1
                or not isinstance(source, dict)
                or source.get("package") != "opencc-js"
                or source.get("version") != "1.4.1"
                or source.get("configuration") != "twp-to-cn"
                or not isinstance(stages, list)
                or len(stages) != 2
            ):
                raise ValueError("normalization-data-invalid")
            self.normalizer = _trie(_dictionary(value["normalization"]))
            self.segmenter = _trie(_dictionary(value["segmentation"]))
            self.stages = [_trie(_dictionary(stage)) for stage in stages]

    def _traditional_to_simplified(self, value: str) -> str:
        value = _convert(value, self.normalizer)
        output = []
        for segment in _segments(value, self.segmenter):
            for stage in self.stages:
                segment = _convert(segment, stage)
            output.append(segment)
        return "".join(output)

    def normalize(self, raw: str) -> str:
        value = SPACE.sub(" ", unicodedata.normalize("NFKC", raw)).strip()
        if self.profile_id in ("chinese", "auto") and re.search(r"[\u3400-\u9fff]", value):
            value = self._traditional_to_simplified(value)
            value = re.sub(r"(?<!\d),|,(?!\d)", "，", value)
            value = re.sub(r"(?<!\d)\.|\.(?!\d)", "。", value)
            value = value.replace("!", "！").replace("?", "？")
            value = HAN_SPACE.sub("", value)
            value = BEFORE_PUNCT.sub(r"\1", value)
            value = AFTER_ZH_PUNCT.sub(r"\1", value)
        return value
