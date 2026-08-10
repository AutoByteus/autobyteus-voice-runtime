import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import {
  expectedGoVersionOutput,
  locked,
  mapInternalTarget,
  trustedGoEnvironment,
  verifyGoToolchain,
} from "../../build/locked-inputs.mjs";
import { verifyGitSource } from "../../build/native/locked-source.mjs";
import { verifyWheelhouse } from "../../build/python/materialize-runtime.mjs";

const run = promisify(execFile);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("internal target mapping covers every supported Node and Go tuple", () => {
  for (const [internal, go] of [
    [
      ["darwin", "arm64"],
      ["darwin", "arm64"],
    ],
    [
      ["darwin", "x64"],
      ["darwin", "amd64"],
    ],
    [
      ["linux", "x64"],
      ["linux", "amd64"],
    ],
    [
      ["win32", "x64"],
      ["windows", "amd64"],
    ],
  ]) {
    const target = mapInternalTarget(...internal),
      toolchain = { root: "/trusted/go", host: target.internal };
    assert.deepEqual(
      [target.go.platform, target.go.architecture],
      go,
      target.tuple,
    );
    assert.equal(
      expectedGoVersionOutput(toolchain),
      `go version go1.26.5 ${go[0]}/${go[1]}`,
      target.tuple,
    );
    const environment = trustedGoEnvironment(toolchain, {}, {});
    assert.equal(environment.GOROOT, "/trusted/go");
    assert.equal(environment.GOOS, go[0]);
    assert.equal(environment.GOARCH, go[1]);
    assert.equal(environment.GOCACHEPROG, "");
  }
});

test("every supported Go root manifest is bound to its locked archive", async () => {
  for (const [tuple, identity] of Object.entries(locked.goToolchain.archives)) {
    const bytes = await fs.readFile(
        path.resolve(
          import.meta.dirname,
          "../../build/go-toolchain-manifests",
          identity.rootManifestFileName,
        ),
      ),
      manifest = JSON.parse(bytes);
    assert.equal(digest(bytes), identity.rootManifestSha256, tuple);
    assert.equal(manifest.archive.sha256, identity.sha256, tuple);
    assert.equal(manifest.rootTreeSha256, identity.rootTreeSha256, tuple);
    assert.equal(manifest.files.length, identity.rootFileCount, tuple);
    assert.equal(manifest.totalSizeBytes, identity.rootSizeBytes, tuple);
    const executable = tuple.startsWith("win32-") ? "bin/go.exe" : "bin/go";
    assert.equal(
      manifest.files.find((item) => item.path === executable)?.sha256,
      identity.executableSha256,
      tuple,
    );
  }
});

test("version-preserving fake Go compiler is rejected by exact bytes", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voice-fake-go-"));
  try {
    await fs.mkdir(path.join(directory, "bin"));
    const fake = path.join(
      directory,
      "bin",
      process.platform === "win32" ? "go.exe" : "go",
    );
    await fs.writeFile(
      fake,
      "#!/bin/sh\necho go version go1.26.5 darwin/arm64\n",
    );
    await fs.chmod(fake, 0o755);
    await assert.rejects(verifyGoToolchain(fake), /not repository-locked/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("official locked Go front binary without its sibling root is rejected", async (t) => {
  if (!process.env.VOICE_GO) return t.skip("VOICE_GO is not configured");
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-empty-go-root-"),
  );
  try {
    const binary = path.join(
      directory,
      "go/bin",
      process.platform === "win32" ? "go.exe" : "go",
    );
    await fs.mkdir(path.dirname(binary), { recursive: true });
    await fs.copyFile(process.env.VOICE_GO, binary);
    await assert.rejects(
      verifyGoToolchain(binary),
      /directory set does not match its locked manifest/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("exact Go front binary is rejected when a sibling tool is missing", async () => {
  const fixture = await createGoToolchainFixture();
  try {
    await verifyFixture(fixture);
    await fs.rm(path.join(fixture.root, "pkg/tool/compile"));
    await assert.rejects(
      verifyFixture(fixture),
      /file set does not match its locked manifest/,
    );
  } finally {
    await fs.rm(fixture.directory, { recursive: true, force: true });
  }
});

test("exact Go front binary is rejected when a sibling tool is modified", async () => {
  const fixture = await createGoToolchainFixture();
  try {
    await fs.writeFile(path.join(fixture.root, "pkg/tool/link"), "patched");
    await assert.rejects(
      verifyFixture(fixture),
      /Go root file mismatch: pkg\/tool\/link/,
    );
  } finally {
    await fs.rm(fixture.directory, { recursive: true, force: true });
  }
});

test("inherited alternate GOROOT is rejected before Go execution", async () => {
  const fixture = await createGoToolchainFixture();
  try {
    await assert.rejects(
      verifyFixture(fixture, { GOROOT: "/operator/alternate/go" }),
      /Inherited Go toolchain override rejected: GOROOT/,
    );
  } finally {
    await fs.rm(fixture.directory, { recursive: true, force: true });
  }
});

test("inherited GOCACHEPROG is rejected before verified Go invocation", async (t) => {
  if (!process.env.VOICE_GO) return t.skip("VOICE_GO is not configured");
  const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-go-cache-program-"),
    ),
    marker = path.join(directory, "executed"),
    program = path.join(directory, "marker.mjs");
  try {
    await fs.writeFile(
      program,
      `import fs from "node:fs"; fs.writeFileSync(${JSON.stringify(marker)}, "executed");\n`,
    );
    await assert.rejects(
      run(
        process.execPath,
        [
          path.resolve(
            import.meta.dirname,
            "../../build/verify-go-toolchain.mjs",
          ),
          "--go",
          process.env.VOICE_GO,
        ],
        {
          env: {
            ...process.env,
            GOCACHEPROG: `${process.execPath} ${program}`,
          },
        },
      ),
      (error) => {
        assert.match(
          error.stderr,
          /Inherited Go toolchain override rejected: GOCACHEPROG/,
        );
        return true;
      },
    );
    await assert.rejects(fs.access(marker), { code: "ENOENT" });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("locked native source rejects a modified tree at the same commit", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-native-source-"),
  );
  try {
    await run("git", ["init", "-q"], { cwd: directory });
    await run("git", ["config", "user.email", "test@example.invalid"], {
      cwd: directory,
    });
    await run("git", ["config", "user.name", "Test"], { cwd: directory });
    const source = path.join(directory, "source.cpp");
    await fs.writeFile(source, "approved\n");
    await run("git", ["add", "source.cpp"], { cwd: directory });
    await run("git", ["commit", "-q", "-m", "approved"], { cwd: directory });
    const commit = (
      await run("git", ["rev-parse", "HEAD"], { cwd: directory })
    ).stdout.trim();
    await verifyGitSource(directory, commit, "fixture");
    await fs.writeFile(source, "tampered\n");
    await assert.rejects(
      verifyGitSource(directory, commit, "fixture"),
      /differs from its locked commit/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("wheelhouse rejects target wheel bytes changed without a version change", async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-wheelhouse-"),
  );
  try {
    const fileName = "provider-1.0.0-py3-none-any.whl";
    const approved = Buffer.from("approved wheel bytes");
    await fs.writeFile(path.join(directory, fileName), approved);
    const lock = {
      wheels: [{ fileName, sha256: digest(approved) }],
    };
    await verifyWheelhouse(directory, lock);
    await fs.writeFile(path.join(directory, fileName), "tampered wheel bytes");
    await assert.rejects(
      verifyWheelhouse(directory, lock),
      /Locked wheel identity mismatch/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

async function createGoToolchainFixture() {
  const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-go-root-fixture-"),
    ),
    root = path.join(directory, "go"),
    executable = path.join(
      root,
      "bin",
      process.platform === "win32" ? "go.exe" : "go",
    ),
    sourceFiles = new Map([
      ["bin/go", "locked go front"],
      ["pkg/tool/compile", "locked compiler"],
      ["pkg/tool/link", "locked linker"],
      ["src/runtime/runtime.go", "package runtime\n"],
    ]);
  if (process.platform === "win32") {
    sourceFiles.set("bin/go.exe", sourceFiles.get("bin/go"));
    sourceFiles.delete("bin/go");
  }
  for (const [relative, bytes] of sourceFiles) {
    const target = path.join(root, ...relative.split("/"));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  const files = [...sourceFiles]
      .map(([relative, bytes]) => ({
        path: relative,
        sizeBytes: Buffer.byteLength(bytes),
        sha256: digest(bytes),
      }))
      .sort((left, right) =>
        Buffer.from(left.path).compare(Buffer.from(right.path)),
      ),
    directories = ["bin", "pkg", "pkg/tool", "src", "src/runtime"],
    treeSha256 = digest(
      files
        .map((item) => `${item.path}\0${item.sizeBytes}\0${item.sha256}\n`)
        .join(""),
    ),
    tuple = `${process.platform}-${process.arch === "x64" ? "x64" : process.arch}`,
    archive = {
      fileName: "fixture-go-archive",
      sha256: digest("fixture archive"),
      sizeBytes: 15,
    },
    manifest = {
      schemaVersion: 1,
      goVersion: "1.26.5",
      host: {
        platform: process.platform,
        architecture: process.arch === "x64" ? "x64" : process.arch,
      },
      archive,
      rootDirectory: "go",
      directories,
      rootTreeSha256: treeSha256,
      fileCount: files.length,
      totalSizeBytes: files.reduce((total, item) => total + item.sizeBytes, 0),
      files,
    },
    manifestPath = path.join(directory, "manifest.json"),
    manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
  await fs.writeFile(manifestPath, manifestBytes);
  return {
    directory,
    root,
    executable,
    tuple,
    manifestPath,
    identity: {
      ...archive,
      executableSha256: digest(
        sourceFiles.get(executable.endsWith(".exe") ? "bin/go.exe" : "bin/go"),
      ),
      rootManifestFileName: "fixture.json",
      rootManifestSha256: digest(manifestBytes),
      rootTreeSha256: treeSha256,
      rootFileCount: files.length,
      rootSizeBytes: manifest.totalSizeBytes,
    },
  };
}

function verifyFixture(fixture, environment = {}) {
  return verifyGoToolchain(fixture.executable, {
    tuple: fixture.tuple,
    identity: fixture.identity,
    manifestPath: fixture.manifestPath,
    environment,
  });
}
