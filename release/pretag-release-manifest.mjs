#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  sha256,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import {
  compareFileName,
  providerArchiveSetDigest,
  verifyExactProviderArchiveSet,
} from "./provider-archive-set.mjs";
import { verifyQualifiedCandidate } from "./qualified-release-candidate.mjs";

export async function assemblePreTagReleaseManifest({
  candidate,
  releaseEvidencePath,
  catalogPath,
  output,
}) {
  const candidateRoot = path.resolve(candidate),
    candidateManifest = await verifyQualifiedCandidate(candidateRoot),
    qualificationSetPath = path.join(
      candidateRoot,
      "qualification-set-v2.json",
    ),
    assets = path.join(candidateRoot, "assets"),
    qset = await readJson(qualificationSetPath),
    evidence = await readJson(releaseEvidencePath),
    catalog = await readJson(catalogPath);
  await validate(
    qset,
    "contracts/release/qualification-set-v2.schema.json",
    "Qualification Set",
  );
  await validate(
    evidence,
    "contracts/release/release-qualification-evidence-v2.schema.json",
    "Release Evidence",
  );
  await validate(
    catalog,
    "contracts/catalog/voice-runtime-catalog-v3.schema.json",
    "Catalog 3",
  );
  if (
    evidence.qualificationSet.sha256 !==
      (await shaFile(qualificationSetPath)) ||
    evidence.qualifiedCandidate.sha256 !==
      (await shaFile(
        path.join(candidateRoot, "qualified-release-candidate-v1.json"),
      )) ||
    candidateManifest.decision !== "promoted" ||
    catalog.releaseEvidence.sha256 !== (await shaFile(releaseEvidencePath)) ||
    catalog.sourceCommit !== evidence.sourceCommit ||
    evidence.qualifiedSourceCommit !== qset.sourceCommit ||
    catalog.runtimeVersion !== evidence.intendedRelease.runtimeVersion ||
    catalog.releaseTag !== evidence.intendedRelease.releaseTag ||
    catalog.releaseMatrix.sha256 !== qset.releaseMatrix.sha256 ||
    catalog.entries.length !== 2
  )
    throw new Error("Pre-tag input chain mismatch.");
  const providerArchives = await verifyExactProviderArchiveSet(
    assets,
    evidence.expectedProviderArchives.items,
  );
  const catalogIdentity = await fileIdentity(catalogPath),
    evidenceIdentity = await fileIdentity(releaseEvidencePath),
    qsetIdentity = await fileIdentity(qualificationSetPath),
    payload = [catalogIdentity, evidenceIdentity, ...providerArchives].sort(
      compareFileName,
    );
  const manifest = {
    schemaVersion: 2,
    intendedRelease: {
      runtimeVersion: catalog.runtimeVersion,
      releaseTag: catalog.releaseTag,
      sourceCommit: catalog.sourceCommit,
    },
    releaseMatrix: qset.releaseMatrix,
    qualificationSet: {
      ...qsetIdentity,
      fileName: "qualification-set-v2.json",
    },
    releaseEvidence: {
      ...evidenceIdentity,
      fileName: "release-qualification-evidence-v2.json",
    },
    catalog: { ...catalogIdentity, fileName: "voice-runtime-catalog-v3.json" },
    providerArchives: {
      sha256: providerArchiveSetDigest(providerArchives),
      items: providerArchives,
    },
    publishedPayloadSetSha256: sha256(Buffer.from(JSON.stringify(payload))),
  };
  await validate(
    manifest,
    "contracts/release/pretag-release-manifest-v2.schema.json",
    "Pre-Tag Manifest",
  );
  await writeJson(path.resolve(output), manifest);
  return manifest;
}

async function fileIdentity(file) {
  const info = await fs.stat(file);
  return {
    fileName: path.basename(file),
    sizeBytes: info.size,
    sha256: await shaFile(file),
  };
}

async function validate(value, schemaPath, label) {
  const schema = await readJson(path.join(ROOT, schemaPath));
  const check = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "candidate",
    "release-evidence",
    "catalog",
    "output",
  ]);
  await assemblePreTagReleaseManifest({
    candidate: path.resolve(args.candidate),
    releaseEvidencePath: path.resolve(args["release-evidence"]),
    catalogPath: path.resolve(args.catalog),
    output: path.resolve(args.output),
  });
}
