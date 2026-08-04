#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import CjkCompatibility from "opencc-js/dict/CJK_Compatibility_Ideographs";
import TsCharacters from "opencc-js/dict/TSCharacters";
import TsPhrases from "opencc-js/dict/TSPhrases";
import TwPhrasesRev from "opencc-js/dict/TWPhrasesRev";
import TwVariantsRev from "opencc-js/dict/TWVariantsRev";
import TwVariantsRevPhrases from "opencc-js/dict/TWVariantsRevPhrases";

const output = path.resolve(
  import.meta.dirname,
  "../contracts/normalization/twp-to-cn-v1.json",
);

function parse(dictionary) {
  return dictionary.split("|").map((line) => {
    const separator = line.indexOf(" ");
    if (separator < 1 || separator === line.length - 1)
      throw new Error("Invalid pinned OpenCC dictionary entry.");
    return [line.slice(0, separator), line.slice(separator + 1)];
  });
}

function merge(...dictionaries) {
  const entries = new Map();
  for (const dictionary of dictionaries.toReversed())
    for (const [source, replacement] of parse(dictionary))
      entries.set(source, replacement);
  return Object.fromEntries(
    [...entries].sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
}

const value = {
  schemaVersion: 1,
  source: {
    package: "opencc-js",
    version: "1.4.1",
    configuration: "twp-to-cn",
    license: "MIT AND Apache-2.0",
  },
  normalization: merge(CjkCompatibility),
  segmentation: merge(TsPhrases),
  conversionStages: [
    merge(TwPhrasesRev, TwVariantsRevPhrases, TwVariantsRev),
    merge(TsPhrases, TsCharacters),
  ],
};
await fs.writeFile(output, `${JSON.stringify(value)}\n`);
