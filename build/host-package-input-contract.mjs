import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { readJson, ROOT, shaFile } from "./lib/files.mjs";

const DEPENDENCY_FIELDS = Object.freeze([
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]),
  PACKAGE_FIELDS = new Set([
    "name",
    "version",
    "private",
    "description",
    "license",
    "engines",
    "scripts",
    ...DEPENDENCY_FIELDS,
  ]),
  LOCK_FIELDS = new Set([
    "name",
    "version",
    "lockfileVersion",
    "requires",
    "packages",
  ]),
  LOCK_ROOT_FIELDS = new Set([
    "name",
    "version",
    "license",
    "engines",
    ...DEPENDENCY_FIELDS,
  ]),
  REQUIRED_PACKAGE_FIELDS = Object.freeze([
    "name",
    "version",
    "private",
    "description",
    "license",
    "engines",
    "scripts",
  ]),
  REQUIRED_LOCK_FIELDS = Object.freeze([
    "name",
    "version",
    "lockfileVersion",
    "requires",
    "packages",
  ]),
  REQUIRED_LOCK_ROOT_FIELDS = Object.freeze([
    "name",
    "version",
    "license",
    "engines",
  ]),
  LIFECYCLE_SCRIPTS = Object.freeze([
    "preinstall",
    "install",
    "postinstall",
    "prepare",
  ]),
  FIXED_CHILD_ENVIRONMENT = Object.freeze({
    LANG: "C",
    LC_ALL: "C",
    PATH: "",
    TZ: "UTC",
  });

export const HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS = Object.freeze([
  "source-admission",
  "release-admission-verification",
  "qualification-set",
  "workflow-checkout-commit",
  "inputs-root",
  "assets",
  "audit",
  "go",
  "build-environment",
  "version",
  "output",
]);
export const HOST_PACKAGE_ASSEMBLER_ARGUMENTS = Object.freeze([
  "profile",
  "target",
  "inputs",
  "output",
  "go",
  "build-environment",
  "expected-host-source-closure",
  "source-commit",
  "version",
]);
export const HOST_PACKAGE_VERIFIER_ARGUMENTS = Object.freeze([
  "archive",
  "build-report",
  "go",
  "output",
]);
export const HOST_CONSTRUCTION_CHILD_ENVIRONMENT_KEYS = Object.freeze([
  "HOME",
  "LANG",
  "LC_ALL",
  "PATH",
  "TEMP",
  "TMP",
  "TMPDIR",
  "TZ",
]);

const schemaValidators = await compileValidators(),
  CONTROLLER_PATH = "release/run-host-construction.mjs",
  ASSEMBLER_PATH = "build/host-package-assembler.mjs",
  VERIFIER_PATH = "build/host-package-verifier.mjs";

export const HostPackageInputContract = Object.freeze({
  async assertCurrent({ repository = ROOT, recipePath, buildEnvironment }) {
    const packageManifest = await readJson(
        path.join(repository, "package.json"),
      ),
      packageLock = await readJson(path.join(repository, "package-lock.json")),
      recipe = await readJson(recipePath),
      workflow = await fs.readFile(
        path.join(repository, ".github/workflows/release-voice-runtime.yml"),
        "utf8",
      );
    assertSchema(schemaValidators.recipe, recipe, "Host Build Recipe 2");
    assertSchema(
      schemaValidators.environment,
      buildEnvironment,
      "Host Build Environment 2",
    );
    assertPackageShape(packageManifest, packageLock);
    assertWorkflowInvocation(workflow);
    const nodeVersion = packageManifest.engines.node;
    const executingNode = await fs.realpath(process.execPath);
    if (
      recipe.toolchain.nodeVersion !== nodeVersion ||
      process.version !== `v${nodeVersion}` ||
      buildEnvironment.tools.node.path !== executingNode ||
      buildEnvironment.tools.node.sha256 !== (await shaFile(executingNode)) ||
      buildEnvironment.target !== "darwin-arm64"
    )
      throw new Error("Host package Node authority mismatch.");
    return canonicalProjection({
      packageManifest,
      buildEnvironment,
      nodeVersion,
    });
  },
});

export function parseHostConstructionArguments(values) {
  return parseExactPairs(
    values,
    HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS,
    "host construction controller",
  );
}

export function parseHostPackageAssemblerArguments(values) {
  const result = parseExactPairs(
    values,
    HOST_PACKAGE_ASSEMBLER_ARGUMENTS,
    "host package assembler",
  );
  assertAssemblerValues(result);
  return result;
}

export function parseHostPackageVerifierArguments(values) {
  return parseExactPairs(
    values,
    HOST_PACKAGE_VERIFIER_ARGUMENTS,
    "host package verifier",
  );
}

export function hostPackageAssemblerInvocation(options) {
  assertExactObject(options, HOST_PACKAGE_ASSEMBLER_ARGUMENTS, "assembler");
  assertAssemblerValues(options);
  return [
    ASSEMBLER_PATH,
    ...pairsFrom(options, HOST_PACKAGE_ASSEMBLER_ARGUMENTS),
  ];
}

export function hostPackageVerifierInvocation(options) {
  assertExactObject(options, HOST_PACKAGE_VERIFIER_ARGUMENTS, "verifier");
  return [
    VERIFIER_PATH,
    ...pairsFrom(options, HOST_PACKAGE_VERIFIER_ARGUMENTS),
  ];
}

export function hostConstructionChildEnvironment(temporaryRoot) {
  if (!path.isAbsolute(temporaryRoot))
    throw new Error("Host construction temporary root must be absolute.");
  const values = {
    HOME: temporaryRoot,
    ...FIXED_CHILD_ENVIRONMENT,
    TEMP: temporaryRoot,
    TMP: temporaryRoot,
    TMPDIR: temporaryRoot,
  };
  return Object.fromEntries(
    HOST_CONSTRUCTION_CHILD_ENVIRONMENT_KEYS.map((key) => [key, values[key]]),
  );
}

function assertPackageShape(packageManifest, packageLock) {
  assertExactKeys(packageManifest, PACKAGE_FIELDS, "package manifest");
  assertExactKeys(packageLock, LOCK_FIELDS, "package lock");
  assertRequiredKeys(
    packageManifest,
    REQUIRED_PACKAGE_FIELDS,
    "package manifest",
  );
  assertRequiredKeys(packageLock, REQUIRED_LOCK_FIELDS, "package lock");
  if (
    packageLock.lockfileVersion !== 3 ||
    packageLock.requires !== true ||
    !isRecord(packageLock.packages) ||
    !isRecord(packageLock.packages[""])
  )
    throw new Error("Host package lock must be exact lockfile v3.");
  const root = packageLock.packages[""];
  assertExactKeys(root, LOCK_ROOT_FIELDS, "package lock root");
  assertRequiredKeys(root, REQUIRED_LOCK_ROOT_FIELDS, "package lock root");
  if (
    packageManifest.name !== root.name ||
    packageManifest.version !== root.version ||
    packageManifest.license !== root.license ||
    packageManifest.private !== true
  )
    throw new Error("Host package root identity mismatch.");
  const manifestEngine = exactNodeEngine(packageManifest.engines),
    lockEngine = exactNodeEngine(root.engines);
  if (manifestEngine !== lockEngine)
    throw new Error("Host package Node engine mismatch.");
  for (const field of DEPENDENCY_FIELDS)
    if (
      JSON.stringify(sortedStringMap(packageManifest[field], field)) !==
      JSON.stringify(sortedStringMap(root[field], field))
    )
      throw new Error(`Host package ${field} differs from lock root.`);
  const scripts = packageManifest.scripts ?? {};
  if (!isRecord(scripts))
    throw new Error("Host package scripts must be an object.");
  const lifecycle = LIFECYCLE_SCRIPTS.filter((name) => name in scripts);
  if (lifecycle.length)
    throw new Error(
      `Host package lifecycle scripts forbidden: ${lifecycle.join(",")}`,
    );
}

function canonicalProjection({
  packageManifest,
  buildEnvironment,
  nodeVersion,
}) {
  return {
    schemaVersion: 1,
    packageManager: "npm",
    installArguments: ["ci", "--ignore-scripts"],
    lockfileVersion: 3,
    nodeVersion,
    dependencyMaps: Object.fromEntries(
      DEPENDENCY_FIELDS.map((field) => [
        field,
        sortedStringMap(packageManifest[field], field),
      ]),
    ),
    selectedEnvironment: {
      target: buildEnvironment.target,
      nodeExecutableSha256: buildEnvironment.tools.node.sha256,
      pathPolicy: buildEnvironment.environment.pathPolicy,
      locale: buildEnvironment.environment.locale,
      clearedOverrides: [...buildEnvironment.environment.clearedOverrides],
    },
    directInvocation: {
      controller: CONTROLLER_PATH,
      controllerArguments: [...HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS],
      assembler: ASSEMBLER_PATH,
      assemblerArguments: [...HOST_PACKAGE_ASSEMBLER_ARGUMENTS],
      verifier: VERIFIER_PATH,
      verifierArguments: [...HOST_PACKAGE_VERIFIER_ARGUMENTS],
      childEnvironmentKeys: [...HOST_CONSTRUCTION_CHILD_ENVIRONMENT_KEYS],
      fixedChildEnvironment: { ...FIXED_CHILD_ENVIRONMENT },
    },
  };
}

function assertWorkflowInvocation(workflow) {
  if ((workflow.match(/\bnpm ci --ignore-scripts\b/g) ?? []).length !== 1)
    throw new Error(
      "Hosted workflow must hydrate with exact npm ci --ignore-scripts.",
    );
  if (/npm (?:run build:host|exec\b)|\bnpx\b/.test(workflow))
    throw new Error(
      "Hosted host construction must not use npm script indirection.",
    );
  if (workflow.includes(ASSEMBLER_PATH) || workflow.includes(VERIFIER_PATH))
    throw new Error(
      "Hosted workflow must enter the direct construction controller only.",
    );
  const start = workflow.indexOf(CONTROLLER_PATH);
  if (start < 0 || workflow.indexOf(CONTROLLER_PATH, start + 1) >= 0)
    throw new Error(
      "Hosted workflow must have one direct construction controller.",
    );
  const block = workflow.slice(
    start,
    workflow.indexOf("\n      - name:", start),
  );
  const names = [...block.matchAll(/--([a-z0-9-]+)(?:\s|$)/g)].map(
    (match) => match[1],
  );
  if (
    JSON.stringify(names) !==
    JSON.stringify(HOST_CONSTRUCTION_CONTROLLER_ARGUMENTS)
  )
    throw new Error("Hosted construction controller arguments changed.");
}

function parseExactPairs(values, expected, label) {
  if (values.length !== expected.length * 2)
    throw new Error(`Unexpected ${label} argument count.`);
  const result = {},
    names = [];
  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index],
      value = values[index + 1];
    if (!flag?.startsWith("--") || !value)
      throw new Error(`${label} arguments must be --name value pairs.`);
    const name = flag.slice(2);
    if (name in result) throw new Error(`Duplicate --${name}.`);
    names.push(name);
    result[name] = value;
  }
  if (JSON.stringify(names) !== JSON.stringify(expected))
    throw new Error(`Unexpected ${label} argument order or name.`);
  return result;
}

function assertAssemblerValues(values) {
  if (
    !["english", "chinese"].includes(values.profile) ||
    values.target !== "darwin-arm64" ||
    !/^[a-f0-9]{64}$/.test(values["expected-host-source-closure"]) ||
    !/^[a-f0-9]{40}$/.test(values["source-commit"]) ||
    !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(values.version)
  )
    throw new Error("Invalid host package assembler invocation identity.");
}

function assertExactObject(value, expected, label) {
  if (
    !isRecord(value) ||
    JSON.stringify(Object.keys(value).sort()) !==
      JSON.stringify([...expected].sort())
  )
    throw new Error(`Unexpected ${label} invocation fields.`);
  for (const name of expected)
    if (typeof value[name] !== "string" || !value[name])
      throw new Error(`Missing ${label} invocation field: ${name}`);
}

function pairsFrom(value, names) {
  return names.flatMap((name) => [`--${name}`, value[name]]);
}

function assertExactKeys(value, allowed, label) {
  if (!isRecord(value)) throw new Error(`Host ${label} must be an object.`);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length)
    throw new Error(
      `Unsupported Host ${label} fields: ${unexpected.sort().join(",")}`,
    );
}

function assertRequiredKeys(value, required, label) {
  const missing = required.filter((key) => !(key in value));
  if (missing.length)
    throw new Error(`Missing Host ${label} fields: ${missing.join(",")}`);
}

function exactNodeEngine(value) {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 1 ||
    typeof value.node !== "string"
  )
    throw new Error("Host package engines must contain exact node authority.");
  return value.node;
}

function sortedStringMap(value, label) {
  const source = value ?? {};
  if (
    !isRecord(source) ||
    Object.values(source).some((item) => typeof item !== "string")
  )
    throw new Error(`Host package ${label} must be a string map.`);
  return Object.fromEntries(
    Object.entries(source).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertSchema(validate, value, label) {
  if (!validate(value))
    throw new Error(`${label} invalid: ${JSON.stringify(validate.errors)}`);
}

async function compileValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return {
    recipe: ajv.compile(
      await readJson(
        path.join(
          ROOT,
          "contracts/build/host-build-input-recipe-v2.schema.json",
        ),
      ),
    ),
    environment: ajv.compile(
      await readJson(
        path.join(
          ROOT,
          "contracts/build/host-build-environment-v2.schema.json",
        ),
      ),
    ),
  };
}
