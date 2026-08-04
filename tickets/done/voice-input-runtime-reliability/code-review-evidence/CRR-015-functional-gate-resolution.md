# CRR-015 Functional-Gate Resolution

- Reviewed source commit: `628bef9d9b1f40f263cb1f41e711649b8ca7dfe6`
- Trigger: `CRR-014` / `CR-F-021`

## Source trace

1. `writeProfileQualificationEvidence()` snapshots the completed attempt record without terminal mutation.
2. It recomputes the authoritative functional result from attempts, exact counts, quality/non-regression, RSS/size, lifecycle, offline, mutation, recovery, and timing observations.
3. It finalizes `qualification-attempts-v1.json` with that computed decision/category and uses the same pair in Qualification Summary 2.
4. `run-profile-qualification.mjs` records that evidence has been retained before invoking the passing-only boundary, so a non-pass result exits nonzero without entering the catch-path rewrite.
5. Qualification Set 2 accepts the consistent non-pass pair, writes the schema-valid aggregate, returns it, and its CLI-only passing assertion then exits nonzero.

## Reviewer evidence

- Focused affected repository set: `21/21` tests passed.
- The original CRR-014 production-owner probe was rerun against current source. It now returns Summary `fail / functional-gate-failed` and ledger `fail / functional-gate-failed`; Performance Assessment remains independently `controlled-pass` as designed.
- `git diff --check 0afc5904..628bef9` passed.
- The new two-profile regression proves consistent per-profile evidence, retained non-pass QSet, and passing-only assertion failures.

## Result

`CR-F-021` is resolved. No threshold, provider/model, performance classification, package/runtime/protocol path, matrix, or release order changed.
