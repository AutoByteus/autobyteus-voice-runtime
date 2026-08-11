import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { shaFile } from "../../build/lib/files.mjs";
import {
  HostPackageInputContract,
  HOST_CONSTRUCTION_CHILD_ENVIRONMENT_KEYS,
  HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS,
  hostConstructionChildEnvironment,
  hostPackageAssemblerInvocation,
  parseHostConstructionArguments,
} from "../../build/host-package-input-contract.mjs";

const root = path.resolve(import.meta.dirname, "../.."),
  fixtureRoot = path.join(root, "tests/fixtures/host-package-input-contract"),
  recipePath = path.join(
    root,
    "build/input-recipes/english-host-darwin-arm64-v2.json",
  );

test("DR-012 script and workflow metadata changes retain one canonical package input", async () => {
  const environment = await fixtureEnvironment(),
    focused = await fixtureRepository("dr-012-package-f.json"),
    workflow = await fs.readFile(
      path.join(focused, ".github/workflows/release-voice-runtime.yml"),
      "utf8",
    ),
    hosted = await fixtureRepository(
      "dr-012-package-w.json",
      workflow
        .replace(
          "name: Voice runtime host release",
          "name: Voice runtime host release after DR-012",
        )
        .replace(
          "on:\n",
          "# Non-executable note: npm install and uses: are metadata here.\non:\n",
        ),
    );
  try {
    const left = await HostPackageInputContract.assertCurrent({
        repository: focused,
        recipePath,
        buildEnvironment: environment,
      }),
      right = await HostPackageInputContract.assertCurrent({
        repository: hosted,
        recipePath,
        buildEnvironment: environment,
      });
    assert.deepEqual(left, right);
    assert.equal(left.packageManager, "npm");
    assert.deepEqual(left.installArguments, ["ci", "--ignore-scripts"]);
    assert.equal(
      left.directInvocation.controller,
      "release/run-host-construction.mjs",
    );
    assert.doesNotMatch(JSON.stringify(left), /check:release-pipeline/);
  } finally {
    await Promise.all(
      [focused, hosted].map((directory) =>
        fs.rm(directory, { recursive: true, force: true }),
      ),
    );
  }
});

test("Host Package Input Contract 1 rejects every DR-012 install-semantic negative", async () => {
  const environment = await fixtureEnvironment(),
    cases = (await fixtureJson("dr-012-negative-cases-v1.json")).cases;
  for (const fixture of cases) {
    const repository = await fixtureRepository("dr-012-package-w.json");
    try {
      const file = path.join(
          repository,
          fixture.subject === "package" ? "package.json" : "package-lock.json",
        ),
        value = JSON.parse(await fs.readFile(file, "utf8"));
      setPath(value, fixture.path, fixture.value);
      await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
      await assert.rejects(
        HostPackageInputContract.assertCurrent({
          repository,
          recipePath,
          buildEnvironment: environment,
        }),
        new RegExp(fixture.error),
        fixture.caseId,
      );
    } finally {
      await fs.rm(repository, { recursive: true, force: true });
    }
  }
});

test("recipe, environment, package-manager, and argument drift fail closed", async () => {
  const environment = await fixtureEnvironment(),
    repository = await fixtureRepository("dr-012-package-w.json"),
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), "voice-host-recipe-"));
  try {
    const recipe = JSON.parse(await fs.readFile(recipePath, "utf8"));
    recipe.toolchain.nodeVersion = "22.22.0";
    const changedRecipe = path.join(temporary, "recipe.json");
    await fs.writeFile(changedRecipe, `${JSON.stringify(recipe)}\n`);
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath: changedRecipe,
        buildEnvironment: environment,
      }),
      /Host Build Recipe 2 invalid/,
    );

    const changedEnvironment = structuredClone(environment);
    changedEnvironment.environment.ambientPath = "/usr/bin";
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: changedEnvironment,
      }),
      /Host Build Environment 2 invalid/,
    );
    const changedNode = structuredClone(environment);
    changedNode.tools.node.sha256 = "0".repeat(64);
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: changedNode,
      }),
      /Host package Node authority mismatch/,
    );

    const workflowPath = path.join(
        repository,
        ".github/workflows/release-voice-runtime.yml",
      ),
      workflow = await fs.readFile(workflowPath, "utf8");
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "          npm ci --ignore-scripts",
        "          npm ci --ignore-scripts\n          npm run build:host",
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /package-manager command must be exact/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "      - name: Select exact hosted Xcode SDK and CMake toolchain",
        `      - name: Undeclared package installation action
        uses: actions/github-script@v7
        with:
          script: |
            const { execFileSync } = require("node:child_process");
            execFileSync("npm", ["install", "--ignore-scripts", "--no-save", "ajv@8.19.0"]);
      - name: Select exact hosted Xcode SDK and CMake toolchain`,
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /executable action surface changed/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "      - name: Select exact hosted Xcode SDK and CMake toolchain",
        `      - { name: Undeclared package installation action, uses: actions/github-script@v7, with: { script: 'require("node:child_process").execFileSync("npm", ["install", "--ignore-scripts", "--no-save", "ajv@8.19.0"])' } }
      - name: Select exact hosted Xcode SDK and CMake toolchain`,
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /steps must use canonical block maps/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "        id: hosted_toolchain",
        `        shell: bash -c 'npm install --ignore-scripts --no-save ajv@8.19.0 && bash {0}'
        id: hosted_toolchain`,
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /shell selection must be canonical/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "with: { node-version: 22.23.1, cache: npm }",
        "with: { node-version: 22.23.1, cache: false }",
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /executable action surface changed/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "          npm ci --ignore-scripts",
        "          npm ci --ignore-scripts\n          npm install --ignore-scripts --no-save ajv@8.19.0",
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /package-manager command must be exact/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        "npm ci --ignore-scripts",
        "npm ci --ignore-scripts --no-audit",
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /package-manager command must be exact/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace("npm ci --ignore-scripts", "pnpm install --offline"),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /package-manager command must be exact/,
    );
    await fs.writeFile(
      workflowPath,
      workflow.replace(
        '--output "$ROOT/audit/hosted-host-construction-result-v3.json"',
        '--unexpected value --output "$ROOT/audit/hosted-host-construction-result-v3.json"',
      ),
    );
    await assert.rejects(
      HostPackageInputContract.assertCurrent({
        repository,
        recipePath,
        buildEnvironment: environment,
      }),
      /controller arguments changed/,
    );
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("direct child invocations have exact argument and environment closure", () => {
  const temporaryRoot = path.join(os.tmpdir(), "voice-host-child"),
    environment = hostConstructionChildEnvironment(temporaryRoot);
  assert.deepEqual(
    Object.keys(environment),
    HOST_CONSTRUCTION_CHILD_ENVIRONMENT_KEYS,
  );
  assert.equal(environment.PATH, "");
  assert.equal(environment.NODE_OPTIONS, undefined);

  const controllerValues = Object.fromEntries(
    HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS.map((name) => [name, "value"]),
  );
  assert.deepEqual(
    parseHostConstructionArguments(
      HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS.flatMap((name) => [
        `--${name}`,
        controllerValues[name],
      ]),
    ),
    controllerValues,
  );
  assert.throws(
    () =>
      parseHostConstructionArguments([
        "--unexpected",
        "value",
        ...HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS.slice(1).flatMap((name) => [
          `--${name}`,
          "value",
        ]),
      ]),
    /Unexpected host construction controller argument order or name/,
  );

  const invocation = hostPackageAssemblerInvocation({
    profile: "english",
    target: "darwin-arm64",
    inputs: "/inputs",
    output: "/assets/english.zip",
    go: "/go/bin/go",
    "build-environment": "/audit/environment.json",
    "expected-host-source-closure": "1".repeat(64),
    "source-commit": "2".repeat(40),
    version: "1.0.0",
  });
  assert.equal(invocation[0], "build/host-package-assembler.mjs");
  assert.throws(
    () =>
      hostPackageAssemblerInvocation({
        profile: "english",
        target: "darwin-arm64",
        inputs: "/inputs",
        output: "/assets/english.zip",
        go: "/go/bin/go",
        "build-environment": "/audit/environment.json",
        "expected-host-source-closure": "1".repeat(64),
        "source-commit": "2".repeat(40),
        version: "1.0.0",
        unexpected: "value",
      }),
    /Unexpected assembler invocation fields/,
  );
});

async function fixtureRepository(packageName, workflow) {
  const repository = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-package-input-"),
  );
  await fs.mkdir(path.join(repository, ".github/workflows"), {
    recursive: true,
  });
  await fs.copyFile(
    path.join(fixtureRoot, packageName),
    path.join(repository, "package.json"),
  );
  await fs.copyFile(
    path.join(fixtureRoot, "dr-012-package-lock-v3.json"),
    path.join(repository, "package-lock.json"),
  );
  await fs.writeFile(
    path.join(repository, ".github/workflows/release-voice-runtime.yml"),
    workflow ??
      (await fs.readFile(
        path.join(root, ".github/workflows/release-voice-runtime.yml"),
        "utf8",
      )),
  );
  return repository;
}

async function fixtureJson(name) {
  return JSON.parse(await fs.readFile(path.join(fixtureRoot, name), "utf8"));
}

async function fixtureEnvironment() {
  const value = await fixtureJson("dr-012-host-build-environment-v2.json"),
    executable = await fs.realpath(process.execPath);
  value.tools.node = { path: executable, sha256: await shaFile(executable) };
  return value;
}

function setPath(value, segments, replacement) {
  let owner = value;
  for (const segment of segments.slice(0, -1)) owner = owner[segment];
  owner[segments.at(-1)] = replacement;
}
