#!/usr/bin/env node
import path from "node:path";
import { parsePairs, readJson, shaFile } from "./lib/files.mjs";
import {
  deepEqual,
  ordinaryFileIdentity,
  validateArtifact,
  writeArtifact,
} from "../release/release-contract.mjs";

export async function verifyHostReproducibility({
  firstArchive,
  firstReport,
  secondArchive,
  secondReport,
  output,
}) {
  const first = await readJson(firstReport),
    second = await readJson(secondReport);
  await validateArtifact(
    first,
    "contracts/build/host-build-report-v2.schema.json",
    "first Host Build Report 2",
  );
  await validateArtifact(
    second,
    "contracts/build/host-build-report-v2.schema.json",
    "second Host Build Report 2",
  );
  const firstArchiveSha = await shaFile(firstArchive),
    secondArchiveSha = await shaFile(secondArchive);
  if (
    !deepEqual(first, second) ||
    firstArchiveSha !== secondArchiveSha ||
    firstArchiveSha !== first.archive.sha256 ||
    secondArchiveSha !== second.archive.sha256
  )
    throw new Error("Runtime host rebuild is not byte-identical.");
  return writeArtifact(
    output,
    {
      schemaVersion: 2,
      artifactKind: "host-reproducibility-proof",
      sourceCommit: first.sourceCommit,
      profileId: first.profileId,
      hostPackageId: first.hostPackageId,
      hostSourceClosureSha256: first.hostSourceClosure.sha256,
      archiveSha256: firstArchiveSha,
      firstBuildReport: await ordinaryFileIdentity(firstReport),
      secondBuildReport: await ordinaryFileIdentity(secondReport),
      wholeArchiveEqual: true,
      buildReportsEqual: true,
      decision: "pass",
    },
    "contracts/build/host-reproducibility-proof-v2.schema.json",
    "Host Reproducibility Proof 2",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "first-archive",
    "first-report",
    "second-archive",
    "second-report",
    "output",
  ]);
  await verifyHostReproducibility({
    firstArchive: path.resolve(args["first-archive"]),
    firstReport: path.resolve(args["first-report"]),
    secondArchive: path.resolve(args["second-archive"]),
    secondReport: path.resolve(args["second-report"]),
    output: path.resolve(args.output),
  });
}
