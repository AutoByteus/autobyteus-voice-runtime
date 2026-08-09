# CRR-042 Qualified Recovery Rework Review Evidence

## Reviewed state

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Branch: `codex/voice-runtime-qualified-recovery`
- Prior reviewed artifact: `2a5cdeaccfc0017ebdd79f72a8a9e88536ec0a75`
- Rework source commits: `5cc258b62dc862af5f901313f9f5cd5bda91a957`, `95694f64d0d731d915f7b11688b2496b42927ef0`
- IR-027 artifact / reviewed HEAD before reviewer artifacts: `8c9c149980516bcc23a51e1e05c5bed792d02949`
- Review basis: `SR-018`, `ARCH-REV-019`, `IR-027`, `CRR-041`, `R-022`–`R-024`, `AC-025`–`AC-027`.

## Prior finding recheck

### CR-F-035 — Resolved in source

- `release/source-closure.mjs` now owns one complete Preliminary Source Admission: accepted ancestry, complete canonical A/M/D/R rows including both rename paths, strict category, changed-list digest, accepted/reviewed Profile and Qualification Authority snapshots, equality flags, and one four-way decision.
- `release/recover-qualified-voice-archives.mjs` evaluates it before qualified-source checkout verification, runner/network preparation, and any materialization/package build. A non-`reuse-permitted` decision finalizes zero-attempt blocked evidence and terminates.
- Candidate promotion binds the exact recovery-run JSON Pointer/object digest and independently recomputes the full admission through `verifyCandidateAdmission()`.
- Current source truthfully remains `aggregate-api-renewal-required`; there is no closure-equality shortcut or override.

### CR-F-036 — Resolved in source/tests

- `tests/release/relevant-source-closure.test.mjs` separates frozen-base reproduction from the current transition assertion.
- Focused command `npm run check:release-pipeline`: **Pass**, 31/31 tests.
- Full command `PATH=/tmp/autobyteus-go1.26.5-ir027/go/bin:$PATH VOICE_GO=/tmp/autobyteus-go1.26.5-ir027/go/bin/go npm run check`: **Pass**, 7/7 Python plus compileall, all Go/source/evidence checks, and 141/141 Node TAP tests.
- Logs were retained for this review session at `/tmp/crr-042-check-release-pipeline.log` and `/tmp/crr-042-npm-check.log`.

### CR-F-037 — Resolved in source

- `release/recovery-outcomes.mjs` defines ordered `succeeded`, `failed`, and `unattempted` variants and derives planned/attempted/completed/succeeded/failed/unattempted counts.
- `release/recovery-build.mjs` stops sequential work after a failed profile and makes the later row explicitly `prior-profile-failed`/unattempted.
- `release/recovery-result.mjs` derives the outer decision and counters, writes each raw profile as a deep projection of its Result row, and retains the one-way raw -> manifest -> Result order.
- Candidate verification requires two exact succeeded rows and rejects partial/non-Pass evidence.
- Focused pre-build, first-profile, exact-mismatch, arithmetic, projection, and candidate tests pass.

## New aggregate-authority binding probe

### Governing production path

`AC-026` and the SR-018 release authority require API/E2E to produce Aggregate API Renewal Record 1, commit it, and later let hosted promotion Git-resolve and independently verify its tested/approval commits, API evidence, unchanged profile authority, retained archive/profile evidence, current/prior aggregate evidence, and proposed Qualification Authority before candidate promotion.

The supported operational trace is:

`API/E2E aggregate-only renewal -> committed renewal record -> hosted promotion workflow -> aggregateAuthorityReference() -> verifyAggregateAuthority() -> candidate decision promoted`.

### Source trace

- `.github/workflows/promote-qualified-voice-candidate.yml:67-85` loads the record and creates the candidate reference directly from that same record.
- `release/candidate-authority.mjs:89-109` verifies record bytes/schema but cross-checks only repository/version, record-derived API revision/decision/tested commit, zero profile count, Qualification Authority, and Profile Closure.
- It does not require `reference.recordCommit === admission.acceptedAuthorityCommit`, bind `reviewedSourceCommit`/`reviewedTestCommit` to the reviewed promotion/API subjects, Git-resolve and hash the coverage report, or compare `retainedProfiles` and `aggregateEvidence` to the exact candidate archives/profile evidence/QSet/projection/verification.
- `release/qualified-release-candidate.mjs` calls the verifier but does not use its returned record to bind those candidate inputs.

### Reproduction

A production-shaped candidate fixture was changed only within schema-valid renewal-record fields. The reference and its byte/content digests were recomputed exactly as the hosted workflow does. Mutations included unrelated reviewed source/test commits, unrelated coverage-report digests, changed retained archive/profile-evidence digests, and changed current QSet/projection/verification digests.

Observed output:

```json
{
  "accepted": true,
  "manifestDecision": "promoted",
  "aggregateTestedCommit": "cccccccccccccccccccccccccccccccccccccccc",
  "promotionCommit": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "admissionReviewedControllerCommit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

The fixture is only a reproduction of the independently established `AC-026` operational path; the governing contract and hosted workflow establish reachability. The result demonstrates `CR-F-038`: a schema-valid but semantically unrelated renewal record can pass the current candidate authority verifier and produce `decision: promoted`.

## Structural and hygiene evidence

- `git diff --check b238f967cfee8be445808ac9499a91533bb7d58e..95694f64d0d731d915f7b11688b2496b42927ef0`: Pass.
- Authored-file Prettier check: Pass.
- `release/recover-qualified-voice-archives.mjs` is `100755`; workflow files remain ordinary `100644` files.
- Changed implementation effective non-empty lines: `qualified-release-candidate.mjs` 473; `recover-qualified-voice-archives.mjs` 384; `recovery-build.mjs` 379; `source-closure.mjs` 376; all other changed implementation files are at or below 217. No changed implementation source exceeds the 500-line hard limit.
- The exact eight raw members, raw -> manifest -> Result order, exact 19 candidate members, API-REV-017 archive/profile authority, no-retest boundary, managed recovery boundary, hosted promotion, and hosted Delivery boundary remain unchanged.
