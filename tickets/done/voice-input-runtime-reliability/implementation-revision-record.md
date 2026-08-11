# Implementation Revision Record

The current code and `implementation-handoff.md` are authoritative. This record identifies the initial implementation baseline and will retain later implementation rounds if rework is requested.

## Revision Index

| Revision ID | Triggering Role / Report / Round                                   | Finding IDs                                                 | Classification        | Related Revision IDs                                                                                                   | Result                                               |
| ----------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `IR-001`    | Architecture Reviewer / `design-review-report.md` / round 3        | `N/A`                                                       | `Initial Baseline`    | `SR-001`, `SR-002`, `SR-003`; `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`; `CRR-*` N/A; `API-REV-*` N/A; `DR-*` N/A | `Implementation Complete — Ready for Code Review`    |
| `IR-002`    | Architecture Reviewer / `design-review-report.md` / round 7        | `AR-F-007`–`AR-F-010`; historical `CR-F-001`–`CR-F-006`     | `Design Impact`       | `SR-004`–`SR-006`; `ARCH-REV-004`–`ARCH-REV-007`; `CRR-001`; `API-REV-*` N/A; `DR-*` N/A                               | `Implementation Complete — Ready for Code Review`    |
| `IR-003`    | Code Reviewer / `code-review-report.md` / `CRR-002`                | `CR-F-007`–`CR-F-013`                                       | `Local Fix`           | `SR-006`; `ARCH-REV-007`; `CRR-002`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-004`    | Code Reviewer / `code-review-report.md` / `CRR-003`                | Remaining `CR-F-011`                                        | `Local Fix`           | `SR-006`; `ARCH-REV-007`; `CRR-003`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-005`    | Code Reviewer / `code-review-report.md` / `CRR-004`                | Partial `CR-F-011`; `CR-F-014`                              | `Local Fix`           | `SR-006`; `ARCH-REV-007`; `CRR-004`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |
| `IR-006`    | Architecture Reviewer / `design-review-report.md` / `ARCH-REV-008` | `CR-F-015` from `CRR-006` / `API-VOICE-002`                 | `Design Impact`       | `SR-007`; `ARCH-REV-008`; `CRR-006`; `API-REV-001`; `DR-*` N/A                                                         | `Implementation Complete — Ready for Code Re-review` |
| `IR-007`    | Code Reviewer / `code-review-report.md` / `CRR-007`                | `CR-F-016`                                                  | `Local Fix`           | `SR-007`; `ARCH-REV-008`; `CRR-007`; `API-REV-001`; `DR-*` N/A                                                         | `Implementation Complete — Ready for Code Re-review` |
| `IR-008`    | Architecture Reviewer / `design-review-report.md` / round 10       | `API-RI-001`; resolved `AR-F-011`, `AR-F-012`               | `Design Impact`       | `SR-008`, `SR-009`; `ARCH-REV-009`, `ARCH-REV-010`; `CRR-008`; `API-REV-002`; `DR-*` N/A                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-009`    | Code Reviewer / `code-review-report.md` / `CRR-009`                | `CR-F-017`, `CR-F-018`                                      | `Local Fix`           | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-009`; `API-REV-002`; `DR-*` N/A                                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-010`    | Code Reviewer / `code-review-report.md` / `CRR-010`                | Remaining `CR-F-018`; `CR-F-019`                            | `Local Fix`           | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-010`; `API-REV-002`; `DR-*` N/A                                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-011`    | Code Reviewer / `code-review-report.md` / `CRR-012`                | `CR-F-020` / `API-F-001`                                    | `Local Fix`           | `SR-008`, `SR-009`; `ARCH-REV-010`; `CRR-011`, `CRR-012`; `API-REV-003`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-012`    | Architecture Reviewer / `design-review-report.md` / round 12       | `API-RI-002`; resolved `AR-F-013`                           | `Design Impact`       | `SR-010`, `SR-011`; `ARCH-REV-011`, `ARCH-REV-012`; `CRR-013`; `API-REV-004`; `DR-*` N/A                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-013`    | Code Reviewer / `code-review-report.md` / `CRR-014`                | `CR-F-021`                                                  | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-014`; `API-REV-004`; `DR-*` N/A                                               | `Implementation Complete — Ready for Code Re-review` |
| `IR-014`    | Code Reviewer / `code-review-report.md` / `CRR-016`                | `CR-F-022` / `API-F-002`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-015`, `CRR-016`; `API-REV-005`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-015`    | Code Reviewer / `code-review-report.md` / `CRR-018`                | `CR-F-023` / `API-F-003`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-017`, `CRR-018`; `API-REV-006`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-016`    | Code Reviewer / `code-review-report.md` / `CRR-020`                | `CR-F-024` / `API-F-004`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-019`, `CRR-020`; `API-REV-008`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-017`    | Code Reviewer / `code-review-report.md` / `CRR-022`                | `CR-F-025` / `API-F-005`; `CR-F-026` / `API-F-006`          | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-021`, `CRR-022`; `API-REV-009`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-018`    | Code Reviewer / `code-review-report.md` / `CRR-024`                | `CR-F-027` / `API-F-007`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-023`, `CRR-024`; `API-REV-010`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-019`    | Code Reviewer / `code-review-report.md` / `CRR-026`                | `CR-F-028` / `API-F-008`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-025`, `CRR-026`; `API-REV-011`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-020`    | Code Reviewer / `code-review-report.md` / `CRR-028`                | `CR-F-029` / `API-F-009`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-027`, `CRR-028`; `API-REV-012`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-021`    | Code Reviewer / `code-review-report.md` / `CRR-030`                | `CR-F-030` / `API-F-010`                                    | `Local Fix`           | `SR-010`, `SR-011`; `ARCH-REV-012`; `CRR-029`, `CRR-030`; `API-REV-013`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-022`    | Architecture Reviewer / `design-review-report.md` / round 13       | `CR-F-031` / `API-F-011`; `CR-F-032` / `API-F-012`          | `Design Impact`       | `SR-012`; `ARCH-REV-013`; `CRR-031`, `CRR-032`; `API-REV-014`; `DR-*` N/A                                              | `Implementation Complete — Ready for Code Re-review` |
| `IR-023`    | Architecture Reviewer / `design-review-report.md` / round 15       | `CR-F-033` / `API-F-013`; resolved `AR-F-014`               | `Design Impact`       | `SR-013`, `SR-014`; `ARCH-REV-014`, `ARCH-REV-015`; `CRR-033`, `CRR-034`; `API-REV-015`; `DR-*` N/A                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-024`    | Code Reviewer / `code-review-report.md` / `CRR-036`                | `CR-F-034` / `API-F-014`                                    | `Local Fix`           | `SR-013`, `SR-014`; `ARCH-REV-015`; `CRR-035`, `CRR-036`; `API-REV-016`; `DR-*` N/A                                    | `Implementation Complete — Ready for Code Re-review` |
| `IR-025`    | Delivery Engineer / `delivery-revision-record.md` / `DR-003`       | `N/A` — prequalification `30881048872` durable test path    | `Local Fix`           | `SR-013`, `SR-014`; `ARCH-REV-015`; `CRR-037`, `CRR-038`; `API-REV-017`; `DR-003`                                      | `Implementation Complete — Ready for Code Re-review` |
| `IR-026`    | Architecture Reviewer / `design-review-report.md` / round 18       | Resolved `AR-F-015`, `AR-F-016`; Delivery ownership blocker | `Design Impact`       | `SR-015`–`SR-017`; `ARCH-REV-016`–`ARCH-REV-018`; prior `CRR-039`, `CRR-040`; `API-REV-017`, `API-REV-018`; `DR-005`   | `Implementation Complete — Ready for Code Review`    |
| `IR-027`    | Architecture Reviewer / `design-review-report.md` / round 19       | `CR-F-035`, `CR-F-036`, `CR-F-037`                          | `Design Impact`       | `SR-018`; `ARCH-REV-019`; `CRR-041`; `API-REV-017`, `API-REV-018`; `DR-005`                                            | `Implementation Complete — Ready for Code Re-review` |
| `IR-028`    | Code Reviewer / `code-review-report.md` / `CRR-042`                | `CR-F-038`                                                  | `Local Fix`           | `SR-018`; `ARCH-REV-019`; `CRR-042`; `API-REV-017`, `API-REV-018`; `DR-005`                                            | `Implementation Complete — Ready for Code Re-review` |
| `IR-029`    | Code Reviewer / `code-review-report.md` / `CRR-043`                | Remaining `CR-F-038`                                        | `Local Fix`           | `SR-018`; `ARCH-REV-019`; `CRR-043`; `API-REV-017`, `API-REV-018`; `DR-005`                                            | `Implementation Complete — Ready for Code Re-review` |
| `IR-030`    | Delivery Engineer / `delivery-revision-record.md` / `DR-006`       | `N/A` — reviewed post-renewal controller transition         | `Reviewed Transition` | `SR-018`; `ARCH-REV-019`; `CRR-044`, `CRR-045`; `API-REV-019`; `DR-006`                                                | `Implementation Complete — Ready for Code Re-review` |
| `IR-031`    | Architecture Reviewer / `design-review-report.md` / round 21       | Resolved `AR-F-017`, `AR-F-018`, `AR-F-019`                 | `Design Impact`       | `SR-020`, `SR-021`; `ARCH-REV-020`, `ARCH-REV-021`; prior `CRR-044`, `CRR-045`; `API-REV-017`–`API-REV-019`; `DR-006`  | `Implementation Complete — Ready for Code Review`    |
| `IR-032`    | Code Reviewer / `code-review-report.md` / `CRR-048`                | `CR-F-039`–`CR-F-043`                                       | `Local Fix`           | `SR-021`; `ARCH-REV-021`; `CRR-048`; `API-REV-017`–`API-REV-019`; `DR-006`                                             | `Implementation Complete — Ready for Code Re-review` |
| `IR-033`    | Code Reviewer / `code-review-report.md` / `CRR-050`                | `CR-F-044`, `CR-F-045` / `API-F-016`, `API-F-017`           | `Local Fix`           | `SR-021`; `ARCH-REV-021`; `CRR-049`, `CRR-050`; `API-REV-022`; `DR-006`                                                | `Implementation Complete — Ready for Code Re-review` |
| `IR-034`    | Code Reviewer / `code-review-report.md` / `CRR-052`                | `CR-F-046` / `API-F-018`                                    | `Local Fix`           | `SR-021`; `ARCH-REV-021`; `CRR-051`, `CRR-052`; `API-REV-023`; `DR-006`                                                | `Implementation Complete — Ready for Code Re-review` |
| `IR-035`    | Code Reviewer / `code-review-report.md` / `CRR-054`                | `CR-F-047` / `API-F-019`                                    | `Local Fix`           | `SR-021`; `ARCH-REV-021`; `CRR-053`–`CRR-055`; `API-REV-024`; `DR-006`                                                 | `Implementation Complete — Ready for Code Re-review` |
| `IR-036`    | Architecture Reviewer / `design-review-report.md` / round 22       | `DR-008` final-main admission self-reference                | `Design Impact`       | `SR-022`; `ARCH-REV-022`; prior `CRR-055`, `CRR-056`; `API-REV-025`; `DR-008`                                          | `Implementation Complete — Ready for Code Review`    |
| `IR-037`    | Architecture Reviewer / `design-review-report.md` / round 24       | `CR-F-048`; resolved `AR-F-020`                             | `Design Impact`       | `SR-023`, `SR-024`; `ARCH-REV-023`, `ARCH-REV-024`; `CRR-057`; `API-REV-025`; `DR-008`                                 | `Implementation Complete — Ready for Code Review`    |
| `IR-038`    | Delivery Engineer / `delivery-revision-record.md` / `DR-010`       | Release-host tool selection and early failure evidence      | `Local Fix`           | `SR-024`; `ARCH-REV-024`; `CRR-059`; `API-REV-026`; `DR-010`                                                           | `Implementation Complete — Ready for Code Review`    |
| `IR-039`    | Architecture Reviewer / `design-review-report.md` / round 25       | `DR-012` Host Source Closure Design Impact                  | `Design Impact`       | `SR-025`; `ARCH-REV-025`; prior `CRR-059`; `API-REV-025`, `API-REV-027`; `DR-012`                                      | `Implementation Complete — Ready for Code Review`    |
| `IR-040`    | Code Reviewer / `code-review-report.md` / `CRR-063`                | `CR-F-049`, `CR-F-050`                                      | `Local Fix`           | `SR-025`; `ARCH-REV-025`; `CRR-063`; `API-REV-025`, `API-REV-027`; `DR-012`                                            | `Implementation Complete — Ready for Code Re-review` |

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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-002`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-003`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-004`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-007`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-009`, with mechanism evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-009-native-build-environment-probe.md`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-010`, with mechanism evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-010-preflight-build-entry-probe.md`
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

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-012`, with origin evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-012-api-f-001-origin.md`
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

### IR-012 — Separate functional qualification from performance observation

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 12 / `ARCH-REV-012`, following the user-approved `API-RI-002`, Solution Designer `SR-010`/`SR-011`, and the API-REV-004 controlled-performance precondition block.
- Triggering finding IDs: `API-RI-002`; resolved architecture finding `AR-F-013`.
- Classification: `Design Impact`.
- Prior authoritative result: Cumulative runtime source through `IR-011` passed `CRR-013`, but `API-REV-004` then blocked before package work when six CPU-idle samples averaged `69.638333...%` under the prior `>=80%` functional precondition. `ARCH-REV-011` accepted the functional-first behavior but failed the initial two-artifact identity direction as `AR-F-013`.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-011`, `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-013` for the preserved source basis; current re-review pending.
- Related API/E2E revision IDs: `API-REV-004`, `API-RI-002`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The approved acceptance boundary now makes complete current-platform functionality the blocking result while retaining truthful controlled versus loaded-host performance evidence. SR-011 also requires an exact acyclic per-profile artifact order. This round implements both reviewed changes without relaxing functional/stability/resource gates or changing runtime, provider, model, target, package, protocol, threshold, or publication authority.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-008`, `BEH-009`; `R-018`–`R-020`; `AC-003`, `AC-006`, `AC-007`, `AC-017`, `AC-019`–`AC-023`; `DS-003`, `DS-004`, `DS-010`.
- Implementation delta:
  - Replaced the active v1 preflight contract with Functional Preflight 2. The runner preserves target/tool/power/thermal/memory/caffeinate/Seatbelt/purge blockers, samples CPU idle exactly six times at ten-second intervals, records the true average and bounded competitor observation, and classifies `controlled` versus `loaded-host` without making load alone a functional blocker.
  - Added exact performance-observation and assessment owners. Qualification retains every started attempt and requires exact 30 cold / 30 warm-preparation / 100 warm-request completion, hard deadlines, full corpus quality/non-regression, lifecycle/recovery, package/compliance/privacy, process-tree RSS `<=2.5 GiB`, extracted size `<=1.25 GiB`, and all required observations. Latency-reference miss alone changes performance classification, not functional eligibility.
  - Added strict Qualification Summary 2 and Performance Assessment 1 artifacts. Summary is schema-valid, finalized, and hashed first; its schema forbids every Assessment field/reference. Assessment binds the exact Summary filename/SHA and matching raw/preflight/sample identities. Qualification Set 2 independently reloads both and rejects missing/mismatched/filename-only/reverse/bidirectional edges.
  - Versioned Branch Catalog Projection, Release Qualification Evidence, and Pre-Tag Release Manifest consumers to v2 and preserved the release-neutral branch proof, integrated QSet -> expected Release Evidence -> Catalog 3 -> Pre-Tag Manifest direction, separate published-byte result, and fail-only tag-preserving quarantine result.
  - Removed active v1 schemas/filenames cleanly while leaving immutable historical API evidence untouched. Added focused passing-preflight fixtures and functional/performance/identity-chain/negative regressions. No compatibility dual path or alternate runtime was added.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `README.md`, functional preflight and profile-evidence owners under `benchmark/`, qualification/projection/release owners under `release/`, versioned schemas under `contracts/{qualification,release,catalog}/`, and focused tests under `tests/{fixtures,release,build}/`; source commit `0afc5904ea7584cddcee7a1f70f0179036689a45`.
- Local validation and result: verified-root `npm run check` passed `65/65` Node tests, `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Go race/vet/gofmt passed. All `191/191` original backend-selection and `8/8` English-v2 checksums passed; `265/265` repository JSON files parsed; focused Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: No API/E2E or actual M1 package qualification ran in this round. After source Pass, API/E2E must execute the two real packages, licensed 49/200-corpus inference, exact 30/30/100 attempts, resource/lifecycle/offline/no-mutation/compliance gates, Qualification Set 2, and Branch Catalog Projection 2. A loaded-host run is truthful functional evidence but not controlled-performance certification. Maintained-main integration/repeat, tag/publication, published verification, and quarantine remain Delivery-owned; x64/`auto` remain deferred.

### IR-013 — Propagate post-attempt functional failures through retained evidence

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-014`, with reproduction evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-014-functional-gate-decision-probe.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-014-functional-gate-decision-probe.json`.
- Triggering finding IDs: `CR-F-021`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-014` / `Fail — Local Fix` against `IR-012`; the v2 functional/performance separation, six-sample load classification, acyclic Summary -> Assessment -> QSet chain, downstream consumers, and v1 cleanup were otherwise accepted.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-014`.
- Related API/E2E revision IDs: `API-REV-004`, `API-RI-002`; execution remains paused until source Pass.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: When every attempt succeeded but a later quality/RSS/size/count/observation gate failed, IR-012 finalized `qualification-attempts-v1.json` from a provisional pass before recomputing the functional decision. Summary 2 then correctly failed, the profile process still exited successfully, and QSet rejected the contradiction before writing the required durable non-pass aggregate. The existing reviewed contracts already define a single functional authority, so this is a bounded finalization/propagation correction.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-008`; `AC-003`, `AC-009`, `AC-017`, `AC-023`; `DS-003`.
- Implementation delta:
  - Added a non-mutating attempt-recorder snapshot and moved terminal ledger finalization after functional recomputation. The recomputed decision/category now finalizes both the ledger and Summary; terminal decision/category pairs are also validated fail closed.
  - Made the profile runner consume its returned evidence. It records `evidenceWritten=true` before a passing-only assertion, so fail/blocked evidence is retained once and the CLI exits nonzero without a second rewrite.
  - Added a shared passing-only Qualification Set assertion at the CLI boundary. The assembler still writes and returns a schema-valid non-pass set first, then the CLI exits nonzero.
  - Added a focused two-profile fixture with exact successful 30 cold / 30 warm-preparation / 100 warm-request performance counts and complete English/Chinese quality counts, followed by a blocking quality breach. It verifies consistent ledger/Summary decisions and categories, independent controlled performance classification, profile exit authority, retained non-pass QSet, and QSet exit authority.
  - Preserved every threshold, performance classification, provider/model, runtime/package/protocol behavior, matrix, downstream v2 contract, and release-order boundary.
- Changed files or areas: `benchmark/qualification-attempts.mjs`, `benchmark/profile-qualification-evidence.mjs`, `benchmark/run-profile-qualification.mjs`, `release/evidence/qualification-set.mjs`, and new `tests/release/functional-gate-retention.test.mjs`; source commit `628bef9d9b1f40f263cb1f41e711649b8ca7dfe6`.
- Local validation and result: verified-root `npm run check` passed `66/66` Node tests, `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused affected tests passed `11/11`; Go race/vet/gofmt passed; all `191/191` backend-selection and `8/8` English-v2 checksums passed; `214/214` current workspace JSON files parsed; focused Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: No API/E2E or actual M1 package qualification ran. After source Pass, API/E2E still owns real package/corpus/30/30/100/resource/lifecycle/compliance/QSet/projection execution. Loaded-host evidence remains functional but not controlled-performance certification. Maintained-main integration/repeat, tag/publication, published verification, and quarantine remain Delivery-owned; x64/`auto` remain deferred.

### IR-014 — Authorize the native build before entering Seatbelt

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-016`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-016-api-f-002-origin.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-005/english-darwin-arm64/API-F-002-package-construction-sandbox-sudo-failure.json`.
- Triggering finding IDs: `CR-F-022`, mapped from `API-REV-005` / `API-F-002` / `API-VOICE-003`; prior `CR-F-007`–`CR-F-021` remain resolved in current source.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-015` source Pass against `IR-013` was withdrawn after the exact API-REV-005 package command exposed the production composition failure; `CRR-016` / `Fail — Local Fix` is the current source authority.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-015` historical/withdrawn Pass, `CRR-016` current Local Fix.
- Related API/E2E revision IDs: `API-REV-005`, `API-F-002`; prior `API-REV-004`, `API-RI-002`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The approved workflow correctly ran Functional Preflight 2 and correctly wrapped all package construction in the pinned deny-network Seatbelt profile, but package assembly recreated the trusted native environment inside that profile. Recreation live-spawned the setuid `/usr/bin/sudo -V` identity probe, which Seatbelt forbids, so the first English archive could never be created. Both mechanisms were individually valid; their production ordering was not.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`, `AC-020`; `API-VOICE-003`; `MP-CR-016`.
- Implementation delta:
  - Added a narrow native-build-environment authorization CLI and placed it immediately before the reproducible-build loop, outside Seatbelt. It uses the existing full fail-closed owner to validate preflight schema/status/recomputations, live pinned sudo identity, exact purge capability record, selected CMake, every native tool byte, and SDK settings, then writes an exact record bound to the preflight SHA-256.
  - Split preflight consumption without splitting authority: normal callers retain full live sudo verification, while the sandboxed build consumer validates the same preflight contract and live sudo filesystem metadata without executing the forbidden setuid child. It then verifies the complete native environment record, exact preflight bytes, exact derived tool identities, and inherited override policy.
  - Replaced package assembly's internal environment creation and `--cmake` input with required `--build-environment` consumption. Both primary and rebuild archive invocations remain entirely inside the unchanged pinned Seatbelt profile.
  - Refactored sudo capture so full identity and metadata-only revalidation share one metadata implementation. No path, root ownership, mode `4511`, device/inode, size, timestamps, or probe/capability binding was weakened.
  - Added focused coverage that authorizes outside and consumes the production owner under the exact Seatbelt profile, plus negative probe, purge-capability, live sudo-metadata, sandbox-profile, and tool-byte drift cases. Static workflow/package assertions bind the real creator-before-Seatbelt-before-consumer composition.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `benchmark/darwin-arm64-preflight-contract.mjs`, `benchmark/system-command-identity.mjs`, new `build/create-native-build-environment.mjs`, `build/package-assembler.mjs`, `build/trusted-native-environment.mjs`, `tests/build/trusted-native-environment.test.mjs`, and `tests/release/system-command-identity.test.mjs`; source commit `fda4a3bc482c2452b6842644d62dfb062ad8339c`.
- Local validation and result: verified-root `npm run check` passed `67/67` Node tests, `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused composition/identity tests passed `8/8`, including actual execution of the production sandbox-safe consumer under the exact Seatbelt profile. Verified-root Go race/vet/gofmt passed; all `191/191` backend-selection and `8/8` English-v2 checksums passed; `218/218` workspace JSON files parsed; focused Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the licensed API/E2E package build or actual two-profile qualification. After source Pass, API/E2E must rerun the corrected canonical English package command first, then own real double-package construction, 49/200-corpus inference, 30/30/100/resource/lifecycle/compliance/QSet/projection execution. Maintained-main integration/repeat, tag/publication, published verification, and quarantine remain Delivery-owned; x64/`auto` remain deferred.

### IR-015 — Normalize the exact locked Python archive into a closed runtime

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-018`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-018-api-f-003-origin.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-006/english-darwin-arm64/API-F-003-python-runtime-symlink-materialization-failure.json`.
- Triggering finding IDs: `CR-F-023`, mapped from `API-REV-006` / `API-F-003` / `API-VOICE-003`; `CR-F-022` is confirmed resolved by API-REV-006.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-017` source Pass against `IR-014` was withdrawn after the exact API-REV-006 English build exposed the selected Python archive's ordinary link topology; `CRR-018` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-017` historical/withdrawn Pass, `CRR-018` current Local Fix.
- Related API/E2E revision IDs: `API-REV-006`, `API-F-003`; prior `API-REV-005`, `API-F-002`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The exact authenticated Python Build Standalone input contains nine safe relative links. The materializer followed `bin/python3` successfully for wheel installation, then invoked the globally strict symlink-free traversal before any archive-specific reconciliation, so no package could be emitted. The final regular-file-only contract is correct; the selected archive required a bounded exact normalization owner before that boundary.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`; `API-VOICE-003`; `MP-CR-018`.
- Implementation delta:
  - Added a Python-archive normalization owner keyed to the exact approved darwin-arm64 archive SHA-256 and target. It requires the observed nine paths and targets one-for-one and validates every observed link as relative, contained, resolvable, acyclic, and regular-file-targeted. Special, missing, unexpected, absolute, escaping, dangling, cyclic, unapproved-digest, or wrong-target layouts fail closed.
  - Removes every approved link before generic traversal, renames the validated `bin/python3.12` target to an ordinary executable `bin/python3`, and removes all unused alias/build-only targets. The global `regularFiles()` behavior was not relaxed and is run immediately after normalization and again throughout pruning/staging/archiving.
  - Tightened deterministic runtime pruning to retain only `bin/python3`, remove generated wheel console wrappers and install-time `.dist-info/RECORD` files whose hashes embed root-specific wrappers, and preserve distribution `METADATA` for exact installed-version verification. Bytecode, build-only packages, headers/configuration, static libraries, and other prior removals remain.
  - Added a final relocatability guard that rejects any retained runtime file embedding the temporary materialization root.
  - Added exact-topology closure/reproducibility/relocation coverage and negative absolute, escaping, dangling, cyclic, unexpected, missing, and special-entry cases. The exact retained archive/wheelhouse also materialized twice to the same 18,978-file tree digest, and its relocated `bin/python3` imported `mlx_whisper` successfully.
- Changed files or areas: new `build/python/archive-link-normalization.mjs`, `build/python/materialize-runtime.mjs`, and new `tests/build/python-archive-link-normalization.test.mjs`; source commit `24a994a51256f0eef5840ecdc977febec71ea491`.
- Local validation and result: verified-root `npm run check` passed `69/69` top-level Node cases (`76/76` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Exact real materialization twice produced tree digest `65150bfe112e0fef4313270a9aebcd77b2dd14721dce0105a090380df4934094`, only `bin/python3`, no links/RECORD files, and a successful relocated MLX import. Go race/vet/gofmt, `191/191` backend checksums, `8/8` English checksums, `222/222` JSON parses, Prettier, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the full sandboxed Provider Archive 1 command or qualification matrix. After source Pass, API/E2E must restart with the canonical English package build, then own double construction, archive verification, 49/200-corpus inference, 30/30/100/resource/lifecycle/compliance/QSet/projection execution. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-016 — Close the staged Python dependency payload before archive construction

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-020`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-020-api-f-004-origin.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-008/english-darwin-arm64/API-F-004-package-manifest-path-policy-failure.json`.
- Triggering finding IDs: `CR-F-024`, mapped from `API-REV-008` / `API-F-004` / `API-VOICE-003`; `CR-F-022` and `CR-F-023` remain resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-019` source Pass against `IR-015` was withdrawn after the exact API-REV-008 English build reached canonical archive validation with two forbidden retained dependency paths; `CRR-020` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-019` historical/withdrawn Pass, `CRR-020` current Local Fix.
- Related API/E2E revision IDs: `API-REV-008`, `API-F-004`; prior `API-REV-006`, `API-F-003` and `API-REV-005`, `API-F-002` remain resolved in current source.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The exact staged 19,003-record package manifest was sorted and collision-free, but retained SciPy test data `Transparent Busy.ani` and Torch development header `C++17.h`. Both violated immutable Provider Archive 1 path grammar. The Go owner correctly rejected the package; the Python materializer lacked a coherent installed-dependency runtime-closure policy.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`; `API-VOICE-003`; `MP-CR-018`.
- Implementation delta:
  - Extracted one Python runtime-closure owner from the materializer. It retains the executable runtime and public runtime APIs while removing structurally named installed test suites (`test`/`tests`) and package-local development `include` trees, along with all prior root build payload, build-only distributions, bytecode, generated wrappers, and install-time `RECORD` files.
  - Deliberately retained public `testing` modules such as `numpy.testing`; a real relocated MLX import probe demonstrated that SciPy's runtime import chain requires this public API. No observed filename was renamed or special-cased.
  - Preserved the canonical Go path policy unchanged. Added a digest-bound compressed fixture of the exact ordered 19,003 observed paths, applied the production closure to all of them, and passed the resulting 6,501-record complete manifest through the existing Go `ReadManifest()` validator.
  - Added focused synthetic coverage for the observed SciPy test-data and Torch header classes, public testing-API preservation, exact fixture identity/counts, and canonical-validator acceptance. Existing archive-link normalization coverage now imports the shared closure owner.
  - Materialized the exact archive and wheelhouse twice after the fix. Both produced the same 6,476-file tree digest, with zero dependency test suites, development headers, symlinks, or invalid paths; the relocated package Python imported the worker, recognizer, MLX core, and MLX Whisper successfully.
- Changed files or areas: `build/python/materialize-runtime.mjs`, new `build/python/runtime-closure.mjs`, new `packaging/archive/runtime_closure_manifest_test.go`, `tests/build/python-archive-link-normalization.test.mjs`, new `tests/build/python-runtime-closure.test.mjs`, and new `tests/fixtures/python-runtime-closure/api-rev-008-package-paths.txt.gz`; source commit `1d712683c70c338d8bf5074f27c8b0c9da47a8cb`.
- Local validation and result: verified-root `npm run check` passed `71/71` top-level Node cases (`78/78` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Exact materialization twice produced tree digest `857fce720a46d020d7db274ac05e5219fb91cd65feedb66c1d1f7ad2d0d05da3`; the relocated worker/runtime import passed. Go race/vet/gofmt, `191/191` backend checksums, `8/8` English checksums, `230/230` JSON parses, Prettier, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the full canonical Provider Archive command or qualification matrix. After source Pass, API/E2E must restart at English construction, independently validate the full relocated archive and MLX inference, and then own double construction, 49/200-corpus inference, 30/30/100/resource/lifecycle/compliance/QSet/projection execution. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-017 — Bootstrap the isolated worker and retain production-shaped failure evidence

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-022`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-022-api-f-005-f-006-origin.md`, `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/english-darwin-arm64/API-F-005-public-launcher-isolated-worker-import-failure.json`, and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-009/english-darwin-arm64/API-F-006-terminal-summary-archive-schema-failure.json`.
- Triggering finding IDs: `CR-F-025` / `API-F-005` and `CR-F-026` / `API-F-006`, both reached by `API-VOICE-003`; `CR-F-022` through `CR-F-024` remain directly resolved in API-REV-009.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-021` source Pass against `IR-016` was withdrawn after exact API-REV-009 execution exposed the isolated worker-import failure and the wider producer archive shape on terminal evidence; `CRR-022` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-021` historical/withdrawn Pass, `CRR-022` current Local Fix.
- Related API/E2E revision IDs: `API-REV-009`, `API-F-005`, `API-F-006`; prior API package-construction findings are directly resolved.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The public launcher correctly validated the package, session, contained host, and worker, then invoked Python with `-I`. Isolated mode deliberately ignored ambient paths but also omitted the worker's adjacent application directory, so `autobyteus_voice_provider` failed before `hello`. The resulting process loss was retained by the attempt ledger, but Summary construction spread the wider production archive object, forwarding its producer-owned `schemaVersion: 1` into a strict narrower schema and preventing Summary/Assessment retention.
- Approved behavior or requirement IDs affected: `BEH-002`, `BEH-004`, `BEH-007`–`BEH-010`; `AC-002`, `AC-003`, `AC-006`, `AC-007`, `AC-011`, `AC-013`, `AC-017`, `AC-023`; `MP-CR-019`, `MP-CR-020`.
- Implementation delta:
  - Preserved the one public Go launcher, validated contained host/worker paths, closed environment, and `-I -B -X utf8`. Added a constant launcher-owned bootstrap that receives the canonical parent of the validated worker, installs exactly that directory as `sys.path[0]`, and executes the worker as `__main__` with the existing private root/session arguments.
  - Added no `PYTHONPATH`, CWD dependency, system-host fallback, second launcher, alternate worker, or weaker containment/integrity check.
  - Added a real compiled-launcher composition regression at a relocated path containing spaces and non-ASCII. It poisons ambient Python home/path and CWD, proves isolation remains active, verifies the canonical worker import root, imports `autobyteus_voice_provider`, and observes the first `hello` frame.
  - Replaced archive object spreading with explicit projection of Summary-owned `fileName`, SHA-256, compressed size, extracted size, and entry count. The build report keeps `archive.schemaVersion: 1`; Summary `additionalProperties: false` is unchanged.
  - Upgraded process-loss and post-attempt gate fixtures to the real producer archive shape. The focused process-loss regression proves ledger/Summary fail/process-loss agreement, retained Assessment identity/count binding, independent Assessment verification, and terminal passing-only rejection after durable writes.
- Changed files or areas: `launcher/internal/run.go`, `benchmark/profile-qualification-evidence.mjs`, new `tests/contracts/python-launcher-composition.test.mjs`, `tests/release/qualification-failure-evidence.test.mjs`, and `tests/release/functional-gate-retention.test.mjs`; source commit `e133c4a7a73a5531c726ecb04461acb641461667`.
- Local validation and result: verified-root `npm run check` passed `72/72` top-level Node cases (`79/79` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused relocated launcher and production-shaped process-loss tests passed. Go race/vet/gofmt passed; `191/191` backend, `8/8` English-v2, and `41/41` API-REV-009 checksums passed; `251/251` workspace JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun actual packaged MLX qualification. After source Pass, API/E2E must resume at current English qualification, prove real model startup/inference and terminal evidence on the approved environment, and then own 49/200-corpus, 30/30/100/resource/lifecycle/compliance/QSet/projection completion. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-018 — Unify the exact Build Input path contract

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-024`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-024-api-f-007-origin.md`, `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/chinese-darwin-arm64/API-F-007-chinese-input-manifest-path-policy-failure.json`, and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-010/chinese-darwin-arm64/API-F-007-chinese-input-manifest-analysis.json`.
- Triggering finding IDs: `CR-F-027`, mapped from `API-REV-010` / `API-F-007` / `API-VOICE-004`; `CR-F-022` through `CR-F-026` remain directly resolved by API-REV-010.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-023` source Pass against `IR-017` was withdrawn after exact API-REV-010 reached the current Chinese deterministic input tree and exposed the producer/consumer path-domain mismatch; `CRR-024` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-023` historical/withdrawn Pass, `CRR-024` current Local Fix.
- Related API/E2E revision IDs: `API-REV-010`, `API-F-007`; prior API findings `API-F-002` through `API-F-006` remain resolved in current source.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The materializer authenticated and emitted all 3,149 exact clean Chinese input paths, but the mandatory verifier applied an independent narrower allowlist and rejected ten llama.cpp UI routing paths containing `()`, `[]`, or `+`. The bytes, revision/tree identity, modes, uniqueness, and closure were correct; the producer and consumer did not share one explicit Build Input path contract.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`, `AC-019`; `API-VOICE-004`; `MP-CR-021`.
- Implementation delta:
  - Added one Build Input path-policy owner and explicit contract, distinct from Provider Archive 1. It admits the current safe source-routing punctuation while retaining ASCII, canonical relative POSIX form, 240-byte maximum, containment, and segment restrictions.
  - The shared owner rejects empty/dot/dot-dot/`.git` segments, absolute/backslash paths, trailing dots, reserved device names, unsupported punctuation, exact duplicates, and ASCII case-fold collisions.
  - Materialization validates authenticated Git paths before copying and the complete immutable output path set before provenance/manifest generation. The mandatory package verifier imports the same set owner before byte/size/mode/closure verification.
  - Removed the obsolete verifier-only `.git` skip. Deterministic materialization does not copy Git metadata, so undeclared Git metadata can no longer bypass complete-tree closure.
  - No exact upstream path or byte is renamed, omitted, projected, or mutated; the canonical Go Provider Archive path validator remains unchanged.
  - Added a digest-bound compressed fixture of all 3,149 exact API-REV-010 Chinese paths, direct full-set validation, unsafe/alias/collision negatives, a verifier negative, and authenticated Git-checkout materialization of the ten exact current routing paths through the production verifier.
- Changed files or areas: new `build/build-input-path-policy.mjs`, `build/materialize-release-inputs.mjs`, `build/locked-inputs.mjs`, new `contracts/build/build-input-path-v1.md`, new `tests/release/build-input-path-contract.test.mjs`, and new `tests/fixtures/build-input/api-rev-010-chinese-paths.txt.gz`; source commit `8680c6a9693f3b55021c9317e0163281c946ca96`.
- Local validation and result: verified-root `npm run check` passed `76/76` top-level Node cases (`83/83` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused Build Input tests passed `4/4`; the retained exact API-REV-010 1.3 GiB Chinese tree passed `verifyInputManifest()` for all `3,149` records. Go race/vet/gofmt passed; `191/191` backend, `8/8` English-v2, and `51/51` API-REV-010 checksums passed; `281/281` workspace JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the network-denied Chinese package build or actual Chinese inference/qualification. After source Pass, API/E2E must restart at canonical Chinese construction, prove exact double archives/reproducibility/compliance and 200-WAV plus 30/30/100/resource/lifecycle behavior, then assemble Qualification Set 2 and Branch Catalog Projection 2. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-019 — Preserve authenticated Xcode ranlib invocation semantics

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-026`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-026-api-f-008-origin.md`, `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/chinese-darwin-arm64/API-F-008-chinese-ranlib-alias-loss-failure.json`, and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-011/chinese-darwin-arm64/API-F-008-chinese-ranlib-alias-analysis.json`.
- Triggering finding IDs: `CR-F-028`, mapped from `API-REV-011` / `API-F-008` / `API-VOICE-004`; `CR-F-027` is directly resolved by the exact 3,149-record API-REV-011 boundary, and `CR-F-022` through `CR-F-026` remain resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-025` source Pass against `IR-018` was withdrawn after exact API-REV-011 Chinese construction reached the current CMake build and exposed the lost Xcode ranlib invocation identity; `CRR-026` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-025` historical/withdrawn Pass, `CRR-026` current Local Fix.
- Related API/E2E revision IDs: `API-REV-011`, `API-F-008`; prior API findings `API-F-002` through `API-F-007` remain resolved in current source.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: Functional Preflight 2 found Xcode's `ranlib` alias, but the generic executable identity intentionally canonicalized the path to its byte-identical `libtool` target. CMake therefore invoked `libtool` by the wrong basename/argv semantics and failed at the first static library. Authentication was correct for bytes but incomplete for the semantic invocation identity.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`, `AC-019`; `API-VOICE-004`; `MP-CR-022`.
- Implementation delta:
  - Added one strict Xcode-ranlib identity that separately records the absolute semantic invocation path, exact relative `libtool` link target, canonical target path, and target digest. Capture and live verification require the selected `*.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/ranlib` topology, a symbolic alias to same-directory libtool, exact real target, and equality to the separately authenticated libtool path and bytes.
  - Functional Preflight 2 emits the specialized identity; both preflight consumption and trusted native-environment verification revalidate its live topology and bytes before use. Strict preflight/native-environment schemas encode the separate invocation and target meanings.
  - The closed trusted tool directory points its `ranlib` entry to the verified invocation alias. Explicit CMake configuration uses that path as `CMAKE_RANLIB`, and resolved-cache verification rejects the canonical target or any other drift.
  - Retained the generic canonical regular-executable identity for every other tool. In particular `/usr/bin/tar -> /usr/bin/bsdtar` remains canonical-target authenticated; no arbitrary alias support or fallback was introduced.
  - Added an Xcode-shaped alias-sensitive fixture and focused coverage proving alias success/direct-target failure, exact CMake selection, and rejection of retargeting, target-byte drift, non-symlink topology, trusted-directory drift, and CMake target-path drift.
  - On the actual selected host, the production owner captured `/Applications/Xcode.app/.../ranlib -> libtool`, verified target SHA-256 `d12f4f90046f0e15261e578f5288b40f5750f3f5f606370e6252fc74099d94e6`, successfully ran the alias against a static archive, and observed direct libtool invocation fail. This was a bounded implementation check, not the API/E2E Chinese package rerun.
- Changed files or areas: `benchmark/darwin-arm64-preflight-contract.mjs`, `benchmark/darwin-arm64-runner-preflight.mjs`, `build/native-tool-identities.mjs`, `build/resolved-cmake-configuration.mjs`, `build/trusted-native-environment.mjs`, `contracts/build/native-build-environment-v1.schema.json`, `contracts/qualification/darwin-arm64-preflight-v2.schema.json`, `tests/build/trusted-native-environment.test.mjs`, and `tests/fixtures/passing-darwin-preflight.mjs`; source commit `2e9399b214adbfe9d0cc245b256c152b2c0de7e4`.
- Local validation and result: verified-root `npm run check` passed `77/77` top-level Node cases (`84/84` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused trusted-environment tests passed `8/8`; actual-host alias semantics passed; Go race/vet/formatting passed; `191/191` backend, `8/8` English-v2, and `21/21` API-REV-011 checksums passed; `280/280` workspace JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the network-denied Chinese package build or actual Chinese inference/qualification. After source Pass, API/E2E must restart at canonical Chinese construction, prove the real resolved CMake tool selection and two exact archives, then own 200-WAV, 30/30/100, resource, lifecycle, compliance, Qualification Set 2, and Branch Catalog Projection 2 execution. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-020 — Close the authenticated native sed command chain

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-028`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-028-api-f-009-origin.md`, `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/chinese-darwin-arm64/API-F-009-chinese-trusted-sed-closure-failure.json`, and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-012/chinese-darwin-arm64/API-F-009-chinese-trusted-sed-closure-analysis.json`.
- Triggering finding IDs: `CR-F-029`, mapped from `API-REV-012` / `API-F-009` / `API-VOICE-004`; `CR-F-028` is directly resolved by the API-REV-012 ranlib/static-library boundary, and `CR-F-027` remains directly resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-027` source Pass against `IR-019` was withdrawn after exact API-REV-012 Chinese construction passed the corrected ranlib boundary and exposed the missing bare `sed` command in the closed tool directory; `CRR-028` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-027` historical/withdrawn Pass, `CRR-028` current Local Fix.
- Related API/E2E revision IDs: `API-REV-012`, `API-F-009`; prior API findings `API-F-002` through `API-F-008` remain resolved in current source.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: The exact locked llama.cpp Metal CMake rule invokes bare `sed` twice. Functional Preflight 2 and the trusted native environment intentionally expose only authenticated commands through one isolated `PATH`, but their strict lists omitted sed. The canonical Chinese build therefore passed ranlib linking and failed at deterministic Metal source embedding with exit 127.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`, `AC-019`; `API-VOICE-004`; `MP-CR-023`.
- Implementation delta:
  - Added exact `/usr/bin/sed` to Functional Preflight 2's existing canonical executable capture and strict preflight command-path schema. The identity is a canonical absolute regular executable plus exact SHA-256, not a directory entitlement or ambient lookup.
  - Projected the exact preflight sed identity into the strict native-build-environment record, live-reverified it through the generic trusted executable owner in both authorized consumption stages, and bound the record byte-for-byte to the same preflight.
  - Added exactly one `sed` entry to the closed trusted tool directory. The build environment still sets `PATH` to only that directory; it does not append `/usr/bin`, inherit ambient paths, or introduce fallback.
  - Added focused production-shaped coverage that runs the locked Metal rule's two bare sed transformations through the exact closed environment and verifies embedded output plus the twelve-entry closure.
  - Added missing preflight identity, missing directory entry, unbound environment identity, extra unbound tool, modified executable bytes, and drifted trusted-link negatives. Each fails through the existing strict owners without weakening schemas or the closed path.
  - Preserved the specialized authenticated Xcode `ranlib -> libtool` invocation identity, generic `/usr/bin/tar -> /usr/bin/bsdtar` canonicalization, Seatbelt, locked source bytes, provider/model/matrix/threshold/runtime/evidence/release behavior, and every prior resolved finding.
- Changed files or areas: `benchmark/darwin-arm64-runner-preflight.mjs`, `build/native-tool-identities.mjs`, `build/trusted-native-environment.mjs`, `contracts/build/native-build-environment-v1.schema.json`, `contracts/qualification/darwin-arm64-preflight-v2.schema.json`, `tests/build/trusted-native-environment.test.mjs`, new `tests/build/trusted-native-sed-closure.test.mjs`, and `tests/fixtures/passing-darwin-preflight.mjs`; source commit `eaa0855bf300ee7805048343d4d022a9b625af60`.
- Local validation and result: verified-root `npm run check` passed `78/78` top-level Node cases (`85/85` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused native-environment/Metal closure tests passed `9/9`; actual `/usr/bin/sed` identity matched SHA-256 `abd2eb945442a8ab1d210e58edb153f34870ee6d7c359f0f6d8385b1f7fc50fc`; Go race/vet/formatting passed; `191/191` backend, `8/8` English-v2, and `19/19` API-REV-012 checksums passed; `287/287` workspace JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the network-denied Chinese package build or actual Chinese inference/qualification. After source Pass, API/E2E must restart at canonical Chinese construction, prove two exact Chinese archives and complete Chinese qualification, then complete the required current-source English profile before Qualification Set 2 and Branch Catalog Projection 2. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-021 — Preserve authenticated Xcode clang++ driver semantics

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-030`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-030-api-f-010-origin.md`, `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/chinese-darwin-arm64/API-F-010-chinese-cxx-driver-alias-loss-failure.json`, and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-013/chinese-darwin-arm64/API-F-010-chinese-cxx-driver-alias-analysis.json`.
- Triggering finding IDs: `CR-F-030`, mapped from `API-REV-013` / `API-F-010` / `API-VOICE-004`; `CR-F-029` is directly resolved by the API-REV-013 Metal transformation/final-link boundary, and `CR-F-028` plus `CR-F-027` remain directly resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-029` source Pass against `IR-020` was withdrawn after exact API-REV-013 Chinese construction passed the corrected sed closure and exposed loss of the Xcode clang++ invocation identity at the final native C++ link; `CRR-030` / `Fail — Local Fix` is current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-010`, `SR-011`.
- Related architecture-review revision IDs: `ARCH-REV-012`.
- Related code-review revision IDs: `CRR-029` historical/withdrawn Pass, `CRR-030` current Local Fix.
- Related API/E2E revision IDs: `API-REV-013`, `API-F-010`; prior API findings `API-F-002` through `API-F-009` remain resolved in current source.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: Xcode provides `clang++` as a relative alias to identical canonical `clang` bytes, but invocation basename controls C++ standard-library driver/link behavior. Generic identity capture erased that semantic path; the trusted environment, closed `c++` entry, and CMake then invoked canonical clang and failed with unresolved C++ runtime symbols.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `AC-006`, `AC-017`, `AC-019`; `API-VOICE-004`; `MP-CR-024`.
- Implementation delta:
  - Generalized the internal strict Xcode invocation-alias implementation while keeping only command-specific exported wrappers. Existing ranlib requires `ranlib -> libtool`; the new C++ identity requires `clang++ -> clang` at the exact selected `*.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin` topology.
  - The C++ identity separately preserves invocation path, relative target, canonical target path, and target SHA-256. It is cross-bound to the separately authenticated canonical C compiler path and bytes; alias/target/topology/byte divergence fails live verification.
  - Functional Preflight 2 captures the specialized C++ identity. Both authorized consumers revalidate it, strict schemas encode it, and the native environment remains exactly bound to the preflight.
  - The closed trusted directory's `cc` entry stays on canonical clang while `c++` points to verified clang++. Explicit `CMAKE_CXX_COMPILER` and resolved-cache verification now require that invocation path; canonical target drift fails.
  - Added an actual selected-Xcode proof using exact SDK and identical bytes: clang++ linked and ran a C++ runtime-error program, while direct clang failed with the expected `std::`/`__cxa`/`__gxx_personality` symbol family. No `-lc++` or other compensation was supplied.
  - Added Xcode-shaped retargeted-alias, changed-target, non-symlink, wrong-directory, closed-directory-target, and CMake-target negatives. Existing ranlib alias, authenticated sed closure, generic tar canonicalization, Seatbelt, locked source bytes, and every runtime/release behavior remain unchanged.
- Changed files or areas: `benchmark/darwin-arm64-preflight-contract.mjs`, `benchmark/darwin-arm64-runner-preflight.mjs`, `build/native-tool-identities.mjs`, `build/resolved-cmake-configuration.mjs`, `build/trusted-native-environment.mjs`, `contracts/build/native-build-environment-v1.schema.json`, `contracts/qualification/darwin-arm64-preflight-v2.schema.json`, new `tests/build/trusted-native-cxx-driver.test.mjs`, `tests/build/trusted-native-environment.test.mjs`, and `tests/fixtures/passing-darwin-preflight.mjs`; source commit `57efa584b34f2b9a5eaba012c01f7e05228dffed`.
- Local validation and result: verified-root `npm run check` passed `80/80` top-level Node cases (`87/87` TAP tests), `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and exact six-output English-v2 reproduction. Focused native tool tests passed `11/11`; actual Xcode clang++/clang semantics and strict identity passed with target SHA-256 `d5ba7be6de1bac17bfd018e1591711e69cb94d199a0ba763427c8b2d67c50697`; Go race/vet/formatting passed; `191/191` backend, `8/8` English-v2, and `20/20` API-REV-013 checksums passed; `294/294` workspace JSON files parsed; Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not rerun the network-denied Chinese package build or actual Chinese inference/qualification. After source Pass, API/E2E must restart at canonical Chinese construction, prove two exact Chinese archives and complete Chinese qualification, then complete the required current-source English profile before Qualification Set 2 and Branch Catalog Projection 2. Delivery retains integrated-state/repeat/tag/publication/published-verification/quarantine ownership; x64/`auto` remain deferred.

### IR-022 — Bind Chinese comparison trust and profile resource authority

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 13 / `ARCH-REV-013`, after Code Reviewer `CRR-032` classified the retained `API-REV-014` failures as Design Impact.
- Triggering finding IDs: `CR-F-031` / `API-F-011` and `CR-F-032` / `API-F-012`; affected scenarios `API-VOICE-004` and `API-VOICE-011`; material premises `MP-CR-025` and `MP-CR-026`.
- Classification: `Design Impact`.
- Prior authoritative result: `IR-021` / `CRR-031` source Pass was superseded after complete API-REV-014 Chinese qualification proved that product-output normalization and the trusted baseline used incomparable scoring authority, while the required persistent runtime exceeded an unsupported global 2.5-GiB RSS literal.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-012` current; prior package/runtime/release authority through `SR-011` preserved.
- Related architecture-review revision IDs: `ARCH-REV-013` current Pass.
- Related code-review revision IDs: `CRR-031` prior source Pass; `CRR-032` triggering Design Impact.
- Related API/E2E revision IDs: `API-REV-014`; `API-F-011`, `API-F-012`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: SR-012 separates product presentation from qualification comparison, closes active Chinese trust over the exact scorer/map/source identities that generated its unchanged baseline, and replaces the unsupported global RSS literal with one matrix-bound two-row policy. It preserves the already-reviewed execution, package, evidence-ordering, provider/model, and release boundaries.
- Approved behavior or requirement IDs affected: `BEH-004` through `BEH-010`; `R-005` through `R-011`, `R-017` through `R-020`; `AC-006` through `AC-011`, `AC-017`, `AC-019` through `AC-023`. `BEH-001`–`BEH-003`, `BEH-011`, and `BEH-012` are preserved without source behavior changes.
- Implementation delta:
  - Installed the exact checksum-closed `autobyteus-chinese-cer-selection-comparable-v1` contract and frozen OpenCC `t2s` map. Product `autobyteus-simplified-zh-v1` normalization remains unchanged and no longer owns qualification CER. The runner and independent verifier score retained raw reference/raw hypothesis through the profile-appropriate scorer; a concern-neutral edit-distance primitive is the only shared scoring mechanism.
  - Installed all exact reviewed Chinese-v2 derivation/authority/corpus/baseline/trust bytes and their exact raw/quality sources. Active trust recomputes all 200 historical pairs and per-clip counts to exact `343/6580`, binds scorer/map/source/corpus/derivation digests, and rejects active v1, scorer/map mismatch, count drift, and identity/order/cardinality drift. Active Chinese v1 corpus/baseline files were removed without editing historical selection or API evidence.
  - Added strict Profile Resource Policy 1 and bound its digest to the exact Current Release Matrix. It has exactly English/darwin/arm64 hard 2.5 GiB plus Chinese/darwin/arm64 hard 4.0 GiB / optimization 2.5 GiB rows. The resolver forbids missing/default/wildcard/reordered/substituted rows; the old global RSS literal was removed from build locks and qualification consumers.
  - Qualification Summary 2 now records the exact applied policy row, peak process-tree RSS, hard result, scoring authority, and scoring-bound baseline counts. Performance Assessment 1 binds the final Summary and same policy, then records optimization target/value/status without functional authority. Strict schemas preserve the no-Assessment-in-Summary and forward-only edge.
  - Profile verification independently reloads/re-scores/re-resolves all authority. QSet 2, Branch Catalog Projection 2, integrated Release Evidence 2, and Catalog construction bind the same policy/scorer/trust lineage and preserve the existing acyclic pre-tag/post-publication order. Workflow selects only `english-v2.json` / `chinese-v2.json`.
  - Added durable regressions for all 200 historical rows, the exact retained API-REV-014 `342/6580` re-score, product/scoring separation, v1 rejection, matrix/policy closure, exact current Chinese RSS pass plus optimization miss, >4-GiB fail, English 2.5-GiB boundary, policy substitution, and strict artifact schemas/propagation.
- Changed files or areas: `contracts/scoring/`, `evidence/chinese-qualification-v2/`, `evidence/backend-selection/results/`, `benchmark/scoring/`, `benchmark/baseline/trusted-baseline.mjs`, new `benchmark/profile-resource-policy.mjs`, active `release/evidence/{qualification-corpora,baselines}/chinese-v2.json`, `release/evidence/trusted-baselines-v1.json`, Current Release Matrix/resource policy and strict schemas, profile evidence/assessment/verifier/QSet/projector/release consumers, workflow/docs, and focused tests; source commit `af008705488a029b95007e25c7c00484387d3ffe`.
- Local validation and result: pinned-Go `npm run check` passed source guards, `7/7` Python tests plus compileall, all Go tests/guards, English-v2 reproduction, Chinese-v2 evidence/policy verification, and `95/95` Node TAP tests. The exact Chinese derivation reproduced 200/200 historical normalization pairs and `343/6580`; all 9 reviewed checksums and byte comparisons passed; retained API-REV-014 raw results re-scored to `342/6580`. Focused policy tests proved the exact `3,949,543,424`-byte Chinese peak passes the 4.0-GiB hard ceiling while missing only the 2.5-GiB optimization target, >4.0 GiB fails, English retains 2.5 GiB, and substituted policy bytes fail. Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: Implementation did not perform actual package construction or M1 API/E2E qualification. After source Pass, API/E2E must rerun both current-source profiles and only then construct Qualification Set 2 and Branch Catalog Projection 2. The Chinese 4.0-GiB boundary is scoped to the exact current M1 package and does not establish lower-memory, x64, `auto`, concurrent-provider, or desktop support. Delivery retains maintained-main integration, repeated integrated qualification, tag/publication, published verification, and quarantine ownership.

### IR-023 — Bound Chinese integrity and preparation-stage evidence

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 15 / `ARCH-REV-015`, after Code Reviewer `CRR-034` classified `API-REV-015` failure `API-F-013` as Design Impact and `ARCH-REV-014` opened the bounded `AR-F-014` temporal-join correction.
- Triggering finding IDs: `CR-F-033` / `API-F-013`; resolved architecture finding `AR-F-014`; affected scenario `API-VOICE-004` and acceptance `AC-024`.
- Classification: `Design Impact`.
- Prior authoritative result: `IR-022` / `CRR-033` source Pass was superseded when API-REV-015 timed out on Chinese cold preparation attempt 22; `CRR-034` found opaque preparation and model-sized whole-file digest allocation, while `ARCH-REV-014` found that the first diagnostic design could not truthfully join worker-local time to qualification-owned RSS.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-013`, `SR-014` current; prior matrix/scoring/resource authority through `SR-012` preserved.
- Related architecture-review revision IDs: `ARCH-REV-014`, `ARCH-REV-015` current Pass.
- Related code-review revision IDs: `CRR-033` prior source Pass; `CRR-034` triggering Design Impact.
- Related API/E2E revision IDs: `API-REV-015`; `API-F-013`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: the reviewed correction removes the verified preparation-pressure source without changing the 30-second deadline, then adds one truthful two-clock preparation evidence path. Worker time owns duration only; qualification receipt and process-tree scan windows share one pre-spawn monotonic origin and join by exact inclusive interval intersection.
- Approved behavior or requirement IDs affected: `BEH-002`, `BEH-004`, `BEH-007` through `BEH-010`; `R-002`, `R-004`, `R-005`, `R-009`, `R-018`, `R-020`, `R-021`; `AC-002` through `AC-004`, `AC-006`, `AC-011`, `AC-017`, `AC-019` through `AC-024`. Provider/model/matrix/scoring/resource/deadline/protocol/release behavior remains preserved.
- Implementation delta:
  - Replaced `sha256.{h,cpp}` and model-sized vector hashing with one Apple-only `package_integrity` owner. CommonCrypto reads a fixed 1-MiB buffer, checks open/read/init/update/final outcomes, emits lowercase exact SHA-256, and preserves every existing control/complete manifest identity, mode, containment, closure, and model-tree check. CMake fails unsupported current targets rather than selecting a fallback.
  - Added Preparation Diagnostics 1 and exact worker boundaries for manifest verification, encoder load, language-model/backend load, context creation, and normalizer load. The worker writes ten canonical bounded ASCII JSON+LF records directly to stderr; public Protocol 1 stdout/lifecycle remains unchanged and no privacy-prohibited field or free-form error is emitted.
  - Added raw-byte stderr forwarding and one preparation collector per Chinese cold/warm-preparation process. Its monotonic origin is established before spawn; each LF is timestamped at consumption; split/coalesced bytes, UTF-8/canonical JSON/order/sequence/clock/privacy failures are fail-closed evidence without controlling, retrying, or excluding the worker.
  - Added periodic plus boundary-triggered single-flight process-tree RSS collection. Every scan retains exact start/completion offsets and RSS bytes. Completed/partial Stage Evidence is derived by inclusive interval intersection with explicit `contained|boundary-overlap|unavailable`, exact overlapping sample sequences, and nonexclusive maximum; unavailable coverage fails successful preparation. All valid preparation RSS observations also enter the unchanged full-session hard maximum.
  - Added strict Stage Evidence, Summary 2, Assessment 1, QSet 2, and Release Evidence identities plus independent recomputation/attempt binding. English specializes these fields to null. Build reports bind the exact packaged diagnostics contract. The Summary -> Assessment -> QSet/release chain remains acyclic.
  - Split input-preservation and preparation-session concerns out of the qualification runner to keep ownership and source-size guardrails tight. Added focused C++/Node regressions for digest boundaries/errors/model parity/build selection, exact direct diagnostic emission, byte framing/LF timing, two clocks, closed interval joins, partial/no-coverage/privacy failures, ledger identities, and release propagation.
- Changed files or areas: `providers/chinese-funasr/src/{package_integrity,package_integrity_apple,preparation_diagnostics}.*`, `session.cpp`, `main.cpp`, `funasr_engine.*`, `CMakeLists.txt`, Chinese input recipe; new diagnostics/Stage Evidence contracts; `benchmark/{preparation-diagnostics,qualification-preparation,qualification-inputs,rss-sampler,provider-process-session,run-profile-qualification,profile-qualification-evidence,performance-assessment}.mjs`; QSet/release binding owners and schemas; focused build/benchmark/release tests. Implementation source commit `32829080938911f0f46390a3fd2af823e105bd32`.
- Local validation and result: exact pinned-Go `npm run check` passed all source/schema guards, `7/7` Python tests plus compileall, all Go tests/guards, English-v2/Chinese-v2 evidence checks, and `109/109` Node TAP tests. The complete native darwin-arm64 worker built successfully against the exact materialized locked llama.cpp/utf8proc inputs. The new digest owner matched exact 469,331,008-byte and 804,753,280-byte model digests, all fixed-buffer boundary vectors, and injected failure categories. Exact diagnostic and Stage Evidence framing/clock/join/privacy/binding regressions passed. Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run the canonical network-denied package build, pinned-purge 30/30 preparation proof, complete 30/30/100 Chinese qualification, 200-item corpus, current-source English qualification, QSet 2, or Branch Catalog Projection 2. Those remain API/E2E-owned after source Pass. Delivery retains maintained-main integration/repeat/tag/publication/published verification/quarantine; x64/`auto` and desktop remain deferred.

### IR-024 — Reuse canonical Build Input paths in aggregate verification

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin round `CRR-036`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-036-api-f-014-origin.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-016/aggregate/API-F-014-qset-build-input-path-policy-divergence.json`.
- Triggering finding IDs: `CR-F-034`, mapped from `API-REV-016` / `API-F-014` / `API-VOICE-012`; affected `AC-006`, `AC-019`, `AC-021`, `AC-023`. `CR-F-033` / `API-F-013` and `AR-F-014` remain directly resolved by the complete passing API-REV-016 profiles.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-035` source Pass against `IR-023` was withdrawn after both API-REV-016 profiles passed but QSet independent verification rejected the Chinese build-input manifest with a duplicated obsolete path predicate.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-013`, `SR-014`; no solution change required.
- Related architecture-review revision IDs: `ARCH-REV-015`; no architecture change required.
- Related code-review revision IDs: `CRR-035` prior/withdrawn Pass; `CRR-036` current Local Fix.
- Related API/E2E revision IDs: `API-REV-016`; `API-F-014`; `API-VOICE-012`.
- Related delivery revision IDs: `N/A`.
- Why this implementation revision is recorded: `release/evidence/bindings.mjs` independently enforced the obsolete `/^[A-Za-z0-9._/-]+$/` path predicate after materialization and package verification had already accepted the exact 3,152-record Chinese manifest through canonical Build Input Path 1. The duplicate rejected exactly ten authenticated routes containing `()`, `[]`, or `+` and converted an otherwise passing Chinese profile to `qualification-verification-failed`.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-009`, `BEH-010`; `AC-006`, `AC-019`, `AC-021`, `AC-023`. Package/runtime/protocol/provider/model/scoring/resource/qualification/release meanings remain unchanged.
- Implementation delta:
  - Removed the obsolete path regex from the aggregate/profile build binding and introduced no replacement regex.
  - `assertPreservedBuildInputManifest()` retains schema version, nonempty file list, lowercase SHA-256, safe-integer size, and logical mode validation, then delegates the complete path set to canonical `assertBuildInputPathSet()` for normalization, containment, allowed segment syntax, reserved names, uniqueness, and case-collision semantics.
  - Added a production-shaped regression over the exact checksum-bound API-REV-016 Chinese manifest: exact digest `f7bfb8f17fdf52c76d036c082690bda5d488118f491add5793b9e6b6becc2478`, 3,152 records, and the exact ten retained punctuation routes all pass the aggregate binding unchanged.
  - Added aggregate-binding negatives for traversal, exact duplicate, case collision, invalid digest, non-safe-integer size, and invalid mode; existing package-verifier and materialization coverage remains intact.
- Changed files or areas: only `release/evidence/bindings.mjs` and `tests/release/build-input-path-contract.test.mjs`; correction commit `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`.
- Local validation and result: pinned-Go `npm run check` passed source/schema guards, `7/7` Python tests plus compileall, all Go tests/guards, both evidence authorities, and `111/111` Node TAP tests. Focused Build Input coverage passed `6/6`. Every checksum listed by API-REV-016 passed. Prettier and `git diff --check` passed. Commit scope proves no package, builder, runner, matrix, schema/contract, scoring, policy, provider/runtime, input, profile, archive, or retained evidence byte changed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run aggregate QSet or Branch Projection execution. After source Pass, API/E2E may reuse the immutable passing API-REV-016 profile evidence only under CRR-036's exact constraints: keep `sourceCommit` and `runnerCommit` at `32829080938911f0f46390a3fd2af823e105bd32`, record `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a` as `testCommit`, reverify unchanged bytes, regenerate QSet 2, then generate and independently verify Branch Catalog Projection 2. Any broader relevant-byte change requires affected profile rerun.

### IR-025 — Resolve retained fixtures from the archived ticket

- Triggering role, report path, and round: Delivery Engineer; `/Users/normy/autobyteus_org/autobyteus-voice-runtime/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md`; `DR-003`, finalized-main prequalification run `30881048872`, with direct evidence at `/Users/normy/autobyteus_org/autobyteus-voice-runtime/tickets/done/voice-input-runtime-reliability/delivery-evidence/prequalify-30881048872/failure-summary.md` and `workflow.log`.
- Triggering finding IDs: `N/A`; delivery blocker classified `Local Fix / durable test path`. Both profile source/test gates failed before preflight/build/qualification; aggregate failure was consequential.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-037` source Pass, `API-REV-017` Pass, `CRR-038` proportional API-test review Not Applicable, and `DR-002` release authorization were superseded for release execution when Delivery archived the ticket and finalized-main source tests retained two former `tickets/in-progress/...` fixture locations.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-013`, `SR-014`; no solution change required.
- Related architecture-review revision IDs: `ARCH-REV-015`; no architecture change required.
- Related code-review revision IDs: `CRR-037` prior source Pass; `CRR-038` prior API-test review; current re-review pending.
- Related API/E2E revision IDs: `API-REV-017` prior Pass; applicable post-fix validation pending.
- Related delivery revision IDs: `DR-003` current blocker reroute.
- Why this implementation revision is recorded: required ticket archival moved immutable evidence from `tickets/in-progress/voice-input-runtime-reliability` to `tickets/done/voice-input-runtime-reliability`, but two durable tests hard-coded the pre-archive location. Finalized-main workflow run `30881048872` therefore failed the full source/test gate with ENOENT in both profile jobs before any runtime operation.
- Approved behavior or requirement IDs affected: operational/release reachability under `BEH-004` and `BEH-010`; no runtime/provider/model/matrix/protocol/scoring/resource/release meaning changes.
- Implementation delta:
  - Updated `tests/release/build-input-path-contract.test.mjs` to read the exact API-REV-016 Chinese build-input manifest from the finalized `tickets/done/...` location.
  - Updated `tests/scoring/chinese-qualification.test.mjs` to read the exact API-REV-014 Chinese raw results from the finalized `tickets/done/...` location.
  - Preserved both existing exact SHA-256 assertions and all scoring/path-policy expectations. Added no dual lifecycle lookup, fallback, copied evidence, or new test fixture.
  - Based the correction on current `origin/main` `5531e83421dce859f9934c16e006c34cf5291cde`; finalized release-candidate merge remains `a890d22031359f53d94c7c67bf183344fb35d904`.
- Changed files or areas: only `tests/release/build-input-path-contract.test.mjs` and `tests/scoring/chinese-qualification.test.mjs`; source/test correction commit `f5c14ed9e9ad835e33eec20033f625d61d1e0173` (`2` insertions / `2` deletions).
- Local validation and result: the two exact formerly failing test files passed `9/9`. Pinned-Go full `npm run check` passed source/schema guards, `7/7` Python tests plus compileall, all Go tests/guards, both evidence authorities, and `111/111` Node TAP tests. Prettier and `git diff --check` passed. Commit scope proves runtime/provider/model/matrix/workflow/contract/evidence bytes are unchanged.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E or finalized-main prequalification. After source Pass, applicable API/E2E must validate the archived-ticket checkout and return through the required team path before Delivery refreshes/integrates and retries guarded prequalification. Run `30881048872` remains truthful failed history; no tag or release exists. Loaded-host performance remains observational, and x64/Linux/Windows/`auto` plus desktop remain deferred/outside runtime-only v1.0.0 scope.

### IR-026 — Replace Delivery requalification with exact candidate recovery and promotion

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 18 / `ARCH-REV-018`, after Delivery `DR-005` recorded the user's rejection of heavy Delivery requalification and architecture rounds 16–18 resolved the exact-source bridge and recovery-evidence direction.
- Triggering finding IDs: resolved `AR-F-015` and `AR-F-016`; Delivery `DR-005` ownership/availability blocker. No new architecture finding remains.
- Classification: `Design Impact`.
- Prior authoritative result: `IR-025`, `CRR-039`, and `API-REV-018` preserved the accepted runtime/profile result, but `DR-005` cancelled the duplicated heavy release qualification and blocked publication pending a managed, candidate-based release boundary.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-015`, `SR-016`, `SR-017`.
- Related architecture-review revision IDs: `ARCH-REV-016`, `ARCH-REV-017`, `ARCH-REV-018` current Pass.
- Related code-review revision IDs: prior `CRR-039`, `CRR-040`; current source review pending.
- Related API/E2E revision IDs: retained qualification authority `API-REV-017`, preservation proof `API-REV-018`; exact recovery and hosted promotion pending.
- Related delivery revision IDs: `DR-005`.
- Why this implementation revision is recorded: the old production release workflow duplicated API/E2E's complete profile qualification, depended on a temporary personal M1 runner, and was explicitly rejected by the user. The reviewed replacement requires one acyclic exact-byte recovery/candidate authority, a fail-closed Relevant Source Closure decision, and GitHub-hosted Delivery that only verifies/composes/publishes already-approved bytes.
- Approved behavior or requirement IDs affected: new `BEH-013`, `R-022`–`R-024`, `AC-025`–`AC-027`; preserved release-lineage behavior under `BEH-007`, `BEH-010`, `R-008`, `R-014`, `R-017`, `R-019`, `R-020`, and `AC-010`, `AC-017`, `AC-019`, `AC-021`–`AC-023`. `BEH-001`–`BEH-012` runtime/package/profile meanings remain unchanged.
- Implementation delta:
  - Added the sole managed-Apple-Silicon recovery workflow/controller. It checks out exact qualified source `32829080938911f0f46390a3fd2af823e105bd32`, authenticates reviewed runner/input/toolchain/network authority, executes exactly one package build per profile, and accepts only the exact API-REV-017 archive size/SHA identities. It never starts providers or runs corpus/lifecycle/performance qualification.
  - Implemented exact immutable creation order: eight raw recovery members, raw-only eight-line checksum manifest, then Qualified Archive Recovery Result 1 binding that completed manifest. Raw verification cross-binds runner/environment, checkout, commands, inputs, profiles, archives, and bounded logs.
  - Added hosted candidate promotion and strict Qualified Release Candidate 1 / Promotion Record 1 contracts. Candidate assembly independently rehashes the exact 19 members, both opaque archives, accepted QSet/projection/API manifests, recovery manifest/Result/raw set, and frozen source closures; missing, extra, reverse, self, drifted, and wrong-head cases fail.
  - Added Relevant Source Closure 1 and Candidate Applicability 1 with canonical Git object/mode/blob identities, frozen profile/qualification closures, strictest change classification, ancestry proof, unknown fail-closed, and no override.
  - Replaced `.github/workflows/release-voice-runtime.yml` cleanly with hosted `pretag|publish`. It verifies one exact candidate pointer and applicability, composes Release Evidence 2 -> Catalog 3 -> Pre-Tag Manifest 2, publishes exactly two archives plus three metadata files, re-downloads every byte, and records separate published verification/quarantine without deleting or rewriting the tag.
  - Removed obsolete Delivery `prequalify`, self-hosted/personal M1, build/materialization, provider/corpus/performance, purge, caffeinate, and aggregate profile paths. Updated stale workflow-focused test assertions and added the focused `check:release-pipeline` facade without changing dependencies.
- Changed files or areas: new recovery/promotion workflows; recovery/candidate/applicability schemas and owners; Relevant Source Closure policy/evaluator; candidate-derived Release Evidence/Catalog/Pre-Tag/qualification owners; hosted release workflow; focused release tests/tooling. Source commits `74d0c9f6ea6f5806d1baafe949b5c500e2123c70` and executable-mode preservation `b238f967cfee8be445808ac9499a91533bb7d58e`.
- Local validation and result: focused `npm run check:release-pipeline` passed 21/21 Node tests and strict source/schema checks. Exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go tests/guards, English-v2/Chinese-v2 evidence checks, and `131/131` Node TAP tests. Changed JSON parsing, Prettier, changed implementation source-size guard, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not recover actual archives, use a managed runner, promote a candidate, run API/E2E, create a Promotion Record/applicability/pre-tag bundle, merge, tag, or publish. The clean-cut removal of two obsolete workflow assertions touches paths currently classified as aggregate authority, so Relevant Source Closure truthfully returns `aggregate-api-renewal-required` until downstream API/E2E resolves that authority; no override or relabeling was added. Exact historical input/toolchain availability, managed capacity, artifact retention, hosted capacity, candidate applicability, publication, and downloaded-byte identity remain downstream fail-closed gates. Full profile qualification is not repeated unless the closure decision requires it.

### IR-027 — Make source admission and recovery outcomes authoritative

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 19 / `ARCH-REV-019`, resolving the source/contract findings in Code Reviewer `CRR-041` at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`.
- Triggering finding IDs: `CR-F-035`, `CR-F-036`, `CR-F-037`.
- Classification: `Design Impact`.
- Prior authoritative result: `CRR-041` / `Fail — Local Fix` against `IR-026`; API/E2E paused.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-018`.
- Related architecture-review revision IDs: `ARCH-REV-019` current Pass; `ARCH-REV-018` preserved.
- Related code-review revision IDs: `CRR-041`; current re-review pending.
- Related API/E2E revision IDs: retained `API-REV-017`, `API-REV-018`; focused aggregate renewal pending.
- Related delivery revision IDs: `DR-005`.
- Why this implementation revision is recorded: `IR-026` entered recovery without one complete Relevant Source Closure decision, stale coverage incorrectly required current source to equal frozen qualification authority, and partial/pre-build failures were projected through an all-pass Result shape. SR-018 establishes a complete preliminary admission, an explicit aggregate-renewal transition, and truthful closed recovery outcomes before candidate promotion.
- Approved behavior or requirement IDs affected: `BEH-007`, `BEH-013`; `R-022`–`R-024`; `AC-025`–`AC-027`. `BEH-001`–`BEH-012` runtime/package/profile meanings remain unchanged.
- Implementation delta:
  - Extended the sole `release/source-closure.mjs` owner to compute and validate a canonical Preliminary Source Admission: accepted ancestry, every A/M/D/R row, both rename paths, strict categories, changed-list SHA-256, accepted/reviewed Profile and Qualification closure snapshots, equality flags, and the exact four-way decision.
  - Made the recovery controller compute admission before checkout materialization, environment construction, network checks, or package work. The current source truthfully retains `aggregate-api-renewal-required`; blocked evidence uses zero attempted/completed work and terminates non-Pass.
  - Added closed `succeeded`, `failed`, and `unattempted` profile variants plus derived two-row counts. Sequential first-profile failure leaves the second profile explicitly unattempted; exact identity mismatch is failed/rejected, never Pass.
  - Made raw verification compare profile projections deeply and candidate promotion independently recompute admission. Promotion Git-resolves and byte-binds Aggregate API Renewal authority and accepts only a complete two-profile exact-match Pass.
  - Replaced stale current-equals-frozen coverage with separate frozen-base reproduction and current-transition assertions. Added A/M/D/R/rename, ancestry, unknown-path, pre-build, first-profile, mismatch, raw/Result, aggregate-authority, and admission-omission regressions.
  - Preserved the exact eight raw recovery members, the one-way manifest/Result order, the exact 19 candidate members, API-REV-017 archive identities, executable controller mode, no-retest/no-personal-runner boundary, and hosted Delivery boundary.
- Changed files or areas: Relevant Source Closure/applicability policy and owner; recovery controller/build/outcome/result/raw verification; candidate/aggregate authority and promotion workflow; strict recovery/candidate/aggregate schemas; focused release tests/tooling. Source commits `5cc258b62dc862af5f901313f9f5cd5bda91a957` and `95694f64d0d731d915f7b11688b2496b42927ef0`.
- Local validation and result: final focused `npm run check:release-pipeline` passed 31 tests plus strict source/schema checks. Exact pinned-Go full `npm run check` passed source guards, `7/7` Python tests plus compileall, all Go tests/guards, English-v2/Chinese-v2 evidence checks, and `141` Node TAP tests. Authored Prettier, executable-mode, changed-source size, and `git diff --check` checks passed. A stale incomplete temporary Go root was rejected fail-closed before the exact locked archive was re-extracted and used for the passing full run.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not create the Aggregate API Renewal Record, run API/E2E, recover/build archives, start providers, run corpora/lifecycle/performance/30/30/100 qualification, promote a candidate, merge, tag, or publish. Current recovery intentionally remains blocked at `aggregate-api-renewal-required`. After source Pass, API/E2E must create and commit the zero-profile renewal record; only a separate later reviewed policy/controller commit may accept that exact Git authority and yield `reuse-permitted`.

### IR-028 — Bind Aggregate API Renewal authority to every promotion subject

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-042`, with focused evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-042-qualified-recovery-rework-review.md`.
- Triggering finding IDs: `CR-F-038`. `CR-F-035`, `CR-F-036`, and `CR-F-037` remain resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-042` / `Fail — Local Fix` against `IR-027`; API/E2E paused.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-018`.
- Related architecture-review revision IDs: `ARCH-REV-019` current Pass; `ARCH-REV-018` preserved.
- Related code-review revision IDs: `CRR-042`; current re-review pending.
- Related API/E2E revision IDs: retained `API-REV-017`, `API-REV-018`; focused zero-profile Aggregate API Renewal pending.
- Related delivery revision IDs: `DR-005`.
- Why this implementation revision is recorded: candidate promotion loaded the Aggregate API Renewal Record and recomputed a self-consistent reference, but the authority owner did not independently bind the record's declared commits, coverage report, retained profile/archive evidence, and current/prior aggregate identities to admission and the candidate inputs. Schema-valid self-consistent mutations could therefore still promote.
- Approved behavior or requirement IDs affected: `BEH-007`, `BEH-013`; `R-023`; `AC-026`. The exact recovery/candidate closure under `R-022`–`R-024` and `AC-025`–`AC-027` remains preserved; `BEH-001`–`BEH-012` runtime/package/profile meanings remain unchanged.
- Implementation delta:
  - Strengthened the existing singular `release/candidate-authority.mjs` owner to Git-resolve the exact record, validate schema and bytes, recompute the immutable reference, and bind `recordCommit` / promotion commit to Preliminary Source Admission.
  - Added exact source -> test -> record -> promotion lineage verification, including the record's sole-parent relation to the reviewed test commit.
  - Git-resolved and verified the canonical archived API/E2E coverage report by path, Git-blob SHA-256, raw-content SHA-256, and declared API/source/test subjects.
  - Git-resolved both retained API-REV-016 qualification summaries, compared them with record and candidate QSet subjects, and compared the record's archive identities with both candidate archives.
  - Compared current and prior Qualification Set, Branch Projection, and Projection Verification identities and independently recomputed all byte-identity flags.
  - Changed candidate assembly to derive semantic subjects from independently verified candidate inputs and use the aggregate owner's returned verified reference; no second parser, caller assertion, latest lookup, override, fallback, or twentieth candidate member was added.
  - Added 12 schema-valid semantic mutation regressions and one production-shaped temporary-Git-repository success path covering committed record/report/profile evidence and commit lineage.
- Changed files or areas: `release/candidate-authority.mjs`, `release/qualified-release-candidate.mjs`, `tests/release/qualified-candidate-fixture.mjs`, and `tests/release/qualified-release-candidate.test.mjs`; source commit `bbfa803f5b6126635c73e778fb81e0c6acb631f0`.
- Local validation and result: focused candidate coverage passed `27/27`; `npm run check:release-pipeline` passed `45/45`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python tests plus compileall, all Go tests/guards, both evidence authorities, and `155/155` Node TAP tests. Authored-file Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not create the Aggregate API Renewal Record, run API/E2E, recover/build archives, start providers, run profile qualification, promote a candidate, merge, tag, or publish. Current admission truthfully remains `aggregate-api-renewal-required`. After source Pass, focused API/E2E must create and commit the zero-profile renewal record; only a separate later reviewed policy/controller commit may accept its exact Git authority and yield `reuse-permitted`.

### IR-029 — Bind the exact current coverage-report subjects

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-043`, with focused evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-043-aggregate-authority-subject-review.md`.
- Triggering finding IDs: remaining `CR-F-038`. `CR-F-035`, `CR-F-036`, and `CR-F-037` remain resolved.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-043` / `Fail — Local Fix` against `IR-028`; the record/report/profile/aggregate bindings were substantially resolved but arbitrary whole-report substring occurrences could still select a historical API/source as current.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-018`.
- Related architecture-review revision IDs: `ARCH-REV-019` current Pass; `ARCH-REV-018` preserved.
- Related code-review revision IDs: `CRR-043`; current re-review pending.
- Related API/E2E revision IDs: retained `API-REV-017`, `API-REV-018`; focused zero-profile Aggregate API Renewal pending.
- Related delivery revision IDs: `DR-005`.
- Why this implementation revision is recorded: `verifyCoverageReport()` authenticated the whole Markdown file but accepted the record API revision, reviewed source, and reviewed test when each string appeared anywhere. Because the report retains history and an older source remains an ancestor of current tests, a self-consistent record could select valid historical subjects and still promote.
- Approved behavior or requirement IDs affected: `BEH-007`, `BEH-013`; `R-023`; `AC-026`. Runtime/package/profile behavior and the exact recovery/candidate closure remain unchanged.
- Implementation delta:
  - Replaced whole-report substring checks inside the singular aggregate-authority owner with one exact current-subject projection headed `## Aggregate API Renewal Current Subjects`.
  - Required one unique heading and exactly three ordered nonblank declarations: API revision, reviewed source commit, and reviewed test commit. Missing, duplicate, extra, malformed, zero-commit, or reordered projection content fails closed.
  - Compared that parsed projection structurally with the Aggregate API Renewal Record. Historical API/source/test occurrences elsewhere in the authenticated report cannot satisfy the current binding.
  - Updated the candidate fixtures to use the exact projection without adding a second parser, caller assertion, mutable/latest lookup, fallback, schema/workflow field, or candidate member.
  - Expanded the production-shaped temporary Git fixture to contain both valid current and historical report subjects and added a negative that selects the older API/source while preserving exact hashes, direct record parent, source ancestry, profile evidence, and aggregate identities. Verification rejects it specifically at current report subject equality.
- Changed files or areas: `release/candidate-authority.mjs`, `tests/release/qualified-candidate-fixture.mjs`, and `tests/release/qualified-release-candidate.test.mjs`; source commit `50b7e778c5c8b783f3089803b71636ea7fb2a513`.
- Local validation and result: focused candidate coverage passed `28/28`; `npm run check:release-pipeline` passed `46/46`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go tests/guards, both evidence authorities, and `156/156` Node TAP tests. Authored-file Prettier, source-size, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not create the Aggregate API Renewal Record, run API/E2E, recover/build archives, start providers, run profile qualification, promote a candidate, merge, tag, or publish. Current admission remains `aggregate-api-renewal-required`. After source Pass, focused API/E2E must create and commit the zero-profile renewal record with the exact current-subject projection; only a separate later reviewed policy/controller commit may accept its Git authority and yield `reuse-permitted`.

### IR-030 — Accept the exact renewed aggregate authority

- Triggering role, report path, and round: Delivery Engineer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md`; `DR-006` post–Aggregate API Renewal stage gate at corrected checkpoint `4993d503e6b613c5691adffc378a19c07acbc85c`.
- Triggering finding IDs: `N/A — separately reviewed lifecycle transition after the exact Aggregate API Renewal Record was committed and independently accepted`.
- Classification: `Reviewed Transition`.
- Prior authoritative result: `CRR-044` source Pass, `API-REV-019` Pass / 99% with zero profile executions, `CRR-045` proportional test review Not Applicable, and `DR-006` stage-gate Pass. Preliminary Source Admission remained intentionally `aggregate-api-renewal-required` until this separate controller commit.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-018`.
- Related architecture-review revision IDs: `ARCH-REV-019` current Pass; `ARCH-REV-018` recovery/candidate architecture preserved.
- Related code-review revision IDs: `CRR-044`, `CRR-045`; current source re-review pending.
- Related API/E2E revision IDs: `API-REV-019` exact zero-profile Aggregate API Renewal Pass; retained `API-REV-017`/`API-REV-018` profile and preservation authority unchanged.
- Related delivery revision IDs: `DR-006`.
- Why this implementation revision is recorded: SR-018 requires an acyclic two-commit transition. API/E2E first created and committed the exact reviewed renewal authority at `448517cee89e6498c551bcc70aba65ec0bedf97e`; only a separate later policy/controller commit may accept it. This round performs only that second step and proves the sole admission owner independently recomputes `reuse-permitted`.
- Approved behavior or requirement IDs affected: `BEH-007`, `BEH-013`; `R-022`–`R-024`; `AC-025`–`AC-027`. `BEH-001`–`BEH-012` runtime/package/profile meanings remain unchanged.
- Implementation delta:
  - Updated only Qualification Authority `baseCommit` and `treeSha256` in `contracts/release/relevant-source-closure-v1.json` to the exact immutable Aggregate API Renewal Record commit and its exact independently reviewed closure. The Qualification Authority inventory digest and all Profile Authority/policy rules remain unchanged.
  - Changed the current admission regression to Git-resolve the exact record, compare accepted Profile and Qualification closures structurally with that authority, verify ancestry and policy match, require both closures unchanged, retain only permitted classified changes, recompute the canonical changed-path digest, and require exact `reuse-permitted`.
  - Preserved frozen-base reproduction and fail-closed A/M/D/R, both rename paths, ancestry, unknown path, symlink, and case-fold collision coverage.
  - Did not add a parser, authority owner, override, fallback, mutable/latest lookup, schema/workflow field, or candidate member.
- Changed files or areas: `contracts/release/relevant-source-closure-v1.json` and `tests/release/relevant-source-closure.test.mjs`; source commit `2e743600ef67469f3fd1bf2c9078d53c2d053979`.
- Local validation and result: focused source-closure coverage passed `6/6`; `npm run check:release-pipeline` passed `46/46` plus strict release guards; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go tests/guards, both evidence authorities, and `156/156` Node TAP tests. Authored-file Prettier and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run recovery, reconstruct archives, start providers, run corpus/lifecycle/performance/profile qualification, promote a candidate, merge, tag, or publish. `reuse-permitted` does not bypass Source Review. Managed recovery may begin only after source Pass, and all exact archive, candidate, hosted Delivery, publication, and downloaded-byte gates remain fail closed. Loaded-host performance and deferred x64/Linux/Windows/`auto` scope remain unchanged.

### IR-031 — Split runtime hosts from on-demand model assets

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 21 / `ARCH-REV-021` against `SR-021`.
- Triggering finding IDs: resolved design findings `AR-F-017`, `AR-F-018`, and `AR-F-019`.
- Classification: `Design Impact`.
- Prior authoritative result: `IR-030` implemented the accepted aggregate-renewal transition under SR-018; subsequent SR-020/SR-021 replaced the combined-package/recovery target with explicit on-demand model delivery.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-020`, `SR-021` (`SR-021` current).
- Related architecture-review revision IDs: `ARCH-REV-020`, `ARCH-REV-021` (`ARCH-REV-021` Pass).
- Related code-review revision IDs: prior `CRR-044`, `CRR-045`; current source review pending.
- Related API/E2E revision IDs: retained `API-REV-017`–`API-REV-019`; SR-021 coverage investigation/execution pending.
- Related delivery revision IDs: prior `DR-006`; current Delivery not started.
- Why this implementation revision is recorded: SR-021 intentionally replaces redistributed combined host+model archives and managed recovery/candidate release infrastructure with stable model-free runtime hosts, explicit host-authorized on-demand model installation, focused execution-closure reuse, and a standard-hosted nine-asset release.
- Approved behavior or requirement IDs affected: `BEH-001`–`BEH-014`, principally `BEH-004`, `BEH-005`, `BEH-007`–`BEH-010`, `BEH-013`, `BEH-014`; `R-005`, `R-014`, `R-017`, `R-019`, `R-022`–`R-029`; `AC-025`–`AC-035`. Existing Protocol 1/provider/output/scoring/resource meanings remain preserved.
- Implementation delta:
  - Replaced combined package recipes/descriptors/tooling with deterministic Runtime Host Archive 2 construction, verification, Host Source Closure 1, externally recorded Host Build Provenance 2, and embedded per-profile Model Admission Root 1.
  - Added exact Matrix 2, Catalog 4, model manifests/compatibility roots, strict install/host/model/session schemas and Go types, model-tree integrity, and one host-first admission owner.
  - Added the public `voice-model-manager` with authenticated resumable downloads, content-addressed Store 1, atomic Activation State Protocol 1, bounded status snapshots, provider lifetime leases, and strict JSON-line terminal events.
  - Upgraded the one public launcher to Session Config 2, verified external activated model binding, lease-preserving offline worker startup, and no ambient path/model/fallback authority. Providers consume the verified private model root without changing inference behavior.
  - Added Profile Execution Closure 2, Focused Qualification Set 3, Branch Catalog Projection 3, Release Source Admission 3, and the acyclic exact nine-asset standard-hosted release/prepublication/postpublication chain.
  - Removed Catalog 3/Matrix 1, Session Config/launcher plan 1, bundled-model staging, Provider Archive/package v1, active full qualification entrypoints, aggregate recovery/candidate authority/controllers/workflows, and stale compatibility tests.
  - Rewrote README/package scripts for the standalone host/model-manager workflow and source/unit/contract validation.
- Changed files or areas: `build/host-*.mjs`, `build/profile-builders/*-host.mjs`, `contracts/{build,catalog,host,install,launcher,model,package,qualification,release,startup}/`, `hostverify/`, `integrity/`, `modelmanager/`, `modelstore/`, `launcher/internal/`, `packaging/`, `providers/`, `release/`, `.github/workflows/release-voice-runtime.yml`, `tests/`, `tooling/`, `README.md`, and `package.json`; source commit `6dc1aac500a84f50a8808ba9eca2bb15d808779d`.
- Local validation and result: exact pinned-Go `npm run check:release-pipeline` passed `9/9`; exact pinned-Go `npm run check` passed source guards, `7/7` Python plus compileall, all Go tests/guards, both evidence authorities, and `91/91` Node TAP tests. `go vet ./...`, race-enabled host/integrity/launcher/model-manager/model-store/packaging tests, authored Prettier, source-size checks, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E, construct production hosts, download production models, exercise real CDN resume behavior, start providers, run retained offline clips, execute corpora/performance/full qualification, derive focused authorities, dispatch hosted release, merge, tag, or publish. Deterministic whole-archive equality, production install/offline smoke, macOS filesystem/signal/lease interleavings, Execution Closure 2, focused QSet/projection, exact nine-asset publication, and downloaded-byte verification remain fail-closed downstream gates. x64/Linux/Windows/`auto`, alternate models/providers, desktop integration, and personal-runner release infrastructure remain out of scope.

### IR-032 — Harden Catalog 4 admission and on-demand model lifecycle

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-048`, with focused evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-048-on-demand-runtime-source-review.md`.
- Triggering finding IDs: `CR-F-039`, `CR-F-040`, `CR-F-041`, `CR-F-042`, `CR-F-043`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-048` / `Fail — Local Fix` (`8.0/10`) against `IR-031` / `SR-021`; API/E2E paused.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-021` current; `SR-020` superseded.
- Related architecture-review revision IDs: `ARCH-REV-021` Pass; no design reset required.
- Related code-review revision IDs: `CRR-048`; current re-review pending.
- Related API/E2E revision IDs: retained `API-REV-017`–`API-REV-019`; SR-021 API/E2E remains paused pending source Pass.
- Related delivery revision IDs: prior `DR-006`; no current Delivery work.
- Why this implementation revision is recorded: the accepted clean-cut host/model architecture was present, but CatalogResolver admitted an incomplete catalog subject; pathname-based store descendant operations could follow nested ancestor symlinks; cancellation state could become observable before its signal identity; later writers did not collect crash/precommit or replaced unreferenced subjects; and resumable capacity was checked against the full model before authenticating retained partial bytes.
- Approved behavior or requirement IDs affected: Store 1, Catalog 4, Activation State Protocol 1, Model Admission Root 1, `BEH-005`, `BEH-008`–`BEH-010`, `BEH-014`; `R-006`, `R-017`, `R-025`–`R-028`; `AC-028`–`AC-034`. Providers, models, Protocol 1, Session Config 2, host archives, focused release authority, exact nine-asset chain, and legacy removals remain unchanged.
- Implementation delta:
  - Embedded the current Matrix 2 and both current Model Admission roots in the Go authority surface. Catalog resolution now validates the exact release, exact English-then-Chinese two-row catalog, every row's host/model/admission/compatibility/locator identity, and all selected descriptor fields before sibling manifest access, store opening, or network use.
  - Replaced Store 1 descendant pathname mutation/verification with descriptor-relative rooted operations that traverse and verify every ancestor, forbid symlink/special/group-or-world-writable components, reject hard-link aliases, and perform rooted create/read/write/rename/unlink/tree verification and removal without following nested escapes.
  - Packed lifecycle state and accepted signal into one atomic word so cancellation observations cannot see a cancelled state without the exact winning signal. Race regressions cover SIGINT/SIGTERM and exact terminal `130`/`143` behavior.
  - Added bounded later-writer orphan pruning under the writer lock. It snapshots active installations, acquires exclusive installation leases, preserves busy provider subjects, recomputes model references, and removes only unreferenced activation/model/staging subjects; crash/precommit, replacement, lease, and hostile-ancestor cases are covered.
  - Inventories and authenticates retained partials before capacity admission. Capacity now requires only remaining bytes plus bounded metadata and the fixed 64 MiB reserve; completed files and exact valid prefixes are retained, while stale authority/validator records restart fail closed.
  - Preserved one public launcher, provider lifetime leases, offline inference, exact current matrix, runtime-only scope, and removal of Catalog 3/Config 1/bundled-model/managed-recovery compatibility.
- Changed files or areas: `contracts/catalog/current.go`, `contracts/model/current.go`, Catalog 4 schema/builder tests, `modelmanager/internal/{catalog_validation,downloader,install,lifecycle}.go`, `modelstore/{safefs,safetree,verify,partials,prune,store,activation,leases}.go`, launcher store-close ownership, and focused Go/Node regressions; source commit `ad7c402d224690584e2da98ec71a73e8b6d4ca36`.
- Local validation and result: exact pinned-Go `npm run check:release-pipeline` passed `9/9`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go/source/evidence checks, and `91/91` Node TAP tests. `go vet ./...`, `go test -race ./...`, focused race tests, repeated model-manager/model-store tests, Prettier, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E, construct production hosts, download production models, exercise real CDN resume behavior, start providers, run retained offline clips, execute qualification, derive focused authorities, dispatch release, merge, tag, or publish. Actual macOS filesystem/signal/lease interleavings, production-manifest install/resume, offline smoke, deterministic archive equality, Profile Execution Closure 2, and exact nine-asset publication remain fail-closed downstream work. x64/Linux/Windows/`auto`, alternate models/providers, desktop integration, and personal-runner release infrastructure remain out of scope.

### IR-033 — Correct runtime-host builder and verifier composition

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin review `CRR-050`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-050-api-f-016-f-017-origin.md`.
- Triggering finding IDs: `CR-F-044` / `API-F-016`; `CR-F-045` / `API-F-017`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-049` source Pass was superseded by `CRR-050` / `Fail — Local Fix` after `API-REV-022` failed at the host construction/independent-verification prerequisites.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-021`.
- Related architecture-review revision IDs: `ARCH-REV-021` Pass; no requirement/design reset required.
- Related code-review revision IDs: `CRR-049`, `CRR-050`; current re-review pending.
- Related API/E2E revision IDs: `API-REV-022` Fail / 84%; later model/install/runtime/evidence scenarios remain paused.
- Related delivery revision IDs: prior `DR-006`; current Delivery not started.
- Why this implementation revision is recorded: approved Chinese Runtime Host Archive 2 construction deterministically reached a real builder whose resolved-CMake imports addressed the wrong module, and independent verification reached a real extractor whose report exposed an absolute private destination instead of the logical archive-root contract.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-010`, `BEH-013`; `AC-028`; `API-VOICE-018`. Runtime/provider/model/matrix/catalog/store/lifecycle/release behavior is unchanged.
- Implementation delta:
  - Corrected `build/profile-builders/funasr-host.mjs` to import `cmakeConfigureArguments` and `verifyResolvedCmakeConfiguration` from their sole owner, `build/resolved-cmake-configuration.mjs`, while retaining `trustedHostBuildEnvironment` under `build/host-build-environment.mjs`.
  - Changed `packaging/archive.ExtractVerified` to project the already validated `expected.Archive.RootDirectory` into `VerificationReport.hostRoot`; the absolute extraction destination remains operational state and is not published.
  - Added direct Go assertions for exact logical `host` and non-disclosure of the destination.
  - Added production-shaped Node coverage that loads both real host-builder module graphs through their actual entry scripts, asserts the resolved-CMake owner contract, builds a canonical host archive with the real Go tool, and passes its real extractor report through the Host Verification 2 schema/output owner.
  - Preserved `CR-F-039`–`CR-F-043` resolutions, trusted build-environment ownership, strict Host Verification 2 schema, provider/model selection, exact nine-asset release contract, and runtime-only scope.
- Changed files or areas: `build/profile-builders/funasr-host.mjs`, `packaging/archive/safeextract.go`, `packaging/archive/canonicalzip_test.go`, and `tests/build/host-builder-composition.test.mjs`; source commit `4db8bf26708309440c83ec56973250f77e9f1619`.
- Local validation and result: focused real-builder/verifier composition passed `2/2`; exact pinned-Go `npm run check:release-pipeline` passed `9/9`; exact pinned-Go full `npm run check` passed `93/93` Node, `7/7` Python plus compileall, all Go/source/evidence checks; `go vet ./...`, `go test -race ./...`, Prettier, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not rerun API/E2E or production host construction. After Source Pass, API/E2E should resume at Chinese double construction and English/Chinese independent verification; production model install/CDN resume, offline runtime, focused evidence, and release scenarios remain paused until those prerequisites pass. No merge, tag, publication, desktop, alternate target/model, or personal-runner work occurred.

### IR-034 — Assign every host input to exactly one construction owner

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin review `CRR-052`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-052-api-f-018-origin.md`.
- Triggering finding ID: `CR-F-046` / `API-F-018`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-051` source Pass was superseded by `CRR-052` / `Fail — Local Fix` after `API-REV-023` reached the complete Chinese manifest and failed before CMake on an outer-owned authority path.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-021`.
- Related architecture-review revision IDs: `ARCH-REV-021` Pass; no requirement/design reset required.
- Related code-review revision IDs: `CRR-051`, `CRR-052`; current re-review pending.
- Related API/E2E revision IDs: `API-REV-023` Fail at canonical host construction; later host/model/runtime/evidence scenarios remain paused.
- Related delivery revision IDs: prior `DR-006`; current Delivery not started.
- Why this implementation revision is recorded: the inner builders received the complete authenticated input manifest even though the outer assembler later authenticated and staged both host-authority subjects. Chinese rejected those outer-owned paths, while English masked the same ownership mismatch with a broad authority prefix. The complete manifest lacked one explicit single-owner classification at the actual assembler boundary.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `R-005`, `R-025`; `AC-028`; `API-VOICE-018`. Host/provider/model/runtime/release behavior and previous fixes remain unchanged.
- Implementation delta:
  - Moved complete-manifest unused-input ownership enforcement to `host-package-assembler.mjs`, before any builder, native work, or staging. The assembler now independently verifies the input manifest and requires every non-provenance member to have exactly one construction owner.
  - Added immutable profile-specific builder input patterns under `build/profile-builders/host-input-ownership.mjs`; English and Chinese no longer claim any host-authority prefix.
  - Added one frozen exact two-path `ASSEMBLER_HOST_AUTHORITY_INPUTS` authority under `host-package-staging.mjs`. Both ownership classification and `stageHostAuthorities()` reuse that same set.
  - Rejected no-owner, ambiguous two-owner, duplicate-path, missing-authority, unexpected third-authority, broad-authority-prefix, and unrelated-input cases without an ignore, fallback, rename, omission, or relaxed closure.
  - Added exact path-only fixtures from the API-REV-023 authenticated English 48-row and Chinese 3,151-row manifests. Durable tests bind fixture counts/digests, prove each complete path set is closed by its current recipe, validate both profiles, and exercise the negative cases.
  - Included the new profile ownership authority in Host Source Closure 1 and removed the obsolete inner closure helper and its synthetic test.
- Changed files or areas: `build/host-package-assembler.mjs`, `build/host-package-staging.mjs`, `build/host-source-closure.mjs`, `build/profile-builders/{host-common,funasr-host,host-input-ownership}.mjs`, `tests/build/{host-builder-composition,locked-inputs}.test.mjs`, and `tests/fixtures/host-input-ownership/`; source commit `97f3007c2a62e5f48acd5fcc8c26d1e38b099850`.
- Local validation and result: focused real-builder/current-manifest/verifier composition passed `3/3`; the combined focused build tests passed `13/13`; exact pinned-Go `npm run check:release-pipeline` passed `9/9`; exact pinned-Go full `npm run check` passed `93/93` Node, `7/7` Python plus compileall, all Go/source/evidence checks; `go vet ./...`, `go test -race ./...`, Prettier, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not rerun API/E2E or production host construction. After Source Pass, API/E2E must restart at canonical Chinese construction, then independent English/Chinese verification; model install/CDN resume, offline runtime, focused evidence, and release scenarios remain paused until those prerequisites pass. No merge, tag, publication, desktop, alternate target/model, user-state, or personal-runner work occurred.

### IR-035 — Compile the complete Chinese runtime-host worker

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; focused failure-origin review `CRR-054`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-054-api-f-019-origin.md`.
- Triggering finding ID: `CR-F-047` / `API-F-019`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-053` source Pass was superseded by `CRR-054` / `Fail — Local Fix` after `API-REV-024` reached the exact production `voice-provider-worker` target and Apple Clang rejected computed `std::string` digests compared directly with JSON values.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-021`.
- Related architecture-review revision IDs: `ARCH-REV-021` Pass; no requirement/design reset required.
- Related code-review revision IDs: `CRR-053`, `CRR-054`; current re-review pending.
- Related API/E2E revision IDs: `API-REV-024` Fail at canonical Chinese host construction; later independent host verification/model/runtime/evidence scenarios remain paused.
- Related delivery revision IDs: prior `DR-006`; current Delivery not started.
- Why this implementation revision is recorded: the strict session/model JSON values were validated as SHA-256 strings but four computed C++ digest comparisons retained the values as `nlohmann::json`. Existing native tests compiled selected integrity/preparation components rather than the complete production worker translation set, so repository gates passed while the required Chinese host could not compile.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-010`; `R-005`, `R-025`; `AC-028`; `API-VOICE-018`. JSON validation, provider/model selection, runtime protocol, host archive, model admission, and release behavior remain unchanged.
- Implementation delta:
  - Extracted the already-validated expected descriptor SHA-256 and Session Config 2 activation SHA-256 as `std::string` before comparing them with computed file digests.
  - Extracted each already-validated model-file SHA-256 and the activation-bound model-tree SHA-256 as `std::string` before computed-digest comparison. Strict object shape, type, SHA expression, exact activation binding, size, mode, containment, and closure checks remain in force.
  - Added a deterministic 302 KiB compile-input archive containing only the exact locked llama.cpp/nlohmann headers and utf8proc header/C source required by the production worker translation set. Its manifest binds archive and file SHA-256, Git blob identities, source revisions/tree IDs, and existing MIT notice subjects.
  - Added Apple-native coverage that derives the exact translation-unit list from the production CMake `voice-provider-worker` target, rejects any list or warning-policy drift, authenticates the live Xcode clang++ alias/version/SDK, and compiles every production C++ translation unit plus utf8proc C with `-Wall -Wextra -Werror` and syntax-only emission.
  - Updated the Chinese Host Build Input Recipe 2 size/SHA-256 binding for the corrected `session.cpp`; no external input, provider/model, schema, fallback, target, or threshold changed.
- Changed files or areas: `providers/chinese-funasr/src/session.cpp`, `build/input-recipes/chinese-host-darwin-arm64-v2.json`, `tests/build/chinese-worker-native-compile.test.mjs`, and `tests/fixtures/chinese-worker-native-headers-v1/`; source commit `b88c230663eb96e0def8c869b095ea858b0ff50b`.
- Local validation and result: focused Apple-native complete translation-set compilation passed `1/1`; exact pinned-Go `npm run check:release-pipeline` passed `9/9`; exact pinned-Go full `npm run check` passed `94/94` Node with no skips, `7/7` Python plus compileall, all Go/source/evidence checks; Prettier, recipe byte/hash binding, direct corrected-session Apple syntax compilation, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E, link the complete production target against freshly built locked llama.cpp libraries, construct archives, install models, start providers, execute clips/qualification, derive focused authorities, dispatch release, merge, tag, or publish. After Source Pass, API/E2E must restart at canonical Chinese construction and prove the real target compiles/links plus deterministic host equality before independent host verification and later scenarios. No desktop, alternate target/model, user-state, or personal-runner action occurred.

### IR-036 — Close the acyclic production release-admission chain

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 22 / `ARCH-REV-022`, following Delivery `DR-008`.
- Triggering finding IDs: `DR-008` final-main Admission 3 self-reference and absent production admission bundle; `ARCH-REV-022` has no open architecture finding.
- Classification: `Design Impact`.
- Prior authoritative result: `DR-008` / `Blocked — Design Impact`; previously reviewed runtime source/API authority remains `CRR-055 Pass`, `API-REV-025 Pass / 97%`, and `CRR-056 Not Applicable`.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-022`.
- Related architecture-review revision IDs: `ARCH-REV-022` Pass.
- Related code-review revision IDs: prior `CRR-055`, `CRR-056`; current review pending.
- Related API/E2E revision IDs: `API-REV-025` Pass; exact repository-resident Production Admission Bundle 1 promotion remains pending.
- Related delivery revision IDs: `DR-008` Blocked.
- Why this implementation revision is recorded: the active release admission required its committed record to name the later workflow checkout containing it and the six production authority files were absent. SR-022 replaces that impossible self-edge with one acyclic `F -> D -> R -> W` authority chain and explicit API/E2E promotion ownership.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-013`; `R-014`, `R-019`, `R-022`–`R-024`, `R-029`; `AC-010`, `AC-022`, `AC-025`–`AC-027`, `AC-035`. Runtime/provider/model/Protocol/archive contents, qualification thresholds, exact matrix, nine assets, desktop, and publication behavior remain unchanged.
- Implementation delta:
  - Added Release Source Admission 4 assembly and strict schema. Admission binds only `F/D`, the policy/current matrix, complete `F..D` source classification, five exact focused authorities, and equal ordered focused/admitted closure subjects; it has no self, `R`, `W`, or later-artifact edge.
  - Added the API/E2E-only promotion controller and shared exact authority contract. It requires clean `HEAD == D`, validates the five focused artifacts plus API checksum authority, copies bytes without normalization, requires six absent fixed destinations, and stages exactly six `A` rows without committing.
  - Replaced the hosted verifier with the sole `W` owner. It requires clean `HEAD == origin/main == W`, derives the unique one-parent/direct-child exact-six-add `R`, verifies protected blobs and every later `R`-bearing parent edge, revalidates Admission-bound policy/matrix/authorities and `F..D`/`R..W` decisions, compares both checkout closures, and emits Release Admission Verification 1.
  - Updated host construction, Hosted Host Construction Result 3, model-manifest admission, Release Qualification Evidence 4, and the standard-hosted workflow to consume the verified lineage. Host Build Report 2 receives only `W`; exact focused-to-hosted archive equality and the nine-asset chain remain unchanged.
  - Removed active Admission 3 / Hosted Result 2 schemas/readers and added production-shaped real-Git positive/negative coverage, including later docs, archive impact, mutation/revert, integration merge, policy/closure drift, checksum drift, schema reverse/self edges, and a seventh path. Historical ticket evidence is untouched.
- Changed files or areas: release admission/source-closure/promotion/verifier/construction/evidence owners; current release schemas; `.github/workflows/release-voice-runtime.yml`; focused release contract fixtures/tests; source commit `8111f3fe27f2d551676fd891f1f98ac2615da526`.
- Local validation and result: exact pinned-Go `npm run check:release-pipeline` passed `15/15`; exact pinned-Go full `npm run check` passed `100/100` Node, `7/7` Python plus compileall, all Go/source/evidence checks; focused final admission/result tests passed `8/8`; changed-file Prettier, active-v3 absence search, source-size assessment, and `git diff --check` passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not generate production Admission 4, invoke/stage/commit Production Admission Bundle 1, create `R`, integrate maintained-main `W`, run API/E2E, construct hosts, run provider/model/corpus/qualification work, merge, tag, publish, or modify desktop/user state. API/E2E must create the exact six-file direct-child promotion and return it through Code Review; Delivery must later verify exact `W`, closure/archive equality, and publication. x64/Linux/Windows/`auto`, alternate providers/models, desktop integration, and personal-runner release infrastructure remain out of scope.

### IR-037 — Resolve source impact by exact policy specificity

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 24 / `ARCH-REV-024`, following Code Reviewer `CRR-057`.
- Triggering finding IDs: `CR-F-048`; resolved `AR-F-020`.
- Classification: `Design Impact`.
- Prior authoritative result: `CRR-057` / `Fail — Design Impact`; Policy 2 made five release-policy tests aggregate-impact on the real IR-036 `F..D`, and SR-023 initially omitted its own mandatory regression fixture from the closed exception set.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-023`, `SR-024` (`SR-024` current).
- Related architecture-review revision IDs: `ARCH-REV-023` Fail, `ARCH-REV-024` Pass.
- Related code-review revision IDs: `CRR-057`; current source review pending.
- Related API/E2E revision IDs: `API-REV-025` remains the exact accepted focused authority; no new API/E2E execution occurred.
- Related delivery revision IDs: `DR-008` remains blocked pending reviewed promotion and hosted verification.
- Why this implementation revision is recorded: Policy 2 flattened exact and prefix matches, so the broad `tests/release/` aggregate guard overrode five reviewed release-policy/contract tests. The first Policy 3 proposal also omitted the mandatory historical regression fixture, which would have blocked its own addition. SR-024 defines one exact-before-prefix owner and a closed eight-path test/fixture exception set.
- Approved behavior or requirement IDs affected: `BEH-007`, `BEH-013`; `R-008`, `R-014`, `R-022`–`R-024`, `R-029`; `AC-010`, `AC-025`–`AC-027`, `AC-035`. Runtime/provider/model/Protocol/archive/asset/desktop behavior is unchanged.
- Implementation delta:
  - Replaced active Relevant Source Closure Policy 2 with Policy 3 and updated the sole reader/check gate/test fixtures. No active v2 policy or test reader remains.
  - Changed `classifySourcePath()` to select all exact matches when present, otherwise matching prefixes, then choose the unchanged strictest precedence only within that specificity. Unknown paths and both independently resolved rename endpoints remain fail-closed.
  - Added exact release-only ownership for the five CRR-057 release tests/helper, removed-v2/current-v3 policy test filenames, and mandatory IR-036 fixture. Kept all other `tests/release/**` paths aggregate by prefix.
  - Added exact aggregate protection for the four aggregate-authority producers and Focused Qualification Set 3 schema so broader release prefixes cannot weaken them.
  - Added a frozen 213-row CRR-057 fixture with 20 release-only and 193 documentation-only rows and expected `reuse-permitted`; direct tests prove its own add/modify classification and an unlisted sibling's aggregate classification.
  - Added focused specificity/strictness/rename/protection coverage and a committed production-shaped test that assembles Admission 4 over the actual current `F..D` using the exact five API-REV-025 subjects and retained equal host closures.
- Changed files or areas: `contracts/release/relevant-source-closure-v3.json`, `release/source-closure.mjs`, `tests/release/relevant-source-closure-v3.test.mjs`, `tests/release/fixtures/ir-036-f-to-d-changed-paths-v1.json`, current release fixtures/check tooling, and `package.json`; source commit `3e8474213f79b26cc7a68c4dd42d2994ebf2d42d`.
- Local validation and result: `npm run check:release-pipeline` passed `19/19`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go/evidence checks, and `104/104` Node TAP tests. Focused Policy 3/historical/current Admission coverage, Prettier, and commit diff checks passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not create production Admission 4, promote the exact six-file direct-child `R`, run API/E2E/product qualification, build release hosts, integrate maintained main, tag, publish, or edit desktop/user state. Source Review must independently reproduce the actual current admission result before API/E2E may promote authority; any broader relevant-byte change invalidates reuse and remains fail-closed.

### IR-038 — Select the exact hosted release toolchain and retain early failure evidence

- Triggering role, report path, and round: Delivery Engineer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-revision-record.md`; `DR-010`, with failure evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/delivery-evidence/release-31420271551/failure-summary.md`.
- Triggering finding IDs: `N/A` — Delivery-classified `Local Fix / release-host tool selection and early failure evidence`.
- Classification: `Local Fix`.
- Prior authoritative result: maintained-main finalization passed, but hosted release run `31420271551` failed before hydration because mutable image defaults exposed CMake 4.4.0 and selected Xcode 26.6 / SDK 26.5 instead of the exact reviewed CMake 4.2.0 and installed Xcode 26.1.1 / SDK 26.1. The environment owner threw before producing an audit member, so the always-run upload also failed on an empty directory.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-024` current; no design revision required.
- Related architecture-review revision IDs: `ARCH-REV-024` Pass; no new finding.
- Related code-review revision IDs: `CRR-059` is the retained release-authority baseline; current review pending.
- Related API/E2E revision IDs: `API-REV-026` retained authority; applicable hosted tool/audit validation remains downstream.
- Related delivery revision IDs: `DR-010`.
- Why this implementation revision is recorded: the one standard-hosted workflow correctly enforced the tool lock but never explicitly selected/provisioned that lock, and its external audit retention began after the failing boundary. The correction must keep the lock and infrastructure boundary intact while making early non-pass evidence durable and truthful.
- Approved behavior or requirement IDs affected: `BEH-013`; `R-014`, `R-023`, `R-024`; `AC-026`, `AC-027`, `AC-035`. Runtime/provider/model/Protocol/archive/nine-asset/desktop behavior is unchanged.
- Implementation delta:
  - Added one release-owned hosted toolchain selector that requires `darwin-arm64` / `macos-26`, selects the exact installed Xcode 26.1.1 directory with noninteractive `xcode-select`, verifies build 17B100, SDK 26.1 containment and SDKSettings digest, downloads the exact versioned official CMake 4.2.0 archive over HTTPS, and verifies both archive and ordinary executable SHA-256 before exposing the executable path.
  - Added a strict Hosted Toolchain Selection 1 audit contract and kept the existing Host Build Environment 2 owner as the independent downstream authority; no default/brew/latest/alternate runner path exists.
  - Split tool selection from input hydration so any tool failure precedes cache/network input mutation. The workflow passes only the selector-owned CMake step output to environment capture.
  - Added a core-only Hosted Release Audit 1 owner and strict schema. The workflow seeds an atomic uploadable audit immediately after checkout, then finalizes exact ordered GitHub step outcomes into `succeeded|failed|cancelled|unattempted`, first-primary-failure category, and Pass-only completion before the always-run upload.
  - Extended the existing exact release-owned host contract test and release schema gate with workflow order/output, correct lock, wrong runner/digest rejection, early tool failure retention, later-unattempted projection, and terminal Pass coverage.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `release/hosted-{toolchain,release-audit}.mjs`, `contracts/release/hosted-{toolchain-selection,release-audit}-v1.schema.json`, `tests/release/host-release-contracts.test.mjs`, and `tooling/check-release-pipeline.mjs`; source commit `b5d3c2fb8cd59c7fe40fa06546f3d6ae1b123636` on base `a486c998481a4d6649d3245c24f0c8e954785594`.
- Local validation and result: focused tool/audit tests passed; `npm run check:release-pipeline` passed `22/22`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go/evidence checks, and `107/107` Node TAP tests. Prettier, strict schema compilation, source-size guards, commit/diff checks, exact retained CMake archive/executable rehashing, and Policy 3 classification passed. All seven source paths are release-pipeline-only and the source decision is `reuse-permitted`.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not dispatch a hosted workflow, mutate system tool selection outside test fakes, hydrate inputs, build hosts, run providers/product qualification, download models, tag, publish, or edit desktop/user state. Source Review must pass before applicable API/E2E validates the real hosted tool/audit boundary; Delivery alone owns any later release retry. Exact tool unavailability remains a deliberate pretag block with no fallback.

### IR-039 — Bind semantic host package input and renew focused authority

- Triggering role, report path, and round: Architecture Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`; round 25 / `ARCH-REV-025`, following Delivery `DR-012` and hosted run `31425696064`.
- Triggering finding IDs: `N/A` — DR-012 Design Impact resolved at solution/design authority by `SR-025`; no new `AR-F-*` finding.
- Classification: `Design Impact`.
- Prior authoritative result: Delivery run `31425696064` passed source admission, exact hosted tool selection, and hydration, then failed before compilation because raw `package.json` in Host Source Closure treated a release-test command-facade filename change as archive content. The stale API-REV-025 production admission bundle therefore could not authorize the corrected producer.
- Current authoritative result: `Implementation Complete — Ready for Code Review`.
- Related solution revision IDs: `SR-025` current; `SR-024`, `SR-022`, and `SR-021` preserved foundations.
- Related architecture-review revision IDs: `ARCH-REV-025` Pass.
- Related code-review revision IDs: `CRR-059` retained prior release-authority review; current source review pending.
- Related API/E2E revision IDs: `API-REV-025` immutable historical focused evidence but superseded for current host/archive authority; `API-REV-027` hosted failure context; focused renewal pending.
- Related delivery revision IDs: `DR-012` / hosted run `31425696064` Fail — Design Impact.
- Why this implementation revision is recorded: SR-025 replaces raw non-lifecycle manifest byte hashing with one strict semantic package-install/direct-invocation authority inside the sole Host Source Closure producer. Because that producer and embedded closure identity change, current focused host/archive evidence must be renewed rather than patched or reused.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-013`; `R-014`, `R-018`, `R-024`, `R-029`, `R-030`; `AC-006`, `AC-010`, `AC-035`, `AC-036`. Policy 3, provider/model/runtime/Protocol/on-demand model behavior, archive contract, exact matrix, hosted runner/tool lock, nine assets, and desktop boundary remain unchanged.
- Implementation delta:
  - Added one fail-closed Host Package Input Contract 1 owner. It parses repository `package.json`, exact lock, selected recipe, Host Build Environment 2, and actual workflow; requires lockfile v3, exact dependency and Node-engine agreement, the supported package shape, absence of lifecycle scripts, exact live Node identity, exactly one `npm ci --ignore-scripts`, and exactly one direct construction controller.
  - Removed raw `package.json` from Host Source Closure repository membership. The sole closure producer invokes the contract before rows, embeds its strict canonical install/invocation projection, and retains exact `package-lock.json`, validator/controller/assembler/verifier/recipe/tool/input authorities without a caller-supplied projection or raw-hash fallback.
  - Tightened controller, assembler, and verifier argument parsing to exact ordered contract-owned lists. Child invocations receive only the reviewed deterministic environment keys with fixed locale/timezone, empty PATH, and private temporary state.
  - Added DR-012 F/W positive fixtures and production-shaped negative fixtures for dependency, engine, lock, unsupported install keys, lifecycle scripts, recipe/environment/Node identity, workflow/npm indirection, arguments, and closure-source drift.
  - Removed the exact six stale files from `release/admission/` while preserving immutable API-REV-025 and DR-012 ticket evidence.
- Changed files or areas: `build/host-package-input-contract.mjs`; Host Source Closure producer/schema; host controller/assembler/verifier; workflow-contract and closure tests; DR-012 fixtures; release admission fixture/schema gate; exact six `release/admission/` removals; source commit `d334c474c264bb59594f5c03ef6246d71d87b707` on base `27effcb6238b11ff3e41ad2473adf4e6d9fa6586`.
- Local validation and result: focused host-package/closure/release contract tests passed `12/12`, and the focused strict-schema/admission-verifier set passed `13/13`. The IR-039 handoff incorrectly reported the required aggregate gates as passing: `CRR-063` independently established `npm run check:release-pipeline` failed `21/22` and the full Node TAP gate failed `111/112` because the actual-current admission test still expected stale API-REV-025 acceptance. Python `7/7` plus compileall and all Go/source/evidence portions passed. The incorrect full-pass claim is superseded by `CRR-063` and corrected in `IR-040`.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E, build production hosts twice, install production manifests, download models, start providers, run retained clips/corpora/performance/full qualification, compare Profile Execution Closure 2, create Focused QSet 3/Projection 3/Admission 4, promote the exact-six `R`, dispatch release, merge, tag, publish, or edit desktop/user state. After Source Pass, API/E2E owns those focused renewal steps; any Execution Closure 2 mismatch routes to full qualification. Delivery owns later integrated-state and standard-hosted release verification only.

### IR-040 — Close exact package-manager admission and retain focused-renewal truth

- Triggering role, report path, and round: Code Reviewer; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-report.md`; `CRR-063`, with evidence at `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/CRR-063-host-package-input-source-review.md` and `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery/tickets/done/voice-input-runtime-reliability/code-review-evidence/crr-063/SHA256SUMS.txt`.
- Triggering finding IDs: `CR-F-049`, `CR-F-050`.
- Classification: `Local Fix`.
- Prior authoritative result: `CRR-063` / `Fail — Local Fix`. The actual-current Admission 4 test contradicted SR-025 by expecting historical API-REV-025 reuse, and the semantic contract accepted an additional package-manager installation while emitting the unchanged declared-lock projection. API/E2E remained paused.
- Current authoritative result: `Implementation Complete — Ready for Code Re-review`.
- Related solution revision IDs: `SR-025`.
- Related architecture-review revision IDs: `ARCH-REV-025` Pass; no design reset required.
- Related code-review revision IDs: `CRR-063`; current re-review pending.
- Related API/E2E revision IDs: `API-REV-025` immutable historical evidence and `API-REV-027` hosted failure context; focused renewal remains pending.
- Related delivery revision IDs: `DR-012`.
- Why this implementation revision is recorded: the sole Host Package Input Contract did not exhaustively close package-manager execution, and one durable release test retained the authority expectation that SR-025 explicitly superseded. Both are bounded source/test defects within the reviewed contract.
- Approved behavior or requirement IDs affected: `BEH-004`, `BEH-007`, `BEH-013`; `R-014`, `R-018`, `R-024`, `R-029`, `R-030`; `AC-006`, `AC-010`, `AC-025`, `AC-035`, `AC-036`. Runtime/provider/model/Protocol/archive/assets/desktop behavior remains unchanged.
- Implementation delta:
  - The one contract owner now enumerates commands from workflow `run` scalars, admits exactly one package-manager command with exact tokens `npm ci --ignore-scripts`, rejects additional, altered, alternative, indirect, duplicate, or absent package-manager use, and derives the projected package manager/install arguments from that admitted command.
  - The hosted source gate invokes its release pipeline schema/tests directly with `node`, leaving `npm ci --ignore-scripts` as the sole package-manager operation and retaining the same 22-test gate before admission verification.
  - Durable negatives reproduce the reviewer-injected second install exactly and cover npm script indirection, altered install arguments, and alternate package managers.
  - The actual-current Admission 4 regression now retains the exact historical API-REV-025 subjects as internally equal while requiring and durably writing `focused-qualification-required`; it asserts the new contract source is classified focused rather than claiming stale production acceptance.
  - Corrected the IR-039 validation record to preserve the `CRR-063` gate failures rather than the inaccurate prior full-pass claim.
- Changed files or areas: `.github/workflows/release-voice-runtime.yml`, `build/host-package-input-contract.mjs`, `tests/build/host-package-input-contract.test.mjs`, `tests/release/relevant-source-closure-v3.test.mjs`; source commit `a66a7eeb604a94445070b7573abe5a5d6238efc1` after IR-039 source `d334c474c264bb59594f5c03ef6246d71d87b707`.
- Local validation and result: the combined focused contract/closure/release/admission set passed `18/18`; `npm run check:release-pipeline` passed `22/22`; exact pinned-Go full `npm run check` passed source guards, `7/7` Python plus compileall, all Go/source/evidence checks, and `112/112` Node TAP tests with no failures or skips. Changed-file Prettier, `git diff --check`, staged diff checks, source-size audit, and source commit checks passed.
- Next recipient or routing: `code_reviewer`.
- Remaining limitations or risks: implementation did not run API/E2E, perform production host construction/install/offline smoke/Execution Closure comparison, create renewed focused authorities, promote `R`, dispatch release, merge, tag, publish, or touch desktop/user state. API/E2E must remain paused until Source Pass, then owns the exact SR-025 renewal; any Execution Closure 2 mismatch routes to full qualification.
