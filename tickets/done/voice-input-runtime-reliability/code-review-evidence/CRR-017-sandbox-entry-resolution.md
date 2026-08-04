# CRR-017 Source Re-review Evidence — CR-F-022 Resolution

## Scope

- Current implementation: `IR-014`.
- Source commit: `fda4a3bc482c2452b6842644d62dfb062ad8339c`.
- Trigger: `CRR-016` / `CR-F-022`, mapped from `API-REV-005` / `API-F-002` / `API-VOICE-003`.
- Authority: `SR-010`, `SR-011`, `ARCH-REV-012`.

The bounded source delta from API-REV-005 is eight files: the workflow, preflight/system-command owners, a new native-environment authorization CLI, the package entry, the trusted-environment owner, and two focused test files.

## Production Trace

The reviewed path is now:

1. Functional Preflight 2 runs outside Seatbelt and writes the exact v2 record, including the successful `/usr/bin/sudo -V` identity probe, exact noninteractive `/usr/sbin/purge` capability, tool/SDK identities, and pinned sandbox-profile digest.
2. Immediately before the two-build loop, `.github/workflows/release-voice-runtime.yml` invokes `build/create-native-build-environment.mjs` outside Seatbelt.
3. That CLI calls the existing full `createTrustedNativeBuildEnvironment()` owner. It validates the passing preflight, live-rechecks the full sudo identity/probe and every native tool/SDK identity, verifies the configured CMake canonical target, and writes one preflight-SHA-bound environment record.
4. Both primary and reproducibility builds still invoke the whole `build/package-assembler.mjs` under the unchanged checked-in deny-network Seatbelt profile.
5. Package assembly now requires `--build-environment` and calls `consumeTrustedNativeBuildEnvironment()`. The consumer validates the preflight/schema/recomputed identities, rechecks live sudo filesystem metadata without executing sudo, rechecks every usable tool/SDK byte, and requires exact record-to-preflight SHA/tool equality.
6. Only after that validation does package construction materialize the closed trusted tool directory and invoke the profile builder/launcher/archive owners inside Seatbelt.

No package assembler production call still invokes `createTrustedNativeBuildEnvironment()`, and the source tree contains no transitive package-build sudo execution. The later filesystem-cold qualification procedure remains outside the provider Seatbelt wrapper and is unchanged.

## Independent Checks

### Focused repository tests

Command:

```text
node --test tests/build/trusted-native-environment.test.mjs tests/release/system-command-identity.test.mjs
```

Result: `8/8 Pass`.

The passing composition test creates authorization outside Seatbelt and consumes it under the exact checked-in profile. Negative cases reject changed preflight probe/capability, live sudo metadata, sandbox digest, and trusted tool bytes. Static workflow/package assertions confirm creator-before-loop, Seatbelt-wrapped package entry, required build-environment input, and removal of create-inside-sandbox.

### Actual API-REV-005 preflight reuse

Using the retained actual-host preflight record at:

`/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-005/environment/darwin-arm64-preflight-v2.json`

the reviewer ran the production authorization CLI with its exact authenticated CMake path, then invoked `consumeTrustedNativeBuildEnvironment()` under the exact Seatbelt profile. It passed and returned:

```json
{"target":"darwin-arm64","preflightSha256":"f6e02714a848b6d9bb5045954bd566989736628444a351662072df45a5005d08","pathPolicy":"isolated-verified-tools-v1"}
```

The preflight SHA matched the retained API record. No sudo child was launched inside Seatbelt; otherwise the actual profile would reproduce the prior `EPERM` failure.

### Source and documentation checks

- Changed-source `git diff --check`: Pass.
- Changed production files remain below the 500-line hard limit.
- `build/package-assembler.mjs` remains high-pressure at 432 effective non-empty lines, but IR-014 replaces four argument/owner lines rather than adding a new responsibility.
- `README.md` still documents the former direct `--cmake` package-assembler command. That command now exits with `Missing --build-environment`. This is a required durable documentation synchronization item for Delivery, not a source/API execution blocker: the repository-owned production workflow and current implementation handoff contain the correct executable sequence.

## Decision

- `CR-F-022`: Resolved in source.
- New implementation finding: None.
- Source result: `Pass`.
- Remaining gate: API/E2E must rerun the real canonical English package build first, then continue the exact two-profile matrix only if it succeeds.
