#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parsePairs,
  readJson,
  removeWritableTree,
  shaFile,
} from "./lib/files.mjs";

const run = promisify(execFile);

export async function hydrateHostInputCache({ recipes, cache }) {
  const root = path.resolve(cache),
    objects = path.join(root, "objects"),
    checkouts = path.join(root, "checkouts");
  await fs.mkdir(objects, { recursive: true, mode: 0o700 });
  await fs.mkdir(checkouts, { recursive: true, mode: 0o700 });
  for (const recipePath of recipes) {
    const recipe = await readJson(recipePath);
    if (recipe.schemaVersion !== 2) throw new Error("Host recipe is not v2.");
    for (const input of recipe.inputs) {
      if (input.kind === "cache-object") await hydrateObject(objects, input);
      else if (input.kind === "git-checkout")
        await hydrateCheckout(checkouts, input);
    }
  }
}

async function hydrateObject(objects, input) {
  const destination = path.join(objects, input.sha256);
  if (await exactFile(destination, input)) return;
  await fs.rm(destination, { force: true });
  const partial = `${destination}.partial`;
  await fs.rm(partial, { force: true });
  const url = new URL(input.upstream);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Host input URL is not fixed public HTTPS.");
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body)
    throw new Error(`Host input download failed: ${response.status}`);
  const file = await fs.open(partial, "wx", 0o600);
  try {
    const reader = response.body.getReader();
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > input.sizeBytes) throw new Error("Host input exceeded size.");
      await file.write(value);
    }
    await file.sync();
  } finally {
    await file.close();
  }
  if (!(await exactFile(partial, input))) {
    await fs.rm(partial, { force: true });
    throw new Error("Host input identity mismatch.");
  }
  await fs.rename(partial, destination);
}

async function hydrateCheckout(checkouts, input) {
  const destination = path.join(checkouts, input.role);
  if (await exactCheckout(destination, input)) return;
  await removeWritableTree(destination).catch(() => {});
  const temporary = `${destination}.partial`;
  await removeWritableTree(temporary).catch(() => {});
  if (
    !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/.test(
      input.repository,
    )
  )
    throw new Error(
      "Host source repository is not an admitted GitHub HTTPS URL.",
    );
  await run(
    "git",
    [
      "clone",
      "--no-checkout",
      "--filter=blob:none",
      input.repository,
      temporary,
    ],
    {
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  await run("git", ["-C", temporary, "checkout", "--detach", input.revision]);
  if (!(await exactCheckout(temporary, input))) {
    await removeWritableTree(temporary);
    throw new Error("Host source checkout identity mismatch.");
  }
  await fs.rename(temporary, destination);
}

async function exactFile(file, expected) {
  try {
    const info = await fs.lstat(file);
    return (
      info.isFile() &&
      !info.isSymbolicLink() &&
      info.size === expected.sizeBytes &&
      (await shaFile(file)) === expected.sha256
    );
  } catch {
    return false;
  }
}

async function exactCheckout(directory, expected) {
  try {
    const head = (
        await run("git", ["-C", directory, "rev-parse", "HEAD"])
      ).stdout.trim(),
      tree = (
        await run("git", ["-C", directory, "rev-parse", "HEAD^{tree}"])
      ).stdout.trim(),
      status = (
        await run("git", [
          "-C",
          directory,
          "status",
          "--porcelain=v1",
          "--untracked-files=all",
        ])
      ).stdout;
    return (
      head === expected.revision && tree === expected.treeId && status === ""
    );
  } catch {
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parsePairs(process.argv.slice(2), [
    "english",
    "chinese",
    "cache",
  ]);
  await hydrateHostInputCache({
    recipes: [args.english, args.chinese],
    cache: args.cache,
  });
}
