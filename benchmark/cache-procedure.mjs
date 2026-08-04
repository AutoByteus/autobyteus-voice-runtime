import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ROOT, shaFile } from "../build/lib/files.mjs";

const run = promisify(execFile);
const PROCEDURES = {
  "darwin-arm64": {
    id: "darwin-arm64-filesystem-cold-v1",
    file: "benchmark/cache-procedures/darwin-arm64-filesystem-cold-v1.sh",
    required: true,
  },
};
const NOT_APPLICABLE = {
  id: "not-applicable-non-reference-target-v1",
  file: "benchmark/cache-procedures/not-applicable-v1.txt",
  required: false,
};

export async function cacheProcedureFor(target) {
  const procedure = PROCEDURES[target] ?? NOT_APPLICABLE;
  return {
    id: procedure.id,
    sha256: await shaFile(path.join(ROOT, procedure.file)),
    required: procedure.required,
  };
}

export async function executeCacheProcedure(procedure, target, execute = run) {
  const expected = await cacheProcedureFor(target);
  if (JSON.stringify(procedure) !== JSON.stringify(expected))
    throw new Error("Filesystem-cache procedure identity mismatch.");
  if (!expected.required) return null;
  const definition = PROCEDURES[target];
  const result = await execute(path.join(ROOT, definition.file), [], {
    timeout: 30000,
    maxBuffer: 1024,
  });
  if (
    result.stdout !== "autobyteus-filesystem-cold-v1\n" ||
    result.stderr !== ""
  )
    throw new Error("Filesystem-cache procedure did not complete exactly.");
  return {
    procedureId: expected.id,
    procedureSha256: expected.sha256,
    completed: true,
  };
}
