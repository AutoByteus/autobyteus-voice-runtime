import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readJson, regularFiles, ROOT, shaFile } from "../lib/files.mjs";
import { locked, verifyLockedFile } from "../locked-inputs.mjs";
import { trustedNativeBuildEnvironment } from "../trusted-native-environment.mjs";
import { normalizeLockedPythonArchiveLinks } from "./archive-link-normalization.mjs";
import {
  isBuildOnlyPythonDistribution,
  prunePythonRuntime,
} from "./runtime-closure.mjs";

const run = promisify(execFile);

export async function materializePythonRuntime(context) {
  const tuple = `${context.target.platform}-${context.target.architecture}`;
  const archive = path.join(context.inputs, "python-host-archive");
  const archiveIdentity = locked.pythonBuildStandalone.archives[tuple];
  await verifyLockedFile(archive, archiveIdentity, "Hermetic Python archive");
  const wheelLockPath = path.join(
    ROOT,
    `build/python-wheel-locks/${tuple}.json`,
  );
  const wheelLock = await readJson(wheelLockPath);
  if (
    wheelLock.schemaVersion !== 1 ||
    wheelLock.target !== tuple ||
    !Array.isArray(wheelLock.wheels) ||
    wheelLock.wheels.length === 0
  )
    throw new Error("Repository-owned Python wheel lock is invalid.");
  const wheelhouse = path.join(context.inputs, "python-wheelhouse");
  await verifyWheelhouse(wheelhouse, wheelLock);
  const materialization = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-python-materialize-"),
  );
  try {
    const environment = trustedNativeBuildEnvironment(
      context.buildEnvironment,
      materialization,
      context.trustedTools,
    );
    await run(
      context.buildEnvironment.tools.tar.path,
      ["-xf", archive, "-C", materialization],
      {
        env: environment,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    const root = path.join(materialization, "python");
    await normalizeLockedPythonArchiveLinks(root, {
      target: tuple,
      archiveSha256: archiveIdentity.sha256,
    });
    await regularFiles(root);
    const executable = path.join(
      root,
      context.target.platform === "win32" ? "python.exe" : "bin/python3",
    );
    if (!(await fs.lstat(executable)).isFile())
      throw new Error("Locked Python archive has no expected executable.");
    const wheelPaths = wheelLock.wheels.map((wheel) =>
      path.join(wheelhouse, wheel.fileName),
    );
    await run(
      executable,
      [
        "-I",
        "-m",
        "pip",
        "install",
        "--no-index",
        "--no-deps",
        "--no-compile",
        "--disable-pip-version-check",
        ...wheelPaths,
      ],
      {
        env: environment,
        maxBuffer: 32 * 1024 * 1024,
      },
    );
    await prunePythonRuntime(root);
    await verifyRuntimeTree(root, wheelLock.wheels);
    await assertRelocatableRuntimeTree(root);
    return {
      root,
      wheelLock,
      wheelLockSha256: await shaFile(wheelLockPath),
      dispose: () => fs.rm(materialization, { recursive: true, force: true }),
    };
  } catch (error) {
    await fs.rm(materialization, { recursive: true, force: true });
    throw error;
  }
}

export async function verifyWheelhouse(wheelhouse, wheelLock) {
  const expectedFiles = wheelLock.wheels.map((wheel) => wheel.fileName).sort();
  const actualFiles = (await fs.readdir(wheelhouse)).sort();
  if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles))
    throw new Error("Wheelhouse does not exactly match the repository lock.");
  for (const wheel of wheelLock.wheels)
    if (
      !/^[A-Za-z0-9_.+-]+\.whl$/.test(wheel.fileName) ||
      !/^[a-f0-9]{64}$/.test(wheel.sha256) ||
      (await shaFile(path.join(wheelhouse, wheel.fileName))) !== wheel.sha256
    )
      throw new Error(`Locked wheel identity mismatch: ${wheel.fileName}`);
}

async function assertRelocatableRuntimeTree(root) {
  const forbidden = Buffer.from(path.resolve(root));
  for (const relative of await regularFiles(root))
    if ((await fs.readFile(path.join(root, relative))).includes(forbidden))
      throw new Error(
        `Materialized Python runtime contains its build path: ${relative}`,
      );
}

async function verifyRuntimeTree(root, wheels) {
  const expected = new Map(
    wheels
      .filter((wheel) => !isBuildOnlyPythonDistribution(wheel.name))
      .map((wheel) => [canonical(wheel.name), wheel.version]),
  );
  const installed = new Map();
  for (const relative of (await regularFiles(root)).filter((file) =>
    file.endsWith(".dist-info/METADATA"),
  )) {
    const metadata = await fs.readFile(path.join(root, relative), "utf8");
    const name = /^Name:\s*(.+)$/im.exec(metadata)?.[1]?.trim();
    const version = /^Version:\s*(.+)$/im.exec(metadata)?.[1]?.trim();
    if (!name || !version)
      throw new Error("Installed wheel metadata is invalid.");
    installed.set(canonical(name), version);
  }
  if (
    expected.size !== installed.size ||
    [...expected].some(([name, version]) => installed.get(name) !== version)
  )
    throw new Error(
      "Materialized Python distributions differ from locked wheels.",
    );
}

function canonical(value) {
  return value.toLowerCase().replace(/[-_.]+/g, "-");
}
