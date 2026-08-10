# CRR-052 — API-F-018 Failure-Origin Evidence

## Result

- Failure: `API-F-018` in `API-VOICE-018` / `AC-028`
- Reviewed source: `4db8bf26708309440c83ec56973250f77e9f1619`
- Reviewed artifact: `bd70e942dd6ed3b49d7db5221dfe13f14b44032f`
- API/E2E report/evidence commit: `7cc36194a87f2ec057a262e3645253a5220d127a`
- Classification: `Local Fix -> implementation_engineer`
- Code-review finding: `CR-F-046`

## Approved And Reachable Production Boundary

`BEH-004`, `BEH-010`, `R-005`, `R-025`, and `AC-028` require canonical construction of both model-free Runtime Host Archive 2 packages with exact Host Source Closure 1 and Model Admission Root 1 identities. Both current input recipes include exactly:

- `host-authority/model-admission-root-v1.json`
- `host-authority/model-compatibility-requirement-v1.json`

The normal production path is:

1. `build/host-package-assembler.mjs` validates the complete materialized input manifest.
2. It invokes the selected profile builder with the same complete input root (`host-package-assembler.mjs:89-116`).
3. After the builder returns, the outer assembler calls `stageHostAuthorities()` (`host-package-assembler.mjs:117-127`).
4. `stageHostAuthorities()` hashes and copies the two exact `host-authority/*` inputs into the archive (`host-package-staging.mjs:36-65`).
5. The assembler uses those exact inputs to derive Host Source Closure 1 and completes the archive.

API-REV-023 exercised this exact command under the canonical deny-network profile with valid exact source, inputs, native environment, and expected closure. The failure is therefore reachable from the approved operational contract and is not established circularly by a synthetic test.

## Deterministic Source Mismatch

`assertHostInputClosure()` scans every complete-manifest member other than provenance and throws unless a caller-supplied exact/prefix rule accepts it (`host-common.mjs:161-171`).

The Chinese builder supplies only:

- `funasr-source/`
- `llama-cpp-source/`
- `utf8proc-source/`
- `package-notices/`
- `runtime-source/`

(`funasr-host.mjs:28-34`). It therefore rejects the first outer-owned authority before CMake:

```text
Error: Host input has no consumer: host-authority/model-admission-root-v1.json
    at assertHostInputClosure (.../host-common.mjs:171:13)
    at .../funasr-host.mjs:28:1
```

The sibling compatibility authority has the same ownership mismatch. English does not fail at this check only because `copyPythonHost()` includes the broad `host-authority/` prefix (`host-common.mjs:89-97`), even though the outer assembler—not that inner builder—authenticates and stages those files. Thus current source has two inconsistent profile-local representations of one shared outer ownership boundary.

## Coverage And Prior-Review Gap

`tests/build/host-builder-composition.test.mjs:21-37` invokes each real builder with no arguments and expects `Missing --target`. This proves named-export/module instantiation only. It does not materialize or validate a complete current manifest and cannot reach the inner/outer ownership boundary.

CRR-051 should not have described that assertion as enough production-composition evidence for API/E2E readiness. The following source-visible facts were sufficient to retain the issue for correction:

- the outer assembler passes the complete input root to the inner builder;
- authority staging happens only after the builder returns;
- the Chinese closure omits both authorities;
- the English closure uses an overbroad authority prefix.

## Proportionate Correction Boundary

The correction should keep the approved architecture and fail-closed behavior:

- one shared exact definition for the two assembler-owned inputs at the assembler/staging boundary;
- profile-specific inputs remain builder-owned;
- every complete-manifest member must map to exactly one approved construction owner;
- unexpected authority or unrelated unused inputs remain rejected;
- complete current English and Chinese manifest ownership is exercised by durable production-shaped coverage.

A generic `host-authority/` allowlist, ignored-prefix option, fallback, input rename/omission, or relaxed closure would conceal rather than resolve the ownership defect.

## Evidence Consulted

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/profile-builders/host-common.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/profile-builders/funasr-host.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/host-package-assembler.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/host-package-staging.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/input-recipes/english-host-darwin-arm64-v2.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/build/input-recipes/chinese-host-darwin-arm64-v2.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tests/build/host-builder-composition.test.mjs`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-023/host-build/API-F-018-chinese-host-input-closure-failure.json`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-023/host-build/build-chinese-a.log`
