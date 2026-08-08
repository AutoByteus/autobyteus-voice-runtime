# CRR-044 Aggregate Current-Subject Resolution Evidence

## Reviewed state

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Branch: `codex/voice-runtime-qualified-recovery`
- IR-029 source commit: `50b7e778c5c8b783f3089803b71636ea7fb2a513`
- Implementation artifact HEAD: `850dd5f8d34996793f5a27672933684e508c8429`
- Comparison base: `bbfa803f5b6126635c73e778fb81e0c6acb631f0`
- Reviewer-owned CRR-041 through CRR-043 artifacts remained uncommitted and untouched by Implementation.

## CR-F-038 resolution

`release/candidate-authority.mjs` retains the IR-028 record/admission/controller, commit-lineage, report-identity, retained-profile, current/prior aggregate, and candidate-reference bindings. IR-029 replaces only the weak historical whole-report text search.

The singular verifier now:

1. authenticates the exact canonical archived coverage-report bytes by Git-blob-object and content SHA-256;
2. requires exactly one `## Aggregate API Renewal Current Subjects` heading;
3. limits the projection to the section before the next Markdown heading;
4. requires exactly three ordered nonblank rows with exact field syntax for API revision, reviewed source commit, and reviewed test commit;
5. rejects zero/malformed commits, missing/extra/reordered rows, duplicate/missing headings, and whitespace/content drift;
6. compares the parsed object structurally with the renewal record's exact three subjects.

Historical API revisions and source/test commits elsewhere in the same authenticated report cannot satisfy the current projection.

## Production-shaped regression and reviewer probe

The updated temporary-Git fixture has a normal supported lineage:

```text
historical source -> current reviewed source -> reviewed tests
  -> record commit -> reviewed promotion/controller commit
```

Its authenticated coverage report contains both a unique current subject section and a separate historical section. The passing case uses the current API/source/test values. The negative preserves valid record/report hashes, source ancestry, direct record parent, record-to-promotion ancestry, profile evidence, aggregate identities, admission, and promotion subjects while selecting the historical API/source in the record. Verification rejects it specifically with `Aggregate API coverage report subject is invalid.`

The independent CRR-043 disposable probe was rerun unchanged against IR-029:

```text
node /tmp/crr043-stale-subject-probe.mjs
```

Observed:

```json
{
  "outcome": "REJECTED: Aggregate API coverage report subject is invalid.",
  "currentRevision": "API-REV-999",
  "recordRevision": "API-REV-998"
}
```

That older probe lacks the new unique current projection, so fail-closed rejection is also correct. The checked-in production-shaped test directly proves the more important case where the valid current projection and historical occurrences coexist.

## Verification execution

- Exact Go: `/tmp/autobyteus-go1.26.5-ir027/go/bin/go version` -> `go1.26.5 darwin/arm64`.
- `node --test tests/release/qualified-release-candidate.test.mjs` -> `28/28` pass.
- `npm run check:release-pipeline` -> `46/46` pass.
- Pinned-Go `npm run check` -> `156/156` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks pass.
- Prettier on the changed production/test files -> pass.
- `git diff --check bbfa803..50b7e77` -> pass.
- Reviewer-owned artifact-only worktree changes remained the only uncommitted state.

## Source structure

- `release/candidate-authority.mjs`: `439` effective non-empty lines. The `>220` delta threshold receives focused review; it remains below the `500` hard limit. The file coherently owns candidate admission and aggregate authority verification, and IR-029 adds a bounded internal projection parser rather than a second authority owner.
- `release/qualified-release-candidate.mjs`: `486` effective non-empty lines, unchanged by IR-029 and below the hard limit. Candidate assembly continues to consume only the verified reference returned by the authority owner.
- Tests/fixtures are exempt from implementation-source limits and remain organized around one candidate-authority surface.

## Preserved boundaries

- Current source remains `aggregate-api-renewal-required`.
- No second parser/caller assertion, mutable/latest lookup, override, fallback, schema/workflow expansion, candidate member, profile execution, recovery, promotion, release, or publication path was added.
- `CR-F-035`–`CR-F-037` remain resolved.
- Runtime/provider/model/profile/package authority remains unchanged.

## Disposition

- `CR-F-038`: **Resolved**.
- Source review result: **Pass**.
- Authorized next stage: API/E2E performs only focused zero-profile Aggregate API Renewal, creates/commits the exact current-subject report and Aggregate API Renewal Record, and records the result. No archive recovery or provider/profile qualification is authorized yet. A later separately reviewed policy/controller commit is still required before `reuse-permitted` recovery.
