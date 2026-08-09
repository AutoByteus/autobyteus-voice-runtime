import fs from "node:fs/promises";
import path from "node:path";
import { writeJson } from "./lib/files.mjs";
import {
  fileIdentity,
  writeHostBuildReport,
} from "./host-package-metadata.mjs";

export async function preserveHostBuildEvidence({
  output,
  inputs,
  recipePath,
  provenancePath,
  native,
  toolProvenance,
  closurePath,
  admissionPath,
  compatibilityPath,
  descriptorPath,
  manifestPath,
  noticePath,
  launcherPath,
  managerPath,
  archive,
  sourceCommit,
  version,
  entry,
  target,
}) {
  const preservedInput = `${path.resolve(output)}.inputs.json`,
    preservedProvenance = `${path.resolve(output)}.provenance.json`,
    preservedNative = `${path.resolve(output)}.build-environment.json`;
  await fs.copyFile(path.join(inputs, "SHA256SUMS.json"), preservedInput);
  await fs.copyFile(provenancePath, preservedProvenance);
  await writeJson(preservedNative, native);
  await writeHostBuildReport({
    output,
    value: {
      schemaVersion: 2,
      artifactKind: "host-build-report",
      sourceCommit,
      packageVersion: version,
      hostPackageId: entry.hostPackageId,
      profileId: entry.profileId,
      target,
      providerId: entry.providerId,
      modelAssetId: entry.modelAssetId,
      recipe: await fileIdentity(recipePath),
      inputManifest: await fileIdentity(preservedInput),
      inputProvenance: await fileIdentity(preservedProvenance),
      hostBuildEnvironment: await fileIdentity(
        preservedNative,
        "host-build-environment-v2.json",
      ),
      toolProvenance: await fileIdentity(toolProvenance),
      hostSourceClosure: await fileIdentity(
        closurePath,
        "host-source-closure-v1.json",
      ),
      modelAdmissionRoot: await fileIdentity(
        admissionPath,
        "model-admission-root-v1.json",
      ),
      compatibilityRequirement: await fileIdentity(
        compatibilityPath,
        "model-compatibility-requirement-v1.json",
      ),
      descriptor: await fileIdentity(descriptorPath, "runtime-host-v2.json"),
      fileManifest: await fileIdentity(manifestPath, "host-files-v2.json"),
      noticeInventory: await fileIdentity(noticePath),
      launcher: await fileIdentity(launcherPath, "voice-provider"),
      modelManager: await fileIdentity(managerPath, "voice-model-manager"),
      productTestsExecuted: 0,
      modelBytesDownloaded: 0,
      providersLaunched: 0,
      archive: {
        fileName: path.basename(output),
        sizeBytes: archive.compressedSizeBytes,
        sha256: archive.sha256,
        extractedSizeBytes: archive.extractedSizeBytes,
        entryCount: archive.entryCount,
      },
    },
  });
}
