import fs from "node:fs/promises";
import path from "node:path";
import { readJson, shaFile } from "../build/lib/files.mjs";

export async function preserveQualificationInputs({
  destination,
  build,
  conditions,
  buildReportPath,
  reproducibilityProofPath,
  compliancePath,
  baselinePath,
  corpusPath,
  conditionsPath,
}) {
  const reproducibilityProof = await readJson(reproducibilityProofPath),
    sibling = (name) =>
      path.join(path.dirname(buildReportPath), path.basename(name)),
    inputManifestPath = sibling(build.buildInputManifestFileName),
    inputProvenancePath = sibling(build.buildInputProvenanceFileName),
    nativeBuildEnvironmentPath = sibling(build.nativeBuildEnvironmentFileName),
    compliance = await readJson(compliancePath);
  if (
    build.buildInputManifestFileName !==
      path.basename(build.buildInputManifestFileName) ||
    (await shaFile(inputManifestPath)) !== build.buildInputManifestSha256 ||
    build.buildInputProvenanceFileName !==
      path.basename(build.buildInputProvenanceFileName) ||
    (await shaFile(inputProvenancePath)) !== build.buildInputProvenanceSha256 ||
    build.nativeBuildEnvironmentFileName !==
      path.basename(build.nativeBuildEnvironmentFileName) ||
    (await shaFile(nativeBuildEnvironmentPath)) !==
      build.nativeBuildEnvironmentSha256 ||
    compliance.decision !== "pass" ||
    compliance.packageId !== build.packageId ||
    compliance.archiveSha256 !== build.archive.sha256 ||
    compliance.provenanceSha256 !== build.buildInputProvenanceSha256
  )
    throw new Error("Preserved build-input/environment manifest mismatch.");
  if (
    reproducibilityProof.schemaVersion !== 1 ||
    reproducibilityProof.passed !== true ||
    reproducibilityProof.sourceCommit !== build.sourceCommit ||
    reproducibilityProof.packageId !== build.packageId ||
    reproducibilityProof.buildInputManifestSha256 !==
      build.buildInputManifestSha256 ||
    reproducibilityProof.nativeBuildEnvironmentSha256 !==
      build.nativeBuildEnvironmentSha256 ||
    reproducibilityProof.archiveSha256 !== build.archive.sha256 ||
    reproducibilityProof.firstBuildReportSha256 !==
      (await shaFile(buildReportPath)) ||
    reproducibilityProof.secondBuildReportSha256 !==
      reproducibilityProof.firstBuildReportSha256
  )
    throw new Error("Reproducibility proof does not bind this build.");
  for (const [source, name] of [
    [buildReportPath, "build-report.json"],
    [inputManifestPath, "build-input-manifest.json"],
    [inputProvenancePath, "input-provenance-v1.json"],
    [nativeBuildEnvironmentPath, "native-build-environment-v1.json"],
    [compliancePath, "package-compliance-v1.json"],
    [reproducibilityProofPath, "reproducibility-proof-v1.json"],
    [baselinePath, "baseline-evidence.json"],
    [corpusPath, "corpus-manifest.json"],
    [conditionsPath, "qualification-conditions-v1.json"],
    [
      path.join(path.dirname(conditionsPath), conditions.preflight.fileName),
      "darwin-arm64-preflight-v2.json",
    ],
  ])
    await fs.copyFile(source, path.join(destination, name));
  return {
    buildReportPath,
    reproducibilityProofPath,
    nativeBuildEnvironmentPath: path.join(
      destination,
      "native-build-environment-v1.json",
    ),
    compliancePath: path.join(destination, "package-compliance-v1.json"),
  };
}
