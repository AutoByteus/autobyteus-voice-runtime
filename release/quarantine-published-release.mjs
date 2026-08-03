#!/usr/bin/env node
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../build/lib/files.mjs";

export async function quarantinePublishedRelease({
  verificationPath,
  releaseTag,
  repository,
  output,
  request = githubRequest,
}) {
  const result = {
    schemaVersion: 1,
    decision: "quarantine-failed",
    failureCategory: null,
    repository,
    releaseTag,
    attemptedAt: new Date().toISOString(),
    verificationResultSha256: null,
    release: {
      beforeId: null,
      beforeStatus: "unknown",
      afterStatus: "unknown",
    },
    tagRef: {
      beforeSha: null,
      beforeType: null,
      afterSha: null,
      afterType: null,
      preserved: false,
    },
  };
  try {
    const verification = await readJson(verificationPath);
    await validate(
      verification,
      "contracts/release/published-asset-verification-v1.schema.json",
    );
    result.verificationResultSha256 = await shaFile(verificationPath);
    if (
      verification.decision !== "fail" ||
      verification.releaseTag !== releaseTag ||
      verification.repository !== repository
    )
      throw categorized("verification-precondition");
    const release = await request(
      "GET",
      `/repos/${repository}/releases/tags/${encodeURIComponent(releaseTag)}`,
    );
    if (release.tag_name !== releaseTag || !Number.isInteger(release.id))
      throw categorized("release-identity");
    result.release = {
      beforeId: release.id,
      beforeStatus: "present",
      afterStatus: "unknown",
    };
    const before = await request(
      "GET",
      `/repos/${repository}/git/ref/tags/${encodeURIComponent(releaseTag)}`,
    );
    result.tagRef.beforeSha = before.object?.sha ?? null;
    result.tagRef.beforeType = before.object?.type ?? null;
    if (!result.tagRef.beforeSha || !result.tagRef.beforeType)
      throw categorized("tag-ref-identity");
    await request("DELETE", `/repos/${repository}/releases/${release.id}`);
    try {
      await request(
        "GET",
        `/repos/${repository}/releases/tags/${encodeURIComponent(releaseTag)}`,
      );
      result.release.afterStatus = "present";
      throw categorized("release-still-present");
    } catch (error) {
      if (error.status !== 404) throw error;
      result.release.afterStatus = "absent";
    }
    const after = await request(
      "GET",
      `/repos/${repository}/git/ref/tags/${encodeURIComponent(releaseTag)}`,
    );
    result.tagRef.afterSha = after.object?.sha ?? null;
    result.tagRef.afterType = after.object?.type ?? null;
    result.tagRef.preserved =
      result.tagRef.afterSha === result.tagRef.beforeSha &&
      result.tagRef.afterType === result.tagRef.beforeType;
    if (!result.tagRef.preserved) throw categorized("tag-ref-changed");
    result.decision = "release-deleted";
  } catch (error) {
    result.failureCategory = error.failureCategory ?? classify(error);
  }
  await validate(
    result,
    "contracts/release/publication-quarantine-result-v1.schema.json",
  );
  await writeJson(path.resolve(output), result);
  if (result.decision !== "release-deleted") {
    const error = new Error(
      `Publication quarantine failed: ${result.failureCategory}`,
    );
    error.code = "QUARANTINE_FAILED";
    throw error;
  }
  return result;
}

async function githubRequest(method, apiPath) {
  const token = process.env.GH_TOKEN;
  if (!token) throw categorized("github-token-missing");
  const response = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    const error = new Error(
      `GitHub API ${method} ${apiPath}: ${response.status}`,
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

function categorized(failureCategory) {
  const error = new Error(failureCategory);
  error.failureCategory = failureCategory;
  return error;
}

function classify(error) {
  if (error.status === 404) return "release-or-tag-not-found";
  if (error.status === 401 || error.status === 403)
    return "github-authorization";
  if (/schema|invalid/i.test(String(error.message)))
    return "verification-schema";
  return "github-api-or-postcondition";
}

async function validate(value, schemaPath) {
  const schema = await readJson(path.join(ROOT, schemaPath)),
    ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const check = ajv.compile(schema);
  if (!check(value))
    throw new Error(`Artifact invalid: ${JSON.stringify(check.errors)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "verification",
    "release-tag",
    "repository",
    "output",
  ]);
  await quarantinePublishedRelease({
    verificationPath: path.resolve(args.verification),
    releaseTag: args["release-tag"],
    repository: args.repository,
    output: path.resolve(args.output),
  });
}
