# CRR-053 — Host Input Ownership Resolution

## Reviewed Subjects

- Solution/design authority: `SR-021` / `ARCH-REV-021 Pass`
- Trigger: `CRR-052`, `CR-F-046`, `API-F-018`
- Implementation revision: `IR-034`
- Source commit: `97f3007c2a62e5f48acd5fcc8c26d1e38b099850`
- Artifact/reviewed HEAD: `2a4b2ef7eab573388390274b47e1de197fe02d3e`
- Result: `Pass`

## Resolution Trace

The normal approved production path now has one explicit ownership decision before work:

1. `host-package-assembler.mjs` resolves the input root and calls the canonical `verifyInputManifest()` owner.
2. It selects the current profile's frozen builder patterns and calls `assertHostInputOwnership()` before Go/native environment setup, temporary stage creation, builder invocation, or authority staging.
3. Every non-provenance path must match exactly one ownership category: a profile-builder pattern or the exact frozen assembler authority set.
4. The selected builder consumes only its profile-owned inputs.
5. `stageHostAuthorities()` reuses the same frozen two-path set, authenticates exact bytes against Current Release Matrix 2, and stages both authorities.
6. Host Source Closure 1 includes the new profile ownership source so later evidence is bound to this policy.

The former source mismatch is removed:

- `funasr-host.mjs` no longer rejects the two outer-owned paths.
- `copyPythonHost()` no longer carries a broad `host-authority/` workaround.
- `assertHostInputClosure()` and its obsolete synthetic test are deleted.

## Exact Authority And Negative Coverage

`ASSEMBLER_HOST_AUTHORITY_INPUTS` contains only:

- `host-authority/model-admission-root-v1.json`
- `host-authority/model-compatibility-requirement-v1.json`

The production-shaped test binds the API-REV-023 English 48-row and Chinese 3,151-row path sets by decompressed byte SHA-256 and count, verifies that the current recipes close both sets, and applies the production ownership owner. It rejects:

- an unexpected third authority;
- an unrelated input;
- a broad authority pattern that would create two owners;
- an incomplete authority set.

Canonical manifest verification separately rejects invalid shape, duplicate paths, unsafe paths, digest/size/mode drift, symlinks, and unmanifested tree members before ownership classification.

## Reviewer-Executed Checks

- `VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go node --test tests/build/host-builder-composition.test.mjs` — `3/3` Pass.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check:release-pipeline` — `9/9` Pass.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check` — `93/93` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks Pass.
- Verified Go `vet ./...` and `test -race ./...` — Pass.
- `git diff --check` — Pass.

## Review Conclusion

`CR-F-046` is resolved without a generic ignore, broad authority prefix, fallback, compatibility path, schema relaxation, input omission, or behavior change. CRR-052's material premise remains reachable and is now resolved at its exact implementation boundary. Actual canonical archive construction remains API/E2E work.
