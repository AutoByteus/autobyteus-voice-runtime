import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  CANDIDATE_MEMBERS,
  assembleQualifiedCandidate,
  verifyQualifiedCandidate,
  writeCandidatePromotionRecord,
} from "../../release/qualified-release-candidate.mjs";
import {
  qualifiedCandidateFixture,
  refreshAggregateAuthorityFixture,
} from "./qualified-candidate-fixture.mjs";
import {
  aggregateAuthorityReference,
  gitBlobSha256,
  preliminaryAdmissionReference,
  verifyAggregateAuthority,
  verifyCandidateAdmission,
} from "../../release/candidate-authority.mjs";
import { canonicalObjectSha256 } from "../../release/source-closure.mjs";
import { sha256 } from "../../build/lib/files.mjs";

const run = promisify(execFile);

test("candidate assembler closes exactly 19 members and independently rehashes them", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const manifest = await assembleQualifiedCandidate({
      candidate: fixture.candidate,
      promotionInput: fixture.promotionInput,
      authority: fixture.authority,
    });
    assert.equal(CANDIDATE_MEMBERS.length, 19);
    assert.equal(manifest.archiveRecovery.rawEvidence.items.length, 8);
    assert.equal(manifest.apiEvidenceManifests.length, 3);
    assert.equal(manifest.providerArchives.items.length, 2);
    assert.equal(manifest.archiveRecovery.result.decision, "pass");
    assert.equal(manifest.archiveRecovery.evidenceManifest.entryCount, 8);
    assert.equal(
      manifest.archiveRecovery.evidenceManifest.coverage,
      "raw-recovery-evidence-only",
    );
    await verifyQualifiedCandidate(fixture.candidate, {
      authority: fixture.authority,
    });
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("candidate verifier rejects raw, manifest, Result, archive, and member drift", async (t) => {
  for (const [name, mutate, expected] of [
    [
      "raw byte drift",
      (fixture) =>
        fs.appendFile(
          path.join(fixture.candidate, "recovery/english-build.log"),
          "tamper\n",
        ),
      /does not close|recomputation/,
    ],
    [
      "extra recovery member",
      (fixture) =>
        fs.writeFile(
          path.join(fixture.candidate, "recovery/unexpected.json"),
          "{}\n",
        ),
      /absent or extra recovery member|member closure/,
    ],
    [
      "archive byte drift",
      (fixture) =>
        fs.appendFile(
          path.join(
            fixture.candidate,
            `assets/${fixture.authority.archives[0].fileName}`,
          ),
          "tamper\n",
        ),
      /member identity mismatch/,
    ],
  ])
    await t.test(name, async () => {
      const fixture = await qualifiedCandidateFixture();
      try {
        await assembleQualifiedCandidate({
          candidate: fixture.candidate,
          promotionInput: fixture.promotionInput,
          authority: fixture.authority,
        });
        await mutate(fixture);
        await assert.rejects(
          verifyQualifiedCandidate(fixture.candidate, {
            authority: fixture.authority,
          }),
          expected,
        );
      } finally {
        await fs.rm(fixture.temp, { recursive: true, force: true });
      }
    });
});

test("candidate rejects recovery workflow/Result and same-source disagreement", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    fixture.promotionInput.archiveRecoveryWorkflow.headSha = "c".repeat(40);
    await assert.rejects(
      assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      /workflow head/,
    );
    fixture.promotionInput.archiveRecoveryWorkflow.headSha = "a".repeat(40);
    const resultPath = path.join(
        fixture.candidate,
        "recovery/qualified-archive-recovery-result-v1.json",
      ),
      result = JSON.parse(await fs.readFile(resultPath, "utf8"));
    result.qualifiedAuthority.sourceCommit = "d".repeat(40);
    await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
    await assert.rejects(
      assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      /source|Recovery Result archive mismatch|lineage/i,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("candidate rejects a schema-valid partial non-Pass recovery", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const resultPath = path.join(
        fixture.candidate,
        "recovery/qualified-archive-recovery-result-v1.json",
      ),
      result = JSON.parse(await fs.readFile(resultPath, "utf8"));
    result.decision = "fail";
    result.failure = {
      category: "package-build-failed",
      stage: "package-build",
    };
    result.profileRecoveries = [
      {
        profileId: "english",
        sequence: 1,
        outcome: "failed",
        build: { planned: 1, attempted: 1, completed: 0 },
        archive: { status: "unavailable" },
        failure: result.failure,
      },
      {
        profileId: "chinese",
        sequence: 2,
        outcome: "unattempted",
        build: { planned: 1, attempted: 0, completed: 0 },
        archive: { status: "unavailable" },
        unavailability: {
          category: "prior-profile-failed",
          blockedByProfileId: "english",
        },
      },
    ];
    result.execution.profileBuilds = {
      planned: 2,
      attempted: 1,
      completed: 0,
      succeeded: 0,
      failed: 1,
      unattempted: 1,
    };
    await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
    await assert.rejects(
      assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      /not Pass/,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("candidate rejects weak admission, aggregate authority, and raw projection bindings", async (t) => {
  for (const [name, mutate, expected] of [
    [
      "preliminary admission object digest",
      async (fixture) => {
        const manifestPath = path.join(
            fixture.candidate,
            "qualified-release-candidate-v1.json",
          ),
          manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
        manifest.preliminarySourceAdmission.canonicalSha256 = "f".repeat(64);
        await fs.writeFile(
          manifestPath,
          `${JSON.stringify(manifest, null, 2)}\n`,
        );
      },
      /preliminary admission reference|recomputation/,
    ],
    [
      "aggregate authority bytes",
      async (fixture) => {
        const manifestPath = path.join(
            fixture.candidate,
            "qualified-release-candidate-v1.json",
          ),
          manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
        manifest.aggregateAuthority.gitBlobSha256 = "e".repeat(64);
        await fs.writeFile(
          manifestPath,
          `${JSON.stringify(manifest, null, 2)}\n`,
        );
      },
      /Aggregate API authority (reference is not exact|byte identity)/,
    ],
    [
      "raw profile projection",
      async (fixture) => {
        const target = path.join(
            fixture.candidate,
            "recovery/english-profile-recovery-v1.json",
          ),
          value = JSON.parse(await fs.readFile(target, "utf8"));
        value.profileRecovery.build.completed = 0;
        await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
      },
      /does not close|archive mismatch/,
    ],
  ])
    await t.test(name, async () => {
      const fixture = await qualifiedCandidateFixture();
      try {
        await assembleQualifiedCandidate({
          candidate: fixture.candidate,
          promotionInput: fixture.promotionInput,
          authority: fixture.authority,
        });
        await mutate(fixture);
        await assert.rejects(
          verifyQualifiedCandidate(fixture.candidate, {
            authority: fixture.authority,
          }),
          expected,
        );
      } finally {
        await fs.rm(fixture.temp, { recursive: true, force: true });
      }
    });
});

test("candidate admission recomputation rejects a changed-path omission", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const incomplete = structuredClone(fixture.preliminarySourceAdmission);
    incomplete.changedPaths = [];
    incomplete.changedPathsSha256 = canonicalObjectSha256([]);
    await assert.rejects(
      verifyCandidateAdmission({
        admission: incomplete,
        reference: preliminaryAdmissionReference(incomplete),
        expectedAdmission: fixture.preliminarySourceAdmission,
      }),
      /does not recompute/,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

test("aggregate authority binds every Git, API, profile, and aggregate subject", async (t) => {
  for (const [name, mutate, expected] of [
    [
      "record commit versus admission",
      (fixture) =>
        refreshAggregateAuthorityFixture(fixture, {
          recordCommit: "f".repeat(40),
        }),
      /does not bind the admission|commit lineage/,
    ],
    [
      "promotion commit versus reviewed controller",
      (fixture) => {
        fixture.promotionInput.promotionCommit = "f".repeat(40);
      },
      /does not bind the admission|commit lineage/,
    ],
    [
      "reviewed source commit",
      (fixture) => {
        fixture.aggregateRecord.reviewedSourceCommit = "f".repeat(40);
        refreshAggregateAuthorityFixture(fixture);
      },
      /reviewed commit lineage/,
    ],
    [
      "reviewed test commit",
      (fixture) => {
        fixture.aggregateRecord.reviewedTestCommit = "f".repeat(40);
        refreshAggregateAuthorityFixture(fixture);
      },
      /reviewed commit lineage/,
    ],
    [
      "API revision versus coverage report",
      (fixture) => {
        fixture.aggregateRecord.api.revision = "API-REV-998";
        refreshAggregateAuthorityFixture(fixture);
      },
      /coverage report subject/,
    ],
    [
      "coverage report Git blob",
      (fixture) => {
        fixture.aggregateRecord.api.coverageReport.gitBlobSha256 = "f".repeat(
          64,
        );
        refreshAggregateAuthorityFixture(fixture);
      },
      /coverage report identity/,
    ],
    [
      "coverage report content",
      (fixture) => {
        fixture.aggregateRecord.api.coverageReport.contentSha256 = "f".repeat(
          64,
        );
        refreshAggregateAuthorityFixture(fixture);
      },
      /coverage report identity/,
    ],
    [
      "retained archive",
      (fixture) => {
        fixture.aggregateRecord.retainedProfiles[0].archive.sha256 = "f".repeat(
          64,
        );
        refreshAggregateAuthorityFixture(fixture);
      },
      /retained profile identity/,
    ],
    [
      "retained profile evidence",
      (fixture) => {
        fixture.aggregateRecord.retainedProfiles[0].profileEvidence.sizeBytes += 1;
        refreshAggregateAuthorityFixture(fixture);
      },
      /retained profile evidence/,
    ],
    [
      "current Qualification Set",
      (fixture) => {
        fixture.aggregateRecord.aggregateEvidence.qualificationSet.current.sha256 =
          "f".repeat(64);
        refreshAggregateAuthorityFixture(fixture);
      },
      /qualificationSet identity/,
    ],
    [
      "prior Branch Projection",
      (fixture) => {
        fixture.aggregateRecord.aggregateEvidence.branchProjection.prior.sha256 =
          "f".repeat(64);
        refreshAggregateAuthorityFixture(fixture);
      },
      /branchProjection identity/,
    ],
    [
      "Projection Verification comparison flag",
      (fixture) => {
        fixture.aggregateRecord.aggregateEvidence.branchProjectionVerification.byteIdentical = false;
        refreshAggregateAuthorityFixture(fixture);
      },
      /branchProjectionVerification identity/,
    ],
  ])
    await t.test(name, async () => {
      const fixture = await qualifiedCandidateFixture();
      try {
        mutate(fixture);
        await assert.rejects(
          assembleQualifiedCandidate({
            candidate: fixture.candidate,
            promotionInput: fixture.promotionInput,
            authority: fixture.authority,
          }),
          expected,
        );
      } finally {
        await fs.rm(fixture.temp, { recursive: true, force: true });
      }
    });
});

test("aggregate authority resolves the committed record, report, profile evidence, and commit chain from Git", async () => {
  const fixture = await gitAggregateAuthorityFixture();
  try {
    const verified = await verifyAggregateAuthority(fixture.input);
    assert.deepEqual(verified.record, fixture.record);
    assert.deepEqual(verified.reference, fixture.reference);
  } finally {
    await fs.rm(fixture.repository, { recursive: true, force: true });
  }
});

test("promotion record is an exact immutable pointer without candidate copying", async () => {
  const fixture = await qualifiedCandidateFixture();
  try {
    const manifest = await assembleQualifiedCandidate({
        candidate: fixture.candidate,
        promotionInput: fixture.promotionInput,
        authority: fixture.authority,
      }),
      output = path.join(fixture.temp, "v1.0.0.json"),
      record = await writeCandidatePromotionRecord({
        candidate: fixture.candidate,
        authority: fixture.authority,
        output,
        recordInput: {
          workflow: {
            path: ".github/workflows/promote-qualified-voice-candidate.yml",
            runId: 999,
            headSha: manifest.promotion.approvalCommit,
            conclusion: "success",
          },
          artifact: {
            id: 1000,
            name: `qualified-release-candidate-v1.0.0-${manifest.promotion.approvalCommit}`,
            expiresAt: "2099-01-01T00:00:00.000Z",
          },
        },
      });
    assert.deepEqual(Object.keys(record).sort(), [
      "artifact",
      "candidateManifest",
      "packageVersion",
      "repository",
      "schemaVersion",
      "workflow",
    ]);
    assert.equal(JSON.stringify(record).includes("latest"), false);
    assert.equal(JSON.stringify(record).includes("providerArchives"), false);
    await assert.rejects(
      writeCandidatePromotionRecord({
        candidate: fixture.candidate,
        authority: fixture.authority,
        output: path.join(fixture.temp, "wrong-head.json"),
        recordInput: {
          ...record,
          workflow: { ...record.workflow, headSha: "e".repeat(40) },
        },
      }),
      /lineage mismatch/,
    );
  } finally {
    await fs.rm(fixture.temp, { recursive: true, force: true });
  }
});

async function gitAggregateAuthorityFixture() {
  const repository = await fs.mkdtemp(
      path.join(os.tmpdir(), "aggregate-authority-git-"),
    ),
    digest = (seed) => sha256(Buffer.from(seed)),
    closure = {
      profile: {
        closureId: "profile-closure-v1",
        inventorySha256: digest("profile-inventory"),
        treeSha256: digest("profile-tree"),
      },
      qualificationAuthority: {
        closureId: "qualification-authority-closure-v1",
        inventorySha256: digest("qualification-inventory"),
        treeSha256: digest("qualification-tree"),
      },
    },
    archives = ["english", "chinese"].map((profileId, index) => ({
      profileId,
      fileName: `voice-${profileId}-darwin-arm64-1.0.0.zip`,
      sizeBytes: 100 + index,
      sha256: digest(`${profileId}-archive`),
    })),
    aggregate = {
      qualificationSet: fileIdentity("qualification-set-v2.json", digest),
      branchProjection: fileIdentity(
        "branch-catalog-projection-v2.json",
        digest,
      ),
      branchProjectionVerification: fileIdentity(
        "branch-catalog-projection-verification-v2.json",
        digest,
      ),
    };
  await run("git", ["init", "-q"], { cwd: repository });
  await run("git", ["config", "user.name", "Aggregate Authority Test"], {
    cwd: repository,
  });
  await run("git", ["config", "user.email", "aggregate@example.invalid"], {
    cwd: repository,
  });
  const profileEvidence = [];
  for (const profileId of ["english", "chinese"]) {
    const fileName = "qualification-summary-v2.json",
      relative = `tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/${profileId}-darwin-arm64/${fileName}`,
      bytes = Buffer.from(`${profileId} qualification summary\n`);
    await fs.mkdir(path.dirname(path.join(repository, relative)), {
      recursive: true,
    });
    await fs.writeFile(path.join(repository, relative), bytes);
    profileEvidence.push({
      fileName,
      sizeBytes: bytes.length,
      sha256: sha256(bytes),
    });
  }
  await fs.writeFile(path.join(repository, "source.txt"), "source\n");
  await commitAll(repository, "reviewed source");
  const reviewedSourceCommit = await head(repository);
  await fs.writeFile(path.join(repository, "aggregate.test"), "tests\n");
  await commitAll(repository, "reviewed aggregate tests");
  const reviewedTestCommit = await head(repository),
    apiRevision = "API-REV-999",
    coverageBytes = Buffer.from(
      `# Aggregate API renewal\n\n${apiRevision}\n${reviewedSourceCommit}\n${reviewedTestCommit}\n`,
    ),
    coveragePath =
      "tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md";
  await fs.mkdir(path.dirname(path.join(repository, coveragePath)), {
    recursive: true,
  });
  await fs.writeFile(path.join(repository, coveragePath), coverageBytes);
  const record = {
    schemaVersion: 1,
    artifactKind: "aggregate-api-renewal",
    repository: "AutoByteus/autobyteus-voice-runtime",
    packageVersion: "1.0.0",
    reviewedSourceCommit,
    reviewedTestCommit,
    api: {
      revision: apiRevision,
      decision: "pass",
      coverageReport: {
        repositoryPath: coveragePath,
        gitBlobSha256: gitBlobSha256(coverageBytes),
        contentSha256: sha256(coverageBytes),
      },
      profileExecutionCount: 0,
    },
    profileClosure: closure.profile,
    retainedProfiles: archives.map((archive, index) => ({
      profileId: archive.profileId,
      archive: {
        fileName: archive.fileName,
        sizeBytes: archive.sizeBytes,
        sha256: archive.sha256,
      },
      profileEvidence: profileEvidence[index],
    })),
    aggregateEvidence: Object.fromEntries(
      Object.entries(aggregate).map(([key, identity]) => [
        key,
        {
          current: identity,
          prior: identity,
          byteIdentical: true,
        },
      ]),
    ),
    qualificationAuthority: closure.qualificationAuthority,
  };
  const recordPath =
    "release/candidates/authority/v1.0.0-aggregate-api-renewal-v1.json";
  await fs.mkdir(path.dirname(path.join(repository, recordPath)), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(repository, recordPath),
    `${JSON.stringify(record, null, 2)}\n`,
  );
  await commitAll(repository, "commit aggregate authority");
  const recordCommit = await head(repository);
  await fs.writeFile(path.join(repository, "controller.txt"), "controller\n");
  await commitAll(repository, "reviewed promotion controller");
  const promotionCommit = await head(repository),
    recordBytes = await gitShow(repository, recordCommit, recordPath),
    reference = aggregateAuthorityReference({
      record,
      bytes: recordBytes,
      recordCommit,
    }),
    changedPaths = [
      {
        status: "M",
        path: "controller.txt",
        category: "release-pipeline-only",
      },
    ],
    admission = {
      schemaVersion: 1,
      artifactKind: "preliminary-source-admission",
      acceptedAuthorityCommit: recordCommit,
      reviewedControllerCommit: promotionCommit,
      closures: { accepted: closure },
      changedPaths,
      changedPathsSha256: canonicalObjectSha256(changedPaths),
      decision: "reuse-permitted",
    },
    subjects = {
      promotionCommit,
      retainedProfiles: archives.map((archive, index) => ({
        profileId: archive.profileId,
        archive: {
          fileName: archive.fileName,
          sizeBytes: archive.sizeBytes,
          sha256: archive.sha256,
        },
        profileEvidence: {
          fileName: profileEvidence[index].fileName,
          sha256: profileEvidence[index].sha256,
        },
      })),
      aggregate: { current: aggregate, prior: aggregate },
    };
  return {
    repository,
    record,
    reference,
    input: { reference, admission, subjects, repository },
  };
}

function fileIdentity(fileName, digest) {
  return { fileName, sizeBytes: 10, sha256: digest(fileName) };
}

async function commitAll(repository, message) {
  await run("git", ["add", "."], { cwd: repository });
  await run("git", ["commit", "-q", "-m", message], { cwd: repository });
}

async function head(repository) {
  return (
    await run("git", ["rev-parse", "HEAD"], { cwd: repository })
  ).stdout.trim();
}

async function gitShow(repository, commit, fileName) {
  return (
    await run("git", ["show", `${commit}:${fileName}`], {
      cwd: repository,
      encoding: "buffer",
    })
  ).stdout;
}
