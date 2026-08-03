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
- Current revision/round: `API-REV-005 / 5`.
- Trigger: `CRR-015` Pass for `IR-013` at reviewed source `628bef9d9b1f40f263cb1f41e711649b8ca7dfe6`, against `SR-010`/`SR-011` and `ARCH-REV-012`.
- Prior round: `API-REV-004 — Blocked / 82%` at the former CPU-idle functional gate.
- Latest authoritative result: **`API-REV-005 — Fail / 87%` at `API-F-002`**.

## Investigation And Execution Basis

- Investigation completed and updated before execution: `Yes`.
- Prior blocker rechecked first: `Yes`. Functional Preflight 2 passed on the actual M1 with all functional prerequisites true. The six samples averaged `75.17166666666667%`, correctly classified `loaded-host`; this did not block work.
- Plan followed: `Yes`. Exact authority reuse and repository checks ran; an owned exact-source checkout, cache, two closed input trees, and exact corpora were prepared; the production preflight passed; then the first canonical network-denied package build ran.
- Durable coverage decisions changed: `No`; no API/E2E-owned repository-resident coverage was added, updated, or removed.
- Failure stop rule followed: `Yes`. No sandbox, identity, provider, model, threshold, build, or release workaround was used after the first required package build failed.

## Compatibility / Legacy / Persisted Data Check

- Backward compatibility or legacy retention introduced: `No`.
- Approved persisted-data decision: `Not Affected`; work stayed under the assigned worktree and owned `/private/tmp/autobyteus-voice-api-e2e-r5-20260803` roots.
- `~/.autobyteus`, desktop installation state, shared product state, tags, and public release state: not read or mutated by this validation.
- Compatibility-only coverage added: `No`.

## Changed Boundary And Evidence Matrix

| Scenario | Boundary | Mode | Result | Evidence |
| --- | --- | --- | --- | --- |
| `API-VOICE-001` | current source/unit/contracts/evidence | repository | Pass | focused 10/10; full 66/66 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |
| `API-VOICE-002` | exact English-v2 authority | exact-byte reuse plus real corpus staging | Pass / Reused | unchanged authority bytes; exact 49 unique WAVs pass production `validateCorpus()` |
| `API-VOICE-003` preflight/input/corpus | actual M1 and English prerequisites | production CLI/materializer | Pass | Functional Preflight 2; exact English closed tree; exact 49 WAVs |
| `API-VOICE-003` package construction | reviewed Seatbelt-wrapped package assembler | production workflow command | **Fail — `API-F-002`** | package assembler throws `spawn EPERM` while live-verifying `/usr/bin/sudo -V` from inside Seatbelt; no archive produced |
| remaining `API-VOICE-003` | second build/repro, package/runtime/inference/lifecycle/30/30/100 | actual package | Not Tested after Fail | first mandatory archive absent |
| `API-VOICE-004` prerequisites | Chinese closed input/corpus | production materializer/validator | Pass | exact Chinese closed tree; exact 200 unique WAVs |
| package portion of `API-VOICE-004` | Chinese archive/runtime/inference/lifecycle/30/30/100 | actual package | Not Tested after Fail | shared canonical build-entry defect stopped the serial matrix |
| `API-VOICE-005`–`010` | non-arm64 profiles | none | Deferred / Outside Current Matrix | approved darwin-arm64-only scope |
| `API-VOICE-011` | compliance/privacy/offline | exact package audit | Not Tested after Fail | no package archive |
| `API-VOICE-012` | QSet 2/projection 2/independent verification | aggregate CLI | Not Tested after Fail | no two passing profile subjects |
| `API-VOICE-013` | production corpus-validator regression | durable | Pass / Reused | unchanged bytes; focused and full suites pass |

## Repository Coverage Execution

| Command | Configuration | Result | Evidence |
| --- | --- | --- | --- |
| exact authority/test byte comparison | `23d7668...628bef9` plus worktree SHA-256 | Pass | `api-rev-005/repository/API-VOICE-002-013-authority-reuse.json` |
| `npm ci --ignore-scripts` | Node v22.23.1 | Pass | `repository/npm-ci.log` |
| focused thermal/functional-retention/trusted-baseline tests | reviewed worktree | Pass 10/10 | `repository/focused-functional-and-authority.log` |
| exact-Go `npm run check` | official verified Go 1.26.5 darwin/arm64 | Pass | `repository/npm-run-check.log`; 66/66 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |

## Broader Validation Execution

### Actual host and Functional Preflight 2

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin/arm64.
- Functional result: Pass.
- AC power, AC Low Power Mode off, owned `caffeinate`, exact healthy thermal state, normal memory pressure, exact tool identities, sandbox canary, and exact `/usr/bin/sudo -n /usr/sbin/purge`: all Pass.
- Load evidence: samples `79.60, 80.40, 77.59, 74.14, 74.50, 64.80`; average `75.17166666666667%`; classification `loaded-host`; task-owned competing process `false`.
- Acceptance consequence: the result correctly continued. No 80% minimum blocked functionality, and no performance result was mislabeled controlled.

### Exact inputs and corpora

- Closed cache: all 35 recipe objects present and hash/size verified; exact clean Fun-ASR, llama.cpp, and utf8proc revisions verified.
- English materialization: Pass; provenance SHA-256 `377d0dfbda89357620e33d51783254ef6094ad8df60a9358beaadbfa63aa1d6a`.
- Chinese materialization: Pass; provenance SHA-256 `a1e31eead4d6f9f7eabba3175da02104582900e2ee7ff4e2bb5b4434a1af9442`.
- English corpus: 49 clips, byte-identical manifest, unique ID/path/audio hashes, all WAV hashes match, production validator Pass.
- Chinese corpus: 200 clips, byte-identical manifest, unique ID/path/audio hashes, all WAV hashes match, production validator Pass.

### `API-F-002` — canonical build entry cannot execute

Expected command shape:

```text
/usr/bin/sandbox-exec -f benchmark/sandbox/darwin-arm64-network-denied-v1.sb \
  node build/package-assembler.mjs --profile english --target darwin-arm64 ...
```

Observed:

```text
Error: spawn EPERM
... verifyPinnedSudoIdentity()
... capturePinnedSudoIdentity()
... execFile(/usr/bin/sudo, [-V])
```

Mechanism evidence:

1. Functional Preflight 2 executes `/usr/bin/sudo -V` and exact `sudo -n /usr/sbin/purge` outside the build sandbox; both pass.
2. The workflow then places `package-assembler.mjs` inside the pinned network-denied Seatbelt profile.
3. `package-assembler.mjs` calls `createTrustedNativeBuildEnvironment()`; its preflight consumer calls `verifyPinnedSudoIdentity()` and live-spawns the setuid `/usr/bin/sudo -V` binary from inside Seatbelt.
4. A focused direct probe under the same profile exits `71`: `sandbox-exec: execvp() of '/usr/bin/sudo' failed: Operation not permitted`. The exact Node child-process probe throws `spawn EPERM`.
5. The same `/usr/bin/sudo -V` probe outside Seatbelt exits `0` with the expected preflight digests.

This is not the former CPU-idle rule, not missing purge permission, and not a user-host readiness block. It is preliminary `Local Fix / implementation defect` evidence at the exact reviewed workflow boundary. No archive, provider process, inference attempt, or performance attempt started.

## Validation Confidence Scorecard

| Category | Post-Repository | Final | Final Evidence / Limitation |
| --- | ---: | ---: | --- |
| Requirement and acceptance-criteria proof | 85% | 85% | preflight/input/corpus requirements are direct; `AC-006`/`AC-017` package construction fails and later criteria are absent |
| Changed-boundary execution directness | 85% | 85% | exact production workflow command directly reproduces the defect; real package/provider boundary is not reached |
| Cross-boundary integration realism and mock gap | 75% | 82% | real host, exact inputs and actual build entry are used; archive/inference/runtime integration remains absent |
| Environment/configuration/identity/fixture fidelity | 85% | 95% | exact M1/tool/power/sandbox/purge, clean reviewed source, closed inputs, and exact corpora are direct |
| Failure/edge/lifecycle/recovery evidence | 78% | 80% | the build fails closed with no partial archive/process; package lifecycle/recovery is unexecuted |
| User/browser/desktop-shell | N/A | N/A | runtime-only |
| Durable regression quality | 95% | 95% | focused 10/10 and full current suites pass; no API-owned durable change |

- Overall post-repository confidence: `84%`.
- Overall final confidence: `87%` (six-category simple average rounded).
- Every critical criterion directly proven: `No`; `AC-006` and `AC-017` fail at package construction.
- Applicable categories below 90%: `Yes`.
- Default 95% Pass target met: `No`.
- Confidence does not override the direct critical failure.

## Durable Coverage Changed

- Added: none.
- Updated: none.
- Removed: none.
- Proportional test-code review: `Not Applicable` for this revision; focused failure-origin review is required instead.

## Primary Execution Artifacts

| Artifact | Purpose |
| --- | --- |
| `api-e2e-evidence/api-rev-005/repository/API-VOICE-002-013-authority-reuse.json` | exact reuse authority |
| `api-e2e-evidence/api-rev-005/repository/*.log` | dependency, focused, full, and clean reviewed-checkout results |
| `api-e2e-evidence/api-rev-005/environment/darwin-arm64-preflight-v2.json` | passing Functional Preflight 2 and loaded-host evidence |
| `api-e2e-evidence/api-rev-005/inputs/cache-provisioning.log` | exact 35-object cache closure |
| `api-e2e-evidence/api-rev-005/inputs/materialization.log` | exact English/Chinese materialization |
| `api-e2e-evidence/api-rev-005/inputs/corpus-staging.json` and validator logs | exact 49/200 WAV proof |
| `api-e2e-evidence/api-rev-005/english-darwin-arm64/build-primary.log` | failed exact canonical build command |
| `api-e2e-evidence/api-rev-005/english-darwin-arm64/API-VOICE-003-sandbox-sudo-entry-probe.log` | outside/inside Seatbelt focused mechanism reproduction |
| `api-e2e-evidence/api-rev-005/english-darwin-arm64/API-F-002-package-construction-sandbox-sudo-failure.json` | structured expected/observed/classification record |
| `api-e2e-evidence/api-rev-005/SHA256SUMS.txt` | retained evidence integrity |

## Cleanup

| Resource | Action | Result |
| --- | --- | --- |
| owned `caffeinate` PID 53582 | interrupted and reaped after failure retention | Pass; absent |
| package/build/provider/qualification processes | scanned after failure | none present |
| owned exact-source/input/corpus temp root | retained for focused review/rerun | `/private/tmp/autobyteus-voice-api-e2e-r5-20260803`; no shared/user data |
| preserved selection-study sources | read/copy only | untouched |
| user-created purge sudoers entry | not changed by API/E2E | remains user-owned; can be removed after this ticket no longer needs qualification |
| tags/releases/publication | no action | untouched |

## Preliminary Classification And Routing

- Result: `Fail`.
- Finding: `API-F-002`.
- Failing scenario / criteria: `API-VOICE-003`; `AC-006`, `AC-017`.
- Preliminary classification: `Local Fix / implementation defect` in the actual workflow/build-entry integration.
- Expected: a passing preflight is consumable by the same canonical network-denied package build.
- Observed: the build re-executes `/usr/bin/sudo -V` inside Seatbelt and fails `EPERM` before creating an archive.
- Recommended recipient: `code_reviewer` for focused failure-origin review and owner confirmation.
- Prohibited alternatives retained: no unsandboxed build, no skipped live identity verification, no fabricated preflight, no provider/model/threshold substitution, and no release action.

## Latest Authoritative Result

- **Result: `Fail`.**
- Final confidence: `87%`.
- Prior CPU-idle blocker: resolved prospectively; this host correctly continued as `loaded-host`.
- New failure: `API-F-002`, exact package construction under the canonical Seatbelt command.
- Remaining proof after reviewed correction: both byte-identical packages, package verification/reproducibility, real 49/200 inference and quality, lifecycle/recovery/offline/read-only/no-mutation, exact 30/30/100 resource/performance observations, compliance/privacy, Qualification Set 2, Branch Catalog Projection 2, and independent verification.
