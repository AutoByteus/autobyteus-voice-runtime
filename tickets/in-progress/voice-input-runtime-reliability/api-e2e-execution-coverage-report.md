# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and referenced evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-019`, `CRR-026`, `CRR-027`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-012 / 12`.
- Reviewed source: `2e9399b214adbfe9d0cc245b256c152b2c0de7e4`.
- Prior result: `API-REV-011 — Fail / 98%` at `API-F-008` during Chinese native construction.
- Latest authoritative result: **`API-REV-012 — Fail / 98%` at `API-F-009` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: changed-byte authority/reuse decision -> clean exact-source dependency setup -> focused/full repository checks -> fresh actual-M1 Functional Preflight 2 -> current-source input materialization and exact 49/200 corpus validation -> outside-Seatbelt trusted environment creation -> canonical first Chinese construction under pinned network-denied Seatbelt -> focused locked-source/closed-tool analysis -> fail-closed stop and cleanup.
- Existing coverage decision: English-v2 authority and API-VOICE-013 bytes remain unchanged and reusable; prior profile evidence cannot enter a current QSet because its source/runner/provenance identities predate `2e9399b2`. Both profiles still require complete current-source reruns before QSet 2.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`. The production build directly resolved `API-F-008`, then failed because the exact locked llama.cpp Metal step requires bare `sed`, while Functional Preflight 2 and the closed trusted native tool directory omit `/usr/bin/sed`.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; execution used owned roots and did not target product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario | Requirements / Criteria | Surface / Mode | Result | Evidence |
| --- | --- | --- | --- | --- |
| `API-VOICE-001` | source integrity | clean detached exact source; focused/full suites | Pass | `api-rev-012/repository/` |
| `API-VOICE-002` / `013` | `AC-007`, `AC-009`, `AC-017` | exact authority/validator changed-byte continuity | Pass / Reused | authority-impact JSON; full repository log |
| shared current-host readiness | `AC-020` | actual M1 Functional Preflight 2 | Pass / `loaded-host` | all functional gates Pass; `68.22833333333332%` average idle |
| shared current-source inputs/corpora | `AC-006`, `AC-007`, `AC-009`, `AC-017` | exact recipe materialization and 49/200 WAV validators | Pass | `inputs/` |
| `API-VOICE-004` ranlib boundary | `AC-006`, `AC-017`, `AC-019` | exact Apple toolchain under network-denied Seatbelt | Pass; prior `API-F-008` resolved | `libggml-base.a` linked and target reported built |
| `API-VOICE-004` native construction | `AC-006`, `AC-017`, `AC-019` | locked llama.cpp Metal embedding through closed trusted PATH | **Fail — `API-F-009`** | at 6%, `/bin/sh: sed: command not found`; make exit 127 |
| remaining Chinese qualification | `AC-003`, `AC-008`, `AC-009`, `AC-011`, `AC-017` | second build/repro, 200 WAV, exact 30/30/100, lifecycle/resources | Not Tested after required construction Fail | no Chinese archive/runtime subject |
| current-source `API-VOICE-003` | `AC-003`, `AC-006`, `AC-009`, `AC-017`, `AC-023` | full English rebuild/requalification for same-source QSet | Not Tested after serial Chinese Fail | API-REV-010 remains historical only |
| `API-VOICE-011` / `012` | compliance/privacy/QSet/projection | serial exact current matrix | Not Tested after Fail | no complete same-source two-profile subject |
| `API-VOICE-005`–`010` | non-current targets | none | Deferred / Outside Current Matrix | approved scope |

## Repository Coverage Execution

| Command / Action | Result | Evidence |
| --- | --- | --- |
| exact `8680c6a9...2e9399b2` authority/runtime comparison | English-v2 authority/validator unchanged; provider/archive runtime unchanged; prior profile evidence not reusable for current QSet | `repository/API-VOICE-002-013-authority-impact.json` |
| `npm ci --ignore-scripts` | Pass, 8 packages, zero vulnerabilities | `repository/npm-ci.log` |
| `node --test tests/build/trusted-native-environment.test.mjs` | Pass, 8/8, zero skips | `repository/focused-trusted-native-environment.log` |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Pass: 77 top-level / 84 TAP Node; 7/7 Python plus compileall; all Go/source/schema/evidence checks | `repository/npm-run-check.log` |

## Validation Confidence Scorecard

| Category | Post-Repository | Final | New Evidence / Limitation |
| --- | ---: | ---: | --- |
| Requirement/acceptance proof | 85% | 95% | exact ranlib correction passes; required Chinese construction directly fails at the next closed-tool gate |
| Changed-boundary directness | 90% | 100% | exact reviewed source, real preflight, materializer, production builder, CMake/make/shell, and locked source executed |
| Cross-boundary realism | 75% | 97% | actual network-denied build reaches Metal generation; no archive/model/lifecycle subject exists after failure |
| Environment/configuration/fixture fidelity | 90% | 100% | actual M1 on AC, exact Go/CMake/Xcode/SDK/purge/Seatbelt, current inputs, exact corpora, exact closed PATH |
| Failure/lifecycle/recovery | 78% | 96% | deterministic production failure and exact source/tool-closure proof captured; downstream lifecycle cannot start |
| User/browser/desktop | N/A | N/A | runtime-only |
| Durable regression quality | 95% | 100% | focused/full suites pass with zero skips; no API/E2E-owned durable test code changed |

- Overall post-repository confidence: `86%` (six applicable-category rounded average).
- Overall final confidence: `98%` (six applicable-category rounded average).
- Critical criteria fully proven: `No`; `AC-006`, `AC-017`, and `AC-019` directly fail for required Chinese package construction.
- Default clean Pass target met: `No`; confidence cannot override a failing critical criterion.
- Confidence describes validation directness and fidelity, not product qualification success.

## Broader Validation Execution

### Authority And Current-Source Decision

- Exact English-v2 corpus, baseline, derivation, authority, supported reproduction owner, production validator, and API-VOICE-013 durable test bytes are unchanged from API-REV-011 source. Authority remains `Still Valid — Reusable`.
- Provider/archive/runtime code is unchanged; only ranlib/preflight/native-environment identity source and focused fixtures changed.
- Prior English profile evidence is not a current QSet subject because current QSet requires both profiles' Summary, runner, and provenance identities to bind `2e9399b2`. A full current-source English rerun remains required after Chinese construction succeeds.

### Shared Host, Inputs, And Corpora

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64.
- Functional Preflight 2: Pass on AC with low-power off, owned `caffeinate`, normal thermal/memory state, exact tools, exact `ranlib -> libtool`, Seatbelt canaries, and `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `loaded-host`; idle samples `66.43, 66.47, 68.41, 70.96, 66.65, 70.45`, average `68.22833333333332%`, no task-owned competing process. This is not controlled-performance evidence.
- Current-source materialization: English manifest SHA-256 `2b6a8d75e9d727951e8cf7d8bd4a7b69d4971e272ba9500051ebae36ec5781b1`; Chinese manifest SHA-256 `4c896afe9e75d665e57f95c1e0d71353aed3bcd98dcd58aba77cc6bcd573f03e`.
- Corpus validators: English 49/49 unique WAVs, manifest SHA-256 `03fe5e7ba88b4f84e0d18ec9444663a481168bb521c415bcc226e747e98deffd`; Chinese 200/200, manifest SHA-256 `f10e79f85842b153b461cb3c54309c0fdfcece54d0ec2b1219805309d5b9d787`.

### Chinese darwin-arm64 — `API-F-008` Resolved, `API-F-009` Failed

- The exact trusted environment recorded the Xcode invocation identity `/Applications/Xcode.app/.../usr/bin/ranlib -> libtool`, target SHA-256 `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`.
- Direct `API-F-008` resolution: canonical construction passed the former 5% failure, linked `libggml-base.a`, and emitted `Built target ggml-base`.
- Expected next behavior: the authenticated closed native tool directory contains every executable consumed by exact locked source so Metal embedding and native construction can continue.
- Observed: at 6%, locked `llama-cpp-source/ggml/src/ggml-metal/CMakeLists.txt` lines 45–46 invoke bare `sed` twice. The production environment sets PATH only to its closed tool directory, whose exact entries are `node`, `cmake`, `cc`, `c++`, `ar`, `ranlib`, `ld`, `libtool`, `make`, `sh`, and `tar`. It contains no `sed`; preflight also records no `/usr/bin/sed`. `/bin/sh` reported `sed: command not found`; make exited 127 and no archive was created.
- Actual host `/usr/bin/sed` is a root-owned executable at SHA-256 `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`, but it was not injected or used because production had not authenticated/bound it.
- Preliminary origin: bounded implementation defect in complete native build-tool discovery, authentication, schema binding, live verification, and closed-PATH materialization—not a sandbox, host, permission, input, corpus, provider/model, quality, resource, or performance failure.
- Stop policy: no PATH injection, `sed` override, source edit, build retry, unsandboxed build, fallback, provider/model/threshold substitution, or release action.

## Platform / Runtime And Desktop Decision

- Current target reached: Chinese darwin-arm64 production construction on the actual M1 Max; it failed before archive/runtime creation.
- Current-source English execution was not started after the serial Chinese failure.
- Other OS/architectures and `auto`: deferred, not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- All checkout/input/corpus/build/evidence roots were API/E2E-owned. No command targeted `~/.autobyteus` or desktop installation state.
- No package/provider qualification process started. Build processes exited with the recorded failure.
- Owned `caffeinate` PID `69481` was interrupted and reaped; no task-owned process remained.

## Durable Coverage Changed

None added, updated, or removed. This is a failure-origin review handoff, not a successful-test-code review handoff.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/environment/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/chinese-darwin-arm64/`
- Structured finding: `API-F-009-chinese-trusted-sed-closure-failure.json`.
- Focused analysis: `API-F-009-chinese-trusted-sed-closure-analysis.json`.

## Temporary Executable Probes

| Probe | Purpose | Result | Cleanup |
| --- | --- | --- | --- |
| exact authority/source comparison | decide API-VOICE-002/013 reuse and QSet applicability | authority reusable; prior profile QSet reuse rejected | read-only |
| actual Functional Preflight 2 | prove current M1 readiness and corrected ranlib capture | functional Pass; loaded-host observation | owned caffeinate reaped |
| current-source materializer and corpus validator | prove closed inputs and 49/200 exact WAV identities | Pass | owned roots retained |
| canonical network-denied Chinese build | recheck API-F-008 and continue until next gate | ranlib Pass; deterministic API-F-009 Fail | builder exited; evidence retained |
| locked-source/trusted-tool inventory | isolate missing command origin | bare `sed` required twice; closed PATH and preflight omit it | read-only |

## Cleanup

- Owned `caffeinate` PID `69481`: interrupted and reaped.
- Task-owned package/provider/qualification processes: none present.
- Exact-source checkout: clean at `2e9399b214adbfe9d0cc245b256c152b2c0de7e4`; retained with owned current-source inputs for correction rerun.
- User product state, unrelated processes, tags, releases, maintained-main, and publication: untouched.

## Preliminary Classification

- `API-F-009`: `Local Fix / implementation defect` in closed trusted native tool completeness. Exact locked source requires `sed`, but the production preflight/environment/schema/tool directory do not own that executable.
- Recommended correction owner after focused review: Implementation Engineer.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final confidence: `98%`.
- Default clean Pass target met: `No`; required Chinese package construction directly failed.
- Broader validation: `Required; executed through direct ranlib resolution and the critical first missing-sed native-build failure`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed correction: exact Chinese double construction/reproducibility/verification, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; then Qualification Set 2 and independently verified Branch Catalog Projection 2.
