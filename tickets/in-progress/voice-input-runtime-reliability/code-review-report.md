# Code Review Report

## Review Round Meta

- Review Entry Point: `API/E2E Failure-Origin Review`
- Requirements Doc Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/requirements.md`
- Investigation Notes Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/investigation-notes.md`
- Design Spec Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-spec.md`
- Supplemental Task Artifacts Reviewed As Context: `benchmark-protocol.md`, `backend-selection-study.md`, `evidence/backend-selection/aggregate-results.json`, `evidence/backend-selection/SHA256SUMS.txt`, and `voice-runtime-contract.md`
- Solution Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/solution-revision-record.md`
- Relevant Solution Revision IDs: `SR-006`; `SR-003` remains withdrawn history
- Design Review Report Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/design-review-report.md`
- Architecture Review Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability/tickets/in-progress/voice-input-runtime-reliability/architecture-review-revision-record.md`
- Relevant Architecture Review Revision IDs: current `ARCH-REV-007 Pass`
- Implementation Handoff Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-handoff.md`
- Implementation Revision Record Reviewed As Context: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/implementation-revision-record.md`
- Relevant Implementation Revision IDs: `IR-005`
- Code Review Revision Record: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/code-review-revision-record.md`
- Current Code Review Revision ID: `CRR-006`
- Current Review Round: `6`
- Trigger: API/E2E round 1 stopped fail-closed at `API-VOICE-002` after direct validation of the checked-in final English corpus and baseline.
- Prior Review Round Reviewed: `CRR-005 Pass`
- Latest Authoritative Round: `CRR-006`
- Coverage Investigation Reviewed: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-coverage-investigation.md`
- Execution Coverage Report Reviewed: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-execution-coverage-report.md`
- API/E2E Revision Record Reviewed: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-revision-record.md`
- Relevant API/E2E Revision IDs: `API-REV-001`
- Delivery Revision Record / Relevant Delivery Revision IDs: `N/A`
- Failing Scenario IDs: `API-VOICE-002`; affected `AC-007`, `AC-009`, `AC-017`
- Exact Failing Commands / Execution Mode: direct Node import of `benchmark/corpus/validate-corpus.mjs` against the repository-owned English and Chinese qualification manifests paired with their exact preserved WAVs; repository checks and the 191-file selection-evidence checksum run passed first.
- Failure Evidence Paths: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/API-VOICE-002-corpus-identity-failure.json`; `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-input-runtime-reliability-runtime/tickets/in-progress/voice-input-runtime-reliability/api-e2e-evidence/repository/corpus-validation.log`

## Review Scope

- Changed implementation and behavior reviewed: no post-review source change. This round determines the origin of the `API-VOICE-002` prerequisite failure and whether it belongs to implementation, API/E2E, or the approved solution basis.
- Files / areas reviewed: affected requirements and benchmark contracts; the SR-006 qualification/evidence ownership; workflow-to-qualification path; `validate-corpus.mjs`; trusted-baseline validation; checked-in English/Chinese final corpus and baseline artifacts; focused API/E2E evidence; and the earlier `CR-F-010` resolution basis.
- Explicit exclusions: the full CRR-005 source audit and scorecard were not repeated. `API-VOICE-003`–`API-VOICE-012` remain `Not Tested`, not failed. No durable test code changed.

## Upstream Behavior And Production-Path Basis Confirmation

- Approved requirements basis understood: `AC-007` unambiguously requires every final profile corpus to reject duplicate IDs, resolved paths, and audio hashes before inference. `AC-009` requires English package comparison to a locked baseline on identical audio. `AC-017` prevents tag/publication until every advertised profile asset passes its qualification gates.
- Design-spec behavior map verified against the implementation: the qualification and evidence owners are present, but the approved solution package did not provide an evidence-authorized unique English final corpus and matching one-to-one baseline. It instead disclosed that the initial 50-row control has only 49 unique identities while requiring the final corpus to be unique.
- Design review report and round confirmed: `ARCH-REV-007 Pass`; the review confirmed the evidence and qualification structure but did not close this English evidence-authority contradiction.
- Behavior-basis status: `Contradicted`
- Changed or newly discovered behavior: none. API/E2E exposed a contradiction within already approved `BEH-005`/qualification evidence, not a new product behavior.
- Remaining material ambiguity: which unique English corpus and corresponding baseline are authoritative cannot be chosen from the current package without changing the approved non-regression evidence basis.

| Behavior ID | Current Status | Current Implementation Path And Lifecycle Evidence | Contradicting Or Newly Discovered Supported Behavior Evidence |
| --- | --- | --- | --- |
| `BEH-005` | Contradicted | Release prequalification matrix -> exact profile qualification -> `validateCorpus()` -> trusted corpus/baseline binding -> English inference/non-regression. | Requirements `AC-007`/`AC-009` and benchmark Corpus Contract require unique final audio. The checked-in final English corpus and baseline repeat the acknowledged initial-control identity. |
| `BEH-007` | Confirmed | Prequalification must complete before maintained-main tag/publication. | The fail-closed stop is correct; no release action is allowed after this prerequisite failure. |

## Failure Context And Origin Analysis

### Expected

- The final English corpus validates before provider inference with one unique ID, resolved path, and audio SHA-256 per sample.
- Its promoted baseline aligns one-to-one and in order with those unique samples so the English non-regression comparison uses identical audio.

### Observed

- `release/evidence/qualification-corpora/english-v1.json` has SHA-256 `30c4cc0c6d952de68e881b239e07fd47b80144e06f487bc964deb89e6144b46e`, 50 rows, and only 49 unique IDs, paths, and audio hashes.
- `fleurs-en-2009`, `audio/fleurs-en-2009.wav`, and SHA-256 `d6b0b81a9bebf170ea3443b629cf2fa5a38ffcd6cbb2cbc99c50506ef8dc6fe7` occur twice. The duplicate rows are visible at lines 350–359 of the checked-in manifest.
- `release/evidence/baselines/english-v1.json` has SHA-256 `4cda09c10fa50e22981397c1be80f072b450da2154a0f604db40c940249927d1` and repeats the same baseline result at lines 301–308, leaving 50 results but 49 unique identities.
- The Chinese final corpus is an independent control and passed with 200/200 unique identities. The full repository checks and all 191 promoted-study checksums also passed, so this is not a general harness, filesystem, or checksum failure.

### Smallest Relevant Execution Path

1. The supported prequalification operation dispatches the eight profile/target jobs in `.github/workflows/release-voice-runtime.yml`.
2. Each job invokes `benchmark/run-profile-qualification.mjs` with the external profile corpus and repository baseline.
3. The runner calls `validateCorpus()` at lines 49–50 before reading or executing a provider. The validator rejects duplicate ID/path/audio-hash identities at `benchmark/corpus/validate-corpus.mjs:21-34`.
4. A corrected external corpus cannot be substituted silently: `validateQualificationBaseline()` forwards its manifest digest to `assertTrustedBaseline()`, whose repository trust record pins the exact checked-in corpus and baseline digests and then requires one index-aligned result per clip.
5. Therefore the normal supported qualification path deterministically stops before English inference until the authoritative final corpus, baseline, and trust bindings are corrected together.

### Failure-Origin Decision

- Primary origin: `Design Impact`. SR-006 and its approved benchmark disclose the initial 50-row/49-unique English control and prohibit treating it as final authority, but do not supply or authorize a corrected unique English final corpus and matching non-regression baseline. The implementation then promoted the disclosed initial control into the final trust set. Selecting a replacement, dropping a row, or recomputing the baseline changes evidence authority and cannot be decided safely as an implementation or API/E2E local fix.
- Implementation mechanism: correct fail-closed behavior. `validateCorpus()` enforces the approved invariant before inference, and trusted-baseline binding prevents an unapproved external corpus substitution.
- API/E2E scenario/harness: valid. It reproduced the same pre-inference validator used by normal qualification, used exact manifests/audio, and supplied an independent passing Chinese control.
- Earlier review gap: yes. CRR-003's `CR-F-010` resolution verified digest/identity/derivation binding but did not run every repository-owned final qualification corpus through the production `validateCorpus()` boundary or compare unique cardinality with baseline cardinality. `loadTrustedBaseline()` can accept the duplicated English artifacts because its derivation maps/sets establish presence, not uniqueness. That source-review invariant should have been caught before CRR-005 advanced.

## Material Premise Validation

### `MP-CR-009` — Final-corpus validation is a reachable pre-inference release gate

- Origin: `New`
- Related approved requirement or established contract: `AC-007`, `AC-009`, `AC-017`; benchmark Corpus Contract and Controlled Selection Procedure.
- Relevant behavior ID(s): `BEH-005`, `BEH-007`
- Initiating basis kind: `Operational` and `Contract`
- Independent product-supported initiating trigger or applicable governing contract: a release operator runs the reviewed `prequalify` workflow for the mandatory eight-profile/target matrix; the release contract requires final-corpus uniqueness and exact English non-regression before tag/publication.
- Support evidence: `.github/workflows/release-voice-runtime.yml:107-125` is the repository-supported prequalification operation; requirements `AC-007`, `AC-009`, and `AC-017` govern its evidence and release consequence.
- Forward current or approved target production caller/event path that exercises the initiating basis and reaches the claimed state: prequalify workflow -> build exact profile archive -> `run-profile-qualification.mjs` -> `validateCorpus()` -> trusted baseline binding -> provider inference -> aggregate pre-tag evidence.
- Lifecycle preconditions and material consequence at the claimed point: an English matrix job has exact build inputs and final corpus/baseline inputs. Duplicate corpus identity causes a deterministic exception before inference, so the required matrix and release evidence cannot complete and tagging remains forbidden.
- Reachability: `Reachable`
- Review consequence / proportionate response: the failure drives `CR-F-015` and requires upstream evidence/design correction; it is not an unreachable synthetic edge case and must not be bypassed by weakening the validator.

## Findings

### `CR-F-015` — Final English corpus/baseline authority is internally invalid

- Severity: `High — release-blocking`
- Classification: `Design Impact`
- Affected behavior/contracts: `BEH-005`, `BEH-007`; `AC-007`, `AC-009`, `AC-017`; `MP-CR-009`.
- Evidence: the authoritative English corpus and baseline each contain 50 rows/results but only 49 unique identities and repeat `fleurs-en-2009`; direct production-validator execution fails before inference, while the 200-row Chinese corpus passes.
- Consequence: no English target can produce valid package qualification or non-regression evidence, so the required eight-package release matrix cannot complete.
- Required action: Solution Designer must define and record an evidence-authorized unique English final corpus and its matching one-to-one locked baseline, including updated digests, provenance/limitations, authority chain, and affected requirements/design/supplemental artifacts. The revised package must return through architecture review, implementation, source review, and API/E2E. Do not prescribe an ad hoc row removal/replacement or threshold change in this review.
- Durable prevention after the authority is corrected: add the proposed `API-VOICE-013` coverage that runs every checked-in final qualification corpus through `validateCorpus()` and verifies exact baseline alignment. Durable test work remains API/E2E-owned after the evidence fix; it does not replace upstream correction.

## Classification

- Classification: `Design Impact`
- Rationale: intended behavior is explicit, but the reviewed design/evidence package is incomplete and internally contradictory about the English final corpus/baseline authority. A local source or fixture edit would make an unapproved evidence decision.

## Recommended Recipient

- `solution_designer`
- Routing note: reopen the English qualification-evidence basis only; preserve the runtime-only scope, selected providers, thresholds, protocol, launcher/archive architecture, and fail-closed pre-tag ordering unless the corrected evidence itself proves another design impact. After solution and architecture approval, route the exact correction through implementation and source review before API/E2E resumes as `API-REV-002` with `API-VOICE-002` first.

## Residual Risks

- `API-VOICE-003`–`API-VOICE-012` remain unexecuted, not failed: all eight exact packages, target-native inference, M1 Max 30/30/100 timing/RSS/size, notices/licenses/privacy, actual Linux/Windows behavior, and release-evidence aggregation remain required after `CR-F-015` is corrected.
- Maintained-main integration, pre-tag integrated-state proof, tag/publication, and published-byte equality remain Delivery-owned.
- No durable coverage changed in API-REV-001. The future corpus/baseline regression test must be reviewed proportionately if added.

## Latest Authoritative Result

- Review Decision: `Fail`
- Review Entry Point: `API/E2E Failure-Origin Review`
- Material-Premise Gate: `Fail — MP-CR-009 is reachable and the required final English input violates it`
- Score Summary: `Not rescored for this focused failure-origin round. CRR-005's 9.4/10 source score remains historical and does not permit workflow advancement after the later acceptance failure.`
- Failure Origin: `Design Impact in the SR-006 English evidence-authority basis, materialized by promotion of the acknowledged duplicated initial control; with an earlier code-review detection gap in CR-F-010 verification.`
- Recommended Recipient: `solution_designer`
- Notes: `CR-F-015` is open. The validator and API/E2E failure are valid; do not relax uniqueness, choose/recompute evidence ad hoc, or resume package acceptance until the corrected authority passes solution/architecture/implementation/source review.
