# CRR-051 — Runtime Host Build / Verification Resolution Evidence

## Subjects

- Solution/design: `SR-021` / `ARCH-REV-021 Pass`
- Implementation revision: `IR-033`
- Source commit: `4db8bf26708309440c83ec56973250f77e9f1619`
- Artifact/reviewed HEAD: `bd70e942dd6ed3b49d7db5221dfe13f14b44032f`
- Trigger: `CRR-050`, `CR-F-044`, `CR-F-045`, `API-REV-022`, `API-F-016`, `API-F-017`

## CR-F-044 Resolution

- `build/profile-builders/funasr-host.mjs` retains `trustedHostBuildEnvironment` from `build/host-build-environment.mjs`.
- It now imports both `cmakeConfigureArguments` and `verifyResolvedCmakeConfiguration` from their canonical owner, `build/resolved-cmake-configuration.mjs`.
- `tests/build/host-builder-composition.test.mjs` executes both real builder entry scripts. Both ESM graphs instantiate and reach the normal `Missing --target.` argument boundary; neither reports a missing named export.
- The test directly binds both resolved-CMake exports as functions, without creating another argument composer or verifier.

Result: `Resolved`.

## CR-F-045 Resolution

- `packaging/archive.ExtractVerified` now constructs `VerificationReport` with named fields and projects the already validated `expected.Archive.RootDirectory` into `HostRoot`.
- The private absolute extraction destination remains used only for filesystem operations and is not included in the public report.
- `packaging/archive/canonicalzip_test.go` asserts exact logical `host`, equality to the expectation root, and inequality to the private destination.
- The production-shaped Node test uses the repository-locked real Go tool to build a canonical archive, invokes the real Go extractor through `verifyHostArchive`, passes the real report through strict Host Verification 2 validation, and confirms the persisted result is `host`.
- No schema relaxation, caller-side normalization, fallback, or secondary root policy exists.

Result: `Resolved`.

## Reviewer-Executed Validation

Using exact repository-locked Go `1.26.5` at `/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go`:

- `VOICE_GO=... node --test tests/build/host-builder-composition.test.mjs` — `2/2 Pass`.
- `VOICE_GO=... npm run check:release-pipeline` — `9/9 Pass`.
- `VOICE_GO=... npm run check` — `93/93 Node TAP`, `7/7 Python`, all Go/source/evidence checks Pass.
- `go test -race ./packaging/archive` — Pass.
- Prettier check and `git diff --check` — Pass.

## Scope / Residual Boundary

No API/E2E, actual production Chinese host build, production model download, provider execution, store mutation, focused evidence generation, merge, tag, or publication was performed by this review. API/E2E must resume at the failed production construction/verification prerequisites.
