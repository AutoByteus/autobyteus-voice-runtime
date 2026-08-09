import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, sha256 } from "../../build/lib/files.mjs";
import {
  RAW_RECOVERY_MEMBERS,
  RECOVERY_MANIFEST_PATH,
  RECOVERY_MEMBER_ALLOWLIST,
  RECOVERY_RESULT_PATH,
  parseRecoveryManifest,
  serializeRecoveryManifest,
  verifyRecoveryManifest,
  writeRecoveryManifest,
} from "../../release/recovery-evidence.mjs";
import { verifyRawRecoveryAuthority } from "../../release/recovery-raw-verifier.mjs";
import { executeSequentialRecovery } from "../../release/recovery-build.mjs";
import {
  blockedRecoveries,
  failedRecovery,
  succeededRecovery,
  summarizeProfileRecoveries,
} from "../../release/recovery-outcomes.mjs";
import {
  buildRecoveryResult,
  validateRecoveryResult,
} from "../../release/recovery-result.mjs";
import { ACCEPTED_ARCHIVES } from "../../release/recovery-authority.mjs";
import { recoverQualifiedArchives } from "../../release/recover-qualified-voice-archives.mjs";

const root = path.resolve(import.meta.dirname, "../..");

test("Recovery Evidence Manifest closes exactly eight earlier raw members", async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-recovery-evidence-"),
  );
  try {
    for (const [index, fileName] of RAW_RECOVERY_MEMBERS.entries()) {
      const target = path.join(temp, fileName);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, `raw recovery evidence ${index}\n`);
    }
    const identity = await writeRecoveryManifest(temp),
      manifest = await fs.readFile(path.join(temp, RECOVERY_MANIFEST_PATH));
    assert.equal(identity.sizeBytes, 807);
    assert.equal(identity.entryCount, 8);
    assert.equal(identity.coverage, "raw-recovery-evidence-only");
    assert.deepEqual(
      parseRecoveryManifest(manifest).map((item) => item.fileName),
      RAW_RECOVERY_MEMBERS,
    );
    await verifyRecoveryManifest(temp, identity);
    await fs.appendFile(path.join(temp, RAW_RECOVERY_MEMBERS[0]), "tamper\n");
    await assert.rejects(verifyRecoveryManifest(temp), /does not close/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("Recovery manifest rejects reverse, self, archive, candidate, and API edges", () => {
  const good = RAW_RECOVERY_MEMBERS.map((fileName, index) => ({
    fileName,
    sizeBytes: index + 1,
    sha256: String(index + 1).repeat(64),
  }));
  assert.equal(serializeRecoveryManifest(good).length, 807);
  for (const fileName of [
    RECOVERY_RESULT_PATH,
    RECOVERY_MANIFEST_PATH,
    "assets/voice-english-darwin-arm64-1.0.0.zip",
    "qualified-release-candidate-v1.json",
    "api-evidence/api-rev-017-SHA256SUMS.txt",
  ]) {
    const changed = structuredClone(good);
    changed[0].fileName = fileName;
    assert.throws(
      () => serializeRecoveryManifest(changed),
      /exact canonical raw set/,
    );
  }
  const unsorted = structuredClone(good);
  [unsorted[0], unsorted[1]] = [unsorted[1], unsorted[0]];
  assert.throws(
    () => serializeRecoveryManifest(unsorted),
    /exact canonical raw set/,
  );
  const duplicate = structuredClone(good);
  duplicate[1] = duplicate[0];
  assert.throws(
    () => serializeRecoveryManifest(duplicate),
    /exact canonical raw set/,
  );
});

test("Recovery Result schema forbids qualification and release claims", async () => {
  const schema = await readJson(
      path.join(
        root,
        "contracts/release/qualified-archive-recovery-result-v1.schema.json",
      ),
    ),
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema),
    forbidden = {
      schemaVersion: 1,
      artifactKind: "qualified-archive-recovery-result",
      repository: "AutoByteus/autobyteus-voice-runtime",
      packageVersion: "1.0.0",
      decision: "pass",
      quality: { wer: 0 },
    };
  assert.equal(validate(forbidden), false);
  assert.ok(
    validate.errors.some((item) => item.keyword === "additionalProperties"),
  );
});

test("Recovery controller owns one build/profile and no runtime qualification command", async () => {
  const controller = await fs.readFile(
      path.join(root, "release/recovery-build.mjs"),
      "utf8",
    ),
    workflow = await fs.readFile(
      path.join(root, ".github/workflows/recover-qualified-voice-archives.yml"),
      "utf8",
    );
  assert.match(controller, /for \(const expected of archives\)/);
  assert.match(controller, /build\/package-assembler\.mjs/);
  assert.doesNotMatch(
    `${controller}\n${workflow}`,
    /run-profile-qualification|qualify:profile|caffeinate|\/usr\/sbin\/purge|corpus-v1/i,
  );
  assert.deepEqual(
    RECOVERY_MEMBER_ALLOWLIST,
    [
      ...RAW_RECOVERY_MEMBERS,
      RECOVERY_MANIFEST_PATH,
      RECOVERY_RESULT_PATH,
    ].sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    ),
  );
});

test("blocked and sequential failures retain truthful profile/count variants", async () => {
  const manifest = {
      fileName: RECOVERY_MANIFEST_PATH,
      sizeBytes: 807,
      sha256: "a".repeat(64),
      entryCount: 8,
      coverage: "raw-recovery-evidence-only",
    },
    controller = {
      commit: "b".repeat(40),
      workflowPath: ".github/workflows/recover-qualified-voice-archives.yml",
      workflowSha256: "b".repeat(64),
      recoveryOwnerSha256: "c".repeat(64),
    },
    runner = {
      status: "unattempted",
      ownership: "organization-managed",
      runnerGroup: "voice-runtime-recovery",
      runnerId: "org-managed-voice-recovery-fixture",
    },
    blockedRows = blockedRecoveries(ACCEPTED_ARCHIVES),
    blocked = buildRecoveryResult({
      controller,
      runner,
      profileRecoveries: blockedRows,
      evidenceManifest: manifest,
      failure: {
        category: "preliminary-source-admission-not-reuse",
        stage: "preliminary-source-admission",
      },
    });
  await validateRecoveryResult(blocked);
  assert.equal(blocked.decision, "blocked");
  assert.deepEqual(blocked.execution.profileBuilds, {
    planned: 2,
    attempted: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    unattempted: 2,
  });
  const firstFailure = await executeSequentialRecovery({
    recover: async (expected) => {
      if (expected.profileId === "english") {
        const error = new Error("fixture");
        error.recoveryCategory = "package-build-failed";
        error.recoveryStage = "package-build";
        throw error;
      }
      throw new Error("Chinese must remain unattempted");
    },
  });
  assert.deepEqual(
    firstFailure.profileRecoveries.map((row) => row.outcome),
    ["failed", "unattempted"],
  );
  assert.equal(
    firstFailure.profileRecoveries[1].unavailability.blockedByProfileId,
    "english",
  );
  assert.deepEqual(
    summarizeProfileRecoveries(firstFailure.profileRecoveries).profileBuilds,
    {
      planned: 2,
      attempted: 1,
      completed: 0,
      succeeded: 0,
      failed: 1,
      unattempted: 1,
    },
  );
  const mismatch = await executeSequentialRecovery({
    recover: async (expected) => observedArchive(expected, false),
  });
  assert.equal(mismatch.profileRecoveries[0].outcome, "failed");
  assert.equal(mismatch.profileRecoveries[0].build.completed, 1);
  assert.equal(mismatch.profileRecoveries[0].archive.status, "rejected");
  assert.equal(mismatch.profileRecoveries[0].archive.exactMatch, false);
});

test("non-reuse preliminary admission finalizes blocked evidence before build", async () => {
  const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "voice-recovery-block-"),
    ),
    output = path.join(temp, "output"),
    commit = "b".repeat(40),
    digestValue = "c".repeat(64),
    config = {
      qualifiedSource: path.join(temp, "source"),
      output,
      cacheRoot: path.join(temp, "cache"),
      go: path.join(temp, "go"),
      cmake: path.join(temp, "cmake"),
      preflight: path.join(temp, "preflight.json"),
      runnerGroup: "voice-runtime-recovery",
      runnerId: "org-managed-voice-recovery-fixture",
      workflowRunId: 1,
      controllerCommit: commit,
    };
  let buildCalled = false;
  try {
    await assert.rejects(
      recoverQualifiedArchives(config, {
        assertControllerCheckout: async () => {},
        loadPolicy: async () => ({
          value: {
            closures: {
              qualificationAuthority: { baseCommit: "a".repeat(40) },
            },
          },
          sha256: digestValue,
        }),
        assessAdmission: async () => ({
          schemaVersion: 1,
          artifactKind: "preliminary-source-admission",
          decision: "aggregate-api-renewal-required",
        }),
        controllerIdentity: async () => ({
          commit,
          workflowPath:
            ".github/workflows/recover-qualified-voice-archives.yml",
          workflowSha256: digestValue,
          recoveryOwnerSha256: digestValue,
        }),
        checkoutIdentity: async () => {
          throw new Error("checkout must not run");
        },
        runnerIdentity: async () => {
          throw new Error("runner must not run");
        },
        verifyNetwork: async () => {
          throw new Error("network must not run");
        },
        executeBuild: async () => {
          buildCalled = true;
          throw new Error("build must not run");
        },
      }),
      (error) => {
        assert.equal(error.recoveryResult.decision, "blocked");
        assert.equal(error.recoveryResult.execution.profileBuilds.attempted, 0);
        return true;
      },
    );
    assert.equal(buildCalled, false);
    const result = await readJson(path.join(output, RECOVERY_RESULT_PATH));
    assert.equal(
      result.failure.category,
      "preliminary-source-admission-not-reuse",
    );
    assert.deepEqual(
      result.profileRecoveries.map((row) => row.outcome),
      ["unattempted", "unattempted"],
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test("raw recovery verifier cross-binds runner, profiles, and archive bytes", async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "voice-recovery-raw-"));
  try {
    await fs.mkdir(path.join(temp, "assets"), { recursive: true });
    await fs.mkdir(path.join(temp, "recovery"), { recursive: true });
    const digest = (value) => sha256(Buffer.from(value)),
      sourceCommit = "a".repeat(40),
      sourceTree = "b".repeat(40),
      matrix = {
        matrixId: "voice-runtime-darwin-arm64-v1",
        sha256: digest("matrix"),
      },
      archives = [];
    for (const profileId of ["english", "chinese"]) {
      const bytes = Buffer.from(`${profileId} archive\n`),
        fileName = `voice-${profileId}-darwin-arm64-1.0.0.zip`;
      await fs.writeFile(path.join(temp, "assets", fileName), bytes);
      await fs.writeFile(
        path.join(temp, "recovery", `${profileId}-build.log`),
        "bounded\n",
      );
      archives.push({
        profileId,
        recipeSha256: digest(`${profileId}-recipe`),
        provenanceSha256: digest(`${profileId}-provenance`),
        repositoryBuildLockSha256: digest(`${profileId}-lock`),
        nativeBuildEnvironmentSha256: digest("native"),
        goToolchainRootTreeSha256: digest("go"),
        buildReportSha256: digest(`${profileId}-report`),
        fileName,
        sizeBytes: bytes.length,
        sha256: digest(`${profileId} archive\n`),
        descriptorSha256: digest(`${profileId}-descriptor`),
        fileManifestSha256: digest(`${profileId}-manifest`),
      });
    }
    const controller = {
        commit: "c".repeat(40),
        workflowPath: ".github/workflows/recover-qualified-voice-archives.yml",
        workflowSha256: digest("workflow"),
        recoveryOwnerSha256: digest("owner"),
      },
      environment = {
        platform: "darwin",
        architecture: "arm64",
        runnerGroup: "voice-runtime-recovery",
        runnerId: "org-managed-voice-recovery-test",
        goSha256: digest("go-bin"),
        cmakeSha256: digest("cmake"),
        preflightSha256: digest("preflight"),
      },
      runner = {
        schemaVersion: 1,
        status: "verified",
        ownership: "organization-managed",
        platform: environment.platform,
        architecture: environment.architecture,
        runnerGroup: environment.runnerGroup,
        runnerId: environment.runnerId,
        environmentSha256: sha256(
          Buffer.from(`${JSON.stringify(environment)}\n`),
        ),
        environment,
      },
      observed = archives.map((item) =>
        observedArchive(item, true, sourceCommit),
      ),
      profileRecoveries = archives.map((item, index) => ({
        ...succeededRecovery(item, observed[index]),
        sequence: index + 1,
      })),
      execution = {
        profileBuilds: {
          planned: 2,
          attempted: 2,
          completed: 2,
          succeeded: 2,
          failed: 0,
          unattempted: 0,
        },
        providerStarts: 0,
        inferenceRequests: 0,
        corpusRuns: 0,
        coldTrials: 0,
        warmPreparationTrials: 0,
        warmRequestTrials: 0,
      },
      closedInputs = {
        releaseMatrixSha256: matrix.sha256,
        items: archives.map((item) => ({
          profileId: item.profileId,
          recipeSha256: item.recipeSha256,
          provenanceSha256: item.provenanceSha256,
          repositoryBuildLockSha256: item.repositoryBuildLockSha256,
          nativeBuildEnvironmentSha256: item.nativeBuildEnvironmentSha256,
          goToolchainRootTreeSha256: item.goToolchainRootTreeSha256,
        })),
      },
      result = {
        controller,
        runner: { status: "verified", ...withoutEnvironment(runner) },
        closedInputs,
        profileRecoveries,
        execution,
      },
      admission = {
        schemaVersion: 1,
        artifactKind: "preliminary-source-admission",
        decision: "reuse-permitted",
        changedPaths: [],
        changedPathsSha256: sha256(Buffer.from("[]")),
      },
      raw = [
        {
          repository: "AutoByteus/autobyteus-voice-runtime",
          packageVersion: "1.0.0",
          workflowRunId: 1,
          controller,
          preliminarySourceAdmission: admission,
          commands: [
            "materialize exact closed inputs per profile",
            "create trusted native build environment",
            "network-denied package assembly once per profile",
            "verify provider archive identities",
          ],
          execution,
        },
        {
          status: "verified",
          headCommit: sourceCommit,
          tree: sourceTree,
          clean: true,
          detached: true,
        },
        runner,
        {
          decision: "pass",
          profileFileName:
            "benchmark/sandbox/darwin-arm64-network-denied-v1.sb",
          profileSha256: digest("sandbox"),
          canary: "outbound-tcp-denied",
          buildWindow: "network-denied",
        },
        ...archives.map((item, index) => ({
          schemaVersion: 1,
          qualifiedSourceCommit: sourceCommit,
          releaseMatrix: matrix,
          accepted: item,
          profileRecovery: profileRecoveries[index],
        })),
      ],
      authority = {
        sourceCommit,
        sourceTree,
        matrix,
        archives,
        networkProfileSha256: digest("sandbox"),
        admission,
      };
    await verifyRawRecoveryAuthority(temp, result, raw, authority);
    raw[2].environment.runnerId = "drifted-runner";
    await assert.rejects(
      verifyRawRecoveryAuthority(temp, result, raw, authority),
      /incomplete or inconsistent/,
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

function withoutEnvironment(runner) {
  const { schemaVersion: _, environment: __, ...result } = runner;
  return result;
}

function observedArchive(expected, exactMatch, sourceCommit = "a".repeat(40)) {
  return {
    profileId: expected.profileId,
    observedSizeBytes: expected.sizeBytes,
    observedSha256: expected.sha256,
    descriptorSha256: expected.descriptorSha256,
    fileManifestSha256: expected.fileManifestSha256,
    descriptorSourceCommit: sourceCommit,
    buildReportSha256: expected.buildReportSha256,
    provenanceSha256: expected.provenanceSha256,
    exactMatch,
  };
}
