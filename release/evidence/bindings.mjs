import Ajv2020 from "ajv/dist/2020.js";
import path from "node:path";
import { assertBuildInputPathSet } from "../../build/build-input-path-policy.mjs";
import { readJson, ROOT, sha256, shaFile } from "../../build/lib/files.mjs";
import { repositoryBuildLockDigest } from "../../build/repository-lock-set.mjs";
import { locked } from "../../build/locked-inputs.mjs";

const validateCorpusManifest = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(
  await readJson(path.join(ROOT, "benchmark/corpus/corpus-v1.schema.json")),
);

export function verifyRuntimeConformance(value) {
  const expected = [
    "cleanNextStart",
    "forcedTermination",
    "malformedAudio",
    "malformedMessage",
    "noAutomaticReplay",
    "noSpeech",
    "requestTimeout",
    "schemaVersion",
    "unexpectedExit",
  ];
  if (
    !value ||
    Object.keys(value).sort().join(",") !== expected.join(",") ||
    value.schemaVersion !== 1 ||
    expected
      .filter((key) => key !== "schemaVersion")
      .some((key) => value[key] !== true)
  )
    throw new Error("Runtime conformance evidence incomplete.");
}

export function verifyCorpusBinding(corpus, raw, summary, qualification) {
  if (
    !validateCorpusManifest(corpus) ||
    corpus.corpusId !== summary.corpus.id ||
    corpus.profileId !== qualification.profileId ||
    corpus.metric !== qualification.quality.metric ||
    corpus.license !== summary.corpus.license ||
    corpus.provenanceReference !== summary.corpus.provenanceReference ||
    corpus.redistributionApproved !== true ||
    corpus.clips.length !== raw.results.length
  )
    throw new Error("Preserved corpus manifest identity mismatch.");
  const ids = new Set(),
    paths = new Set(),
    hashes = new Set();
  for (let index = 0; index < corpus.clips.length; index++) {
    const clip = corpus.clips[index],
      result = raw.results[index];
    if (
      ids.has(clip.id) ||
      paths.has(clip.audioPath) ||
      hashes.has(clip.audioSha256) ||
      clip.id !== result.clipId ||
      clip.audioSha256 !== result.audioSha256 ||
      clip.reference !== result.reference
    )
      throw new Error("Corpus uniqueness/result pairing mismatch.");
    ids.add(clip.id);
    paths.add(clip.audioPath);
    hashes.add(clip.audioSha256);
  }
  const consentReferenceDigest = sha256(
    Buffer.from(
      `${corpus.clips
        .map((item) => `${item.id}:${item.consentReference}`)
        .sort()
        .join("\n")}\n`,
    ),
  );
  if (consentReferenceDigest !== summary.corpus.consentReferenceDigest)
    throw new Error("Corpus consent-reference evidence mismatch.");
}

export async function verifyBuildBinding(
  build,
  inputManifest,
  qualification,
  sourceCommit,
) {
  if (
    build.sourceCommit !== sourceCommit ||
    build.packageId !== qualification.packageId ||
    build.providerId !== qualification.providerId ||
    build.modelId !== qualification.modelId ||
    build.profileId !== qualification.profileId ||
    build.target.platform !== qualification.platform ||
    build.target.architecture !== qualification.architecture ||
    build.buildInputManifestSha256 !== qualification.buildInputManifestSha256 ||
    build.nativeBuildEnvironmentSha256 !==
      qualification.nativeBuildEnvironmentSha256 ||
    build.repositoryBuildLockSha256 !==
      qualification.repositoryBuildLockSha256 ||
    build.goToolchainHost?.platform !== qualification.platform ||
    build.goToolchainHost?.architecture !== qualification.architecture ||
    build.goToolchainArchiveSha256 !== qualification.goToolchainArchiveSha256 ||
    build.goToolchainRootManifestSha256 !==
      qualification.goToolchainRootManifestSha256 ||
    build.goToolchainRootTreeSha256 !==
      qualification.goToolchainRootTreeSha256 ||
    build.goToolchainRootFileCount !== qualification.goToolchainRootFileCount ||
    build.goToolchainRootSizeBytes !== qualification.goToolchainRootSizeBytes ||
    build.archive.sha256 !== qualification.archiveSha256
  )
    throw new Error("Build report identity mismatch.");
  if (
    build.preparationDiagnosticsSha256 !==
    (qualification.preparationEvidence?.diagnosticContract.sha256 ?? null)
  )
    throw new Error("Build report preparation contract mismatch.");
  for (const [field, expected] of [
    ["descriptorSha256", qualification.descriptorSha256],
    ["fileManifestSha256", qualification.fileManifestSha256],
    ["launcherSha256", qualification.launcherSha256],
    ["launcherPlanSha256", qualification.launcherPlanSha256],
    ["hostSha256", qualification.hostSha256],
    ["engineConfigurationSha256", qualification.engineConfigurationSha256],
    ["modelSha256", qualification.modelSha256],
    ["normalizerSha256", qualification.normalizerSha256],
    ["protocolSha256", qualification.protocolSha256],
    ["noticeInventorySha256", qualification.noticeInventorySha256],
  ])
    if (build[field] !== expected)
      throw new Error(`Build report ${field} mismatch.`);
  assertPreservedBuildInputManifest(inputManifest);
  const target = `${qualification.platform}-${qualification.architecture}`,
    goToolchain = locked.goToolchain.archives[target];
  if (
    !goToolchain ||
    qualification.repositoryBuildLockSha256 !==
      (await repositoryBuildLockDigest(qualification.profileId, target)) ||
    qualification.goToolchainArchiveSha256 !== goToolchain?.sha256 ||
    qualification.goToolchainRootManifestSha256 !==
      goToolchain?.rootManifestSha256 ||
    qualification.goToolchainRootTreeSha256 !== goToolchain?.rootTreeSha256 ||
    qualification.goToolchainRootFileCount !== goToolchain?.rootFileCount ||
    qualification.goToolchainRootSizeBytes !== goToolchain?.rootSizeBytes ||
    (await shaFile(
      path.join(
        ROOT,
        "build/go-toolchain-manifests",
        goToolchain.rootManifestFileName,
      ),
    )) !== goToolchain.rootManifestSha256
  )
    throw new Error("Repository-owned build/toolchain lock binding mismatch.");
}

export function assertPreservedBuildInputManifest(inputManifest) {
  if (
    inputManifest?.schemaVersion !== 1 ||
    !Array.isArray(inputManifest.files) ||
    inputManifest.files.length === 0 ||
    inputManifest.files.some(
      (item) =>
        !item ||
        !/^[a-f0-9]{64}$/.test(item.sha256) ||
        !Number.isSafeInteger(item.sizeBytes) ||
        !["executable", "read-only"].includes(item.mode),
    )
  )
    throw new Error("Preserved build-input manifest invalid.");
  try {
    assertBuildInputPathSet(inputManifest.files.map((item) => item.path));
  } catch (error) {
    throw new Error("Preserved build-input manifest invalid.", {
      cause: error,
    });
  }
}
