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
  assert.match(controller, /for \(const expected of ACCEPTED_ARCHIVES\)/);
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
      observed = archives.map((item) => ({
        profileId: item.profileId,
        buildCount: 1,
        fileName: item.fileName,
        expectedSizeBytes: item.sizeBytes,
        observedSizeBytes: item.sizeBytes,
        expectedSha256: item.sha256,
        observedSha256: item.sha256,
        descriptorSha256: item.descriptorSha256,
        fileManifestSha256: item.fileManifestSha256,
        descriptorSourceCommit: sourceCommit,
        buildReportSha256: item.buildReportSha256,
        provenanceSha256: item.provenanceSha256,
        exactMatch: true,
      })),
      execution = {
        packageBuildsPerProfile: 1,
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
        runner: withoutEnvironment(runner),
        closedInputs,
        archives: observed,
        execution,
      },
      raw = [
        {
          repository: "AutoByteus/autobyteus-voice-runtime",
          packageVersion: "1.0.0",
          workflowRunId: 1,
          controller,
          commands: [
            "materialize exact closed inputs per profile",
            "create trusted native build environment",
            "network-denied package assembly once per profile",
            "verify provider archive identities",
          ],
          execution,
        },
        {
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
          decision: "pass",
          qualifiedSourceCommit: sourceCommit,
          releaseMatrix: matrix,
          accepted: item,
          observed: observed[index],
        })),
      ],
      authority = {
        sourceCommit,
        sourceTree,
        matrix,
        archives,
        networkProfileSha256: digest("sandbox"),
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
