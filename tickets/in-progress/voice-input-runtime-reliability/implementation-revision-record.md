# Implementation Revision Record

The current code and `implementation-handoff.md` are authoritative. This record identifies the initial implementation baseline and will retain later implementation rounds if rework is requested.

## Revision Index

| Revision ID | Triggering Role / Report / Round                            | Finding IDs                                             | Classification     | Related Revision IDs                                                                                                   | Result                                            |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `IR-001`    | Architecture Reviewer / `design-review-report.md` / round 3 | `N/A`                                                   | `Initial Baseline` | `SR-001`, `SR-002`, `SR-003`; `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`; `CRR-*` N/A; `API-REV-*` N/A; `DR-*` N/A | `Implementation Complete — Ready for Code Review` |
| `IR-002`    | Architecture Reviewer / `design-review-report.md` / round 7 | `AR-F-007`–`AR-F-010`; historical `CR-F-001`–`CR-F-006` | `Design Impact`    | `SR-004`–`SR-006`; `ARCH-REV-004`–`ARCH-REV-007`; `CRR-001`; `API-REV-*` N/A; `DR-*` N/A                               | `Implementation Complete — Ready for Code Review` |

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
