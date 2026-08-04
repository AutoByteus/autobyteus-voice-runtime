# CRR-018 Failure-Origin Evidence — API-F-003

## Result

- Classification: `Local Fix`
- Owner: `implementation_engineer`
- Source finding: `CR-F-023`
- API/E2E trigger: `API-REV-006`, `API-F-003`, `API-VOICE-003`
- Affected behavior/criteria: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`
- Reviewed source: `fda4a3bc482c2452b6842644d62dfb062ad8339c` (`IR-014`)

## Approved Reachability

The independent initiating basis is the supported maintainer `workflow_dispatch` prequalification operation in `.github/workflows/release-voice-runtime.yml`. For the exact current English `darwin-arm64` matrix entry, normal execution is:

1. Functional Preflight 2;
2. closed-input materialization from `build/input-recipes/english-darwin-arm64-v1.json`;
3. outside-Seatbelt native-build authorization;
4. `sandbox-exec` package assembly;
5. MLX profile build -> Python provider copy -> hermetic Python materialization;
6. archive construction and verification.

This is the contract-supported path required by `BEH-004`, `BEH-010`, `AC-006`, and `AC-017`. The API/E2E command reproduces that established path; it is not the basis for inventing reachability.

## Direct Source And Input Evidence

- The English recipe pins `cpython-3.12.13+20260718-aarch64-apple-darwin-install_only.tar.gz`, size `25,153,180`, SHA-256 `62aeee6161d57303a71a138b75fd5cc6fb8c89c4b1d9c7f0a052d89fa0b6652b`.
- Reviewer independently rechecked the retained exact input at `/private/tmp/autobyteus-voice-api-e2e-r6-20260803/output/inputs/english-darwin-arm64/python-host-archive`; its size and SHA-256 match the recipe.
- The authenticated archive has nine relative symbolic links:
  - `python/bin/2to3 -> 2to3-3.12`
  - `python/bin/idle3 -> idle3.12`
  - `python/bin/pydoc3 -> pydoc3.12`
  - `python/bin/python -> python3.12`
  - `python/bin/python3 -> python3.12`
  - `python/bin/python3-config -> python3.12-config`
  - `python/lib/pkgconfig/python3-embed.pc -> python-3.12-embed.pc`
  - `python/lib/pkgconfig/python3.pc -> python-3.12.pc`
  - `python/share/man/man1/python3.1 -> python3.12.1`
- `build/python/materialize-runtime.mjs` verifies the locked archive, extracts it, and uses `fs.stat()` on `bin/python3`, which follows the archive link. The interpreter successfully installs the locked wheel set.
- The same owner then calls `prune(root)`. Its first traversal is `regularFiles(root)`.
- `build/lib/files.mjs::regularFiles()` intentionally throws `Symbolic links are forbidden.` for every link. The final package/archive contract is correctly regular-file-only, but the Python materializer has no archive-specific step that validates and normalizes the locked archive's link topology before invoking that strict final-tree owner.
- The production log shows the exact call chain and error:
  `package-assembler -> profile-builders/mlx -> copyPythonProvider -> materializePythonRuntime -> prune -> regularFiles`.
- No English archive is emitted.

## Failure-Origin Decision

`API-F-003` is a bounded implementation/packaging incompatibility. The selected provider, locked archive, final regular-file-only package contract, offline/Seatbelt execution, model, thresholds, corpus, and workflow are all approved and unambiguous. No requirement or design choice needs to change.

`CR-F-022` remains resolved: API-REV-006 proves outside authorization and exact sandbox-safe consumption succeed with no sudo `EPERM`; execution advances into Python materialization.

This failure was not reasonably provable from implementation source alone because the recipe records the external archive's identity but not its internal entry types, and the current durable tests do not materialize that exact archive. Joining the authenticated binary input with the source exposes the incompatibility. It is therefore an implementation defect found at the intended realistic integration stage, not a stale test/environment problem and not a prior source-review failure.

## Required Bounded Invariant

The Python materializer must reconcile the exact locked upstream archive with the existing symlink-free package contract before any generic strict regular-file traversal:

- validate the allowed extracted link topology explicitly and fail closed on absolute, escaping, dangling, cyclic, special-file, or unexpected links;
- deterministically turn the required packaged `host/python/bin/python3` entry into an ordinary contained executable file and remove unneeded archive aliases/build-only link locations;
- preserve the global `regularFiles()` symlink rejection for final trees and other owners rather than weakening it globally;
- prove the final materialized/staged/package tree is entirely regular-file-only and remains closed, relocatable, offline, and reproducible;
- add focused coverage for the locked archive's real link topology plus unexpected/absolute/escaping/dangling-link negatives.

After implementation source review passes, API/E2E must rerun the canonical first English build and then the remaining current two-package qualification matrix.

## Evidence Paths

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/build/input-recipes/english-darwin-arm64-v1.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/build/python/materialize-runtime.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/build/lib/files.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/build/profile-builders/common.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/build/profile-builders/mlx.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/.github/workflows/release-voice-runtime.yml`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/english-darwin-arm64/API-F-003-python-runtime-symlink-materialization-failure.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/english-darwin-arm64/API-VOICE-003-python-runtime-symlink-probe.log`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/english-darwin-arm64/build-primary.log`
