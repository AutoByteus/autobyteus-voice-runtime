# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements / Design: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`; `investigation-notes.md`; `design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, and referenced evidence.
- Upstream revisions/reviews: `SR-010`, `SR-011`, `ARCH-REV-012`, `IR-020`, `CRR-028`, `CRR-029`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-013 / 13`.
- Reviewed source: `eaa0855bf300ee7805048343d4d022a9b625af60`.
- Prior result: `API-REV-012 — Fail / 98%` at `API-F-009` during Chinese native construction.
- Latest authoritative result: **`API-REV-013 — Fail / 98%` at `API-F-010` in `API-VOICE-004`.**

## Investigation And Execution Basis

- Coverage investigation completed and updated before execution: `Yes`.
- Plan followed: exact changed-byte/authority decision -> clean exact-source dependency setup -> focused/full repository checks -> fresh actual-M1 Functional Preflight 2 -> current-source materialization and exact 49/200 corpus validation -> outside-Seatbelt trusted environment creation -> canonical Chinese construction under pinned network-denied Seatbelt -> focused Xcode C++ driver semantics probe -> fail-closed stop and cleanup.
- Existing coverage decision: English-v2 authority and API-VOICE-013 bytes remain unchanged/reusable. Prior profile evidence cannot enter a current QSet because its source/runner/provenance identities predate `eaa0855b`; both profiles still require complete current-source qualification before QSet 2.
- Durable API/E2E coverage changed: `No`.
- Stop/reroute: `Yes`. Production construction directly resolved `API-F-009`, then failed because the authenticated C++ compiler identity preserves only canonical `clang` and loses the `clang++` invocation semantics required for final C++ linkage.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior: `No`.
- Approved persisted-data decision: `Not Affected`; execution used owned roots and did not target product user state.
- Compatibility-only durable coverage added/retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario                             | Requirements / Criteria                          | Surface / Mode                                                    | Result                                      | Evidence                                                                       |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| `API-VOICE-001`                      | source integrity                                 | clean detached exact source; focused/full suites                  | Pass                                        | `api-rev-013/repository/`                                                      |
| `API-VOICE-002` / `013`              | `AC-007`, `AC-009`, `AC-017`                     | exact authority/validator changed-byte continuity                 | Pass / Reused                               | authority-impact JSON; full repository log                                     |
| shared current-host readiness        | `AC-020`                                         | actual M1 Functional Preflight 2                                  | Pass / `loaded-host`                        | all functional gates Pass; `68.98%` average idle                               |
| shared current-source inputs/corpora | `AC-006`, `AC-007`, `AC-009`, `AC-017`           | exact recipe materialization and 49/200 WAV validators            | Pass                                        | `inputs/`                                                                      |
| `API-VOICE-004` sed boundary         | `AC-006`, `AC-017`, `AC-019`                     | exact authenticated sed under network-denied Seatbelt             | Pass; prior `API-F-009` resolved            | both locked Metal transformations completed; native dependency graph compiled  |
| `API-VOICE-004` final C++ link       | `AC-006`, `AC-017`, `AC-019`                     | authenticated Xcode compiler identity through CMake               | **Fail — `API-F-010`**                      | final link uses canonical `clang` and fails with C++ runtime undefined symbols |
| remaining Chinese qualification      | `AC-003`, `AC-008`, `AC-009`, `AC-011`, `AC-017` | second build/repro, 200 WAV, exact 30/30/100, lifecycle/resources | Not Tested after required construction Fail | no Chinese archive/runtime subject                                             |
| current-source `API-VOICE-003`       | `AC-003`, `AC-006`, `AC-009`, `AC-017`, `AC-023` | full English rebuild/requalification for same-source QSet         | Not Tested after serial Chinese Fail        | API-REV-010 remains historical only                                            |
| `API-VOICE-011` / `012`              | compliance/privacy/QSet/projection               | serial exact current matrix                                       | Not Tested after Fail                       | no complete same-source two-profile subject                                    |
| `API-VOICE-005`–`010`                | non-current targets                              | none                                                              | Deferred / Outside Current Matrix           | approved scope                                                                 |

## Repository Coverage Execution

| Command / Action                                                       | Result                                                                                                                             | Evidence                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| exact `2e9399b2...eaa0855b` authority/runtime comparison               | English-v2 authority/validator unchanged; provider/archive runtime unchanged; prior profile evidence not reusable for current QSet | `repository/API-VOICE-002-013-authority-impact.json` |
| `npm ci --ignore-scripts`                                              | Pass, 8 packages, zero vulnerabilities                                                                                             | `repository/npm-ci.log`                              |
| focused trusted native/sed closure tests                               | Pass, 9/9, zero skips                                                                                                              | `repository/focused-trusted-native-sed-closure.log`  |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` | Pass: 78 top-level / 85 TAP Node; 7/7 Python plus compileall; all Go/source/schema/evidence checks                                 | `repository/npm-run-check.log`                       |

## Validation Confidence Scorecard

| Category                                   | Post-Repository | Final | New Evidence / Limitation                                                                                       |
| ------------------------------------------ | --------------: | ----: | --------------------------------------------------------------------------------------------------------------- |
| Requirement/acceptance proof               |             85% |   95% | exact sed correction passes; required Chinese construction directly fails at the next compiler gate             |
| Changed-boundary directness                |             90% |  100% | exact source, real preflight/materializer/builder/CMake/Xcode link and focused driver probe executed            |
| Cross-boundary realism                     |             75% |   98% | actual network-denied build reaches final executable link; no archive/model/lifecycle subject after failure     |
| Environment/configuration/fixture fidelity |             90% |  100% | actual M1 on AC, exact Go/CMake/Xcode/SDK/purge/Seatbelt, current inputs/corpora, closed PATH                   |
| Failure/lifecycle/recovery                 |             78% |   96% | deterministic production failure and exact alias-versus-canonical link proof; downstream lifecycle cannot start |
| User/browser/desktop                       |             N/A |   N/A | runtime-only                                                                                                    |
| Durable regression quality                 |             95% |  100% | focused/full suites pass with zero skips; no API/E2E-owned durable test code changed                            |

- Overall post-repository confidence: `86%` (six applicable-category rounded average).
- Overall final confidence: `98%` (six applicable-category rounded average).
- Critical criteria fully proven: `No`; `AC-006`, `AC-017`, and `AC-019` directly fail for required Chinese package construction.
- Default clean Pass target met: `No`; confidence cannot override a failing critical criterion.
- Confidence describes validation directness and fidelity, not product qualification success.

## Broader Validation Execution

### Authority And Current-Source Decision

- Exact English-v2 corpus, baseline, derivation, authority, supported reproduction owner, production validator, and API-VOICE-013 durable test bytes are unchanged from API-REV-012 source. Authority remains `Still Valid — Reusable`.
- Provider/archive/runtime code is unchanged; the reviewed source delta is confined to sed preflight/native-environment identity, schemas, and focused fixtures/tests.
- Prior English profile evidence is not a current QSet subject because QSet requires both profiles' Summary, runner, and provenance identities to bind `eaa0855b`. A full current-source English rerun remains required after Chinese construction succeeds.

### Shared Host, Inputs, And Corpora

- Host: MacBookPro18,4, Apple M1 Max, 64 GiB, darwin-arm64.
- Functional Preflight 2: Pass on AC with low-power off, owned `caffeinate`, normal thermal/memory state, exact tools, exact `ranlib -> libtool`, exact `/usr/bin/sed`, Seatbelt canaries, and `/usr/bin/sudo -n /usr/sbin/purge` capability.
- Performance classification: `loaded-host`; idle samples `74.44, 74.40, 68.17, 63.27, 71.75, 61.85`, average `68.98%`, no task-owned competing process. This is not controlled-performance evidence and did not block functional construction.
- Exact sed SHA-256: `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`.
- Current-source materialization: English provenance SHA-256 `9f6f80dc4b181fd799363be63c7bfcbc6f16007c369a420b3f46af8eca20fab8`, manifest SHA-256 `27b97841c3fb027e8e689acc7432c3e3f3b17c127ce68171ba69aa733bb5acd7`; Chinese provenance SHA-256 `2b4a32253267f2143ee9127936e854aa73355727d54435de8ee7372900e1b2b8`, manifest SHA-256 `40faaf2c3fcacc56e17a1a33db4c4d2cf163cb6a3d3e3dbd7968dc1b605e75c0`.
- Corpus validators: English 49/49 unique WAVs, manifest SHA-256 `03fe5e7ba88b4f84e0d18ec9444663a481168bb521c415bcc226e747e98deffd`; Chinese 200/200, manifest SHA-256 `f10e79f85842b153b461cb3c54309c0fdfcece54d0ec2b1219805309d5b9d787`.

### Chinese darwin-arm64 — `API-F-009` Resolved, `API-F-010` Failed

- The trusted environment recorded exact sed and ranlib identities. Canonical construction executed both locked Metal `sed` transformations, compiled the native dependency graph, and advanced to final linking. This directly resolves `API-F-009`; prior ranlib and input-path corrections also remain resolved.
- Expected next behavior: authenticated C++ compiler identity preserves the Xcode `clang++` invocation behavior through preflight, trusted environment, closed `c++` tool entry, explicit `CMAKE_CXX_COMPILER`, and resolved-CMake verification, allowing the final worker executable and archive to be produced.
- Observed: preflight `appleClangCxxExecutable.path` and native `cxxCompiler.path` are canonical `/Applications/Xcode.app/.../usr/bin/clang`. CMake therefore invokes canonical `clang` at the final C++ link, which exits `1` with a large undefined-symbol set including `std::__1`, `std::runtime_error`, `__cxa`, and `__gxx_personality_v0`. No archive was created.
- Direct focused proof: Xcode `/.../clang++` is a root-owned `clang++ -> clang` symlink. The alias and canonical target share SHA-256 `d5ba7be6de1bac17bfd018e1591711e69cb94d199a0ba763427c8b2d67c50697`. With the exact SDK and identical C++ source/arguments, alias invocation exits `0` and the program prints `ready`; canonical `clang` exits `1` with C++ runtime undefined symbols.
- Preliminary origin: bounded implementation defect in semantically required C++ driver invocation identity preservation, not a host, power, sudo, sandbox, sed, input, corpus, provider/model, threshold, resource, or performance issue.
- Stop policy: no `-lc++` injection, compiler/CMake override, generic symlink allowance, PATH substitution, source edit, retry, unsandboxed build, provider/model/threshold substitution, or release action.

## Platform / Runtime And Desktop Decision

- Current target reached: Chinese darwin-arm64 production construction on the actual M1 Max; it failed before archive/runtime creation.
- Current-source English execution was not started after the serial Chinese failure.
- Other OS/architectures and `auto`: deferred, not claimed.
- Browser/Electron: `N/A`; runtime-only. No desktop application was launched or modified.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- All checkout/input/corpus/build/evidence roots were API/E2E-owned. No command targeted `~/.autobyteus` or desktop installation state.
- No package/provider qualification process started. Build and focused-probe processes exited with the recorded results.
- Owned `caffeinate` PID `19897` was interrupted and reaped; no task-owned process remained.

## Durable Coverage Changed

None added, updated, or removed. This is a failure-origin review handoff, not a successful test-code review handoff.

## Evidence

- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/repository/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/environment/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/inputs/`
- `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/chinese-darwin-arm64/`
- Structured finding: `API-F-010-chinese-cxx-driver-alias-loss-failure.json`.
- Focused analysis: `API-F-010-chinese-cxx-driver-alias-analysis.json`.
- Focused runtime proof: `API-VOICE-004-cxx-driver-alias-semantics-probe.log`.

## Temporary Executable Probes

| Probe                                              | Purpose                                               | Result                                                | Cleanup                                    |
| -------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| exact authority/source comparison                  | decide API-VOICE-002/013 reuse and QSet applicability | authority reusable; prior profile QSet reuse rejected | read-only                                  |
| actual Functional Preflight 2                      | prove current M1 readiness and corrected sed capture  | functional Pass; loaded-host observation              | owned caffeinate reaped                    |
| current-source materializer and corpus validator   | prove closed inputs and exact 49/200 WAV identities   | Pass                                                  | owned roots retained                       |
| canonical network-denied Chinese build             | recheck API-F-009 and continue until next gate        | sed Pass; deterministic API-F-010 final-link Fail     | builder exited; evidence retained          |
| exact-SDK `clang++` alias versus canonical `clang` | isolate invocation-name semantics from binary bytes   | alias Pass/ready; canonical Fail/C++ runtime symbols  | temporary probe root removed; log retained |

## Cleanup

- Owned `caffeinate` PID `19897`: interrupted and reaped.
- Task-owned build/provider/qualification processes: none present.
- Exact-source checkout: clean at `eaa0855bf300ee7805048343d4d022a9b625af60`; retained with owned current-source inputs for correction rerun.
- User product state, unrelated processes, tags, releases, maintained-main, and publication: untouched.

## Preliminary Classification

- `API-F-010`: `Local Fix / implementation defect` in authenticated Xcode C++ driver identity. Generic canonicalization loses the required `clang++ -> clang` invocation name before closed-tool/CMake consumption.
- Recommended focused-review question: whether one strict specialized C++ identity must bind invocation path, exact link target/bytes, live topology, closed `c++` alias, explicit `CMAKE_CXX_COMPILER`, and resolved-CMake state without generic symlink support or explicit `-lc++`.
- Recommended correction owner after focused review: Implementation Engineer.

## Latest Authoritative Result

- Result: **`Fail`**.
- Final confidence: `98%`.
- Default clean Pass target met: `No`; required Chinese package construction directly failed.
- Broader validation: `Required; executed through direct sed resolution, final native C++ linkage, and exact alias/canonical semantics proof`.
- Required next recipient: `code_reviewer` for focused failure-origin review.
- Remaining after reviewed correction: exact Chinese double construction/reproducibility/verification, 200-WAV inference/quality/normalization, exact 30/30/100/lifecycle/resource/compliance evidence; current-source English double build/full qualification; then Qualification Set 2 and independently verified Branch Catalog Projection 2.
