import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeJson } from "../../build/lib/files.mjs";
import { ordinaryFileIdentity } from "../../release/release-contract.mjs";
import { promoteReleaseAuthority } from "../../release/promote-release-authority.mjs";
import { assembleReleaseSourceAdmission } from "../../release/source-closure.mjs";

const run = promisify(execFile),
  projectRoot = path.resolve(import.meta.dirname, "../..");

export async function createReleaseAdmissionRepository(
  temporary,
  { promote = true, admittedChange = false } = {},
) {
  const repository = path.join(temporary, "repository"),
    evidence = path.join(temporary, "evidence");
  await fs.mkdir(path.join(repository, "contracts/release"), {
    recursive: true,
  });
  await fs.mkdir(path.join(repository, "contracts/catalog"), {
    recursive: true,
  });
  await fs.mkdir(evidence, { recursive: true });
  await fs.copyFile(
    path.join(projectRoot, "contracts/release/relevant-source-closure-v3.json"),
    path.join(repository, "contracts/release/relevant-source-closure-v3.json"),
  );
  await fs.copyFile(
    path.join(projectRoot, "contracts/catalog/current-release-matrix-v2.json"),
    path.join(repository, "contracts/catalog/current-release-matrix-v2.json"),
  );
  for (const args of [
    ["init", "-q"],
    ["config", "user.email", "test@example.invalid"],
    ["config", "user.name", "Test"],
    ["add", "."],
    ["commit", "-qm", "focused source"],
  ])
    await git(repository, args);
  const focusedSourceCommit = await rev(repository),
    closureFiles = {};
  for (const [profileId, digit] of [
    ["english", "a"],
    ["chinese", "b"],
  ]) {
    const file = path.join(
      evidence,
      `${profileId}-host-source-closure-v1.json`,
    );
    await writeJson(file, hostClosureFixture(profileId, digit));
    closureFiles[profileId] = file;
  }
  const currentMatrix = JSON.parse(
      await fs.readFile(
        path.join(
          repository,
          "contracts/catalog/current-release-matrix-v2.json",
        ),
        "utf8",
      ),
    ),
    profiles = [];
  for (const [profileId, digit] of [
    ["english", "1"],
    ["chinese", "2"],
  ]) {
    const matrix = currentMatrix.entries.find(
        (entry) => entry.profileId === profileId,
      ),
      closure = await ordinaryFileIdentity(closureFiles[profileId]);
    profiles.push({
      profileId,
      hostArchive: identity(
        `voice-host-${profileId}-darwin-arm64-1.0.0.zip`,
        digit,
      ),
      hostSourceClosureSha256: closure.sha256,
      hostSourceClosureSizeBytes: closure.sizeBytes,
      hostDescriptorSha256: "3".repeat(64),
      hostFileManifestSha256: "4".repeat(64),
      modelAdmissionRootSha256: matrix.modelAdmissionRoot.sha256,
      modelManifest: {
        fileName: matrix.modelManifest.fileName,
        sizeBytes: 100,
        sha256: matrix.modelManifest.sha256,
      },
      compatibilityPairSha256: "5".repeat(64),
    });
  }
  const focusedAuthorities = {
    focusedQualificationSet: path.join(
      evidence,
      "focused-qualification-set-v3.json",
    ),
    branchCatalogProjection: path.join(
      evidence,
      "branch-catalog-projection-v3.json",
    ),
    branchCatalogProjectionVerification: path.join(
      evidence,
      "branch-catalog-projection-verification-v3.json",
    ),
    englishExecutionClosure: path.join(
      evidence,
      "english-profile-execution-closure-v2.json",
    ),
    chineseExecutionClosure: path.join(
      evidence,
      "chinese-profile-execution-closure-v2.json",
    ),
  };
  await writeJson(focusedAuthorities.focusedQualificationSet, {
    schemaVersion: 3,
    artifactKind: "focused-qualification-set",
    sourceCommit: focusedSourceCommit,
    profiles,
    decision: "pass",
  });
  await writeJson(focusedAuthorities.branchCatalogProjection, {
    schemaVersion: 3,
    artifactKind: "branch-catalog-projection",
    sourceCommit: focusedSourceCommit,
    qualificationSet: await ordinaryFileIdentity(
      focusedAuthorities.focusedQualificationSet,
    ),
    profiles,
    decision: "pass",
  });
  await writeJson(focusedAuthorities.branchCatalogProjectionVerification, {
    schemaVersion: 3,
    artifactKind: "branch-catalog-projection-verification",
    projection: await ordinaryFileIdentity(
      focusedAuthorities.branchCatalogProjection,
    ),
    sourceCommit: focusedSourceCommit,
    profileCount: 2,
    decision: "pass",
  });
  for (const profileId of ["english", "chinese"])
    await writeJson(
      focusedAuthorities[`${profileId}ExecutionClosure`],
      executionClosureFixture(
        profileId,
        focusedSourceCommit,
        profiles.find((profile) => profile.profileId === profileId)
          .modelManifest.sha256,
      ),
    );

  let admittedSourceCommit = focusedSourceCommit;
  if (admittedChange) {
    const admittedPath = "release/reviewed-controller.mjs";
    await fs.mkdir(path.join(repository, "release"), { recursive: true });
    await fs.writeFile(
      path.join(repository, admittedPath),
      "export const reviewed = true;\n",
    );
    await git(repository, ["add", "--", admittedPath]);
    await git(repository, ["commit", "-qm", "review release controller"]);
    admittedSourceCommit = await rev(repository);
  }
  const admission = path.join(evidence, "release-source-admission-v4.json");
  await assembleReleaseSourceAdmission({
    repository,
    focusedSourceCommit,
    admittedSourceCommit,
    focusedAuthorities,
    admittedHostClosures: await Promise.all(
      ["english", "chinese"].map(async (profileId) => ({
        profileId,
        ...(await ordinaryFileIdentity(closureFiles[profileId])),
      })),
    ),
    output: admission,
  });
  const apiChecksums = path.join(evidence, "SHA256SUMS.txt"),
    checksumLines = [];
  for (const file of Object.values(focusedAuthorities)) {
    const observed = await ordinaryFileIdentity(file);
    checksumLines.push(
      `${observed.sha256}  ./aggregate/${path.basename(file)}\n`,
    );
  }
  await fs.writeFile(apiChecksums, checksumLines.sort().join(""));
  let authorityPromotionCommit = null;
  if (promote) {
    await promoteReleaseAuthority({
      repository,
      admission,
      focusedAuthorities,
      apiChecksums,
    });
    await git(repository, ["commit", "-qm", "promote exact release authority"]);
    authorityPromotionCommit = await rev(repository);
    await setMaintainedMain(repository, authorityPromotionCommit);
  }
  return {
    repository,
    evidence,
    admission,
    focusedAuthorities,
    apiChecksums,
    focusedSourceCommit,
    admittedSourceCommit,
    authorityPromotionCommit,
    closureFiles,
  };
}

export async function commitPath(repository, relativePath, contents, message) {
  const file = path.join(repository, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents);
  await git(repository, ["add", "--", relativePath]);
  await git(repository, ["commit", "-qm", message]);
  const commit = await rev(repository);
  await setMaintainedMain(repository, commit);
  return commit;
}

export async function setMaintainedMain(repository, commit) {
  await git(repository, ["update-ref", "refs/remotes/origin/main", commit]);
}

export async function rev(repository, subject = "HEAD") {
  return (await git(repository, ["rev-parse", subject])).stdout.trim();
}

export async function git(repository, args) {
  return run("git", args, { cwd: repository, maxBuffer: 32 * 1024 * 1024 });
}

function identity(fileName, digit) {
  return { fileName, sizeBytes: 100, sha256: digit.repeat(64) };
}

function hostClosureFixture(profileId, digit) {
  return {
    schemaVersion: 1,
    closureId: `voice-host-${profileId}-darwin-arm64-v1`,
    profileId,
    target: { platform: "darwin", architecture: "arm64" },
    repositoryFiles: [
      { path: "release/example.mjs", sizeBytes: 1, sha256: digit.repeat(64) },
    ],
    externalInputs: [
      {
        id: "input/example",
        kind: "materialized-host-input",
        identity: "c".repeat(64),
      },
    ],
    toolchain: {
      node: "node/tool",
      go: "go/tool",
      cmake: "cmake/tool",
      xcode: "xcode/tool",
      sdk: "sdk/tool",
      compiler: "compiler/tool",
    },
    buildFlags: ["-trimpath"],
    hostRecipe: { fileName: `${profileId}-host.json`, sha256: "d".repeat(64) },
    modelCompatibilityRequirement: { sha256: "e".repeat(64) },
    modelAdmissionRoot: { sha256: "f".repeat(64) },
  };
}

function executionClosureFixture(profileId, commit, modelManifestSha256) {
  const execution = {
    sourceCommit: commit,
    inferenceCoreSha256: "1".repeat(64),
    configurationSha256: "2".repeat(64),
    modelManifestSha256,
    trustedOutputSha256: "4".repeat(64),
  };
  return {
    schemaVersion: 2,
    artifactKind: "profile-execution-closure",
    profileId,
    historical: execution,
    current: execution,
    adapterExclusions: ["catalog-and-install-paths"],
    comparison: {
      inferenceCoreEqual: true,
      pathNeutralConfigurationEqual: true,
      modelIdentityEqual: true,
      outputEvidenceEqual: true,
      adapterExclusionsExact: true,
    },
    decision: "reuse-permitted",
  };
}
