import fs from "node:fs/promises";
import path from "node:path";

export function cmakeConfigureArguments(record) {
  return [
    "-G",
    record.configuration.generator,
    `-DCMAKE_BUILD_TYPE=${record.configuration.buildType}`,
    `-DCMAKE_MAKE_PROGRAM=${record.tools.make.path}`,
    `-DCMAKE_C_COMPILER=${record.tools.cCompiler.path}`,
    `-DCMAKE_CXX_COMPILER=${record.tools.cxxCompiler.path}`,
    `-DCMAKE_AR=${record.tools.archiver.path}`,
    `-DCMAKE_RANLIB=${record.tools.ranlib.invocationPath}`,
    `-DCMAKE_LINKER=${record.tools.linker.path}`,
    `-DCMAKE_LIBTOOL=${record.tools.libtool.path}`,
    `-DCMAKE_OSX_SYSROOT=${record.tools.sdk.path}`,
    "-DCMAKE_C_FLAGS=",
    "-DCMAKE_CXX_FLAGS=",
    "-DCMAKE_EXE_LINKER_FLAGS=",
    "-DCMAKE_MODULE_LINKER_FLAGS=",
    "-DCMAKE_SHARED_LINKER_FLAGS=",
  ];
}

export async function verifyResolvedCmakeConfiguration(record, buildDirectory) {
  const cache = await fs.readFile(
      path.join(buildDirectory, "CMakeCache.txt"),
      "utf8",
    ),
    resolved = new Map();
  for (const line of cache.split(/\r?\n/)) {
    const match = /^([^#/:][^:]*)\:[^=]*=(.*)$/.exec(line);
    if (match) resolved.set(match[1], match[2]);
  }
  const expected = {
    CMAKE_GENERATOR: record.configuration.generator,
    CMAKE_BUILD_TYPE: record.configuration.buildType,
    CMAKE_MAKE_PROGRAM: record.tools.make.path,
    CMAKE_C_COMPILER: record.tools.cCompiler.path,
    CMAKE_CXX_COMPILER: record.tools.cxxCompiler.path,
    CMAKE_AR: record.tools.archiver.path,
    CMAKE_RANLIB: record.tools.ranlib.invocationPath,
    CMAKE_LINKER: record.tools.linker.path,
    CMAKE_LIBTOOL: record.tools.libtool.path,
    CMAKE_OSX_SYSROOT: record.tools.sdk.path,
    CMAKE_C_FLAGS: "",
    CMAKE_CXX_FLAGS: "",
    CMAKE_EXE_LINKER_FLAGS: "",
    CMAKE_MODULE_LINKER_FLAGS: "",
    CMAKE_SHARED_LINKER_FLAGS: "",
  };
  for (const [name, value] of Object.entries(expected))
    if (resolved.get(name) !== value)
      throw new Error(`Resolved CMake configuration mismatch: ${name}`);
}
