# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental artifacts: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and their referenced evidence under the solution worktree.
- Solution Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Design/Architecture Review: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Implementation Handoff/Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Code Review Report/Revision: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision/round: `API-REV-006 / 6`.
- Trigger: `CRR-017` Pass for `IR-014` at reviewed source `fda4a3bc482c2452b6842644d62dfb062ad8339c`, against `SR-010`/`SR-011` and `ARCH-REV-012`.
- Prior round: `API-REV-005 — Fail / 87%` at `API-F-002`.
- Latest authoritative result: **`API-REV-006 — Fail / 89%` at `API-F-003`**.

## Investigation And Execution Basis

- Investigation opened/updated before execution: `Yes`.
- Prior failure rechecked first: `Yes`. The exact outside-Seatbelt authorization passed, the corrected Seatbelt package command consumed the record without `sudo` `EPERM`, and execution advanced into real MLX Python runtime materialization. `API-F-002` is directly resolved.
- Plan followed: `Yes`. Exact authority reuse, focused/full repository checks, a fresh actual-host preflight, source-bound rematerialization, exact corpus validation, then the corrected canonical English package construction ran.
- Durable coverage decisions changed: `No`; no API/E2E-owned repository-resident coverage was added, updated, or removed.
- Failure stop rule followed: `Yes`. The first archive was not created, so the serial matrix stopped without input/link-policy workaround, provider/model/threshold substitution, or release action.

## Compatibility / Legacy / Persisted Data Check

- Backward compatibility or legacy retention introduced: `No`.
- Approved persisted-data decision: `Not Affected`; execution stayed under the assigned worktree and owned `/private/tmp/autobyteus-voice-api-e2e-r6-20260803` roots.
- `~/.autobyteus`, desktop installation state, shared product state, tags, and public release state: not read or mutated by this validation.
- Compatibility-only coverage added: `No`.

## Changed Boundary And Evidence Matrix

| Scenario | Boundary | Mode | Result | Evidence |
| --- | --- | --- | --- | --- |
| `API-VOICE-001` | current source/unit/contracts/evidence | repository | Pass | focused 15/15; full 67/67 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |
| `API-VOICE-002` | exact English-v2 authority | exact-byte reuse plus real corpus staging | Pass / Reused | unchanged authority bytes; exact 49 unique WAVs pass production validator |
| `API-VOICE-003` preflight/input/corpus | actual M1 and English prerequisites | production CLI/materializer | Pass | fresh controlled Functional Preflight 2; exact source-bound English closed tree; exact 49 WAVs |
| `API-F-002` / corrected package entry | outside authorization -> exact Seatbelt consumer | production workflow command | Resolved / Pass | native environment creation passes; no transitive sudo execution; build advances into Python materialization |
| `API-VOICE-003` Python runtime construction | exact authenticated Python host archive -> hermetic runtime | production package builder | **Fail — `API-F-003`** | extracted archive contains nine relative symlinks; `prune()` calls `regularFiles()` and throws `Symbolic links are forbidden.` |
| remaining `API-VOICE-003` | archive verification/repro, inference/lifecycle/30/30/100 | actual package | Not Tested after Fail | first mandatory archive absent |
| `API-VOICE-004` prerequisites | Chinese closed input/corpus | production materializer/validator | Pass | exact source-bound Chinese closed tree; exact 200 unique WAVs |
| package portion of `API-VOICE-004` | Chinese archive/runtime/inference/lifecycle/30/30/100 | actual package | Not Tested after Fail | serial matrix stopped at English construction |
| `API-VOICE-005`–`010` | non-arm64 profiles | none | Deferred / Outside Current Matrix | approved darwin-arm64-only scope |
| `API-VOICE-011` | compliance/privacy/offline | exact package audit | Not Tested after Fail | no package archive |
| `API-VOICE-012` | QSet 2/projection 2/independent verification | aggregate CLI | Not Tested after Fail | no two passing profile subjects |
| `API-VOICE-013` | production corpus-validator regression | durable | Pass / Reused | unchanged bytes; focused/full suites pass |

## Repository Coverage Execution

| Command | Configuration | Result | Evidence |
| --- | --- | --- | --- |
| exact authority/test byte comparison | `628bef9...fda4a3b` plus clean checkout SHA-256 | Pass | `api-rev-006/repository/API-VOICE-002-013-authority-reuse.json` |
| `npm ci --ignore-scripts` | clean exact-source checkout, Node v22.23.1 | Pass | `repository/npm-ci.log` |
| focused native-environment/system-command/functional-retention/trusted-baseline tests | reviewed source | Pass 15/15 | `repository/focused-build-functional-authority.log` |
| exact-Go `npm run check` | official verified Go 1.26.5 darwin/arm64 | Pass | `repository/npm-run-check.log`; 67/67 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |

## Broader Validation Execution

### Actual host and Functional Preflight 2

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin/arm64.
- Functional result: Pass.
- AC power, AC Low Power Mode off, owned `caffeinate`, exact healthy thermal state, normal memory pressure, exact tool identities, sandbox canary, and exact `/usr/bin/sudo -n /usr/sbin/purge`: all Pass.
- Load evidence: samples `85.35, 84.76, 78.81, 75.10, 83.77, 83.77`; average `81.92666666666666%`; classification `controlled`; task-owned competing process `false`.

### Exact inputs and corpora

- Clean execution source: exact reviewed `fda4a3bc482c2452b6842644d62dfb062ad8339c`.
- English and Chinese closed input materialization: Pass with source-bound provenance records.
- English corpus: exact 49 clips, unique ID/path/audio hashes, all WAV hashes match, production validator Pass.
- Chinese corpus: exact 200 clips, unique ID/path/audio hashes, all WAV hashes match, production validator Pass.

### Prior-failure resolution and `API-F-003`

The corrected sequence ran exactly:

```text
node build/create-native-build-environment.mjs --preflight ... --cmake ... --output ...
/usr/bin/sandbox-exec -f benchmark/sandbox/darwin-arm64-network-denied-v1.sb \
  node build/package-assembler.mjs --profile english --target darwin-arm64 \
  --preflight ... --build-environment ...
```

Outside authorization passed, and the sandboxed consumer did not reproduce `API-F-002`. It then reached the exact Python runtime path and failed:

```text
materializePythonRuntime() -> prune() -> regularFiles()
Error: Symbolic links are forbidden.
```

Direct mechanism evidence:

1. The exact recipe-authenticated archive is `cpython-3.12.13+20260718-aarch64-apple-darwin-install_only.tar.gz`, size `25,153,180`, SHA-256 `62aeee6161d57303a71a138b75fd5cc6fb8c89c4b1d9c7f0a052d89fa0b6652b`.
2. Its archive index contains nine ordinary relative symlinks, including `python/bin/python3 -> python3.12` and eight additional bin/pkgconfig/man aliases.
3. `materializePythonRuntime()` extracts the archive and successfully uses `bin/python3` to install the locked wheels.
4. `prune()` then calls the global `regularFiles()` owner before links are normalized or removed; `regularFiles()` rejects any symlink.
5. No output archive, provider process, inference attempt, or performance attempt started.

Preliminary classification: `Local Fix / implementation defect` in the exact locked Python runtime materialization path. This failure is unrelated to sudo, user permissions, host readiness, CPU idle, provider/model selection, or the audio corpora.

## Validation Confidence Scorecard

| Category | Post-Repository | Final | Final Evidence / Limitation |
| --- | ---: | ---: | --- |
| Requirement and acceptance-criteria proof | 85% | 88% | preflight/input/corpus and prior-failure resolution are direct; `AC-006`/`AC-017` still fail before archive |
| Changed-boundary execution directness | 85% | 90% | exact corrected production workflow proves API-F-002 resolution and directly reaches the new failure |
| Cross-boundary integration realism and mock gap | 75% | 84% | real host/input/archive/build path used; final archive/provider/inference remains absent |
| Environment/configuration/identity/fixture fidelity | 85% | 95% | exact controlled M1/tool/power/sandbox/purge, clean source, closed inputs, and corpora are direct |
| Failure/edge/lifecycle/recovery evidence | 78% | 82% | construction fails closed with no partial archive/process; provider lifecycle remains unexecuted |
| User/browser/desktop-shell | N/A | N/A | runtime-only |
| Durable regression quality | 95% | 95% | focused 15/15 and full current suites pass; no API-owned durable change |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `89%`.
- Every critical criterion directly proven: `No`; `AC-006` and `AC-017` fail at package construction.
- Default 95% Pass target met: `No`.
- Confidence does not override the direct critical failure.

## Durable Coverage Changed

- Added: none.
- Updated: none.
- Removed: none.
- Proportional test-code review: `Not Applicable`; focused failure-origin review is required.

## Primary Execution Artifacts

| Artifact | Purpose |
| --- | --- |
| `api-e2e-evidence/api-rev-006/repository/API-VOICE-002-013-authority-reuse.json` | exact reuse authority |
| `api-e2e-evidence/api-rev-006/repository/*.log` | dependency/focused/full/clean-source results |
| `api-e2e-evidence/api-rev-006/environment/darwin-arm64-preflight-v2.json` | fresh controlled Functional Preflight 2 |
| `api-e2e-evidence/api-rev-006/inputs/materialization.log` | source-bound English/Chinese closed inputs |
| `api-e2e-evidence/api-rev-006/inputs/corpus-validation.log` | exact 49/200 corpus proof |
| `api-e2e-evidence/api-rev-006/english-darwin-arm64/create-native-build-environment.log` | direct API-F-002 authorization resolution |
| `api-e2e-evidence/api-rev-006/english-darwin-arm64/build-primary.log` | failed corrected canonical English build |
| `api-e2e-evidence/api-rev-006/english-darwin-arm64/API-VOICE-003-python-runtime-symlink-probe.log` | exact archive links/source mechanism |
| `api-e2e-evidence/api-rev-006/english-darwin-arm64/API-F-003-python-runtime-symlink-materialization-failure.json` | structured expected/observed/classification record |
| `api-e2e-evidence/api-rev-006/SHA256SUMS.txt` | retained evidence integrity |

## Cleanup

| Resource | Action | Result |
| --- | --- | --- |
| owned `caffeinate` PID 14888 | interrupted and reaped after failure retention | Pass; absent |
| package/build/provider/qualification processes | scanned after failure | none present |
| owned exact-source/input/corpus temp root | retained for focused review/rerun | `/private/tmp/autobyteus-voice-api-e2e-r6-20260803`; no shared/user data |
| user-created purge sudoers entry | not changed by API/E2E | remains available for the eventual rerun |
| tags/releases/publication | no action | untouched |

## Preliminary Classification And Routing

- Result: `Fail`.
- Prior finding: `API-F-002 — Resolved / Pass` at the actual corrected workflow boundary.
- New finding: `API-F-003`.
- Failing scenario / criteria: `API-VOICE-003`; `AC-006`, `AC-017`.
- Preliminary classification: `Local Fix / implementation defect` in locked Python runtime materialization.
- Expected: the exact authenticated Python archive is converted into the symlink-free hermetic runtime and the first archive is produced.
- Observed: the archive's nine relative symlinks reach `prune()` and are rejected by `regularFiles()`; no package exists.
- Recommended recipient: `code_reviewer` for focused failure-origin review.
- Prohibited alternatives retained: no input mutation, symlink-policy relaxation, alternate Python archive, unsandboxed build, provider/model/threshold substitution, or release action.

## Latest Authoritative Result

- **Result: `Fail`.**
- Final confidence: `89%`.
- `API-F-002`: directly resolved.
- `API-F-003`: open; exact English Python runtime construction rejects its authenticated upstream archive before package creation.
- Remaining proof after reviewed correction: both byte-identical packages, package verification/reproducibility, real 49/200 inference and quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance evidence, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.
