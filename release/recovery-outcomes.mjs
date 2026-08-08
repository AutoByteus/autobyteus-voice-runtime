import { QUALIFIED_SOURCE_COMMIT } from "./recovery-authority.mjs";

export const PROFILE_SEQUENCE = Object.freeze([
  { profileId: "english", sequence: 1 },
  { profileId: "chinese", sequence: 2 },
]);

export function succeededRecovery(expected, observed) {
  return {
    profileId: expected.profileId,
    sequence: sequenceFor(expected.profileId),
    outcome: "succeeded",
    build: { planned: 1, attempted: 1, completed: 1 },
    archive: {
      status: "accepted",
      fileName: expected.fileName,
      expectedSizeBytes: expected.sizeBytes,
      observedSizeBytes: observed.observedSizeBytes,
      expectedSha256: expected.sha256,
      observedSha256: observed.observedSha256,
      descriptorSha256: observed.descriptorSha256,
      fileManifestSha256: observed.fileManifestSha256,
      descriptorSourceCommit: observed.descriptorSourceCommit,
      buildReportSha256: observed.buildReportSha256,
      provenanceSha256: observed.provenanceSha256,
      exactMatch: true,
    },
  };
}

export function failedRecovery(
  expected,
  { category, stage, completed = 0, observed },
) {
  return {
    profileId: expected.profileId,
    sequence: sequenceFor(expected.profileId),
    outcome: "failed",
    build: { planned: 1, attempted: 1, completed },
    archive: observed
      ? {
          status: "rejected",
          fileName: expected.fileName,
          expectedSizeBytes: expected.sizeBytes,
          observedSizeBytes: observed.observedSizeBytes,
          expectedSha256: expected.sha256,
          observedSha256: observed.observedSha256,
          descriptorSha256: observed.descriptorSha256,
          fileManifestSha256: observed.fileManifestSha256,
          descriptorSourceCommit: observed.descriptorSourceCommit,
          buildReportSha256: observed.buildReportSha256,
          provenanceSha256: observed.provenanceSha256,
          exactMatch: false,
        }
      : { status: "unavailable" },
    failure: { category, stage },
  };
}

export function unattemptedRecovery(expected, category, blockedByProfileId) {
  const unavailability = { category };
  if (category === "prior-profile-failed")
    unavailability.blockedByProfileId = blockedByProfileId;
  return {
    profileId: expected.profileId,
    sequence: sequenceFor(expected.profileId),
    outcome: "unattempted",
    build: { planned: 1, attempted: 0, completed: 0 },
    archive: { status: "unavailable" },
    unavailability,
  };
}

export function blockedRecoveries(expectedArchives) {
  return expectedArchives.map((expected) =>
    unattemptedRecovery(expected, "pre-build-blocked"),
  );
}

export function summarizeProfileRecoveries(rows) {
  assertProfileRecoveryRows(rows);
  const profileBuilds = {
    planned: rows.reduce((sum, row) => sum + row.build.planned, 0),
    attempted: rows.reduce((sum, row) => sum + row.build.attempted, 0),
    completed: rows.reduce((sum, row) => sum + row.build.completed, 0),
    succeeded: rows.filter((row) => row.outcome === "succeeded").length,
    failed: rows.filter((row) => row.outcome === "failed").length,
    unattempted: rows.filter((row) => row.outcome === "unattempted").length,
  };
  if (
    profileBuilds.planned !== 2 ||
    profileBuilds.attempted + profileBuilds.unattempted !== 2 ||
    profileBuilds.succeeded + profileBuilds.failed !==
      profileBuilds.attempted ||
    profileBuilds.completed > profileBuilds.attempted
  )
    throw new Error("Recovery profile counts are inconsistent.");
  return {
    profileBuilds,
    providerStarts: 0,
    inferenceRequests: 0,
    corpusRuns: 0,
    coldTrials: 0,
    warmPreparationTrials: 0,
    warmRequestTrials: 0,
  };
}

export function recoveryDecision(rows) {
  const { profileBuilds } = summarizeProfileRecoveries(rows);
  if (
    profileBuilds.succeeded === 2 &&
    rows.every(
      (row) =>
        row.outcome === "succeeded" &&
        row.archive.status === "accepted" &&
        row.archive.exactMatch === true,
    )
  )
    return "pass";
  return profileBuilds.attempted === 0 ? "blocked" : "fail";
}

export function assertProfileRecoveryRows(rows) {
  if (!Array.isArray(rows) || rows.length !== PROFILE_SEQUENCE.length)
    throw new Error("Recovery requires exactly two profile rows.");
  for (let index = 0; index < PROFILE_SEQUENCE.length; index++) {
    const row = rows[index],
      expected = PROFILE_SEQUENCE[index];
    if (
      row?.profileId !== expected.profileId ||
      row.sequence !== expected.sequence ||
      row.build?.planned !== 1
    )
      throw new Error("Recovery profile order is invalid.");
    if (row.outcome === "succeeded") {
      if (
        row.build.attempted !== 1 ||
        row.build.completed !== 1 ||
        row.archive?.status !== "accepted" ||
        row.archive.exactMatch !== true ||
        row.archive.descriptorSourceCommit !== QUALIFIED_SOURCE_COMMIT ||
        row.failure !== undefined ||
        row.unavailability !== undefined
      )
        throw new Error("Succeeded recovery row is inconsistent.");
    } else if (row.outcome === "failed") {
      if (
        row.build.attempted !== 1 ||
        ![0, 1].includes(row.build.completed) ||
        !["unavailable", "rejected"].includes(row.archive?.status) ||
        (row.archive.status === "rejected" &&
          (row.build.completed !== 1 || row.archive.exactMatch !== false)) ||
        !row.failure ||
        row.unavailability !== undefined
      )
        throw new Error("Failed recovery row is inconsistent.");
    } else if (row.outcome === "unattempted") {
      if (
        row.build.attempted !== 0 ||
        row.build.completed !== 0 ||
        row.archive?.status !== "unavailable" ||
        !row.unavailability ||
        row.failure !== undefined
      )
        throw new Error("Unattempted recovery row is inconsistent.");
      if (
        row.unavailability.category === "prior-profile-failed" &&
        (index === 0 ||
          row.unavailability.blockedByProfileId !== rows[index - 1].profileId ||
          rows[index - 1].outcome !== "failed")
      )
        throw new Error("Sequential recovery blocker is inconsistent.");
    } else throw new Error("Recovery profile outcome is invalid.");
  }
}

function sequenceFor(profileId) {
  const subject = PROFILE_SEQUENCE.find((item) => item.profileId === profileId);
  if (!subject) throw new Error("Recovery profile is outside the matrix.");
  return subject.sequence;
}
