import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { trustedGoEnvironment } from "../build/locked-inputs.mjs";
import { regularFiles, ROOT, shaFile, writeJson } from "../build/lib/files.mjs";

const run = promisify(execFile);

export async function extractQualifiedPackage({
  work,
  build,
  archive,
  goToolchain,
}) {
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
        fileName: path.basename(archive),
        url: "https://invalid.example/qualification",
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
    },
    expectation = path.join(work, "expectation.json"),
    report = path.join(work, "extract-report.json"),
    destination = path.join(work, "relocated package – voice");
  await writeJson(expectation, expected);
  await run(
    goToolchain.executable,
    [
      "run",
      "./packaging/cmd/provider-package-tool",
      "extract",
      "--archive",
      archive,
      "--expectation",
      expectation,
      "--destination",
      destination,
      "--report",
      report,
    ],
    { cwd: ROOT, env: trustedGoEnvironment(goToolchain) },
  );
  return destination;
}

export async function snapshotPackage(root) {
  const records = [];
  for (const relative of await regularFiles(root)) {
    const file = path.join(root, relative);
    records.push([relative, (await fs.stat(file)).size, await shaFile(file)]);
  }
  return records;
}
