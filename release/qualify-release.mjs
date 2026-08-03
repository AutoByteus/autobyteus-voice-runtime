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
import { assemblePreTagReleaseManifest } from "./pretag-release-manifest.mjs";
import { assertIntegratedReleaseCommit } from "./evidence/main-reachability.mjs";
import { assembleReleaseEvidence } from "./evidence/assemble.mjs";
import { buildReleaseCatalog } from "./catalog-builder.mjs";

const run = promisify(execFile);

export async function qualifyRelease({
  manifestPath,
  qualificationSetPath,
  releaseEvidencePath,
  catalogPath,
  assets,
  maintainedMainCommit,
  output,
}) {
  const manifest = await readJson(manifestPath),
    evidence = await readJson(releaseEvidencePath);
  if (
    evidence.mainReachability.maintainedMainCommit !== maintainedMainCommit ||
    manifest.intendedRelease.sourceCommit !== evidence.sourceCommit
  )
    throw new Error("Pre-tag maintained-main identity mismatch.");
  await assertIntegratedReleaseCommit({
    repository: ROOT,
    releaseCommit: manifest.intendedRelease.sourceCommit,
    maintainedMainCommit,
  });
  await assertTagAbsent(manifest.intendedRelease.releaseTag);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-pretag-verify-"));
  try {
    const expectedEvidence = path.join(
        work,
        "release-qualification-evidence-v1.json",
      ),
      expectedCatalog = path.join(work, "voice-runtime-catalog-v3.json"),
      expected = path.join(work, "pretag-release-manifest-v1.json"),
      catalog = await readJson(catalogPath),
      firstEntry = catalog.entries?.[0],
      suffix = `/${catalog.releaseTag}/${firstEntry?.archive?.fileName}`;
    if (!firstEntry?.archive?.url?.endsWith(suffix))
      throw new Error(
        "Catalog distribution URL cannot be independently derived.",
      );
    const baseUrl = firstEntry.archive.url.slice(0, -suffix.length);
    await assembleReleaseEvidence({
      qualificationSetPath,
      assets,
      runtimeVersion: catalog.runtimeVersion,
      releaseTag: catalog.releaseTag,
      maintainedMainCommit,
      output: expectedEvidence,
    });
    if (
      !Buffer.from(await fs.readFile(releaseEvidencePath)).equals(
        await fs.readFile(expectedEvidence),
      )
    )
      throw new Error(
        "Release Evidence does not match independent recomputation.",
      );
    await buildReleaseCatalog({
      qualificationSetPath,
      releaseEvidencePath,
      releaseTag: catalog.releaseTag,
      baseUrl,
      output: expectedCatalog,
    });
    if (
      !Buffer.from(await fs.readFile(catalogPath)).equals(
        await fs.readFile(expectedCatalog),
      )
    )
      throw new Error("Catalog 3 does not match independent recomputation.");
    await assemblePreTagReleaseManifest({
      qualificationSetPath,
      releaseEvidencePath,
      catalogPath,
      assets,
      output: expected,
    });
    if (
      !Buffer.from(await fs.readFile(manifestPath)).equals(
        await fs.readFile(expected),
      )
    )
      throw new Error(
        "Pre-Tag Manifest does not match independent recomputation.",
      );
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
  const proof = {
    schemaVersion: 1,
    decision: "qualified-pre-tag",
    sourceCommit: manifest.intendedRelease.sourceCommit,
    releaseTag: manifest.intendedRelease.releaseTag,
    releaseMatrixSha256: manifest.releaseMatrix.sha256,
    qualificationSetSha256: await shaFile(qualificationSetPath),
    releaseEvidenceSha256: await shaFile(releaseEvidencePath),
    catalogSha256: await shaFile(catalogPath),
    preTagReleaseManifestSha256: await shaFile(manifestPath),
    publishedPayloadSetSha256: manifest.publishedPayloadSetSha256,
    verifiedAt: new Date().toISOString(),
  };
  await writeJson(path.resolve(output), proof);
  return proof;
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
    "manifest",
    "qualification-set",
    "release-evidence",
    "catalog",
    "assets",
    "maintained-main-commit",
    "output",
  ]);
  await qualifyRelease({
    manifestPath: path.resolve(args.manifest),
    qualificationSetPath: path.resolve(args["qualification-set"]),
    releaseEvidencePath: path.resolve(args["release-evidence"]),
    catalogPath: path.resolve(args.catalog),
    assets: path.resolve(args.assets),
    maintainedMainCommit: args["maintained-main-commit"],
    output: path.resolve(args.output),
  });
}
