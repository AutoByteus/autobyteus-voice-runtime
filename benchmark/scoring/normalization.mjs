import fs from "node:fs";
import path from "node:path";

const mapping = JSON.parse(
  fs.readFileSync(
    path.resolve(
      import.meta.dirname,
      "../../contracts/normalization/twp-to-cn-v1.json",
    ),
    "utf8",
  ),
);
assertMapping(mapping);
const normalizer = trie(mapping.normalization);
const segmenter = trie(mapping.segmentation);
const conversionStages = mapping.conversionStages.map(trie);

function assertMapping(value) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    Object.keys(value).sort().join(",") !==
      "conversionStages,normalization,schemaVersion,segmentation,source" ||
    value.source?.package !== "opencc-js" ||
    value.source?.version !== "1.4.1" ||
    value.source?.configuration !== "twp-to-cn" ||
    !Array.isArray(value.conversionStages) ||
    value.conversionStages.length !== 2
  )
    throw new Error("Invalid canonical normalization mapping.");
  for (const dictionary of [
    value.normalization,
    value.segmentation,
    ...value.conversionStages,
  ])
    if (
      !dictionary ||
      Array.isArray(dictionary) ||
      Object.entries(dictionary).some(
        ([source, replacement]) => !source || typeof replacement !== "string",
      )
    )
      throw new Error("Invalid canonical normalization dictionary.");
}

function trie(dictionary) {
  const root = new Map();
  for (const [source, replacement] of Object.entries(dictionary)) {
    let node = root;
    for (const character of source) {
      if (!node.has(character)) node.set(character, new Map());
      node = node.get(character);
    }
    node.replacement = replacement;
  }
  return root;
}

function match(input, offset, root) {
  let node = root;
  let best;
  for (let index = offset; index < input.length; index += 1) {
    node = node.get(input[index]);
    if (!node) break;
    if (Object.hasOwn(node, "replacement"))
      best = { end: index + 1, value: node.replacement };
  }
  return best;
}

function convert(value, dictionary) {
  const input = [...value];
  const output = [];
  for (let index = 0; index < input.length; ) {
    const matched = match(input, index, dictionary);
    if (matched) {
      output.push(matched.value);
      index = matched.end;
    } else {
      output.push(input[index]);
      index += 1;
    }
  }
  return output.join("");
}

function segments(value) {
  const input = [...value];
  const result = [];
  let unmatched = "";
  for (let index = 0; index < input.length; ) {
    const matched = match(input, index, segmenter);
    if (matched) {
      if (unmatched) result.push(unmatched);
      unmatched = "";
      result.push(input.slice(index, matched.end).join(""));
      index = matched.end;
    } else {
      unmatched += input[index];
      index += 1;
    }
  }
  if (unmatched) result.push(unmatched);
  return result;
}

function traditionalToSimplified(value) {
  const normalized = convert(value, normalizer);
  return segments(normalized)
    .map((segment) =>
      conversionStages.reduce(
        (converted, dictionary) => convert(converted, dictionary),
        segment,
      ),
    )
    .join("");
}

export function normalizeTranscript(raw, profileId) {
  let value = raw.normalize("NFKC").replace(/\s+/gu, " ").trim();
  if (profileId === "english") return value;
  if (profileId !== "chinese" && profileId !== "auto")
    throw new Error("Unknown normalization profile.");
  if (!/[\p{Script=Han}]/u.test(value)) return value;
  value = traditionalToSimplified(value)
    .replace(/(?<!\d),|,(?!\d)/g, "，")
    .replace(/(?<!\d)\.|\.(?!\d)/g, "。")
    .replace(/!/g, "！")
    .replace(/\?/g, "？")
    .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, "")
    .replace(/\s+([，。！？])/gu, "$1")
    .replace(/([，。！？])\s+/gu, "$1");
  return value;
}

export function englishWerUnits(value) {
  return normalizeTranscript(value, "english")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}
