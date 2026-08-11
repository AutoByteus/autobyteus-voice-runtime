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
  ]),
  EXPECTED_RUN_STEPS = Object.freeze([
    run("audit_init"),
    run("source_admission", null, null, {
      GH_TOKEN: "${{ github.token }}",
    }),
    run("hosted_toolchain"),
    run("input_hydration"),
    run("host_construction"),
    run("release_composition"),
    run("publish", null, null, { GH_TOKEN: "${{ github.token }}" }),
    run("verify", "always() && steps.publish.outcome != 'skipped'", "true", {
      GH_TOKEN: "${{ github.token }}",
    }),
    run("quarantine", "always() && steps.verify.outcome == 'failure'", null, {
      GH_TOKEN: "${{ github.token }}",
    }),
    run("audit_finalize", "always() && steps.audit_init.outcome == 'success'"),
    run(null, "always()"),
  ]);

export function assertHostWorkflowExecutableSurface(workflow) {
  if (typeof workflow !== "string" || workflow.includes("\t"))
    throw new Error("Hosted workflow YAML must be text without tabs.");
  const lines = workflow.split(/\r?\n/),
    packageManagerCommands = [];
  if (
    lines.some((line) =>
      /^ {0,8}(?:["']?(?:defaults|shell)["']?)\s*:/.test(line),
    )
  )
    throw new Error("Hosted workflow shell selection must be canonical.");
  const steps = canonicalWorkflowSteps(lines);
  for (const line of workflowRunLines(steps)) {
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
  const actions = workflowActionSteps(steps);
  if (JSON.stringify(actions) !== JSON.stringify(EXPECTED_ACTION_STEPS))
    throw new Error("Hosted workflow executable action surface changed.");
  const runs = workflowRunSteps(steps);
  if (JSON.stringify(runs) !== JSON.stringify(EXPECTED_RUN_STEPS))
    throw new Error("Hosted workflow executable run surface changed.");
  return packageManagerCommands[0];
}

function canonicalWorkflowSteps(lines) {
  const declarations = lines
    .map((line, index) => (/^ {4}steps:\s*$/.test(line) ? index : -1))
    .filter((index) => index >= 0);
  if (declarations.length !== 1)
    throw new Error("Hosted workflow must have one canonical step list.");
  const start = declarations[0] + 1;
  let end = lines.length;
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].trim() && /^ {0,4}\S/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const blocks = [],
    starts = [];
  for (let index = start; index < end; index += 1) {
    const line = lines[index];
    if (!/^ {6}-\s+/.test(line)) continue;
    if (!/^ {6}- [A-Za-z0-9_-]+:\s*/.test(line))
      throw new Error("Hosted workflow steps must use canonical block maps.");
    starts.push(index);
  }
  if (!starts.length)
    throw new Error("Hosted workflow must have canonical executable steps.");
  for (let position = 0; position < starts.length; position += 1) {
    const block = lines.slice(starts[position], starts[position + 1] ?? end),
      fields = stepFields(block),
      hasRun = fields.includes("run"),
      hasUses = fields.includes("uses");
    if (hasRun === hasUses)
      throw new Error("Hosted workflow steps must select exact run or uses.");
    const allowed = new Set(
      hasUses
        ? ["name", "id", "if", "uses", "with"]
        : ["name", "id", "if", "env", "run", "continue-on-error"],
    );
    const unexpected = fields.filter((field) => !allowed.has(field));
    if (unexpected.length)
      throw new Error(
        `Hosted workflow executable step fields changed: ${unexpected.join(",")}`,
      );
    blocks.push(block);
  }
  return blocks;
}

function stepFields(block) {
  const invalid = block.filter(
    (line) =>
      /^ {8}\S/.test(line) &&
      !/^ {8}[A-Za-z0-9_-]+:\s*/.test(line) &&
      !/^ {8}#/.test(line),
  );
  if (invalid.length)
    throw new Error(
      "Hosted workflow executable step fields must be canonical.",
    );
  const first = block[0].match(/^ {6}- ([A-Za-z0-9_-]+):/u)?.[1],
    direct = block
      .map((line) => line.match(/^ {8}([A-Za-z0-9_-]+):/u)?.[1])
      .filter(Boolean),
    fields = [first, ...direct].filter(Boolean);
  if (new Set(fields).size !== fields.length)
    throw new Error("Duplicate hosted workflow executable step field.");
  return fields;
}

function workflowRunSteps(steps) {
  return steps
    .filter((block) => actionProperty(block, "run") !== null)
    .map((block) =>
      run(
        actionProperty(block, "id"),
        actionProperty(block, "if"),
        actionProperty(block, "continue-on-error"),
        stepMap(block, "env"),
      ),
    );
}

function workflowRunLines(steps) {
  const result = [];
  for (const block of steps) {
    let index = block.findIndex((line) => /^ {6}- run:|^ {8}run:/.test(line));
    if (index < 0) continue;
    const match = block[index].match(/^(\s*)(?:-\s+)?run:\s*(.*?)\s*$/);
    if (!match) continue;
    const marker = match[2];
    if (!/^[|>][+-]?$/.test(marker)) {
      result.push(marker);
      continue;
    }
    const ownerIndent = match[1].length;
    while (index + 1 < block.length) {
      const candidate = block[index + 1],
        candidateIndent = candidate.match(/^\s*/)[0].length;
      if (candidate.trim() && candidateIndent <= ownerIndent) break;
      index += 1;
      if (candidate.trim()) result.push(candidate.trim());
    }
  }
  return result;
}

function workflowActionSteps(steps) {
  const result = [];
  for (const block of steps) {
    const uses = actionProperty(block, "uses");
    if (uses === null) continue;
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
  return stepMap(block, "with");
}

function stepMap(block, property) {
  const lineIndex = block.findIndex((line) =>
    new RegExp(`^ {8}${property}:`).test(line),
  );
  if (lineIndex < 0) return {};
  const tail = block[lineIndex]
    .replace(new RegExp(`^ {8}${property}:\\s*`), "")
    .trim();
  if (tail) return sortedMap(parseInlineMap(tail));
  const values = {};
  for (const line of block.slice(lineIndex + 1)) {
    if (line.trim() && /^ {10}\S/.test(line) && !/^ {10}#/.test(line)) {
      if (!/^ {10}[A-Za-z0-9_-]+:\s*/.test(line))
        throw new Error(
          `Hosted workflow ${property} fields must be canonical.`,
        );
    }
    const match = line.match(/^ {10}([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    if (match[1] in values)
      throw new Error(
        `Duplicate hosted workflow ${property} field ${match[1]}.`,
      );
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

function run(id, condition = null, continueOnError = null, environment = {}) {
  return {
    id,
    condition,
    continueOnError,
    environment: sortedMap(environment),
  };
}
