# CRR-009 Native Build Environment Probe

## Purpose

Confirm whether the exact CMake 4.3.3 invocation pattern used by `build/profile-builders/funasr.mjs` consumes an inherited native-build flag that is neither rejected nor cleared by the package-assembler boundary.

## Command

```bash
set -e
D=$(mktemp -d /tmp/voice-cmake-flags-probe.XXXXXX)
cat >"$D/CMakeLists.txt" <<'CMAKE'
cmake_minimum_required(VERSION 3.20)
project(probe C CXX)
add_executable(probe main.cxx)
CMAKE
cat >"$D/main.cxx" <<'CPP'
#ifndef VOICE_UNRECORDED_FLAG
#error inherited flag was not applied
#endif
int main(){return 0;}
CPP
env CXXFLAGS=-DVOICE_UNRECORDED_FLAG=1 /opt/homebrew/bin/cmake -S "$D" -B "$D/build"
env CXXFLAGS=-DVOICE_UNRECORDED_FLAG=1 /opt/homebrew/bin/cmake --build "$D/build"
grep '^CMAKE_CXX_FLAGS:' "$D/build/CMakeCache.txt"
"$D/build/probe"
```

## Observed Result

```text
CMAKE_CXX_FLAGS:STRING=-DVOICE_UNRECORDED_FLAG=1
probe exit: 0
```

The exact CMake binary accepted the inherited `CXXFLAGS`, persisted it in its generated build configuration, and used it to compile a source that otherwise fails. In the repository path, `verifyGoToolchain()` rejects `CXX` but not `CXXFLAGS`; `package-assembler.mjs` and `funasr.mjs` then launch the builder/CMake with inherited environment. This is mechanism evidence for `CR-F-018`; reachability and governing-contract applicability are established separately by `MP-CR-012` in the canonical code-review report.
