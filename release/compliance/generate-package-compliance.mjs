#!/usr/bin/env node
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  parsePairs,
  readJson,
  ROOT,
  shaFile,
  writeJson,
} from "../../build/lib/files.mjs";

export async function generatePackageCompliance({
  recipePath,
  provenancePath,
  noticesPath,
  buildReportPath,
  archivePath,
  outputPath,
}) {
  const recipe = await readJson(recipePath),
    provenance = await readJson(provenancePath),
    notices = await readJson(noticesPath),
    build = await readJson(buildReportPath),
    policyPath = path.join(import.meta.dirname, "license-policy-v1.json"),
    policy = await readJson(policyPath);
  await assertSchema(
    recipe,
    "contracts/build/build-input-recipe-v1.schema.json",
    "Build Input Recipe",
  );
  await assertSchema(
    provenance,
    "contracts/build/build-input-provenance-v1.schema.json",
    "Build Input Provenance",
  );
  if (
    provenance.recipe.sha256 !== (await shaFile(recipePath)) ||
    provenance.package.packageId !== recipe.package.packageId ||
    JSON.stringify(provenance.releaseMatrix) !==
      JSON.stringify(recipe.releaseMatrix) ||
    provenance.repository.lockSha256 !==
      recipe.toolchain.repositoryLockSha256 ||
    JSON.stringify(provenance.inputs) !==
      JSON.stringify(
        recipe.inputs.map((item) => ({
          kind: item.kind,
          role: item.role,
          destination: item.destination,
          identity: item.kind === "git-checkout" ? item.treeId : item.sha256,
          licenseComponentId: item.licenseComponentId,
        })),
      ) ||
    build.packageId !== recipe.package.packageId ||
    build.providerId !== recipe.package.providerId ||
    build.modelId !== recipe.package.modelId ||
    build.archive.sha256 !== (await shaFile(archivePath)) ||
    build.noticeInventorySha256 !== (await shaFile(noticesPath)) ||
    notices.schemaVersion !== 1 ||
    notices.profileId !== recipe.package.profileId
  )
    throw new Error("Compliance input identity mismatch.");
  const requiredIds = [
    ...new Set(recipe.inputs.map((item) => item.licenseComponentId)),
  ].sort();
  const noticeIds = notices.components.map((item) => item.componentId).sort();
  if (JSON.stringify(requiredIds) !== JSON.stringify(noticeIds))
    throw new Error(
      "Notice inventory has missing or extra bundled components.",
    );
  const components = [];
  for (const componentId of requiredIds) {
    const approved = policy.components.find(
        (item) => item.componentId === componentId,
      ),
      noticed = notices.components.find(
        (item) => item.componentId === componentId,
      );
    if (
      !approved ||
      approved.profiles?.includes(recipe.package.profileId) !== true ||
      approved.versionOrRevision !== noticed.versionOrRevision ||
      approved.licenseIdentity !== noticed.licenseIdentity ||
      approved.redistribution !== "approved" ||
      approved.source !== noticed.source ||
      approved.attributionRequired !== noticed.attributionRequired
    )
      throw new Error(`Component policy/notice mismatch: ${componentId}`);
    const licensePath = path.join(
      path.dirname(noticesPath),
      noticed.licensePath,
    );
    const licenseTextSha256 = await shaFile(licensePath);
    if (licenseTextSha256 !== approved.licenseTextSha256)
      throw new Error(`License text mismatch: ${componentId}`);
    components.push({
      componentId,
      versionOrRevision: approved.versionOrRevision,
      licenseIdentity: approved.licenseIdentity,
      licenseTextSha256,
      attributionRequired: approved.attributionRequired,
      redistribution: "approved",
      source: approved.source,
    });
  }
  const result = {
    schemaVersion: 1,
    profileId: recipe.package.profileId,
    packageId: recipe.package.packageId,
    providerId: recipe.package.providerId,
    modelId: recipe.package.modelId,
    recipeSha256: await shaFile(recipePath),
    provenanceSha256: await shaFile(provenancePath),
    descriptorSha256: build.descriptorSha256,
    archiveSha256: build.archive.sha256,
    noticeInventorySha256: await shaFile(noticesPath),
    policySha256: await shaFile(policyPath),
    components,
    decision: "pass",
  };
  await assertSchema(
    result,
    "contracts/compliance/package-compliance-v1.schema.json",
    "Package Compliance",
  );
  await writeJson(outputPath, result);
  return result;
}

async function assertSchema(value, schemaPath, label) {
  const schema = await readJson(path.join(ROOT, schemaPath));
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );
  if (!validate(value))
    throw new Error(`${label} invalid: ${JSON.stringify(validate.errors)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "recipe",
    "provenance",
    "notices",
    "build-report",
    "archive",
    "output",
  ]);
  await generatePackageCompliance({
    recipePath: path.resolve(args.recipe),
    provenancePath: path.resolve(args.provenance),
    noticesPath: path.resolve(args.notices),
    buildReportPath: path.resolve(args["build-report"]),
    archivePath: path.resolve(args.archive),
    outputPath: path.resolve(args.output),
  });
}
