#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  readJson,
  removeWritableTree,
  ROOT,
  shaFile,
  writeJson,
} from "./lib/files.mjs";
import { parseHostPackageVerifierArguments } from "./host-package-input-contract.mjs";
import { trustedGoEnvironment, verifyGoToolchain } from "./locked-inputs.mjs";

const run = promisify(execFile);

export async function verifyHostArchive({ archive, buildReport, go, output }) {
  const build = await readJson(buildReport);
  await validate(build, "contracts/build/host-build-report-v2.schema.json");
  if (
    path.basename(archive) !== build.archive.fileName ||
    (await shaFile(archive)) !== build.archive.sha256 ||
    (await fs.stat(archive)).size !== build.archive.sizeBytes
  )
    throw new Error("Runtime Host Archive 2/build report mismatch.");
  const toolchain = await verifyGoToolchain(path.resolve(go)),
    work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-host-verify-"));
  try {
    const expectation = path.join(work, "expectation.json"),
      extractReport = path.join(work, "extract-report.json"),
      destination = path.join(work, "verified-host");
    await writeJson(expectation, {
      schemaVersion: 2,
      hostPackageId: build.hostPackageId,
      target: build.target,
      archive: {
        format: "zip",
        formatVersion: 2,
        compression: "deflate",
        canonicalization: "autobyteus-runtime-host-zip-v2",
        rootDirectory: "host",
        fileName: build.archive.fileName,
        url: "https://invalid.example/prepublication",
        sha256: build.archive.sha256,
        compressedSizeBytes: build.archive.sizeBytes,
        extractedSizeBytes: build.archive.extractedSizeBytes,
        entryCount: build.archive.entryCount,
      },
      hostDescriptor: {
        path: "provider/runtime-host-v2.json",
        sha256: build.descriptor.sha256,
      },
      fileManifest: {
        path: "provider/host-files-v2.json",
        sha256: build.fileManifest.sha256,
      },
    });
    await run(
      toolchain.executable,
      [
        "run",
        "./packaging/cmd/runtime-host-tool",
        "extract",
        "--archive",
        path.resolve(archive),
        "--expectation",
        expectation,
        "--destination",
        destination,
        "--report",
        extractReport,
      ],
      { cwd: ROOT, env: trustedGoEnvironment(toolchain) },
    );
    const descriptor = await readJson(
        path.join(destination, "provider/runtime-host-v2.json"),
      ),
      manifest = await readJson(
        path.join(destination, "provider/host-files-v2.json"),
      );
    await validate(descriptor, "contracts/package/runtime-host-v2.schema.json");
    await validate(manifest, "contracts/package/host-files-v2.schema.json");
    if (
      descriptor.hostSourceClosure.sha256 !== build.hostSourceClosure.sha256 ||
      descriptor.modelAdmissionRoot.sha256 !==
        build.modelAdmissionRoot.sha256 ||
      descriptor.modelCompatibilityRequirement.sha256 !==
        build.compatibilityRequirement.sha256 ||
      descriptor.hostPackageId !== build.hostPackageId ||
      manifest.hostPackageId !== build.hostPackageId
    )
      throw new Error("Extracted host authority differs from build report.");
    const report = await readJson(extractReport),
      result = {
        ...report,
        descriptorSchemaValid: true,
        fileManifestSchemaValid: true,
        modelPayloadAbsent: !manifest.files.some(
          (item) =>
            item.path.startsWith("model/") ||
            item.path.endsWith("weights.npz") ||
            item.path.endsWith(".gguf"),
        ),
      };
    await validate(result, "contracts/build/host-verification-v2.schema.json");
    await writeJson(output, result);
    return result;
  } finally {
    await removeWritableTree(work);
  }
}

async function validate(value, schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: true }),
    check = ajv.compile(await readJson(path.join(ROOT, schemaPath)));
  if (!check(value)) throw new Error(JSON.stringify(check.errors));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseHostPackageVerifierArguments(process.argv.slice(2));
  await verifyHostArchive({
    archive: args.archive,
    buildReport: args["build-report"],
    go: args.go,
    output: args.output,
  });
}
