# CRR-050 — API-F-016 / API-F-017 Failure-Origin Evidence

## Subjects

- Reviewed source: `ad7c402d224690584e2da98ec71a73e8b6d4ca36`
- Reviewed artifact: `93c9a6e579d253cfc1e9b5b8f69f22e4f688df9c`
- API/E2E result: `API-REV-022 Fail / 84%`
- API/E2E evidence/report commit: `c4e04d2776a337a80fa76dc705551bbb626c0bd0`
- Scenario: `API-VOICE-018`
- Failures: `API-F-016`, `API-F-017`

## API-F-016 Source Trace

1. The approved current two-profile host contract requires Chinese Runtime Host Archive 2 construction (`BEH-004`, `BEH-010`, `AC-028`).
2. Canonical API/E2E invoked the network-denied Chinese `host-package-assembler.mjs` path with exact authenticated inputs/tooling.
3. `build/profile-builders/funasr-host.mjs:14-18` requests `cmakeConfigureArguments`, `trustedHostBuildEnvironment`, and `verifyResolvedCmakeConfiguration` from `build/host-build-environment.mjs`.
4. `build/host-build-environment.mjs:29-30` exports its trusted-tool helpers and `trustedHostBuildEnvironment`, but does not export either resolved-CMake function.
5. `build/resolved-cmake-configuration.mjs:4` and `:25` are the actual owners of `cmakeConfigureArguments` and `verifyResolvedCmakeConfiguration`.
6. Node fails ESM instantiation at the real builder before CMake; no archive exists. The logged missing export is `cmakeConfigureArguments`, and the same import statement also misaddresses `verifyResolvedCmakeConfiguration`.

Conclusion: `Local Fix`, implementation owner. The source correction must bind both resolved-CMake functions to their actual owner and include a real-builder module/composition regression.

## API-F-017 Source Trace

1. The approved host evidence contract requires independent extraction/inspection of the actual Runtime Host Archive 2 before focused/hosted authority (`BEH-004`, `BEH-007`, `BEH-013`, `AC-028`).
2. API/E2E produced the English host twice with byte-identical reports and a byte-identical 207,492,896-byte archive, SHA-256 `a2463fc5fedcf2c7e96924d4f5df69045b70ca7b5983dad094a40fe9504e53dc`.
3. `build/host-package-verifier.mjs:61-77` invokes the real Go extraction tool; `:96-108` projects that report unchanged into Host Verification 2 validation.
4. `packaging/archive/safeextract.go:135` sets `VerificationReport.HostRoot` to the absolute `destination` path used for extraction.
5. `contracts/build/host-verification-v2.schema.json:23` requires the deterministic logical subject `host`.
6. Safe extraction succeeds, then strict schema validation fails only at `/hostRoot`.
7. `packaging/archive/canonicalzip_test.go:54-63` exercises extraction but asserts modes and files only, not the report's root subject. `tests/release/host-construction-result.test.mjs` supplies a hand-authored `hostRoot: "host"` fixture, so it cannot prove the real extractor/verifier composition.

Conclusion: `Local Fix`, implementation owner. Preserve the absolute destination as private operational state; return the already validated `expected.Archive.RootDirectory` in public evidence and cover the real composition.

## Review-Gap Determination

Both defects were reasonably detectable from source and should have been caught in CRR-048/049 API/E2E-readiness review:

- one is a static named-export mismatch on the real Chinese builder entry point;
- one is a static data-contract mismatch between the real extractor report and the strict Host Verification 2 schema.

The prior full scorecard is not repeated, but its API/E2E-readiness conclusion is reopened. `CR-F-039`–`CR-F-043` remain resolved and unrelated.

## Authoritative Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/SHA256SUMS.txt`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/host-build/API-F-016-chinese-builder-export-failure.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/host-build/API-F-016-chinese-host-construction.log`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/host-build/API-F-017-host-verifier-root-projection-failure.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/host-build/API-F-017-english-host-verification.log`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-022/host-build/english-host-reproducibility-proof-v2.json`
