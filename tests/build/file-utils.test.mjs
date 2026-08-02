import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { removeWritableTree } from "../../build/lib/files.mjs";

test("cleanup removes a verified read-only package tree", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "voice-cleanup-"));
  const nested = path.join(root, "verified", "package");
  await fs.mkdir(nested, { recursive: true });
  await fs.writeFile(path.join(nested, "payload"), "fixture");
  await fs.chmod(path.join(nested, "payload"), 0o444);
  await fs.chmod(nested, 0o555);
  await fs.chmod(path.dirname(nested), 0o555);
  await removeWritableTree(root);
  await assert.rejects(fs.lstat(root), (error) => error.code === "ENOENT");
});
