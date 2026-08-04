# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements Doc: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental authorities: `benchmark-protocol.md`, `backend-selection-study.md`, `english-preservation-correction.md`, `chinese-qualification-correction.md`, `current-platform-qualification.md`, `voice-runtime-contract.md`, `cold-preparation-stability-study.md`, and their referenced evidence trees.
- Upstream revisions/reviews: `SR-013`, `SR-014`, `ARCH-REV-015`, `IR-023`, `IR-024`, `CRR-034`–`CRR-037`.
- Retained product source/runner commit: `32829080938911f0f46390a3fd2af823e105bd32`.
- Corrected verifier/test commit: `5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`.
- Implementation artifact/upstream HEAD at handoff: `3916b0646f5a5d487a066057d35f34a651a58f46`.
- Retained API-REV-016 evidence commit: `34c45617284de7890fd7a398fb3c13d215bdb08c`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Current revision / round: `API-REV-017 / 17`.
- Prior result: `API-REV-016 — Fail / 99%` at `API-F-014` in `API-VOICE-012`.
- Latest authoritative result: **`API-REV-017 — Pass / 99%` for the exact two-entry current darwin-arm64 matrix.**

## Investigation And Execution Basis

- Coverage investigation refreshed before execution: `Yes`.
- Authorized plan followed: revalidate immutable API-REV-016 evidence and correction scope -> run the focused canonical path-contract coverage -> regenerate Qualification Set 2 with honest three-commit identity -> generate Branch Catalog Projection 2 -> independently recompute and verify the projection.
- Material deviation: `None`.
- Profile rerun: `No`, as required by `CRR-037`; no package/profile-relevant byte or authority changed.
- Existing coverage decisions revised: `API-F-014` moved from open `Local Fix` to directly resolved. English and Chinese API-REV-016 qualification/profile evidence remains immutable and valid.
- Repository-resident durable API/E2E coverage changed: `No`.
- Reroute required during execution: `No`.

## Compatibility / Legacy Scope Check

- Invalid compatibility or legacy-retention behavior observed: `No`.
- Approved persisted-data transition: `Not Affected`.
- User/desktop state: untouched; this aggregate-only round read retained API-owned evidence and archives and wrote only API-REV-017 evidence.
- Compatibility-only durable coverage added or retained: `No`.

## Changed Boundary And Evidence Matrix

| Scenario / Boundary                 | Requirements / Criteria                                                                     | Actual Surface                                                                             | Result                            | Evidence                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------- |
| retained English profile            | `API-VOICE-003`; `AC-003`, `AC-006`–`011`, `AC-017`, `AC-019`, `AC-020`, `AC-023`           | immutable API-REV-016 Summary/Assessment/archive and 160/160 qualification                 | Pass / reused                     | `api-rev-016/english-darwin-arm64/`; API-REV-017 reuse-impact record |
| retained Chinese profile            | `API-VOICE-004`; `AC-003`, `AC-006`–`011`, `AC-017`, `AC-019`, `AC-020`, `AC-023`, `AC-024` | immutable API-REV-016 Summary/Assessment/archive and 260/260 qualification                 | Pass / reused                     | `api-rev-016/chinese-darwin-arm64/`; API-REV-017 reuse-impact record |
| prior `API-F-014`                   | `API-VOICE-012`; `AC-006`, `AC-019`, `AC-021`, `AC-023`                                     | corrected production QSet verifier over exact retained 3,152-record Chinese input manifest | **Resolved / Pass**               | focused 6/6; QSet 2 functional Pass                                  |
| Qualification Set 2                 | `API-VOICE-012`; exact matrix and one-way evidence bindings                                 | corrected production composer and independent profile verifier                             | **Pass**                          | `aggregate/qualification-set-v2.json`                                |
| Branch Catalog Projection 2         | `API-VOICE-012`; exact two entries/assets, release-neutral projection                       | production projection composer                                                             | **Pass**                          | `aggregate/branch-catalog-projection-v2.json`                        |
| independent projection verification | `API-VOICE-012`; matrix/QSet/assets/entries byte recomputation                              | separately implemented production verifier                                                 | **Pass**                          | `aggregate/branch-catalog-projection-verification-v2.json`           |
| `API-VOICE-005`–`010`               | non-current targets                                                                         | none                                                                                       | Deferred / Outside Current Matrix | approved current-platform scope                                      |

## Repository Coverage Execution

| Command / Action                                                        | Result                                                                                                                                   | Evidence                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `shasum -a 256 -c api-rev-016/SHA256SUMS.txt`                           | Pass; every retained evidence byte exact                                                                                                 | `repository/api-rev-016-retained-checksums.log`                     |
| correction/source scope and post-correction production diff             | Pass; correction is exactly `bindings.mjs` plus its test; no later production-source change                                              | `repository/correction-scope-and-source-integrity.log`              |
| `node --test tests/release/build-input-path-contract.test.mjs`          | Pass, 6/6; exact retained manifest and ten approved punctuation routes accepted; unsafe/collision/digest/size/mode cases remain rejected | `repository/focused-build-input-path-contract.log`                  |
| retained qualification-copy and archive/companion identity verification | Pass; profile evidence copies exact and archive sizes/SHA-256 match summaries                                                            | `repository/retained-profile-and-asset-identity.log`                |
| JSON parse and API-REV-017 checksum verification                        | Pass                                                                                                                                     | `repository/json-parse.log`; `repository/api-rev-017-checksums.log` |

`CRR-037` additionally records the already-reviewed full pinned-Go check: 111/111 Node TAP, 7/7 Python plus all Go/source/schema/evidence checks Pass. API/E2E did not repeat unrelated repository suites because the approved scope was aggregate-only and exact retained checksum/source-impact validation found no profile-relevant change.

## Validation Confidence Scorecard

| Category                                            | Post-Repository | Final | Evidence / Limitation                                                                                       |
| --------------------------------------------------- | --------------: | ----: | ----------------------------------------------------------------------------------------------------------- |
| Requirement and acceptance-criteria proof           |             99% |  100% | both complete retained profiles plus passing QSet and independently verified two-entry projection           |
| Changed-boundary execution directness               |            100% |  100% | exact production verifier/composer/projection/verifier executed                                             |
| Cross-boundary integration realism and mock gap     |             99% |  100% | actual archives, complete real profile evidence, matrix, QSet, asset set, and projection composed together  |
| Environment/configuration/identity/fixture fidelity |             99% |   99% | exact retained bytes and honest source/runner/test identities; performance environment remains loaded-host  |
| Failure/edge/lifecycle/recovery evidence            |            100% |  100% | prior full lifecycle evidence retained; exact prior failure rechecked first and resolved without relabeling |
| User/browser/desktop                                |             N/A |   N/A | runtime-only; no UI claim                                                                                   |
| Durable regression quality                          |             99% |   99% | canonical owner plus exact 3,152-record and unsafe/collision regressions; no API-owned durable edit         |

- Overall post-repository confidence: `99%`.
- Overall final confidence: `99%` (simple average of applicable categories, rounded down to preserve the loaded-host limitation).
- Every critical acceptance criterion in the current two-profile scope directly proven: `Yes`.
- Any applicable category below 90%: `No`.
- Default clean-Pass target met: `Yes`.
- Confidence-limiting residual: performance observations are `loaded-host-observation`, not controlled certification. This does not change functional acceptance.

## Broader Validation Decision And Execution

- Decision: `Required / Executed / Pass`.
- Selected mode: production aggregate composition over immutable exact-package qualifications/assets, followed by production branch projection and independent byte-level recomputation.
- Execution inputs: `/private/tmp/autobyteus-voice-api-e2e-r16-20260804-v3/output/{qualifications,assets}`.
- QSet command: `node release/evidence/qualification-set.mjs --qualifications ... --assets ... --source-commit 3282908... --runner-commit 3282908... --test-commit 5c8afe4... --output .../qualification-set-v2.json`.
- Projection command: `node release/branch-catalog-projection.mjs --qualification-set ... --assets ... --output .../branch-catalog-projection-v2.json`.
- Independent verification command: `node release/verify-branch-catalog-projection.mjs --projection ... --qualification-set ... --assets ... --output .../branch-catalog-projection-verification-v2.json`.
- All three commands exited `0`.

### Qualification Set 2

- Functional decision: `pass`; both English and Chinese independent verification rows are `pass`.
- Performance assessment: `loaded-host-observation`; no controlled-performance claim is made.
- Identity: `sourceCommit = runnerCommit = 32829080938911f0f46390a3fd2af823e105bd32`; `testCommit = 5c8afe4c5ba3843d9f813d9b48a0f05c1e433f9a`.
- QSet SHA-256: `c5eaedef8b4790f0f267ac378eba033319091ebc3a4ef29ddd931c1f123b0003`, byte-identical to the independent `CRR-037` production probe.

### Branch Catalog Projection 2

- Exactly two entries: English `darwin-arm64` and Chinese `darwin-arm64`.
- Exactly two archive assets with preserved SHA-256 and size; asset-set SHA-256 `47d79c0fdf23e7f67aa209d278f5f86364f53692801a3968b7943701f35aae05`.
- Projection SHA-256: `bcc3b1c2f3afc42fa0861adcdd3558ad0779ecf7f3c77c370501679a50bbeddd`.
- Independent verifier: `decision: pass`, `failureCategory: null`; it recomputed release matrix, QSet, projection, entries, and asset set and matched the projection bytes.

## Platform / Runtime And Desktop Decision

- Passed scope: exact English and Chinese `darwin-arm64` packages on the governed M1 current platform.
- Performance: retained `loaded-host-observation`; all recorded profile p95 references passed, but no controlled certification is claimed.
- Deferred/outside current matrix: darwin-x64, linux-x64, win32-x64, and `auto`; none is advertised or counted as passed.
- Browser/Electron: `N/A`; no desktop application was launched or modified.
- Chinese 4-GiB support evidence remains limited to the exact package/host and is not generalized to lower-memory, concurrent, x64, auto, or other targets.

## Lifecycle / Persisted Data

- Approved persisted-data decision: `Not Affected`.
- No migration, compatibility reader, user state, desktop installation, or `~/.autobyteus` path was exercised or changed.
- Full package lifecycle/recovery/offline/read-only/no-mutation evidence is preserved unchanged in API-REV-016 and was content-bound into the passing aggregate.

## Durable Coverage Changed

- Repository-resident durable coverage added, updated, or removed by API/E2E: `No`.
- Paths added/updated/removed: none.
- Proportional successful test-code review: `Not Applicable`; the only durable test change belongs to reviewed IR-024 and already passed CRR-037.

## Evidence

- Current aggregate evidence: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-017/`
- Reuse/impact record: `api-rev-017/repository/API-VOICE-012-aggregate-only-reuse-impact.json`
- Prior-failure resolution: `api-rev-017/aggregate/API-F-014-resolution.json`
- Qualification Set 2: `api-rev-017/aggregate/qualification-set-v2.json`
- Branch Catalog Projection 2: `api-rev-017/aggregate/branch-catalog-projection-v2.json`
- Independent verification: `api-rev-017/aggregate/branch-catalog-projection-verification-v2.json`
- Complete retained profile evidence: `api-rev-016/{english-darwin-arm64,chinese-darwin-arm64}/`
- Current checksum manifest: `api-rev-017/SHA256SUMS.txt`.

## Cleanup

- No provider, build, preflight, or qualification process was started in this aggregate-only round.
- No process or user data required cleanup.
- Retained API-owned profile/assets root remains intact for downstream integrated-state verification.
- Maintained-main, Catalog 3, tags, releases, publication, and remote bytes were untouched.

## Preliminary Classification

- `API-F-014` / `CR-F-034`: resolved `Local Fix` at the exact production aggregate boundary.
- New failure: none.
- Residual risks are explicitly deferred or Delivery-owned rather than blocking current API/E2E acceptance.

## Latest Authoritative Result

- Result: **`Pass`** for the approved exact two-entry darwin-arm64 current-platform scope.
- Runtime subjects: **Chinese 260/260 Pass; English 160/160 Pass** from immutable API-REV-016 evidence.
- Aggregate: **Qualification Set 2 Pass; Branch Catalog Projection 2 generated and independently verified Pass.**
- Final validation confidence: `99%`.
- Default `95%` clean-Pass target met: `Yes`.
- Applicable category below 90%: `No`.
- Broader validation: `Required / Executed / Pass`.
- Critical acceptance criteria lacking direct proof in current scope: none.
- Required next recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable`, then Delivery.
- Release status: not released; Delivery still owns maintained-main refresh/integrated qualification, documentation sync, Catalog 3, tag, publication, and published-byte equality.
