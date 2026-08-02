#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directories = ['runtime', 'benchmark', 'benchmark/adapters', 'scripts']
for (const directory of directories) {
  for (const name of await fs.readdir(path.join(projectRoot, directory))) {
    if (!name.endsWith('.cjs') && !name.endsWith('.mjs')) continue
    await execFileAsync(process.execPath, ['--check', path.join(projectRoot, directory, name)])
  }
}
