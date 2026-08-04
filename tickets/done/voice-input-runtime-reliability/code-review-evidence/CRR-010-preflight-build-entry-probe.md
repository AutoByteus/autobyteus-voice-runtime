# CRR-010 Preflight And Build-Entry Probe

## Scope

This reviewer probe checks two normal darwin-arm64 entry conditions in IR-009's preflight-bound native build environment. Reachability is governed by the reviewed self-hosted M1 prequalify workflow and is recorded in the canonical CRR-010 report; these commands only demonstrate the source mechanisms.

## 1. Standard Homebrew CMake symlink is accepted by preflight identity capture and rejected by package assembly

The workflow passes the same `$VOICE_CMAKE` value to `benchmark/darwin-arm64-runner-preflight.mjs` and `build/package-assembler.mjs`.

Current reference-host identity:

```text
$ ls -l /opt/homebrew/bin/cmake
/opt/homebrew/bin/cmake -> ../Cellar/cmake/4.3.3/bin/cmake

path.resolve input: /opt/homebrew/bin/cmake
fs.realpath input: /opt/homebrew/Cellar/cmake/4.3.3/bin/cmake
```

A strict-schema passing preflight fixture was constructed from the exact current host/tool bytes and repository-locked Go/sandbox identities. The preflight identity used the same `fs.realpath()` behavior as production. Calling the production owner with the same accepted symlink input produced:

```text
supplied= /opt/homebrew/bin/cmake
preflight= /opt/homebrew/Cellar/cmake/4.3.3/bin/cmake
observed-error= CMake path does not match the passing preflight.
```

Cause:

- `darwin-arm64-runner-preflight.mjs` records `cmakeExecutable.path` through `fs.realpath()`.
- `createTrustedNativeBuildEnvironment()` compares `path.resolve(cmakePath)` to that real path rather than comparing canonical real paths.

## 2. Preflight hashes an execute-only system command

Current reference-host permissions and direct digest attempt:

```text
$ ls -l /usr/bin/sudo
-r-s--x--x  1 root  wheel  ... /usr/bin/sudo

$ shasum -a 256 /usr/bin/sudo
shasum: /usr/bin/sudo: Permission denied
```

The repository's direct `shaFile('/usr/bin/sudo')` call likewise failed with:

```text
Error: EACCES: permission denied, open '/usr/bin/sudo'
```

`requiredCommandIdentities()` includes `/usr/bin/sudo` and calls `shaFile()` for every listed command before the subsequent `sudo -n /usr/sbin/purge` capability check. Therefore a correctly configured non-root self-hosted runner cannot complete the passing preflight on this reference macOS host, even when noninteractive purge permission is available.
