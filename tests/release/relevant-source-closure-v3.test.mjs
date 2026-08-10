import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ordinaryFileIdentity } from "../../release/release-contract.mjs";
import {
  assembleReleaseSourceAdmission,
  changedSourcePaths,
  classifySourcePath,
  loadSourceClosurePolicy,
  sourceClosureDecision,
} from "../../release/source-closure.mjs";

const run = promisify(execFile),
  projectRoot = path.resolve(import.meta.dirname, "../.."),
  historicalFocusedSource = "b88c230663eb96e0def8c869b095ea858b0ff50b",
  historicalIr036Source = "8111f3fe27f2d551676fd891f1f98ac2615da526",
  transitionFixturePath = path.join(
    projectRoot,
    "tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json",
  ),
  exactReleasePaths = [
    "tests/release/release-admission-fixture.mjs",
    "tests/release/catalog-v4.test.mjs",
    "tests/release/host-construction-result.test.mjs",
    "tests/release/host-release-contracts.test.mjs",
    "tests/release/release-source-admission-verifier.test.mjs",
    "tests/release/relevant-source-closure-v2.test.mjs",
    "tests/release/relevant-source-closure-v3.test.mjs",
    "tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json",
  ],
  exactAggregatePaths = [
    "release/profile-execution-closure.mjs",
    "release/focused-qualification-set.mjs",
    "release/branch-catalog-projection-v3.mjs",
    "release/verify-branch-catalog-projection-v3.mjs",
    "contracts/release/focused-qualification-set-v3.schema.json",
  ];

test("Relevant Source Closure 3 selects exact rules before prefixes and keeps closed protections", async () => {
  const { value: policy } = await loadSourceClosurePolicy();
  assert.equal(
    classifySourcePath("providers/english-mlx/recognizer.py", policy),
    "profile-qualification-required",
  );
  assert.equal(
    classifySourcePath("modelmanager/internal/service.go", policy),
    "focused-qualification-required",
  );
  for (const fileName of exactReleasePaths)
    assert.equal(
      classifySourcePath(fileName, policy),
      "release-pipeline-only",
      fileName,
    );
  for (const fileName of exactAggregatePaths)
    assert.equal(
      classifySourcePath(fileName, policy),
      "aggregate-api-renewal-required",
      fileName,
    );
  assert.equal(
    classifySourcePath(
      "tests/release/fixtures/unlisted-source-transition.json",
      policy,
    ),
    "aggregate-api-renewal-required",
  );
  assert.equal(
    classifySourcePath("tests/release/new-contract.test.mjs", policy),
    "aggregate-api-renewal-required",
  );
  assert.equal(
    classifySourcePath("release/verify-published-assets.mjs", policy),
    "release-pipeline-only",
  );
  assert.equal(
    classifySourcePath("README.md", policy),
    "documentation-record-only",
  );
  assert.equal(
    classifySourcePath("unknown/new-owner.txt", policy),
    "api-impact-review-required",
  );
  assert.throws(() => classifySourcePath("../escape", policy), /Noncanonical/);
});

test("same-specificity matches choose their strictest result without reintroducing broader prefixes", async () => {
  const { value: policy } = await loadSourceClosurePolicy(),
    overlapping = structuredClone(policy);
  overlapping.rules.push(
    {
      classification: "aggregate-api-renewal-required",
      exact: ["tests/release/same-subject.test.mjs"],
      prefixes: ["overlap/"],
    },
    {
      classification: "release-pipeline-only",
      exact: ["tests/release/same-subject.test.mjs"],
      prefixes: ["overlap/deeper/"],
    },
    {
      classification: "profile-qualification-required",
      exact: [],
      prefixes: ["tests/release/"],
    },
  );
  assert.equal(
    classifySourcePath("tests/release/same-subject.test.mjs", overlapping),
    "aggregate-api-renewal-required",
  );
  assert.equal(
    classifySourcePath("overlap/deeper/path.mjs", overlapping),
    "aggregate-api-renewal-required",
  );
});

test("complete A/M/D/R inventory classifies rename endpoints independently at their strictest impact", async () => {
  const repository = await temporaryRepository("voice-source-closure-v3-");
  try {
    await write(repository, "README.md", "base\n");
    await write(repository, "release/old.mjs", "export const old = true;\n");
    await write(repository, "release/delete.mjs", "delete me\n");
    await commitAll(repository, "base");
    const from = await rev(repository);
    await write(repository, "README.md", "modified\n");
    await write(
      repository,
      "release/added.mjs",
      "export const added = true;\n",
    );
    await fs.rm(path.join(repository, "release/delete.mjs"));
    await fs.mkdir(path.join(repository, "modelmanager"));
    await run("git", ["mv", "release/old.mjs", "modelmanager/old.go"], {
      cwd: repository,
    });
    await commitAll(repository, "transition");
    const to = await rev(repository),
      { value: policy } = await loadSourceClosurePolicy(),
      changes = await changedSourcePaths({ repository, from, to, policy });
    assert.deepEqual(changes.map((row) => row.status).sort(), [
      "A",
      "D",
      "M",
      "R",
    ]);
    const renamed = changes.find((row) => row.status === "R");
    assert.deepEqual(
      [renamed.oldPath, renamed.newPath, renamed.classification],
      [
        "release/old.mjs",
        "modelmanager/old.go",
        "focused-qualification-required",
      ],
    );
    assert.equal(
      sourceClosureDecision(changes),
      "focused-qualification-required",
    );
    assert.equal(
      sourceClosureDecision([
        {
          status: "M",
          path: "release/a.mjs",
          classification: "release-pipeline-only",
        },
        {
          status: "M",
          path: "README.md",
          classification: "documentation-record-only",
        },
      ]),
      "reuse-permitted",
    );
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
  }
});

test("mandatory IR-036 regression fixture is release-only on add and modify while its sibling stays aggregate", async () => {
  const repository = await temporaryRepository("voice-source-fixture-v3-");
  try {
    await write(repository, "README.md", "base\n");
    await commitAll(repository, "base");
    const base = await rev(repository),
      relative = "tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json";
    await write(repository, relative, '{"version":1}\n');
    await commitAll(repository, "add fixture");
    const added = await rev(repository),
      { value: policy } = await loadSourceClosurePolicy(),
      addedChanges = await changedSourcePaths({
        repository,
        from: base,
        to: added,
        policy,
      });
    assert.deepEqual(addedChanges, [
      { status: "A", path: relative, classification: "release-pipeline-only" },
    ]);

    await write(repository, relative, '{"version":2}\n');
    await write(
      repository,
      "tests/release/fixtures/unlisted.json",
      '{"unlisted":true}\n',
    );
    await commitAll(repository, "modify fixture and add sibling");
    const modifiedChanges = await changedSourcePaths({
      repository,
      from: added,
      to: await rev(repository),
      policy,
    });
    assert.deepEqual(modifiedChanges, [
      {
        status: "A",
        path: "tests/release/fixtures/unlisted.json",
        classification: "aggregate-api-renewal-required",
      },
      {
        status: "M",
        path: relative,
        classification: "release-pipeline-only",
      },
    ]);
    assert.equal(
      sourceClosureDecision(modifiedChanges),
      "api-impact-review-required",
    );
  } finally {
    await fs.rm(repository, { recursive: true, force: true });
  }
});

test("frozen CRR-057 213-path transition resolves to exact Policy 3 expectations", async () => {
  const fixture = JSON.parse(await fs.readFile(transitionFixturePath, "utf8")),
    { value: policy } = await loadSourceClosurePolicy(),
    changes = await changedSourcePaths({
      repository: projectRoot,
      from: historicalFocusedSource,
      to: historicalIr036Source,
      policy,
    });
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.fixtureId, "ir-036-f-to-d-changed-paths-v1");
  assert.deepEqual(changes, fixture.changedPaths);
  assert.deepEqual(classificationCounts(changes), fixture.expectedCounts);
  assert.equal(changes.length, 213);
  assert.equal(sourceClosureDecision(changes), fixture.expectedDecision);
  assert.equal(fixture.expectedDecision, "reuse-permitted");
});

test("production Admission 4 assembler accepts actual current F..D with exact API-REV-025 subjects", async () => {
  const admittedSourceCommit = await rev(projectRoot),
    evidenceRoot = path.join(
      projectRoot,
      "tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-025",
    ),
    aggregate = path.join(evidenceRoot, "aggregate"),
    hostBuild = path.join(evidenceRoot, "host-build"),
    temporary = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-current-admission-v4-"),
    ),
    focusedAuthorities = {
      focusedQualificationSet: path.join(
        aggregate,
        "focused-qualification-set-v3.json",
      ),
      branchCatalogProjection: path.join(
        aggregate,
        "branch-catalog-projection-v3.json",
      ),
      branchCatalogProjectionVerification: path.join(
        aggregate,
        "branch-catalog-projection-verification-v3.json",
      ),
      englishExecutionClosure: path.join(
        aggregate,
        "english-profile-execution-closure-v2.json",
      ),
      chineseExecutionClosure: path.join(
        aggregate,
        "chinese-profile-execution-closure-v2.json",
      ),
    };
  try {
    const admittedHostClosures = await Promise.all(
        ["english", "chinese"].map(async (profileId) => ({
          profileId,
          ...(await ordinaryFileIdentity(
            path.join(
              hostBuild,
              `${profileId}-prebuild-host-source-closure-v1.json`,
            ),
          )),
        })),
      ),
      admission = await assembleReleaseSourceAdmission({
        repository: projectRoot,
        focusedSourceCommit: historicalFocusedSource,
        admittedSourceCommit,
        focusedAuthorities,
        admittedHostClosures,
        output: path.join(temporary, "release-source-admission-v4.json"),
      });
    assert.equal(admission.decision, "reuse-permitted");
    assert.equal(admission.profiles.length, 2);
    assert.ok(admission.profiles.every((profile) => profile.equal));
    assert.ok(
      admission.changedPaths.some(
        (row) =>
          row.path ===
            "tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json" &&
          row.classification === "release-pipeline-only",
      ),
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

function classificationCounts(changes) {
  const counts = Object.fromEntries(
    [
      "profile-qualification-required",
      "focused-qualification-required",
      "aggregate-api-renewal-required",
      "release-pipeline-only",
      "documentation-record-only",
      "api-impact-review-required",
    ].map((classification) => [classification, 0]),
  );
  for (const change of changes) counts[change.classification] += 1;
  return counts;
}

async function temporaryRepository(prefix) {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await run("git", ["init", "-q"], { cwd: repository });
  await run("git", ["config", "user.email", "test@example.invalid"], {
    cwd: repository,
  });
  await run("git", ["config", "user.name", "Test"], { cwd: repository });
  return repository;
}

async function write(root, relative, value) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, value);
}

async function commitAll(repository, message) {
  await run("git", ["add", "-A"], { cwd: repository });
  await run("git", ["commit", "-q", "-m", message], { cwd: repository });
}

async function rev(repository) {
  return (
    await run("git", ["rev-parse", "HEAD"], { cwd: repository })
  ).stdout.trim();
}
