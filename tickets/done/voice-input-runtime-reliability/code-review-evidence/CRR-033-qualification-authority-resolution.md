# CRR-033 Qualification Authority Resolution Evidence

## Reviewed State

- Source commit: `af008705488a029b95007e25c7c00484387d3ffe`
- Implementation artifact/current HEAD: `e01763aaebd7024e5c8ffa14fe878fed202f7b0e`
- Source basis: `bd957a0c8950b9e76abf55a823add698ad1d3c29`
- Authority: `SR-012`, `ARCH-REV-013 Pass`, `IR-022`
- Triggering findings: `CR-F-031` / `API-F-011`; `CR-F-032` / `API-F-012`

## Supported Production-Path Trace

The independent initiating action is the repository-supported release workflow `workflow_dispatch` operation `prequalify`. The reviewed forward path is:

1. load the exact current two-row release matrix;
2. materialize and validate the exact profile package/corpus/baseline inputs;
3. run the persistent packaged provider and retain raw reference/hypothesis plus process-tree RSS observations;
4. for Chinese, score raw text through `autobyteus-chinese-cer-selection-comparable-v1` rather than product `normalizedText`;
5. resolve the exact profile resource-policy row and apply its hard ceiling in Qualification Summary 2;
6. write Performance Assessment 1 with a forward digest edge to Summary and a non-gating optimization result;
7. independently recompute scoring/evidence/policy in Qualification Set 2;
8. allow Branch Catalog Projection 2 and release evidence/catalog only from a complete passing current-source set.

Reachability is `Reachable`. The path is supported by the checked-in workflow and contracts; it is not inferred from a test-only mechanism.

## Authority And Policy Checks

- Product Chinese output remains `autobyteus-simplified-zh-v1`.
- Qualification scoring consumes retained `rawReference` and `rawHypothesis` and performs NFKC, the frozen reviewed OpenCC selection-comparable map, lowercase, Han/ASCII-alphanumeric retention, and code-point edit distance.
- Active Chinese-v2 trust recomputes all `200/200` historical rows to `343/6580`.
- Retained API-REV-014 raw evidence re-scores to `342/6580`; it is design evidence, not a current-source qualification result.
- Runtime contract/map/corpus/baseline/trust/authority/validation/rescore/checksum bytes match the reviewed upstream Chinese-v2 package.
- Active Chinese-v1 corpus/baseline paths are absent and no fallback/alias is accepted.
- Resource policy closes exactly over the current ordered matrix:
  - English/darwin-arm64: hard `2684354560`, optimization `2684354560` bytes.
  - Chinese/darwin-arm64: hard `4294967296`, optimization `2684354560` bytes.
- No global RSS default remains. Summary owns the hard functional result; Assessment owns only the optimization result; QSet revalidates exact row and policy digest.

## Reviewer Execution

- Focused scoring/policy/trust/retention suite: `29/29` pass.
- Full pinned-Go `npm run check`: `95/95` Node TAP; `7/7` Python plus compileall; all Go/source/schema/evidence checks; exact English-v2 and Chinese-v2 verification pass.
- Repository JSON parse sweep: `347/347` pass.
- Focused Prettier and `git diff --check bd957a0c8950b9e76abf55a823add698ad1d3c29..af008705488a029b95007e25c7c00484387d3ffe`: pass.

## Source-Structure Audit

- No changed implementation source exceeds `500` effective non-empty lines.
- No changed implementation source adds more than `220` effective non-empty lines.
- Largest changed owners:
  - `benchmark/run-profile-qualification.mjs`: `499`, delta `0`.
  - `release/evidence/qualification-set.mjs`: `478`, delta `+27`.
  - `benchmark/baseline/trusted-baseline.mjs`: `409`, delta `+208`.
  - `evidence/chinese-qualification-v2/derive_chinese_qualification_v2.mjs`: `213`, delta `+213`.
- Each remains cohesive in its existing runner, aggregate-verifier, trust, or evidence-derivation ownership boundary.

## Review Result

- `CR-F-031`: resolved in source by one comparable scoring authority and active trust/reverification.
- `CR-F-032`: resolved in source by the exact reviewed profile policy and hard-vs-optimization separation.
- New findings: none.
- Result: `Pass`.
- Required downstream proof: rebuild and fully qualify both current-source profiles before Qualification Set 2, Branch Catalog Projection 2, tag, or publication.
