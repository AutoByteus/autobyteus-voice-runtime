const TASK_PROCESS_LIMIT = 16;
const TOP_CONSUMER_LIMIT = 10;

export function classifyPerformanceEnvironment({
  cpuIdleSamples,
  taskOwnedCompetingProcessNames,
  topConsumerProcessNames,
}) {
  if (
    !Array.isArray(cpuIdleSamples) ||
    cpuIdleSamples.length !== 6 ||
    cpuIdleSamples.some(
      (value) => !Number.isFinite(value) || value < 0 || value > 100,
    )
  )
    throw new Error("Exactly six valid CPU-idle samples are required.");
  const taskNames = boundedNames(
      taskOwnedCompetingProcessNames,
      TASK_PROCESS_LIMIT,
    ),
    topNames = boundedNames(topConsumerProcessNames, TOP_CONSUMER_LIMIT),
    averageIdlePercent =
      cpuIdleSamples.reduce((sum, value) => sum + value, 0) /
      cpuIdleSamples.length;
  return {
    classification:
      averageIdlePercent >= 80 && taskNames.length === 0
        ? "controlled"
        : "loaded-host",
    cpuIdleSamples,
    averageIdlePercent,
    taskOwnedCompetingProcesses: {
      detected: taskNames.length > 0,
      processNames: taskNames,
    },
    topConsumerProcessNames: topNames,
  };
}

export function parseCpuIdleSample(output) {
  const values = [
    ...String(output).matchAll(/CPU usage:.*?([0-9.]+)% idle/g),
  ].map((match) => Number(match[1]));
  const value = values.at(-1);
  if (!Number.isFinite(value) || value < 0 || value > 100)
    throw new Error("CPU-idle sample output is unrecognized.");
  return value;
}

export function parseTaskOwnedProcessNames(output) {
  return boundedNames(
    String(output)
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^\d+\s+/, ""))
      .map((value) => processName(value))
      .filter(Boolean),
    TASK_PROCESS_LIMIT,
  );
}

export function parseTopConsumerProcessNames(output) {
  const lines = String(output).split(/\r?\n/),
    header = lines.findIndex((line) => /^COMMAND\s*$/i.test(line.trim()));
  if (header < 0) return [];
  return boundedNames(
    lines
      .slice(header + 1)
      .map((line) => processName(line.trim()))
      .filter(Boolean),
    TOP_CONSUMER_LIMIT,
  );
}

function boundedNames(values, limit) {
  if (!Array.isArray(values))
    throw new Error("Process names must be an array.");
  return [...new Set(values.map((value) => processName(value)).filter(Boolean))]
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    )
    .slice(0, limit);
}

function processName(value) {
  if (typeof value !== "string") return null;
  const first = value.trim().split(/\s+/)[0];
  if (!first) return null;
  const name = first.split("/").at(-1);
  return /^[A-Za-z0-9._+-]{1,128}$/.test(name) ? name : null;
}
