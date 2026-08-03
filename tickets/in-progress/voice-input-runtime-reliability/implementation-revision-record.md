# Implementation Revision Record

The current code and `implementation-handoff.md` are authoritative. This record identifies the initial implementation baseline and will retain later implementation rounds if rework is requested.

## Revision Index

| Revision ID | Triggering Role / Report / Round                                   | Finding IDs                                             | Classification     | Related Revision IDs                                                                                                   | Result                                               |
| ----------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `IR-001`    | Architecture Reviewer / `design-review-report.md` / round 3        | `N/A`                                                   | `Initial Baseline` | `SR-001`, `SR-002`, `SR-003`; `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`; `CRR-*` N/A; `API-REV-*` N/A; `DR-*` N/A | `Implementation Complete — Ready for Code Review`    |
| `IR-002`    | Architecture Reviewer / `design-review-report.md` / round 7        | `AR-F-007`–`AR-F-010`; historical `CR-F-001`–`CR-F-006` | `Design Impact`    | `SR-004`–`SR-006`; `ARCH-REV-004`–`ARCH-REV-007`; `CRR-001`; `API-REV-*` N/A; `DR-*` N/A                               | `Implementation Complete — Ready for Code Review`    |
| `IR-003`    | Code Reviewer / `code-review-report.md` / `CRR-002`                | `CR-F-007`–`CR-F-013`                                   | `Local Fix`        | `SR-006`; `ARCH-REV-007`; `CRR-002`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-004`    | Code Reviewer / `code-review-report.md` / `CRR-003`                | Remaining `CR-F-011`                                    | `Local Fix`        | `SR-006`; `ARCH-REV-007`; `CRR-003`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-005`    | Code Reviewer / `code-review-report.md` / `CRR-004`                | Partial `CR-F-011`; `CR-F-014`                          | `Local Fix`        | `SR-006`; `ARCH-REV-007`; `CRR-004`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-006`    | Architecture Reviewer / `design-review-report.md` / `ARCH-REV-008` | `CR-F-015` from `CRR-006` / `API-VOICE-002`             | `Design Impact`    | `SR-007`; `ARCH-REV-008`; `CRR-006`; `API-REV-001`; `DR-*` N/A                                                         | `Implementation Complete — Ready for Code Re-review` |
| `IR-007`    | Code Reviewer / `code-review-report.md` / `CRR-007`                | `CR-F-016`                                              | `Local Fix`        | `SR-007`; `ARCH-REV-008`; `CRR-007`; `API-REV-001`; `DR-*` N/A                                                         | `Implementation Complete — Ready for Code Re-review` |
| `IR-008`    | Architecture Reviewer / `design-review-report.md` / round 10       | `API-RI-001`; resolved `AR-F-011`, `AR-F-012`           | `Design Impact`    | `SR-008`, `SR-009`; `ARCH-REV-009`, `ARCH-REV-010`; `CRR-008`; `API-REV-002`; `DR-*` N/A                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-009`    | Code Reviewer / `code-review-report.md` / `CRR-009`                | `CR-F-017`, `CR-F-018`                                  | `Local Fix`        | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-009`; `API-REV-002`; `DR-*` N/A                                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-010`    | Code Reviewer / `code-review-report.md` / `CRR-010`                | Remaining `CR-F-018`; `CR-F-019`                        | `Local Fix`        | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-010`; `API-REV-002`; `DR-*` N/A                                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-011`    | Code Reviewer / `code-review-report.md` / `CRR-012`                | `CR-F-020` / `API-F-001`                                | `Local Fix`        | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-011`, `CRR-012`; `API-REV-003`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |

## Revision Entries

### IR-001 — Self-contained verified voice-runtime provider baseline

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 3 / `ARCH-REV-003`
- Triggering finding IDs: `N/A — initial implementation; upstream AR-F-001 through AR-F-006 were resolved before implementation authorization`
- Classification: `Initial Baseline`
- Prior authoritative result: `N/A`
- Current authoritative result: `Implementation Complete — Ready for Code Review`
- Related solution revision IDs: `SR-001`, `SR-002`, `SR-003`
- Related architecture-review revision IDs: `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`
- Related code-review revision IDs: `N/A`
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Why this baseline or implementation revision is recorded: The reviewed runtime-only design is now implemented as a clean-cut Provider Session Configuration V1 / protocol 1 / manifest 3 provider with hermetic build, benchmark, package-proof, evidence, and release construction boundaries. This is the first implementation handoff.
- Approved behavior or requirement IDs affected: Current runtime portions of `BEH-002` through `BEH-010` and `BEH-012`; `R-002`, `R-004` through `R-011`, `R-014`; `AC-002` through `AC-011`, `AC-016`, `AC-017`. `BEH-001`, `BEH-011`, `R-001`, `R-003`, `R-012`, `R-013`, and desktop clauses remain future superrepo projection only.
- Implementation delta:
  - Added the sole strict `--session-config` startup decoder/verifier, immutable verified-session binding, CommonJS protocol worker, sherpa recognizer, WAV/no-speech gate, and deterministic normalizer.
  - Added canonical startup/protocol schemas and fixtures, manifest schema 3, runtime/model descriptors, pinned host/dependency/model metadata, exact lockfile, notices, and licenses.
  - Added separate SenseVoice improvement and sherpa Whisper preservation candidates, licensed-corpus metrics/runner, benchmark-only v0.3 adapter, reproducible build/package-smoke/evidence/manifest/release verification tooling, and all-target workflow.
  - Removed the Python workers/requirements/bootstrap, shell/cmd launchers, legacy build script, schema-2/protocol-0 production paths, and obsolete tests.
  - Did not edit desktop/superrepo source, define active-installation state, refresh maintained main, tag, or publish.
- Changed files or areas: `runtime/`, `startup/`, `protocol/`, `metadata/`, `benchmark/`, `scripts/`, `tests/`, `host/`, `licenses/`, `package.json`, `package-lock.json`, `THIRD_PARTY_NOTICES.md`, `README.md`, `.github/workflows/release-voice-runtime.yml`; implementation source commit `c24c03fde5784967b8d8394ec04de4d700584d47`.
- Local validation and result: `npm run check` passed 13 tests; 5 normalization fixtures passed; JSON/workflow parsing and diff/source-size guards passed; darwin-arm64 runtime/Sense archives repeated byte-identically; actual bundled SenseVoice and Whisper packaged smoke passed the narrow mechanical startup/transcription/no-speech/recovery/shutdown scenarios. No API/E2E, all-target, licensed-corpus, percentile, resource, license-approval, or publication sign-off is claimed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Licensed real corpus, applicable `AC-009`/`AC-016` model decision, 30-cold/100-warm M1 Max metrics, RSS/size, all four actual target packages, formal license review, maintained-main reconciliation, tag/publication, and published-digest evidence remain fail-closed downstream gates. The checked-in example evidence stays blocked.

### IR-002 — Replace withdrawn universal provider with reviewed profile packages

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 7 / `ARCH-REV-007` after Solution Designer `SR-004`–`SR-006`
- Triggering finding IDs: Resolved `AR-F-007`, `AR-F-008`, `AR-F-009`, `AR-F-010`; historical withdrawn-design review findings `CR-F-001`–`CR-F-006` reconciled in the replacement
- Classification: `Design Impact`
- Prior authoritative result: `IR-001` implementation and `CRR-001` were invalidated experimental evidence after `SR-003` / `ARCH-REV-003` withdrawal; source preservation only, not target authority
- Current authoritative result: `Implementation Complete — Ready for Code Review`
- Related solution revision IDs: `SR-004`, `SR-005`, `SR-006` (`SR-006` current; `SR-003` withdrawn)
- Related architecture-review revision IDs: `ARCH-REV-004`, `ARCH-REV-005`, `ARCH-REV-006`, `ARCH-REV-007`
- Related code-review revision IDs: `CRR-001` (historical withdrawn-design review evidence)
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Why this baseline or implementation revision is recorded: The prior Node/sherpa implementation was stopped and preserved after the user exposed a confounded backend-selection basis. Controlled evidence then produced a language-profile architecture, a target-native launcher, and an explicit archive contract. This round replaces the incompatible final tree without rewriting history and implements the current `SR-006` / `ARCH-REV-007` authority.
- Approved behavior or requirement IDs affected: `BEH-001`–`BEH-012`; `R-002`, `R-004`–`R-011`, `R-014`; `AC-002`–`AC-011`, `AC-013`, `AC-017`
- Implementation delta:
  - Replaced the withdrawn universal Node/CommonJS/sherpa production provider with profile-specific hermetic Python/MLX, Python/faster-whisper, and native Fun-ASR packages while keeping all engine choices behind one public package contract.
  - Added the fixed target-native Go launcher with strict embedded plan/config/root/control validation, isolated private invocation, POSIX `execve`, Windows Job/process-group supervision, exact exit propagation, and source/toolchain/plan provenance.
  - Added Catalog 3, Provider Archive 1 canonical construction and safe extraction, strict package/session/protocol/audio/normalization/release schemas, fixtures, full manifest closure, modes, build locks, and independent byte-rebuild proof.
  - Added bounded worker/reference-client lifecycle, persistent recognizers, direct PCM WAV readers, deterministic shared Simplified normalization, symmetric scoring, privacy-safe metrics, actual-package conformance probes, and clean-next-start behavior.
  - Promoted the complete 191-record checksummed selection evidence, exact rejected/selected candidate history, strict corpus rights/identity validation, raw/baseline/result/source/package binding, threshold recomputation, eight-package catalog gate, and pre-tag qualification/publish sequencing.
  - Removed Node/sherpa/SenseVoice universal production source, old schema/protocol/metadata/build/release paths, live bootstrap/install/download logic, alternate commands, and legacy production notices. Historical commits/review artifacts remain unchanged as evidence.
  - Did not edit desktop/superrepo/shared runtime source, alter persisted desktop state, reset/rewrite history, change historical tags, publish, or deploy.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `.gitattributes`, `.gitignore`, `README.md`, `THIRD_PARTY_NOTICES.json`, `benchmark/`, `build/`, `contracts/`, `evidence/selection-study/`, `go.mod`, `go.sum`, `launcher/`, `licenses/`, `packaging/`, `providers/`, `release/`, `tests/`, `tooling/`; removed withdrawn `runtime/`, `startup/`, `protocol/`, `metadata/`, and `scripts/` production trees. Source commits: `ce9d4b4553947b876c8783e18a621edfcac03555`, `402525786f3f556e355e8292611720c02c634332`.
- Local validation and result: Pinned-toolchain `npm run check` passed 18/18 Node, 5/5 Python, and all Go tests with no skips; Go race/vet/gofmt passed; authored Prettier checks passed; four Go launcher targets cross-built; exact pinned native Fun-ASR source compiled twice byte-identically with Werror/path-leak/startup-rejection checks; 191/191 selection checksums passed; npm audit reported 0 vulnerabilities; diff/source-size/legacy checks passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Approved build-input/model/corpus trees were unavailable for complete archive assembly or inference. All eight actual-target packages, licensed corpus and consent/redistribution proof, MLX/faster/Fun-ASR execution, M1 Max 30/100 timing/RSS/size, notices/licenses, Windows behavior, maintained-main integration, pre-tag evidence, tag/publication, and published-byte identity remain fail-closed API/E2E/Delivery gates. `auto` is omitted unless separately qualified.

### IR-003 — Close runtime edge cases and qualification trust gaps

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-002`
- Triggering finding IDs: `CR-F-007`, `CR-F-008`, `CR-F-009`, `CR-F-010`, `CR-F-011`, `CR-F-012`, `CR-F-013`
- Classification: `Local Fix`
- Prior authoritative result: `CRR-002` / `Fail — Local Fix` against `IR-002`
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-006`
- Related architecture-review revision IDs: `ARCH-REV-007`
- Related code-review revision IDs: `CRR-002`
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: Source review found seven bounded correctness and evidence-authentication defects in the otherwise accepted SR-006 ownership model. This round corrects those existing owners without changing providers, thresholds, supported runtime paths, or architecture.
- Approved behavior or requirement IDs affected: `BEH-002`–`BEH-011`; `R-005`, `R-008`, `R-014`; `AC-003`, `AC-006`, `AC-008`–`AC-010`, `AC-013`, `AC-017`; `MP-CR-001`–`MP-CR-007`.
- Implementation delta:
  - Made reference-client stdout decoding stateful, fatal, byte-bounded, and termination-validated; added every-byte UTF-8/delimiter and truncated-stream tests.
  - Corrected native Han/punctuation spacing and introduced a native result policy so only audio validation yields no-speech; added executable shared-fixture/result-policy coverage and matching Python outcome tests.
  - Centralized maintained-main reachability with the release commit as the ancestor of freshly fetched maintained main and bound assembly, verification, and workflow publication to that proof.
  - Added repository-owned exact corpus/baseline/trust records and verified external baseline bytes, provider/model/configuration, promoted result/quality identities, per-clip counts, and aggregate before comparison.
  - Added exact Go executable locks, target wheel locks, offline Python archive/wheel materialization, clean exact-commit native worktree verification, and a repository build-lock-set digest carried through build/qualification/release evidence.
  - Replaced free-form cache claims with a repository-owned executed darwin-arm64 cold-cache procedure, 30 cold/30 warm-preparation/100 warm-request raw samples, digest binding, and release-side recomputation/count gates.
  - Extended the release evidence schema/bindings and workflow inputs for the new trusted identities; no threshold, fallback, alternate runtime path, tag, or publication was added.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `README.md`, `benchmark/baseline/`, `benchmark/cache-procedure.mjs`, `benchmark/cache-procedures/`, `benchmark/provider-process-session.mjs`, `benchmark/run-profile-qualification.mjs`, `build/locked-inputs.*`, `build/native/`, `build/python/`, `build/python-wheel-locks/`, `build/repository-lock-set.mjs`, `contracts/release/`, `providers/chinese-funasr/`, `providers/python/`, `release/evidence/`, and focused tests under `tests/`; source commit `4c1286997e6ae33a8a86448fa04de0f56e28eb36`.
- Local validation and result: Final pinned-toolchain `npm run check` passed 27/27 Node, 7/7 Python plus compileall, all Go tests, source-size, and legacy-residue checks. Go race/vet/gofmt checks passed. The C++20 native normalization/result-policy test compiled with `-Wall -Wextra -Werror` against UTF8PROC and all shared fixtures, then passed. `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Complete locked inputs were unavailable for actual eight-package construction and inference. The exact Python materializer and darwin filesystem-cold procedure therefore remain unit/contract checked rather than accepted as real-package evidence. Licensed corpus/provenance/consent/redistribution, target-native package execution, M1 Max 30/30/100 latency/RSS/size, notices/licenses, Windows behavior, maintained-main integration, pre-tag evidence, tag/publication, and published-byte equality remain fail-closed API/E2E/Delivery gates. `auto` remains omitted.

### IR-004 — Authenticate and isolate complete Go toolchain roots

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-003`
- Triggering finding IDs: Remaining `CR-F-011`
- Classification: `Local Fix`
- Prior authoritative result: `CRR-003` / `Fail — Local Fix` against `IR-003`; six other CRR-002 findings were verified resolved
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-006`
- Related architecture-review revision IDs: `ARCH-REV-007`
- Related code-review revision IDs: `CRR-003`
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: IR-003 authenticated only the `go` front executable while compilation and archive tooling executed sibling compiler, linker, and standard-library assets and could inherit an alternate `GOROOT`. This round makes the existing Go lock owner authoritative for the complete invoked root and subprocess environment.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-010`; `R-005`, `R-014`; `AC-006`, `AC-017`; `MP-CR-005`.
- Implementation delta:
  - Added complete repository-owned file/directory manifests for all four supported Go 1.26.5 roots. Each manifest covers 15,026 regular files and is bound to the exact official archive digest, front executable digest, canonical tree digest, file count, and total byte count in `build/locked-inputs.json`.
  - Tightened `verifyGoToolchain()` to derive the root only from the exact `VOICE_GO` `bin/go[.exe]` path, authenticate the repository manifest, reject root/entry symlinks and non-regular entries, and fail on missing, extra, resized, or changed root content.
  - Added `trustedGoEnvironment()` and routed launcher compilation, archive construction/extraction, qualification, workflow environment verification, and local Go checks through it. Inherited Go/toolchain/target/CGO/external-tool overrides fail; the invoked process receives the verified `GOROOT`, fixed target, local toolchain, disabled GOENV/workspace, and deterministic feature baseline.
  - Added the verified archive/root manifest/tree/count/size to launcher provenance, build reports, qualification summaries, release evidence schema/projection, and release-side repository lock recomputation.
  - Added negative coverage for an exact official front binary with an empty sibling root, missing and modified sibling tools, inherited alternate `GOROOT`, all-target manifest/archive consistency, provenance fields, and workflow verification without direct untrusted Go invocation.
- Changed files or areas: `.gitattributes`, `.github/workflows/release-voice-runtime.yml`, `README.md`, `benchmark/run-profile-qualification.mjs`, `build/go-toolchain-manifests/`, `build/locked-inputs.*`, `build/package-{assembler,verifier}.mjs`, `build/verify-go-toolchain.mjs`, `contracts/release/release-qualification-evidence-v1.schema.json`, `package.json`, `packaging/launcher/compile-launcher.mjs`, `release/evidence/{assemble,bindings}.mjs`, `tooling/check-go.mjs`, and focused build/launcher/release tests; source commit `bb28720c24dcb931dd434857632963c5c72ac207`.
- Local validation and result: Final pinned-root `npm run check` passed 32/32 Node tests, 7/7 Python plus compileall, all Go tests through the verified-root wrapper, source-size, and legacy-residue guards. The exact current darwin-arm64 root verified all 15,026 files against its repository manifest and compiled the launcher twice byte-identically. Go race/vet/fmt and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: The other three complete manifests were derived from exact official archives matching the prior locked digests but were not exercised on their target operating systems during implementation. All eight target-native package builds/runs, licensed corpus/provenance/consent/redistribution, M1 Max 30/30/100 latency/RSS/size, notices/licenses, Windows behavior, maintained-main integration, pre-tag evidence, tag/publication, and published-byte equality remain fail-closed API/E2E/Delivery gates. `auto` remains omitted.

### IR-005 — Close external Go cache and cross-target mapping gaps

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-004`
- Triggering finding IDs: Partial `CR-F-011`; new `CR-F-014`
- Classification: `Local Fix`
- Prior authoritative result: `CRR-004` / `Fail — Local Fix` against `IR-004`; complete-root authentication was accepted and the remaining earlier findings stayed resolved
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-006`
- Related architecture-review revision IDs: `ARCH-REV-007`
- Related code-review revision IDs: `CRR-004`
- Related API/E2E revision IDs: `N/A`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: Go 1.26.5 can execute a non-empty inherited `GOCACHEPROG`, leaving an external unrecorded cache input despite the complete-root proof. The two CLI owners also compared Go's `amd64`/`windows` output to Node's `x64`/`win32` names, blocking six required jobs. This round closes both defects inside the existing toolchain owner.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-010`; `R-005`, `R-014`; `AC-006`, `AC-017`; `MP-CR-005`.
- Implementation delta:
  - Added `GOCACHEPROG` to the case-insensitive rejected inherited Go override set and explicitly set it empty in every trusted subprocess environment.
  - Added one authoritative four-target mapping for internal/Node and Go platform/architecture names. `verifyGoToolchain()`, `trustedGoEnvironment()`, `expectedGoVersionOutput()`, the workflow verifier, and launcher compiler now share it.
  - Added all-four-tuple expectations plus a normal CLI negative test that supplies a marker `GOCACHEPROG`, asserts rejection, and proves the marker never executed.
  - Preserved the complete-root manifests, strict provenance propagation, provider choices, package contracts, and every qualification threshold unchanged.
- Changed files or areas: `README.md`, `build/locked-inputs.mjs`, `build/verify-go-toolchain.mjs`, `packaging/launcher/compile-launcher.mjs`, and `tests/build/locked-inputs.test.mjs`; source commit `7bd5db4201b48e75ce92eaab9bf769e7ed4035e2`.
- Local validation and result: Final pinned-root `npm run check` passed 34/34 Node, 7/7 Python plus compileall, all Go tests through the verified-root wrapper, source-size, and legacy guards. The exact official darwin-x64 archive/root verified all 15,026 files and its x64 executable returned the accepted mapped `go version go1.26.5 darwin/amd64` identity. Go race/vet/gofmt and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Linux-x64 and win32-x64 tuple behavior is deterministically covered but not actually executed on those operating systems during implementation. All eight target-native package builds/runs, licensed corpus/provenance/consent/redistribution, M1 Max 30/30/100 latency/RSS/size, notices/licenses, Windows behavior, maintained-main integration, pre-tag evidence, tag/publication, and published-byte equality remain fail-closed API/E2E/Delivery gates. `auto` remains omitted.

### IR-006 — Replace duplicate-counted English final evidence with authorized v2

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 8 / `ARCH-REV-008`, following Code Reviewer `CRR-006` and API/E2E `API-REV-001`
- Triggering finding IDs: `CR-F-015`, originating from `API-VOICE-002`
- Classification: `Design Impact`
- Prior authoritative result: `CRR-006` / `Fail — Design Impact` against `IR-005`; `API-REV-001` stopped at the duplicate final English corpus/baseline prerequisite
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-007`
- Related architecture-review revision IDs: `ARCH-REV-008`
- Related code-review revision IDs: `CRR-006`
- Related API/E2E revision IDs: `API-REV-001`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: API/E2E proved that the prior checked-in final English corpus and baseline contained 50 rows but only 49 unique identities. Selection of the corrected final evidence required upstream authority, so implementation stopped until `SR-007` supplied an exact deterministic 49-identity projection and `ARCH-REV-008` passed it. This round implements only that reviewed correction and its source/trust invariants.
- Approved behavior or requirement IDs affected: `BEH-005`, `BEH-007`; `R-006`; `AC-007`, `AC-009`, `AC-017`.
- Implementation delta:
  - Copied the exact approved derivation script, authority, projected raw/quality evidence, English v2 corpus, and English v2 baseline into their reviewed runtime paths. The final corpus is 49 unique identities at SHA-256 `03fe5e7ba88b4f84e0d18ec9444663a481168bb521c415bcc226e747e98deffd`; the baseline is 70 errors / 969 words at SHA-256 `c52613457644700e18d0caf4e1d1a32a7a00c679968866b06be4305ce8b58dba`.
  - Removed the invalid final `english-v1` corpus/baseline files and replaced only the English record in `trusted-baselines-v1.json`; preserved the Chinese record and original historical selection evidence byte-for-byte.
  - Added an English preservation authority owner that anchors the reviewed authority/trusted-record digests, verifies all four immutable sources, the exact derivation script, and every projected/final output, and binds the catalog record before English baseline use.
  - Added source verification that reruns the exact approved Python derivation in isolation and byte-compares corpus, projected raw, projected quality, baseline, trusted record, and authority outputs.
  - Added unique one-to-one corpus/baseline cardinality/order checks and raw/quality identity alignment. The existing real `validateCorpus()` remains ordered before baseline trust, package extraction, and provider inference.
  - Updated the release workflow to use `english-v2.json` for English while leaving Chinese v1 selection unchanged. No provider/model/threshold/package/lifecycle/protocol/release-order behavior changed.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `benchmark/baseline/english-preservation-authority.mjs`, `benchmark/baseline/trusted-baseline.mjs`, `evidence/selection-study/derived/english-preservation-unique-v2/`, `package.json`, `release/evidence/baselines/`, `release/evidence/qualification-corpora/`, `release/evidence/trusted-baselines-v1.json`, `tests/release/trusted-baseline.test.mjs`, and `tooling/verify-english-preservation.mjs`; source commit `5b24f1e2e94bf0d1238feee76575edadae25c0c9`.
- Local validation and result: Pinned-toolchain `npm run check` passed 37/37 Node tests, 7/7 Python tests plus compileall, all Go tests, source/legacy guards, and byte-identical v2 derivation reproduction. Exact comparisons matched all reviewed target bytes; the unchanged original selection-study checksum list passed 191/191; all repository JSON parsed; focused Prettier and `git diff --check` passed. Negative tests reject duplicate corpus/baseline identity and changed immutable source bytes.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: This implementation round did not use the licensed WAV tree or run API/E2E/package inference. After source Pass, `api_e2e_engineer` must begin `API-REV-002` with `API-VOICE-002` against the exact 49 audio bytes, then run the remaining target/package/resource/license/release-aggregation scenarios. Maintained-main integration, tag, publication, and published-byte equality remain Delivery-owned fail-closed gates. `auto` remains omitted.

### IR-007 — Assert the sixth English reproduction output

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-007`
- Triggering finding IDs: `CR-F-016`
- Classification: `Local Fix`
- Prior authoritative result: `CRR-007` / `Fail — Local Fix` against `IR-006`; `CR-F-015` accepted as resolved in source
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-007`
- Related architecture-review revision IDs: `ARCH-REV-008`
- Related code-review revision IDs: `CRR-007`
- Related API/E2E revision IDs: `API-REV-001`; `API-REV-002` remains unopened
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: The approved derivation produced six current JSON outputs, but the reproduction loop iterated the five records inside `authority.outputs` and never compared generated `authority.json` before reporting byte-identical success. The current bytes were correct; this round completes the missing durable assertion in the existing owner.
- Approved behavior or requirement IDs affected: `BEH-005`; `AC-007`; SR-007 source/output reproduction contract; `MP-CR-010`.
- Implementation delta:
  - Extracted the complete generated-output comparison into `assertReproducedEnglishOutputs()` and made `reproduceAuthority()` call it before success.
  - Added checked-in `authority.json` as the explicit sixth comparison after corpus, promoted raw result, promoted quality, baseline, and trusted record.
  - Added a focused negative regression that supplies exact matching bytes for the other five outputs, changes only generated `authority.json`, and requires an authority-specific derivation-drift failure.
  - Preserved every evidence byte, derivation rule, provider/model, threshold, runtime/package/protocol path, and release ordering unchanged.
- Changed files or areas: `benchmark/baseline/english-preservation-authority.mjs` and `tests/release/trusted-baseline.test.mjs`; source commit `983dc07abdb68309c67bea8955554ec6f9064fd2`.
- Local validation and result: Pinned-toolchain `npm run check` passed 38/38 Node tests, 7/7 Python tests plus compileall, all Go tests, source/legacy guards, and the all-six byte-identical English derivation reproduction. The focused authority-only negative test passed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: No API/E2E or package inference was run. Only after source Pass may `api_e2e_engineer` open `API-REV-002`, rerun `API-VOICE-002` against the exact 49 WAVs, and continue the remaining target/package/resource/license/release-aggregation scenarios. Maintained-main integration, tag, publication, and published-byte equality remain Delivery-owned fail-closed gates. `auto` remains omitted.

### IR-008 — Implement the exact current-platform qualification and release lifecycle

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 10 / `ARCH-REV-010`, following API/E2E `API-RI-001` and Solution Designer `SR-008`/`SR-009`
- Triggering finding IDs: `API-RI-001`; resolved architecture findings `AR-F-011`, `AR-F-012`
- Classification: `Design Impact`
- Prior authoritative result: `CRR-008` passed `IR-007`; `API-REV-002` then exposed a current-platform requirement/design impact, and `ARCH-REV-009` failed the first design revision until the branch-catalog and release-evidence lifecycle contradictions were corrected
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-008`, `SR-009`
- Related architecture-review revision IDs: `ARCH-REV-009`, `ARCH-REV-010`
- Related code-review revision IDs: `CRR-008`
- Related API/E2E revision IDs: `API-REV-002`, `API-RI-001`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: The approved current release changed from an unexecutable eight-package gate to a complete two-package darwin-arm64 matrix, then required explicit branch-only catalog proof and an acyclic expected/observed/action release lifecycle. This round implements that cumulative reviewed design without reconstructing the accepted runtime source or weakening any package, quality, lifecycle, or evidence invariant.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-005`, `BEH-007`–`BEH-010`; `R-005`, `R-008`, `R-011`, `R-014`, `R-017`–`R-019`; `AC-006`, `AC-007`, `AC-010`, `AC-013`, `AC-017`, `AC-019`–`AC-022`.
- Implementation delta:
  - Added the sole exact two-entry Current Release Matrix and removed the obsolete current eight-target matrix/verifier path while preserving generic deferred-target source outside current authority.
  - Added reviewed English/Chinese input recipes, fresh immutable materialization, exact cache/Git/repository provenance, complete input manifest/mode closure, and package/reproducibility bindings.
  - Added repository-owned license policy/notices and generated exact compliance; added strict Apple M1 Max power/quiescence/toolchain/Seatbelt/purge preflight and exact 30 cold / 30 warm-preparation / 100 warm qualification construction and raw recomputation.
  - Added Qualification Set 1, shared release-neutral Catalog Entry Identity, exact two-archive set validation, branch projection, and a separate independently implemented projection verifier that always records pass/fail.
  - Replaced the release evidence/catalog path with the one-way integrated QSet -> expected Release Evidence -> Catalog 3 -> Pre-Tag Manifest chain; added separate always-recorded published-byte verification and fail-only quarantine that deletes only the GitHub Release object/assets and proves the tag unchanged.
  - Updated the current-only serialized workflow, documentation, source contracts, and focused regressions. Preserved durable API-VOICE-013 coverage and every accepted provider/runtime/evidence behavior.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `README.md`, `benchmark/` preflight/sandbox/qualification owners, `build/` recipes/materializer/build bindings, `contracts/{build,catalog,compliance,qualification,release}/`, `licenses/`, `release/` matrix/compliance/QSet/projection/pre-tag/post-publication owners, and focused `tests/release/`; source commits `c3b6153e69710aa12f8b512d33ca4e9116665f06` and `d1aed4b0a69d517f881b1f2c3c86be1be93b7580`.
- Local validation and result: Verified-root `npm run check` passed 48/48 Node, 7/7 Python plus compileall, all Go, strict schemas/source guards, and six-output English reproduction. Go race/vet/gofmt passed; 191/191 selection checksums passed; 202 repository JSON files parsed; focused authored Prettier and `git diff --check` passed. No downstream environment or package-execution result is claimed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Actual closed-cache materialization, two byte-identical packages, M1 preflight/purge, real English 49 and Chinese 200 inference, exact 30/30/100 latency/RSS/size/lifecycle/offline/no-mutation/compliance proof, Qualification Set/branch projection evidence, and API classification remain API/E2E-owned. Maintained-main refresh/integration, complete repeated qualification, explicit finalization, tag/publication, published verification, quarantine, and evidence retention remain Delivery-owned. x64/`auto` remain deferred and unsupported.

### IR-009 — Retain every qualification attempt and bind the actual native build

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-009`, with mechanism evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-evidence/CRR-009-native-build-environment-probe.md`
- Triggering finding IDs: `CR-F-017`, `CR-F-018`
- Classification: `Local Fix`
- Prior authoritative result: `CRR-009` / `Fail — Local Fix` against `IR-008`; the exact two-entry matrix, branch projection, acyclic pre-tag/post-publication lifecycle, English-v2 correction, providers, protocol, and thresholds were accepted
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-008`, `SR-009`
- Related architecture-review revision IDs: `ARCH-REV-010`
- Related code-review revision IDs: `CRR-009`
- Related API/E2E revision IDs: `API-REV-002`, `API-RI-001`; execution remains paused until source Pass
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: IR-008 kept qualification samples in memory until the pass path and let a normal timeout/process-loss/malformed/write failure bypass raw/performance/summary/QSet persistence and workflow retention. It also recorded default tool identities separately while native/Python builders inherited flags, CMake selectors, and PATH tools. The reviewed contracts already define the correct fail-closed behavior, so this round closes both gaps without changing the current release design.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-008`, `BEH-010`; `R-018`; `AC-003`–`AC-006`, `AC-017`, `AC-020`; `MP-CR-011`, `MP-CR-012`.
- Implementation delta:
  - Added an atomic strict-schema qualification-attempt ledger written before each cache/start/request attempt and updated exactly once with success or a stable timeout/process-loss/malformed-frame/write/provider/cache classification. The runner now bounds termination, retains all prior samples, and writes partial raw/index/performance/attempt/summary evidence on fail or block without replay, exclusion, or threshold change.
  - Extended Qualification Set 1 with strict pass/fail/blocked profile variants, actual attempt/failure/timeout counts, raw/index/performance digests, and a derived top-level decision. A non-pass set is written before its CLI exits nonzero; downstream branch/catalog/release owners still require `pass`. Workflow profile and aggregate-audit uploads now run under `always()` so started-attempt failure artifacts are retained.
  - Added one preflight-bound `native-build-environment-v1.json` owner and focused identity/CMake helpers. Package assembly rejects inherited compiler/linker/native/CMake/SDK overrides case-insensitively, uses a closed symlink-only PATH of exact authenticated Node/CMake/Apple tools/Make/shell/tar, supplies explicit empty external flags and CMake compiler/linker/SDK/generator/build configuration, and verifies the resolved CMake cache before compilation.
  - Routed MLX, faster-whisper, Fun-ASR, Python extraction/install, and launcher subprocesses through the trusted environment. Build reports, package verification, reproducibility proofs, qualification summaries/QSet, and release bindings now carry the environment digest.
  - Extracted qualification package/evidence owners and native identity/CMake helpers to preserve responsibility boundaries and source-size guardrails. No alternate runtime, fallback, provider/model/threshold, evidence byte, matrix, or release-order path was added.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `README.md`, `benchmark/{darwin-arm64-runner-preflight,run-profile-qualification,qualification-attempts,profile-qualification-evidence,qualification-package}.mjs`, `build/` package/build-environment/profile-builder owners, qualification/build/release schemas, release qualification/performance/binding owners, and focused build/release tests; source commit `bd20adae1e4dec647b2837d9c209bb28a35cd4b5`.
- Local validation and result: final pinned-root `npm run check` passed 55/55 Node tests, 7/7 Python plus compileall, all Go/source/schema/evidence checks. Verified-root Go race/vet/gofmt passed; all 191 original selection checksums passed; 204 repository JSON files parsed; focused Prettier and `git diff --check` passed. New negatives cover durable started-timeout/failure evidence and non-pass projection, inherited flags/selectors, extra/changed PATH tools, and mismatched resolved CMake state.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: implementation did not run the actual M1 preflight, materialize either current package, compile native Fun-ASR through the new M1 environment, execute licensed corpus inference, collect 30/30/100/RSS/size evidence, or open another API/E2E round. After source Pass, API/E2E must validate both real packages, a retained injected failure, Qualification Set, and Branch Catalog Projection. Maintained-main integration, repeated qualification, tag/publication, published-byte verification, and quarantine remain Delivery-owned. x64/`auto` remain deferred and unsupported.

### IR-010 — Canonicalize configured tools and identify execute-only sudo

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; `CRR-010`, with mechanism evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-evidence/CRR-010-preflight-build-entry-probe.md`
- Triggering finding IDs: remaining `CR-F-018`; new `CR-F-019`. `CR-F-017` is accepted resolved.
- Classification: `Local Fix`
- Prior authoritative result: `CRR-010` / `Fail — Local Fix` against `IR-009`; started-attempt retention and non-pass projection were accepted, while two normal reference-host entry mechanisms remained blocked
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-008`, `SR-009`
- Related architecture-review revision IDs: `ARCH-REV-010`
- Related code-review revision IDs: `CRR-010`
- Related API/E2E revision IDs: `API-REV-002`, `API-RI-001`; execution remains paused until source Pass
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: preflight correctly canonicalized the standard Homebrew CMake symlink, but package assembly compared the caller's lexical alias to the canonical recorded path. Separately, preflight attempted to content-read execute-only `/usr/bin/sudo`, which a correct non-root M1 runner cannot do, before testing the approved noninteractive purge capability. Both were bounded implementation entry defects under the existing exact-tool/preflight contract.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-008`, `BEH-010`; `R-018`; `AC-006`, `AC-017`, `AC-020`; `MP-CR-012` and CRR-010's supported actual-host entry premise.
- Implementation delta:
  - Added one shared canonical executable-path primitive and used it in preflight capture, trusted identity verification, and configured CMake comparison. The production environment owner now accepts a symlink only when it resolves to the exact preflight-authenticated target bytes.
  - Changed readable required-command records from ambiguous configured-path digests to explicit canonical `{path, sha256}` identities. This also makes the standard `/usr/bin/tar -> bsdtar` alias reach the authenticated tar target used by Python extraction instead of being rejected as a symlink.
  - Added a focused execute-only system-command identity owner for pinned `/usr/bin/sudo`. It never opens the file: it binds exact canonical path, root uid/gid, mode `4511`, device, inode, size, modification/change timestamps, and successful `sudo -V` stdout/stderr digests. Passing-preflight consumption live-recomputes the identity.
  - Bound the separate exact `/usr/bin/sudo -n /usr/sbin/purge` success record to the captured sudo identity digest. Missing/mutated identity or missing capability remains fail-closed; no sudoers editing, prompt, privilege expansion, or alternate cold procedure was introduced.
  - Added a production-owner CMake-symlink regression and a real non-root reference-host regression proving `/usr/bin/sudo` returns `EACCES` on read while the new production identity capture/verification succeeds and rejects changed identity data.
- Changed files or areas: `benchmark/darwin-arm64-{runner-preflight,preflight-contract}.mjs`, new `benchmark/system-command-identity.mjs`, `build/{native-tool-identities,trusted-native-environment}.mjs`, `contracts/qualification/darwin-arm64-preflight-v1.schema.json`, `README.md`, and focused build/release tests; source commit `b7342bc8e06d587bfe640faa4209c62ac2f4bae9`.
- Local validation and result: final pinned-root `npm run check` passed 57/57 Node tests, 7/7 Python plus compileall, all Go/source/schema/evidence checks. The new tests exercised the production CMake owner with a real symlink and actual non-root execute-only `/usr/bin/sudo` permissions/probe. Verified-root Go race/vet/gofmt passed; 191/191 selection checksums passed; 204 JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: the runner account still lacks approved noninteractive purge permission and the host was not reserved/quiescent, so implementation did not run the complete M1 preflight, materialize/build packages, execute licensed corpus inference, or collect 30/30/100/RSS/size evidence. After source Pass, API/E2E must exercise those fail-closed gates. Maintained-main integration, repeated qualification, tag/publication, published-byte verification, and quarantine remain Delivery-owned. x64/`auto` remain deferred and unsupported.

### IR-011 — Parse the actual M1 thermal state fail closed

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-012`, with origin evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-evidence/CRR-012-api-f-001-origin.md`
- Triggering finding IDs: `CR-F-020`, mapped from `API-REV-003` / `API-F-001`; earlier `CR-F-017`–`CR-F-019` remain resolved
- Classification: `Local Fix`
- Prior authoritative result: `CRR-011 Pass` against `IR-010` was withdrawn after valid actual-host execution exposed the preflight defect; `CRR-012` / `Fail — Local Fix` is the current source authority
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`
- Related solution revision IDs: `SR-008`, `SR-009`
- Related architecture-review revision IDs: `ARCH-REV-010`
- Related code-review revision IDs: `CRR-011` historical/withdrawn Pass, `CRR-012` current Local Fix
- Related API/E2E revision IDs: `API-REV-003`, `API-F-001`; prior `API-REV-002`, `API-RI-001`
- Related delivery revision IDs: `N/A`
- Why this implementation revision is recorded: The production M1 preflight searched the bare word `warning`, so the actual healthy `pmset -g therm` phrases “No thermal warning...” and “No performance warning...” were interpreted as an affirmative warning and blocked both current packages. The existing preflight boundary and reviewed gates remain correct; only thermal-state interpretation required correction.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-008`; `AC-020`; `DS-010`; `MP-CR-014`.
- Implementation delta:
  - Added one focused Darwin thermal-state parser that accepts only the established exact three-line no-warning output as `normal`, recognizes explicit thermal/performance/CPU-limit warning shapes as `warning`, and returns `unrecognized` for all other or malformed input.
  - Replaced the inline bare-word regex with the parser; production sets `thermalNormal=true` only for `normal`, so both `warning` and `unrecognized` retain the reviewed fail-closed `runner-power-or-pressure` behavior.
  - Copied the API-REV-003 actual healthy output byte-identically into a durable fixture and added focused production-parser coverage for healthy, multiple affirmative-warning, and empty/vague/partial/non-string negative cases.
  - Preserved AC, low-power, caffeinate, memory-pressure, quiescence, exact tool/command identity, Seatbelt, sudo/purge, package, trial, provider/model, threshold, matrix, catalog, and release-order gates unchanged. Did not add a source workaround for Battery Power or missing noninteractive purge permission.
- Changed files or areas: `benchmark/darwin-arm64-runner-preflight.mjs`, new `benchmark/darwin-thermal-state.mjs`, `tests/fixtures/pmset-therm/healthy.txt`, and `tests/release/darwin-thermal-state.test.mjs`; source commit `23d766873fa1be357c657fab8203913fec09e65b`.
- Local validation and result: pinned verified-root `npm run check` passed 60/60 Node tests, 7/7 Python tests plus compileall, all Go/source/schema/evidence checks, and six-output English-v2 reproduction. Focused parser coverage passed 3/3; durable fixture and API-REV-003 capture are byte-identical at SHA-256 `96de6076213225f787270bff80efd2011e0ad142953c37697dc547f77d302892`. Verified-root Go race/vet/gofmt passed; 191/191 selection checksums passed; 207/207 repository JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`
- Remaining limitations or risks: Implementation did not run API/E2E or repeat the actual M1 preflight. After source Pass, the API runner still requires AC connection and exact least-privilege noninteractive purge permission before the preflight can pass. Both package builds, licensed 49/200-corpus inference, exact 30/30/100 resources, lifecycle/offline/no-mutation/privacy/compliance, QSet, and branch projection remain API/E2E work. Maintained-main integration, repeated qualification, tag/publication, published verification, and quarantine remain Delivery-owned; x64/`auto` remain deferred.
