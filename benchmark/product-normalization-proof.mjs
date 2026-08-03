import path from "node:path";
import { readJson, ROOT } from "../build/lib/files.mjs";
import { normalizeTranscript } from "./scoring/normalization.mjs";

export async function proveProductNormalization() {
  const fixtures = await readJson(
    path.join(ROOT, "contracts/normalization/fixtures-v1.json"),
  );
  for (const fixture of fixtures.fixtures)
    if (
      normalizeTranscript(fixture.raw, fixture.profileId) !== fixture.normalized
    )
      throw new Error(`Normalization fixture failed: ${fixture.id}`);
  return true;
}
