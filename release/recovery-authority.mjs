export const QUALIFIED_SOURCE_COMMIT =
  "32829080938911f0f46390a3fd2af823e105bd32";
export const QUALIFIED_SOURCE_TREE = "e2f7632b2ebce97453a5b923ce212a1d4699d9b4";
export const PROFILE_QUALIFICATION_API_APPROVAL_COMMIT =
  "5333d1d00c31fc9fe6fe2dcfe86219e2b894bebe";
export const RECOVERY_WORKFLOW_PATH =
  ".github/workflows/recover-qualified-voice-archives.yml";
export const RECOVERY_OWNER_PATH =
  "release/recover-qualified-voice-archives.mjs";

export const ACCEPTED_AGGREGATE = Object.freeze({
  qualificationSet: {
    fileName: "qualification-set-v2.json",
    sizeBytes: 15025,
    sha256: "c5eaedef8b4790f0f267ac378eba033319091ebc3a4ef29ddd931c1f123b0003",
  },
  branchProjection: {
    fileName: "branch-catalog-projection-v2.json",
    sizeBytes: 5194,
    sha256: "bcc3b1c2f3afc42fa0861adcdd3558ad0779ecf7f3c77c370501679a50bbeddd",
  },
  branchProjectionVerification: {
    fileName: "branch-catalog-projection-verification-v2.json",
    sizeBytes: 441,
    sha256: "a78c59fa085a95a6af28cdd3adc6065f87c216caceb304f6edcf034cd5e96c27",
  },
});

export const ACCEPTED_API_EVIDENCE = Object.freeze([
  {
    apiRevision: "API-REV-016",
    fileName: "api-evidence/api-rev-016-SHA256SUMS.txt",
    sizeBytes: 13028,
    sha256: "26d68266b9ef5511a829e6a4e53ab9b152414f7ae0a3892c9fffd3d82f5c0fca",
  },
  {
    apiRevision: "API-REV-017",
    fileName: "api-evidence/api-rev-017-SHA256SUMS.txt",
    sizeBytes: 1800,
    sha256: "552f63a14a46a359bba9248843b43c8052b30ef8c6b4925c3e201f1c1c1851bd",
  },
  {
    apiRevision: "API-REV-018",
    fileName: "api-evidence/api-rev-018-SHA256SUMS.txt",
    sizeBytes: 1417,
    sha256: "60a53f40a55eed609f08c6048c31fb9341bdbf6154fe00bf2306e447d88965f3",
  },
]);

export const ACCEPTED_ARCHIVES = Object.freeze([
  {
    profileId: "english",
    recipeSha256:
      "1b23e408aa033bd57e4861f6b148d656375263672a24e6e6dfad7b06e22e647c",
    provenanceSha256:
      "23d549d761fa70c321874fcaef5d5df9107dfcc29db9d54f328ac6da122c3d46",
    repositoryBuildLockSha256:
      "ef02d71f9646719dded7b2d3df3629e75ba16a72d392450746121f6bd14bfbc9",
    nativeBuildEnvironmentSha256:
      "5c7c85440d2c40dd95271473b006d609f1bd83fb87f2b46c8a4bcef6a4e102e1",
    goToolchainRootTreeSha256:
      "27fd7f0918282550923f1820c890432b262feb7e574cb6bfd3c9f4962cdbb9ee",
    buildReportSha256:
      "b65d02080c1d9397eff6e64d07d40815f9175afef5774c1f32f8ce2d5b739ba9",
    fileName: "voice-english-darwin-arm64-1.0.0.zip",
    sizeBytes: 645513268,
    sha256: "9e4d1d5981ba9389f63bdf98094078a6152fbac05ff42d52c287138baafa46f8",
    descriptorSha256:
      "80e0ee85d6eefce7aba5be4e6781946744efd5daa2b176bd9e14d7a3d634a61c",
    fileManifestSha256:
      "d5cfa0613b3dae7b500b69e44e4fcbdea78b5827143ab385a5ac73834da872f2",
  },
  {
    profileId: "chinese",
    recipeSha256:
      "b7d122f3cba9f193ead206683fbf56d1f9987c981a3afa855fa4bae7bea2a77d",
    provenanceSha256:
      "64cf8fdc25e072516882a82091973d1aec2823a9fb163e39e8d3d5840e7aa93d",
    repositoryBuildLockSha256:
      "742618f8859bb5c7c4300f2e5fec54a80afa0fe31a1392230eb24480a078680f",
    nativeBuildEnvironmentSha256:
      "5c7c85440d2c40dd95271473b006d609f1bd83fb87f2b46c8a4bcef6a4e102e1",
    goToolchainRootTreeSha256:
      "27fd7f0918282550923f1820c890432b262feb7e574cb6bfd3c9f4962cdbb9ee",
    buildReportSha256:
      "1665d36d18503a027f9364b40b399c56e857187e658a61c3b34eb9b67a8684fb",
    fileName: "voice-chinese-darwin-arm64-1.0.0.zip",
    sizeBytes: 1068528640,
    sha256: "84783c61b8a08e0e0848a4906139210868cf552ee0104d5179be7144be432cc3",
    descriptorSha256:
      "9eade280fa0be8fe15dfd4876555daf890a359e690944bd2a5ccabf9b68905c3",
    fileManifestSha256:
      "30a584acf3be0bca3b4ff22136ed6e7e1f5dd394ebe29c38508e742cd689d5d4",
  },
]);

export const RELEASE_MATRIX = Object.freeze({
  matrixId: "voice-runtime-darwin-arm64-v1",
  sha256: "f3f57336d2598bc7c78ba0d8a10e6ad4da77c16b10274533986f29571d6de76d",
});
