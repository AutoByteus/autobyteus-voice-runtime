import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");

test("recovery is exact-source, organization-managed, no-retest, and nonpublishing", async () => {
  const workflow = await read("recover-qualified-voice-archives.yml");
  assert.match(workflow, /group: voice-runtime-recovery/);
  assert.match(workflow, /labels: \[self-hosted, macOS, ARM64\]/);
  assert.match(workflow, /ref: 32829080938911f0f46390a3fd2af823e105bd32/);
  assert.match(workflow, /recover-qualified-voice-archives\.mjs/);
  assert.match(workflow, /retention-days: 90/);
  assert.doesNotMatch(
    workflow,
    /run-profile-qualification|qualify:profile|corpus|performance|caffeinate|\/usr\/sbin\/purge|gh release|git tag/i,
  );
});

test("promotion is hosted, exact-artifact, 19-member, no-build, and nonpublishing", async () => {
  const workflow = await read("promote-qualified-voice-candidate.yml");
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(
    workflow,
    /artifact-ids: \$\{\{ inputs\.recovery_artifact_id \}\}/,
  );
  assert.match(
    workflow,
    /qualified-release-candidate\.mjs --operation assemble/,
  );
  assert.match(workflow, /qualified-release-candidate\.mjs --operation verify/);
  assert.match(workflow, /retention-days: 90/);
  assert.doesNotMatch(
    workflow,
    /package-assembler|materialize-release-inputs|run-profile-qualification|sandbox-exec|provider-process|gh release|git tag|latest/i,
  );
});

test("Delivery workflow exposes only hosted pretag and publish", async () => {
  const workflow = await read("release-voice-runtime.yml");
  assert.match(workflow, /options: \[pretag, publish\]/);
  assert.equal((workflow.match(/runs-on: ubuntu-24\.04/g) ?? []).length, 2);
  assert.match(workflow, /npm run check:release-pipeline/);
  assert.match(workflow, /release\/candidates\/v1\.0\.0\.json/);
  assert.match(workflow, /artifact-ids:/);
  assert.match(workflow, /release-candidate-applicability-v1\.json/);
  assert.match(workflow, /Always record published-byte verification/);
  assert.match(workflow, /quarantine-published-release\.mjs/);
  assert.doesNotMatch(
    workflow,
    /prequalify|self-hosted|voice-m1|max-parallel|package-assembler|materialize-release-inputs|run-profile-qualification|sandbox-exec|caffeinate|\/usr\/sbin\/purge|uses:.*@latest/i,
  );
  assert.doesNotMatch(workflow, /delete.*refs\/tags|cleanup-tag/i);
  const create =
    workflow.match(/gh release create[\s\S]*?--verify-tag/)?.[0] ?? "";
  assert.equal((create.match(/bundle\/assets\/\*\.zip/g) ?? []).length, 1);
  for (const file of [
    "voice-runtime-catalog-v3.json",
    "release-qualification-evidence-v2.json",
    "pretag-release-manifest-v2.json",
  ])
    assert.match(create, new RegExp(file.replaceAll(".", "\\.")));
});

test("focused release check contains no profile or runtime execution suite", async () => {
  const packageValue = JSON.parse(
    await fs.readFile(path.join(root, "package.json"), "utf8"),
  );
  assert.match(
    packageValue.scripts["check:release-pipeline"],
    /qualified-archive-recovery/,
  );
  assert.doesNotMatch(
    packageValue.scripts["check:release-pipeline"],
    /check:python|check:go|check:evidence|qualify:profile|npm test/,
  );
});

test("the recovery builders retain the reviewed trusted native environment boundary", async () => {
  const assembler = await fs.readFile(
      path.join(root, "build/package-assembler.mjs"),
      "utf8",
    ),
    native = await fs.readFile(
      path.join(root, "build/profile-builders/funasr.mjs"),
      "utf8",
    ),
    python = await fs.readFile(
      path.join(root, "build/python/materialize-runtime.mjs"),
      "utf8",
    );
  assert.match(assembler, /assertNoUntrustedNativeBuildOverrides\(\)/);
  assert.match(assembler, /consumeTrustedNativeBuildEnvironment/);
  assert.doesNotMatch(assembler, /createTrustedNativeBuildEnvironment/);
  assert.match(assembler, /--build-environment/);
  assert.match(assembler, /materializeTrustedToolDirectory/);
  assert.match(native, /cmakeConfigureArguments\(context\.buildEnvironment\)/);
  assert.match(native, /env: nativeEnvironment/);
  assert.match(python, /context\.buildEnvironment\.tools\.tar\.path/);
  assert.doesNotMatch(python, /run\("tar"/);
});

async function read(fileName) {
  return fs.readFile(path.join(root, ".github/workflows", fileName), "utf8");
}
