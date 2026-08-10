import fs from "node:fs/promises";
import path from "node:path";
import { readJson, regularFiles, shaFile, writeJson } from "./lib/files.mjs";

export async function writeHostDescriptor({
  stage,
  entry,
  target,
  packageVersion,
  profileId,
  providerLock,
  launcherPlanPath,
  privateExecutable,
  worker,
  hostSourceClosureSha256,
}) {
  const engineConfiguration = "provider/engine-configuration-v1.json",
    descriptor = {
      schemaVersion: 2,
      hostPackageId: entry.hostPackageId,
      packageVersion,
      providerId: entry.providerId,
      target,
      protocolVersion: 1,
      sessionConfigVersion: 2,
      modelInstallationEventsVersion: 1,
      launcher: "bin/voice-provider",
      modelManager: "bin/voice-model-manager",
      launcherPlan: {
        path: "provider/package-launcher-plan-v2.json",
        sha256: await shaFile(launcherPlanPath),
      },
      host: {
        kind: profileId === "english" ? "bundled-python" : "native",
        version:
          profileId === "english"
            ? "3.12.13"
            : providerLock.engine.funAsrCommit,
        executable: privateExecutable,
        sha256: await shaFile(path.join(stage, privateExecutable)),
      },
      worker: {
        entrypoint: worker,
        sha256: await shaFile(path.join(stage, worker)),
      },
      engine: {
        kind: providerLock.engine.kind,
        version:
          providerLock.engine.version ?? providerLock.engine.funAsrCommit,
        configuration: {
          path: engineConfiguration,
          sha256: await shaFile(path.join(stage, engineConfiguration)),
        },
      },
      profiles: [
        {
          profileId: entry.profileId,
          languageMode: entry.languageMode,
          normalizationProfile:
            profileId === "english"
              ? "autobyteus-english-v1"
              : "autobyteus-simplified-zh-v1",
          capabilityDigest: entry.capabilityDigest,
        },
      ],
      audioContract: "autobyteus-pcm16-mono-16khz-wav-v1",
      hostSourceClosure: {
        path: "provider/host-source-closure-v1.json",
        sha256: hostSourceClosureSha256,
      },
      modelAdmissionRoot: {
        path: "provider/model-admission-root-v1.json",
        sha256: entry.modelAdmissionRoot.sha256,
      },
      modelCompatibilityRequirement: {
        path: "provider/model-compatibility-requirement-v1.json",
        sha256: entry.compatibilityRequirementSha256,
      },
      fileManifestPath: "provider/host-files-v2.json",
      noticeInventoryPath: "THIRD_PARTY_NOTICES.json",
    },
    descriptorPath = path.join(stage, "provider/runtime-host-v2.json");
  await writeJson(descriptorPath, descriptor);
  return descriptorPath;
}

export async function writeHostManifest({
  stage,
  hostPackageId,
  executablePaths,
}) {
  const executable = new Set(executablePaths),
    records = [];
  for (const relative of await regularFiles(stage)) {
    if (relative === "provider/host-files-v2.json") continue;
    const file = path.join(stage, relative),
      info = await fs.stat(file);
    records.push({
      path: relative,
      sha256: await shaFile(file),
      sizeBytes: info.size,
      mode: executable.has(relative) ? "executable" : "read-only",
    });
    await fs.chmod(file, executable.has(relative) ? 0o555 : 0o444);
  }
  records.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
  );
  const manifestPath = path.join(stage, "provider/host-files-v2.json");
  await writeJson(manifestPath, {
    schemaVersion: 2,
    hostPackageId,
    files: records,
  });
  await fs.chmod(manifestPath, 0o444);
  if (
    (await regularFiles(stage)).some(
      (file) =>
        file.startsWith("model/") ||
        file.endsWith("weights.npz") ||
        file.endsWith(".gguf"),
    )
  )
    throw new Error("Runtime Host Archive contains model payload.");
  return manifestPath;
}

export async function writeHostBuildReport({ output, value }) {
  await writeJson(`${path.resolve(output)}.build.json`, value);
}

export async function fileIdentity(file, fileName = path.basename(file)) {
  return {
    fileName,
    sizeBytes: (await fs.stat(file)).size,
    sha256: await shaFile(file),
  };
}

export async function readArchiveReport(file) {
  return readJson(file);
}
