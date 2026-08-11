const EXPECTED_PACKAGE_MANAGER_COMMAND = Object.freeze([
    "npm",
    "ci",
    "--ignore-scripts",
  ]),
  PACKAGE_MANAGER_EXECUTABLE =
    /(^|[^A-Za-z0-9_.-])(npm|npx|pnpm|yarn|bun|corepack)(?=$|[^A-Za-z0-9_.-])/g,
  EXPECTED_ACTION_STEPS = Object.freeze([
    action("checkout", "actions/checkout@v4", null, {
      "fetch-depth": "0",
    }),
    action("setup_node", "actions/setup-node@v4", null, {
      cache: "npm",
      "node-version": "22.23.1",
    }),
    action("setup_go", "actions/setup-go@v5", null, {
      cache: "false",
      "go-version": "1.26.5",
    }),
    action(null, "actions/upload-artifact@v4", "always()", {
      "if-no-files-found": "error",
      name: "voice-runtime-host-release-audit-${{ github.run_id }}",
      path: "${{ runner.temp }}/voice-release/audit/",
      "retention-days": "90",
    }),
  ]);

export function assertHostWorkflowExecutableSurface(workflow) {
  if (typeof workflow !== "string" || workflow.includes("\t"))
    throw new Error("Hosted workflow YAML must be text without tabs.");
  const lines = workflow.split(/\r?\n/),
    packageManagerCommands = [];
  if (
    lines.some((line) =>
      /^ {6}- ["'](?:run|uses)["']\s*:|^ {8}["'](?:run|uses)["']\s*:/.test(
        line,
      ),
    )
  )
    throw new Error("Hosted workflow executable keys must be canonical.");
  for (const line of workflowRunLines(lines)) {
    const managers = [...line.matchAll(PACKAGE_MANAGER_EXECUTABLE)];
    if (!managers.length) continue;
    const command = line.trim().split(/\s+/);
    if (
      managers.length !== 1 ||
      JSON.stringify(command) !==
        JSON.stringify(EXPECTED_PACKAGE_MANAGER_COMMAND)
    )
      throw new Error(
        "Hosted workflow package-manager command must be exact npm ci --ignore-scripts.",
      );
    packageManagerCommands.push(command);
  }
  if (packageManagerCommands.length !== 1)
    throw new Error(
      "Hosted workflow must contain exactly one package-manager command.",
    );
  const actions = workflowActionSteps(lines);
  if (JSON.stringify(actions) !== JSON.stringify(EXPECTED_ACTION_STEPS))
    throw new Error("Hosted workflow executable action surface changed.");
  return packageManagerCommands[0];
}

function workflowRunLines(source) {
  const result = [];
  for (let index = 0; index < source.length; index += 1) {
    const match = source[index].match(/^(\s*)(?:-\s+)?run:\s*(.*?)\s*$/);
    if (!match) continue;
    const marker = match[2];
    if (!/^[|>][+-]?$/.test(marker)) {
      result.push(marker);
      continue;
    }
    const ownerIndent = match[1].length;
    while (index + 1 < source.length) {
      const candidate = source[index + 1],
        candidateIndent = candidate.match(/^\s*/)[0].length;
      if (candidate.trim() && candidateIndent <= ownerIndent) break;
      index += 1;
      if (candidate.trim()) result.push(candidate.trim());
    }
  }
  return result;
}

function workflowActionSteps(lines) {
  const starts = [];
  for (let index = 0; index < lines.length; index += 1)
    if (/^ {6}- [A-Za-z0-9_-]+:/.test(lines[index])) starts.push(index);
  const result = [];
  for (let position = 0; position < starts.length; position += 1) {
    const start = starts[position],
      end = starts[position + 1] ?? lines.length,
      block = lines.slice(start, end),
      uses = actionProperty(block, "uses");
    if (uses === null) continue;
    const unexpected = [
      block[0].match(/^ {6}- ([A-Za-z0-9_-]+):/u)?.[1],
      ...block.map((line) => line.match(/^ {8}([A-Za-z0-9_-]+):/u)?.[1]),
    ].filter(
      (name) =>
        name && !new Set(["name", "id", "if", "uses", "with"]).has(name),
    );
    if (unexpected.length)
      throw new Error(
        `Hosted workflow action fields changed: ${unexpected.join(",")}`,
      );
    result.push(
      action(
        actionProperty(block, "id"),
        uses,
        actionProperty(block, "if"),
        actionInputs(block),
      ),
    );
  }
  return result;
}

function actionProperty(block, property) {
  const direct = block
      .map((line) => line.match(new RegExp(`^ {8}${property}:\\s*(.+?)\\s*$`)))
      .filter(Boolean),
    firstLine = block[0].match(new RegExp(`^ {6}- ${property}:\\s*(.+?)\\s*$`)),
    values = [...direct.map((match) => match[1]), firstLine?.[1]].filter(
      (value) => value !== undefined,
    );
  if (values.length > 1)
    throw new Error(`Duplicate hosted workflow action ${property}.`);
  return values.length ? scalar(values[0]) : null;
}

function actionInputs(block) {
  const lineIndex = block.findIndex((line) => /^ {8}with:/.test(line));
  if (lineIndex < 0) return {};
  const tail = block[lineIndex].replace(/^ {8}with:\s*/, "").trim();
  if (tail) return sortedMap(parseInlineMap(tail));
  const values = {};
  for (const line of block.slice(lineIndex + 1)) {
    const match = line.match(/^ {10}([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    if (match[1] in values)
      throw new Error(`Duplicate hosted workflow action input ${match[1]}.`);
    values[match[1]] = scalar(match[2]);
  }
  return sortedMap(values);
}

function parseInlineMap(value) {
  if (!value.startsWith("{") || !value.endsWith("}"))
    throw new Error("Hosted workflow action inputs must be an explicit map.");
  const result = {};
  for (const item of value.slice(1, -1).split(",")) {
    const separator = item.indexOf(":");
    if (separator < 1)
      throw new Error("Hosted workflow action inline input is invalid.");
    const key = item.slice(0, separator).trim(),
      entry = scalar(item.slice(separator + 1).trim());
    if (!/^[A-Za-z0-9_-]+$/.test(key) || key in result)
      throw new Error("Hosted workflow action inline input key is invalid.");
    result[key] = entry;
  }
  return result;
}

function scalar(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  )
    return value.slice(1, -1);
  return value;
}

function sortedMap(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function action(id, uses, condition, inputs) {
  return { id, uses, condition, inputs: sortedMap(inputs) };
}
