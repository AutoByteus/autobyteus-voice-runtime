import fs from "node:fs/promises";
import path from "node:path";

export const DARWIN_ARM64_PYTHON_ARCHIVE_SHA256 =
  "62aeee6161d57303a71a138b75fd5cc6fb8c89c4b1d9c7f0a052d89fa0b6652b";

const APPROVED_LAYOUTS = new Map([
  [
    DARWIN_ARM64_PYTHON_ARCHIVE_SHA256,
    Object.freeze({
      target: "darwin-arm64",
      links: Object.freeze([
        Object.freeze({ path: "bin/2to3", target: "2to3-3.12" }),
        Object.freeze({ path: "bin/idle3", target: "idle3.12" }),
        Object.freeze({ path: "bin/pydoc3", target: "pydoc3.12" }),
        Object.freeze({ path: "bin/python", target: "python3.12" }),
        Object.freeze({ path: "bin/python3", target: "python3.12" }),
        Object.freeze({
          path: "bin/python3-config",
          target: "python3.12-config",
        }),
        Object.freeze({
          path: "lib/pkgconfig/python3-embed.pc",
          target: "python-3.12-embed.pc",
        }),
        Object.freeze({
          path: "lib/pkgconfig/python3.pc",
          target: "python-3.12.pc",
        }),
        Object.freeze({
          path: "share/man/man1/python3.1",
          target: "python3.12.1",
        }),
      ]),
      runtimeExecutable: Object.freeze({
        path: "bin/python3",
        targetPath: "bin/python3.12",
      }),
      discardTargets: Object.freeze([
        "bin/2to3-3.12",
        "bin/idle3.12",
        "bin/pydoc3.12",
        "bin/python3.12-config",
        "lib/pkgconfig/python-3.12-embed.pc",
        "lib/pkgconfig/python-3.12.pc",
        "share/man/man1/python3.12.1",
      ]),
    }),
  ],
]);

export async function normalizeLockedPythonArchiveLinks(
  root,
  { target, archiveSha256 },
) {
  const resolvedRoot = path.resolve(root),
    layout = APPROVED_LAYOUTS.get(archiveSha256),
    observed = await inspectExtractedTree(resolvedRoot);
  if (!layout) {
    if (observed.links.length)
      throw new Error(
        "Locked Python archive has no approved symbolic-link topology.",
      );
    return observed.files;
  }
  if (layout.target !== target)
    throw new Error("Python archive link topology target mismatch.");

  const resolvedLinks = new Map();
  for (const link of observed.links)
    resolvedLinks.set(
      link.path,
      await resolveContainedLink(resolvedRoot, link.absolutePath, new Set()),
    );
  const topology = observed.links.map(
    ({ path: linkPath, target: linkTarget }) =>
      Object.freeze({ path: linkPath, target: linkTarget }),
  );
  if (JSON.stringify(topology) !== JSON.stringify(layout.links))
    throw new Error("Locked Python archive link topology changed.");

  const executable = layout.runtimeExecutable,
    executableLink = resolvedLinks.get(executable.path);
  if (
    !executableLink ||
    relativePath(resolvedRoot, executableLink.path) !== executable.targetPath
  )
    throw new Error("Locked Python runtime executable link changed.");

  for (const link of observed.links) await fs.unlink(link.absolutePath);
  const executablePath = path.join(resolvedRoot, executable.path);
  await fs.rename(executableLink.path, executablePath);
  for (const relative of layout.discardTargets)
    await fs.rm(path.join(resolvedRoot, relative), { force: true });

  const normalized = await inspectExtractedTree(resolvedRoot),
    executableInfo = await fs.lstat(executablePath);
  if (
    normalized.links.length ||
    !executableInfo.isFile() ||
    (executableInfo.mode & 0o111) === 0
  )
    throw new Error("Normalized Python runtime executable is invalid.");
  return normalized.files;
}

async function inspectExtractedTree(root) {
  const rootInfo = await fs.lstat(root);
  if (!rootInfo.isDirectory())
    throw new Error("Extracted Python root is not a directory.");
  const files = [],
    links = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name),
        relative = relativePath(root, absolutePath);
      if (entry.isDirectory()) await walk(absolutePath);
      else if (entry.isFile()) files.push(relative);
      else if (entry.isSymbolicLink())
        links.push({
          path: relative,
          target: await fs.readlink(absolutePath),
          absolutePath,
        });
      else
        throw new Error(
          `Locked Python archive contains a special entry: ${relative}`,
        );
    }
  }
  await walk(root);
  files.sort();
  links.sort((left, right) => left.path.localeCompare(right.path));
  return { files, links };
}

async function resolveContainedLink(root, linkPath, seen) {
  const canonicalLink = path.resolve(linkPath);
  if (seen.has(canonicalLink))
    throw new Error("Locked Python archive contains a cyclic symbolic link.");
  seen.add(canonicalLink);
  const target = await fs.readlink(canonicalLink);
  if (
    !target ||
    target.includes("\\") ||
    path.posix.isAbsolute(target) ||
    path.win32.isAbsolute(target)
  )
    throw new Error("Locked Python archive contains an absolute link.");
  const resolved = path.resolve(path.dirname(canonicalLink), target);
  assertContained(root, resolved);
  let info;
  try {
    info = await fs.lstat(resolved);
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error("Locked Python archive contains a dangling link.");
    throw error;
  }
  if (info.isSymbolicLink()) return resolveContainedLink(root, resolved, seen);
  if (!info.isFile())
    throw new Error("Locked Python archive link target is not a regular file.");
  return { path: resolved, info };
}

function assertContained(root, target) {
  const relative = path.relative(root, target);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error("Locked Python archive contains an escaping link.");
}

function relativePath(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}
