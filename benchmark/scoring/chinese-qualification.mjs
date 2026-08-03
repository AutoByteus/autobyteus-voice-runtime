import fs from "node:fs";
import path from "node:path";
import { sha256 } from "../../build/lib/files.mjs";
import { errorRateFromUnits } from "./error-rate.mjs";

const CONTRACT_PATH = path.join(
    import.meta.dirname,
    "../../contracts/scoring/chinese-cer-selection-comparable-v1.json",
  ),
  MAP_PATH = path.join(
    import.meta.dirname,
    "../../contracts/scoring/opencc-t2s-scoring-map-v1.json",
  ),
  contractBytes = fs.readFileSync(CONTRACT_PATH),
  mapBytes = fs.readFileSync(MAP_PATH),
  contract = JSON.parse(contractBytes),
  mapping = JSON.parse(mapBytes),
  contractSha256 = sha256(contractBytes),
  mappingSha256 = sha256(mapBytes);

assertAuthority();
const normalization = trie(mapping.normalization),
  conversion = trie(mapping.conversion);

export const CHINESE_SCORING_AUTHORITY = Object.freeze({
  id: contract.contractId,
  fileName: path.basename(CONTRACT_PATH),
  sha256: contractSha256,
  mappingFileName: path.basename(MAP_PATH),
  mappingSha256,
});

export function normalizeChineseQualificationText(raw) {
  if (typeof raw !== "string")
    throw new Error("Chinese qualification input must be retained raw text.");
  return [
    ...convert(
      convert(raw.normalize("NFKC"), normalization),
      conversion,
    ).toLowerCase(),
  ]
    .filter(
      (character) =>
        (character >= "\u4e00" && character <= "\u9fff") ||
        /^[a-z0-9]$/.test(character),
    )
    .join("");
}

export function scoreChineseQualification({ rawReference, rawHypothesis }) {
  return errorRateFromUnits(
    [...normalizeChineseQualificationText(rawReference)],
    [...normalizeChineseQualificationText(rawHypothesis)],
  );
}

function assertAuthority() {
  if (
    contract.schemaVersion !== 1 ||
    contract.contractId !== "autobyteus-chinese-cer-selection-comparable-v1" ||
    contract.metric !== "CER" ||
    contract.runtimeOutputContractId !== "autobyteus-simplified-zh-v1" ||
    contract.mapping?.sha256 !== mappingSha256 ||
    contract.mapping?.fileName !== path.basename(MAP_PATH) ||
    contract.historicalEquivalenceGate?.lockedErrors !== 343 ||
    contract.historicalEquivalenceGate?.lockedUnits !== 6580 ||
    mapping.schemaVersion !== 1 ||
    mapping.source?.package !== "opencc-js" ||
    mapping.source?.version !== "1.4.1" ||
    mapping.source?.configuration !== "t2cn" ||
    !plainDictionary(mapping.normalization) ||
    !plainDictionary(mapping.conversion)
  )
    throw new Error("Chinese qualification scoring authority is invalid.");
}

function plainDictionary(value) {
  return (
    value &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([source, replacement]) => source && typeof replacement === "string",
    )
  );
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

function convert(value, root) {
  const input = [...value],
    output = [];
  for (let offset = 0; offset < input.length; ) {
    let node = root,
      best;
    for (let index = offset; index < input.length; index += 1) {
      node = node.get(input[index]);
      if (!node) break;
      if (Object.hasOwn(node, "replacement"))
        best = { end: index + 1, value: node.replacement };
    }
    if (best) {
      output.push(best.value);
      offset = best.end;
    } else {
      output.push(input[offset]);
      offset += 1;
    }
  }
  return output.join("");
}
