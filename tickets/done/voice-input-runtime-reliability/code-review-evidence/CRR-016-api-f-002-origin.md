# CRR-016 Failure-Origin Evidence — API-F-002

## Review Basis

- Entry point: API/E2E failure-origin review.
- API revision: `API-REV-005` (`Fail / 87%`).
- Reviewed implementation: `IR-013`, source commit `628bef9d9b1f40f263cb1f41e711649b8ca7dfe6`.
- API/E2E artifact commit: `ae81ed0`.
- Scenario: `API-VOICE-003`; affected criteria: `AC-006`, `AC-017`.
- Structured failure evidence: `../api-e2e-evidence/api-rev-005/english-darwin-arm64/API-F-002-package-construction-sandbox-sudo-failure.json`.

The five relevant source files have no byte change between the reviewed source commit and current HEAD:

- `benchmark/system-command-identity.mjs` (`git hash-object` `c8cfc0b2548b4a6c7bfbd5b2c59aaaf1cb57b20f`)
- `benchmark/darwin-arm64-preflight-contract.mjs` (`b7143efa29463a7f692667d329ef08040f2a7be1`)
- `build/trusted-native-environment.mjs` (`482671f8e1de35e87803b17cf0d087142b34e4be`)
- `.github/workflows/release-voice-runtime.yml` (`a5a7b14362f41c725b064e3b32d7d1395e1b0735`)
- `benchmark/sandbox/darwin-arm64-network-denied-v1.sb` (`5d41a32d8ba2ac7bfe905d87b406ea8f234de519`)

## Supported Production Path

The failure is independently reachable from the approved operational contract, not merely from the downstream test:

1. `BEH-004` and `AC-006` require the current maintainer/package path to construct deterministic packages through network-denied builds.
2. `AC-020` requires Functional Preflight 2 to prove the exact Seatbelt canary and noninteractive pinned purge capability before counted qualification.
3. The source-controlled release workflow implements that supported path: it runs preflight outside Seatbelt, materializes closed inputs, then executes the whole `package-assembler.mjs` command under `benchmark/sandbox/darwin-arm64-network-denied-v1.sb`.
4. Package assembly calls `createTrustedNativeBuildEnvironment()`, which calls `assertPassingDarwinArm64Preflight()`.
5. That consumer calls `verifyPinnedSudoIdentity()`, which captures the identity again by spawning `/usr/bin/sudo -V`.
6. macOS Seatbelt rejects that setuid executable from inside the pinned profile. The production command therefore stops with `spawn EPERM` before creating an archive.

This path was exercised with a passing actual-M1 preflight, exact closed English inputs, and the approved production command. The same sudo probe outside Seatbelt returned the preflight-bound output digests; direct and Node-child probes inside the exact profile failed with `Operation not permitted` / `EPERM`. The source path and observed stack agree.

## Failure Origin

`API-F-002` is a bounded implementation integration defect. The approved contracts require both an authenticated functional preflight and a network-denied package build; they do not require a forbidden setuid command to be launched from inside the build sandbox. The build entry composes two individually valid mechanisms in an incompatible order.

The failure is not caused by:

- CPU idle: the actual six-sample average was truthfully classified `loaded-host` and correctly allowed functional work to continue;
- missing purge capability: the exact `sudo -n /usr/sbin/purge` prerequisite passed outside Seatbelt;
- stale source or fixture drift: the relevant reviewed source bytes are unchanged and the exact workflow command failed;
- the providers, models, thresholds, corpus authority, or package contents: execution stopped before any archive/provider process existed.

## Prior Review Gap

This was reasonably detectable during source review. CRR-011 verified the execute-only sudo identity owner and trusted native environment, while the workflow already wrapped the package assembler in Seatbelt. The missing composition invariant was: every operation transitively executed by the sandboxed package entry must be permitted by that profile, or any required live host verification that the profile forbids must be completed at a trusted boundary before entering it. Existing coverage exercised the sudo identity owner and trusted environment outside the production Seatbelt boundary, so it did not prove their composition.

## Required Bounded Correction

Preserve all approved gates while making the exact production command executable:

- retain one fail-closed authority for the exact preflight, sudo identity, and noninteractive purge capability;
- retain the pinned network-denial build boundary and exact trusted native environment;
- arrange verification/consumption so package construction does not attempt a Seatbelt-forbidden sudo launch;
- reject preflight, identity, capability, tool, or sandbox-profile drift rather than bypassing or self-attesting it;
- add focused coverage for the actual workflow/build-entry composition and prove both the passing path and identity/capability-drift rejection.

No unsandboxed package build, skipped preflight, weaker sudo/purge identity, provider/model/threshold change, or release action is acceptable. If the correction cannot preserve these properties without changing the reviewed boundary, route it to Solution Design rather than improvising.

## Decision

- Review result: `Fail`.
- Finding: `CR-F-022` (mapped from `API-F-002`).
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Required return path: implementation rework -> source re-review -> API/E2E rerun beginning with the corrected canonical package-build boundary.
