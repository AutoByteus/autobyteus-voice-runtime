import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
export async function processTreeRssBytes(rootPid) {
  if (process.platform === "win32") {
    const script = `$p=Get-CimInstance Win32_Process|Select-Object ProcessId,ParentProcessId,WorkingSetSize;$ids=@(${rootPid});do{$n=@($p|Where-Object{$ids -contains $_.ParentProcessId}|% ProcessId|Where-Object{$ids -notcontains $_});$ids+=$n}while($n.Count);($p|Where-Object{$ids -contains $_.ProcessId}|Measure-Object WorkingSetSize -Sum).Sum`;
    const { stdout } = await run("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      script,
    ]);
    return Number(stdout.trim());
  }
  const { stdout } = await run("ps", ["-axo", "pid=,ppid=,rss="]);
  const rows = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s+/).map(Number));
  const ids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [pid, parent] of rows)
      if (ids.has(parent) && !ids.has(pid)) {
        ids.add(pid);
        changed = true;
      }
  }
  return rows
    .filter(([pid]) => ids.has(pid))
    .reduce((sum, row) => sum + row[2] * 1024, 0);
}

export class ProcessTreeRssTimeline {
  constructor({
    pid,
    nowUs,
    observe = processTreeRssBytes,
    onObservation = () => {},
  }) {
    if (typeof pid !== "function" || typeof nowUs !== "function")
      throw new TypeError(
        "RSS timeline requires PID and monotonic clock owners.",
      );
    this.pid = pid;
    this.nowUs = nowUs;
    this.observe = observe;
    this.onObservation = onObservation;
    this.observations = [];
    this.failures = [];
    this.active = null;
    this.pending = new Set();
    this.timer = null;
  }

  startPeriodic(intervalMs = 10) {
    if (this.timer) throw new Error("RSS_TIMELINE_ALREADY_STARTED");
    void this.startScan();
    this.timer = setInterval(() => void this.startScan(), intervalMs);
  }

  ensureObservationAtBoundary(receivedAtUs) {
    assertOffset(receivedAtUs, "RSS_BOUNDARY_INVALID");
    if (this.active) return this.active;
    return this.startScan(receivedAtUs);
  }

  startScan(startedAtUs = this.nowUs()) {
    if (this.active) return this.active;
    assertOffset(startedAtUs, "RSS_START_INVALID");
    const rootPid = this.pid();
    if (!Number.isSafeInteger(rootPid) || rootPid <= 0) {
      this.failures.push("rss-pid-unavailable");
      return null;
    }
    const operation = Promise.resolve()
      .then(() => this.observe(rootPid))
      .then((rssBytes) => {
        const completedAtUs = this.nowUs();
        assertOffset(completedAtUs, "RSS_COMPLETION_INVALID");
        if (
          completedAtUs < startedAtUs ||
          !Number.isSafeInteger(rssBytes) ||
          rssBytes <= 0
        )
          throw new Error("RSS_OBSERVATION_INVALID");
        const observation = {
          sequence: this.observations.length,
          startedAtUs,
          completedAtUs,
          rssBytes,
        };
        this.observations.push(observation);
        this.onObservation(rssBytes);
        return observation;
      })
      .catch((error) => {
        this.failures.push(
          /INVALID/.test(String(error?.message))
            ? "rss-observation-invalid"
            : "rss-observation-failed",
        );
        return null;
      })
      .finally(() => {
        if (this.active === operation) this.active = null;
        this.pending.delete(operation);
      });
    this.active = operation;
    this.pending.add(operation);
    return operation;
  }

  async finalize() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await Promise.all([...this.pending]);
    return {
      observations: structuredClone(this.observations),
      failures: [...new Set(this.failures)],
    };
  }
}

export async function measureWithRss(operation, pid, measurements) {
  let complete = false,
    result,
    failure;
  const observed = Promise.resolve(operation)
    .then(
      (value) => {
        result = value;
      },
      (error) => {
        failure = error;
      },
    )
    .finally(() => {
      complete = true;
    });
  while (!complete) {
    const current = pid();
    if (current) measurements.push(await processTreeRssBytes(current));
    if (!complete) await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await observed;
  const current = pid();
  if (current) measurements.push(await processTreeRssBytes(current));
  if (failure) throw failure;
  return result;
}

function assertOffset(value, code) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(code);
}
