import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readJson } from "../../build/lib/files.mjs";
import { validateArtifact } from "../../release/release-contract.mjs";
import { promoteReleaseAuthority } from "../../release/promote-release-authority.mjs";
import {
  verifyReleaseAdmissionLineage,
  verifyReleaseSourceAdmission,
} from "../../release/verify-release-source-admission.mjs";
import {
  commitPath,
  createReleaseAdmissionRepository,
  git,
  rev,
  setMaintainedMain,
} from "./release-admission-fixture.mjs";

const ADMISSION_SCHEMA =
  "contracts/release/release-source-admission-v4.schema.json";

test("Admission 4 promotion and Verification 1 close exact F/D/R/W authority", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-v4-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary, {
        admittedChange: true,
      }),
      lineage = await verifyReleaseAdmissionLineage({
        repository: fixture.repository,
        workflowCheckoutCommit: fixture.authorityPromotionCommit,
      });
    assert.equal(
      lineage.authorityPromotionCommit,
      fixture.authorityPromotionCommit,
    );
    assert.equal(lineage.protectedMembers.length, 6);
    const output = path.join(
        temporary,
        "release-admission-verification-v1.json",
      ),
      verification = await verifyReleaseSourceAdmission({
        repository: fixture.repository,
        workflowCheckoutCommit: fixture.authorityPromotionCommit,
        checkoutHostClosures: [
          { profileId: "english", file: fixture.closureFiles.english },
          { profileId: "chinese", file: fixture.closureFiles.chinese },
        ],
        output,
      });
    assert.equal(verification.decision, "pass");
    assert.notEqual(
      verification.focusedSourceCommit,
      verification.admittedSourceCommit,
    );
    assert.equal(verification.admittedRange.changedPaths.length, 1);
    assert.deepEqual(
      [
        verification.focusedSourceCommit,
        verification.admittedSourceCommit,
        verification.authorityPromotionCommit,
        verification.workflowCheckoutCommit,
      ],
      [
        fixture.focusedSourceCommit,
        fixture.admittedSourceCommit,
        fixture.authorityPromotionCommit,
        fixture.authorityPromotionCommit,
      ],
    );
    assert.ok(
      verification.profiles.every(
        (profile) =>
          profile.focusedToAdmittedEqual && profile.admittedToWorkflowEqual,
      ),
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("lineage verifier accepts later documentation-only W and rejects archive impact", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-w-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary),
      documentationCommit = await commitPath(
        fixture.repository,
        "README.md",
        "release note\n",
        "document release",
      );
    await verifyReleaseAdmissionLineage({
      repository: fixture.repository,
      workflowCheckoutCommit: documentationCommit,
    });
    const impacted = await commitPath(
      fixture.repository,
      "build/new-builder.mjs",
      "export const changed = true;\n",
      "change host build",
    );
    await assert.rejects(
      verifyReleaseAdmissionLineage({
        repository: fixture.repository,
        workflowCheckoutCommit: impacted,
      }),
      /independent subject check failed/,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("lineage-aware protection rejects mutation followed by byte-identical revert", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-revert-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary),
      protectedPath =
        "release/admission/v1.0.0-focused-qualification-set-v3.json";
    await commitPath(
      fixture.repository,
      protectedPath,
      "{}\n",
      "mutate protected authority",
    );
    await git(fixture.repository, [
      "checkout",
      fixture.authorityPromotionCommit,
      "--",
      protectedPath,
    ]);
    await git(fixture.repository, ["commit", "-qm", "revert protected bytes"]);
    const workflowCheckoutCommit = await rev(fixture.repository);
    await setMaintainedMain(fixture.repository, workflowCheckoutCommit);
    await assert.rejects(
      verifyReleaseAdmissionLineage({
        repository: fixture.repository,
        workflowCheckoutCommit,
      }),
      /mutated on R-bearing lineage/,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("lineage verifier accepts an integration merge that preserves the R-bearing tree", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-merge-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary);
    await git(fixture.repository, [
      "checkout",
      "-qb",
      "maintained-side",
      fixture.admittedSourceCommit,
    ]);
    await commitPath(
      fixture.repository,
      "README.md",
      "maintained main note\n",
      "maintained main documentation",
    );
    await git(fixture.repository, [
      "merge",
      "--no-ff",
      "-m",
      "integrate reviewed authority",
      fixture.authorityPromotionCommit,
    ]);
    const workflowCheckoutCommit = await rev(fixture.repository);
    await setMaintainedMain(fixture.repository, workflowCheckoutCommit);
    const observed = await verifyReleaseAdmissionLineage({
      repository: fixture.repository,
      workflowCheckoutCommit,
    });
    assert.equal(
      observed.authorityPromotionCommit,
      fixture.authorityPromotionCommit,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("lineage verifier rejects bound policy drift and checkout closure drift", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-policy-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary),
      policyPath = path.join(
        fixture.repository,
        "contracts/release/relevant-source-closure-v3.json",
      ),
      policy = await readJson(policyPath);
    policy.rules[3].exact.push("release/new-policy-subject.mjs");
    const policyCommit = await commitPath(
      fixture.repository,
      "contracts/release/relevant-source-closure-v3.json",
      `${JSON.stringify(policy, null, 2)}\n`,
      "drift source policy",
    );
    await assert.rejects(
      verifyReleaseAdmissionLineage({
        repository: fixture.repository,
        workflowCheckoutCommit: policyCommit,
      }),
      /independent subject check failed/,
    );

    await git(fixture.repository, [
      "reset",
      "--hard",
      fixture.authorityPromotionCommit,
    ]);
    await setMaintainedMain(
      fixture.repository,
      fixture.authorityPromotionCommit,
    );
    await fs.appendFile(fixture.closureFiles.english, " ");
    await assert.rejects(
      verifyReleaseSourceAdmission({
        repository: fixture.repository,
        workflowCheckoutCommit: fixture.authorityPromotionCommit,
        checkoutHostClosures: [
          { profileId: "english", file: fixture.closureFiles.english },
          { profileId: "chinese", file: fixture.closureFiles.chinese },
        ],
        output: path.join(temporary, "verification.json"),
      }),
      /invalid|differs from admission/,
    );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("Admission 4 schema forbids self and later lineage edges", async () => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-cycle-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(temporary),
      admission = await readJson(fixture.admission);
    for (const field of [
      "finalMainCommit",
      "authorityPromotionCommit",
      "workflowCheckoutCommit",
      "releaseAdmissionVerification",
      "selfSha256",
    ])
      await assert.rejects(
        validateArtifact(
          { ...admission, [field]: fixture.authorityPromotionCommit },
          ADMISSION_SCHEMA,
          `Admission 4 ${field}`,
        ),
      );
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});

test("promotion rejects checksum drift and verifier rejects a seventh promoted path", async () => {
  const checksumTemporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-checksum-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(checksumTemporary, {
      promote: false,
    });
    await fs.writeFile(
      fixture.apiChecksums,
      `${"0".repeat(64)}  ./aggregate/focused-qualification-set-v3.json\n`,
    );
    await assert.rejects(
      promoteReleaseAuthority({
        repository: fixture.repository,
        admission: fixture.admission,
        focusedAuthorities: fixture.focusedAuthorities,
        apiChecksums: fixture.apiChecksums,
      }),
      /checksum authority/,
    );
  } finally {
    await fs.rm(checksumTemporary, { recursive: true, force: true });
  }

  const extraTemporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-admission-extra-"),
  );
  try {
    const fixture = await createReleaseAdmissionRepository(extraTemporary, {
      promote: false,
    });
    await promoteReleaseAuthority({
      repository: fixture.repository,
      admission: fixture.admission,
      focusedAuthorities: fixture.focusedAuthorities,
      apiChecksums: fixture.apiChecksums,
    });
    const unexpected = "release/admission/unexpected-third-authority.json";
    await fs.writeFile(path.join(fixture.repository, unexpected), "{}\n");
    await git(fixture.repository, ["add", "--", unexpected]);
    await git(fixture.repository, ["commit", "-qm", "invalid promotion"]);
    const workflowCheckoutCommit = await rev(fixture.repository);
    await setMaintainedMain(fixture.repository, workflowCheckoutCommit);
    await assert.rejects(
      verifyReleaseAdmissionLineage({
        repository: fixture.repository,
        workflowCheckoutCommit,
      }),
      /Unique direct-child authority promotion was not found/,
    );
  } finally {
    await fs.rm(extraTemporary, { recursive: true, force: true });
  }
});
