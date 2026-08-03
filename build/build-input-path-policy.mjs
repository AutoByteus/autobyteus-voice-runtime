import path from "node:path";

const segmentPattern = /^[A-Za-z0-9._+()\[\]-]+$/;
const windowsReserved = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;

export function assertBuildInputPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 240 ||
    path.posix.isAbsolute(value) ||
    path.posix.normalize(value) !== value ||
    value.includes("\\")
  )
    throw new Error("Invalid Build Input path.");
  const segments = value.split("/");
  for (const segment of segments)
    if (
      !segmentPattern.test(segment) ||
      segment === "." ||
      segment === ".." ||
      segment === ".git" ||
      segment.endsWith(".") ||
      windowsReserved.test(segment)
    )
      throw new Error("Invalid Build Input path segment.");
  return value;
}

export function assertBuildInputPathSet(values) {
  const exact = new Set(),
    folded = new Set();
  for (const value of values) {
    assertBuildInputPath(value);
    const lower = value.toLowerCase();
    if (exact.has(value) || folded.has(lower))
      throw new Error("Duplicate or case-colliding Build Input path.");
    exact.add(value);
    folded.add(lower);
  }
}
