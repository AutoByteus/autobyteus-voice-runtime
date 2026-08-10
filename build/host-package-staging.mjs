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

export const ASSEMBLER_HOST_AUTHORITY_INPUTS = Object.freeze([
  "host-authority/model-admission-root-v1.json",
  "host-authority/model-compatibility-requirement-v1.json",
]);

export function assertHostInputOwnership(inputManifest, profileInputPatterns) {
  if (
    !Array.isArray(inputManifest?.files) ||
    !Array.isArray(profileInputPatterns) ||
    profileInputPatterns.length === 0
  )
    throw new Error("Host input ownership contract is invalid.");
  const assemblerInputs = new Set(ASSEMBLER_HOST_AUTHORITY_INPUTS),
    seenAssemblerInputs = new Set(),
    seenPaths = new Set();
  let profileOwnedCount = 0;
  for (const item of inputManifest.files) {
    if (!item || typeof item.path !== "string" || seenPaths.has(item.path))
      throw new Error("Host input ownership path is invalid or duplicated.");
    seenPaths.add(item.path);
    if (item.path === "host-input-provenance-v2.json") continue;
    const assemblerOwned = assemblerInputs.has(item.path),
      profileOwned = profileInputPatterns.some((pattern) =>
        pattern.endsWith("/")
          ? item.path.startsWith(pattern)
          : item.path === pattern,
      ),
      ownerCount = Number(assemblerOwned) + Number(profileOwned);
    if (ownerCount !== 1)
      throw new Error(
        `Host input must have exactly one construction owner: ${item.path}`,
      );
    if (assemblerOwned) seenAssemblerInputs.add(item.path);
    else profileOwnedCount++;
  }
  if (
    seenAssemblerInputs.size !== assemblerInputs.size ||
    [...assemblerInputs].some((item) => !seenAssemblerInputs.has(item))
  )
    throw new Error("Host assembler authority input set is incomplete.");
  return {
    assemblerOwned: [...ASSEMBLER_HOST_AUTHORITY_INPUTS],
    profileOwnedCount,
  };
}

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
  const [admissionRelative, compatibilityRelative] =
      ASSEMBLER_HOST_AUTHORITY_INPUTS,
    admissionInput = path.join(inputs, admissionRelative),
    compatibilityInput = path.join(inputs, compatibilityRelative);
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
