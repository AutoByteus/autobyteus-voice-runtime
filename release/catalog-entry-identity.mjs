import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT } from "../build/lib/files.mjs";

export async function composeCatalogEntryIdentity(matrixEntry, profile) {
  for (const key of [
    "profileId",
    "languageMode",
    "platform",
    "architecture",
    "packageId",
    "providerId",
    "modelId",
  ])
    if (matrixEntry[key] !== profile[key])
      throw new Error(`Catalog entry matrix mismatch: ${key}`);
  if (
    matrixEntry.decision !== profile.candidateDecision ||
    profile.functionalDecision !== "pass"
  )
    throw new Error("Catalog entry qualification decision mismatch.");
  const value = {
    profileId: profile.profileId,
    languageMode: profile.languageMode,
    platform: profile.platform,
    architecture: profile.architecture,
    packageId: profile.packageId,
    providerId: profile.providerId,
    modelId: profile.modelId,
    decision: profile.candidateDecision,
    archive: {
      format: "zip",
      formatVersion: 1,
      compression: "deflate",
      canonicalization: "autobyteus-provider-zip-v1",
      rootDirectory: "package",
      fileName: profile.archive.fileName,
      sha256: profile.archive.sha256,
      compressedSizeBytes: profile.archive.sizeBytes,
      extractedSizeBytes: profile.archive.extractedSizeBytes,
      entryCount: profile.archive.entryCount,
    },
    launcher: "bin/voice-provider",
    packageDescriptor: {
      path: "provider/provider-package-v1.json",
      sha256: profile.descriptorSha256,
    },
    fileManifest: {
      path: "provider/package-files-v1.json",
      sha256: profile.fileManifestSha256,
    },
    protocolVersion: 1,
    sessionConfigVersion: 1,
    capabilityDigest: profile.capabilityDigest,
    noticeInventoryDigest: profile.noticeInventorySha256,
    generatedComplianceDigest: profile.generatedComplianceSha256,
    qualificationResultDigest: profile.qualificationSummary.sha256,
  };
  if (!/^[a-f0-9]{64}$/.test(value.capabilityDigest ?? ""))
    throw new Error(
      "Catalog entry capability digest missing from Qualification Set.",
    );
  const schema = await readJson(
    path.join(ROOT, "contracts/catalog/catalog-entry-identity-v1.schema.json"),
  );
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );
  if (!validate(value))
    throw new Error(
      `Catalog entry invalid: ${JSON.stringify(validate.errors)}`,
    );
  return value;
}
