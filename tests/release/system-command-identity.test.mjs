import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  capturePinnedSudoIdentity,
  verifyPinnedSudoIdentity,
} from "../../benchmark/system-command-identity.mjs";

test("the non-root preflight identifies execute-only sudo without reading it", async () => {
  assert.notEqual(process.getuid(), 0, "reference runner must be non-root");
  await assert.rejects(
    fs.readFile("/usr/bin/sudo"),
    (error) => error.code === "EACCES",
  );
  const identity = await capturePinnedSudoIdentity();
  assert.equal(identity.path, "/usr/bin/sudo");
  assert.equal(identity.ownerUid, 0);
  assert.equal(identity.ownerGid, 0);
  assert.equal(identity.mode, "4511");
  await verifyPinnedSudoIdentity(identity);

  const changed = { ...identity, inode: `${BigInt(identity.inode) + 1n}` };
  await assert.rejects(
    verifyPinnedSudoIdentity(changed),
    /sudo executable identity changed/,
  );
});
