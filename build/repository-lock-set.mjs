import path from "node:path";
import { readJson, ROOT, sha256, shaFile } from "./lib/files.mjs";

export async function repositoryBuildLockDigest(profileId, target) {
  const provider =
    profileId === "chinese"
      ? "chinese-funasr"
      : target === "darwin-arm64"
        ? "english-mlx"
        : "english-faster-whisper";
  const files = [
    "build/locked-inputs.json",
    `providers/${provider}/provider-lock.json`,
  ];
  if (profileId === "english")
    files.push(`build/python-wheel-locks/${target}.json`);
  const records = [];
  for (const file of files)
    records.push([file, await shaFile(path.join(ROOT, file))]);
  const lock = await readJson(
    path.join(ROOT, `providers/${provider}/provider-lock.json`),
  );
  return sha256(
    Buffer.from(
      `${JSON.stringify({ records, engine: lock.engine, model: lock.model })}\n`,
    ),
  );
}
