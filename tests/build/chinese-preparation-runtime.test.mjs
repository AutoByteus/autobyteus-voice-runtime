import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { after, before, test } from "node:test";
import { ROOT } from "../../build/lib/files.mjs";

const run = promisify(execFile),
  source = path.join(ROOT, "providers/chinese-funasr/src");
let work, digestTool, digestFailureTool, diagnosticTool;

before(async () => {
  if (process.platform !== "darwin") return;
  work = await fs.mkdtemp(
    path.join(os.tmpdir(), "voice-chinese-runtime-test-"),
  );
  const digestMain = path.join(work, "digest-main.cpp");
  await fs.writeFile(
    digestMain,
    `#include "package_integrity.h"\n#include <iostream>\nint main(int argc,char**argv){try{std::cout<<(argc==2?sha256_file_incremental_apple(argv[1]):sha256_bytes("abc"))<<"\\n";}catch(const std::exception&e){std::cerr<<e.what()<<"\\n";return 2;}}\n`,
  );
  digestTool = path.join(work, "digest-tool");
  await compile([
    digestMain,
    path.join(source, "package_integrity.cpp"),
    path.join(source, "package_integrity_apple.cpp"),
    "-o",
    digestTool,
  ]);
  const digestFailureBackend = path.join(work, "digest-failure-backend.cpp");
  await fs.writeFile(
    digestFailureBackend,
    `#include <cstdlib>\n#include <stdexcept>\n#include <string>\nnamespace package_integrity {\nclass AppleSha256 { public: AppleSha256(); ~AppleSha256(); AppleSha256(const AppleSha256&)=delete; AppleSha256& operator=(const AppleSha256&)=delete; void update(const void*,std::size_t); std::string finish(); private: struct State; State* state_; };\nstruct AppleSha256::State {};\nstatic std::string failure(){const char* value=std::getenv("VOICE_TEST_DIGEST_FAILURE");return value?value:"";}\nAppleSha256::AppleSha256():state_(nullptr){if(failure()=="init")throw std::runtime_error("digest-init-failed");state_=new State();}\nAppleSha256::~AppleSha256(){delete state_;}\nvoid AppleSha256::update(const void*,std::size_t){if(failure()=="update")throw std::runtime_error("digest-update-failed");}\nstd::string AppleSha256::finish(){if(failure()=="final")throw std::runtime_error("digest-final-failed");return std::string(64,'0');}\n}\n`,
  );
  digestFailureTool = path.join(work, "digest-failure-tool");
  await compile([
    digestMain,
    path.join(source, "package_integrity.cpp"),
    digestFailureBackend,
    "-o",
    digestFailureTool,
  ]);
  const diagnosticMain = path.join(work, "diagnostic-main.cpp");
  await fs.writeFile(
    diagnosticMain,
    `#include "preparation_diagnostics.h"\nint main(){PreparationDiagnostics d;const char*s[]={"manifest-verification","encoder-load","language-model-load","context-create","normalizer-load"};for(auto stage:s){d.start(stage);d.complete(stage);}}\n`,
  );
  diagnosticTool = path.join(work, "diagnostic-tool");
  await compile([
    diagnosticMain,
    path.join(source, "preparation_diagnostics.cpp"),
    "-o",
    diagnosticTool,
  ]);
});

after(async () => {
  if (work) await fs.rm(work, { recursive: true, force: true });
});

test("CommonCrypto streaming digest matches exact boundary payloads", async (t) => {
  if (process.platform !== "darwin") return t.skip("Apple-only runtime owner");
  assert.equal(
    (await run(digestTool)).stdout.trim(),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  for (const size of [
    0,
    1,
    63,
    64,
    65,
    1024 * 1024 - 1,
    1024 * 1024,
    1024 * 1024 + 1,
  ]) {
    const file = path.join(work, `payload-${size}`),
      value = Buffer.alloc(size);
    for (let index = 0; index < value.length; index++)
      value[index] = index % 251;
    await fs.writeFile(file, value);
    const expected = createHash("sha256").update(value).digest("hex"),
      observed = (await run(digestTool, [file])).stdout.trim();
    assert.equal(observed, expected, `size ${size}`);
  }
});

test("integrity owner is bounded, Apple-only, and classifies failures", async (t) => {
  if (process.platform !== "darwin") return t.skip("Apple-only runtime owner");
  await assert.rejects(
    run(digestTool, [path.join(work, "missing")]),
    (error) => error.code === 2 && error.stderr.trim() === "file-open-failed",
  );
  for (const failure of ["init", "update", "final"])
    await assert.rejects(
      run(digestFailureTool, [], {
        env: { ...process.env, VOICE_TEST_DIGEST_FAILURE: failure },
      }),
      (error) =>
        error.code === 2 && error.stderr.trim() === `digest-${failure}-failed`,
    );
  const implementation = await fs.readFile(
      path.join(source, "package_integrity.cpp"),
      "utf8",
    ),
    apple = await fs.readFile(
      path.join(source, "package_integrity_apple.cpp"),
      "utf8",
    ),
    cmake = await fs.readFile(
      path.join(ROOT, "providers/chinese-funasr/CMakeLists.txt"),
      "utf8",
    );
  assert.match(implementation, /1024 \* 1024/);
  assert.doesNotMatch(implementation, /vector|istreambuf_iterator/);
  assert.match(implementation, /file-read-failed/);
  for (const code of [
    "digest-init-failed",
    "digest-update-failed",
    "digest-final-failed",
  ])
    assert.match(apple, new RegExp(code));
  assert.match(cmake, /if\(NOT APPLE\)[\s\S]*FATAL_ERROR/);
  assert.doesNotMatch(cmake, /sha256\.cpp/);
});

test("preparation emitter writes exact private canonical lines", async (t) => {
  if (process.platform !== "darwin") return t.skip("Apple-only runtime owner");
  const result = await run(diagnosticTool),
    lines = result.stderr.trimEnd().split("\n");
  assert.equal(result.stdout, "");
  assert.equal(lines.length, 10);
  for (let sequence = 0; sequence < lines.length; sequence++) {
    const expectedStage = [
        "manifest-verification",
        "encoder-load",
        "language-model-load",
        "context-create",
        "normalizer-load",
      ][Math.floor(sequence / 2)],
      prefix = "AUTOBYTEUS_VOICE_PREP_V1 ";
    assert.ok(lines[sequence].startsWith(prefix));
    const text = lines[sequence].slice(prefix.length),
      value = JSON.parse(text);
    assert.equal(
      text,
      JSON.stringify({
        elapsedUs: value.elapsedUs,
        event: sequence % 2 ? "complete" : "start",
        sequence,
        stage: expectedStage,
      }),
    );
    if (sequence)
      assert.ok(
        value.elapsedUs >=
          JSON.parse(lines[sequence - 1].slice(prefix.length)).elapsedUs,
      );
  }
  const emitter = await fs.readFile(
    path.join(source, "preparation_diagnostics.cpp"),
    "utf8",
  );
  assert.match(emitter, /::write\(STDERR_FILENO/);
  assert.match(emitter, /errno == EINTR/);
  assert.doesNotMatch(emitter, /iostream|stdio|std::cerr|fprintf/);
});

async function compile(extra) {
  await run("xcrun", [
    "clang++",
    "-std=c++20",
    "-Wall",
    "-Wextra",
    "-Werror",
    "-I",
    source,
    ...extra,
  ]);
}
