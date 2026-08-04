const HEALTHY_PMSET_THERMAL_OUTPUT = [
  "Note: No thermal warning level has been recorded",
  "Note: No performance warning level has been recorded",
  "Note: No CPU power status has been recorded",
].join("\n");

export function parseDarwinThermalState(output) {
  if (typeof output !== "string") return "unrecognized";

  const normalized = output.replaceAll("\r\n", "\n").trim();
  if (normalized === HEALTHY_PMSET_THERMAL_OUTPUT) return "normal";

  if (
    /^(?:Note:\s*)?(?:thermal|performance) warning level (?:has been recorded|is active)$/im.test(
      normalized,
    ) ||
    /^(?:thermal|performance)[ _]warning(?:_level)?\s*(?:=|:)\s*(?:[1-9]\d*|active|yes)$/im.test(
      normalized,
    ) ||
    /^CPU_Speed_Limit\s*(?:=|:)\s*(?:[0-9]|[1-9][0-9])%?$/im.test(normalized)
  )
    return "warning";

  return "unrecognized";
}
