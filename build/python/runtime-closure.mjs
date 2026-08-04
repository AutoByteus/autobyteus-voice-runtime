import fs from "node:fs/promises";
import path from "node:path";
import { regularFiles } from "../lib/files.mjs";

const BUILD_ONLY = new Set(["pip", "setuptools", "wheel"]);
// Public runtime modules such as numpy.testing remain; only test-suite payload is removed.
const TEST_SUITE_DIRECTORIES = new Set(["test", "tests"]);

export function isBuildOnlyPythonDistribution(value) {
  return BUILD_ONLY.has(canonical(value));
}

export function isRetainedPythonRuntimeFile(relative) {
  const normalized = relative.split(path.sep).join("/"),
    lower = normalized.toLowerCase(),
    segments = lower.split("/");
  if (
    /\.pyc$/i.test(normalized) ||
    segments.includes("__pycache__") ||
    (normalized.startsWith("bin/") && normalized !== "bin/python3") ||
    segments[0] === "scripts" ||
    lower.endsWith(".dist-info/record") ||
    /(^|\/)libpython[^/]*\.(?:a|lib)$/i.test(normalized)
  )
    return false;
  return !excludedDirectory(segments);
}

export async function prunePythonRuntime(root) {
  await regularFiles(root);
  for (const directory of await directories(root)) {
    const relative = path.relative(root, directory).split(path.sep).join("/");
    if (excludedDirectory(relative.toLowerCase().split("/")))
      await fs.rm(directory, { recursive: true, force: true });
  }
  for (const relative of await regularFiles(root))
    if (!isRetainedPythonRuntimeFile(relative))
      await fs.rm(path.join(root, relative), { force: true });
}

function excludedDirectory(segments) {
  const sitePackages = segments.indexOf("site-packages");
  if (
    segments[0] === "include" ||
    segments[0] === "libs" ||
    (segments[0] === "lib" && segments[1] === "pkgconfig") ||
    segments.includes("__pycache__") ||
    segments[0] === "scripts"
  )
    return true;
  if (
    segments.some(
      (segment) =>
        segment === "ensurepip" ||
        [...BUILD_ONLY].some(
          (item) =>
            segment === item ||
            (segment.startsWith(`${item}-`) && segment.endsWith(".dist-info")),
        ),
    )
  )
    return true;
  return (
    sitePackages >= 0 &&
    segments
      .slice(sitePackages + 1)
      .some(
        (segment) =>
          TEST_SUITE_DIRECTORIES.has(segment) || segment === "include",
      )
  );
}

async function directories(root) {
  const result = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const target = path.join(directory, entry.name);
      result.push(target);
      await walk(target);
    }
  }
  await walk(root);
  return result.sort((left, right) => right.length - left.length);
}

function canonical(value) {
  return value.toLowerCase().replace(/[-_.]+/g, "-");
}
