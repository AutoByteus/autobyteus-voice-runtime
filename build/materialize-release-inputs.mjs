#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  regularFiles,
  sha256,
  shaFile,
  writeJson,
  ROOT,
} from "./lib/files.mjs";
import {
  loadCurrentReleaseMatrix,
  matrixEntryKey,
} from "../release/current-release-matrix.mjs";
import { repositoryBuildLockDigest } from "./repository-lock-set.mjs";
import {
  assertBuildInputPath,
  assertBuildInputPathSet,
} from "./build-input-path-policy.mjs";

const run = promisify(execFile);

export async function materializeReleaseInputs({
  recipePath,
  cacheRoot,
  repository = ROOT,
  destination,
  sourceCommit,
}) {
  const recipe = await readJson(recipePath);
  await validateRecipe(recipe);
  const matrix = await loadCurrentReleaseMatrix();
  if (
    recipe.releaseMatrix.matrixId !== matrix.value.matrixId ||
    recipe.releaseMatrix.sha256 !== matrix.sha256
  )
    throw new Error("Build recipe Current Release Matrix binding mismatch.");
  const matrixEntry = matrix.value.entries.find(
    (entry) => matrixEntryKey(entry) === matrixEntryKey(recipe.package),
  );
  if (!matrixEntry)
    throw new Error(
      "Build recipe package is outside the Current Release Matrix.",
    );
  for (const key of [
    "profileId",
    "languageMode",
    "platform",
    "architecture",
    "packageId",
    "providerId",
    "modelId",
    "decision",
  ])
    if (matrixEntry[key] !== recipe.package[key])
      throw new Error(`Build recipe matrix identity mismatch: ${key}`);
  const expectedLock = await repositoryBuildLockDigest(
    recipe.package.profileId,
    `${recipe.package.platform}-${recipe.package.architecture}`,
  );
  if (
    recipe.toolchain.repositoryLockSha256 !== expectedLock ||
    !/^(?!0{40})[a-f0-9]{40}$/.test(sourceCommit)
  )
    throw new Error("Build recipe repository identity mismatch.");
  await assertCleanRepository(repository, sourceCommit);
  const output = path.resolve(destination);
  await assertAbsent(output);
  await fs.mkdir(output, { recursive: true, mode: 0o700 });
  const observations = [];
  try {
    for (const input of recipe.inputs) {
      const target = path.join(output, input.destination);
      await assertWithin(output, target);
      if (input.kind === "cache-object") {
        const source = path.join(
          path.resolve(cacheRoot),
          "objects",
          input.sha256,
        );
        await verifyFile(source, input);
        await copyFile(source, target);
        observations.push(observation(input, input.sha256));
      } else if (input.kind === "repository-file") {
        const source = path.join(path.resolve(repository), input.sourcePath);
        await assertWithin(path.resolve(repository), source);
        await verifyFile(source, input);
        await copyFile(source, target);
        observations.push(observation(input, input.sha256));
      } else {
        const source = path.join(
          path.resolve(cacheRoot),
          "checkouts",
          input.role,
        );
        await verifyCheckout(source, input);
        await copyCheckout(source, target);
        observations.push(observation(input, input.treeId));
      }
    }
    const records = await fileRecords(output);
    const provenance = {
      schemaVersion: 1,
      recipe: {
        fileName: path.basename(recipePath),
        sha256: await shaFile(recipePath),
      },
      releaseMatrix: recipe.releaseMatrix,
      package: recipe.package,
      repository: { sourceCommit, lockSha256: expectedLock },
      inputs: observations,
      materializedTreeSha256: sha256(
        Buffer.from(`${JSON.stringify(records)}\n`),
      ),
    };
    await validateProvenance(provenance);
    const provenancePath = path.join(output, "input-provenance-v1.json");
    await writeJson(provenancePath, provenance);
    await fs.chmod(provenancePath, 0o444);
    const files = await fileRecords(output);
    const manifestPath = path.join(output, "SHA256SUMS.json");
    await writeJson(manifestPath, {
      schemaVersion: 1,
      files,
    });
    await fs.chmod(manifestPath, 0o444);
    return provenance;
  } catch (error) {
    await fs.rm(output, { recursive: true, force: true });
    throw error;
  }
}

function observation(input, identity) {
  return {
    kind: input.kind,
    role: input.role,
    destination: input.destination,
    identity,
    licenseComponentId: input.licenseComponentId,
  };
}

async function validateRecipe(value) {
  await validate(
    value,
    path.join(ROOT, "contracts/build/build-input-recipe-v1.schema.json"),
    "Build Input Recipe",
  );
  const destinations = value.inputs.map((item) => item.destination);
  if (new Set(destinations).size !== destinations.length)
    throw new Error("Build recipe destinations must be unique.");
}

async function validateProvenance(value) {
  await validate(
    value,
    path.join(ROOT, "contracts/build/build-input-provenance-v1.schema.json"),
    "Build Input Provenance",
  );
}

async function validate(value, schemaPath, label) {
  const schema = await readJson(schemaPath);
  const check = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (!check(value))
    throw new Error(`${label} invalid: ${JSON.stringify(check.errors)}`);
}

async function assertCleanRepository(repository, commit) {
  const head = (
    await run("git", ["-C", repository, "rev-parse", "HEAD"])
  ).stdout.trim();
  if (head !== commit)
    throw new Error("Repository HEAD does not match source commit.");
  const status = (
    await run("git", [
      "-C",
      repository,
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ])
  ).stdout;
  if (status)
    throw new Error("Repository must be clean before materialization.");
}

async function verifyCheckout(directory, input) {
  const head = (
    await run("git", ["-C", directory, "rev-parse", "HEAD"])
  ).stdout.trim();
  const tree = (
    await run("git", ["-C", directory, "rev-parse", "HEAD^{tree}"])
  ).stdout.trim();
  const status = (
    await run("git", [
      "-C",
      directory,
      "status",
      "--porcelain=v1",
      "--ignored",
      "--untracked-files=all",
    ])
  ).stdout;
  if (head !== input.revision || tree !== input.treeId || status)
    throw new Error(
      `Git checkout identity/cleanliness mismatch: ${input.role}`,
    );
}

async function copyCheckout(source, destination) {
  await assertAbsent(destination);
  await fs.mkdir(destination, { recursive: true, mode: 0o700 });
  const lines = (
    await run("git", ["-C", source, "ls-tree", "-r", "--full-tree", "HEAD"])
  ).stdout
    .trim()
    .split("\n")
    .filter(Boolean);
  for (const line of lines) {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    if (!match)
      throw new Error("Git checkout contains unsupported entry mode.");
    const relative = match[3];
    assertBuildInputPath(relative);
    const target = path.join(destination, relative);
    await assertWithin(destination, target);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const { stdout } = await run(
      "git",
      ["-C", source, "show", `HEAD:${relative}`],
      {
        encoding: "buffer",
        maxBuffer: 128 * 1024 * 1024,
      },
    );
    await fs.writeFile(target, stdout, {
      mode: match[1] === "100755" ? 0o555 : 0o444,
    });
  }
}

async function copyFile(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination, fs.constants.COPYFILE_EXCL);
  await fs.chmod(destination, 0o444);
}

async function verifyFile(file, identity) {
  const info = await fs.lstat(file);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size !== identity.sizeBytes ||
    (await shaFile(file)) !== identity.sha256
  )
    throw new Error(`Locked input bytes mismatch: ${identity.role}`);
}

async function fileRecords(root) {
  const result = [];
  const paths = (await regularFiles(root)).filter(
    (relative) => relative !== "SHA256SUMS.json",
  );
  assertBuildInputPathSet(paths);
  for (const relative of paths) {
    const file = path.join(root, relative);
    const info = await fs.lstat(file),
      mode = info.mode;
    if (!info.isFile() || info.isSymbolicLink() || (mode & 0o222) !== 0)
      throw new Error(`Materialized input is not immutable: ${relative}`);
    result.push({
      path: relative,
      sizeBytes: info.size,
      sha256: await shaFile(file),
      mode: mode & 0o111 ? "executable" : "read-only",
    });
  }
  return result;
}

async function assertAbsent(target) {
  try {
    await fs.lstat(target);
    throw new Error(`Destination exists: ${target}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function assertWithin(root, target) {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Materialized path escapes or aliases its root.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "recipe",
    "cache",
    "repository",
    "destination",
    "source-commit",
  ]);
  await materializeReleaseInputs({
    recipePath: path.resolve(args.recipe),
    cacheRoot: path.resolve(args.cache),
    repository: path.resolve(args.repository),
    destination: path.resolve(args.destination),
    sourceCommit: args["source-commit"],
  });
}
