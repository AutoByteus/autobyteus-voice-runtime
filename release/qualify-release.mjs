#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";
import { verifyQualifiedCandidate } from "./qualified-release-candidate.mjs";
import { verifyCandidateApplicability } from "./assess-qualified-candidate.mjs";
import { assemblePreTagReleaseManifest } from "./pretag-release-manifest.mjs";
import { assembleReleaseEvidence } from "./evidence/assemble.mjs";
import { buildReleaseCatalog } from "./catalog-builder.mjs";

const run = promisify(execFile);

export async function qualifyRelease({
  candidate,
  promotionRecord,
  applicability,
  manifestPath,
  releaseEvidencePath,
  catalogPath,
  maintainedMainCommit,
  output,
}) {
  const candidateRoot = path.resolve(candidate),
    candidateManifest = await verifyQualifiedCandidate(candidateRoot),
    applicabilityValue = await verifyCandidateApplicability({
      candidate: candidateRoot,
      promotionRecord,
      applicability,
      finalMainCommit: maintainedMainCommit,
    }),
    manifest = await readJson(manifestPath),
    evidence = await readJson(releaseEvidencePath);
  if (
    candidateManifest.decision !== "promoted" ||
    applicabilityValue.decision !== "reuse-permitted" ||
    evidence.sourceCommit !== maintainedMainCommit ||
    evidence.sourceClosure.applicability.sha256 !==
      (await shaFile(applicability)) ||
    evidence.candidatePromotionRecord.sha256 !==
      (await shaFile(promotionRecord)) ||
    manifest.intendedRelease.sourceCommit !== maintainedMainCommit
  )
    throw new Error("Pre-tag candidate/final-main identity mismatch.");
  await assertTagAbsent(manifest.intendedRelease.releaseTag);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-pretag-verify-"));
  try {
    const expectedEvidence = path.join(
        work,
        "release-qualification-evidence-v2.json",
      ),
      expectedCatalog = path.join(work, "voice-runtime-catalog-v3.json"),
      expectedManifest = path.join(work, "pretag-release-manifest-v2.json"),
      catalog = await readJson(catalogPath),
      firstEntry = catalog.entries?.[0],
      suffix = `/${catalog.releaseTag}/${firstEntry?.archive?.fileName}`;
    if (!firstEntry?.archive?.url?.endsWith(suffix))
      throw new Error(
        "Catalog distribution URL cannot be independently derived.",
      );
    const baseUrl = firstEntry.archive.url.slice(0, -suffix.length);
    await assembleReleaseEvidence({
      candidate: candidateRoot,
      promotionRecord,
      applicability,
      runtimeVersion: catalog.runtimeVersion,
      releaseTag: catalog.releaseTag,
      maintainedMainCommit,
      output: expectedEvidence,
    });
    assertBytesEqual(
      await fs.readFile(releaseEvidencePath),
      await fs.readFile(expectedEvidence),
      "Release Evidence",
    );
    await buildReleaseCatalog({
      candidate: candidateRoot,
      releaseEvidencePath,
      releaseTag: catalog.releaseTag,
      baseUrl,
      output: expectedCatalog,
    });
    assertBytesEqual(
      await fs.readFile(catalogPath),
      await fs.readFile(expectedCatalog),
      "Catalog 3",
    );
    await assemblePreTagReleaseManifest({
      candidate: candidateRoot,
      releaseEvidencePath,
      catalogPath,
      output: expectedManifest,
    });
    assertBytesEqual(
      await fs.readFile(manifestPath),
      await fs.readFile(expectedManifest),
      "Pre-Tag Manifest",
    );
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
  const proof = {
    schemaVersion: 1,
    decision: "qualified-pre-tag",
    sourceCommit: maintainedMainCommit,
    candidateManifestSha256: evidence.qualifiedCandidate.sha256,
    applicabilitySha256: evidence.sourceClosure.applicability.sha256,
    releaseTag: manifest.intendedRelease.releaseTag,
    releaseMatrixSha256: manifest.releaseMatrix.sha256,
    qualificationSetSha256: evidence.qualificationSet.sha256,
    releaseEvidenceSha256: await shaFile(releaseEvidencePath),
    catalogSha256: await shaFile(catalogPath),
    preTagReleaseManifestSha256: await shaFile(manifestPath),
    publishedPayloadSetSha256: manifest.publishedPayloadSetSha256,
    verifiedAt: new Date().toISOString(),
  };
  await writeJson(path.resolve(output), proof);
  return proof;
}

function assertBytesEqual(observed, expected, label) {
  if (!Buffer.from(observed).equals(expected))
    throw new Error(`${label} does not match independent recomputation.`);
}

async function assertTagAbsent(tag) {
  try {
    await run("git", ["rev-parse", "--verify", `refs/tags/${tag}`], {
      cwd: ROOT,
    });
  } catch {
    return;
  }
  throw new Error("Release tag already exists before qualification.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "candidate",
    "promotion-record",
    "applicability",
    "manifest",
    "release-evidence",
    "catalog",
    "maintained-main-commit",
    "output",
  ]);
  await qualifyRelease({
    candidate: args.candidate,
    promotionRecord: args["promotion-record"],
    applicability: args.applicability,
    manifestPath: args.manifest,
    releaseEvidencePath: args["release-evidence"],
    catalogPath: args.catalog,
    maintainedMainCommit: args["maintained-main-commit"],
    output: args.output,
  });
}
