import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, shaFile } from "./lib/files.mjs";

const HOST_CONTRACTS = [
  [
    "contracts/protocol/voice-input-protocol-v1.schema.json",
    "voice-input-protocol-v1.schema.json",
  ],
  [
    "contracts/startup/provider-session-config-v2.schema.json",
    "provider-session-config-v2.schema.json",
  ],
  [
    "contracts/install/model-installation-events-v1.schema.json",
    "model-installation-events-v1.schema.json",
  ],
  ["contracts/audio/pcm-wav-v1.md", "pcm-wav-v1.md"],
];

export async function stageHostContracts({ stage, profileId }) {
  for (const directory of ["bin", "contracts", "provider"])
    await fs.mkdir(path.join(stage, directory), { recursive: true });
  for (const [source, name] of HOST_CONTRACTS)
    await fs.copyFile(
      path.join(ROOT, source),
      path.join(stage, "contracts", name),
    );
  if (profileId === "chinese")
    await fs.copyFile(
      path.join(ROOT, "contracts/diagnostics/preparation-diagnostics-v1.json"),
      path.join(stage, "contracts/preparation-diagnostics-v1.json"),
    );
}

export async function stageHostAuthorities({ stage, inputs, entry }) {
  const admissionInput = path.join(
      inputs,
      "host-authority/model-admission-root-v1.json",
    ),
    compatibilityInput = path.join(
      inputs,
      "host-authority/model-compatibility-requirement-v1.json",
    );
  if (
    (await shaFile(admissionInput)) !== entry.modelAdmissionRoot.sha256 ||
    (await shaFile(compatibilityInput)) !== entry.compatibilityRequirementSha256
  )
    throw new Error("Host admission authority mismatch.");
  const admissionPath = path.join(
      stage,
      "provider/model-admission-root-v1.json",
    ),
    compatibilityPath = path.join(
      stage,
      "provider/model-compatibility-requirement-v1.json",
    );
  await fs.copyFile(admissionInput, admissionPath);
  await fs.copyFile(compatibilityInput, compatibilityPath);
  return {
    admissionInput,
    admissionPath,
    compatibilityInput,
    compatibilityPath,
  };
}

export function hostLauncherPlan({ profileId, entry, target }) {
  const privateExecutable =
      profileId === "english"
        ? "host/python/bin/python3"
        : "provider/voice-provider-worker",
    worker = profileId === "english" ? "worker/worker.py" : privateExecutable;
  return {
    privateExecutable,
    worker,
    value: {
      schemaVersion: 2,
      hostPackageId: entry.hostPackageId,
      target,
      invocation:
        profileId === "english"
          ? {
              kind: "python-worker",
              executable: privateExecutable,
              worker,
            }
          : { kind: "native-worker", executable: privateExecutable },
    },
  };
}
