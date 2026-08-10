# CRR-057 — Release Admission Policy Conflict

## Reviewed Subjects

- Focused source `F`: `b88c230663eb96e0def8c869b095ea858b0ff50b` (`API-REV-025`)
- IR-036 source `D`: `8111f3fe27f2d551676fd891f1f98ac2615da526`
- IR-036 reviewed artifact: `00afc77dcb892c91231baf06722fed50208b10e4`
- Policy: `contracts/release/relevant-source-closure-v2.json` at `D`
- Authority inputs: the exact five API-REV-025 focused production artifacts

## Direct Production-Shaped Result

The current `changedSourcePaths()` and `sourceClosureDecision()` owners were run against the real `F..D` range using the policy bytes committed at `D`.

Result for `D = 8111f3f...`:

- `213` changed paths total;
- `15` `release-pipeline-only` paths;
- `193` `documentation-record-only` paths;
- `5` `aggregate-api-renewal-required` paths;
- final decision: `api-impact-review-required`.

The five aggregate paths are:

1. `tests/release/release-admission-fixture.mjs`
2. `tests/release/catalog-v4.test.mjs`
3. `tests/release/host-construction-result.test.mjs`
4. `tests/release/host-release-contracts.test.mjs`
5. `tests/release/release-source-admission-verifier.test.mjs`

The same result holds when `D` is taken as reviewed artifact `00afc77...`; its extra handoff records are documentation-only and cannot change the strictest decision.

`assembleReleaseSourceAdmission()` was then exercised with the exact API-REV-025 Focused Qualification Set 3, Branch Projection 3, Projection Verification 3, both Execution Closure 2 files, and both retained Host Source Closure 1 identities. It wrote an Admission 4 candidate with:

```text
decision = api-impact-review-required
```

and threw:

```text
SOURCE_ADMISSION_BLOCKED
Release source admission blocked: api-impact-review-required
```

Therefore the approved next API/E2E operation cannot reach `promoteReleaseAuthority()` or create direct-child `R`.

## Why Existing Tests Miss It

`tests/release/release-admission-fixture.mjs` models the admitted delta, when present, as only:

```text
release/reviewed-controller.mjs
```

That path is `release-pipeline-only`, so the fixture proves the controller/verifier mechanics but not the real IR-036 `F..D` transition. The repository gates truthfully pass (`15/15` release-pipeline; `100/100` Node, `7/7` Python, all Go/source/evidence), yet the production-shaped Admission 4 assembly blocks.

## Governing Contract Conflict

SR-022 requires API/E2E to reuse the exact five byte-identical API-REV-025 authority files and create Admission 4 against reviewed `D`. The same approved package classifies `tests/release/**` as `aggregate-api-renewal-required`, while IR-036 necessarily changes five such files to implement the required new admission fixtures.

The implementation correctly enforces the policy; the design does not currently define a valid resolution between:

- preserving the exact five API-REV-025 bytes with `F = b88c230...`; and
- honoring the aggregate-impact result for the actual `F..D` range.

Changing `F` to `D` would require new authority bytes because every retained focused artifact binds source commit `b88c230...`, contradicting the exact-byte reuse instruction. Downgrading the five test paths would change the reviewed Relevant Source Closure policy decision. Either resolution therefore requires Solution Designer authority and architecture re-review rather than a speculative implementation override.
