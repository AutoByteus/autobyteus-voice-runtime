import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { removeWritableTree } from "../../build/lib/files.mjs";

const run = promisify(execFile),
  root = path.resolve(import.meta.dirname, "../.."),
  digest = (value) => createHash("sha256").update(value).digest("hex");

test("reproducibility proof requires byte-identical archives and reports", async () => {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "voice-rebuild-"));
  try {
    const archive = Buffer.from("canonical archive"),
      archiveSha256 = digest(archive),
      report = {
        sourceCommit: "a".repeat(40),
        packageId: "fixture.package",
        buildInputManifestSha256: "b".repeat(64),
        buildInputProvenanceSha256: "c".repeat(64),
        buildInputRecipeSha256: "d".repeat(64),
        releaseMatrixSha256: "e".repeat(64),
        archive: { sha256: archiveSha256 },
      };
    for (const side of ["first", "second"]) {
      await fs.writeFile(path.join(work, `${side}.zip`), archive);
      await fs.writeFile(
        path.join(work, `${side}.json`),
        `${JSON.stringify(report)}\n`,
      );
    }
    const output = path.join(work, "proof.json"),
      command = [
        path.join(root, "build/verify-reproducibility.mjs"),
        "--first-archive",
        path.join(work, "first.zip"),
        "--first-report",
        path.join(work, "first.json"),
        "--second-archive",
        path.join(work, "second.zip"),
        "--second-report",
        path.join(work, "second.json"),
        "--output",
        output,
      ];
    await run(process.execPath, command);
    assert.equal(JSON.parse(await fs.readFile(output)).passed, true);
    await fs.writeFile(path.join(work, "second.zip"), "different");
    await assert.rejects(run(process.execPath, command));
  } finally {
    await removeWritableTree(work);
  }
});
