import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, shaFile, sha256, ROOT } from "../../build/lib/files.mjs";
const schema = await readJson(
  path.join(ROOT, "benchmark/corpus/corpus-v1.schema.json"),
);
export async function validateCorpus(manifestPath) {
  const manifest = await readJson(manifestPath);
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );
  if (!validate(manifest))
    throw new Error(
      `Invalid corpus: ${validate.errors.map((item) => item.instancePath + " " + item.message).join("; ")}`,
    );
  const root = path.dirname(path.resolve(manifestPath));
  const ids = new Set(),
    paths = new Set(),
    hashes = new Set();
  for (const clip of manifest.clips) {
    const audioPath = path.resolve(root, clip.audioPath);
    if (
      !audioPath.startsWith(root + path.sep) ||
      ids.has(clip.id) ||
      paths.has(audioPath) ||
      hashes.has(clip.audioSha256)
    )
      throw new Error("Corpus duplicate or contained-path violation.");
    if ((await shaFile(audioPath)) !== clip.audioSha256)
      throw new Error(`Corpus audio digest mismatch: ${clip.id}`);
    ids.add(clip.id);
    paths.add(audioPath);
    hashes.add(clip.audioSha256);
  }
  const consentReferenceDigest = sha256(
    Buffer.from(
      `${manifest.clips
        .map((item) => `${item.id}:${item.consentReference}`)
        .sort()
        .join("\n")}\n`,
    ),
  );
  return {
    manifest,
    root,
    corpusEvidence: {
      id: manifest.corpusId,
      manifestSha256: await shaFile(manifestPath),
      provenanceReference: manifest.provenanceReference,
      license: manifest.license,
      redistributionApproved: true,
      consentReferenceDigest,
      uniqueIds: true,
      uniquePaths: true,
      uniqueAudioHashes: true,
      limitations: manifest.limitations,
    },
  };
}
