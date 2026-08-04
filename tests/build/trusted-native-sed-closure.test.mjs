import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  createTrustedNativeBuildEnvironment,
  materializeTrustedToolDirectory,
  trustedNativeBuildEnvironment,
  verifyTrustedToolDirectory,
} from "../../build/trusted-native-environment.mjs";
import { writeJson } from "../../build/lib/files.mjs";
import { passingDarwinPreflightFixture } from "../fixtures/passing-darwin-preflight.mjs";

const run = promisify(execFile);

test("the locked Metal sed pipeline runs through only the authenticated closed PATH", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-metal-sed-test-"),
  );
  try {
    const cmake = path.join(temp, "cmake"),
      preflightPath = path.join(temp, "preflight.json"),
      work = path.join(temp, "work");
    await fs.writeFile(cmake, "fixture\n", { mode: 0o755 });
    await writeJson(
      preflightPath,
      await passingDarwinPreflightFixture(temp, cmake),
    );
    const record = await createTrustedNativeBuildEnvironment({
      preflightPath,
      cmakePath: cmake,
      environment: {},
    });
    await fs.mkdir(work);
    const tools = await materializeTrustedToolDirectory(record, work),
      environment = trustedNativeBuildEnvironment(record, work, tools),
      source = path.join(temp, "ggml-metal.metal"),
      common = path.join(temp, "ggml-common.h"),
      implementation = path.join(temp, "ggml-metal-impl.h"),
      intermediate = path.join(temp, "ggml-metal-embed.tmp"),
      output = path.join(temp, "ggml-metal-embed.s"),
      command = lockedMetalEmbeddingCommand({
        source,
        common,
        implementation,
        intermediate,
        output,
      });
    await fs.writeFile(
      source,
      'header\n__embed_ggml-common.h__\nmiddle\n#include "ggml-metal-impl.h"\ntail\n',
    );
    await fs.writeFile(common, "common-bytes\n");
    await fs.writeFile(implementation, "implementation-bytes\n");
    await run(record.tools.shell.path, ["-c", command], { env: environment });
    assert.equal(
      await fs.readFile(output, "utf8"),
      "header\ncommon-bytes\nmiddle\nimplementation-bytes\ntail\n",
    );
    assert.deepEqual(environment.PATH.split(path.delimiter), [tools]);
    assert.deepEqual((await fs.readdir(tools)).sort(), [
      "ar",
      "c++",
      "cc",
      "cmake",
      "ld",
      "libtool",
      "make",
      "node",
      "ranlib",
      "sed",
      "sh",
      "tar",
    ]);

    const sedLink = path.join(tools, "sed");
    await fs.rm(sedLink);
    await assert.rejects(
      verifyTrustedToolDirectory(record, tools),
      /tool directory is not closed/,
    );
    await assert.rejects(
      run(record.tools.shell.path, ["-c", command], { env: environment }),
    );

    await fs.symlink(record.tools.sed.path, sedLink);
    await fs.symlink(record.tools.sed.path, path.join(tools, "sed-unbound"));
    await assert.rejects(
      verifyTrustedToolDirectory(record, tools),
      /tool directory is not closed/,
    );
    await fs.rm(path.join(tools, "sed-unbound"));

    await fs.rm(sedLink);
    await fs.symlink(record.tools.tar.path, sedLink);
    await assert.rejects(
      verifyTrustedToolDirectory(record, tools),
      /Trusted native tool link mismatch: sed/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

function lockedMetalEmbeddingCommand({
  source,
  common,
  implementation,
  intermediate,
  output,
}) {
  return [
    `sed -e "/__embed_ggml-common.h__/r ${common}" -e "/__embed_ggml-common.h__/d" < "${source}" > "${intermediate}"`,
    `sed -e '/#include "ggml-metal-impl.h"/r ${implementation}' -e '/#include "ggml-metal-impl.h"/d' < "${intermediate}" > "${output}"`,
  ].join(" && ");
}
