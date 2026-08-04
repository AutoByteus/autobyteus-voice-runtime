# CRR-036 API-F-014 Failure-Origin Evidence

## Review Identity

- Entry point: `API/E2E Failure-Origin Review`
- Trigger: `API-REV-016`, `API-F-014`, `API-VOICE-012`
- Reviewed product/source and runner commit: `32829080938911f0f46390a3fd2af823e105bd32`
- API/E2E artifact commit: `34c45617284de7890fd7a398fb3c13d215bdb08c`
- Affected criteria: `AC-006`, `AC-019`, `AC-021`, `AC-023`

## Product Reachability

The supported operational trigger is the checked-in `workflow_dispatch` `prequalify` operation. Its normal forward path is exact matrix checkout -> both profile builds/qualifications -> Qualification Summary 2 and Performance Assessment 1 -> `release/evidence/qualification-set.mjs` -> `verifyProfileQualificationEvidence()` -> `verifyBuildBinding()` -> Qualification Set 2 -> Branch Catalog Projection 2. The aggregate verifier is therefore reached by normal approved execution after both profiles complete; the failing verifier does not establish its own reachability.

## Direct Cause

- Canonical Build Input Path 1 is owned by `build/build-input-path-policy.mjs`. It permits the authenticated ASCII segment syntax required by the locked Chinese source, including `()`, `[]`, and `+`, while preserving containment, normalization, byte-length, reserved-name, duplicate, and case-collision rejection.
- `release/evidence/bindings.mjs:131-142` independently applies the obsolete `/^[A-Za-z0-9._/-]+$/` predicate instead of using that owner.
- The exact checksum-bound Chinese manifest contains 3,152 files. The canonical owner accepts all 3,152; the obsolete predicate rejects exactly ten authenticated routes.
- These same routes passed materialization, package assembly, mandatory package verification, two byte-identical builds, and complete runtime qualification.
- The QSet verifier consequently converts only the Chinese profile to `fail / qualification-verification-failed`, writes a truthful failing QSet, exits nonzero, and blocks Branch Projection 2.

## Independent Reviewer Checks

- `api-rev-016/SHA256SUMS.txt`: all listed evidence files pass SHA-256 verification.
- Direct path probe: canonical `assertBuildInputPathSet()` accepts all 3,152 records; the obsolete predicate rejects exactly the ten routes recorded by API-F-014.
- A temporary exact-source checkout changed only the QSet binding to import the canonical path-set owner. Against the retained unmodified API-REV-016 qualifications/assets:
  - English independent profile verification: Pass.
  - Chinese independent profile verification: Pass.
  - Qualification Set 2 assembly: Pass with both profile decisions Pass.
  - The probe retained `sourceCommit` and `runnerCommit` as `328290809...` and used a distinct probe `testCommit`, confirming the schema/assembler supports honest separation of package/runner evidence from later verifier code.
- Probe output: `/private/tmp/crr036-qset-probe-result.json`; temporary checkout: `/private/tmp/crr036-qset-probe.q5xD6z`.

## Classification And Review-Gap Disposition

- Classification: `Local Fix` owned by `implementation_engineer`.
- Required source correction: make the aggregate/profile verifier consume the canonical Build Input Path 1 owner and add a production-shaped exact regression for the ten retained routes. Do not add another regex or rename, omit, project, or mutate input paths.
- Prior source-review gap: `Yes`. CRR-035 performed a full review, explicitly reviewed the QSet evidence chain and changed `release/evidence/bindings.mjs`, and marked capability reuse, repeated-policy ownership, duplication, and API/E2E readiness as Pass. The duplicate obsolete policy was present and contradicted the already-approved canonical owner; it should have been caught. This does not reopen the valid package/runtime correction.

## Profile-Evidence Reuse Disposition

The exact API-REV-016 profile evidence may be reused for an aggregate-only recheck, but only under the existing three-commit authority and these conditions:

1. implementation rework is confined to the QSet/profile-verifier and its durable regression coverage;
2. package, builder, runner, matrix, schemas/contracts, scoring, policy, provider/runtime, source-bound inputs, profile artifacts, archives, and every profile-relevant byte remain unchanged and are verified byte-for-byte;
3. the passing API-REV-016 profile/asset evidence remains immutable and checksum-valid;
4. the next QSet records `sourceCommit` and `runnerCommit` as `32829080938911f0f46390a3fd2af823e105bd32` and records the reviewed correction commit as `testCommit`; it must not relabel the old package/profile evidence as produced by the new commit;
5. API/E2E reruns the corrected independent verification, regenerates QSet 2, then produces and independently verifies Branch Catalog Projection 2.

If any profile-relevant source, contract, authority, runner, artifact, or asset byte changes, this bounded reuse decision no longer applies and the affected profile work must rerun.

## Conclusion

`API-F-014` is a reachable, deterministic aggregate-verifier implementation defect. Both profile qualifications remain direct passing behavior evidence, `API-F-013` is resolved, and an aggregate-only recheck is valid under the explicit identity and unchanged-byte constraints above.
