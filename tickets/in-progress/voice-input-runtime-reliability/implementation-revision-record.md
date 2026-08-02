# Implementation Revision Record

The current code and `implementation-handoff.md` are authoritative. This record identifies the initial implementation baseline and will retain later implementation rounds if rework is requested.

## Revision Index

| Revision ID | Triggering Role / Report / Round                            | Finding IDs                                             | Classification     | Related Revision IDs                                                                                                   | Result                                               |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `IR-001`    | Architecture Reviewer / `design-review-report.md` / round 3 | `N/A`                                                   | `Initial Baseline` | `SR-001`, `SR-002`, `SR-003`; `ARCH-REV-001`, `ARCH-REV-002`, `ARCH-REV-003`; `CRR-*` N/A; `API-REV-*` N/A; `DR-*` N/A | `Implementation Complete — Ready for Code Review`    |
| `IR-002`    | Architecture Reviewer / `design-review-report.md` / round 7 | `AR-F-007`–`AR-F-010`; historical `CR-F-001`–`CR-F-006` | `Design Impact`    | `SR-004`–`SR-006`; `ARCH-REV-004`–`ARCH-REV-007`; `CRR-001`; `API-REV-*` N/A; `DR-*` N/A                               | `Implementation Complete — Ready for Code Review`    |
| `IR-003`    | Code Reviewer / `code-review-report.md` / `CRR-002`         | `CR-F-007`–`CR-F-013`                                   | `Local Fix`        | `SR-006`; `ARCH-REV-007`; `CRR-002`; `API-REV-*` N/A; `DR-*` N/A                                                       | `Implementation Complete — Ready for Code Re-review` |

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
