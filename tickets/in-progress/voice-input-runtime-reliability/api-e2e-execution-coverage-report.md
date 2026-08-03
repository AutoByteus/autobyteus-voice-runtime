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
- Current revision/round: `API-REV-004 / 4`.
- Trigger: `CRR-013` Pass for `IR-011` at `23d766873fa1be357c657fab8203913fec09e65b`.
- Prior round: `API-REV-003 — Fail / 79%` at `API-F-001`.
- Latest authoritative result: `API-REV-004 — Blocked / 82%` at M1 host quiescence.

## Investigation And Execution Basis

- Investigation completed before execution: `Yes`.
- Plan followed: `Yes`; unchanged authority was confirmed, repository checks ran, then the mandatory production preflight ran first.
- Prior failure rechecked first: `Yes`; the actual production preflight now records `thermalNormal=true`, directly resolving `API-F-001`.
- Durable coverage decisions changed: `No`; no API/E2E-owned durable coverage changed.
- Teammate reroute required: `No`; this round is an environmental Blocked result requiring the user to quiet user-owned processes.
- Downstream deviation: input materialization/package work did not start because preflight is fail-closed.

## Compatibility / Legacy Scope Check

- Backward compatibility or legacy retention introduced: `No`.
- Approved persisted-data decision: `Not Affected`, followed without migration/fallback.
- Compatibility-only coverage added: `No`.

## Changed Boundary And Evidence Matrix

| Scenario | Boundary | Mode | Result | Evidence |
| --- | --- | --- | --- | --- |
| `API-VOICE-001` | current source/unit/contracts/evidence | repository | Pass | 60/60 Node, 7/7 Python plus compileall, all Go/source/schema/evidence checks |
| `API-VOICE-002` | exact English-v2 authority | exact-byte reuse check | Pass / Reused | `api-rev-004/repository/API-VOICE-002-013-authority-reuse.json` |
| `API-VOICE-003`/`004` shared preflight | actual M1 power/thermal/memory/quiescence/purge/tool gate | production CLI | Blocked | AC/low-power/thermal/memory/caffeinate pass; final idle samples average 69.638%, required >=80% |
| package portions of `003`/`004` | double build, real inference, lifecycle, 30/30/100 | actual packages | Not Tested after Blocked | preflight prerequisite absent |
| `API-VOICE-005`–`010` | non-arm64 profiles | none | Deferred / Outside Current Matrix | approved current-platform scope |
| `API-VOICE-011` | compliance/privacy/offline | exact package audit | Not Tested after Blocked | no packages |
| `API-VOICE-012` | QSet/branch projection/independent verification | aggregate CLI | Not Tested after Blocked | no profile Pass results |
| `API-VOICE-013` | production corpus-validator regression | durable | Pass / Reused | unchanged bytes; focused and full repository suites pass |

## Repository Coverage Execution

| Command | Configuration | Result | Evidence |
| --- | --- | --- | --- |
| `npm ci --ignore-scripts` | Node v22.23.1 | Pass | `api-e2e-evidence/api-rev-004/repository/npm-ci.log` |
| `node --test tests/release/darwin-thermal-state.test.mjs tests/release/trusted-baseline.test.mjs` | reviewed worktree | Pass 9/9 | `repository/focused-thermal-and-authority.log` |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | official Go 1.26.5 darwin/arm64 | Pass | `repository/npm-run-check.log` |

## Validation Confidence Scorecard

| Category | Post-Repository | Final | Final Evidence / Limitation |
| --- | --- | --- | --- |
| Requirement/acceptance proof | 82% | 82% | source/authority and prior defect resolution pass; packages remain unexecuted |
| Changed-boundary directness | 82% | 85% | actual production preflight directly confirms thermal fix and environmental block |
| Cross-boundary integration realism | 75% | 75% | native package/model integration not reached |
| Environment/configuration/identity fidelity | 85% | 85% | actual M1, AC, thermal, memory, purge and `caffeinate` are direct; host idle threshold fails before tool section |
| Failure/lifecycle/recovery evidence | 75% | 75% | fail-closed preflight works; package lifecycle not reached |
| User/browser/desktop-shell | N/A | N/A | runtime-only |
| Durable regression quality | 95% | 95% | focused 9/9 and full current suite pass |

- Overall post-repository confidence: `82%`.
- Overall final confidence: `82%` (applicable-category average rounded).
- Every critical criterion directly proven: `No`.
- Applicable categories below 90%: `Yes` — all except durable regression quality.
- Default 95% target met: `No`.

## Broader Validation Decision And Execution

- Decision/mode: `Blocked`; required actual M1 CLI/lifecycle/package qualification.
- Startup: retained API-REV-004 evidence -> repository checks -> start owned `caffeinate` -> invoke production preflight with exact Go/CMake -> wait full 15-minute quiescence window -> retain blocked result -> kill/reap owned `caffeinate`.
- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin/arm64.
- Successful prerequisites: AC connected, AC Low Power Mode off, corrected thermal parser reports normal, memory pressure normal, owned `caffeinate` active, exact noninteractive purge independently exits 0.
- Blocking condition: final six idle samples `73.94, 71.42, 69.93, 66.30, 67.73, 68.51`; computed average `69.638%`, below required `80%`.
- Major observed consumers after the run: Docker Desktop's virtualization VM and renderer, WindowServer, WeChat media, and AutoByteus renderer processes. These are user-owned; API/E2E did not stop them.
- No proxy/substitution: no reduced idle threshold, warm-cache proxy, provider/target/threshold change, or release action.

## Platform / Persisted Data

- Platform executed: actual darwin-arm64 M1 through production preflight.
- Runtime/tooling: Node v22.23.1, official Go 1.26.5 darwin/arm64, configured CMake 4.3.3.
- Persisted data: `Not Affected`; no user/product state read or changed.
- Desktop application: not exercised; desktop is outside scope.

## Durable Coverage Changed

- Added/updated/removed in API-REV-004: `No`.
- Proportional test review: `Not Applicable`.
- IR-011 thermal tests were upstream implementation coverage already accepted by `CRR-013`.

## Other Execution Artifacts

| Artifact | Purpose |
| --- | --- |
| `api-e2e-evidence/api-rev-004/repository/API-VOICE-002-013-authority-reuse.json` | exact reuse authority |
| `api-e2e-evidence/api-rev-004/repository/*.log` | dependency/focused/full repository results |
| `api-e2e-evidence/api-rev-004/environment/darwin-arm64-preflight-v1.json` | production blocked record |
| `api-e2e-evidence/api-rev-004/environment/darwin-arm64-preflight.log` | command/exit evidence |
| `api-e2e-evidence/api-rev-004/environment/API-VOICE-003-004-quiescence-block.json` | structured blocker/prior-failure resolution |
| `api-e2e-evidence/api-rev-004/environment/top-consumers-after-preflight.txt` | bounded process-name/CPU evidence |
| `api-e2e-evidence/api-rev-004/environment/SHA256SUMS.txt` | evidence integrity |

## Cleanup

| Resource | Action | Result |
| --- | --- | --- |
| owned `caffeinate` PID | killed and reaped on preflight non-pass | Pass; absent |
| package/build/model/session roots | none created | nothing to clean |
| user-owned Docker/VM/apps | untouched | preserved |
| shared study/upstream/code-review evidence | untouched | preserved |

## Preliminary Classification And Recipient

- Classification: `Blocked — environment dependency`.
- Exact user action: quit Docker Desktop/its VM and other CPU-heavy apps, keep AC connected, then confirm readiness for a fresh production preflight.
- Recipient: user request only; no teammate handoff while Blocked.

## Latest Authoritative Result

- Result: `Blocked`.
- Final validation confidence: `82%`.
- `API-F-001`: `Resolved` directly; production reports `thermalNormal=true`.
- Missing proof: complete English/Chinese package builds, real 49/200 inference, lifecycle/recovery, exact 30/30/100, compliance, QSet, and branch projection.
- Resume point: production preflight first after the host is quiet. No package, tag, publication, or release action ran.
