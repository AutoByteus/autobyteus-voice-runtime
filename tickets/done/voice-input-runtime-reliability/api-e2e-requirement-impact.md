# API/E2E Requirement Impact — Current-Platform Qualification

## Record

- Impact ID: `API-RI-001`
- Recorded: `2026-08-03`
- Origin: explicit user direction after `API-REV-002`
- Current API/E2E result preserved as history: `API-REV-002 — Blocked / 78%`
- Classification: `Requirement Gap / Design Impact`
- Required owner: `solution_designer`

## User Confirmation — 2026-08-03

The user subsequently confirmed the intended split without ambiguity:

- the current task must qualify the two macOS Apple Silicon packages on the currently available M1 host;
- passing that complete current-platform qualification is sufficient for this task's qualification Pass;
- other platforms do not block this task;
- Linux and other platform qualification/support will be handled as separate later-stage tasks on the corresponding actual hosts.

Therefore the new solution should treat darwin-arm64 as the sole current-task qualification target. Existing source for later targets may be preserved if still coherent, but non-darwin-arm64 packages must not be claimed as executed, qualified, or released by this task.

## User Direction

The user requires complete qualification on the currently available primary platform, macOS Apple Silicon / M-chip, and accepts that unavailable platforms cannot be fully tested now. The user states that complete current-platform testing should be sufficient for pass qualification because approximately 80% of product users are on Mac M-chip systems.

This changes the accepted release gate. `SR-007` / `ARCH-REV-008` currently require a fail-closed eight-package matrix across four targets before API/E2E Pass. API/E2E cannot silently reinterpret that requirement.

## Required Current-Platform Scope

The new minimum qualifying matrix is the two `darwin-arm64` packages on the actual MacBookPro18,4 M1 Max / 64 GB host:

1. English: MLX Whisper Small FP16.
2. Chinese: Fun-ASR-Nano GGUF Q8.

“Completely tested” must retain the material current-platform gates unless the revised solution explicitly changes them:

- complete `SHA256SUMS.json`-closed inputs and byte-identical double builds;
- package/archive/launcher verification and provenance;
- real English and Chinese inference against the approved 49- and 200-clip corpora;
- quality and non-regression thresholds with no fallback or provider substitution;
- real lifecycle, recovery, malformed input/protocol, cancellation/termination, recognizer reuse, and no-orphan behavior;
- relocation, offline operation, read-only/no-mutation behavior, and contained audio decoding;
- 30 filesystem-cold trials, 30 warm-preparation trials, and 100 warm requests on the M1 Max with zero excluded failures;
- latency, RSS, extracted-size, notice/license, privacy, and reproducibility evidence.

`API-VOICE-002` and durable `API-VOICE-013` already pass and remain reusable unless their authoritative bytes change.

## Design Decision Required

The revised solution must explicitly decide the disposition of the other six package/target combinations:

- **Recommended:** restrict the presently qualified/releasable catalog and release evidence to the two `darwin-arm64` packages, and defer darwin-x64, linux-x64, and win32-x64 packages to later independently qualified work; or
- define another truthful non-release status that does not advertise unqualified packages as supported or qualified.

Leaving all eight packages advertised while allowing six to bypass qualification would contradict the immutable-package and fail-closed release contract.

The solution must update requirements, benchmark/release matrix, acceptance criteria, design, and supplemental contracts consistently. It must also state whether Delivery may release a darwin-arm64-only catalog or whether this is a current-platform validation pass without publication.

## Remaining Execution Dependencies On Current Host

The actual M1 Max host, Node 22.23.1, CMake 4.3.3, exact English/Chinese audio, preserved model/source assets, and authenticated Go 1.26.5 darwin-arm64 root are available. Complete current-platform execution still needs:

1. complete closed build-input trees for English/darwin-arm64 and Chinese/darwin-arm64;
2. authoritative license and offline audit records bound to exact package inventories;
3. configured power/background-load conditions; and
4. noninteractive permission for the pinned `sudo -n purge` cold-cache procedure, or a user-approved revised cold procedure in the new design.

API/E2E must not invent audit approval, bypass cold-reset evidence, substitute a provider, or relax thresholds.

## Downstream Re-entry

After a new solution revision and architecture-review Pass, implementation/source review must align any matrix or release-contract changes. API/E2E should then open the next revision, reuse `API-VOICE-002`/`API-VOICE-013` when their bytes are unchanged, and execute complete `darwin-arm64` qualification for English and Chinese as the new pass gate.

---

## API-RI-002 — Functional Qualification Becomes The Primary Acceptance Gate

### Record

- Recorded: `2026-08-03`
- Origin: explicit user direction after `API-REV-004`
- Historical result preserved: `API-REV-004 — Blocked / 82%` under the then-approved >=80% CPU-idle performance precondition
- Classification: `Requirement Gap / Design Impact`
- Required owner: `solution_designer`

### Explicit User Direction

The user directed API/E2E to test performance despite the host being below the existing 80% CPU-idle precondition and stated that the major acceptance goal is whether the current-platform functionality works. The user explicitly said not to treat the 80% value as a concern.

This prospectively changes the acceptance basis. It does not retroactively convert API-REV-004 to Pass and does not authorize API/E2E to bypass the current production preflight or edit evidence. The reviewed source currently fails closed before package construction when the quiescence gate is not met.

### Required Revised Acceptance Contract

The recommended revised contract should separate two truths:

1. **Functional current-platform qualification** is the blocking pass gate. It should still require exact closed inputs, byte-identical builds, package/archive/launcher verification, real English 49 and Chinese 200 inference, quality/non-regression, protocol/lifecycle/recovery, relocation, network denial, read-only/no-mutation, compliance/privacy, Qualification Set 1, and independently verified Branch Catalog Projection 1.
2. **Performance observation under the actual available host load** is recorded truthfully but is not a blocker merely because pre-run CPU idle is below 80%. The evidence must record the observed load and must not call an uncontrolled run a controlled reference benchmark.

The revised solution must explicitly decide whether exact 30 cold / 30 warm-preparation / 100 warm-request counts and latency/RSS thresholds remain blocking, become informational, or split into a later controlled-performance qualification. API/E2E should not infer that all performance criteria were removed solely from removal of the 80% quiescence concern.

### Design And Implementation Impact

- Separate package/build/functional readiness from controlled-performance-environment readiness. The current single production preflight hard-blocks all package work on quiescence.
- Preserve actual AC, thermal, memory-pressure, tool-identity, sandbox, and exact purge evidence unless the revised design explicitly changes them.
- Emit an explicit evidence classification such as `functional-qualification` versus `controlled-performance-qualification`; never present loaded-host observations as controlled reference numbers.
- Preserve fail-closed provider/model/corpus/quality/compliance/package and release-evidence gates. No provider, target, quality threshold, or release action is implicitly relaxed.
- Update requirements, current-platform qualification, benchmark protocol, schemas, qualification runner, aggregation rules, and workflow consistently before API/E2E resumes.

### Downstream Re-entry

Solution Designer should record the user's functional-first acceptance in a new solution revision and route it through Architecture Review. Implementation and Code Review must then provide a supported non-workaround execution path. API/E2E will open the next revision only after that path passes source review; it will not patch the preflight, manufacture a passing record, reduce the threshold ad hoc, or invoke package builders outside the reviewed contract.

---

## API-RI-003 — Local Test Ownership And GitHub Build/Release Boundary

### Record

- Recorded: `2026-08-09`
- Origin: explicit user direction after `API-REV-021`
- Historical result preserved: `API-REV-021 — Blocked / 80%`
- Classification: `Requirement Gap / Release-Pipeline Design Impact`
- Required owner: `solution_designer`

### Explicit User Direction

The user clarified the intended engineering boundary:

- API/E2E, integration, inference, corpus-quality, lifecycle, and performance testing is performed locally by the API/E2E engineer before release;
- GitHub Actions is used only for building/package construction and release work;
- GitHub Actions must not become a second product-test or performance-qualification environment;
- the project must not require purchasing a larger runner or provisioning a custom/self-hosted organization runner group merely to repeat tests that have already passed locally.

The user added that the GitHub pipeline may perform the checks intrinsically necessary to build and release safely, but not the full qualification suite.

### Current Conflict

The reviewed recovery workflow requires the nonexistent organization runner group `voice-runtime-recovery` with `self-hosted`, `macOS`, and `ARM64` labels. Run `31301948625` therefore failed before executing any step. This is a workflow policy conflict, not a product functionality failure and not a GitHub-hosted-runner outage.

The existing approved recovery path also couples hosted archive reconstruction/promotion to a managed locked environment. API/E2E cannot replace that authority with a standard GitHub-hosted runner or local fallback without a reviewed change.

### Required Revised Boundary

The new solution should separate these responsibilities explicitly:

1. **Local API/E2E qualification:** all provider/profile inference, 49/200 corpus checks, lifecycle/recovery, 30/30/100 observations, resource/performance evaluation, and qualification aggregation remain local and produce immutable evidence.
2. **GitHub build/release pipeline:** construct the release artifacts from authenticated inputs, verify build/release integrity and provenance, and perform release/promotion operations only. Hash, manifest, signature, reproducibility, and basic artifact-readability checks may remain where they are required to establish that the built bytes are exactly the intended release bytes; they must not be represented as a rerun of product qualification.
3. **Infrastructure policy:** no paid larger-runner dependency and no custom/self-hosted organization runner requirement. The design must either fit the build/release operation on an included GitHub-hosted runner or define another user-approved release construction path that does not require new paid or administrator-managed runner infrastructure.
4. **Evidence reuse:** GitHub build/release must consume and bind the already-approved local qualification authority rather than re-executing it.

### Immediate Routing

Stop retrying `recover-qualified-voice-archives.yml` under its current runner-group requirement. Preserve `API-REV-021` and run `31301948625` as truthful blocked history. Solution Designer must revise requirements, release-pipeline ownership, design, workflow boundary, admission/promotion authority, and acceptance criteria before implementation resumes. No tag, release, publication, or candidate promotion is authorized from the blocked workflow.
