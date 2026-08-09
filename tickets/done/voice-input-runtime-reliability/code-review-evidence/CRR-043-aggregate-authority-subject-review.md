# CRR-043 Aggregate Authority Subject Review Evidence

## Reviewed state

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Branch: `codex/voice-runtime-qualified-recovery`
- IR-028 source commit: `bbfa803f5b6126635c73e778fb81e0c6acb631f0`
- Implementation artifact HEAD: `0a5c7e72d61376bcdc84db8b71db7d067d240448`
- Comparison base: `95694f64d0d731d915f7b11688b2496b42927ef0`
- Reviewer-owned CRR-041/042 report/revision/evidence files were preserved and excluded from implementation scope.

## Change inspection

`95694f6..bbfa803` changes the Aggregate API Renewal authority verifier, candidate composition, and focused fixtures/tests. Production source now:

- Git-resolves the record at the exact `recordCommit` and canonical path;
- recomputes the record reference, including Git-blob-object SHA-256 and canonical parsed-content SHA-256;
- requires `recordCommit === preliminarySourceAdmission.acceptedAuthorityCommit` and promotion commit equality with the reviewed controller;
- requires the record commit's sole parent to be the reviewed test commit, source ancestry to the test commit, and record ancestry to promotion;
- Git-resolves and hashes the canonical coverage report and retained profile evidence;
- compares exact retained archives/profile evidence, current/prior QSet/projection/verification identities, and derived byte-comparison flags to independently verified candidate inputs;
- returns the verified reference, which candidate recomputation retains.

These changes resolve most of `CR-F-038`. `CR-F-035`–`CR-F-037` and the current `aggregate-api-renewal-required` transition remain unchanged and directly covered.

## Remaining subject-binding defect

`release/candidate-authority.mjs:227-246` proves only that `reviewedSourceCommit` is an ancestor of the direct-parent reviewed test commit. `release/candidate-authority.mjs:249-277` then treats any textual occurrence of `api.revision`, `reviewedSourceCommit`, and `reviewedTestCommit` anywhere in the complete historical Markdown coverage report as proof that those are the report's current declared subjects.

The canonical coverage report is intentionally historical and contains prior revisions and commits. An arbitrary substring occurrence therefore does not bind the record to the report's current revision or current reviewed source. This remains the same `CR-F-038` invariant: the singular verifier must independently bind the exact current API/source/test subjects, not merely accept a self-consistent record whose values occur somewhere in the report.

### Production-shaped Git probe

The reviewer created a disposable Git repository with this normal approved lineage:

```text
historical source -> current reviewed source -> current reviewed tests
  -> record commit -> reviewed promotion/controller commit
```

The canonical-path coverage report identified `API-REV-999` and the current source commit as current, while retaining `API-REV-998` and the historical source commit as history. The schema-valid renewal record deliberately selected the historical revision/source, while keeping the exact current test commit. All record/reference hashes, direct-parent/ancestry relationships, retained profiles, aggregate identities, admission, and promotion subjects were valid.

Exact reviewer command:

```text
node /tmp/crr043-stale-subject-probe.mjs
```

Observed result:

```json
{
  "outcome": "ACCEPTED",
  "currentRevision": "API-REV-999",
  "recordRevision": "API-REV-998",
  "currentSource": "0036fbc43e36275a88dac2d0fa65ee474578b470",
  "recordSource": "bc34a7cb7fa776aa38841bdaa337e153ba2e85a9",
  "reviewedTest": "64df923cc53d6ab711d1e8f4a0e1f1202cd1b20b",
  "recordCommit": "c98d54a459923e1a53b6df0d6360105b5ffb7872",
  "promotionCommit": "c324d58e9cefc4552e97ae7f0f247977a1b03159"
}
```

The disposable repository was removed. The probe reproduces an independently established operational contract rather than creating reachability: `AC-026` authorizes zero-profile API/E2E renewal, a committed record, later policy/controller acceptance, and hosted promotion. A stale subject accepted at this boundary can be promoted as the release authority.

## Verification execution

All declared implementation checks pass on the exact reviewed source:

- `/tmp/autobyteus-go1.26.5-ir027/go/bin/go version` -> `go1.26.5 darwin/arm64`.
- `node --test tests/release/qualified-release-candidate.test.mjs` -> `27/27` pass.
- `npm run check:release-pipeline` -> `45/45` pass.
- pinned-Go `npm run check` -> `155/155` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks pass.
- Prettier for all four changed source/test files -> pass.
- `git diff --check 95694f6..bbfa803` -> pass.

The passing suite does not contradict the finding. Its reviewed-source mutation fixture changes a source value while leaving a separate fixture lineage list fixed, so it rejects before exercising production's weaker ancestry-plus-substring rule. The temporary-Git positive test contains only one revision/source occurrence and therefore does not test historical-subject ambiguity.

## Source structure

Effective non-empty lines:

- `release/candidate-authority.mjs`: `401` — above the 220-line delta threshold but below the 500-line hard limit; focused review completed. Its candidate-authority concern remains coherent, though the exact subject parser/binding must be corrected within the same authority boundary.
- `release/qualified-release-candidate.mjs`: `486` — below the 500-line hard limit; focused review completed.

No new compatibility, fallback, mutable/latest lookup, extra candidate member, profile execution, or release action was added.

## Disposition

- `CR-F-038`: **Partially resolved, remains open — Local Fix**.
- Required bounded correction: within the one aggregate-authority verifier, derive or parse exact current coverage-report subjects (or consume another independently verified exact current subject authority) and require equality for the record API revision, reviewed source commit, and reviewed test commit. Do not use arbitrary substring occurrence, a second caller assertion/parser, mutable/latest lookup, or a schema/workflow/candidate-member expansion.
- API/E2E remains paused.
