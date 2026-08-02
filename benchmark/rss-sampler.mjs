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
