import fs from "node:fs/promises";
import path from "node:path";
const roots = [
  "launcher",
  "packaging",
  "providers",
  "build",
  "benchmark",
  "release",
  "tooling",
];
const source = /\.(?:mjs|js|go|py|cpp|h)$/;
let failed = false;
for (const root of roots)
  for (const file of await walk(root)) {
    if (!source.test(file)) continue;
    const data = await fs.readFile(file, "utf8");
    const effective = data.split(/\r?\n/).filter((line) => line.trim()).length;
    if (effective > 500) {
      console.error(`${file}: ${effective} effective lines exceeds 500`);
      failed = true;
    }
  }
const product = await Promise.all(
  (await walk("."))
    .filter(
      (file) =>
        source.test(file) &&
        file !== "tooling/check-source.mjs" &&
        !file.startsWith("evidence/") &&
        !file.startsWith("tickets/"),
    )
    .map((file) => fs.readFile(file, "utf8").then((data) => [file, data])),
);
for (const [file, data] of product)
  for (const [name, pattern] of [
    ["sherpa runtime", /sherpa[-_ ]onnx/i],
    ["legacy protocol", /protocolVersion\s*[:=]\s*0/],
    ["node worker", /voice-input-worker\.cjs|universal-provider/i],
    ["live install", /\bpip install\b|huggingface-cli download/i],
  ])
    if (pattern.test(data)) {
      console.error(`${file}: forbidden ${name} production residue`);
      failed = true;
    }
if (failed) process.exit(1);
async function walk(root) {
  let result = [];
  for (const item of await fs.readdir(root, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".work"].includes(item.name)) continue;
    const target = path.join(root, item.name);
    if (item.isDirectory()) result = result.concat(await walk(target));
    else result.push(target.replace(/^\.\//, ""));
  }
  return result;
}
