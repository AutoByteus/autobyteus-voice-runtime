import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  readJson,
  removeWritableTree,
  ROOT,
  sha256,
  shaFile,
} from "../../build/lib/files.mjs";

const run = promisify(execFile);
const AUTHORITY_PATH =
  "evidence/selection-study/derived/english-preservation-unique-v2/authority.json";
const APPROVED_AUTHORITY_SHA256 =
  "f7de556e1b99266f08485b1c3e3990785d14f8c773438270ac2929e2ac389fc8";
const APPROVED_TRUSTED_RECORD_SHA256 =
  "f6702c7670578cce327b7a071c4bd1822d2a62792b90e4de5a9c70232118b057";

export async function verifyEnglishPreservationAuthority(
  record,
  { root = ROOT, reproduce = false, python = "python3" } = {},
) {
  assertTrustedRecord(record);
  const authorityFile = repositoryPath(root, AUTHORITY_PATH);
  if ((await shaFile(authorityFile)) !== APPROVED_AUTHORITY_SHA256)
    throw new Error("English preservation authority digest mismatch.");
  const authority = await readJson(authorityFile);
  assertAuthorityShape(authority);
  for (const source of authority.sourceAuthority)
    await verifyFile(root, source.runtimePath, source.sha256, "source");
  await verifyFile(
    root,
    authority.derivationScript.runtimePath,
    authority.derivationScript.sha256,
    "derivation script",
  );
  for (const output of Object.values(authority.outputs)) {
    if (output.runtimePath.includes("#")) continue;
    await verifyFile(root, output.runtimePath, output.sha256, "output");
  }
  bindRecordToAuthority(record, authority);
  if (reproduce) await reproduceAuthority(root, authority, record, python);
  return authority;
}

function assertTrustedRecord(record) {
  if (
    record?.profileId !== "english" ||
    sha256(Buffer.from(`${JSON.stringify(record, null, 2)}\n`)) !==
      APPROVED_TRUSTED_RECORD_SHA256
  )
    throw new Error("English trusted-baseline record is not approved v2.");
}

function assertAuthorityShape(authority) {
  if (
    authority.schemaVersion !== 1 ||
    authority.authorityId !== "english-preservation-unique-v2" ||
    authority.status !== "evidence-authorized-final-corpus-and-baseline" ||
    authority.profileId !== "english" ||
    authority.decision !== "preserve-whisper-small" ||
    authority.newInferencePerformed !== false ||
    authority.derivation?.derivationId !==
      "english-preservation-stable-identity-collapse-v2" ||
    authority.derivation?.selectionUsesRecognitionQuality !== false ||
    authority.derivation?.sourceSampleCount !== 50 ||
    authority.derivation?.finalUniqueSampleCount !== 49 ||
    authority.measurement?.sampleCount !== 49 ||
    authority.measurement?.totalErrors !== 70 ||
    authority.measurement?.totalUnits !== 969 ||
    authority.measurement?.value !== 70 / 969 ||
    !Array.isArray(authority.sourceAuthority) ||
    authority.sourceAuthority.length !== 4
  )
    throw new Error("English preservation authority is invalid.");
}

function bindRecordToAuthority(record, authority) {
  const expected = {
    baseline: ["evidencePath", "evidenceSha256"],
    promotedResult: ["promotedResultPath", "promotedResultSha256"],
    promotedQuality: ["promotedQualityPath", "promotedQualitySha256"],
    corpus: ["corpusManifestPath", "corpusManifestSha256"],
  };
  for (const [name, [pathField, digestField]] of Object.entries(expected)) {
    const output = authority.outputs[name];
    if (
      !output ||
      record[pathField] !== output.runtimePath ||
      record[digestField] !== output.sha256
    )
      throw new Error(`English trusted record does not bind ${name}.`);
  }
  if (
    authority.outputs.trustedBaselineRecord.sha256 !==
      APPROVED_TRUSTED_RECORD_SHA256 ||
    record.sampleCount !== authority.measurement.sampleCount ||
    record.value !== authority.measurement.value
  )
    throw new Error("English trusted record does not bind the authority.");
}

async function verifyFile(root, relative, expected, role) {
  if ((await shaFile(repositoryPath(root, relative))) !== expected)
    throw new Error(`English preservation ${role} mismatch: ${relative}`);
}

function repositoryPath(root, relative) {
  if (
    typeof relative !== "string" ||
    relative.startsWith("/") ||
    relative.split("/").includes("..") ||
    !/^[A-Za-z0-9._/-]+$/.test(relative)
  )
    throw new Error("English preservation path is not repository-contained.");
  return path.join(root, relative);
}

async function reproduceAuthority(root, authority, record, python) {
  const work = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-english-preservation-"),
  );
  try {
    for (const source of authority.sourceAuthority) {
      const destination = repositoryPath(work, source.solutionPath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(repositoryPath(root, source.runtimePath), destination);
    }
    const output = path.join(work, "output");
    await fs.mkdir(output, { recursive: true });
    const script = path.join(output, authority.derivationScript.solutionFile);
    await fs.copyFile(
      repositoryPath(root, authority.derivationScript.runtimePath),
      script,
    );
    await run(python, [script, "--ticket-root", work, "--output-dir", output], {
      cwd: root,
      maxBuffer: 1024 * 1024,
    });
    await assertReproducedEnglishOutputs({ root, output, authority, record });
  } finally {
    await removeWritableTree(work);
  }
}

export async function assertReproducedEnglishOutputs({
  root = ROOT,
  output,
  authority,
  record,
}) {
  const projections = [
    ...Object.entries(authority.outputs),
    [
      "authority",
      { solutionFile: "authority.json", runtimePath: AUTHORITY_PATH },
    ],
  ];
  for (const [name, projected] of projections) {
    const generated = path.join(output, projected.solutionFile);
    const expected =
      name === "trustedBaselineRecord"
        ? Buffer.from(`${JSON.stringify(record, null, 2)}\n`)
        : await fs.readFile(repositoryPath(root, projected.runtimePath));
    if (!Buffer.from(await fs.readFile(generated)).equals(expected))
      throw new Error(`English preservation derivation drift: ${name}`);
  }
}
