# API/E2E Execution Coverage Report

## Execution Round Meta

- Requirements/design basis: original `requirements.md`, `investigation-notes.md`, `design-spec.md`, `benchmark-protocol.md`, current-platform/voice-runtime contracts, and accepted correction studies in `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/`.
- Current worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix`.
- Current ticket artifacts: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/`.
- Upstream revisions: `SR-013`, `SR-014`, `ARCH-REV-015`, `API-REV-017`, `DR-003`, `IR-025`, `CRR-038`, `CRR-039`.
- Preserved finalized release-candidate merge: `a890d22031359f53d94c7c67bf183344fb35d904`.
- Current origin/main base at implementation start: `5531e83421dce859f9934c16e006c34cf5291cde`.
- Correction commit: `f5c14ed9e9ad835e33eec20033f625d61d1e0173`.
- Implementation artifact/current tested HEAD: `b19f51f8e2ee2ca7ae659edf2c451a02b9a3ac4e`.
- Triggering Delivery result: `DR-003`, prequalification run `30881048872`.
- Coverage Investigation: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`.
- API/E2E Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-revision-record.md`.
- Current revision / round: `API-REV-018 / 18`.
- Prior authoritative API/E2E result: `API-REV-017 — Pass / 99%`.
- Latest authoritative result: **`API-REV-018 — Pass / 99%` for the post-archive archived-checkout source/test gate.**

## Investigation And Execution Basis

- Coverage investigation refreshed before execution: `Yes`.
- Plan followed: clean archived-ticket checkout -> correction scope/layout/stale-reference proof -> immutable fixture identity/semantics -> exact closed-toolchain verification -> focused two-file tests -> full repository check -> retained-history checksum and clean-source validation -> owned checkout cleanup.
- Material deviation: `None`.
- Existing coverage decision: API-REV-016/017 package/profile/QSet/projection evidence remains valid because no product or authority-relevant byte changed.
- Package/profile requalification: `Not Required` by direct impact evidence and `CRR-039` scope.
- Repository-resident durable API/E2E coverage changed: `No`.
- Reroute required during execution: `No`.

## Compatibility / Legacy Scope Check

- Former `tickets/in-progress/...` fixture behavior retained through fallback: `No`.
- Lifecycle probing, copied fixture, duplicate authority, or dual-path read added: `No`.
- Approved persisted-data decision: `Not Affected`.
- User/shared state changed: `No`.
- Compatibility-only API/E2E coverage added: `No`.

## Changed Boundary And Evidence Matrix

| Scenario / Boundary               | Basis                          | Execution Surface                                                      | Result                                                 | Evidence                              |
| --------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `API-VOICE-014` archived checkout | `DR-003`, `BEH-004`, `BEH-010` | clean detached checkout at `b19f51f...`, ticket only in `tickets/done` | Pass                                                   | layout/scope log                      |
| exact correction scope            | `IR-025`, `CRR-039`            | commit and diff inspection                                             | Pass; two literals, 2 insertions/2 deletions           | layout/scope log                      |
| API-REV-016 manifest fixture      | Build Input Path regression    | final archived path, SHA-256, record count, focused test               | Pass; `f7bfb8f...2478`, 3,152 records                  | fixture log; focused log              |
| API-REV-014 raw-results fixture   | Chinese comparable re-score    | final archived path, SHA-256, result count, focused test               | Pass; `5e128114...20f`, 200 results, 342/6580 re-score | fixture log; focused log              |
| source/closed-toolchain gate      | failed remote workflow step    | exact Node/Go/CMake plus `npm ci` and full `npm run check`             | Pass                                                   | toolchain/npm/full logs               |
| historical run integrity          | `DR-003`                       | retained checksum manifest                                             | Pass; remains truthful Fail                            | DR-003 checksum log                   |
| prior API acceptance continuity   | `API-REV-017`                  | retained checksum manifest and relevant-byte analysis                  | Pass / reusable                                        | API-REV-017 checksum log; impact JSON |

## Repository Coverage Execution

| Command / Action                                                                                               | Result                                                                                | Evidence                                                   |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| assert clean checkout `b19f51f...`, `tickets/done` present, former ticket path absent, no stale test reference | Pass                                                                                  | `repository/archived-layout-scope-and-stale-reference.log` |
| inspect `f5c14ed...` and compare finalized candidate/current artifact relevant paths                           | Pass; only two test literals, no product/workflow/contract or later non-ticket change | same log                                                   |
| `shasum -a 256` plus semantic record counts for both archived fixtures                                         | Pass                                                                                  | `repository/archived-fixture-identities.log`               |
| Node `v22.23.1`, verified complete Go `1.26.5 darwin/arm64`, CMake `4.3.3`                                     | Pass                                                                                  | `repository/closed-toolchain-verification.log`             |
| `npm ci --ignore-scripts`                                                                                      | Pass                                                                                  | `repository/npm-ci.log`                                    |
| `node --test tests/release/build-input-path-contract.test.mjs tests/scoring/chinese-qualification.test.mjs`    | Pass, 9/9; zero fail/skip                                                             | `repository/focused-archived-fixture-tests.log`            |
| `PATH=<pinned-go> VOICE_GO=<pinned-go> npm run check`                                                          | Pass: 111/111 Node TAP, 7/7 Python plus compileall, all Go/source/schema/evidence     | `repository/npm-run-check.log`                             |
| DR-003 and API-REV-017 checksum manifests                                                                      | Pass                                                                                  | retained checksum logs                                     |
| post-execution HEAD/status/diff check                                                                          | Pass; clean exact checkout                                                            | `repository/post-execution-source-integrity.log`           |

## Validation Confidence Scorecard

| Category                                            | Post-Repository | Final | Evidence / Limitation                                                                |
| --------------------------------------------------- | --------------: | ----: | ------------------------------------------------------------------------------------ |
| Requirement and acceptance-criteria proof           |             99% |   99% | exact post-archive gate passes; prior product qualification remains immutable        |
| Changed-boundary execution directness               |            100% |  100% | both corrected tests execute from final archived layout                              |
| Cross-boundary integration realism and mock gap     |             99% |   99% | clean checkout and full source/test chain; remote retry intentionally Delivery-owned |
| Environment/configuration/identity/fixture fidelity |            100% |  100% | exact commits, directory topology, toolchain, fixture hashes/counts                  |
| Failure/edge/lifecycle/recovery evidence            |             99% |   99% | historical Fail preserved, corrected local lifecycle passes without fallback         |
| User/browser/desktop                                |             N/A |   N/A | no runtime/UI change or claim                                                        |
| Durable regression quality                          |            100% |  100% | direct 9/9 plus full 111/111; digest and semantic assertions unchanged               |

- Overall post-repository confidence: `99%`.
- Overall final confidence: `99%`.
- Every critical criterion in the bounded correction scope directly proven: `Yes`.
- Any applicable category below 90%: `No`.
- Default clean-Pass target met: `Yes`.

## Broader Validation Decision And Execution

- Decision: **`Not Required` beyond the directly executed archived-checkout source/test gate.**
- Rationale: run `30881048872` failed before preflight/build/profile qualification. The correction has no relevant production, workflow, contract, authority, archive, profile, QSet, or projection byte change. Rebuilding/requalifying would not exercise the changed boundary more directly.
- Remote prequalification dispatch: not performed; Delivery-owned.
- Package/profile execution: not repeated; immutable API-REV-016/017 evidence remains authoritative.
- Browser/desktop execution: `N/A`.

## Platform / Runtime And Desktop Decision

- Validation host: macOS arm64, Node 22.23.1, exact verified Go 1.26.5 darwin/arm64, CMake 4.3.3.
- Product runtime/package behavior: unchanged and therefore not rerun.
- Preserved performance classification: `loaded-host-observation`, not controlled certification.
- Deferred scope remains darwin-x64, Linux, Windows, `auto`, and desktop integration.

## Lifecycle / Persisted Data

- Ticket archival lifecycle: directly exercised from a checkout with only `tickets/done/voice-input-runtime-reliability`.
- Former in-progress fixture location: absent and not referenced under `tests/`.
- Persisted/user/runtime data: not affected.
- Historical workflow run `30881048872`: unchanged truthful Fail.
- No tag, release, asset, publication, or remote run was created or altered.

## Durable Coverage Changed

- Repository-resident durable coverage added, updated, or removed by API/E2E: `No`.
- Paths added/updated/removed by API/E2E: none.
- IR-025 source-owned test paths under review: `tests/release/build-input-path-contract.test.mjs`, `tests/scoring/chinese-qualification.test.mjs`.
- Requested proportional API/E2E test-code review: `Not Applicable` because API/E2E changed no durable test code; CRR-039 already reviewed IR-025 source/test changes.

## Evidence

- Current evidence root: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-postarchive-fix/tickets/done/voice-input-runtime-reliability/api-e2e-evidence/api-rev-018/`.
- Authoritative result/impact: `repository/API-VOICE-014-post-archive-impact-and-result.json`.
- Archived layout/scope: `repository/archived-layout-scope-and-stale-reference.log`.
- Fixture identities: `repository/archived-fixture-identities.log`.
- Focused/full tests: `repository/focused-archived-fixture-tests.log`, `repository/npm-run-check.log`.
- Historical/current checksum continuity: `repository/dr-003-retained-failure-checksums.log`, `repository/api-rev-017-retained-checksums.log`.
- Evidence checksum manifest: `SHA256SUMS.txt`.

## Cleanup

- Owned clean checkout `/private/tmp/autobyteus-voice-api-e2e-r18-20260804/repository`: removed with `git worktree remove`; its ignored `node_modules` was removed with it.
- Provider/build/preflight/qualification processes started: none.
- User/shared state touched: none.
- Remote workflow/tag/release/publication actions: none.

## Preliminary Classification

- `DR-003` stale durable-test path: resolved `Local Fix` at the exact archived-checkout source/test boundary.
- New API/E2E failure: none.

## Latest Authoritative Result

- Result: **`Pass`** for IR-025's applicable post-archive source/test validation.
- Prior current-platform product acceptance: **remains `Pass / 99%`** and reusable.
- Final validation confidence: `99%`.
- Default `95%` clean-Pass target met: `Yes`.
- Applicable category below 90%: `No`.
- Broader validation: `Not Required` beyond executed source/test gate.
- Required next recipient: `code_reviewer` for proportional test-code review recorded as `Not Applicable`, then Delivery.
- Release status: still blocked/unpublished historically; Delivery owns new remote prequalification, tag, release, publication, and published-byte verification.
