import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { shaFile } from "../../build/lib/files.mjs";
import { deriveHostSourceClosure } from "../../build/host-source-closure.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("Host Source Closure 1 binds exact repository and hosted tool subjects", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-host-closure-"),
  );
  try {
    const manifest = path.join(temporary, "SHA256SUMS.json");
    await fs.writeFile(manifest, '{"files":[]}\n');
    const environment = await fixtureEnvironment(),
      result = await deriveHostSourceClosure({
        repository: root,
        profileId: "english",
        recipePath: path.join(
          root,
          "build/input-recipes/english-host-darwin-arm64-v2.json",
        ),
        inputManifestPath: manifest,
        buildEnvironment: environment,
        admissionRootPath: path.join(
          root,
          "contracts/model/admission/english-darwin-arm64-v1.json",
        ),
        compatibilityPath: path.join(
          root,
          "contracts/model/compatibility/english-darwin-arm64-v1.json",
        ),
      });
    assert.match(
      result.value.toolchain.node,
      new RegExp(environment.tools.node.sha256),
    );
    assert.match(result.value.toolchain.xcode, /Build version 17B100/);
    assert.match(
      result.value.toolchain.sdk,
      new RegExp(environment.tools.sdk.settingsSha256),
    );
    assert.match(
      result.value.toolchain.compiler,
      new RegExp(environment.tools.cxxCompiler.targetSha256),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "build/host-package-metadata.mjs",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "build/host-package-input-contract.mjs",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "build/workflow-executable-surface.mjs",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "release/run-host-construction.mjs",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "build/host-package-verifier.mjs",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.every(
        (file) => file.path !== "package.json",
      ),
    );
    assert.ok(
      result.value.repositoryFiles.some(
        (file) => file.path === "package-lock.json",
      ),
    );
    assert.deepEqual(result.value.hostPackageInput.installArguments, [
      "ci",
      "--ignore-scripts",
    ]);
    assert.doesNotMatch(JSON.stringify(result.value), /undefined|\/verified/);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("DR-012 command facade changes preserve closure while direct source changes renew it", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-host-closure-dr012-"),
  );
  try {
    const manifest = path.join(temporary, "SHA256SUMS.json");
    await fs.writeFile(manifest, '{"files":[]}\n');
    const environment = await fixtureEnvironment(),
      recipe = path.join(
        root,
        "build/input-recipes/english-host-darwin-arm64-v2.json",
      ),
      options = {
        profileId: "english",
        inputManifestPath: manifest,
        buildEnvironment: environment,
        admissionRootPath: path.join(
          root,
          "contracts/model/admission/english-darwin-arm64-v1.json",
        ),
        compatibilityPath: path.join(
          root,
          "contracts/model/compatibility/english-darwin-arm64-v1.json",
        ),
      },
      current = await deriveHostSourceClosure({
        repository: root,
        recipePath: recipe,
        ...options,
      }),
      repository = path.join(temporary, "repository");
    for (const file of current.value.repositoryFiles)
      await copyFile(file.path, root, repository);
    await copyFile(
      ".github/workflows/release-voice-runtime.yml",
      root,
      repository,
    );
    await fs.copyFile(
      path.join(
        root,
        "tests/fixtures/host-package-input-contract/dr-012-package-f.json",
      ),
      path.join(repository, "package.json"),
    );
    const copiedRecipe = path.join(
      repository,
      "build/input-recipes/english-host-darwin-arm64-v2.json",
    );
    await fs.mkdir(path.dirname(copiedRecipe), { recursive: true });
    await fs.copyFile(recipe, copiedRecipe);
    const workflowPath = path.join(
        repository,
        ".github/workflows/release-voice-runtime.yml",
      ),
      workflow = await fs.readFile(workflowPath, "utf8");
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "name: Voice runtime host release",
        "name: Historical DR-012 release metadata",
      ),
    );
    const historical = await deriveHostSourceClosure({
      repository,
      recipePath: copiedRecipe,
      ...options,
    });
    assert.deepEqual(historical, current);

    const controller = path.join(
      repository,
      "release/run-host-construction.mjs",
    );
    await fs.appendFile(controller, "\n// direct source renewal fixture\n");
    const changed = await deriveHostSourceClosure({
      repository,
      recipePath: copiedRecipe,
      ...options,
    });
    assert.notEqual(changed.sha256, current.sha256);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

async function copyFile(relative, sourceRoot, destinationRoot) {
  const destination = path.join(destinationRoot, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(sourceRoot, relative), destination);
}

async function fixtureEnvironment() {
  const value = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          "tests/fixtures/host-package-input-contract/dr-012-host-build-environment-v2.json",
        ),
        "utf8",
      ),
    ),
    executable = await fs.realpath(process.execPath);
  value.tools.node = { path: executable, sha256: await shaFile(executable) };
  return value;
}
