#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  ROOT,
  removeWritableTree,
  shaFile,
  writeJson,
} from "./lib/files.mjs";
import {
  assertGoToolchainProvenance,
  trustedGoEnvironment,
  verifyGoToolchain,
} from "./locked-inputs.mjs";
import { verifyTrustedNativeBuildEnvironment } from "./trusted-native-environment.mjs";
const run = promisify(execFile);
const args = parsePairs(process.argv.slice(2), [
  "archive",
  "build-report",
  "go",
  "output",
]);
const build = await readJson(args["build-report"]);
const goToolchain = await verifyGoToolchain(path.resolve(args.go));
assertGoToolchainProvenance(goToolchain, build);
const archivePath = path.resolve(args.archive);
const provenancePath = path.join(
  path.dirname(path.resolve(args["build-report"])),
  path.basename(build.buildInputProvenanceFileName),
);
const nativeBuildEnvironmentPath = path.join(
  path.dirname(path.resolve(args["build-report"])),
  path.basename(build.nativeBuildEnvironmentFileName),
);
if (
  build.nativeBuildEnvironmentFileName !==
  path.basename(build.nativeBuildEnvironmentFileName)
)
  throw new Error("Native build environment file name invalid.");
if ((await shaFile(archivePath)) !== build.archive.sha256)
  throw new Error("Archive/build report mismatch.");
if ((await shaFile(provenancePath)) !== build.buildInputProvenanceSha256)
  throw new Error("Build input provenance/report mismatch.");
if (
  (await shaFile(nativeBuildEnvironmentPath)) !==
  build.nativeBuildEnvironmentSha256
)
  throw new Error("Native build environment/report mismatch.");
await verifyTrustedNativeBuildEnvironment(
  await readJson(nativeBuildEnvironmentPath),
);
const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-package-verify-"));
try {
  const expected = {
    schemaVersion: 1,
    packageId: build.packageId,
    target: build.target,
    archive: {
      format: "zip",
      formatVersion: 1,
      compression: "deflate",
      canonicalization: "autobyteus-provider-zip-v1",
      rootDirectory: "package",
      fileName: path.basename(archivePath),
      url: "https://invalid.example/prepublication",
      sha256: build.archive.sha256,
      compressedSizeBytes: build.archive.compressedSizeBytes,
      extractedSizeBytes: build.archive.extractedSizeBytes,
      entryCount: build.archive.entryCount,
    },
    packageDescriptor: {
      path: "provider/provider-package-v1.json",
      sha256: build.descriptorSha256,
    },
    fileManifest: {
      path: "provider/package-files-v1.json",
      sha256: build.fileManifestSha256,
    },
  };
  const expectation = path.join(work, "expectation.json"),
    report = path.join(work, "extract-report.json"),
    destination = path.join(work, "verified package");
  await writeJson(expectation, expected);
  await run(
    goToolchain.executable,
    [
      "run",
      "./packaging/cmd/provider-package-tool",
      "extract",
      "--archive",
      archivePath,
      "--expectation",
      expectation,
      "--destination",
      destination,
      "--report",
      report,
    ],
    {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
      env: trustedGoEnvironment(goToolchain),
    },
  );
  const descriptor = await readJson(
    path.join(destination, "provider/provider-package-v1.json"),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = await readJson(
    path.join(ROOT, "contracts/package/provider-package-v1.schema.json"),
  );
  if (!ajv.validate(schema, descriptor))
    throw new Error(`Descriptor schema failed: ${ajv.errorsText()}`);
  const { packageRoot: _, ...verification } = await readJson(report);
  await writeJson(path.resolve(args.output), {
    ...verification,
    descriptorSchemaValid: true,
    packageReadOnly: true,
  });
} finally {
  await removeWritableTree(work);
}
