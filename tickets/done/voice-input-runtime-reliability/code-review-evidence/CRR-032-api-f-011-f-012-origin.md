# CRR-032 — API-F-011 / API-F-012 Failure-Origin Evidence

## Review Subject

- API/E2E revision: `API-REV-014`
- Reviewed source: `57efa584b34f2b9a5eaba012c01f7e05228dffed`
- API/E2E artifact commit: `bd957a0c8950b9e76abf55a823add698ad1d3c29`
- Scenarios: `API-VOICE-004`, `API-VOICE-011`
- Findings: `API-F-011`, `API-F-012`
- Reviewer evidence integrity: `api-rev-014/SHA256SUMS.txt` passed `shasum -a 256 -c` for all `50/50` listed retained files.

The API/E2E result is a real failure under the current approved contract even though the packaged Chinese runtime is functionally successful. Two byte-identical packages were built and verified; `260/260` required attempts succeeded; all 200 quality clips returned transcripts; hard deadlines, conformance, recovery, relocation, offline/no-mutation, compliance/privacy, and extracted size passed.

## MP-CR-025 — Mandatory Chinese non-regression reaches incomparable scoring authorities

- Related requirements/contracts: `AC-007`, `AC-008`, `AC-009`, `AC-017`, `AC-023`; `voice-runtime-contract.md` requires scoring and runtime output to use the same canonical rules.
- Relevant behaviors: `BEH-005`, `BEH-006`, `BEH-007`.
- Initiating basis: `Operational`.
- Independent supported trigger: `.github/workflows/release-voice-runtime.yml` exposes `workflow_dispatch` with `operation=prequalify` for the exact current matrix.
- Forward production path: `prequalify` -> current `chinese/darwin-arm64` matrix entry -> Functional Preflight 2 -> closed-input double package construction -> packaged provider qualification -> 200 persistent quality requests -> `benchmark/scoring/error-rate.mjs` / `benchmark/scoring/normalization.mjs` -> promoted baseline comparison -> Qualification Summary 2 -> fail-closed aggregate exclusion.
- Reachability: `Reachable`.
- Consequence: the mandatory non-regression decision compares values produced by different scoring contracts, so the result cannot establish provider regression or preservation.

### Direct facts

1. Current packaged execution scores CER through `benchmark/scoring/normalization.mjs:119-145`: NFKC, production `twp-to-cn`, approved output punctuation/spacing normalization, then CER removes whitespace and only `，。！？,.!?`.
2. The promoted Chinese quality was produced by `evidence/selection-study/harness/analyze_results.py:24-26`: NFKC, OpenCC `t2s`, then retention only of Han characters and ASCII alphanumerics.
3. `benchmark/baseline/trusted-baseline.mjs:128-165` verifies that stored per-clip counts derive from the promoted quality artifact, but neither recomputes those counts with the current canonical scorer nor binds a scoring-contract identity/digest. The Chinese baseline and trusted-catalog rows contain no normalization/scoring-contract field.
4. API-REV-014 measured current CER `418/6586 = 6.346796%` and promoted baseline `343/6580 = 5.212766%`. The absolute 7% gate passes, while the opaque cross-contract difference is `+1.134030` points and fails the `+0.5` gate.
5. The focused retained analysis proves `196/200` raw transcripts are byte-identical to the promoted results. Those identical transcripts change from `334` to `410` errors solely under the different scorer; the four changed transcripts improve from `9` to `8` errors.

### Origin decision

- Reviewer finding: `CR-F-031`.
- Classification: `Design Impact`.
- Why not a bounded Local Fix: changing only the scorer, only the trusted baseline, or only the locked `5.213%` comparison would choose new product/evidence authority that the reviewed solution does not define. The solution must decide one canonical symmetric scoring contract and its deterministic baseline derivation/identity, preserve the old selection evidence as immutable history, and then update all affected requirements, supplemental contracts, evidence authority, schemas/verifiers, and implementation consistently.
- Source-review gap: `Yes`. The static trust path's missing scorer identity/recomputation contradicted the explicit same-canonical-scoring invariant and should have prevented the prior source Pass. That gap does not make an arbitrary source-only rewrite safe.

## MP-CR-026 — Required persistent Chinese lifecycle reaches the blocking RSS gate

- Related requirements/contracts: `R-010`, `R-020`, `AC-003`, `AC-017`, `AC-023`.
- Relevant behaviors: `BEH-004`, `BEH-005`, `BEH-007`, `BEH-008`.
- Initiating basis: `Operational`.
- Independent supported trigger: the same `workflow_dispatch operation=prequalify` current-matrix route.
- Forward production path: `prequalify` -> current Chinese package -> public launcher -> contained native worker -> one persistent `FunAsrEngine`/model instance -> 30 cold + 30 warm-preparation + 200 warm/quality attempts -> 10 ms provider-process-tree RSS sampling -> Qualification Summary 2 -> blocking `<=2.5 GiB` decision -> fail-closed aggregate exclusion.
- Reachability: `Reachable`.
- Consequence: the exact required persistent process peaks above the approved gate and therefore cannot enter Qualification Set 2 under the current contract.

### Direct facts

1. `benchmark/rss-sampler.mjs:4-32` computes provider-process-tree RSS from the launched provider PID and descendants; `run-profile-qualification.mjs:252-405` samples startup and every required transcription; `profile-qualification-evidence.mjs:275-289` applies the exact `2,684,354,560`-byte blocker.
2. API-REV-014 observed `3,949,543,424` bytes (`3.678 GiB`), `1,265,188,864` bytes over the gate, while all `260/260` attempts succeeded without timeout, failure, exclusion, or deadline violation on the actual 64-GiB M1 Max.
3. The selection basis cited approximately `2.08 GB` from first/isolated process-per-request Fun-ASR measurements. `backend-selection-study.md` explicitly said the persistent provider still had to be measured rather than inferred. The approved `2.5 GiB` gate therefore lacked direct evidence for the lifecycle it governs.
4. API-REV-014 does not provide a per-allocation or per-process decomposition that proves a bounded implementation defect. The current sampler and fail-closed gate operated as designed. A memory optimization may be possible, but that technical possibility is not evidence of its ownership, feasibility, or required product result.
5. The current API/E2E record states that the user accepts this observation on the 64-GiB host and prioritizes functionality. That is material product input but cannot silently override the still-binding `2.5 GiB` requirement.

### Origin decision

- Reviewer finding: `CR-F-032`.
- Classification: `Design Impact` with a required resource-policy decision.
- Why not a bounded Local Fix: available evidence does not isolate a source defect that can satisfy `2.5 GiB`, while the current user direction may instead change the accepted budget. The Solution Designer must decide, with persistent-lifecycle evidence, whether to retain the gate and require a designed memory reduction or revise the limit/acceptance role. Implementation must not infer that choice.
- Source-review gap: `No current-source defect should have been asserted from static review`. The material gap is upstream feasibility evidence: isolated one-shot RSS was used to support a persistent-process requirement even though the study itself said persistence required measurement. The real high-water behavior was reasonably established only by actual packaged execution.

## Routing Decision

- Overall classification: `Design Impact`.
- Owner: `solution_designer`.
- Required reset scope:
  1. establish one canonical Chinese scoring/baseline authority and deterministic comparable derivation;
  2. make an evidence-backed persistent RSS policy decision consistent with current user direction;
  3. update requirements, design, supplemental contracts, material-premise records, evidence transition/immutability rules, and implementation inventory;
  4. route through Architecture Review, Implementation, Code Review, and complete current-source API/E2E again.
- Prohibited shortcuts: ad hoc baseline/scorer rewrite, threshold relaxation, hidden RSS omission, transcript mutation, provider/model substitution, retry, or treating functional success as a current-contract Pass.
